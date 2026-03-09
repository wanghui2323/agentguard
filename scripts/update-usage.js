#!/usr/bin/env node
/**
 * AgentGuard Usage Data Manager
 * 用于手动管理token使用数据
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const readline = require('readline');

const USAGE_DIR = path.join(os.homedir(), '.agentguard', 'usage');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

function ensureDir() {
  if (!fs.existsSync(USAGE_DIR)) {
    fs.mkdirSync(USAGE_DIR, { recursive: true });
  }
}

function loadUsageData(agentId) {
  const filePath = path.join(USAGE_DIR, `${agentId}.json`);
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(content);
  }
  return [];
}

function saveUsageData(agentId, data) {
  const filePath = path.join(USAGE_DIR, `${agentId}.json`);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

function calculateTokensFromCost(cost, model = 'claude-3-5-sonnet') {
  // 反向计算：假设input:output比例为 2:1
  // cost = (input * 3 + output * 15) / 1,000,000
  // 设 input = 2x, output = x
  // cost = (2x * 3 + x * 15) / 1,000,000 = 21x / 1,000,000
  // x = cost * 1,000,000 / 21
  const x = (cost * 1_000_000) / 21;
  return {
    inputTokens: Math.round(x * 2),
    outputTokens: Math.round(x)
  };
}

async function addUsageRecord() {
  console.log('\n=== 添加Token使用记录 ===\n');

  const agent = await question('Agent ID (claude-code/cursor): ');
  const costStr = await question('今日消费金额 (美元): $');
  const cost = parseFloat(costStr);

  if (isNaN(cost) || cost <= 0) {
    console.log('无效的金额');
    return;
  }

  const { inputTokens, outputTokens } = calculateTokensFromCost(cost);

  const record = {
    inputTokens,
    outputTokens,
    cost,
    model: agent === 'cursor' ? 'claude-3-5-sonnet' : 'claude-3-5-sonnet-20241022',
    timestamp: new Date().toISOString(),
    agentId: agent,
    agentName: agent === 'cursor' ? 'Cursor' : 'Claude Code',
    metadata: {
      source: 'manual-entry',
      note: '手动录入'
    }
  };

  ensureDir();
  const data = loadUsageData(agent);
  data.push(record);
  saveUsageData(agent, data);

  console.log('\n✅ 记录已添加:');
  console.log(`   Agent: ${record.agentName}`);
  console.log(`   Cost: $${cost.toFixed(2)}`);
  console.log(`   Tokens: ${inputTokens.toLocaleString()} input, ${outputTokens.toLocaleString()} output`);
}

async function viewUsage() {
  console.log('\n=== 当前使用数据 ===\n');

  ensureDir();
  const files = fs.readdirSync(USAGE_DIR).filter(f => f.endsWith('.json'));

  if (files.length === 0) {
    console.log('暂无数据');
    return;
  }

  let totalCost = 0;

  for (const file of files) {
    const agentId = file.replace('.json', '');
    const data = loadUsageData(agentId);

    const dailyCost = data.reduce((sum, r) => {
      const recordDate = new Date(r.timestamp).toDateString();
      const today = new Date().toDateString();
      return recordDate === today ? sum + r.cost : sum;
    }, 0);

    const monthlyCost = data.reduce((sum, r) => sum + r.cost, 0);

    console.log(`📊 ${agentId}:`);
    console.log(`   今日: $${dailyCost.toFixed(2)}`);
    console.log(`   本月: $${monthlyCost.toFixed(2)}`);
    console.log(`   记录数: ${data.length}`);
    console.log();

    totalCost += dailyCost;
  }

  console.log(`💰 今日总计: $${totalCost.toFixed(2)}`);
}

async function resetUsage() {
  console.log('\n⚠️  确认要清空所有数据吗? (yes/no): ');
  const confirm = await question('> ');

  if (confirm.toLowerCase() === 'yes') {
    const files = fs.readdirSync(USAGE_DIR).filter(f => f.endsWith('.json'));
    for (const file of files) {
      fs.unlinkSync(path.join(USAGE_DIR, file));
    }
    console.log('✅ 数据已清空');
  } else {
    console.log('❌ 操作已取消');
  }
}

async function main() {
  console.log('\n🛡️  AgentGuard Usage Data Manager\n');
  console.log('1. 查看当前数据');
  console.log('2. 添加使用记录');
  console.log('3. 清空所有数据');
  console.log('4. 退出\n');

  const choice = await question('选择操作 (1-4): ');

  switch (choice) {
    case '1':
      await viewUsage();
      break;
    case '2':
      await addUsageRecord();
      break;
    case '3':
      await resetUsage();
      break;
    case '4':
      console.log('再见!');
      rl.close();
      return;
    default:
      console.log('无效的选择');
  }

  // 继续循环
  rl.close();
  const newRl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  Object.assign(rl, newRl);

  await question('\n按回车继续...');
  await main();
}

main().catch(console.error);
