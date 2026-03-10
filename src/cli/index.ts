#!/usr/bin/env node
/**
 * AgentGuard CLI
 */
import { Command } from 'commander';
import chalk from 'chalk';
import ora, { Ora } from 'ora';
import * as path from 'path';
import { SecurityScanner } from '../core/scanner';
import { AutoFixer } from '../core/fixer';
import { TokenTracker } from '../core/token-tracker';
import { ReportExporter } from '../core/report-exporter';
import { registerOpenClawCommands } from './commands/openclaw';
import type { SecurityScanResult, TokenReport } from '../types';

const program = new Command();

program
  .name('agentguard')
  .description('Security control center for local AI agents')
  .version('0.4.0');

/**
 * Scan command
 */
program
  .command('scan')
  .description('Scan all AI agents for security issues')
  .option('-a, --agent <name>', 'Scan specific agent')
  .option('--json', 'Output in JSON format')
  .option('-v, --verbose', 'Show detailed scanning process')
  .action(async (options) => {
    try {
      const scanner = new SecurityScanner();
      let spinner: Ora | null = null;
      let results: SecurityScanResult[];

      if (!options.json) {
        const startTime = Date.now();

        if (options.verbose) {
          // Verbose mode - show detailed progress
          console.log(chalk.bold('\n🔍 Starting AgentGuard security scan...\n'));

          const detectors = scanner.getAllDetectors();
          results = [];

          for (const detector of detectors) {
            console.log(chalk.cyan(`[${results.length + 1}/${detectors.length}]`), `Checking ${detector.name}...`);
            const result = await scanner.scanAgent(detector);

            if (result) {
              results.push(result);
              console.log(chalk.green('  ✓ Detected:'), `${result.agent.status} (Score: ${result.score}/100)`);

              if (result.issues.length > 0) {
                console.log(chalk.yellow('  ⚠ Issues found:'));
                for (const issue of result.issues) {
                  const icon = getSeverityIcon(issue.severity);
                  console.log(`    ${icon} [${issue.severity}] ${issue.title}`);
                }
              } else {
                console.log(chalk.green('  ✓ No security issues'));
              }
            } else {
              console.log(chalk.dim('  ○ Not installed or not running'));
            }
            console.log();
          }

          const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
          console.log(chalk.bold(`✨ Scan completed in ${elapsed}s\n`));
        } else {
          // Normal mode - show spinner
          spinner = ora('Scanning AI Agents...').start();
          results = await scanner.scanAll();
          const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
          spinner.succeed(`Scan completed in ${elapsed}s`);
        }

        displayScanResults(results);
      } else {
        // JSON mode - no spinner
        results = await scanner.scanAll();
        console.log(JSON.stringify(results, null, 2));
      }
    } catch (error) {
      console.error(chalk.red('Error:'), error);
      process.exit(1);
    }
  });

/**
 * Fix command
 */
program
  .command('fix')
  .description('Fix security issues automatically')
  .argument('[agent]', 'Agent to fix (optional)')
  .option('--auto', 'Auto-fix without confirmation')
  .action(async (agent, options) => {
    try {
      const scanner = new SecurityScanner();
      const fixer = new AutoFixer(scanner);

      const results = await scanner.scanAll();

      if (results.length === 0) {
        console.log(chalk.yellow('No agents found'));
        return;
      }

      // Filter by agent if specified
      const filtered = agent
        ? results.filter(r => r.agent.id === agent)
        : results;

      for (const result of filtered) {
        const autoFixableIssues = result.issues.filter(i => i.autoFixable);

        if (autoFixableIssues.length === 0) {
          console.log(chalk.yellow(`No auto-fixable issues for ${result.agent.name}`));
          continue;
        }

        console.log(chalk.bold(`\nFixing ${result.agent.name}...`));

        const fixes = await fixer.fixAllIssues(autoFixableIssues);

        for (const fix of fixes) {
          if (fix.success) {
            console.log(chalk.green('✓'), fix.issue.title);
          } else {
            console.log(chalk.red('✗'), fix.issue.title, '-', fix.message);
          }
        }
      }
    } catch (error) {
      console.error(chalk.red('Error:'), error);
      process.exit(1);
    }
  });

/**
 * Stop command
 */
