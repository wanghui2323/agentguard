/**
 * 历史数据记录类型定义
 */

/**
 * Token使用历史记录
 */
export interface TokenUsageHistory {
  id?: number;
  date: string;                    // YYYY-MM-DD
  agentId: string;                 // claude-code, cursor, etc.
  agentName: string;
  inputTokens: number;
  outputTokens: number;
  cacheCreationTokens: number;
  cacheReadTokens: number;
  totalTokens: number;
  estimatedCost: number;           // USD
  requestCount: number;
  createdAt: string;               // ISO timestamp
}

/**
 * 成本历史记录
 */
export interface CostHistory {
  id?: number;
  date: string;                    // YYYY-MM-DD
  totalCost: number;               // USD
  breakdown: {
    [agentId: string]: number;     // 按agent分组的成本
  };
  createdAt: string;
}

/**
 * 聚合统计数据
 */
export interface AggregatedStats {
  period: 'daily' | 'weekly' | 'monthly';
  startDate: string;
  endDate: string;
  totalCost: number;
  totalTokens: number;
  totalRequests: number;
  avgCostPerDay: number;
  avgTokensPerDay: number;
  topAgents: Array<{
    agentId: string;
    agentName: string;
    cost: number;
    tokens: number;
    percentage: number;
  }>;
}

/**
 * 趋势数据点
 */
export interface TrendDataPoint {
  date: string;
  value: number;
  label?: string;
}

/**
 * 查询选项
 */
export interface HistoryQueryOptions {
  startDate?: string;              // YYYY-MM-DD
  endDate?: string;                // YYYY-MM-DD
  agentId?: string;
  limit?: number;
  offset?: number;
}

/**
 * 数据库配置
 */
export interface HistoryDatabaseConfig {
  dbPath: string;
  maxRecords?: number;             // 最大记录数，超过时自动清理旧数据
  retentionDays?: number;          // 数据保留天数
}
