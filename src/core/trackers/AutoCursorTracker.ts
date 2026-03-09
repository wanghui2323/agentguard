/**
 * 自动化 Cursor 追踪器
 * 从 SQLite 读取 token，调用 API 获取使用数据
 */

import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { BaseTracker, DailyUsage, MonthlyUsage, UsageData } from './BaseTracker';

interface CursorUsageResponse {
  membershipType: string;
  billingCycleEnd: string;
  individualUsage: {
    plan: {
      enabled: boolean;
      used: number;
      limit: number;
    };
    onDemand: {
      enabled: boolean;
      used: number;
      limit: number;
    };
  };
}

export class AutoCursorTracker extends BaseTracker {
  private readonly DB_PATHS = {
    darwin: path.join(os.homedir(), 'Library', 'Application Support', 'Cursor', 'User', 'globalStorage', 'state.vscdb'),
    win32: path.join(process.env.APPDATA || '', 'Cursor', 'User', 'globalStorage', 'state.vscdb'),
    linux: path.join(os.homedir(), '.config', 'Cursor', 'User', 'globalStorage', 'state.vscdb'),
  };

  // Cursor 的定价估算（根据 Anthropic 价格）
  private readonly PRICING = {
    INPUT: 3.00 / 1_000_000,
    OUTPUT: 15.00 / 1_000_000,
  };

  constructor() {
    super('cursor', 'Cursor');
  }

  /**
   * 获取 Cursor SQLite 数据库路径
   */
  private getDBPath(): string | null {
    const platform = os.platform() as 'darwin' | 'win32' | 'linux';
    const dbPath = this.DB_PATHS[platform];

    if (dbPath && fs.existsSync(dbPath)) {
      return dbPath;
    }

    return null;
  }

  /**
   * 从 SQLite 读取 access token
   */
  private async readAccessToken(): Promise<string | null> {
    const dbPath = this.getDBPath();
    if (!dbPath) return null;

    try {
      // 使用 better-sqlite3 读取（需要安装依赖）
      const Database = require('better-sqlite3');
      const db = new Database(dbPath, { readonly: true });

      const row = db.prepare("SELECT value FROM ItemTable WHERE key = 'cursorAuth/accessToken'").get();
      db.close();

      return row?.value || null;
    } catch (error) {
      console.warn('[AutoCursorTracker] Failed to read token from SQLite:', error);
      return null;
    }
  }

  /**
   * 调用 Cursor API 获取使用数据
   */
  private async fetchUsageFromAPI(accessToken: string): Promise<CursorUsageResponse | null> {
    try {
      // 从 SQLite 中的 token 需要解析出 userId
      // Token 格式: {userId}::{accessToken}
      const response = await fetch('https://cursor.com/api/usage-summary', {
        headers: {
          Cookie: `WorkosCursorSessionToken=${accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      return await response.json() as CursorUsageResponse;
    } catch (error) {
      console.warn('[AutoCursorTracker] API call failed:', error);
      return null;
    }
  }

  /**
   * 将 API 的请求数转换为估算的 token 数和成本
   */
  private estimateTokensFromRequests(requests: number): { inputTokens: number; outputTokens: number; cost: number } {
    // 根据经验估算：每个请求平均 2000 input + 1000 output tokens
    const avgInputPerRequest = 2000;
    const avgOutputPerRequest = 1000;

    const inputTokens = requests * avgInputPerRequest;
    const outputTokens = requests * avgOutputPerRequest;
    const cost = (inputTokens * this.PRICING.INPUT) + (outputTokens * this.PRICING.OUTPUT);

    return { inputTokens, outputTokens, cost };
  }

  /**
   * 获取今日使用量
   */
  async getDailyUsage(date: Date = new Date()): Promise<DailyUsage> {
    const accessToken = await this.readAccessToken();

    if (!accessToken) {
      // 无法获取 token，返回空数据
      return {
        date: this.formatDate(date),
        totalCost: 0,
        totalInputTokens: 0,
        totalOutputTokens: 0,
        requestCount: 0,
      };
    }

    const usageData = await this.fetchUsageFromAPI(accessToken);

    if (!usageData) {
      return {
        date: this.formatDate(date),
        totalCost: 0,
        totalInputTokens: 0,
        totalOutputTokens: 0,
        requestCount: 0,
      };
    }

    // Cursor API 返回的是月度累计，这里只能估算今日占比
    const totalRequests = usageData.individualUsage.plan.used + usageData.individualUsage.onDemand.used;

    // 粗略估算：假设使用均匀分布在30天内
    const dailyRequests = Math.round(totalRequests / 30);
    const estimated = this.estimateTokensFromRequests(dailyRequests);

    return {
      date: this.formatDate(date),
      totalCost: estimated.cost,
      totalInputTokens: estimated.inputTokens,
      totalOutputTokens: estimated.outputTokens,
      requestCount: dailyRequests,
    };
  }

  /**
   * 获取本月使用量
   */
  async getMonthlyUsage(month?: string): Promise<MonthlyUsage> {
    const targetMonth = month || this.formatMonth(new Date());
    const accessToken = await this.readAccessToken();

    if (!accessToken) {
      return {
        month: targetMonth,
        totalCost: 0,
        totalInputTokens: 0,
        totalOutputTokens: 0,
        requestCount: 0,
      };
    }

    const usageData = await this.fetchUsageFromAPI(accessToken);

    if (!usageData) {
      return {
        month: targetMonth,
        totalCost: 0,
        totalInputTokens: 0,
        totalOutputTokens: 0,
        requestCount: 0,
      };
    }

    const totalRequests = usageData.individualUsage.plan.used + usageData.individualUsage.onDemand.used;
    const estimated = this.estimateTokensFromRequests(totalRequests);

    return {
      month: targetMonth,
      totalCost: estimated.cost,
      totalInputTokens: estimated.inputTokens,
      totalOutputTokens: estimated.outputTokens,
      requestCount: totalRequests,
    };
  }

  /**
   * 手动记录使用量
   */
  async trackUsage(usage: Omit<UsageData, 'timestamp'>): Promise<void> {
    // Cursor 数据来自 API，无需手动记录
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
