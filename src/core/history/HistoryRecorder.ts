/**
 * 历史数据记录器 - 自动记录Token使用和成本数据
 */
import { HistoryDatabase } from './HistoryDatabase';
import type { TokenUsageHistory, CostHistory } from './types';
import type { Agent } from '../../types';

export class HistoryRecorder {
  private db: HistoryDatabase;

  constructor(db?: HistoryDatabase) {
    this.db = db || new HistoryDatabase();
  }

  /**
   * 记录单个Agent的Token使用数据
   */
  recordAgentUsage(agent: Agent, date?: string): void {
    if (!agent.tokenUsage) {
      return;
    }

    const recordDate = date || this.formatDate(new Date());

    const record: TokenUsageHistory = {
      date: recordDate,
      agentId: agent.id,
      agentName: agent.name,
      inputTokens: agent.tokenUsage.inputTokens || 0,
      outputTokens: agent.tokenUsage.outputTokens || 0,
      cacheCreationTokens: agent.tokenUsage.cacheCreationInputTokens || 0,
      cacheReadTokens: agent.tokenUsage.cacheReadInputTokens || 0,
      totalTokens: agent.tokenUsage.totalTokens || 0,
      estimatedCost: agent.tokenUsage.estimatedCost || 0,
      requestCount: agent.tokenUsage.requestCount || 0,
      createdAt: new Date().toISOString()
    };

    this.db.saveTokenUsage(record);
  }

  /**
   * 记录所有Agents的Token使用数据
   */
  recordAllAgents(agents: Agent[], date?: string): void {
    const recordDate = date || this.formatDate(new Date());

    const records: TokenUsageHistory[] = agents
      .filter(agent => agent.tokenUsage)
      .map(agent => ({
        date: recordDate,
        agentId: agent.id,
        agentName: agent.name,
        inputTokens: agent.tokenUsage!.inputTokens || 0,
        outputTokens: agent.tokenUsage!.outputTokens || 0,
        cacheCreationTokens: agent.tokenUsage!.cacheCreationInputTokens || 0,
        cacheReadTokens: agent.tokenUsage!.cacheReadInputTokens || 0,
        totalTokens: agent.tokenUsage!.totalTokens || 0,
        estimatedCost: agent.tokenUsage!.estimatedCost || 0,
        requestCount: agent.tokenUsage!.requestCount || 0,
        createdAt: new Date().toISOString()
      }));

    if (records.length > 0) {
      this.db.saveTokenUsageBatch(records);
      this.updateDailyCost(recordDate, agents);
    }
  }

  /**
   * 更新每日成本汇总
   */
  private updateDailyCost(date: string, agents: Agent[]): void {
    const breakdown: { [agentId: string]: number } = {};
    let totalCost = 0;

    for (const agent of agents) {
      if (agent.tokenUsage?.estimatedCost) {
        breakdown[agent.id] = agent.tokenUsage.estimatedCost;
        totalCost += agent.tokenUsage.estimatedCost;
      }
    }

    const record: CostHistory = {
      date,
      totalCost,
      breakdown,
      createdAt: new Date().toISOString()
    };

    this.db.saveCostHistory(record);
  }

  /**
   * 定时记录（每天记录一次）
   */
  startAutoRecording(agents: () => Promise<Agent[]>, intervalMinutes: number = 60): NodeJS.Timeout {
    const record = async () => {
      try {
        const agentList = await agents();
        this.recordAllAgents(agentList);
      } catch (error) {
        console.error('Failed to record agent usage:', error);
      }
    };

    // 立即记录一次
    record();

    // 定时记录
    return setInterval(record, intervalMinutes * 60 * 1000);
  }

  /**
   * 停止自动记录
   */
  stopAutoRecording(timerId: NodeJS.Timeout): void {
    clearInterval(timerId);
  }

  /**
   * 获取数据库实例
   */
  getDatabase(): HistoryDatabase {
    return this.db;
  }

  /**
   * 格式化日期为YYYY-MM-DD
   */
  private formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  /**
   * 关闭记录器
   */
  close(): void {
    this.db.close();
  }
}
