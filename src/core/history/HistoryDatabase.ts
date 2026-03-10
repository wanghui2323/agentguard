/**
 * 历史数据存储 - SQLite实现
 */
import Database from 'better-sqlite3';
import * as path from 'path';
import * as os from 'os';
import * as fs from 'fs';
import type {
  TokenUsageHistory,
  CostHistory,
  HistoryQueryOptions,
  HistoryDatabaseConfig,
  AggregatedStats,
  TrendDataPoint
} from './types';

export class HistoryDatabase {
  private db: Database.Database;
  private dbPath: string;
  private maxRecords: number;
  private retentionDays: number;

  constructor(config?: Partial<HistoryDatabaseConfig>) {
    const defaultDbPath = path.join(os.homedir(), '.agentguard', 'history.db');
    this.dbPath = config?.dbPath || defaultDbPath;
    this.maxRecords = config?.maxRecords || 10000;
    this.retentionDays = config?.retentionDays || 90;

    // 确保目录存在
    const dir = path.dirname(this.dbPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    // 初始化数据库
    this.db = new Database(this.dbPath);
    this.initializeTables();
  }

  /**
   * 初始化数据库表
   */
  private initializeTables(): void {
    // Token使用历史表
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS token_usage_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        date TEXT NOT NULL,
        agent_id TEXT NOT NULL,
        agent_name TEXT NOT NULL,
        input_tokens INTEGER NOT NULL,
        output_tokens INTEGER NOT NULL,
        cache_creation_tokens INTEGER NOT NULL,
        cache_read_tokens INTEGER NOT NULL,
        total_tokens INTEGER NOT NULL,
        estimated_cost REAL NOT NULL,
        request_count INTEGER NOT NULL,
        created_at TEXT NOT NULL,
        UNIQUE(date, agent_id)
      );

      CREATE INDEX IF NOT EXISTS idx_token_date ON token_usage_history(date);
      CREATE INDEX IF NOT EXISTS idx_token_agent ON token_usage_history(agent_id);
    `);

    // 成本历史表
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS cost_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        date TEXT NOT NULL UNIQUE,
        total_cost REAL NOT NULL,
        breakdown TEXT NOT NULL,
        created_at TEXT NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_cost_date ON cost_history(date);
    `);
  }

  /**
   * 记录Token使用数据
   */
  saveTokenUsage(record: TokenUsageHistory): void {
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO token_usage_history (
        date, agent_id, agent_name, input_tokens, output_tokens,
        cache_creation_tokens, cache_read_tokens, total_tokens,
        estimated_cost, request_count, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      record.date,
      record.agentId,
      record.agentName,
      record.inputTokens,
      record.outputTokens,
      record.cacheCreationTokens,
      record.cacheReadTokens,
      record.totalTokens,
      record.estimatedCost,
      record.requestCount,
      record.createdAt
    );
  }

  /**
   * 批量保存Token使用数据
   */
  saveTokenUsageBatch(records: TokenUsageHistory[]): void {
    const insert = this.db.prepare(`
      INSERT OR REPLACE INTO token_usage_history (
        date, agent_id, agent_name, input_tokens, output_tokens,
        cache_creation_tokens, cache_read_tokens, total_tokens,
        estimated_cost, request_count, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const transaction = this.db.transaction((records: TokenUsageHistory[]) => {
      for (const record of records) {
        insert.run(
          record.date,
          record.agentId,
          record.agentName,
          record.inputTokens,
          record.outputTokens,
          record.cacheCreationTokens,
          record.cacheReadTokens,
          record.totalTokens,
          record.estimatedCost,
          record.requestCount,
          record.createdAt
        );
      }
    });

    transaction(records);
  }

  /**
   * 查询Token使用历史
   */
  getTokenUsageHistory(options: HistoryQueryOptions = {}): TokenUsageHistory[] {
    let query = 'SELECT * FROM token_usage_history WHERE 1=1';
    const params: any[] = [];

    if (options.startDate) {
      query += ' AND date >= ?';
      params.push(options.startDate);
    }

    if (options.endDate) {
      query += ' AND date <= ?';
      params.push(options.endDate);
    }

    if (options.agentId) {
      query += ' AND agent_id = ?';
      params.push(options.agentId);
    }

    query += ' ORDER BY date DESC';

    if (options.limit) {
      query += ' LIMIT ?';
      params.push(options.limit);
    }

    if (options.offset) {
      query += ' OFFSET ?';
      params.push(options.offset);
    }

    const rows = this.db.prepare(query).all(...params) as any[];

    return rows.map(row => ({
      id: row.id,
      date: row.date,
      agentId: row.agent_id,
      agentName: row.agent_name,
      inputTokens: row.input_tokens,
      outputTokens: row.output_tokens,
      cacheCreationTokens: row.cache_creation_tokens,
      cacheReadTokens: row.cache_read_tokens,
      totalTokens: row.total_tokens,
      estimatedCost: row.estimated_cost,
      requestCount: row.request_count,
      createdAt: row.created_at
    }));
  }

  /**
   * 记录成本数据
   */
  saveCostHistory(record: CostHistory): void {
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO cost_history (
        date, total_cost, breakdown, created_at
      ) VALUES (?, ?, ?, ?)
    `);

    stmt.run(
      record.date,
      record.totalCost,
      JSON.stringify(record.breakdown),
      record.createdAt
    );
  }

  /**
   * 查询成本历史
   */
  getCostHistory(options: HistoryQueryOptions = {}): CostHistory[] {
    let query = 'SELECT * FROM cost_history WHERE 1=1';
    const params: any[] = [];

    if (options.startDate) {
      query += ' AND date >= ?';
      params.push(options.startDate);
    }

    if (options.endDate) {
      query += ' AND date <= ?';
      params.push(options.endDate);
    }

    query += ' ORDER BY date DESC';

    if (options.limit) {
      query += ' LIMIT ?';
      params.push(options.limit);
    }

    const rows = this.db.prepare(query).all(...params) as any[];

    return rows.map(row => ({
      id: row.id,
      date: row.date,
      totalCost: row.total_cost,
      breakdown: JSON.parse(row.breakdown),
      createdAt: row.created_at
    }));
  }

  /**
   * 获取聚合统计数据
   */
  getAggregatedStats(
    period: 'daily' | 'weekly' | 'monthly',
    startDate?: string,
    endDate?: string
  ): AggregatedStats {
    const options: HistoryQueryOptions = { startDate, endDate };
    const records = this.getTokenUsageHistory(options);

    if (records.length === 0) {
      return {
        period,
        startDate: startDate || '',
        endDate: endDate || '',
        totalCost: 0,
        totalTokens: 0,
        totalRequests: 0,
        avgCostPerDay: 0,
        avgTokensPerDay: 0,
        topAgents: []
      };
    }

    // 计算总计
    const totalCost = records.reduce((sum, r) => sum + r.estimatedCost, 0);
    const totalTokens = records.reduce((sum, r) => sum + r.totalTokens, 0);
    const totalRequests = records.reduce((sum, r) => sum + r.requestCount, 0);

    // 计算日期范围
    const dates = [...new Set(records.map(r => r.date))].sort();
    const actualStartDate = startDate || dates[dates.length - 1];
    const actualEndDate = endDate || dates[0];
    const dayCount = this.getDaysBetween(actualStartDate, actualEndDate) + 1;

    // 按agent聚合
    const agentMap = new Map<string, {
      name: string;
      cost: number;
      tokens: number;
    }>();

    for (const record of records) {
      const existing = agentMap.get(record.agentId) || {
        name: record.agentName,
        cost: 0,
        tokens: 0
      };

      existing.cost += record.estimatedCost;
      existing.tokens += record.totalTokens;
      agentMap.set(record.agentId, existing);
    }

    // 排序并计算百分比
    const topAgents = Array.from(agentMap.entries())
      .map(([agentId, data]) => ({
        agentId,
        agentName: data.name,
        cost: data.cost,
        tokens: data.tokens,
        percentage: (data.cost / totalCost) * 100
      }))
      .sort((a, b) => b.cost - a.cost);

    return {
      period,
      startDate: actualStartDate,
      endDate: actualEndDate,
      totalCost,
      totalTokens,
      totalRequests,
      avgCostPerDay: totalCost / dayCount,
      avgTokensPerDay: totalTokens / dayCount,
      topAgents
    };
  }

  /**
   * 获取成本趋势数据
   */
  getCostTrend(days: number = 30): TrendDataPoint[] {
    const endDate = this.formatDate(new Date());
    const startDate = this.formatDate(
      new Date(Date.now() - days * 24 * 60 * 60 * 1000)
    );

    const records = this.getCostHistory({ startDate, endDate });

    return records.map(record => ({
      date: record.date,
      value: record.totalCost,
      label: `$${record.totalCost.toFixed(2)}`
    }));
  }

  /**
   * 获取Token使用趋势
   */
  getTokenTrend(days: number = 30): TrendDataPoint[] {
    const endDate = this.formatDate(new Date());
    const startDate = this.formatDate(
      new Date(Date.now() - days * 24 * 60 * 60 * 1000)
    );

    const records = this.getTokenUsageHistory({ startDate, endDate });

    // 按日期聚合
    const dailyMap = new Map<string, number>();
    for (const record of records) {
      const existing = dailyMap.get(record.date) || 0;
      dailyMap.set(record.date, existing + record.totalTokens);
    }

    return Array.from(dailyMap.entries())
      .map(([date, tokens]) => ({
        date,
        value: tokens,
        label: `${tokens.toLocaleString()} tokens`
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  /**
   * 清理过期数据
   */
  cleanupOldRecords(): number {
    const cutoffDate = this.formatDate(
      new Date(Date.now() - this.retentionDays * 24 * 60 * 60 * 1000)
    );

    const tokenResult = this.db.prepare(
      'DELETE FROM token_usage_history WHERE date < ?'
    ).run(cutoffDate);

    const costResult = this.db.prepare(
      'DELETE FROM cost_history WHERE date < ?'
    ).run(cutoffDate);

    return tokenResult.changes + costResult.changes;
  }

  /**
   * 获取数据库统计信息
   */
  getDatabaseStats() {
    const tokenCount = this.db.prepare(
      'SELECT COUNT(*) as count FROM token_usage_history'
    ).get() as { count: number };

    const costCount = this.db.prepare(
      'SELECT COUNT(*) as count FROM cost_history'
    ).get() as { count: number };

    const oldestRecord = this.db.prepare(
      'SELECT MIN(date) as date FROM token_usage_history'
    ).get() as { date: string };

    const newestRecord = this.db.prepare(
      'SELECT MAX(date) as date FROM token_usage_history'
    ).get() as { date: string };

    const fileStats = fs.statSync(this.dbPath);

    return {
      dbPath: this.dbPath,
      fileSize: fileStats.size,
      fileSizeMB: (fileStats.size / 1024 / 1024).toFixed(2),
      tokenRecords: tokenCount.count,
      costRecords: costCount.count,
      oldestDate: oldestRecord.date,
      newestDate: newestRecord.date,
      maxRecords: this.maxRecords,
      retentionDays: this.retentionDays
    };
  }

  /**
   * 关闭数据库连接
   */
  close(): void {
    this.db.close();
  }

  /**
   * 格式化日期为YYYY-MM-DD
   */
  private formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  /**
   * 计算两个日期之间的天数
   */
  private getDaysBetween(startDate: string, endDate: string): number {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }
}
