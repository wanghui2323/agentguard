/**
 * 智能优化建议命令
 */
import { Command } from 'commander';
import { OptimizationEngine } from '../../core/optimization/OptimizationEngine';
import chalk from 'chalk';

export function registerOptimizeCommands(program: Command) {
  const optimize = program
    .command('optimize')
    .description('Get intelligent optimization suggestions');

  // 分析命令
  optimize
    .command('analyze')
    .description('Analyze usage and generate optimization suggestions')
    .option('-d, --days <days>', 'Number of days to analyze', '30')
    .option('--json', 'Output in JSON format')
    .action(async (options) => {
      try {
        const engine = new OptimizationEngine();
        const days = parseInt(options.days, 10);

        console.log(chalk.cyan(`\n🔍 Analyzing ${days} days of usage data...\n`));

        const report = await engine.generateOptimizationReport(days);

        if (options.json) {
          console.log(JSON.stringify(report, null, 2));
          engine.close();
          return;
        }

        // 显示报告
        displayOptimizationReport(report);

        engine.close();
      } catch (error) {
        console.error(chalk.red('Error:'), error);
        process.exit(1);
      }
    });
}

/**
 * 显示优化报告
 */
function displayOptimizationReport(report: any): void {
  console.log(chalk.bold.cyan('━'.repeat(70)));
  console.log(chalk.bold.cyan('                   AgentGuard 优化建议报告'));
  console.log(chalk.bold.cyan('━'.repeat(70)));
  console.log();

  // 时间范围
  console.log(chalk.bold('📅 分析周期:'));
  console.log(`   ${report.period.startDate} 至 ${report.period.endDate} (${report.period.days}天)`);
  console.log();

  // 关键洞察
  if (report.insights.length > 0) {
    console.log(chalk.bold('💡 关键洞察:'));
    for (const insight of report.insights) {
      console.log(chalk.cyan(`   • ${insight}`));
    }
    console.log();
  }

  // 汇总统计
  console.log(chalk.bold('📊 优化潜力:'));
  console.log(`   建议总数: ${chalk.yellow(report.summary.totalSuggestions)}`);
  console.log(`   优先级分布: ${chalk.red(report.summary.byPriority.high + '高')} / ${chalk.yellow(report.summary.byPriority.medium + '中')} / ${chalk.green(report.summary.byPriority.low + '低')}`);

  if (report.summary.potentialSavings.monthly > 0) {
    console.log();
    console.log(chalk.bold.green('💰 预计节省:'));
    console.log(`   每天:   $${report.summary.potentialSavings.daily.toFixed(2)}`);
    console.log(`   每月:   $${report.summary.potentialSavings.monthly.toFixed(2)}`);
    console.log(`   每年:   $${report.summary.potentialSavings.yearly.toFixed(2)}`);
  }

  console.log();
  console.log(chalk.bold.cyan('━'.repeat(70)));
  console.log();

  // 建议列表
  if (report.suggestions.length === 0) {
    console.log(chalk.green('✓ 太棒了！没有发现需要优化的地方。\n'));
    return;
  }

  console.log(chalk.bold('📋 优化建议:\n'));

  for (let i = 0; i < report.suggestions.length; i++) {
    const suggestion = report.suggestions[i];
    displaySuggestion(suggestion, i + 1);
    console.log();
  }

  // 操作提示
  console.log(chalk.bold.cyan('━'.repeat(70)));
  console.log();
  console.log(chalk.bold('💡 下一步操作:'));
  console.log(chalk.dim('   1. 按优先级实施上述建议'));
  console.log(chalk.dim('   2. 监控优化效果'));
  console.log(chalk.dim('   3. 定期运行分析（建议每周一次）'));
  console.log();
}

/**
 * 显示单个建议
 */
function displaySuggestion(suggestion: any, index: number): void {
  // 优先级图标
  const priorityIcons: Record<string, string> = {
    high: chalk.red('🔴'),
    medium: chalk.yellow('🟡'),
    low: chalk.green('🟢')
  };
  const priorityIcon = priorityIcons[suggestion.priority] || '⚪';

  // 类别图标
  const categoryIcons: Record<string, string> = {
    'cost-reduction': '💰',
    'performance': '⚡',
    'security': '🔒',
    'efficiency': '📈'
  };
  const categoryIcon = categoryIcons[suggestion.category] || '📋';

  console.log(chalk.bold(`${index}. ${priorityIcon} ${categoryIcon} ${suggestion.title}`));
  console.log(chalk.dim(`   [${suggestion.category}] [优先级: ${suggestion.priority}]`));
  console.log();
  console.log(`   ${suggestion.description}`);
  console.log();
  console.log(chalk.dim('   原因:'));
  console.log(`   ${suggestion.reasoning}`);
  console.log();
  console.log(chalk.dim('   预期收益:'));
  console.log(`   ${chalk.green(suggestion.expectedBenefit)}`);

  // 预计节省
  if (suggestion.estimatedSavings) {
    console.log();
    console.log(chalk.dim('   预计节省:'));
    if (suggestion.estimatedSavings.daily) {
      console.log(chalk.green(`   每天: $${suggestion.estimatedSavings.daily.toFixed(2)}`));
    }
    if (suggestion.estimatedSavings.monthly) {
      console.log(chalk.green(`   每月: $${suggestion.estimatedSavings.monthly.toFixed(2)}`));
    }
    if (suggestion.estimatedSavings.percentage) {
      console.log(chalk.green(`   节省比例: ${suggestion.estimatedSavings.percentage}%`));
    }
  }

  // 操作步骤
  console.log();
  console.log(chalk.dim('   操作步骤:'));
  for (const step of suggestion.actionSteps) {
    console.log(chalk.cyan(`   • ${step}`));
  }

  // 影响的Agent
  if (suggestion.affectedAgents && suggestion.affectedAgents.length > 0) {
    console.log();
    console.log(chalk.dim(`   影响Agent: ${suggestion.affectedAgents.join(', ')}`));
  }
}
