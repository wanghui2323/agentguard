/**
 * 自动化 OpenClaw 追踪器
 * 支持两种数据源：
 * 1. Anthropic Payload 日志（需启用 OPENCLAW_ANTHROPIC_PAYLOAD_LOG=1）
 * 2. 会话文件解析（默认启用，无需配置）
 */

import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { BaseTracker, DailyUsage, MonthlyUsage, UsageData } from './BaseTracker';

interface OpenClawUsage {
  inputTokens: number;
  outputTokens: number;
  cacheCreationTokens: number;
  cacheReadTokens: number;
  requestCount: number;
}

export class AutoOpenClawTracker extends BaseTracker {
  private readonly PRICING = {
    // Claude Opus 4 定价（OpenClaw 常用模型）
    INPUT: 15.00 / 1_000_000,
    OUTPUT: 75.00 / 1_000_000,
    CACHE_WRITE: 18.75 / 1_000_000,
    CACHE_READ: 1.50 / 1_000_000,
  };

  private readonly STATE_DIR_PATHS = [
    path.join(os.homedir(), '.openclaw'),
    path.join(os.homedir(), '.clawdbot'),  // 旧版兼容
    path.join(os.homedir(), '.moldbot'),   // 旧版兼容
  ];

  constructor() {
    super('openclaw', 'OpenClaw');
  }

  /**
   * 自动探测 OpenClaw 状态目录
   */
  private findStateDir(): string | null {
    // 优先使用环境变量
    if (process.env.OPENCLAW_STATE_DIR && fs.existsSync(process.env.OPENCLAW_STATE_DIR)) {
      return process.env.OPENCLAW_STATE_DIR;
    }

    // 遍历默认路径
    for (const dir of this.STATE_DIR_PATHS) {
      if (fs.existsSync(dir)) {
        return dir;
      }
    }

    return null;
  }

  /**
   * 解析 Anthropic Payload 日志（方案1 - 推荐）
   */
  private parsePayloadLog(timeFilter?: Date): OpenClawUsage {
    const stateDir = this.findStateDir();
    if (!stateDir) {
      return { inputTokens: 0, outputTokens: 0, cacheCreationTokens: 0, cacheReadTokens: 0, requestCount: 0 };
    }

    const logPath = path.join(stateDir, 'logs', 'anthropic-payload.jsonl');

    if (!fs.existsSync(logPath)) {
      // 日志未启用，降级到会话文件解析
      return this.parseSessionFiles(timeFilter);
    }

    const usage: OpenClawUsage = {
      inputTokens: 0,
      outputTokens: 0,
      cacheCreationTokens: 0,
      cacheReadTokens: 0,
      requestCount: 0,
    };

    try {
      const content = fs.readFileSync(logPath, 'utf-8');
      const lines = content.trim().split('\n');

      for (const line of lines) {
        try {
          const entry = JSON.parse(line);

          // 时间过滤
          if (timeFilter && entry.ts) {
            const entryTime = new Date(entry.ts);
            if (entryTime < timeFilter) continue;
          }

          // 只处理 usage 记录
          if (entry.stage === 'usage' && entry.usage) {
            const usageData = entry.usage;

            usage.inputTokens += usageData.input_tokens || usageData.input || 0;
            usage.outputTokens += usageData.output_tokens || usageData.output || 0;
            usage.cacheCreationTokens += usageData.cache_creation_input_tokens || usageData.cacheWrite || 0;
            usage.cacheReadTokens += usageData.cache_read_input_tokens || usageData.cacheRead || 0;
            usage.requestCount++;
          }
        } catch {
          continue;
        }
      }
    } catch {
      // 文件读取失败，降级到会话文件解析
      return this.parseSessionFiles(timeFilter);
    }

    return usage;
  }

  /**
   * 解析会话文件（方案2 - 备选）
   */
  private parseSessionFiles(timeFilter?: Date): OpenClawUsage {
    const stateDir = this.findStateDir();
    if (!stateDir) {
      return { inputTokens: 0, outputTokens: 0, cacheCreationTokens: 0, cacheReadTokens: 0, requestCount: 0 };
    }

    const usage: OpenClawUsage = {
      inputTokens: 0,
      outputTokens: 0,
      cacheCreationTokens: 0,
      cacheReadTokens: 0,
      requestCount: 0,
    };

    const agentsDir = path.join(stateDir, 'agents');
    if (!fs.existsSync(agentsDir)) {
      return usage;
    }

    try {
      const agents = fs.readdirSync(agentsDir);

      for (const agentId of agents) {
        const sessionsDir = path.join(agentsDir, agentId, 'sessions');
        if (!fs.existsSync(sessionsDir)) continue;

        const files = fs.readdirSync(sessionsDir).filter(f => f.endsWith('.jsonl'));

        for (const file of files) {
          const filePath = path.join(sessionsDir, file);
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

              // 从 message 中提取 usage
              const usageData = entry.message?.usage || entry.usage;

              if (usageData) {
                usage.inputTokens += usageData.input_tokens || usageData.input || 0;
                usage.outputTokens += usageData.output_tokens || usageData.output || 0;
                usage.cacheCreationTokens += usageData.cache_creation_input_tokens || usageData.cacheWrite || 0;
                usage.cacheReadTokens += usageData.cache_read_input_tokens || usageData.cacheRead || 0;
                usage.requestCount++;
              }
            } catch {
              continue;
            }
          }
        }
      }
    } catch {
      // 遍历失败，返回空数据
    }

    return usage;
  }

  /**
   * 计算成本
   */
  private calculateCost(usage: OpenClawUsage): number {
    return (
      usage.inputTokens * this.PRICING.INPUT +
      usage.outputTokens * this.PRICING.OUTPUT +
      usage.cacheCreationTokens * this.PRICING.CACHE_WRITE +
      usage.cacheReadTokens * this.PRICING.CACHE_READ
    );
  }

  /**
   * 获取今日使用量（最近24小时）
   */
  async getDailyUsage(date: Date = new Date()): Promise<DailyUsage> {
    const last24h = new Date(date.getTime() - 24 * 60 * 60 * 1000);
    const usage = this.parsePayloadLog(last24h);
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

    const startOfMonth = new Date(year, monthNum - 1, 1);
    const usage = this.parsePayloadLog(startOfMonth);
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
   * 手动记录使用量
   */
  async trackUsage(usage: Omit<UsageData, 'timestamp'>): Promise<void> {
    // 数据来自自动扫描，无需手动记录
  }

  /**
   * 检查 Anthropic Payload 日志是否已启用
   */
  isPayloadLogEnabled(): boolean {
    const stateDir = this.findStateDir();
    if (!stateDir) return false;

    const logPath = path.join(stateDir, 'logs', 'anthropic-payload.jsonl');
    return fs.existsSync(logPath);
  }

  /**
   * 获取状态信息
   */
  getStatus(): {
    detected: boolean;
    stateDir: string | null;
    payloadLogEnabled: boolean;
    dataSource: 'payload-log' | 'session-files' | 'none';
  } {
    const stateDir = this.findStateDir();
    const payloadLogEnabled = this.isPayloadLogEnabled();

    return {
      detected: stateDir !== null,
      stateDir,
      payloadLogEnabled,
      dataSource: payloadLogEnabled ? 'payload-log' : stateDir ? 'session-files' : 'none',
    };
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
