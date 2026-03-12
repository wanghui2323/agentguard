/**
 * 数据服务 - 桌面应用与核心引擎的桥梁
 */

import { SecurityScanner } from '../../core/scanner';
import { TokenTracker } from '../../core/token-tracker';
import type { Agent, SecurityScanResult, TokenReport } from '../../types';

export interface AgentStatus {
  level: 'normal' | 'warning' | 'critical' | 'offline';
  agents: number;
  activeAgents: number;
  cost: number;
  score: number;
  budgetPercent?: number;
  hasAlerts: boolean;
  alerts: Alert[];
}

export interface Alert {
  level: 'info' | 'warning' | 'critical';
  message: string;
  timestamp: Date;
}

export interface DetailedData {
  agents: {
    id: string;
    name: string;
    status: string;
    score: number;
    issues: number;
  }[];
  costs: {
    daily: number;
    monthly: number;
  };
  score: number;
  alerts: Alert[];
  tokensByAgent?: {
    [agentId: string]: {
      today: number;
      thisMonth: number;
      dataSource?: string;
      accuracy?: string;
    };
  };
}

export class DataService {
  private scanner: SecurityScanner;
  private tokenTracker: TokenTracker;
  private lastScanResults: SecurityScanResult[] = [];
  private lastTokenReport: TokenReport | null = null;

  constructor() {
    this.scanner = new SecurityScanner();
    this.tokenTracker = new TokenTracker();
  }

  /**
   * 获取当前状态 (悬浮球使用)
   */
  async getStatus(): Promise<AgentStatus> {
    try {
      // 获取扫描结果
      const scanResults = await this.scanner.scanAll();
      this.lastScanResults = scanResults;

      // 提取 agents
      const agents = scanResults.map((r) => r.agent);

      // 获取 Token 数据
      const tokenReport = await this.tokenTracker.getTokenReport(agents);
      this.lastTokenReport = tokenReport;

      // 如果没有真实数据，使用模拟数据（方便演示）
      const hasRealData = agents.length > 0 && tokenReport.totalCost.today > 0;

      if (!hasRealData) {
        console.log('[DataService] 使用模拟状态数据');
        return this.getMockStatus();
      }

      // 统计运行中的 Agent
      const activeAgents = agents.filter((a) => a.status === 'running').length;

      // 计算今日成本
      const dailyCost = tokenReport.totalCost.today;

      // 计算整体评分 (所有 agent 的平均分)
      const overallScore =
        scanResults.reduce((sum, r) => sum + r.score, 0) / scanResults.length || 0;

      // 获取告警
      const alerts = this.checkAlerts(scanResults, tokenReport);

      // 确定状态级别
      let level: AgentStatus['level'] = 'normal';
      if (alerts.some((a) => a.level === 'critical')) {
        level = 'critical';
      } else if (alerts.some((a) => a.level === 'warning')) {
        level = 'warning';
      }

      return {
        level,
        agents: agents.length,
        activeAgents,
        cost: dailyCost,
        score: Math.round(overallScore),
        hasAlerts: alerts.length > 0,
        alerts,
      };
    } catch (error) {
      console.error('Failed to get status:', error);
      return {
        level: 'offline',
        agents: 0,
        activeAgents: 0,
        cost: 0,
        score: 0,
        hasAlerts: false,
        alerts: [],
      };
    }
  }

  /**
   * 获取详细数据 (快速面板使用)
   */
  async getDetailedData(): Promise<DetailedData> {
    try {
      const scanResults = await this.scanner.scanAll();
      const agents = scanResults.map((r) => r.agent);
      const tokenReport = await this.tokenTracker.getTokenReport(agents);

      // 如果没有真实数据，使用模拟数据（方便演示）
      const hasRealData = agents.length > 0 && tokenReport.totalCost.today > 0;

      if (!hasRealData) {
        console.log('[DataService] 使用模拟数据');
        return this.getMockDetailedData();
      }

      // 获取月成本
      const monthlyCost = tokenReport.totalCost.thisMonth;

      // 计算整体评分
      const overallScore =
        scanResults.reduce((sum, r) => sum + r.score, 0) / scanResults.length || 0;

      // 构建按Agent的Token使用数据（包含数据来源和准确度）
      const tokensByAgent: { [agentId: string]: { today: number; thisMonth: number; dataSource?: string; accuracy?: string } } = {};
      tokenReport.agents.forEach((agentStats) => {
        tokensByAgent[agentStats.agent.id] = {
          today: agentStats.today.estimatedCost,
          thisMonth: agentStats.thisMonth.estimatedCost,
          dataSource: agentStats.today.dataSource,
          accuracy: agentStats.today.accuracy,
        };
      });

      return {
        agents: scanResults.map((result) => ({
          id: result.agent.id,
          name: result.agent.name,
          status: result.agent.status,
          score: result.score,
          issues: result.issues.length,
        })),
        costs: {
          daily: tokenReport.totalCost.today,
          monthly: monthlyCost,
        },
        score: Math.round(overallScore),
        alerts: this.checkAlerts(scanResults, tokenReport),
        tokensByAgent,
      };
    } catch (error) {
      console.error('Failed to get detailed data:', error);
      throw error;
    }
  }