program
  .command('stop')
  .description('Stop an AI agent')
  .argument('<agent>', 'Agent to stop')
  .action(async (agentId) => {
    try {
      const scanner = new SecurityScanner();
      const detector = scanner.getDetector(agentId);

      if (!detector) {
        console.error(chalk.red(`Agent not found: ${agentId}`));
        process.exit(1);
      }

      if (!detector.canControl()) {
        console.error(chalk.red(`Cannot control agent: ${agentId}`));
        process.exit(1);
      }

      console.log(chalk.yellow(`Stopping ${detector.name}...`));
      await detector.stop();
      console.log(chalk.green(`✓ ${detector.name} stopped`));
    } catch (error) {
      console.error(chalk.red('Error:'), error);
      process.exit(1);
    }
  });

/**
 * Restart command
 */
program
  .command('restart')
  .description('Restart an AI agent')
  .argument('<agent>', 'Agent to restart')
  .action(async (agentId) => {
    try {
      const scanner = new SecurityScanner();
      const detector = scanner.getDetector(agentId);

      if (!detector) {
        console.error(chalk.red(`Agent not found: ${agentId}`));
        process.exit(1);
      }

      if (!detector.canControl()) {
        console.error(chalk.red(`Cannot control agent: ${agentId}`));
        process.exit(1);
      }

      console.log(chalk.yellow(`Restarting ${detector.name}...`));
      await detector.restart();
      console.log(chalk.green(`✓ ${detector.name} restarted`));
    } catch (error) {
      console.error(chalk.red('Error:'), error);
      process.exit(1);
    }
  });

/**
 * Status command
 */
program
  .command('status')
  .description('Show status of all AI agents')
  .action(async () => {
    try {
      const scanner = new SecurityScanner();
      const results = await scanner.scanAll();

      console.log(chalk.bold('\nAI Agent Status:\n'));

      for (const result of results) {
        const status = result.agent.status === 'running'
          ? chalk.green('● running')
          : chalk.gray('○ stopped');

        const pid = result.agent.pid ? chalk.dim(`(PID ${result.agent.pid})`) : '';

        console.log(`${result.agent.name}: ${status} ${pid}`);
      }

      console.log();
    } catch (error) {
      console.error(chalk.red('Error:'), error);
      process.exit(1);
    }
  });

/**
 * Tokens command
 */
program
  .command('tokens')
  .description('Show token usage and cost statistics')
  .option('--json', 'Output in JSON format')
  .option('--budget-daily <amount>', 'Set daily budget limit (USD)')
  .option('--budget-weekly <amount>', 'Set weekly budget limit (USD)')
  .option('--budget-monthly <amount>', 'Set monthly budget limit (USD)')
  .action(async (options) => {
    try {
      const scanner = new SecurityScanner();
      const tracker = new TokenTracker();

      // Set budget if provided
      if (options.budgetDaily || options.budgetWeekly || options.budgetMonthly) {
        tracker.setBudget({
          daily: options.budgetDaily ? parseFloat(options.budgetDaily) : undefined,
          weekly: options.budgetWeekly ? parseFloat(options.budgetWeekly) : undefined,
          monthly: options.budgetMonthly ? parseFloat(options.budgetMonthly) : undefined
        });
      }

      const spinner = ora('Analyzing token usage...').start();
      const results = await scanner.scanAll();
      const agents = results.map(r => r.agent);
      const report = await tracker.getTokenReport(agents);
      spinner.succeed('Token analysis complete');

      if (options.json) {
        console.log(JSON.stringify(report, null, 2));
        return;
      }

      displayTokenReport(report);
    } catch (error) {
      console.error(chalk.red('Error:'), error);
      process.exit(1);
    }
  });

/**
 * Export command
 */
