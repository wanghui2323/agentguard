/**
 * 自动化 OpenCode 追踪器
 * 从 SQLite 数据库或 legacy JSON 文件读取
 */

import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { BaseTracker, DailyUsage, MonthlyUsage, UsageData } from './BaseTracker';

interface OpenCodeMessage {
  id: string;
  role: string;
  modelID?: string;
  providerID?: string;
  tokens?: {
    input: number;
    output: number;
    reasoning?: number;
    cache?: {
      read: number;
      write: number;
    };
  };
  time?: {
    created: number;
  };
}

export class AutoOpenCodeTracker extends BaseTracker {
  private readonly DATA_DIR = path.join(os.homedir(), '.local', 'share', 'opencode');
  private readonly DB_PATH = path.join(this.DATA_DIR, 'opencode.db');
  private readonly LEGACY_STORAGE = path.join(this.DATA_DIR, 'storage', 'message');

  private readonly PRICING = {
    INPUT: 3.00 / 1_000_000,
    OUTPUT: 15.00 / 1_000_000,
    CACHE_READ: 0.30 / 1_000_000,
    CACHE_WRITE: 3.75 / 1_000_000,
  };

  constructor() {
    super('opencode', 'OpenCode');
  }

  /**
   * 从 SQLite 数据库读取（v1.2+）
   */
  private readFromDatabase(timeFilter?: Date): {
    inputTokens: number;
    outputTokens: number;
    cacheReadTokens: number;
    cacheWriteTokens: number;
    reasoningTokens: number;
    requestCount: number;
  } {
    let inputTokens = 0;
    let outputTokens = 0;
    let cacheReadTokens = 0;
    let cacheWriteTokens = 0;
    let reasoningTokens = 0;
    let requestCount = 0;

    if (!fs.existsSync(this.DB_PATH)) {
      return { inputTokens, outputTokens, cacheReadTokens, cacheWriteTokens, reasoningTokens, requestCount };
    }

    try {
      const Database = require('better-sqlite3');
      const db = new Database(this.DB_PATH, { readonly: true });

      // 查询消息表
      let query = "SELECT * FROM messages WHERE role = 'assistant'";
      if (timeFilter) {
        const timestamp = timeFilter.getTime();
        query += ` AND created_at >= ${timestamp}`;
      }

      const rows = db.prepare(query).all();

      for (const row of rows) {
        try {
          // 解析 tokens JSON 字段
          const tokens = row.tokens ? JSON.parse(row.tokens) : null;

          if (tokens) {
            inputTokens += tokens.input || 0;
            outputTokens += tokens.output || 0;
            reasoningTokens += tokens.reasoning || 0;

            if (tokens.cache) {
              cacheReadTokens += tokens.cache.read || 0;
              cacheWriteTokens += tokens.cache.write || 0;
            }

            requestCount++;
          }
        } catch (parseError) {
          // 忽略解析失败的行
        }
      }

      db.close();
    } catch (error) {
      console.warn('[AutoOpenCodeTracker] Failed to read SQLite database:', error);
    }

    return { inputTokens, outputTokens, cacheReadTokens, cacheWriteTokens, reasoningTokens, requestCount };
  }

  /**
   * 从 Legacy JSON 文件读取（v1.2 之前）
   */
  private readFromLegacyFiles(timeFilter?: Date): {
    inputTokens: number;
    outputTokens: number;
    cacheReadTokens: number;
    cacheWriteTokens: number;
    reasoningTokens: number;
    requestCount: number;
  } {
    let inputTokens = 0;
    let outputTokens = 0;
    let cacheReadTokens = 0;
    let cacheWriteTokens = 0;
    let reasoningTokens = 0;
    let requestCount = 0;

    if (!fs.existsSync(this.LEGACY_STORAGE)) {
      return { inputTokens, outputTokens, cacheReadTokens, cacheWriteTokens, reasoningTokens, requestCount };
    }

    try {
      // 遍历所有 session 目录
      const sessionDirs = fs.readdirSync(this.LEGACY_STORAGE, { withFileTypes: true });

      for (const sessionDir of sessionDirs) {
        if (!sessionDir.isDirectory()) continue;

        const sessionPath = path.join(this.LEGACY_STORAGE, sessionDir.name);
        const files = fs.readdirSync(sessionPath);

        for (const file of files) {
          if (!file.endsWith('.json')) continue;

          const filePath = path.join(sessionPath, file);

          // 检查文件修改时间
          if (timeFilter) {
            const stats = fs.statSync(filePath);
            if (stats.mtime < timeFilter) {
              continue;
            }
          }

          try {
            const content = fs.readFileSync(filePath, 'utf-8');
            const message: OpenCodeMessage = JSON.parse(content);

            if (message.role === 'assistant' && message.tokens) {
              inputTokens += message.tokens.input || 0;
              outputTokens += message.tokens.output || 0;
              reasoningTokens += message.tokens.reasoning || 0;

              if (message.tokens.cache) {
                cacheReadTokens += message.tokens.cache.read || 0;
                cacheWriteTokens += message.tokens.cache.write || 0;
              }

              requestCount++;
            }
          } catch (parseError) {
            // 忽略解析失败的文件
          }
        }
      }
    } catch (error) {
      console.warn('[AutoOpenCodeTracker] Failed to read legacy files:', error);
    }

    return { inputTokens, outputTokens, cacheReadTokens, cacheWriteTokens, reasoningTokens, requestCount };
  }

  /**
   * 汇总使用量（优先 SQLite，降级到 Legacy）
   */
  private aggregateUsage(timeFilter?: Date): {
    inputTokens: number;
    outputTokens: number;
    cacheReadTokens: number;
    cacheWriteTokens: number;
    reasoningTokens: number;
    cost: number;
    requestCount: number;
  } {
    // 优先尝试 SQLite
    let usage = this.readFromDatabase(timeFilter);

    // 如果没有数据，尝试 Legacy 文件
    if (usage.requestCount === 0) {
      usage = this.readFromLegacyFiles(timeFilter);
    }

    const cost = (
      usage.inputTokens * this.PRICING.INPUT +
      usage.outputTokens * this.PRICING.OUTPUT +
      usage.cacheReadTokens * this.PRICING.CACHE_READ +
      usage.cacheWriteTokens * this.PRICING.CACHE_WRITE
    );

    return {
      ...usage,
      cost,
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
    // OpenCode 数据来自文件系统，无需手动记录
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
