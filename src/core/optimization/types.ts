/**
 * 智能优化建议类型定义
 */

export type OptimizationCategory =
  | 'cost-reduction'     // 成本节约
  | 'performance'        // 性能优化
  | 'security'          // 安全改进
  | 'efficiency';       // 使用效率

export type OptimizationPriority = 'high' | 'medium' | 'low';

export interface OptimizationSuggestion {
  id: string;
  category: OptimizationCategory;
  priority: OptimizationPriority;
  title: string;
  description: string;
  reasoning: string;                    // 为什么需要这个优化
  expectedBenefit: string;              // 预期收益
  estimatedSavings?: {
    daily?: number;                     // 每天节省（USD）
    monthly?: number;                   // 每月节省（USD）
    percentage?: number;                // 节省百分比
  };
  actionSteps: string[];                // 具体操作步骤
  affectedAgents?: string[];            // 影响的Agent
  metadata?: Record<string, any>;
}

export interface OptimizationReport {
  generatedAt: Date;
  period: {
    startDate: string;
    endDate: string;
    days: number;
  };
  summary: {
    totalSuggestions: number;
    byPriority: {
      high: number;
      medium: number;
      low: number;
    };
    byCategory: {
      'cost-reduction': number;
      'performance': number;
      'security': number;
      'efficiency': number;
    };
    potentialSavings: {
      daily: number;
      monthly: number;
      yearly: number;
    };
  };
  suggestions: OptimizationSuggestion[];
  insights: string[];                   // 关键洞察
}

export interface UsagePattern {
  agentId: string;
  agentName: string;
  avgDailyCost: number;
  avgDailyTokens: number;
  avgRequestCount: number;
  peakHours?: number[];                 // 高峰使用时段
  unusedDays?: number;                  // 未使用天数
  cachingEnabled?: boolean;             // 是否启用缓存
  cachingEfficiency?: number;           // 缓存效率（0-100）
}

export interface AnomalyDetection {
  date: string;
  agentId: string;
  agentName: string;
  type: 'cost-spike' | 'token-spike' | 'unusual-pattern';
  severity: 'high' | 'medium' | 'low';
  description: string;
  baseline: number;                     // 基准值
  actual: number;                       // 实际值
  deviation: number;                    // 偏差百分比
}
