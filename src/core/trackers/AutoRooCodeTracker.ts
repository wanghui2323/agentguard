/**
 * 自动化 Roo Code 追踪器
 * 从 VSCode 全局存储读取任务日志
 */

import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { BaseTracker, DailyUsage, MonthlyUsage, UsageData } from './BaseTracker';

interface RooCodeMessage {
  type: string;
  say?: string;
  text?: string;
  ts?: string;
}

interface RooCodeAPIRequest {
  tokensIn?: number;
  tokensOut?: number;
  cacheReads?: number;
  cacheWrites?: number;
  cost?: number;
  model?: string;
}

export class AutoRooCodeTracker extends BaseTracker {
  private readonly DATA_PATHS = {
    darwin: path.join(os.homedir(), 'Library', 'Application Support', 'Code', 'User', 'globalStorage', 'rooveterinaryinc.roo-cline', 'tasks'),
    win32: path.join(process.env.APPDATA || '', 'Code', 'User', 'globalStorage', 'rooveterinaryinc.roo-cline', 'tasks'),
    linux: path.join(os.homedir(), '.config', 'Code', 'User', 'globalStorage', 'rooveterinaryinc.roo-cline', 'tasks'),
  };

  // 也尝试 VSCode Server 路径
  private readonly SERVER_PATHS = {
    darwin: path.join(os.homedir(), '.vscode-server', 'data', 'User', 'globalStorage', 'rooveterinaryinc.roo-cline', 'tasks'),
    win32: path.join(os.homedir(), '.vscode-server', 'data', 'User', 'globalStorage', 'rooveterinaryinc.roo-cline', 'tasks'),
    linux: path.join(os.homedir(), '.vscode-server', 'data', 'User', 'globalStorage', 'rooveterinaryinc.roo-cline', 'tasks'),
  };

  private readonly PRICING = {
    INPUT: 3.00 / 1_000_000,
    OUTPUT: 15.00 / 1_000_000,
    CACHE_READ: 0.30 / 1_000_000,
    CACHE_WRITE: 3.75 / 1_000_000,
  };

  constructor() {
    super('roo-code', 'Roo Code');
  }

  /**
   * 获取 Roo Code 数据路径
   */
  private getDataPaths(): string[] {
    const platform = os.platform() as 'darwin' | 'win32' | 'linux';
    const paths = [
      this.DATA_PATHS[platform],
      this.SERVER_PATHS[platform],
    ];

    return paths.filter(p => fs.existsSync(p));
  }

  /**
   * 扫描所有任务目录
   */
  private getAllTaskDirs(): string[] {
    const dataPaths = this.getDataPaths();
    const taskDirs: string[] = [];

    for (const dataPath of dataPaths) {
      try {
        const entries = fs.readdirSync(dataPath, { withFileTypes: true });
        for (const entry of entries) {
          if (entry.isDirectory()) {
            const taskDir = path.join(dataPath, entry.name);
            taskDirs.push(taskDir);
          }
        }
      } catch (error) {
        console.warn(`[AutoRooCodeTracker] Failed to read ${dataPath}:`, error);
      }
    }

    return taskDirs;
  }

  /**
   * 解析单个任务目录的 ui_messages.json
   */
  private parseTaskMessages(taskDir: string, timeFilter?: Date): {
    inputTokens: number;
    outputTokens: number;
    cacheReadTokens: number;
    cacheWriteTokens: number;
    cost: number;
    requestCount: number;
  } {
    let inputTokens = 0;
    let outputTokens = 0;
    let cacheReadTokens = 0;
    let cacheWriteTokens = 0;
    let cost = 0;
    let requestCount = 0;

    const messagesFile = path.join(taskDir, 'ui_messages.json');
    if (!fs.existsSync(messagesFile)) {
      return { inputTokens, outputTokens, cacheReadTokens, cacheWriteTokens, cost, requestCount };
    }

    try {
      const content = fs.readFileSync(messagesFile, 'utf-8');
      const messages: RooCodeMessage[] = JSON.parse(content);

      for (const message of messages) {
        // 只处理 api_req_started 事件
        if (message.type === 'say' && message.say === 'api_req_started') {
          // 检查时间过滤
          if (timeFilter && message.ts) {
            const msgTime = new Date(message.ts);
            if (msgTime < timeFilter) {
              continue;
            }
          }

          // 解析 text 字段中的 JSON
          if (message.text) {
            try {
              const apiData: RooCodeAPIRequest = JSON.parse(message.text);

              inputTokens += apiData.tokensIn || 0;
              outputTokens += apiData.tokensOut || 0;
              cacheReadTokens += apiData.cacheReads || 0;
              cacheWriteTokens += apiData.cacheWrites || 0;

              if (apiData.cost) {
                cost += apiData.cost;
              }

              requestCount++;
            } catch (parseError) {
              // 忽略解析失败的消息
            }
          }
        }
      }
    } catch (error) {
      console.warn(`[AutoRooCodeTracker] Failed to parse ${messagesFile}:`, error);
    }

    return { inputTokens, outputTokens, cacheReadTokens, cacheWriteTokens, cost, requestCount };
  }

  /**
   * 汇总所有任务的使用量
   */
  private aggregateUsage(timeFilter?: Date): {
    inputTokens: number;
    outputTokens: number;
    cacheReadTokens: number;
    cacheWriteTokens: number;
    cost: number;
    requestCount: number;
  } {
    let totalInputTokens = 0;
    let totalOutputTokens = 0;
    let totalCacheReadTokens = 0;
    let totalCacheWriteTokens = 0;
    let totalCost = 0;
    let totalRequestCount = 0;

    const taskDirs = this.getAllTaskDirs();

    for (const taskDir of taskDirs) {
      const usage = this.parseTaskMessages(taskDir, timeFilter);
      totalInputTokens += usage.inputTokens;
      totalOutputTokens += usage.outputTokens;
      totalCacheReadTokens += usage.cacheReadTokens;
      totalCacheWriteTokens += usage.cacheWriteTokens;
      totalCost += usage.cost;
      totalRequestCount += usage.requestCount;
    }

    // 如果没有记录 cost，使用默认定价计算
    if (totalCost === 0 && (totalInputTokens > 0 || totalOutputTokens > 0)) {
      totalCost = (
        totalInputTokens * this.PRICING.INPUT +
        totalOutputTokens * this.PRICING.OUTPUT +
        totalCacheReadTokens * this.PRICING.CACHE_READ +
        totalCacheWriteTokens * this.PRICING.CACHE_WRITE
      );
    }

    return {
      inputTokens: totalInputTokens,
      outputTokens: totalOutputTokens,
      cacheReadTokens: totalCacheReadTokens,
      cacheWriteTokens: totalCacheWriteTokens,
      cost: totalCost,
      requestCount: totalRequestCount,
    };
  }

  /**
   * 获取今日使用量
   */
  async getDailyUsage(date: Date = new Date()): Promise<DailyUsage> {
    // 24小时前
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

    // 本月第一天
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
    // Roo Code 数据来自文件系统，无需手动记录
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
