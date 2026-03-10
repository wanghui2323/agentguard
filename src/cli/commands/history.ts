/**
 * 历史数据查询和可视化命令
 */
import { Command } from 'commander';
import { HistoryDatabase } from '../../core/history/HistoryDatabase';
import { ChartRenderer } from '../../core/visualization/ChartRenderer';
import chalk from 'chalk';

export function registerHistoryCommands(program: Command) {
  const history = program
    .command('history')
    .description('View token usage and cost history');

  // 成本趋势命令
  history
    .command('cost')
    .description('Show cost trend over time')
    .option('-d, --days <days>', 'Number of days to show', '30')
    .option('--json', 'Output in JSON format')
    .action(async (options) => {
      try {
        const db = new HistoryDatabase();
        const days = parseInt(options.days, 10);

        const trendData = db.getCostTrend(days);

        if (options.json) {
          console.log(JSON.stringify(trendData, null, 2));
          db.close();
          return;
        }

        const renderer = new ChartRenderer();
        const chart = renderer.renderCostTrend(trendData, {
          title: `Cost Trend (Last ${days} Days)`
        });

        console.log(chart);

        db.close();
      } catch (error) {
        console.error(chalk.red('Error:'), error);
        process.exit(1);
      }
    });

  // Token使用趋势命令
  history
    .command('tokens')
    .description('Show token usage trend over time')
    .option('-d, --days <days>', 'Number of days to show', '30')
    .option('--json', 'Output in JSON format')
    .action(async (options) => {
      try {
        const db = new HistoryDatabase();
        const days = parseInt(options.days, 10);

        const trendData = db.getTokenTrend(days);

        if (options.json) {
          console.log(JSON.stringify(trendData, null, 2));
          db.close();
          return;
        }

        const renderer = new ChartRenderer();
        const chart = renderer.renderTokenTrend(trendData, {
          title: `Token Usage Trend (Last ${days} Days)`
        });

        console.log(chart);

        db.close();
      } catch (error) {
        console.error(chalk.red('Error:'), error);
        process.exit(1);
      }
    });

  // Agent成本分布命令
  history
    .command('breakdown')
    .description('Show cost breakdown by agent')
    .option('-d, --days <days>', 'Number of days to analyze', '30')
    .option('--json', 'Output in JSON format')
    .action(async (options) => {
      try {
        const db = new HistoryDatabase();
        const days = parseInt(options.days, 10);

        // 计算日期范围
        const endDate = formatDate(new Date());
        const startDate = formatDate(
          new Date(Date.now() - days * 24 * 60 * 60 * 1000)
        );

        const stats = db.getAggregatedStats('daily', startDate, endDate);

        if (options.json) {
          console.log(JSON.stringify(stats.topAgents, null, 2));
          db.close();
          return;
        }

        const renderer = new ChartRenderer();
        const agents = stats.topAgents.map(a => ({
          name: a.agentName,
          cost: a.cost,
          percentage: a.percentage
        }));
        const chart = renderer.renderAgentCostBreakdown(agents, {
          title: `Cost Breakdown (Last ${days} Days)`
        });

        console.log(chart);

        // 显示总计
        console.log(chalk.bold('Summary:'));
        console.log(`  Period:       ${chalk.cyan(`${startDate} to ${endDate}`)}`);
        console.log(`  Total Cost:   ${chalk.green('$' + stats.totalCost.toFixed(2))}`);
        console.log(`  Total Tokens: ${chalk.cyan(stats.totalTokens.toLocaleString())}`);
        console.log(`  Avg/Day:      ${chalk.yellow('$' + stats.avgCostPerDay.toFixed(2))}`);
        console.log();

        db.close();
      } catch (error) {
        console.error(chalk.red('Error:'), error);
        process.exit(1);
      }
    });

  // 数据库统计命令
  history
    .command('stats')
    .description('Show database statistics')
    .action(async () => {
      try {
        const db = new HistoryDatabase();
        const stats = db.getDatabaseStats();

        console.log(chalk.bold('\n📊 History Database Statistics\n'));
        console.log(chalk.dim('─'.repeat(50)));
        console.log();
        console.log(`  Database Path:  ${chalk.cyan(stats.dbPath)}`);
        console.log(`  File Size:      ${chalk.yellow(stats.fileSizeMB + ' MB')}`);
        console.log(`  Token Records:  ${chalk.green(stats.tokenRecords.toLocaleString())}`);
        console.log(`  Cost Records:   ${chalk.green(stats.costRecords.toLocaleString())}`);
        console.log();

        if (stats.oldestDate && stats.newestDate) {
          console.log(chalk.bold('Date Range:'));
          console.log(`  Oldest: ${chalk.dim(stats.oldestDate)}`);
          console.log(`  Newest: ${chalk.dim(stats.newestDate)}`);
          console.log();
        }

        console.log(chalk.bold('Configuration:'));
        console.log(`  Max Records:    ${chalk.cyan(stats.maxRecords.toLocaleString())}`);
        console.log(`  Retention:      ${chalk.cyan(stats.retentionDays + ' days')}`);
        console.log();

        db.close();
      } catch (error) {
        console.error(chalk.red('Error:'), error);
        process.exit(1);
      }
    });

  // 清理旧数据命令
  history
    .command('cleanup')
    .description('Clean up old history records')
    .option('-f, --force', 'Force cleanup without confirmation')
    .action(async (options) => {
      try {
        const db = new HistoryDatabase();
        const stats = db.getDatabaseStats();

        console.log(chalk.yellow('\n⚠️  Database Cleanup\n'));
        console.log(`This will delete records older than ${chalk.bold(stats.retentionDays + ' days')}`);
        console.log();

        if (!options.force) {
          console.log(chalk.red('Use --force to proceed with cleanup'));
          db.close();
          return;
        }

        const deletedCount = db.cleanupOldRecords();

        if (deletedCount > 0) {
          console.log(chalk.green(`✓ Deleted ${deletedCount} old records\n`));
        } else {
          console.log(chalk.cyan('No old records to delete\n'));
        }

        db.close();
      } catch (error) {
        console.error(chalk.red('Error:'), error);
        process.exit(1);
      }
    });
}

/**
 * 格式化日期为YYYY-MM-DD
 */
function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}
