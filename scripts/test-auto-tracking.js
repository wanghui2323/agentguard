#!/usr/bin/env node
/**
 * 测试自动追踪功能
 */

const path = require('path');

// 加载编译后的模块
const { autoTrackerManager } = require('../dist/core/trackers/AutoTrackerManager');

async function main() {
  console.log('🔍 AgentGuard 自动追踪测试\n');
  console.log('=' .repeat(50));

  // 1. 显示探测报告
  console.log('\n📊 工具探测报告:');
  console.log('=' .repeat(50));
  const report = autoTrackerManager.getDetectionReport();
  report.forEach(item => {
    const status = item.detected ? '✅ 已安装' : '❌ 未安装';
    console.log(`\n${item.tool}:`);
    console.log(`  状态: ${status}`);
    console.log(`  追踪器: ${item.tracker}`);
  });

  // 2. 获取并显示今日使用量
  console.log('\n\n💰 今日使用统计 (最近24小时):');
  console.log('=' .repeat(50));

  try {
    const usage = await autoTrackerManager.getAggregatedUsage();

    console.log(`\n总计: $${usage.daily.total.toFixed(4)}`);
    console.log('\n各工具详情:');

    for (const [agentId, cost] of Object.entries(usage.daily.byAgent)) {
      const name = agentId === 'claude-code' ? 'Claude Code' : 'Cursor';
      console.log(`  ${name}: $${cost.toFixed(4)}`);
    }

    // 3. 显示本月统计
    console.log('\n\n📅 本月使用统计:');
    console.log('=' .repeat(50));
    console.log(`\n总计: $${usage.monthly.total.toFixed(2)}`);
    console.log('\n各工具详情:');

    for (const [agentId, cost] of Object.entries(usage.monthly.byAgent)) {
      const name = agentId === 'claude-code' ? 'Claude Code' : 'Cursor';
      console.log(`  ${name}: $${cost.toFixed(2)}`);
    }

    // 4. 详细的 Claude Code 信息
    const claudeTracker = autoTrackerManager.getTracker('claude-code');
    if (claudeTracker) {
      console.log('\n\n🔍 Claude Code 详细信息:');
      console.log('=' .repeat(50));
      const dailyUsage = await claudeTracker.getDailyUsage();
      console.log(`  日期: ${dailyUsage.date}`);
      console.log(`  Input Tokens: ${dailyUsage.totalInputTokens.toLocaleString()}`);
      console.log(`  Output Tokens: ${dailyUsage.totalOutputTokens.toLocaleString()}`);
      console.log(`  请求数: ${dailyUsage.requestCount}`);
      console.log(`  成本: $${dailyUsage.totalCost.toFixed(4)}`);
    }

    // 5. 详细的 Cursor 信息
    const cursorTracker = autoTrackerManager.getTracker('cursor');
    if (cursorTracker) {
      console.log('\n\n🔍 Cursor 详细信息:');
      console.log('=' .repeat(50));
      const dailyUsage = await cursorTracker.getDailyUsage();
      console.log(`  日期: ${dailyUsage.date}`);
      console.log(`  Input Tokens: ${dailyUsage.totalInputTokens.toLocaleString()}`);
      console.log(`  Output Tokens: ${dailyUsage.totalOutputTokens.toLocaleString()}`);
      console.log(`  请求数: ${dailyUsage.requestCount}`);
      console.log(`  成本: $${dailyUsage.totalCost.toFixed(4)}`);
    }

    console.log('\n' + '='.repeat(50));
    console.log('✅ 测试完成！');
    console.log('\n💡 提示: 这些数据将自动显示在 AgentGuard 桌面应用中');

  } catch (error) {
    console.error('\n❌ 测试失败:', error.message);
    console.error('\n详细错误:');
    console.error(error);
  }
}

main().catch(console.error);
