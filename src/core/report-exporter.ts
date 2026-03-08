/**
 * Report Exporter
 * Export security scan and token reports to various formats
 */
import * as fs from 'fs/promises';
import * as path from 'path';
import type { SecurityScanResult, TokenReport } from '../types';

export type ExportFormat = 'html' | 'pdf' | 'markdown';

export interface ExportOptions {
  format: ExportFormat;
  outputPath: string;
  includeTokens?: boolean;
}

export class ReportExporter {
  /**
   * Export security scan results
   */
  async exportScanResults(
    results: SecurityScanResult[],
    tokenReport: TokenReport | null,
    options: ExportOptions
  ): Promise<void> {
    switch (options.format) {
      case 'html':
        await this.exportHTML(results, tokenReport, options.outputPath);
        break;
      case 'pdf':
        await this.exportPDF(results, tokenReport, options.outputPath);
        break;
      case 'markdown':
        await this.exportMarkdown(results, tokenReport, options.outputPath);
        break;
      default:
        throw new Error(`Unsupported format: ${options.format}`);
    }
  }

  /**
   * Export to HTML format
   */
  private async exportHTML(
    results: SecurityScanResult[],
    tokenReport: TokenReport | null,
    outputPath: string
  ): Promise<void> {
    const html = this.generateHTML(results, tokenReport);
    await fs.writeFile(outputPath, html, 'utf-8');
  }

  /**
   * Export to PDF format (requires HTML intermediate)
   */
  private async exportPDF(
    results: SecurityScanResult[],
    tokenReport: TokenReport | null,
    outputPath: string
  ): Promise<void> {
    // For now, we'll export HTML and add a note about PDF conversion
    // Full PDF support would require puppeteer or similar
    const html = this.generateHTML(results, tokenReport);
    const htmlPath = outputPath.replace(/\.pdf$/, '.html');
    await fs.writeFile(htmlPath, html, 'utf-8');

    // Write a note about PDF conversion
    const note = `
AgentGuard Report

PDF export requires additional dependencies.
An HTML version has been created at: ${htmlPath}

To convert to PDF manually:
1. Open ${htmlPath} in a browser
2. Use Print to PDF (Cmd+P or Ctrl+P)
3. Save as ${outputPath}

Or install puppeteer for automatic PDF generation:
  npm install puppeteer
`;
    await fs.writeFile(outputPath.replace(/\.pdf$/, '.txt'), note, 'utf-8');
  }

  /**
   * Export to Markdown format
   */
  private async exportMarkdown(
    results: SecurityScanResult[],
    tokenReport: TokenReport | null,
    outputPath: string
  ): Promise<void> {
    const markdown = this.generateMarkdown(results, tokenReport);
    await fs.writeFile(outputPath, markdown, 'utf-8');
  }

