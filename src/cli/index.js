#!/usr/bin/env node
"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * AgentGuard CLI
 */
const commander_1 = require("commander");
const chalk_1 = __importDefault(require("chalk"));
const ora_1 = __importDefault(require("ora"));
const path = __importStar(require("path"));
const scanner_1 = require("../core/scanner");
const fixer_1 = require("../core/fixer");
const token_tracker_1 = require("../core/token-tracker");
const report_exporter_1 = require("../core/report-exporter");
const program = new commander_1.Command();
program
    .name('agentguard')
    .description('Security control center for local AI agents')
    .version('0.3.0');
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
        const scanner = new scanner_1.SecurityScanner();
        let spinner = null;
        let results;
        if (!options.json) {
            const startTime = Date.now();
            if (options.verbose) {
                // Verbose mode - show detailed progress
                console.log(chalk_1.default.bold('\n🔍 Starting AgentGuard security scan...\n'));
                const detectors = scanner.getAllDetectors();
                results = [];
                for (const detector of detectors) {
                    console.log(chalk_1.default.cyan(`[${results.length + 1}/${detectors.length}]`), `Checking ${detector.name}...`);
                    const result = await scanner.scanAgent(detector);
                    if (result) {
                        results.push(result);
                        console.log(chalk_1.default.green('  ✓ Detected:'), `${result.agent.status} (Score: ${result.score}/100)`);
                        if (result.issues.length > 0) {
                            console.log(chalk_1.default.yellow('  ⚠ Issues found:'));
                            for (const issue of result.issues) {
                                const icon = getSeverityIcon(issue.severity);
                                console.log(`    ${icon} [${issue.severity}] ${issue.title}`);
                            }
                        }
                        else {
                            console.log(chalk_1.default.green('  ✓ No security issues'));
                        }
                    }
                    else {
                        console.log(chalk_1.default.dim('  ○ Not installed or not running'));
                    }
                    console.log();
                }
                const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
                console.log(chalk_1.default.bold(`✨ Scan completed in ${elapsed}s\n`));
            }
            else {
                // Normal mode - show spinner
                spinner = (0, ora_1.default)('Scanning AI Agents...').start();
                results = await scanner.scanAll();
                const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
                spinner.succeed(`Scan completed in ${elapsed}s`);
            }
            displayScanResults(results);
        }
        else {
            // JSON mode - no spinner
            results = await scanner.scanAll();
            console.log(JSON.stringify(results, null, 2));
        }
    }
    catch (error) {
        console.error(chalk_1.default.red('Error:'), error);
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
        const scanner = new scanner_1.SecurityScanner();
        const fixer = new fixer_1.AutoFixer(scanner);
        const results = await scanner.scanAll();
        if (results.length === 0) {
            console.log(chalk_1.default.yellow('No agents found'));
            return;
        }
        // Filter by agent if specified
        const filtered = agent
            ? results.filter(r => r.agent.id === agent)
            : results;
        for (const result of filtered) {
            const autoFixableIssues = result.issues.filter(i => i.autoFixable);
            if (autoFixableIssues.length === 0) {
                console.log(chalk_1.default.yellow(`No auto-fixable issues for ${result.agent.name}`));
                continue;
            }
            console.log(chalk_1.default.bold(`\nFixing ${result.agent.name}...`));
            const fixes = await fixer.fixAllIssues(autoFixableIssues);
            for (const fix of fixes) {
                if (fix.success) {
                    console.log(chalk_1.default.green('✓'), fix.issue.title);
                }
                else {
                    console.log(chalk_1.default.red('✗'), fix.issue.title, '-', fix.message);
                }
            }
        }
    }
    catch (error) {
        console.error(chalk_1.default.red('Error:'), error);
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
        const scanner = new scanner_1.SecurityScanner();
        const detector = scanner.getDetector(agentId);
        if (!detector) {
            console.error(chalk_1.default.red(`Agent not found: ${agentId}`));
            process.exit(1);
        }
        if (!detector.canControl()) {
            console.error(chalk_1.default.red(`Cannot control agent: ${agentId}`));
            process.exit(1);
        }
        console.log(chalk_1.default.yellow(`Stopping ${detector.name}...`));
        await detector.stop();
        console.log(chalk_1.default.green(`✓ ${detector.name} stopped`));
    }
    catch (error) {
        console.error(chalk_1.default.red('Error:'), error);
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
        const scanner = new scanner_1.SecurityScanner();
        const detector = scanner.getDetector(agentId);
        if (!detector) {
            console.error(chalk_1.default.red(`Agent not found: ${agentId}`));
            process.exit(1);
        }
        if (!detector.canControl()) {
            console.error(chalk_1.default.red(`Cannot control agent: ${agentId}`));
            process.exit(1);
        }
        console.log(chalk_1.default.yellow(`Restarting ${detector.name}...`));
        await detector.restart();
        console.log(chalk_1.default.green(`✓ ${detector.name} restarted`));
    }
    catch (error) {
        console.error(chalk_1.default.red('Error:'), error);
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
        const scanner = new scanner_1.SecurityScanner();
        const results = await scanner.scanAll();
        console.log(chalk_1.default.bold('\nAI Agent Status:\n'));
        for (const result of results) {
            const status = result.agent.status === 'running'
                ? chalk_1.default.green('● running')
                : chalk_1.default.gray('○ stopped');
            const pid = result.agent.pid ? chalk_1.default.dim(`(PID ${result.agent.pid})`) : '';
            console.log(`${result.agent.name}: ${status} ${pid}`);
        }
        console.log();
    }
    catch (error) {
        console.error(chalk_1.default.red('Error:'), error);
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
        const scanner = new scanner_1.SecurityScanner();
        const tracker = new token_tracker_1.TokenTracker();
        // Set budget if provided
        if (options.budgetDaily || options.budgetWeekly || options.budgetMonthly) {
            tracker.setBudget({
                daily: options.budgetDaily ? parseFloat(options.budgetDaily) : undefined,
                weekly: options.budgetWeekly ? parseFloat(options.budgetWeekly) : undefined,
                monthly: options.budgetMonthly ? parseFloat(options.budgetMonthly) : undefined
            });
        }
        const spinner = (0, ora_1.default)('Analyzing token usage...').start();
        const results = await scanner.scanAll();
        const agents = results.map(r => r.agent);
        const report = await tracker.getTokenReport(agents);
        spinner.succeed('Token analysis complete');
        if (options.json) {
            console.log(JSON.stringify(report, null, 2));
            return;
        }
        displayTokenReport(report);
    }
    catch (error) {
        console.error(chalk_1.default.red('Error:'), error);
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
        const scanner = new scanner_1.SecurityScanner();
        const exporter = new report_exporter_1.ReportExporter();
        const spinner = (0, ora_1.default)('Generating security report...').start();
        // Scan all agents
        const results = await scanner.scanAll();
        // Get token report if requested
        let tokenReport = null;
        if (options.tokens) {
            const tracker = new token_tracker_1.TokenTracker();
            const agents = results.map(r => r.agent);
            tokenReport = await tracker.getTokenReport(agents);
        }
        // Determine output path
        const format = options.format;
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
        console.log(chalk_1.default.green('\n✓ Report saved to:'), chalk_1.default.cyan(outputPath));
        if (format === 'pdf') {
            console.log(chalk_1.default.yellow('\n💡 Note: PDF export requires additional steps.'));
            console.log(chalk_1.default.dim('   See instructions in the generated .txt file.'));
        }
    }
    catch (error) {
        console.error(chalk_1.default.red('Error:'), error);
        process.exit(1);
    }
});
/**
 * Display scan results in a nice format
 */
