/**
 * 智能优化建议引擎
 * 分析使用模式，提供可操作的优化建议
 */
import { HistoryDatabase } from '../history/HistoryDatabase';
import type {
  OptimizationSuggestion,
  OptimizationReport,
  UsagePattern,
  AnomalyDetection
} from './types';
import type { Agent } from '../../types';

export class OptimizationEngine {
  private historyDb: HistoryDatabase;

  constructor(historyDb?: HistoryDatabase) {
    this.historyDb = historyDb || new HistoryDatabase();
  }

  /**
   * 生成完整的优化报告
   */
  async generateOptimizationReport(days: number = 30): Promise<OptimizationReport> {
    const endDate = this.formatDate(new Date());
    const startDate = this.formatDate(
      new Date(Date.now() - days * 24 * 60 * 60 * 1000)
    );

    // 获取聚合统计
    const stats = this.historyDb.getAggregatedStats('daily', startDate, endDate);

    // 分析每个Agent的使用模式
    const patterns = this.analyzeUsagePatterns(stats.topAgents, days);

    // 生成优化建议
    const suggestions: OptimizationSuggestion[] = [];

    // 1. 检查Prompt Caching机会
    suggestions.push(...this.analyzeCachingOpportunities(patterns));

    // 2. 检查成本优化机会
    suggestions.push(...this.analyzeCostOptimization(patterns));

    // 3. 检查使用效率
    suggestions.push(...this.analyzeUsageEfficiency(patterns, stats));

    // 4. 检查安全配置
    suggestions.push(...this.analyzeSecurityOptimizations());

    // 排序建议（按优先级和节省潜力）
    const sortedSuggestions = this.sortSuggestions(suggestions);

    // 生成关键洞察
    const insights = this.generateInsights(stats, patterns, suggestions);

    // 计算潜在节省
    const potentialSavings = this.calculatePotentialSavings(suggestions);

    // 统计
    const summary = {
      totalSuggestions: sortedSuggestions.length,
      byPriority: {
        high: sortedSuggestions.filter(s => s.priority === 'high').length,
        medium: sortedSuggestions.filter(s => s.priority === 'medium').length,
        low: sortedSuggestions.filter(s => s.priority === 'low').length
      },
      byCategory: {
        'cost-reduction': sortedSuggestions.filter(s => s.category === 'cost-reduction').length,
        'performance': sortedSuggestions.filter(s => s.category === 'performance').length,
        'security': sortedSuggestions.filter(s => s.category === 'security').length,
        'efficiency': sortedSuggestions.filter(s => s.category === 'efficiency').length
      },
      potentialSavings
    };

    return {
      generatedAt: new Date(),
      period: {
        startDate,
        endDate,
        days
      },
      summary,
      suggestions: sortedSuggestions,
      insights
    };
  }

  /**
   * 分析Prompt Caching使用机会
   */
  private analyzeCachingOpportunities(patterns: UsagePattern[]): OptimizationSuggestion[] {
    const suggestions: OptimizationSuggestion[] = [];

    for (const pattern of patterns) {
      // 如果缓存未启用且成本较高
      if (!pattern.cachingEnabled && pattern.avgDailyCost > 1.0) {
        const estimatedSavings = pattern.avgDailyCost * 0.5; // 假设可节省50%

        suggestions.push({
          id: `caching-${pattern.agentId}`,
          category: 'cost-reduction',
          priority: 'high',
          title: `启用 ${pattern.agentName} 的Prompt Caching`,
          description: '检测到高频重复请求，启用Prompt Caching可大幅降低成本',
          reasoning: `${pattern.agentName} 平均每天花费 $${pattern.avgDailyCost.toFixed(2)}，未启用Prompt Caching。重复的上下文会被重新计费。`,
          expectedBenefit: 'Prompt Caching可将缓存命中的输入Token成本降低90%',
          estimatedSavings: {
            daily: estimatedSavings,
            monthly: estimatedSavings * 30,
            percentage: 50
          },
          actionSteps: [
            `配置 ${pattern.agentName} 启用Prompt Caching`,
            '识别可复用的上下文（如系统提示词、项目信息）',
            '设置合适的缓存TTL（建议5分钟）',
            '监控缓存命中率',
            '预期节省: 每月约 $' + (estimatedSavings * 30).toFixed(2)
          ],
          affectedAgents: [pattern.agentId]
        });
      }

      // 如果缓存效率低
      if (pattern.cachingEnabled && pattern.cachingEfficiency && pattern.cachingEfficiency < 30) {
        suggestions.push({
          id: `caching-efficiency-${pattern.agentId}`,
          category: 'efficiency',
          priority: 'medium',
          title: `优化 ${pattern.agentName} 的缓存效率`,
          description: `当前缓存命中率仅 ${pattern.cachingEfficiency.toFixed(1)}%，低于理想水平`,
          reasoning: '缓存命中率低可能是因为缓存TTL过短、上下文变化频繁或配置不当',
          expectedBenefit: '提高缓存命中率可进一步降低成本',
          actionSteps: [
            '检查缓存TTL设置（建议5分钟或更长）',
            '分析哪些上下文经常变化',
            '优化系统提示词结构，使其更稳定',
            '考虑增加缓存块大小'
          ],
          affectedAgents: [pattern.agentId]
        });
      }
    }

    return suggestions;
  }

