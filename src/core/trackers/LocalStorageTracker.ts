/**
 * 本地存储追踪器
 * 使用SQLite存储token使用数据
 */

import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { BaseTracker, UsageData, DailyUsage, MonthlyUsage } from './BaseTracker';

interface StorageRecord extends UsageData {
  agentId: string;
  agentName: string;
}

export class LocalStorageTracker extends BaseTracker {
  private dataDir: string;
  private dataFile: string;

  constructor(agentId: string, agentName: string) {
    super(agentId, agentName);

    // 数据存储在 ~/.agentguard/usage/
    this.dataDir = path.join(os.homedir(), '.agentguard', 'usage');
    this.dataFile = path.join(this.dataDir, `${agentId}.json`);

    this.ensureDataDir();
  }

  private ensureDataDir() {
    if (!fs.existsSync(this.dataDir)) {
      fs.mkdirSync(this.dataDir, { recursive: true });
    }
  }

  private loadData(): StorageRecord[] {
    try {
      if (fs.existsSync(this.dataFile)) {
        const content = fs.readFileSync(this.dataFile, 'utf-8');
        const data = JSON.parse(content);
        // 转换timestamp为Date对象
        return data.map((record: any) => ({
          ...record,
          timestamp: new Date(record.timestamp)
        }));
      }
    } catch (error) {
      console.error(`[LocalStorageTracker] Failed to load data for ${this.agentId}:`, error);
    }
    return [];
  }

  private saveData(records: StorageRecord[]) {
    try {
      fs.writeFileSync(this.dataFile, JSON.stringify(records, null, 2));
    } catch (error) {
      console.error(`[LocalStorageTracker] Failed to save data for ${this.agentId}:`, error);
    }
  }

  async trackUsage(usage: Omit<UsageData, 'timestamp'>): Promise<void> {
    const records = this.loadData();
    const newRecord: StorageRecord = {
      ...usage,
      timestamp: new Date(),
      agentId: this.agentId,
      agentName: this.agentName
    };
    records.push(newRecord);
    this.saveData(records);
  }

  async getDailyUsage(date: Date = new Date()): Promise<DailyUsage> {
    const records = this.loadData();
    const targetDate = this.formatDate(date);

    const dailyRecords = records.filter(record =>
      this.formatDate(record.timestamp) === targetDate
    );

    return {
      date: targetDate,
      totalCost: dailyRecords.reduce((sum, r) => sum + r.cost, 0),
      totalInputTokens: dailyRecords.reduce((sum, r) => sum + r.inputTokens, 0),
      totalOutputTokens: dailyRecords.reduce((sum, r) => sum + r.outputTokens, 0),
      requestCount: dailyRecords.length
    };
  }

  async getMonthlyUsage(month?: string): Promise<MonthlyUsage> {
    const records = this.loadData();
    const targetMonth = month || this.formatMonth(new Date());

    const monthlyRecords = records.filter(record =>
      this.formatMonth(record.timestamp) === targetMonth
    );

    return {
      month: targetMonth,
      totalCost: monthlyRecords.reduce((sum, r) => sum + r.cost, 0),
      totalInputTokens: monthlyRecords.reduce((sum, r) => sum + r.inputTokens, 0),
      totalOutputTokens: monthlyRecords.reduce((sum, r) => sum + r.outputTokens, 0),
      requestCount: monthlyRecords.length
    };
  }

  async getHistoricalUsage(startDate: Date, endDate: Date): Promise<DailyUsage[]> {
    const records = this.loadData();
    const dateMap = new Map<string, StorageRecord[]>();

    // 按日期分组
    records.forEach(record => {
      const date = this.formatDate(record.timestamp);
      const recordDate = new Date(date);

      if (recordDate >= startDate && recordDate <= endDate) {
        if (!dateMap.has(date)) {
          dateMap.set(date, []);
        }
        dateMap.get(date)!.push(record);
      }
    });

    // 转换为DailyUsage数组
    return Array.from(dateMap.entries()).map(([date, dayRecords]) => ({
      date,
      totalCost: dayRecords.reduce((sum, r) => sum + r.cost, 0),
      totalInputTokens: dayRecords.reduce((sum, r) => sum + r.inputTokens, 0),
      totalOutputTokens: dayRecords.reduce((sum, r) => sum + r.outputTokens, 0),
      requestCount: dayRecords.length
    })).sort((a, b) => a.date.localeCompare(b.date));
  }

  async cleanup(daysToKeep: number = 90): Promise<void> {
    const records = this.loadData();
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const filteredRecords = records.filter(record =>
      record.timestamp >= cutoffDate
    );

    this.saveData(filteredRecords);
    console.log(`[LocalStorageTracker] Cleaned up old data for ${this.agentId}. Kept ${filteredRecords.length}/${records.length} records.`);
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
