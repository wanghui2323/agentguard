#!/usr/bin/env node

/**
 * 测试所有自动追踪器
 * 验证探测和数据读取功能
 */

const { autoTrackerManager } = require('../dist/core/trackers/AutoTrackerManager');

console.log('🔍 测试 AgentGuard 自动追踪系统\n');
console.log('=' .repeat(60));

async function testAllTrackers() {
  console.log('\n📊 1. 工具探测测试\n');

  const report = autoTrackerManager.getDetectionReport();

  let detectedCount = 0;
  report.forEach(tool => {
    const status = tool.detected ? '✅' : '❌';
    console.log(`${status} ${tool.tool}`);
    console.log(`   追踪器: ${tool.tracker}`);

    if (tool.detected) {
      detectedCount++;
    }
  });

  console.log('\n' + '─'.repeat(60));
  console.log(`检测到 ${detectedCount} 个已安装的工具`);

  if (detectedCount === 0) {
    console.log('\n⚠️  未检测到任何 AI 工具');
    console.log('请确保至少安装了以下工具之一:');
    console.log('  - Claude Code');
    console.log('  - OpenClaw');
    console.log('  - Roo Code');
    console.log('  - OpenCode');
    console.log('  等等...');
    return;
  }

  console.log('\n📈 2. 数据读取测试\n');

  try {
    const usage = await autoTrackerManager.getAggregatedUsage();

    console.log('今日汇总:');
    console.log(`  总成本: $${usage.daily.total.toFixed(2)}`);

    console.log('\n各工具明细:');
    Object.entries(usage.daily.byAgent).forEach(([agentId, cost]) => {
      if (cost > 0) {
        console.log(`  ${agentId}: $${cost.toFixed(2)}`);
      }
    });

    console.log('\n本月汇总:');
    console.log(`  总成本: $${usage.monthly.total.toFixed(2)}`);

    console.log('\n各工具明细:');
    Object.entries(usage.monthly.byAgent).forEach(([agentId, cost]) => {
      if (cost > 0) {
        console.log(`  ${agentId}: $${cost.toFixed(2)}`);
      }
    });

  } catch (error) {
    console.error('\n❌ 数据读取失败:', error.message);
  }

  console.log('\n📝 3. 单个追踪器测试\n');

  const trackers = autoTrackerManager.getAllTrackers();

  for (const tracker of trackers) {
    try {
      const daily = await tracker.getDailyUsage();
      const monthly = await tracker.getMonthlyUsage();

      console.log(`✅ ${tracker.agentName}`);
      console.log(`   今日: $${daily.totalCost.toFixed(2)} (${daily.requestCount} 请求)`);
      console.log(`   本月: $${monthly.totalCost.toFixed(2)} (${monthly.requestCount} 请求)`);

    } catch (error) {
      console.log(`❌ ${tracker.agentName}: ${error.message}`);
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('✅ 测试完成！\n');
}

testAllTrackers().catch(error => {
  console.error('\n❌ 测试失败:', error);
  process.exit(1);
});
