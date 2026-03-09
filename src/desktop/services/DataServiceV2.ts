/**
 * 数据服务 V2 - 使用自动追踪系统
 */

import { SecurityScanner } from '../../core/scanner';
import { autoTrackerManager } from '../../core/trackers/AutoTrackerManager';
import type { Agent, SecurityScanResult } from '../../types';

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
}

export class DataServiceV2 {
  private scanner: SecurityScanner;

  constructor() {
    this.scanner = new SecurityScanner();
    this.logDetectionReport();
  }

  /**
   * 打印追踪器探测报告
   */
  private logDetectionReport() {
    const report = autoTrackerManager.getDetectionReport();
    console.log('[DataServiceV2] Auto-detection report:');
    report.forEach(item => {
      const status = item.detected ? '✅' : '❌';
      console.log(`  ${status} ${item.tool}: ${item.tracker}`);
    });
  }

  /**
   * 获取当前状态 (悬浮球使用)
   */
  async getStatus(): Promise<AgentStatus> {
    try {
      // 获取扫描结果
      const scanResults = await this.scanner.scanAll();
      const agents = scanResults.map((r) => r.agent);

      // 从追踪系统获取使用数据
      const usage = await autoTrackerManager.getAggregatedUsage();

      // 统计运行中的 Agent
      const activeAgents = agents.filter((a) => a.status === 'running').length;

      // 计算整体评分
      const overallScore =
        scanResults.reduce((sum, r) => sum + r.score, 0) / scanResults.length || 92;

      // 获取告警
      const alerts = this.checkAlerts(scanResults, usage.daily.total, usage.monthly.total);

      // 确定状态级别
      let level: AgentStatus['level'] = 'normal';
      if (alerts.some((a) => a.level === 'critical')) {
        level = 'critical';
      } else if (alerts.some((a) => a.level === 'warning')) {
        level = 'warning';
      }

      return {
        level,
        agents: agents.length || 3,
        activeAgents: activeAgents || 2,
        cost: usage.daily.total,
        score: Math.round(overallScore),
        hasAlerts: alerts.length > 0,
        alerts,
      };
    } catch (error) {
      console.error('[DataServiceV2] Failed to get status:', error);
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

      // 从追踪系统获取使用数据
      const usage = await autoTrackerManager.getAggregatedUsage();

      // 计算整体评分
      const overallScore =
        scanResults.reduce((sum, r) => sum + r.score, 0) / scanResults.length || 92;

      // 如果没有扫描结果，返回模拟数据
      const agentsData = scanResults.length > 0
        ? scanResults.map((result) => ({
            id: result.agent.id,
            name: result.agent.name,
            status: result.agent.status,
            score: result.score,
            issues: result.issues.length,
          }))
        : [
            { id: 'claude-code', name: 'Claude Code', status: 'running', score: 95, issues: 0 },
            { id: 'cursor', name: 'Cursor', status: 'running', score: 92, issues: 1 },
            { id: 'openclaw', name: 'OpenClaw', status: 'stopped', score: 88, issues: 2 },
          ];

      return {
        agents: agentsData,
        costs: {
          daily: usage.daily.total,
          monthly: usage.monthly.total,
        },
        score: Math.round(overallScore),
        alerts: this.checkAlerts(scanResults, usage.daily.total, usage.monthly.total),
      };
    } catch (error) {
      console.error('[DataServiceV2] Failed to get detailed data:', error);
      throw error;
    }
  }

  /**
   * 触发快速扫描
   */
  async triggerScan(): Promise<SecurityScanResult[]> {
    return await this.scanner.scanAll();
  }

  /**
   * 检查告警
   */
  private checkAlerts(
    scanResults: SecurityScanResult[],
    dailyCost: number,
    monthlyCost: number
  ): Alert[] {
    const alerts: Alert[] = [];

    // 安全问题告警
    const criticalIssues = scanResults.reduce(
      (sum, result) =>
        sum + result.issues.filter((i) => i.severity === 'high').length,
      0
    );

    if (criticalIssues >= 5) {
      alerts.push({
        level: 'critical',
        message: `发现 ${criticalIssues} 个高危安全问题`,
        timestamp: new Date(),
      });
    } else if (criticalIssues >= 3) {
      alerts.push({
        level: 'warning',
        message: `发现 ${criticalIssues} 个安全问题`,
        timestamp: new Date(),
      });
    }

    // 预算告警
    const monthlyBudget = 1000;
    const budgetPercent = (monthlyCost / monthlyBudget) * 100;

    if (budgetPercent >= 100) {
      alerts.push({
        level: 'critical',
        message: `月预算已用尽 (${budgetPercent.toFixed(0)}%)`,
        timestamp: new Date(),
      });
    } else if (budgetPercent >= 90) {
      alerts.push({
        level: 'warning',
        message: `月预算已用 ${budgetPercent.toFixed(0)}%`,
        timestamp: new Date(),
      });
    }

    // Agent 停止告警
    const stoppedAgents = scanResults.filter((r) => r.agent.status === 'stopped');
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
   * 记录token使用（供外部调用）
   */
  async trackTokenUsage(agentId: string, data: {
    inputTokens: number;
    outputTokens: number;
    model?: string;
  }) {
    const tracker = autoTrackerManager.getTracker(agentId);
    if (!tracker) {
      console.warn(`[DataServiceV2] Tracker not found: ${agentId}`);
      return;
    }

    // 自动计算成本（如果是ClaudeTracker）
    let cost = 0;
    if (tracker && 'calculateCost' in tracker) {
      cost = (tracker as any).calculateCost(data.inputTokens, data.outputTokens, data.model);
    }

    await tracker.trackUsage({
      inputTokens: data.inputTokens,
      outputTokens: data.outputTokens,
      cost,
      model: data.model
    });
  }
}

// 导出单例
export const dataServiceV2 = new DataServiceV2();
