/**
 * 自动化 Qwen CLI 追踪器
 * 从 ~/.qwen/projects/ 目录读取
 */

import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import * as readline from 'readline';
import { BaseTracker, DailyUsage, MonthlyUsage, UsageData } from './BaseTracker';

interface QwenMessage {
  type: string;
  model?: string;
  timestamp?: string;
  sessionId?: string;
  usageMetadata?: {
    promptTokenCount?: number;
    candidatesTokenCount?: number;
    thoughtsTokenCount?: number;
    cachedContentTokenCount?: number;
  };
}

export class AutoQwenTracker extends BaseTracker {
  private readonly PROJECT_DIR = path.join(os.homedir(), '.qwen', 'projects');

  private readonly PRICING = {
    INPUT: 0.50 / 1_000_000,     // Qwen pricing
    OUTPUT: 2.00 / 1_000_000,
    CACHED: 0.125 / 1_000_000,
  };

  constructor() {
    super('qwen', 'Qwen CLI');
  }

  private getChatFiles(): string[] {
    if (!fs.existsSync(this.PROJECT_DIR)) {
      return [];
    }

    const files: string[] = [];
    try {
      const projects = fs.readdirSync(this.PROJECT_DIR, { withFileTypes: true });
      for (const project of projects) {
        if (!project.isDirectory()) continue;

        const chatsDir = path.join(this.PROJECT_DIR, project.name, 'chats');
        if (!fs.existsSync(chatsDir)) continue;

        const chats = fs.readdirSync(chatsDir);
        for (const chat of chats) {
          if (chat.endsWith('.jsonl')) {
            files.push(path.join(chatsDir, chat));
          }
        }
      }
    } catch (error) {
      console.warn('[AutoQwenTracker] Failed to scan projects:', error);
    }

    return files;
  }

  private async parseJSONLFile(filePath: string, timeFilter?: Date) {
    let inputTokens = 0, outputTokens = 0, cachedTokens = 0, requestCount = 0;

    try {
      const fileStream = fs.createReadStream(filePath);
      const rl = readline.createInterface({input: fileStream, crlfDelay: Infinity});

      for await (const line of rl) {
        if (!line.trim()) continue;

        try {
          const entry: QwenMessage = JSON.parse(line);

          if (timeFilter && entry.timestamp) {
            const msgTime = new Date(entry.timestamp);
            if (msgTime < timeFilter) continue;
          }

          if (entry.usageMetadata) {
            const usage = entry.usageMetadata;

            inputTokens += usage.promptTokenCount || 0;
            outputTokens += usage.candidatesTokenCount || 0;
            cachedTokens += usage.cachedContentTokenCount || 0;

            requestCount++;
          }
        } catch (parseError) {}
      }
    } catch (error) {
      console.warn(`[AutoQwenTracker] Failed to parse ${filePath}:`, error);
    }

    return { inputTokens, outputTokens, cachedTokens, requestCount };
  }

  private async aggregateUsage(timeFilter?: Date) {
    const files = this.getChatFiles();
    let totalInput = 0, totalOutput = 0, totalCached = 0, totalCount = 0;

    for (const file of files) {
      if (timeFilter) {
        const stats = fs.statSync(file);
        if (stats.mtime < timeFilter) continue;
      }

      const usage = await this.parseJSONLFile(file, timeFilter);
      totalInput += usage.inputTokens;
      totalOutput += usage.outputTokens;
      totalCached += usage.cachedTokens;
      totalCount += usage.requestCount;
    }

    const cost = (
      totalInput * this.PRICING.INPUT +
      totalOutput * this.PRICING.OUTPUT +
      totalCached * this.PRICING.CACHED
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