  /**
   * Generate HTML content
   */
  private generateHTML(
    results: SecurityScanResult[],
    tokenReport: TokenReport | null
  ): string {
    const avgScore = results.length > 0
      ? Math.round(results.reduce((sum, r) => sum + r.score, 0) / results.length)
      : 0;

    const criticalCount = results.reduce((sum, r) =>
      sum + r.issues.filter(i => i.severity === 'critical').length, 0);
    const highCount = results.reduce((sum, r) =>
      sum + r.issues.filter(i => i.severity === 'high').length, 0);
    const mediumCount = results.reduce((sum, r) =>
      sum + r.issues.filter(i => i.severity === 'medium').length, 0);
    const lowCount = results.reduce((sum, r) =>
      sum + r.issues.filter(i => i.severity === 'low').length, 0);

    return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>AgentGuard Security Report - ${new Date().toLocaleDateString()}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;
      line-height: 1.6;
      color: #333;
      background: #f5f5f5;
      padding: 20px;
    }
    .container {
      max-width: 1200px;
      margin: 0 auto;
      background: white;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      overflow: hidden;
    }
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 40px;
      text-align: center;
    }
    .header h1 {
      font-size: 32px;
      margin-bottom: 10px;
    }
    .header .date {
      opacity: 0.9;
      font-size: 14px;
    }
    .summary {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 20px;
      padding: 40px;
      background: #fafafa;
    }
    .summary-card {
      background: white;
      padding: 20px;
      border-radius: 8px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
      text-align: center;
    }
    .summary-card .value {
      font-size: 36px;
      font-weight: bold;
      margin: 10px 0;
    }
    .summary-card .label {
      color: #666;
      font-size: 14px;
    }
    .score-excellent { color: #10b981; }
    .score-good { color: #84cc16; }
    .score-warning { color: #f59e0b; }
    .score-danger { color: #ef4444; }
    .content {
      padding: 40px;
    }
    .section {
      margin-bottom: 40px;
    }
    .section h2 {
      font-size: 24px;
      margin-bottom: 20px;
      padding-bottom: 10px;
      border-bottom: 2px solid #667eea;
    }
    .agent-card {
      background: #fafafa;
      border-radius: 8px;
      padding: 20px;
      margin-bottom: 20px;
    }
    .agent-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 15px;
    }
    .agent-name {
      font-size: 20px;
      font-weight: bold;
    }
    .agent-score {
      font-size: 24px;
      font-weight: bold;
    }
    .agent-status {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 4px;
      font-size: 12px;
      font-weight: 500;
      margin-left: 10px;
    }
    .status-running {
      background: #d1fae5;
      color: #065f46;
    }
    .status-stopped {
      background: #f3f4f6;
      color: #6b7280;
    }
    .issue {
      background: white;
      border-left: 4px solid;
      padding: 15px;
      margin: 10px 0;
      border-radius: 4px;
    }
    .issue-critical { border-color: #dc2626; background: #fef2f2; }
    .issue-high { border-color: #ea580c; background: #fff7ed; }
    .issue-medium { border-color: #f59e0b; background: #fffbeb; }
    .issue-low { border-color: #84cc16; background: #f7fee7; }
    .issue-title {
      font-weight: bold;
      margin-bottom: 5px;
    }
    .issue-desc {
      color: #666;
      font-size: 14px;
      margin-bottom: 10px;
    }
    .issue-fix {
      background: rgba(0,0,0,0.03);
      padding: 8px 12px;
      border-radius: 4px;
      font-size: 13px;
      font-family: monospace;
    }
    .badge {
      display: inline-block;
      padding: 2px 8px;
      border-radius: 3px;
      font-size: 12px;
      font-weight: 500;
      margin-right: 5px;
    }
    .badge-critical { background: #fecaca; color: #991b1b; }
    .badge-high { background: #fed7aa; color: #9a3412; }
    .badge-medium { background: #fde68a; color: #92400e; }
    .badge-low { background: #d9f99d; color: #365314; }
    .token-section {
      background: #f0f9ff;
      padding: 20px;
      border-radius: 8px;
      margin-top: 20px;
    }
    .token-summary {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 15px;
      margin-bottom: 20px;
    }
    .token-card {
      background: white;
      padding: 15px;
      border-radius: 6px;
      text-align: center;
    }
    .token-value {
      font-size: 24px;
      font-weight: bold;
      color: #0284c7;
    }
    .footer {
      background: #fafafa;
      padding: 20px;
      text-align: center;
      color: #666;
      font-size: 14px;
    }
    @media print {
      body { background: white; padding: 0; }
      .container { box-shadow: none; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🛡️ AgentGuard Security Report</h1>
      <div class="date">Generated on ${new Date().toLocaleString('zh-CN')}</div>
    </div>

    <div class="summary">
      <div class="summary-card">
        <div class="label">Overall Score</div>
        <div class="value ${this.getScoreClass(avgScore)}">${avgScore}/100</div>
      </div>
      <div class="summary-card">
        <div class="label">Agents Detected</div>
        <div class="value">${results.length}</div>
      </div>
      <div class="summary-card">
        <div class="label">Critical Issues</div>
        <div class="value score-danger">${criticalCount}</div>
      </div>
      <div class="summary-card">
        <div class="label">High Issues</div>
        <div class="value score-warning">${highCount}</div>
      </div>
      <div class="summary-card">
        <div class="label">Medium Issues</div>
        <div class="value">${mediumCount}</div>
      </div>
      <div class="summary-card">
        <div class="label">Low Issues</div>
        <div class="value">${lowCount}</div>
      </div>
    </div>

    <div class="content">
      <div class="section">
        <h2>📊 Security Analysis by Agent</h2>
        ${results.map(result => this.generateAgentHTML(result)).join('\n')}
      </div>

      ${tokenReport ? this.generateTokenHTML(tokenReport) : ''}
    </div>

    <div class="footer">
      <p>Generated by <strong>AgentGuard v0.3.0</strong></p>
      <p>The security control center for local AI agents</p>
    </div>
  </div>
</body>
</html>`;
  }

  /**
   * Generate HTML for a single agent
   */
  private generateAgentHTML(result: SecurityScanResult): string {
    const scoreClass = this.getScoreClass(result.score);
    const statusClass = result.agent.status === 'running' ? 'status-running' : 'status-stopped';

    return `
      <div class="agent-card">
        <div class="agent-header">
          <div>
            <span class="agent-name">${result.agent.name}</span>
            <span class="agent-status ${statusClass}">${result.agent.status}</span>
            ${result.agent.pid ? `<span style="color: #666; font-size: 14px;"> PID ${result.agent.pid}</span>` : ''}
          </div>
          <div class="agent-score ${scoreClass}">${result.score}/100</div>
        </div>

        ${result.issues.length > 0 ? `
          <div class="issues">
            ${result.issues.map(issue => `
              <div class="issue issue-${issue.severity}">
                <div class="issue-title">
                  <span class="badge badge-${issue.severity}">${issue.severity.toUpperCase()}</span>
                  ${issue.title}
                </div>
                <div class="issue-desc">${issue.description}</div>
                ${issue.recommendation ? `<div class="issue-fix">💡 ${issue.recommendation}</div>` : ''}
              </div>
            `).join('')}
          </div>
        ` : '<p style="color: #10b981;">✅ No security issues detected</p>'}
      </div>
    `;
  }

  /**
   * Generate Token report HTML section
   */
  private generateTokenHTML(report: TokenReport): string {
    return `
      <div class="section">
        <h2>💰 Token Usage & Cost Report</h2>
        <div class="token-section">
          <div class="token-summary">
            <div class="token-card">
              <div class="label">Today</div>
              <div class="token-value">$${report.totalCost.today.toFixed(2)}</div>
            </div>
            <div class="token-card">
              <div class="label">This Week</div>
              <div class="token-value">$${report.totalCost.thisWeek.toFixed(2)}</div>
            </div>
            <div class="token-card">
              <div class="label">This Month</div>
              <div class="token-value">$${report.totalCost.thisMonth.toFixed(2)}</div>
            </div>
          </div>

          ${report.budget && (report.budget.daily || report.budget.weekly || report.budget.monthly) ? `
            <div style="background: white; padding: 15px; border-radius: 6px; margin-bottom: 15px;">
              <h3 style="margin-bottom: 10px;">📊 Budget Tracking</h3>
              ${report.budget.daily ? `
                <div style="margin: 5px 0;">
                  Daily: $${report.totalCost.today.toFixed(2)} / $${report.budget.daily.toFixed(2)}
                  (${((report.totalCost.today / report.budget.daily) * 100).toFixed(0)}%)
                </div>
              ` : ''}
              ${report.budget.weekly ? `
                <div style="margin: 5px 0;">
                  Weekly: $${report.totalCost.thisWeek.toFixed(2)} / $${report.budget.weekly.toFixed(2)}
                  (${((report.totalCost.thisWeek / report.budget.weekly) * 100).toFixed(0)}%)
                </div>
              ` : ''}
              ${report.budget.monthly ? `
                <div style="margin: 5px 0;">
                  Monthly: $${report.totalCost.thisMonth.toFixed(2)} / $${report.budget.monthly.toFixed(2)}
                  (${((report.totalCost.thisMonth / report.budget.monthly) * 100).toFixed(0)}%)
                </div>
              ` : ''}
            </div>
          ` : ''}

          ${report.alerts.length > 0 ? `
            <div style="background: #fef2f2; border-left: 4px solid #dc2626; padding: 15px; border-radius: 4px; margin-bottom: 15px;">
              <strong>⚠️ Budget Alerts:</strong>
              ${report.alerts.map(alert => `<div style="margin: 5px 0;">• ${alert}</div>`).join('')}
            </div>
          ` : ''}

          <h3 style="margin: 20px 0 10px 0;">Per-Agent Breakdown</h3>
          ${report.agents.map(stats => `
            <div style="background: white; padding: 15px; border-radius: 6px; margin: 10px 0;">
              <div style="font-weight: bold; margin-bottom: 10px;">${stats.agent.name}</div>
              <div style="font-size: 14px; color: #666;">
                <div>Today: ${this.formatTokens(stats.today)} → $${stats.today.estimatedCost.toFixed(2)}</div>
                <div>This Week: ${this.formatTokens(stats.thisWeek)} → $${stats.thisWeek.estimatedCost.toFixed(2)}</div>
                <div>This Month: ${this.formatTokens(stats.thisMonth)} → $${stats.thisMonth.estimatedCost.toFixed(2)}</div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  /**
   * Generate Markdown content
   */
  private generateMarkdown(
    results: SecurityScanResult[],
    tokenReport: TokenReport | null
  ): string {
    const avgScore = results.length > 0
      ? Math.round(results.reduce((sum, r) => sum + r.score, 0) / results.length)
      : 0;

    const criticalCount = results.reduce((sum, r) =>
      sum + r.issues.filter(i => i.severity === 'critical').length, 0);
    const highCount = results.reduce((sum, r) =>
      sum + r.issues.filter(i => i.severity === 'high').length, 0);
    const mediumCount = results.reduce((sum, r) =>
      sum + r.issues.filter(i => i.severity === 'medium').length, 0);
    const lowCount = results.reduce((sum, r) =>
      sum + r.issues.filter(i => i.severity === 'low').length, 0);

    let markdown = `# 🛡️ AgentGuard Security Report

**Generated:** ${new Date().toLocaleString('zh-CN')}

## 📊 Executive Summary

| Metric | Value |
|--------|-------|
| Overall Security Score | **${avgScore}/100** ${this.getScoreEmoji(avgScore)} |
| Agents Detected | ${results.length} |
| Critical Issues | 🔴 ${criticalCount} |
| High Issues | 🟠 ${highCount} |
| Medium Issues | 🟡 ${mediumCount} |
| Low Issues | 🟢 ${lowCount} |

---

## 🔍 Detailed Analysis

`;

    for (const result of results) {
      markdown += this.generateAgentMarkdown(result);
    }

    if (tokenReport) {
      markdown += this.generateTokenMarkdown(tokenReport);
    }

    markdown += `
---

## 📝 Recommendations

`;

    if (criticalCount > 0) {
      markdown += `
### 🚨 Critical Priority
- Address all **${criticalCount}** critical issues immediately
- Run \`agentguard fix\` for auto-fixable issues
`;
    }

    if (highCount > 0) {
      markdown += `
### ⚠️ High Priority
- Review and fix **${highCount}** high-severity issues
- Consider restricting agent permissions
`;
    }

    markdown += `
### 📚 Best Practices
- Regularly run security scans (\`agentguard scan\`)
- Keep agents updated to latest versions
- Review and minimize granted permissions
- Monitor token usage and set budget limits

---

*Report generated by **AgentGuard v0.3.0** - The security control center for local AI agents*
`;

    return markdown;
  }

  /**
   * Generate Markdown for a single agent
   */
  private generateAgentMarkdown(result: SecurityScanResult): string {
    const emoji = result.agent.status === 'running' ? '●' : '○';

    let md = `### ${result.agent.name}\n\n`;
    md += `**Status:** ${emoji} ${result.agent.status}`;
    if (result.agent.pid) md += ` (PID ${result.agent.pid})`;
    md += `\n`;
    md += `**Security Score:** ${result.score}/100 ${this.getScoreEmoji(result.score)}\n\n`;

    if (result.issues.length === 0) {
      md += `✅ **No security issues detected**\n\n`;
    } else {
      md += `#### Issues Found (${result.issues.length})\n\n`;

      for (const issue of result.issues) {
        const icon = this.getSeverityIcon(issue.severity);
        md += `${icon} **[${issue.severity.toUpperCase()}]** ${issue.title}\n`;
        md += `\n${issue.description}\n\n`;

        if (issue.recommendation) {
          md += `💡 **Recommendation:** ${issue.recommendation}\n\n`;
        }

        if (issue.autoFixable) {
          md += `🔧 *This issue can be auto-fixed with* \`agentguard fix\`\n\n`;
        }
      }
    }

    md += `---\n\n`;
    return md;
  }

  /**
   * Generate Token report Markdown section
   */
  private generateTokenMarkdown(report: TokenReport): string {
    let md = `## 💰 Token Usage & Cost Report\n\n`;

    md += `### Cost Summary\n\n`;
    md += `| Period | Cost |\n`;
    md += `|--------|------|\n`;
    md += `| Today | $${report.totalCost.today.toFixed(2)} |\n`;
    md += `| This Week | $${report.totalCost.thisWeek.toFixed(2)} |\n`;
    md += `| This Month | $${report.totalCost.thisMonth.toFixed(2)} |\n\n`;

    if (report.budget && (report.budget.daily || report.budget.weekly || report.budget.monthly)) {
      md += `### 📊 Budget Tracking\n\n`;

      if (report.budget.daily) {
        const pct = ((report.totalCost.today / report.budget.daily) * 100).toFixed(0);
        md += `- **Daily:** $${report.totalCost.today.toFixed(2)} / $${report.budget.daily.toFixed(2)} (${pct}%)\n`;
      }

      if (report.budget.weekly) {
        const pct = ((report.totalCost.thisWeek / report.budget.weekly) * 100).toFixed(0);
        md += `- **Weekly:** $${report.totalCost.thisWeek.toFixed(2)} / $${report.budget.weekly.toFixed(2)} (${pct}%)\n`;
      }

      if (report.budget.monthly) {
        const pct = ((report.totalCost.thisMonth / report.budget.monthly) * 100).toFixed(0);
        md += `- **Monthly:** $${report.totalCost.thisMonth.toFixed(2)} / $${report.budget.monthly.toFixed(2)} (${pct}%)\n`;
      }

      md += `\n`;
    }

    if (report.alerts.length > 0) {
      md += `### ⚠️ Budget Alerts\n\n`;
      for (const alert of report.alerts) {
        md += `- 🚨 ${alert}\n`;
      }
      md += `\n`;
    }

    md += `### Per-Agent Breakdown\n\n`;
    for (const stats of report.agents) {
      md += `#### ${stats.agent.name}\n\n`;
      md += `- **Today:** ${this.formatTokens(stats.today)} → $${stats.today.estimatedCost.toFixed(2)}\n`;
      md += `- **This Week:** ${this.formatTokens(stats.thisWeek)} → $${stats.thisWeek.estimatedCost.toFixed(2)}\n`;
      md += `- **This Month:** ${this.formatTokens(stats.thisMonth)} → $${stats.thisMonth.estimatedCost.toFixed(2)}\n\n`;
    }

    return md;
  }

  /**
   * Get CSS class for score
   */
  private getScoreClass(score: number): string {
    if (score >= 90) return 'score-excellent';
    if (score >= 70) return 'score-good';
    if (score >= 50) return 'score-warning';
    return 'score-danger';
  }

  /**
   * Get emoji for score
   */
  private getScoreEmoji(score: number): string {
    if (score >= 90) return '✅';
    if (score >= 70) return '🟢';
    if (score >= 50) return '🟡';
    if (score >= 30) return '🟠';
    return '🔴';
  }

  /**
   * Get icon for severity
   */
  private getSeverityIcon(severity: string): string {
    switch (severity) {
      case 'critical': return '🔴';
      case 'high': return '🟠';
      case 'medium': return '🟡';
      case 'low': return '🟢';
      default: return 'ℹ️';
    }
  }

  /**
   * Format token count for display
   */
  private formatTokens(usage: any): string {
    const total = usage.totalTokens.toLocaleString();
    if (usage.inputTokens > 0 && usage.outputTokens > 0) {
      return `${total} tokens (${usage.inputTokens.toLocaleString()} in / ${usage.outputTokens.toLocaleString()} out)`;
    }
    return `${total} tokens`;
  }
}
