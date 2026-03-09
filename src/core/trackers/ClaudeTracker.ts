/**
 * Claude API 追踪器
 * 支持多种追踪方式：
 * 1. Console API（需要Organization API Key）
 * 2. 本地日志追踪
 * 3. 拦截API调用
 */

import { BaseTracker, DailyUsage, MonthlyUsage, UsageData } from './BaseTracker';
import { LocalStorageTracker } from './LocalStorageTracker';

interface ClaudeTrackerConfig {
  agentId: string;
  agentName: string;
  organizationApiKey?: string; // 如果有，使用Console API
  enableLocalTracking?: boolean; // 是否启用本地追踪
}

interface ClaudeConsoleUsageResponse {
  data: Array<{
    date: string;
    input_tokens: number;
    output_tokens: number;
  }>;
}

export class ClaudeTracker extends BaseTracker {
  private config: ClaudeTrackerConfig;
  private localTracker: LocalStorageTracker;
  private consoleApiEnabled: boolean;

  // Claude 3.5 Sonnet 定价 (2024)
  private readonly PRICING = {
    'claude-3-5-sonnet-20241022': {
      input: 3.00 / 1_000_000,  // $3 per million input tokens
      output: 15.00 / 1_000_000  // $15 per million output tokens
    },
    'claude-3-5-haiku-20241022': {
      input: 1.00 / 1_000_000,
      output: 5.00 / 1_000_000
    },
    'claude-opus-4-20250514': {
      input: 15.00 / 1_000_000,
      output: 75.00 / 1_000_000
    }
  };

  constructor(config: ClaudeTrackerConfig) {
    super(config.agentId, config.agentName);
    this.config = config;
    this.localTracker = new LocalStorageTracker(config.agentId, config.agentName);
    this.consoleApiEnabled = !!config.organizationApiKey;
  }

  /**
   * 计算成本
   */
  calculateCost(inputTokens: number, outputTokens: number, model: string = 'claude-3-5-sonnet-20241022'): number {
    const pricing = this.PRICING[model as keyof typeof this.PRICING] || this.PRICING['claude-3-5-sonnet-20241022'];
    const inputCost = inputTokens * pricing.input;
    const outputCost = outputTokens * pricing.output;
    return inputCost + outputCost;
  }

  /**
   * 记录使用量（本地追踪）
   */
  async trackUsage(usage: Omit<UsageData, 'timestamp'>): Promise<void> {
    if (this.config.enableLocalTracking !== false) {
      await this.localTracker.trackUsage(usage);
    }
  }

  /**
   * 获取今日使用量
   * 优先使用Console API，回退到本地数据
   */
  async getDailyUsage(date: Date = new Date()): Promise<DailyUsage> {
    if (this.consoleApiEnabled) {
      try {
        const consoleData = await this.fetchFromConsoleAPI(date, date);
        if (consoleData && consoleData.length > 0) {
          return this.convertConsoleToDailyUsage(consoleData[0]);
        }
      } catch (error) {
        console.warn('[ClaudeTracker] Console API failed, falling back to local data:', error);
      }
    }

    // 回退到本地数据
    return await this.localTracker.getDailyUsage(date);
  }

  /**
   * 获取本月使用量
   */
  async getMonthlyUsage(month?: string): Promise<MonthlyUsage> {
    if (this.consoleApiEnabled) {
      try {
        const targetMonth = month || this.formatMonth(new Date());
        const [year, monthNum] = targetMonth.split('-').map(Number);
        const startDate = new Date(year, monthNum - 1, 1);
        const endDate = new Date(year, monthNum, 0); // Last day of month

        const consoleData = await this.fetchFromConsoleAPI(startDate, endDate);
        if (consoleData && consoleData.length > 0) {
          return this.convertConsoleToMonthlyUsage(consoleData, targetMonth);
        }
      } catch (error) {
        console.warn('[ClaudeTracker] Console API failed, falling back to local data:', error);
      }
    }

    // 回退到本地数据
    return await this.localTracker.getMonthlyUsage(month);
  }

  /**
   * 从Anthropic Console API获取使用数据
   */
  private async fetchFromConsoleAPI(startDate: Date, endDate: Date): Promise<any[]> {
    if (!this.config.organizationApiKey) {
      throw new Error('Organization API Key not configured');
    }

    const start = this.formatDate(startDate);
    const end = this.formatDate(endDate);

    const response = await fetch(`https://api.anthropic.com/v1/organization/usage?start_date=${start}&end_date=${end}`, {
      headers: {
        'x-api-key': this.config.organizationApiKey,
        'anthropic-version': '2023-06-01'
      }
    });

    if (!response.ok) {
      throw new Error(`Console API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json() as ClaudeConsoleUsageResponse;
    return data.data || [];
  }

  private convertConsoleToDailyUsage(consoleData: any): DailyUsage {
    const cost = this.calculateCost(consoleData.input_tokens, consoleData.output_tokens);
    return {
      date: consoleData.date,
      totalCost: cost,
      totalInputTokens: consoleData.input_tokens,
      totalOutputTokens: consoleData.output_tokens,
      requestCount: 0 // Console API不提供请求数
    };
  }

  private convertConsoleToMonthlyUsage(consoleData: any[], month: string): MonthlyUsage {
    const totalInputTokens = consoleData.reduce((sum, d) => sum + d.input_tokens, 0);
    const totalOutputTokens = consoleData.reduce((sum, d) => sum + d.output_tokens, 0);
    const totalCost = this.calculateCost(totalInputTokens, totalOutputTokens);

    return {
      month,
      totalCost,
      totalInputTokens,
      totalOutputTokens,
      requestCount: 0
    };
  }

  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private formatMonth(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  }
}