  /**
   * 触发快速扫描
   */
  async triggerScan(): Promise<SecurityScanResult[]> {
    const results = await this.scanner.scanAll();
    this.lastScanResults = results;
    return results;
  }

  /**
   * 获取模拟状态数据（开发环境使用）
   */
  private getMockStatus(): AgentStatus {
    return {
      level: 'normal',
      agents: 3,
      activeAgents: 2,
      cost: 98.04,
      score: 92,
      budgetPercent: 16,
      hasAlerts: false,
      alerts: [],
    };
  }

  /**
   * 获取模拟详细数据（开发环境使用）
   */
  private getMockDetailedData(): DetailedData {
    return {
      agents: [
        {
          id: 'claude-code',
          name: 'Claude Code',
          status: 'running',
          score: 95,
          issues: 0,
        },
        {
          id: 'cursor',
          name: 'Cursor',
          status: 'running',
          score: 92,
          issues: 1,
        },
        {
          id: 'openclaw',
          name: 'OpenClaw',
          status: 'stopped',
          score: 88,
          issues: 2,
        },
      ],
      costs: {
        daily: 9.78,
        monthly: 214.29,
      },
      score: 92,
      alerts: [],
      tokensByAgent: {
        'claude-code': {
          today: 5.87,
          thisMonth: 128.57,
        },
        'cursor': {
          today: 3.91,
          thisMonth: 85.72,
        },
      },
    };
  }

  /**
   * 检查告警
   */
  private checkAlerts(
    scanResults: SecurityScanResult[],
    tokenReport: TokenReport
  ): Alert[] {
    const alerts: Alert[] = [];

    // 安全问题告警（调整阈值：只在真正严重时才告警）
    const criticalIssues = scanResults.reduce(
      (sum, result) =>
        sum + result.issues.filter((i) => i.severity === 'high').length,
      0
    );

    if (criticalIssues >= 5) {
      // 5个或以上高危问题才显示为严重
      alerts.push({
        level: 'critical',
        message: `发现 ${criticalIssues} 个高危安全问题`,
        timestamp: new Date(),
      });
    } else if (criticalIssues >= 3) {
      // 3-4个高危问题显示为警告
      alerts.push({
        level: 'warning',
        message: `发现 ${criticalIssues} 个安全问题`,
        timestamp: new Date(),
      });
    }
    // 1-2个问题不影响状态，仅记录为 info（不影响整体 level）

    // 预算告警 (这里使用硬编码的月预算 $1000, 后续从配置读取)
    const monthlyBudget = 1000;
    const monthlyCost = tokenReport.totalCost.thisMonth;
    const budgetPercent = (monthlyCost / monthlyBudget) * 100;

    if (budgetPercent >= 100) {
      alerts.push({
        level: 'critical',
        message: `月预算预计用尽 (${budgetPercent.toFixed(0)}%)`,
        timestamp: new Date(),
      });
    } else if (budgetPercent >= 90) {
      alerts.push({
        level: 'warning',
        message: `月预算预计用 ${budgetPercent.toFixed(0)}%`,
        timestamp: new Date(),
      });
    } else if (budgetPercent >= 70) {
      alerts.push({
        level: 'info',
        message: `月预算预计用 ${budgetPercent.toFixed(0)}%`,
        timestamp: new Date(),
      });
    }

    // Agent 停止告警
    const stoppedAgents = scanResults.filter(
      (r) => r.agent.status === 'stopped'
    );
    if (stoppedAgents.length > 0) {
      alerts.push({
        level: 'info',
        message: `${stoppedAgents.length} 个 Agent 已停止运行`,
        timestamp: new Date(),
      });
    }

    return alerts;
  }

  /**
   * 获取最后的扫描结果 (用于避免重复扫描)
   */
  getLastScanResults(): SecurityScanResult[] {
    return this.lastScanResults;
  }

  /**
   * 获取最后的 Token 报告
   */
  getLastTokenReport(): TokenReport | null {
    return this.lastTokenReport;
  }
}

// 导出单例
export const dataService = new DataService();