  /**
   * 分析成本优化机会
   */
  private analyzeCostOptimization(patterns: UsagePattern[]): OptimizationSuggestion[] {
    const suggestions: OptimizationSuggestion[] = [];

    // 找出成本最高的Agent
    const sortedByCase = [...patterns].sort((a, b) => b.avgDailyCost - a.avgDailyCost);

    if (sortedByCase.length > 0 && sortedByCase[0].avgDailyCost > 5.0) {
      const topAgent = sortedByCase[0];

      suggestions.push({
        id: `cost-review-${topAgent.agentId}`,
        category: 'cost-reduction',
        priority: 'high',
        title: `审查 ${topAgent.agentName} 的使用方式`,
        description: `${topAgent.agentName} 占总成本的最大比例，建议优化使用策略`,
        reasoning: `平均每天花费 $${topAgent.avgDailyCost.toFixed(2)}，远高于其他Agent`,
        expectedBenefit: '通过优化使用方式，可显著降低整体成本',
        actionSteps: [
          '检查是否有不必要的重复请求',
          '考虑批处理相似的任务',
          '评估是否可以使用更小的模型处理简单任务',
          '设置每日预算限制',
          '定期review使用日志'
        ],
        affectedAgents: [topAgent.agentId],
        metadata: {
          avgDailyCost: topAgent.avgDailyCost,
          avgDailyTokens: topAgent.avgDailyTokens
        }
      });
    }

    // 检查未使用的Agent
    for (const pattern of patterns) {
      if (pattern.unusedDays && pattern.unusedDays > 7) {
        suggestions.push({
          id: `unused-${pattern.agentId}`,
          category: 'efficiency',
          priority: 'low',
          title: `${pattern.agentName} 长期未使用`,
          description: `已有 ${pattern.unusedDays} 天未使用此Agent`,
          reasoning: '长期未使用的Agent可能不再需要',
          expectedBenefit: '停用或卸载不使用的Agent可简化管理',
          actionSteps: [
            '确认是否还需要此Agent',
            '如不需要，考虑卸载',
            '如需保留，可暂停监控'
          ],
          affectedAgents: [pattern.agentId]
        });
      }
    }

    return suggestions;
  }

  /**
   * 分析使用效率
   */
  private analyzeUsageEfficiency(patterns: UsagePattern[], stats: any): OptimizationSuggestion[] {
    const suggestions: OptimizationSuggestion[] = [];

    // 检查请求频率
    for (const pattern of patterns) {
      const avgRequestsPerDay = pattern.avgRequestCount;

      if (avgRequestsPerDay > 100) {
        suggestions.push({
          id: `high-frequency-${pattern.agentId}`,
          category: 'efficiency',
          priority: 'medium',
          title: `${pattern.agentName} 请求频率较高`,
          description: `平均每天 ${avgRequestsPerDay.toFixed(0)} 个请求，建议优化使用模式`,
          reasoning: '高频请求可能表示使用效率低下或存在自动化流程',
          expectedBenefit: '优化请求模式可提高效率并降低成本',
          actionSteps: [
            '检查是否有可以合并的请求',
            '考虑使用批处理API',
            '评估是否有不必要的轮询',
            '优化提示词以减少交互轮次'
          ],
          affectedAgents: [pattern.agentId],
          metadata: {
            avgRequestsPerDay: avgRequestsPerDay
          }
        });
      }
    }

    return suggestions;
  }

