/**
 * AgentGuard Web Dashboard Server
 * Express API server for real-time monitoring dashboard
 */

import express, { Request, Response } from 'express';
import cors from 'cors';
import path from 'path';
import { SecurityScanner } from '../../core/scanner';
import { TokenTracker } from '../../core/token-tracker';
import { HistoryDatabase } from '../../core/history/HistoryDatabase';
import { formatCost } from '../../utils/format';
import type { Agent, TokenStats } from '../../types';

const app = express();
const PORT = 3000;

// Initialize services
const scanner = new SecurityScanner();
const tokenTracker = new TokenTracker();
const historyDb = new HistoryDatabase();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../../public')));

/**
 * GET /api/status
 * 获取实时监控状态概览
 */
app.get('/api/status', async (req: Request, res: Response) => {
  try {
    const scanResults = await scanner.scanAll();
    const agents = scanResults.map((r) => r.agent);
    const tokenReport = await tokenTracker.getTokenReport(agents);

    // Calculate overall metrics
    const activeAgents = agents.filter((a) => a.status === 'running').length;
    const totalAgents = agents.length;
    const dailyCost = tokenReport.totalCost.today;
    const monthlyCost = tokenReport.totalCost.thisMonth;

    // Calculate security score (weighted average)
    const overallScore = scanResults.length > 0
      ? Math.round(scanResults.reduce((sum, r) => sum + r.score, 0) / scanResults.length)
      : 100;

    // Check for alerts and severity
    const criticalIssues = scanResults.filter((r) =>
      r.issues.some(issue => issue.severity === 'critical')
    );
    const warningIssues = scanResults.filter((r) =>
      r.issues.some(issue => issue.severity === 'high' || issue.severity === 'medium')
    );
    const hasAlerts = criticalIssues.length > 0 || warningIssues.length > 0;

    res.json({
      status: hasAlerts ? (criticalIssues.length > 0 ? 'critical' : 'warning') : 'normal',
      agents: {
        total: totalAgents,
        active: activeAgents,
        inactive: totalAgents - activeAgents,
      },
      cost: {
        today: dailyCost,
        thisMonth: monthlyCost,
        formatted: {
          today: formatCost(dailyCost),
          thisMonth: formatCost(monthlyCost),
        },
      },
      security: {
        score: overallScore,
        level: overallScore >= 90 ? 'excellent' : overallScore >= 70 ? 'good' : overallScore >= 50 ? 'fair' : 'poor',
      },
      alerts: {
        count: criticalIssues.length + warningIssues.length,
        critical: criticalIssues.length,
        warning: warningIssues.length,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error fetching status:', error);
    res.status(500).json({ error: 'Failed to fetch status' });
  }
});

/**
 * GET /api/agents
 * 获取所有 Agent 详细信息
 */
app.get('/api/agents', async (req: Request, res: Response) => {
  try {
    const scanResults = await scanner.scanAll();

    const agentsData = scanResults.map((result) => ({
      name: result.agent.name,
      pid: result.agent.pid,
      status: result.agent.status,
      port: result.agent.port,
      security: {
        score: result.score,
        riskLevel: result.level, // Use 'level' property which exists in SecurityScanResult
        issues: result.issues.map((issue) => ({
          severity: issue.severity,
          title: issue.title,
          description: issue.description,
          recommendation: issue.recommendation,
        })),
      },
      timestamp: new Date().toISOString(),
    }));

    res.json(agentsData);
  } catch (error) {
    console.error('Error fetching agents:', error);
    res.status(500).json({ error: 'Failed to fetch agents' });
  }
});

/**
 * GET /api/tokens
 * 获取 Token 使用情况详细报告
 */
app.get('/api/tokens', async (req: Request, res: Response) => {
  try {
    const scanResults = await scanner.scanAll();
    const agents = scanResults.map((r) => r.agent);
    const tokenReport = await tokenTracker.getTokenReport(agents);

    // Calculate totals from agent stats
    const totalInputTokens = tokenReport.agents.reduce((sum, stats: TokenStats) => sum + stats.today.inputTokens, 0);
    const totalOutputTokens = tokenReport.agents.reduce((sum, stats: TokenStats) => sum + stats.today.outputTokens, 0);

    res.json({
      total: {
        inputTokens: totalInputTokens,
        outputTokens: totalOutputTokens,
        totalTokens: totalInputTokens + totalOutputTokens,
        cost: tokenReport.totalCost,
        formatted: {
          today: formatCost(tokenReport.totalCost.today),
          thisWeek: formatCost(tokenReport.totalCost.thisWeek),
          thisMonth: formatCost(tokenReport.totalCost.thisMonth),
        },
      },
      byAgent: tokenReport.agents.map((stats: TokenStats) => ({
        name: stats.agent.name,
        inputTokens: stats.today.inputTokens,
        outputTokens: stats.today.outputTokens,
        totalTokens: stats.today.totalTokens,
        cost: stats.today.estimatedCost,
        formatted: formatCost(stats.today.estimatedCost),
      })),
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error fetching tokens:', error);
    res.status(500).json({ error: 'Failed to fetch tokens' });
  }
});

/**
 * POST /api/scan
 * 触发全量安全扫描
 */
app.post('/api/scan', async (req: Request, res: Response) => {
  try {
    const scanResults = await scanner.scanAll();
    res.json({
      success: true,
      scanned: scanResults.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error triggering scan:', error);
    res.status(500).json({ error: 'Failed to trigger scan' });
  }
});

/**
 * GET /api/history/cost
 * 获取成本历史趋势
 */
app.get('/api/history/cost', async (req: Request, res: Response) => {
  try {
    const days = parseInt(req.query.days as string) || 30;
    const trendData = historyDb.getCostTrend(days);

    res.json({
      data: trendData,
      period: { days },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error fetching cost history:', error);
    res.status(500).json({ error: 'Failed to fetch cost history' });
  }
});

/**
 * GET /api/history/tokens
 * 获取Token使用历史趋势
 */
app.get('/api/history/tokens', async (req: Request, res: Response) => {
  try {
    const days = parseInt(req.query.days as string) || 30;
    const trendData = historyDb.getTokenTrend(days);

    res.json({
      data: trendData,
      period: { days },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error fetching token history:', error);
    res.status(500).json({ error: 'Failed to fetch token history' });
  }
});

/**
 * GET /api/history/breakdown
 * 获取按Agent的成本分布统计
 */
app.get('/api/history/breakdown', async (req: Request, res: Response) => {
  try {
    const days = parseInt(req.query.days as string) || 30;

    // 计算日期范围
    const endDate = formatDate(new Date());
    const startDate = formatDate(
      new Date(Date.now() - days * 24 * 60 * 60 * 1000)
    );

    const stats = historyDb.getAggregatedStats('daily', startDate, endDate);

    res.json({
      period: {
        days,
        startDate: stats.startDate,
        endDate: stats.endDate,
      },
      summary: {
        totalCost: stats.totalCost,
        totalTokens: stats.totalTokens,
        totalRequests: stats.totalRequests,
        avgCostPerDay: stats.avgCostPerDay,
        avgTokensPerDay: stats.avgTokensPerDay,
      },
      agents: stats.topAgents.map(agent => ({
        id: agent.agentId,
        name: agent.agentName,
        cost: agent.cost,
        tokens: agent.tokens,
        percentage: agent.percentage,
      })),
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error fetching breakdown:', error);
    res.status(500).json({ error: 'Failed to fetch breakdown' });
  }
});

/**
 * GET /api/history/stats
 * 获取历史数据库统计信息
 */
app.get('/api/history/stats', async (req: Request, res: Response) => {
  try {
    const stats = historyDb.getDatabaseStats();
    res.json(stats);
  } catch (error) {
    console.error('Error fetching history stats:', error);
    res.status(500).json({ error: 'Failed to fetch history stats' });
  }
});

/**
 * GET /api/health
 * 健康检查端点
 */
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    version: '0.4.0',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

// Helper function
function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

// Serve main dashboard page
app.get('/', (req: Request, res: Response) => {
  res.sendFile(path.join(__dirname, '../../public/index.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`\n🎯 AgentGuard Web Dashboard`);
  console.log(`📊 Dashboard: http://localhost:${PORT}`);
  console.log(`🔌 API Server: http://localhost:${PORT}/api`);
  console.log(`\n✨ Available endpoints:`);
  console.log(`   GET  /api/status           - 实时监控状态`);
  console.log(`   GET  /api/agents           - Agent 列表`);
  console.log(`   GET  /api/tokens           - Token 使用报告`);
  console.log(`   POST /api/scan             - 触发安全扫描`);
  console.log(`   GET  /api/history/cost     - 成本历史趋势`);
  console.log(`   GET  /api/history/tokens   - Token历史趋势`);
  console.log(`   GET  /api/history/breakdown - 成本分布统计`);
  console.log(`   GET  /api/history/stats    - 数据库统计`);
  console.log(`   GET  /api/health           - 健康检查`);
  console.log(`\n✅ Server started successfully!\n`);
});

export { app };
