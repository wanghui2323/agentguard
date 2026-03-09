/**
 * 自动化 Kilo 追踪器
 * 从 VSCode globalStorage 读取（同 Roo Code）
 */

import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { BaseTracker, DailyUsage, MonthlyUsage, UsageData } from './BaseTracker';

interface KiloMessage {
  type: string;
  say?: string;
  text?: string;
  ts?: string;
}

interface KiloAPIRequest {
  tokensIn?: number;
  tokensOut?: number;
  cacheReads?: number;
  cacheWrites?: number;
  cost?: number;
}

export class AutoKiloTracker extends BaseTracker {
  private readonly DATA_PATHS = {
    darwin: path.join(os.homedir(), 'Library', 'Application Support', 'Code', 'User', 'globalStorage', 'kilocode.kilo-code', 'tasks'),
    win32: path.join(process.env.APPDATA || '', 'Code', 'User', 'globalStorage', 'kilocode.kilo-code', 'tasks'),
    linux: path.join(os.homedir(), '.config', 'Code', 'User', 'globalStorage', 'kilocode.kilo-code', 'tasks'),
  };

  private readonly SERVER_PATHS = {
    darwin: path.join(os.homedir(), '.vscode-server', 'data', 'User', 'globalStorage', 'kilocode.kilo-code', 'tasks'),
    win32: path.join(os.homedir(), '.vscode-server', 'data', 'User', 'globalStorage', 'kilocode.kilo-code', 'tasks'),
    linux: path.join(os.homedir(), '.vscode-server', 'data', 'User', 'globalStorage', 'kilocode.kilo-code', 'tasks'),
  };

  private readonly PRICING = {
    INPUT: 3.00 / 1_000_000,
    OUTPUT: 15.00 / 1_000_000,
    CACHE_READ: 0.30 / 1_000_000,
    CACHE_WRITE: 3.75 / 1_000_000,
  };

  constructor() {
    super('kilo', 'Kilo');
  }

  private getDataPaths(): string[] {
    const platform = os.platform() as 'darwin' | 'win32' | 'linux';
    return [this.DATA_PATHS[platform], this.SERVER_PATHS[platform]].filter(p => fs.existsSync(p));
  }

  private getAllTaskDirs(): string[] {
    const dataPaths = this.getDataPaths();
    const taskDirs: string[] = [];

    for (const dataPath of dataPaths) {
      try {
        const entries = fs.readdirSync(dataPath, { withFileTypes: true });
        for (const entry of entries) {
          if (entry.isDirectory()) {
            taskDirs.push(path.join(dataPath, entry.name));
          }
        }
      } catch (error) {}
    }

    return taskDirs;
  }

  private parseTaskMessages(taskDir: string, timeFilter?: Date) {
    let inputTokens = 0, outputTokens = 0, cacheReadTokens = 0, cacheWriteTokens = 0, cost = 0, requestCount = 0;

    const messagesFile = path.join(taskDir, 'ui_messages.json');
    if (!fs.existsSync(messagesFile)) {
      return { inputTokens, outputTokens, cacheReadTokens, cacheWriteTokens, cost, requestCount };
    }

    try {
      const content = fs.readFileSync(messagesFile, 'utf-8');
      const messages: KiloMessage[] = JSON.parse(content);

      for (const message of messages) {
        if (message.type === 'say' && message.say === 'api_req_started') {
          if (timeFilter && message.ts) {
            const msgTime = new Date(message.ts);
            if (msgTime < timeFilter) continue;
          }

          if (message.text) {
            try {
              const apiData: KiloAPIRequest = JSON.parse(message.text);

              inputTokens += apiData.tokensIn || 0;
              outputTokens += apiData.tokensOut || 0;
              cacheReadTokens += apiData.cacheReads || 0;
              cacheWriteTokens += apiData.cacheWrites || 0;

              if (apiData.cost) {
                cost += apiData.cost;
              }

              requestCount++;
            } catch (parseError) {}
          }
        }
      }
    } catch (error) {}

    return { inputTokens, outputTokens, cacheReadTokens, cacheWriteTokens, cost, requestCount };
  }

  private aggregateUsage(timeFilter?: Date) {
    const taskDirs = this.getAllTaskDirs();
    let totalInput = 0, totalOutput = 0, totalCacheRead = 0, totalCacheWrite = 0, totalCost = 0, totalCount = 0;

    for (const taskDir of taskDirs) {
      const usage = this.parseTaskMessages(taskDir, timeFilter);
      totalInput += usage.inputTokens;
      totalOutput += usage.outputTokens;
      totalCacheRead += usage.cacheReadTokens;
      totalCacheWrite += usage.cacheWriteTokens;
      totalCost += usage.cost;
      totalCount += usage.requestCount;
    }

    if (totalCost === 0 && (totalInput > 0 || totalOutput > 0)) {
      totalCost = (
        totalInput * this.PRICING.INPUT +
        totalOutput * this.PRICING.OUTPUT +
        totalCacheRead * this.PRICING.CACHE_READ +
        totalCacheWrite * this.PRICING.CACHE_WRITE
      );
    }

    return { inputTokens: totalInput, outputTokens: totalOutput, cost: totalCost, requestCount: totalCount };
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