  /**
   * 分析安全优化机会
   */
  private analyzeSecurityOptimizations(): OptimizationSuggestion[] {
    // 这里可以集成SecurityScanner的结果
    // 目前返回通用安全建议
    return [{
      id: 'security-review',
      category: 'security',
      priority: 'medium',
      title: '定期安全审计',
      description: '建议每周进行一次安全扫描',
      reasoning: 'AI Agent的配置可能会随时间变化，定期审计确保安全',
      expectedBenefit: '及早发现和修复安全问题',
      actionSteps: [
        '运行: agentguard scan',
        '检查所有高危和严重问题',
        '运行: agentguard fix 自动修复',
        '验证修复结果'
      ]
    }];
  }

  /**
   * 分析使用模式
   */
  private analyzeUsagePatterns(topAgents: any[], days: number): UsagePattern[] {
    return topAgents.map(agent => ({
      agentId: agent.agentId,
      agentName: agent.agentName,
      avgDailyCost: agent.cost / days,
      avgDailyTokens: agent.tokens / days,
      avgRequestCount: 10, // 简化处理
      cachingEnabled: false, // 需要从实际数据判断
      cachingEfficiency: undefined,
      unusedDays: undefined
    }));
  }

  /**
   * 排序建议
   */
  private sortSuggestions(suggestions: OptimizationSuggestion[]): OptimizationSuggestion[] {
    const priorityWeight = { high: 3, medium: 2, low: 1 };

    return suggestions.sort((a, b) => {
      // 先按优先级排序
      const priorityDiff = priorityWeight[b.priority] - priorityWeight[a.priority];
      if (priorityDiff !== 0) return priorityDiff;

      // 再按预期节省排序
      const savingsA = a.estimatedSavings?.monthly || 0;
      const savingsB = b.estimatedSavings?.monthly || 0;
      return savingsB - savingsA;
    });
  }

  /**
   * 计算潜在节省
   */
  private calculatePotentialSavings(suggestions: OptimizationSuggestion[]) {
    const dailySavings = suggestions
      .filter(s => s.estimatedSavings?.daily)
      .reduce((sum, s) => sum + (s.estimatedSavings!.daily || 0), 0);

    return {
      daily: dailySavings,
      monthly: dailySavings * 30,
      yearly: dailySavings * 365
    };
  }

  /**
   * 生成关键洞察
   */
  private generateInsights(stats: any, patterns: UsagePattern[], suggestions: OptimizationSuggestion[]): string[] {
    const insights: string[] = [];

    // 成本洞察
    if (stats.totalCost > 0) {
      const avgCost = stats.avgCostPerDay;
      insights.push(`平均每天花费 $${avgCost.toFixed(2)}，预计每月 $${(avgCost * 30).toFixed(2)}`);
    }

    // 优化潜力
    const highPriority = suggestions.filter(s => s.priority === 'high').length;
    if (highPriority > 0) {
      insights.push(`发现 ${highPriority} 个高优先级优化机会`);
    }

    // 缓存机会
    const cachingSuggestions = suggestions.filter(s => s.id.startsWith('caching-'));
    if (cachingSuggestions.length > 0) {
      insights.push(`${cachingSuggestions.length} 个Agent可通过启用Prompt Caching节省成本`);
    }

    // Agent使用分布
    if (patterns.length > 0) {
      const topAgent = patterns[0];
      const percentage = (topAgent.avgDailyCost / stats.avgCostPerDay) * 100;
      insights.push(`${topAgent.agentName} 占总成本的 ${percentage.toFixed(1)}%`);
    }

    return insights;
  }

  /**
   * 格式化日期
   */
  private formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  /**
   * 关闭数据库连接
   */
  close(): void {
    this.historyDb.close();
  }
}