function displayScanResults(results) {
    console.log(chalk_1.default.bold('\n╔══════════════════════════════════════════════════════╗'));
    console.log(chalk_1.default.bold('║          AgentGuard - AI Agent 安全扫描报告          ║'));
    console.log(chalk_1.default.bold('╠══════════════════════════════════════════════════════╣'));
    console.log(`║  扫描时间: ${new Date().toLocaleString()}                       ║`);
    console.log(`║  检测到 ${results.length} 个 AI Agents                                ║`);
    if (results.length > 0) {
        const avgScore = Math.round(results.reduce((sum, r) => sum + r.score, 0) / results.length);
        const level = getScoreEmoji(avgScore);
        console.log(`║  总体安全评分: ${avgScore}/100 ${level}                      ║`);
    }
    console.log(chalk_1.default.bold('╠══════════════════════════════════════════════════════╣'));
    console.log('║                                                       ║');
    for (const result of results) {
        displayAgentResult(result);
    }
    console.log(chalk_1.default.bold('╚══════════════════════════════════════════════════════╝'));
    // Summary recommendations
    if (results.some(r => r.issues.length > 0)) {
        console.log(chalk_1.default.bold('\n建议操作:'));
        console.log(chalk_1.default.yellow('  运行'), chalk_1.default.cyan('agentguard fix'), chalk_1.default.yellow('自动修复问题'));
    }
}
/**
 * Display result for a single agent
 */
