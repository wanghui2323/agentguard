/**
 * Cursor 追踪器
 * 由于Cursor没有公开API，使用以下方案：
 * 1. 解析Cursor日志文件
 * 2. 本地追踪（拦截）
 */

import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { BaseTracker, DailyUsage, MonthlyUsage, UsageData } from './BaseTracker';
import { LocalStorageTracker } from './LocalStorageTracker';

interface CursorTrackerConfig {
  agentId: string;
  agentName: string;
  logPath?: string; // 自定义日志路径
  enableLocalTracking?: boolean;
}

export class CursorTracker extends BaseTracker {
  private config: CursorTrackerConfig;
  private localTracker: LocalStorageTracker;
  private cursorLogPath: string;

  // Cursor使用的模型定价（通常是Claude或GPT）
  private readonly PRICING = {
    // Claude模型
    'claude-3-5-sonnet': {
      input: 3.00 / 1_000_000,
      output: 15.00 / 1_000_000
    },
    // GPT-4模型
    'gpt-4': {
      input: 30.00 / 1_000_000,
      output: 60.00 / 1_000_000
    },
    'gpt-4-turbo': {
      input: 10.00 / 1_000_000,
      output: 30.00 / 1_000_000
    }
  };

  constructor(config: CursorTrackerConfig) {
    super(config.agentId, config.agentName);
    this.config = config;
    this.localTracker = new LocalStorageTracker(config.agentId, config.agentName);
    this.cursorLogPath = this.getCursorLogPath();
  }

  /**
   * 获取Cursor日志路径
   */
  private getCursorLogPath(): string {
    if (this.config.logPath) {
      return this.config.logPath;
    }

    const platform = os.platform();
    const homeDir = os.homedir();

    switch (platform) {
      case 'darwin': // macOS
        return path.join(homeDir, 'Library', 'Application Support', 'Cursor', 'logs');
      case 'win32': // Windows
        return path.join(process.env.APPDATA || '', 'Cursor', 'logs');
      case 'linux':
        return path.join(homeDir, '.config', 'Cursor', 'logs');
      default:
        console.warn(`[CursorTracker] Unsupported platform: ${platform}`);
        return '';
    }
  }

  /**
   * 解析Cursor日志
   * 注意：这是一个示例实现，实际日志格式需要根据Cursor的实际日志调整
   */
  private async parseCursorLogs(date: Date): Promise<UsageData[]> {
    const usageData: UsageData[] = [];

    if (!fs.existsSync(this.cursorLogPath)) {
      console.warn(`[CursorTracker] Log path not found: ${this.cursorLogPath}`);
      return usageData;
    }

    try {
      // 查找当天的日志文件
      const dateStr = this.formatDate(date);
      const logFiles = fs.readdirSync(this.cursorLogPath)
        .filter(file => file.includes(dateStr) || file.includes('main.log'));

      for (const logFile of logFiles) {
        const logPath = path.join(this.cursorLogPath, logFile);
        const content = fs.readFileSync(logPath, 'utf-8');
        const lines = content.split('\n');

        // 解析日志行
        // 示例格式：[2024-03-09 10:30:45] API call: model=claude-3-5-sonnet, input=150, output=300
        for (const line of lines) {
          const usage = this.parseLogLine(line, date);
          if (usage) {
            usageData.push(usage);
          }
        }
      }
    } catch (error) {
      console.error('[CursorTracker] Failed to parse logs:', error);
    }

    return usageData;
  }

  /**
   * 解析单行日志
   * 需要根据实际日志格式调整
   */
  private parseLogLine(line: string, date: Date): UsageData | null {
    // 这是一个示例正则，需要根据实际日志格式调整
    const apiCallPattern = /API call.*?input[=:](\d+).*?output[=:](\d+)/i;
    const modelPattern = /model[=:]([a-z0-9-]+)/i;

    const apiMatch = line.match(apiCallPattern);
    const modelMatch = line.match(modelPattern);

    if (apiMatch) {
      const inputTokens = parseInt(apiMatch[1], 10);
      const outputTokens = parseInt(apiMatch[2], 10);
      const model = modelMatch ? modelMatch[1] : 'claude-3-5-sonnet';

      const cost = this.calculateCost(inputTokens, outputTokens, model);

      return {
        inputTokens,
        outputTokens,
        cost,
        timestamp: date,
        model,
        metadata: { source: 'cursor-log' }
      };
    }

    return null;
  }

  calculateCost(inputTokens: number, outputTokens: number, model: string = 'claude-3-5-sonnet'): number {
    const pricing = this.PRICING[model as keyof typeof this.PRICING] || this.PRICING['claude-3-5-sonnet'];
    return (inputTokens * pricing.input) + (outputTokens * pricing.output);
  }

  async trackUsage(usage: Omit<UsageData, 'timestamp'>): Promise<void> {
    if (this.config.enableLocalTracking !== false) {
      await this.localTracker.trackUsage(usage);
    }
  }

  async getDailyUsage(date: Date = new Date()): Promise<DailyUsage> {
    // 先尝试从日志解析
    const logData = await this.parseCursorLogs(date);

    if (logData.length > 0) {
      return {
        date: this.formatDate(date),
        totalCost: logData.reduce((sum, d) => sum + d.cost, 0),
        totalInputTokens: logData.reduce((sum, d) => sum + d.inputTokens, 0),
        totalOutputTokens: logData.reduce((sum, d) => sum + d.outputTokens, 0),
        requestCount: logData.length
      };
    }

    // 回退到本地追踪数据
    return await this.localTracker.getDailyUsage(date);
  }

  async getMonthlyUsage(month?: string): Promise<MonthlyUsage> {
    // Cursor没有月度API，使用本地数据
    return await this.localTracker.getMonthlyUsage(month);
  }

  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}