program
  .command('export')
  .description('Export security report to file')
  .option('-f, --format <format>', 'Export format (html, pdf, markdown)', 'html')
  .option('-o, --output <path>', 'Output file path')
  .option('--no-tokens', 'Exclude token usage from report')
  .action(async (options) => {
    try {
      const scanner = new SecurityScanner();
      const exporter = new ReportExporter();

      const spinner = ora('Generating security report...').start();

      // Scan all agents
      const results = await scanner.scanAll();

      // Get token report if requested
      let tokenReport: TokenReport | null = null;
      if (options.tokens) {
        const tracker = new TokenTracker();
        const agents = results.map(r => r.agent);
        tokenReport = await tracker.getTokenReport(agents);
      }

      // Determine output path
      const format = options.format as 'html' | 'pdf' | 'markdown';
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
      const defaultFilename = `agentguard-report-${timestamp}.${format === 'markdown' ? 'md' : format}`;
      const outputPath = options.output || path.join(process.cwd(), defaultFilename);

      // Export report
      await exporter.exportScanResults(results, tokenReport, {
        format,
        outputPath,
        includeTokens: options.tokens
      });

      spinner.succeed(`Report exported successfully`);
      console.log(chalk.green('\n✓ Report saved to:'), chalk.cyan(outputPath));

      if (format === 'pdf') {
        console.log(chalk.yellow('\n💡 Note: PDF export requires additional steps.'));
        console.log(chalk.dim('   See instructions in the generated .txt file.'));
      }
    } catch (error) {
      console.error(chalk.red('Error:'), error);
      process.exit(1);
    }
  });

/**
 * Display scan results in a nice format
 */
function displayScanResults(results: SecurityScanResult[]): void {
  console.log(chalk.bold('\n╔══════════════════════════════════════════════════════╗'));
  console.log(chalk.bold('║          AgentGuard - AI Agent 安全扫描报告          ║'));
  console.log(chalk.bold('╠══════════════════════════════════════════════════════╣'));
  console.log(`║  扫描时间: ${new Date().toLocaleString()}                       ║`);
  console.log(`║  检测到 ${results.length} 个 AI Agents                                ║`);

  if (results.length > 0) {
    const avgScore = Math.round(
      results.reduce((sum, r) => sum + r.score, 0) / results.length
    );
    const level = getScoreEmoji(avgScore);
    console.log(`║  总体安全评分: ${avgScore}/100 ${level}                      ║`);
  }

  console.log(chalk.bold('╠══════════════════════════════════════════════════════╣'));
  console.log('║                                                       ║');

  for (const result of results) {
    displayAgentResult(result);
  }

  console.log(chalk.bold('╚══════════════════════════════════════════════════════╝'));

  // Summary recommendations
  if (results.some(r => r.issues.length > 0)) {
    console.log(chalk.bold('\n建议操作:'));
    console.log(chalk.yellow('  运行'), chalk.cyan('agentguard fix'), chalk.yellow('自动修复问题'));
  }
}

/**
 * Display result for a single agent
 */
function displayAgentResult(result: SecurityScanResult): void {
  const scoreColor = result.score >= 70 ? chalk.green : result.score >= 50 ? chalk.yellow : chalk.red;
  const scoreEmoji = getScoreEmoji(result.score);
  const statusIcon = result.agent.status === 'running' ? '●' : '○';

  console.log(`║  [${result.agent.id}] ${result.agent.name}                    评分: ${scoreColor(result.score + '/100')} ${scoreEmoji}    ║`);
  console.log(`║      状态: ${statusIcon} ${result.agent.status}${result.agent.pid ? ` (PID ${result.agent.pid})` : ''}                     ║`);

  if (result.agent.port) {
    console.log(`║      端口: ${result.agent.port}                             ║`);
  }

  if (result.issues.length > 0) {
    const criticalCount = result.issues.filter(i => i.severity === 'critical').length;
    const highCount = result.issues.filter(i => i.severity === 'high').length;
    const mediumCount = result.issues.filter(i => i.severity === 'medium').length;

    let issueStr = `发现 ${result.issues.length} 个问题`;
    if (criticalCount > 0) issueStr += ` (${criticalCount}严重`;
    if (highCount > 0) issueStr += ` ${highCount}高危`;
    if (mediumCount > 0) issueStr += ` ${mediumCount}中危`;
    issueStr += ')';

    console.log(`║      ${issueStr}               ║`);

    // Show top 3 issues
    for (const issue of result.issues.slice(0, 3)) {
      const icon = getSeverityIcon(issue.severity);
      console.log(`║      ${icon} ${issue.title}                            ║`);
    }

    if (result.issues.length > 3) {
      console.log(`║      ... 还有 ${result.issues.length - 3} 个问题                        ║`);
    }
  } else {
    console.log('║      ' + chalk.green('✓ 无安全问题') + '                             ║');
  }

  console.log('║                                                       ║');
}

/**
 * Get emoji for score
 */
