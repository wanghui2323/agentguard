#!/usr/bin/env node
/**
 * AgentGuard CLI
 */
import { Command } from 'commander';
import chalk from 'chalk';
import { SecurityScanner } from '../core/scanner';
import { AutoFixer } from '../core/fixer';
import type { SecurityScanResult } from '../types';

const program = new Command();

program
  .name('agentguard')
  .description('Security control center for local AI agents')
  .version('0.1.0');

/**
 * Scan command
 */
program
  .command('scan')
  .description('Scan all AI agents for security issues')
  .option('-a, --agent <name>', 'Scan specific agent')
  .option('--json', 'Output in JSON format')
  .action(async (options) => {
    try {
      const scanner = new SecurityScanner();
      const results = await scanner.scanAll();

      if (options.json) {
        console.log(JSON.stringify(results, null, 2));
        return;
      }

      displayScanResults(results);
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

program.parse();
