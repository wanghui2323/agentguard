/**
 * 自动化 Gemini CLI 追踪器
 * 从 ~/.gemini/tmp/ 目录读取 session 文件
 */

import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { BaseTracker, DailyUsage, MonthlyUsage, UsageData } from './BaseTracker';

interface GeminiMessage {
  type: string;
  model?: string;
  tokens?: {
    input: number;
    output: number;
    cached?: number;
    thoughts?: number;
  };
}

interface GeminiSession {
  sessionId: string;
  messages: GeminiMessage[];
}

export class AutoGeminiTracker extends BaseTracker {
  private readonly TMP_DIR = path.join(os.homedir(), '.gemini', 'tmp');

  private readonly PRICING = {
    INPUT: 1.25 / 1_000_000,     // Gemini Pro pricing
    OUTPUT: 5.00 / 1_000_000,
    CACHED: 0.3125 / 1_000_000,  // 75% discount
  };

  constructor() {
    super('gemini', 'Gemini CLI');
  }

  /**
   * 获取所有项目哈希目录
   */
  private getProjectDirs(): string[] {
    if (!fs.existsSync(this.TMP_DIR)) {
      return [];
    }

    try {
      const entries = fs.readdirSync(this.TMP_DIR, { withFileTypes: true });
      return entries
        .filter(e => e.isDirectory())
        .map(e => path.join(this.TMP_DIR, e.name, 'chats'));
    } catch (error) {
      console.warn('[AutoGeminiTracker] Failed to read tmp directory:', error);
      return [];
    }
  }

  /**
   * 获取 chats 目录中的所有 JSON 文件
   */
  private getChatFiles(chatsDir: string): string[] {
    if (!fs.existsSync(chatsDir)) {
      return [];
    }

    try {
      const files = fs.readdirSync(chatsDir);
      return files
        .filter(f => f.endsWith('.json'))
        .map(f => path.join(chatsDir, f));
    } catch (error) {
      return [];
    }
  }

  /**
   * 解析单个 chat 文件
   */
  private parseChatFile(filePath: string, timeFilter?: Date): {
    inputTokens: number;
    outputTokens: number;
    cachedTokens: number;
    thoughtsTokens: number;
    requestCount: number;
  } {
    let inputTokens = 0;
    let outputTokens = 0;
    let cachedTokens = 0;
    let thoughtsTokens = 0;
    let requestCount = 0;

    try {
      // 检查文件修改时间
      if (timeFilter) {
        const stats = fs.statSync(filePath);
        if (stats.mtime < timeFilter) {
          return { inputTokens, outputTokens, cachedTokens, thoughtsTokens, requestCount };
        }
      }

      const content = fs.readFileSync(filePath, 'utf-8');
      const session: GeminiSession = JSON.parse(content);

      if (session.messages && Array.isArray(session.messages)) {
        for (const message of session.messages) {
          // 只统计 Gemini 响应
          if (message.type === 'gemini' && message.tokens) {
            inputTokens += message.tokens.input || 0;
            outputTokens += message.tokens.output || 0;
            cachedTokens += message.tokens.cached || 0;
            thoughtsTokens += message.tokens.thoughts || 0;

            requestCount++;
          }
        }
      }
    } catch (error) {
      console.warn(`[AutoGeminiTracker] Failed to parse ${filePath}:`, error);
    }

    return { inputTokens, outputTokens, cachedTokens, thoughtsTokens, requestCount };
  }

  /**
   * 汇总所有 chat 文件的使用量
   */
  private aggregateUsage(timeFilter?: Date): {
    inputTokens: number;
    outputTokens: number;
    cachedTokens: number;
    thoughtsTokens: number;
    cost: number;
    requestCount: number;
  } {
    const projectDirs = this.getProjectDirs();

    let totalInputTokens = 0;
    let totalOutputTokens = 0;
    let totalCachedTokens = 0;
    let totalThoughtsTokens = 0;
    let totalRequestCount = 0;

    for (const chatsDir of projectDirs) {
      const chatFiles = this.getChatFiles(chatsDir);

      for (const file of chatFiles) {
        const usage = this.parseChatFile(file, timeFilter);
        totalInputTokens += usage.inputTokens;
        totalOutputTokens += usage.outputTokens;
        totalCachedTokens += usage.cachedTokens;
        totalThoughtsTokens += usage.thoughtsTokens;
        totalRequestCount += usage.requestCount;
      }
    }

    const cost = (
      totalInputTokens * this.PRICING.INPUT +
      totalOutputTokens * this.PRICING.OUTPUT +
      totalCachedTokens * this.PRICING.CACHED
    );

    return {
      inputTokens: totalInputTokens,
      outputTokens: totalOutputTokens,
      cachedTokens: totalCachedTokens,
      thoughtsTokens: totalThoughtsTokens,
      cost,
      requestCount: totalRequestCount,
    };
  }

  /**
   * 获取今日使用量
   */
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

  /**
   * 获取本月使用量
   */
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

  /**
   * 手动记录使用量（不支持）
   */
  async trackUsage(usage: Omit<UsageData, 'timestamp'>): Promise<void> {
    // Gemini 数据来自文件系统，无需手动记录
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
