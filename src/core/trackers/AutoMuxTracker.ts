/**
 * 自动化 Mux 追踪器
 * 从 ~/.mux/sessions/ 读取 session-usage.json
 */

import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { BaseTracker, DailyUsage, MonthlyUsage, UsageData } from './BaseTracker';

interface MuxSessionUsage {
  byModel: Record<string, {
    input: number;
    cached: number;
    cacheCreate: number;
    output: number;
    reasoning: number;
  }>;
}

export class AutoMuxTracker extends BaseTracker {
  private readonly SESSION_DIR = path.join(os.homedir(), '.mux', 'sessions');

  private readonly PRICING = {
    INPUT: 3.00 / 1_000_000,
    OUTPUT: 15.00 / 1_000_000,
    CACHE_READ: 0.30 / 1_000_000,
    CACHE_WRITE: 3.75 / 1_000_000,
  };

  constructor() {
    super('mux', 'Mux');
  }

  private getUsageFiles(): string[] {
    if (!fs.existsSync(this.SESSION_DIR)) {
      return [];
    }

    const files: string[] = [];
    try {
      const workspaces = fs.readdirSync(this.SESSION_DIR, { withFileTypes: true });
      for (const workspace of workspaces) {
        if (!workspace.isDirectory()) continue;

        const usageFile = path.join(this.SESSION_DIR, workspace.name, 'session-usage.json');
        if (fs.existsSync(usageFile)) {
          files.push(usageFile);
        }
      }
    } catch (error) {
      console.warn('[AutoMuxTracker] Failed to scan sessions:', error);
    }

    return files;
  }

  private parseUsageFile(filePath: string, timeFilter?: Date) {
    let inputTokens = 0, outputTokens = 0, cacheReadTokens = 0, cacheWriteTokens = 0, reasoningTokens = 0;

    try {
      // 检查文件修改时间
      if (timeFilter) {
        const stats = fs.statSync(filePath);
        if (stats.mtime < timeFilter) {
          return { inputTokens, outputTokens, cacheReadTokens, cacheWriteTokens, reasoningTokens };
        }
      }

      const content = fs.readFileSync(filePath, 'utf-8');
      const usage: MuxSessionUsage = JSON.parse(content);

      if (usage.byModel) {
        for (const modelKey in usage.byModel) {
          const modelUsage = usage.byModel[modelKey];

          inputTokens += modelUsage.input || 0;
          outputTokens += modelUsage.output || 0;
          cacheReadTokens += modelUsage.cached || 0;
          cacheWriteTokens += modelUsage.cacheCreate || 0;
          reasoningTokens += modelUsage.reasoning || 0;
        }
      }
    } catch (error) {
      console.warn(`[AutoMuxTracker] Failed to parse ${filePath}:`, error);
    }

    return { inputTokens, outputTokens, cacheReadTokens, cacheWriteTokens, reasoningTokens };
  }

  private aggregateUsage(timeFilter?: Date) {
    const files = this.getUsageFiles();
    let totalInput = 0, totalOutput = 0, totalCacheRead = 0, totalCacheWrite = 0, totalReasoning = 0;

    for (const file of files) {
      const usage = this.parseUsageFile(file, timeFilter);
      totalInput += usage.inputTokens;
      totalOutput += usage.outputTokens;
      totalCacheRead += usage.cacheReadTokens;
      totalCacheWrite += usage.cacheWriteTokens;
      totalReasoning += usage.reasoningTokens;
    }

    const cost = (
      totalInput * this.PRICING.INPUT +
      totalOutput * this.PRICING.OUTPUT +
      totalCacheRead * this.PRICING.CACHE_READ +
      totalCacheWrite * this.PRICING.CACHE_WRITE
    );

    return { inputTokens: totalInput, outputTokens: totalOutput, cost, requestCount: files.length };
  }

  async getDailyUsage(date: Date = new Date()): Promise<DailyUsage> {
    const last24h = new Date(date.getTime() - 24 * 60 * 60 * 1000);
    const usage = this.aggregateUsage(last24h);

    return {
      date: this.formatDate(date),
      totalCost: usage.cost,
      totalInputTokens: usage.inputTokens,
      totalOutputTokens: usage.outputTokens,
      requestCount: usage.requestCount,
    };
  }

  async getMonthlyUsage(month?: string): Promise<MonthlyUsage> {
    const targetMonth = month || this.formatMonth(new Date());
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const usage = this.aggregateUsage(monthStart);

    return {
      month: targetMonth,
      totalCost: usage.cost,
      totalInputTokens: usage.inputTokens,
      totalOutputTokens: usage.outputTokens,
      requestCount: usage.requestCount,
    };
  }

  async trackUsage(usage: Omit<UsageData, 'timestamp'>): Promise<void> {}

  private formatDate(date: Date): string {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  }

  private formatMonth(date: Date): string {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
  }
}
