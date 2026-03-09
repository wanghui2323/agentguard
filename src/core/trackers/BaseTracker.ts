/**
 * 基础追踪器接口
 * 所有AI产品追踪器都应实现此接口
 */

export interface UsageData {
  inputTokens: number;
  outputTokens: number;
  cost: number;
  timestamp: Date;
  model?: string;
  metadata?: Record<string, any>;
}

export interface DailyUsage {
  date: string; // YYYY-MM-DD
  totalCost: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  requestCount: number;
}

export interface MonthlyUsage {
  month: string; // YYYY-MM
  totalCost: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  requestCount: number;
}

export abstract class BaseTracker {
  protected agentId: string;
  protected agentName: string;

  constructor(agentId: string, agentName: string) {
    this.agentId = agentId;
    this.agentName = agentName;
  }

  /**
   * 获取今日使用量
   */
  abstract getDailyUsage(date?: Date): Promise<DailyUsage>;

  /**
   * 获取本月使用量
   */
  abstract getMonthlyUsage(month?: string): Promise<MonthlyUsage>;

  /**
   * 记录单次使用
   */
  abstract trackUsage(usage: Omit<UsageData, 'timestamp'>): Promise<void>;

  /**
   * 获取历史数据（可选）
   */
  async getHistoricalUsage?(startDate: Date, endDate: Date): Promise<DailyUsage[]>;

  /**
   * 清理过期数据（可选）
   */
  async cleanup?(daysToKeep: number): Promise<void>;
}
