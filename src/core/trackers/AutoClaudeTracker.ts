/**
 * 自动化 Claude Code 追踪器
 * 自动探测并解析本地 session 日志，无需任何配置
 */

import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { BaseTracker, DailyUsage, MonthlyUsage, UsageData } from './BaseTracker';

interface ClaudeCodeUsage {
  inputTokens: number;
  outputTokens: number;
  cacheCreationTokens: number;
  cacheReadTokens: number;
  requestCount: number;
}

export class AutoClaudeTracker extends BaseTracker {
  private readonly PRICING = {
    INPUT: 3.00 / 1_000_000,
    OUTPUT: 15.00 / 1_000_000,
    CACHE_WRITE: 3.75 / 1_000_000,
    CACHE_READ: 0.30 / 1_000_000,
  };

  constructor() {
    super('claude-code', 'Claude Code');
  }

  /**
   * 自动探测 Claude Code 日志目录
   */
  private findClaudeProjectDirs(): string[] {
    const claudeRoot = path.join(os.homedir(), '.claude', 'projects');

    if (!fs.existsSync(claudeRoot)) {
      return [];
    }

    try {
      return fs.readdirSync(claudeRoot)
        .map(dir => path.join(claudeRoot, dir))
        .filter(dir => {
          try {
            return fs.statSync(dir).isDirectory();
          } catch {
            return false;
          }
        });
    } catch {
      return [];
    }
  }

  /**
   * 解析单个 JSONL 文件
   */
  private parseJSONLFile(filePath: string, timeFilter?: Date): ClaudeCodeUsage {
    const usage: ClaudeCodeUsage = {
      inputTokens: 0,
      outputTokens: 0,
      cacheCreationTokens: 0,
      cacheReadTokens: 0,
      requestCount: 0,
    };

    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      const lines = content.trim().split('\n');

      for (const line of lines) {
        try {
          const entry = JSON.parse(line);

          // 时间过滤
          if (timeFilter && entry.timestamp) {
            const entryTime = new Date(entry.timestamp);
            if (entryTime < timeFilter) continue;
          }

          // 提取 usage 数据（在 message 字段中）
          const usageData = entry.message?.usage || entry.usage;

          if (usageData) {
            usage.inputTokens += usageData.input_tokens || 0;
            usage.outputTokens += usageData.output_tokens || 0;
            usage.cacheCreationTokens += usageData.cache_creation_input_tokens || 0;
            usage.cacheReadTokens += usageData.cache_read_input_tokens || 0;
            usage.requestCount++;
          }
        } catch {
          // 跳过无法解析的行
          continue;
        }
      }
    } catch {
      // 文件读取失败，返回空数据
    }

    return usage;
  }

  /**
   * 扫描所有项目目录，聚合 usage 数据
   */
  private scanAllProjects(timeFilter?: Date): ClaudeCodeUsage {
    const projectDirs = this.findClaudeProjectDirs();

    const total: ClaudeCodeUsage = {
      inputTokens: 0,
      outputTokens: 0,
      cacheCreationTokens: 0,
      cacheReadTokens: 0,
      requestCount: 0,
    };

    for (const projectDir of projectDirs) {
      try {
        const files = fs.readdirSync(projectDir).filter(f => f.endsWith('.jsonl'));

        for (const file of files) {
          const filePath = path.join(projectDir, file);
          const usage = this.parseJSONLFile(filePath, timeFilter);

          total.inputTokens += usage.inputTokens;
          total.outputTokens += usage.outputTokens;
          total.cacheCreationTokens += usage.cacheCreationTokens;
          total.cacheReadTokens += usage.cacheReadTokens;
          total.requestCount += usage.requestCount;
        }
      } catch {
        // 跳过无法访问的目录
        continue;
      }
    }

    return total;
  }

  /**
   * 计算成本
   */
  private calculateCost(usage: ClaudeCodeUsage): number {
    return (
      usage.inputTokens * this.PRICING.INPUT +
      usage.outputTokens * this.PRICING.OUTPUT +
      usage.cacheCreationTokens * this.PRICING.CACHE_WRITE +
      usage.cacheReadTokens * this.PRICING.CACHE_READ
    );
  }

  /**
   * 获取今日使用量（自动扫描最近24小时）
   */
  async getDailyUsage(date: Date = new Date()): Promise<DailyUsage> {
    const last24h = new Date(date.getTime() - 24 * 60 * 60 * 1000);
    const usage = this.scanAllProjects(last24h);
    const cost = this.calculateCost(usage);

    return {
      date: this.formatDate(date),
      totalCost: cost,
      totalInputTokens: usage.inputTokens + usage.cacheCreationTokens,
      totalOutputTokens: usage.outputTokens,
      requestCount: usage.requestCount,
    };
  }

  /**
   * 获取本月使用量
   */
  async getMonthlyUsage(month?: string): Promise<MonthlyUsage> {
    const targetMonth = month || this.formatMonth(new Date());
    const [year, monthNum] = targetMonth.split('-').map(Number);

    // 月初
    const startOfMonth = new Date(year, monthNum - 1, 1);
    const usage = this.scanAllProjects(startOfMonth);
    const cost = this.calculateCost(usage);

    return {
      month: targetMonth,
      totalCost: cost,
      totalInputTokens: usage.inputTokens + usage.cacheCreationTokens,
      totalOutputTokens: usage.outputTokens,
      requestCount: usage.requestCount,
    };
  }

  /**
   * 手动记录使用量（用于外部调用）
   */
  async trackUsage(usage: Omit<UsageData, 'timestamp'>): Promise<void> {
    // 此方法留空，因为数据来自自动扫描
    // 如需手动记录，可在此实现
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