function displayAgentResult(result) {
    const scoreColor = result.score >= 70 ? chalk_1.default.green : result.score >= 50 ? chalk_1.default.yellow : chalk_1.default.red;
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
        if (criticalCount > 0)
            issueStr += ` (${criticalCount}严重`;
        if (highCount > 0)
            issueStr += ` ${highCount}高危`;
        if (mediumCount > 0)
            issueStr += ` ${mediumCount}中危`;
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
    }
    else {
        console.log('║      ' + chalk_1.default.green('✓ 无安全问题') + '                             ║');
    }
    console.log('║                                                       ║');
}
/**
 * Get emoji for score
 */
function getScoreEmoji(score) {
    if (score >= 90)
        return '✅';
    if (score >= 70)
        return '🟢';
    if (score >= 50)
        return '🟡';
    if (score >= 30)
        return '🟠';
    return '🔴';
}
/**
 * Get icon for severity
 */
function getSeverityIcon(severity) {
    switch (severity) {
        case 'critical': return chalk_1.default.red('🔴');
        case 'high': return chalk_1.default.red('🟠');
        case 'medium': return chalk_1.default.yellow('🟡');
        case 'low': return chalk_1.default.green('🟢');
        default: return 'ℹ️';
    }
}
/**
 * Display token usage report
 */
function displayTokenReport(report) {
    console.log(chalk_1.default.bold('\n╔══════════════════════════════════════════════════════╗'));
    console.log(chalk_1.default.bold('║          AgentGuard - Token Usage Report            ║'));
    console.log(chalk_1.default.bold('╠══════════════════════════════════════════════════════╣'));
    console.log(`║  Generated: ${report.generatedAt.toLocaleString()}              ║`);
    console.log(chalk_1.default.bold('╚══════════════════════════════════════════════════════╝'));
    // Overall summary
    console.log(chalk_1.default.bold('\n💰 Cost Summary:'));
    console.log(`  Today:      ${chalk_1.default.green('$' + report.totalCost.today.toFixed(2))}`);
    console.log(`  This Week:  ${chalk_1.default.green('$' + report.totalCost.thisWeek.toFixed(2))}`);
    console.log(`  This Month: ${chalk_1.default.green('$' + report.totalCost.thisMonth.toFixed(2))}`);
    // Budget info
    if (report.budget && (report.budget.daily || report.budget.weekly || report.budget.monthly)) {
        console.log(chalk_1.default.bold('\n📊 Budget:'));
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
        console.log(chalk_1.default.bold('\n⚠️  Budget Alerts:'));
        for (const alert of report.alerts) {
            console.log(chalk_1.default.yellow(`  • ${alert}`));
        }
    }
    // Per-agent breakdown
    console.log(chalk_1.default.bold('\n🤖 Per-Agent Breakdown:\n'));
    for (const stats of report.agents) {
        console.log(chalk_1.default.bold(`  ${stats.agent.name}:`));
        console.log(`    Today:      ${formatTokens(stats.today)} → ${chalk_1.default.green('$' + stats.today.estimatedCost.toFixed(2))}`);
        console.log(`    This Week:  ${formatTokens(stats.thisWeek)} → ${chalk_1.default.green('$' + stats.thisWeek.estimatedCost.toFixed(2))}`);
        console.log(`    This Month: ${formatTokens(stats.thisMonth)} → ${chalk_1.default.green('$' + stats.thisMonth.estimatedCost.toFixed(2))}`);
        console.log();
    }
    console.log(chalk_1.default.dim('💡 Tip: Set budget limits with --budget-daily, --budget-weekly, or --budget-monthly'));
    console.log();
}
/**
 * Format token count for display
 */
function formatTokens(usage) {
    const total = usage.totalTokens.toLocaleString();
    if (usage.inputTokens > 0 && usage.outputTokens > 0) {
        return `${total} tokens (${usage.inputTokens.toLocaleString()} in / ${usage.outputTokens.toLocaleString()} out)`;
    }
    return `${total} tokens`;
}
program.parse();
