// 测试 Token 计算准确性
const { parseClaudeStats, getThisMonthTokens } = require('./dist/web/core/claude-stats-parser');

async function test() {
  console.log('🧪 测试 Token 计算准确性\n');

  // 1. 读取原始数据
  const stats = await parseClaudeStats();
  if (!stats) {
    console.log('❌ 无法读取 stats-cache.json');
    return;
  }

  console.log('📊 原始数据 (全部累计):');
  let totalCost = 0;
  for (const [model, usage] of Object.entries(stats.modelUsage)) {
    const input = usage.inputTokens;
    const output = usage.outputTokens;
    const cacheRead = usage.cacheReadInputTokens;
    const cacheCreate = usage.cacheCreationInputTokens;

    let cost = 0;
    if (model.includes('sonnet')) {
      cost = (input * 3 + output * 15 + cacheRead * 0.30 + cacheCreate * 3.75) / 1_000_000;
    } else if (model.includes('opus')) {
      cost = (input * 15 + output * 75 + cacheRead * 1.50 + cacheCreate * 18.75) / 1_000_000;
    } else if (model.includes('haiku')) {
      cost = (input * 0.25 + output * 1.25 + cacheRead * 0.03 + cacheCreate * 0.30) / 1_000_000;
    }

    console.log(`\n${model}:`);
    console.log(`  Input: ${input.toLocaleString()} tokens`);
    console.log(`  Output: ${output.toLocaleString()} tokens`);
    console.log(`  Cache Read: ${cacheRead.toLocaleString()} tokens`);
    console.log(`  Cache Create: ${cacheCreate.toLocaleString()} tokens`);
    console.log(`  成本: $${cost.toFixed(2)}`);

    totalCost += cost;
  }

  console.log(`\n💰 全部累计总成本: $${totalCost.toFixed(2)}`);

  // 2. 测试本月数据
  const monthData = await getThisMonthTokens();
  console.log(`\n📅 本月 Token 统计:`);
  console.log(`  总 Tokens: ${monthData.totalTokens.toLocaleString()}`);
  console.log(`  估算 Input: ${monthData.inputTokens.toLocaleString()}`);
  console.log(`  估算 Output: ${monthData.outputTokens.toLocaleString()}`);

  // 3. 计算本月成本（按比例）
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthStartStr = monthStart.toISOString().split('T')[0];

  let monthTotal = 0;
  for (const dayData of stats.dailyModelTokens) {
    if (dayData.date >= monthStartStr) {
      for (const tokens of Object.values(dayData.tokensByModel)) {
        monthTotal += tokens;
      }
    }
  }

  // 按比例计算本月成本
  const allTimeTotal = Object.values(stats.modelUsage).reduce((sum, u) =>
    sum + u.inputTokens + u.outputTokens + u.cacheReadInputTokens + u.cacheCreationInputTokens, 0);
  const monthCostEstimate = totalCost * (monthTotal / allTimeTotal);

  console.log(`\n💵 本月估算成本: $${monthCostEstimate.toFixed(2)}`);
  console.log(`\n✅ 你说的本月消耗: ~$500`);
  console.log(`📈 差距: $${Math.abs(500 - monthCostEstimate).toFixed(2)}`);

  if (Math.abs(500 - monthCostEstimate) < 100) {
    console.log('\n🎉 计算准确度较高！');
  } else {
    console.log('\n⚠️  仍有差距，可能原因：');
    console.log('   1. stats-cache.json 可能不完整（只记录到2月17日）');
    console.log('   2. Cursor 的 $200 未计入');
    console.log('   3. 其他 API 调用未统计');
  }
}

test().catch(console.error);
