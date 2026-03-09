/**
 * 自动化 Pi 追踪器
 * 从 ~/.pi/agent/sessions/ 读取 JSONL 日志
 */

import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import * as readline from 'readline';
import { BaseTracker, DailyUsage, MonthlyUsage, UsageData } from './BaseTracker';

interface PiMessage {
  type: string;
  id?: string;
  timestamp?: string;
  message?: {
    role: string;
    model?: string;
    provider?: string;
    usage?: {
      input: number;
      output: number;
      cacheRead?: number;
      cacheWrite?: number;
      totalTokens?: number;
    };
  };
}

export class AutoPiTracker extends BaseTracker {
  private readonly SESSION_DIR = path.join(os.homedir(), '.pi', 'agent', 'sessions');

  private readonly PRICING = {
    INPUT: 3.00 / 1_000_000,
    OUTPUT: 15.00 / 1_000_000,
    CACHE_READ: 0.30 / 1_000_000,
    CACHE_WRITE: 3.75 / 1_000_000,
  };

  constructor() {
    super('pi', 'Pi');
  }

  /**
   * 获取所有 session 目录
   */
  private getSessionDirs(): string[] {
    if (!fs.existsSync(this.SESSION_DIR)) {
      return [];
    }

    try {
      const entries = fs.readdirSync(this.SESSION_DIR, { withFileTypes: true });
      return entries
        .filter(e => e.isDirectory())
        .map(e => path.join(this.SESSION_DIR, e.name));
    } catch (error) {
      console.warn('[AutoPiTracker] Failed to read session directory:', error);
      return [];
    }
  }

  /**
   * 获取目录中的所有 JSONL 文件
   */
  private getJSONLFiles(dir: string): string[] {
    try {
      const files = fs.readdirSync(dir);
      return files
        .filter(f => f.endsWith('.jsonl'))
        .map(f => path.join(dir, f));
    } catch (error) {
      return [];
    }
  }

  /**
   * 解析单个 JSONL 文件
   */
  private async parseJSONLFile(filePath: string, timeFilter?: Date): Promise<{
    inputTokens: number;
    outputTokens: number;
    cacheReadTokens: number;
    cacheWriteTokens: number;
    requestCount: number;
  }> {
    let inputTokens = 0;
    let outputTokens = 0;
    let cacheReadTokens = 0;
    let cacheWriteTokens = 0;
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
          const entry: PiMessage = JSON.parse(line);

          // 只处理 message 类型的条目
          if (entry.type === 'message' && entry.message) {
            // 检查时间过滤
            if (timeFilter && entry.timestamp) {
              const msgTime = new Date(entry.timestamp);
              if (msgTime < timeFilter) {
                continue;
              }
            }

            // 只统计 assistant 消息
            if (entry.message.role === 'assistant' && entry.message.usage) {
              const usage = entry.message.usage;

              inputTokens += usage.input || 0;
              outputTokens += usage.output || 0;
              cacheReadTokens += usage.cacheRead || 0;
              cacheWriteTokens += usage.cacheWrite || 0;

              requestCount++;
            }
          }
        } catch (parseError) {
          // 忽略解析失败的行
        }
      }
    } catch (error) {
      console.warn(`[AutoPiTracker] Failed to parse ${filePath}:`, error);
    }

    return { inputTokens, outputTokens, cacheReadTokens, cacheWriteTokens, requestCount };
  }

  /**
   * 汇总所有 session 的使用量
   */
  private async aggregateUsage(timeFilter?: Date): Promise<{
    inputTokens: number;
    outputTokens: number;
    cacheReadTokens: number;
    cacheWriteTokens: number;
    cost: number;
    requestCount: number;
  }> {
    const sessionDirs = this.getSessionDirs();

    let totalInputTokens = 0;
    let totalOutputTokens = 0;
    let totalCacheReadTokens = 0;
    let totalCacheWriteTokens = 0;
    let totalRequestCount = 0;

    for (const sessionDir of sessionDirs) {
      const jsonlFiles = this.getJSONLFiles(sessionDir);

      for (const file of jsonlFiles) {
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
        totalCacheReadTokens += usage.cacheReadTokens;
        totalCacheWriteTokens += usage.cacheWriteTokens;
        totalRequestCount += usage.requestCount;
      }
    }

    const cost = (
      totalInputTokens * this.PRICING.INPUT +
      totalOutputTokens * this.PRICING.OUTPUT +
      totalCacheReadTokens * this.PRICING.CACHE_READ +
      totalCacheWriteTokens * this.PRICING.CACHE_WRITE
    );

    return {
      inputTokens: totalInputTokens,
      outputTokens: totalOutputTokens,
      cacheReadTokens: totalCacheReadTokens,
      cacheWriteTokens: totalCacheWriteTokens,
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
    // Pi 数据来自文件系统，无需手动记录
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
