/**
 * 自动化 Kimi CLI 追踪器
 * 从 ~/.kimi/sessions/ 读取 wire.jsonl
 */

import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import * as readline from 'readline';
import { BaseTracker, DailyUsage, MonthlyUsage, UsageData } from './BaseTracker';

interface KimiStatusUpdate {
  timestamp: number;
  message?: {
    type: string;
    payload?: {
      token_usage?: {
        input_other?: number;
        output?: number;
        input_cache_read?: number;
        input_cache_creation?: number;
      };
    };
  };
}

export class AutoKimiTracker extends BaseTracker {
  private readonly SESSION_DIR = path.join(os.homedir(), '.kimi', 'sessions');

  private readonly PRICING = {
    INPUT: 0.25 / 1_000_000,     // Kimi pricing (Moonshot)
    OUTPUT: 1.00 / 1_000_000,
    CACHE_READ: 0.0625 / 1_000_000,
    CACHE_WRITE: 0.3125 / 1_000_000,
  };

  constructor() {
    super('kimi', 'Kimi CLI');
  }

  private getWireFiles(): string[] {
    if (!fs.existsSync(this.SESSION_DIR)) {
      return [];
    }

    const wires: string[] = [];
    try {
      const groups = fs.readdirSync(this.SESSION_DIR, { withFileTypes: true });
      for (const group of groups) {
        if (!group.isDirectory()) continue;

        const groupPath = path.join(this.SESSION_DIR, group.name);
        const sessions = fs.readdirSync(groupPath, { withFileTypes: true });

        for (const session of sessions) {
          if (!session.isDirectory()) continue;

          const wirePath = path.join(groupPath, session.name, 'wire.jsonl');
          if (fs.existsSync(wirePath)) {
            wires.push(wirePath);
          }
        }
      }
    } catch (error) {
      console.warn('[AutoKimiTracker] Failed to scan sessions:', error);
    }

    return wires;
  }

  private async parseWireFile(filePath: string, timeFilter?: Date): Promise<{
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
      const rl = readline.createInterface({input: fileStream, crlfDelay: Infinity});

      for await (const line of rl) {
        if (!line.trim()) continue;

        try {
          const entry: KimiStatusUpdate = JSON.parse(line);

          if (timeFilter && entry.timestamp) {
            const msgTime = new Date(entry.timestamp * 1000);
            if (msgTime < timeFilter) continue;
          }

          if (entry.message?.type === 'StatusUpdate' && entry.message.payload?.token_usage) {
            const usage = entry.message.payload.token_usage;

            inputTokens += usage.input_other || 0;
            outputTokens += usage.output || 0;
            cacheReadTokens += usage.input_cache_read || 0;
            cacheWriteTokens += usage.input_cache_creation || 0;

            requestCount++;
          }
        } catch (parseError) {}
      }
    } catch (error) {
      console.warn(`[AutoKimiTracker] Failed to parse ${filePath}:`, error);
    }

    return { inputTokens, outputTokens, cacheReadTokens, cacheWriteTokens, requestCount };
  }

  private async aggregateUsage(timeFilter?: Date) {
    const wires = this.getWireFiles();
    let totalInput = 0, totalOutput = 0, totalCacheRead = 0, totalCacheWrite = 0, totalCount = 0;

    for (const wire of wires) {
      if (timeFilter) {
        const stats = fs.statSync(wire);
        if (stats.mtime < timeFilter) continue;
      }

      const usage = await this.parseWireFile(wire, timeFilter);
      totalInput += usage.inputTokens;
      totalOutput += usage.outputTokens;
      totalCacheRead += usage.cacheReadTokens;
      totalCacheWrite += usage.cacheWriteTokens;
      totalCount += usage.requestCount;
    }

    const cost = (
      totalInput * this.PRICING.INPUT +
      totalOutput * this.PRICING.OUTPUT +
      totalCacheRead * this.PRICING.CACHE_READ +
      totalCacheWrite * this.PRICING.CACHE_WRITE
    );

    return { inputTokens: totalInput, outputTokens: totalOutput, cost, requestCount: totalCount };
  }

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

  async trackUsage(usage: Omit<UsageData, 'timestamp'>): Promise<void> {}

  private formatDate(date: Date): string {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  }

  private formatMonth(date: Date): string {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
  }
}
