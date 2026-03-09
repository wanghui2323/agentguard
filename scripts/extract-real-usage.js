#!/usr/bin/env node
/**
 * 从Claude Code的session日志中提取真实的token使用量
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

// 查找当前session的日志文件
function findSessionLog() {
  const projectDir = path.join(os.homedir(), '.claude', 'projects');

  // 从当前工作目录推断project路径
  const cwd = process.cwd();
  const projectPath = cwd.replace(/\//g, '-').replace(/^-/, '');
  const logPattern = path.join(projectDir, `-${projectPath}`);

  if (!fs.existsSync(logPattern)) {
    // 尝试查找所有项目目录
    const allProjects = fs.readdirSync(projectDir);
    const matches = allProjects.filter(p => p.includes('AI'));
    if (matches.length > 0) {
      return path.join(projectDir, matches[0]);
    }
    return null;
  }

  return logPattern;
}

// 解析JSONL文件，提取token使用量
function extractTokenUsage(logPath) {
  const files = fs.readdirSync(logPath).filter(f => f.endsWith('.jsonl'));

  let totalInputTokens = 0;
  let totalOutputTokens = 0;
  let totalCacheCreationTokens = 0;
  let totalCacheReadTokens = 0;
  let todayCount = 0;

  // 获取最近24小时
  const now = new Date();
  const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  for (const file of files) {
    const filePath = path.join(logPath, file);
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.trim().split('\n');

    for (const line of lines) {
      try {
        const entry = JSON.parse(line);

        // 检查是否是最近24小时的记录
        if (entry.timestamp) {
          const entryTime = new Date(entry.timestamp);
          if (entryTime < last24h) continue;
        }

        // 提取token数据 - Claude Code的日志格式
        // usage在message字段中
        const usage = entry.message?.usage || entry.usage;

        if (usage) {
          // Input tokens (实际输入)
          totalInputTokens += usage.input_tokens || 0;

          // Output tokens
          totalOutputTokens += usage.output_tokens || 0;

          // Cache creation tokens (写入缓存)
          totalCacheCreationTokens += usage.cache_creation_input_tokens || 0;

          // Cache read tokens (从缓存读取)
          totalCacheReadTokens += usage.cache_read_input_tokens || 0;

          todayCount++;
        }
      } catch (e) {
        // 跳过无法解析的行
        continue;
      }
    }
  }

  return {
    inputTokens: totalInputTokens,
    outputTokens: totalOutputTokens,
    cacheCreationTokens: totalCacheCreationTokens,
    cacheReadTokens: totalCacheReadTokens,
    requestCount: todayCount
  };
}

// 计算成本（包含Prompt Caching）
function calculateCost(inputTokens, outputTokens, cacheCreationTokens, cacheReadTokens) {
  // Claude 3.5 Sonnet 定价 (2024)
  const INPUT_PRICE = 3.00 / 1_000_000;           // $3 per 1M tokens
  const OUTPUT_PRICE = 15.00 / 1_000_000;         // $15 per 1M tokens
  const CACHE_WRITE_PRICE = 3.75 / 1_000_000;    // $3.75 per 1M tokens (cache write)
  const CACHE_READ_PRICE = 0.30 / 1_000_000;     // $0.30 per 1M tokens (cache read, 90% discount)

  const inputCost = inputTokens * INPUT_PRICE;
  const outputCost = outputTokens * OUTPUT_PRICE;
  const cacheWriteCost = cacheCreationTokens * CACHE_WRITE_PRICE;
  const cacheReadCost = cacheReadTokens * CACHE_READ_PRICE;

  return inputCost + outputCost + cacheWriteCost + cacheReadCost;
}

// 保存到usage文件
function saveUsageData(agentId, data) {
  const USAGE_DIR = path.join(os.homedir(), '.agentguard', 'usage');

  if (!fs.existsSync(USAGE_DIR)) {
    fs.mkdirSync(USAGE_DIR, { recursive: true });
  }

  const filePath = path.join(USAGE_DIR, `${agentId}.json`);

  const record = {
    inputTokens: data.inputTokens,
    outputTokens: data.outputTokens,
    cost: data.cost,
    model: 'claude-3-5-sonnet-20241022',
    timestamp: new Date().toISOString(),
    agentId: agentId,
    agentName: agentId === 'claude-code' ? 'Claude Code' : 'Cursor',
    metadata: {
      source: 'session-log-extraction',
      requestCount: data.requestCount,
      note: '从实际session日志中提取'
    }
  };

  // 读取现有数据
  let existingData = [];
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, 'utf-8');
    existingData = JSON.parse(content);
  }

  // 检查今天是否已有记录
  const today = new Date().toISOString().split('T')[0];
  const todayIndex = existingData.findIndex(r => {
    const recordDate = new Date(r.timestamp).toISOString().split('T')[0];
    return recordDate === today && r.metadata?.source === 'session-log-extraction';
  });

  if (todayIndex >= 0) {
    // 更新今天的记录
    existingData[todayIndex] = record;
  } else {
    // 添加新记录
    existingData.push(record);
  }

  fs.writeFileSync(filePath, JSON.stringify(existingData, null, 2));
}

// 主函数
function main() {
  console.log('🔍 正在从Claude Code日志中提取真实token使用量...\n');

  const logPath = findSessionLog();

  if (!logPath || !fs.existsSync(logPath)) {
    console.error('❌ 未找到Claude Code日志目录');
    console.log('   预期路径:', logPath);
    process.exit(1);
  }

  console.log('📂 日志目录:', logPath);

  const usage = extractTokenUsage(logPath);
  const cost = calculateCost(
    usage.inputTokens,
    usage.outputTokens,
    usage.cacheCreationTokens,
    usage.cacheReadTokens
  );

  console.log('\n📊 今日Claude Code使用量:');
  console.log(`   Input Tokens:         ${usage.inputTokens.toLocaleString()}`);
  console.log(`   Output Tokens:        ${usage.outputTokens.toLocaleString()}`);
  console.log(`   Cache Write Tokens:   ${usage.cacheCreationTokens.toLocaleString()}`);
  console.log(`   Cache Read Tokens:    ${usage.cacheReadTokens.toLocaleString()}`);
  console.log(`   ─────────────────────────────────────`);
  console.log(`   Total Cost:           $${cost.toFixed(4)}`);
  console.log(`   Requests:             ${usage.requestCount}`);

  // 计算总tokens（用于显示）
  const totalTokens = usage.inputTokens + usage.outputTokens + usage.cacheCreationTokens;

  // 保存数据
  saveUsageData('claude-code', {
    inputTokens: totalTokens, // 合并所有输入相关的tokens
    outputTokens: usage.outputTokens,
    cost: cost,
    requestCount: usage.requestCount
  });

  console.log('\n✅ 数据已保存到 ~/.agentguard/usage/claude-code.json');
  console.log('\n💡 提示: 重启AgentGuard桌面应用即可看到真实数据');
}

main();
