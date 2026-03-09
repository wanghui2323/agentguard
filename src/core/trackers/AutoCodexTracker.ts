/**
 * 自动化 Codex CLI 追踪器
 * 从 ~/.codex/sessions/ 读取 JSONL 日志
 */

import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import * as readline from 'readline';
import { BaseTracker, DailyUsage, MonthlyUsage, UsageData } from './BaseTracker';

interface CodexTokenCount {
  type: string;
  payload?: {
    type?: string;
    info?: {
      last_token_usage?: {
        input_tokens?: number;
        output_tokens?: number;
      };
    };
  };
}

export class AutoCodexTracker extends BaseTracker {
  private readonly SESSION_DIR = path.join(os.homedir(), '.codex', 'sessions');

  private readonly PRICING = {
    INPUT: 3.00 / 1_000_000,
    OUTPUT: 15.00 / 1_000_000,
  };

  constructor() {
    super('codex', 'Codex CLI');
  }

  /**
   * 获取所有 session 文件
   */
  private getSessionFiles(): string[] {
    if (!fs.existsSync(this.SESSION_DIR)) {
      return [];
    }

    try {
      const files = fs.readdirSync(this.SESSION_DIR);
      return files
        .filter(f => f.endsWith('.jsonl'))
        .map(f => path.join(this.SESSION_DIR, f));
    } catch (error) {
      console.warn('[AutoCodexTracker] Failed to read session directory:', error);
      return [];
    }
  }

  /**
   * 解析单个 JSONL 文件
   */
  private async parseJSONLFile(filePath: string, timeFilter?: Date): Promise<{
    inputTokens: number;
    outputTokens: number;
    requestCount: number;
  }> {
    let inputTokens = 0;
    let outputTokens = 0;
    let requestCount = 0;

    try {
      const fileStream = fs.createReadStream(filePath);
      const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity,
      });

      for await (const line of rl) {
        if (!line.trim()) continue;

        try {
          const entry: CodexTokenCount = JSON.parse(line);

          // 查找 token_count 事件
          if (
            entry.type === 'event_msg' &&
            entry.payload?.type === 'token_count' &&
            entry.payload?.info?.last_token_usage
          ) {
            const usage = entry.payload.info.last_token_usage;

            inputTokens += usage.input_tokens || 0;
            outputTokens += usage.output_tokens || 0;
            requestCount++;
          }
        } catch (parseError) {
          // 忽略解析失败的行
        }
      }
    } catch (error) {
      console.warn(`[AutoCodexTracker] Failed to parse ${filePath}:`, error);
    }

    return { inputTokens, outputTokens, requestCount };
  }

  /**
   * 汇总所有 session 的使用量
   */
  private async aggregateUsage(timeFilter?: Date): Promise<{
    inputTokens: number;
    outputTokens: number;
    cost: number;
    requestCount: number;
  }> {
    const sessionFiles = this.getSessionFiles();

    let totalInputTokens = 0;
    let totalOutputTokens = 0;
    let totalRequestCount = 0;

    for (const file of sessionFiles) {
      // 检查文件修改时间
      if (timeFilter) {
        try {
          const stats = fs.statSync(file);
          if (stats.mtime < timeFilter) {
            continue;
          }
        } catch (error) {
          continue;
        }
      }

      const usage = await this.parseJSONLFile(file, timeFilter);
      totalInputTokens += usage.inputTokens;
      totalOutputTokens += usage.outputTokens;
      totalRequestCount += usage.requestCount;
    }

    const cost = (
      totalInputTokens * this.PRICING.INPUT +
      totalOutputTokens * this.PRICING.OUTPUT
    );

    return {
      inputTokens: totalInputTokens,
      outputTokens: totalOutputTokens,
      cost,
      requestCount: totalRequestCount,
    };
  }

  /**
   * 获取今日使用量
   */
  async getDailyUsage(date: Date = new Date()): Promise<DailyUsage> {
    const last24h = new Date(date.getTime() - 24 * 60 * 60 * 1000);

    const usage = await this.aggregateUsage(last24h);

    return {
      date: this.formatDate(date),
      totalCost: usage.cost,
      totalInputTokens: usage.inputTokens,
      totalOutputTokens: usage.outputTokens,
      requestCount: usage.requestCount,
    };
  }

  /**
   * 获取本月使用量
   */
  async getMonthlyUsage(month?: string): Promise<MonthlyUsage> {
    const targetMonth = month || this.formatMonth(new Date());
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const usage = await this.aggregateUsage(monthStart);

    return {
      month: targetMonth,
      totalCost: usage.cost,
      totalInputTokens: usage.inputTokens,
      totalOutputTokens: usage.outputTokens,
      requestCount: usage.requestCount,
    };
  }

  /**
   * 手动记录使用量（不支持）
   */
  async trackUsage(usage: Omit<UsageData, 'timestamp'>): Promise<void> {
    // Codex 数据来自文件系统，无需手动记录
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