function getScoreEmoji(score: number): string {
  if (score >= 90) return '✅';
  if (score >= 70) return '🟢';
  if (score >= 50) return '🟡';
  if (score >= 30) return '🟠';
  return '🔴';
}

/**
 * Get icon for severity
 */
function getSeverityIcon(severity: string): string {
  switch (severity) {
    case 'critical': return chalk.red('🔴');
    case 'high': return chalk.red('🟠');
    case 'medium': return chalk.yellow('🟡');
    case 'low': return chalk.green('🟢');
    default: return 'ℹ️';
  }
}

/**
 * Display token usage report
 */
function displayTokenReport(report: TokenReport): void {
  console.log(chalk.bold('\n╔══════════════════════════════════════════════════════╗'));
  console.log(chalk.bold('║          AgentGuard - Token Usage Report            ║'));
  console.log(chalk.bold('╠══════════════════════════════════════════════════════╣'));
  console.log(`║  Generated: ${report.generatedAt.toLocaleString()}              ║`);
  console.log(chalk.bold('╚══════════════════════════════════════════════════════╝'));

  // Overall summary
  console.log(chalk.bold('\n💰 Cost Summary:'));
  console.log(`  Today:      ${chalk.green('$' + report.totalCost.today.toFixed(2))}`);
  console.log(`  This Week:  ${chalk.green('$' + report.totalCost.thisWeek.toFixed(2))}`);
  console.log(`  This Month: ${chalk.green('$' + report.totalCost.thisMonth.toFixed(2))}`);

  // Budget info
  if (report.budget && (report.budget.daily || report.budget.weekly || report.budget.monthly)) {
    console.log(chalk.bold('\n📊 Budget:'));
    if (report.budget.daily) {
      const pct = (report.totalCost.today / report.budget.daily) * 100;
      console.log(`  Daily:   $${report.totalCost.today.toFixed(2)} / $${report.budget.daily.toFixed(2)} (${pct.toFixed(0)}%)`);
    }
    if (report.budget.weekly) {
      const pct = (report.totalCost.thisWeek / report.budget.weekly) * 100;
      console.log(`  Weekly:  $${report.totalCost.thisWeek.toFixed(2)} / $${report.budget.weekly.toFixed(2)} (${pct.toFixed(0)}%)`);
    }
    if (report.budget.monthly) {
      const pct = (report.totalCost.thisMonth / report.budget.monthly) * 100;
      console.log(`  Monthly: $${report.totalCost.thisMonth.toFixed(2)} / $${report.budget.monthly.toFixed(2)} (${pct.toFixed(0)}%)`);
    }
  }

  // Alerts
  if (report.alerts.length > 0) {
    console.log(chalk.bold('\n⚠️  Budget Alerts:'));
    for (const alert of report.alerts) {
      console.log(chalk.yellow(`  • ${alert}`));
    }
  }

  // Per-agent breakdown
  console.log(chalk.bold('\n🤖 Per-Agent Breakdown:\n'));

  for (const stats of report.agents) {
    console.log(chalk.bold(`  ${stats.agent.name}:`));
    console.log(`    Today:      ${formatTokens(stats.today)} → ${chalk.green('$' + stats.today.estimatedCost.toFixed(2))}`);
    console.log(`    This Week:  ${formatTokens(stats.thisWeek)} → ${chalk.green('$' + stats.thisWeek.estimatedCost.toFixed(2))}`);
    console.log(`    This Month: ${formatTokens(stats.thisMonth)} → ${chalk.green('$' + stats.thisMonth.estimatedCost.toFixed(2))}`);
    console.log();
  }

  console.log(chalk.dim('💡 Tip: Set budget limits with --budget-daily, --budget-weekly, or --budget-monthly'));
  console.log();
}

/**
 * Format token count for display
 */
function formatTokens(usage: any): string {
  const total = usage.totalTokens.toLocaleString();
  if (usage.inputTokens > 0 && usage.outputTokens > 0) {
    return `${total} tokens (${usage.inputTokens.toLocaleString()} in / ${usage.outputTokens.toLocaleString()} out)`;
  }
  return `${total} tokens`;
}

// Register OpenClaw management commands
registerOpenClawCommands(program);

// Register history commands
import { registerHistoryCommands } from './commands/history';
registerHistoryCommands(program);

// Register optimization commands
import { registerOptimizeCommands } from './commands/optimize';
registerOptimizeCommands(program);

program.parse();
