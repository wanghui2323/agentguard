import { useState } from 'react';
import type { SecurityScanResult, TokenReport } from '../../../../src/types';

interface OptimizationSuggestionsProps {
  stats: {
    avgScore: number;
    criticalCount: number;
    highCount: number;
    mediumCount: number;
    runningAgents: number;
    totalAgents: number;
    todayCost: number;
    monthlyCost: number;
    estimatedMonthCost: number;
  };
  results: SecurityScanResult[];
  tokenReport: TokenReport;
}

interface Suggestion {
  id: string;
  category: 'cost' | 'security' | 'performance' | 'reliability';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  impact: string;
  effort: 'easy' | 'medium' | 'hard';
  savings?: string;
  steps: string[];
  applied: boolean;
}

export default function OptimizationSuggestions({ stats, results, tokenReport }: OptimizationSuggestionsProps) {
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [appliedSuggestions, setAppliedSuggestions] = useState<Set<string>>(new Set());

  // 生成优化建议
  const suggestions: Suggestion[] = [];

  // 1. 成本优化建议
  if (stats.todayCost > 30) {
    suggestions.push({
      id: 'enable-prompt-caching',
      category: 'cost',
      priority: 'high',
      title: '启用 Prompt Caching',
      description: '通过缓存常用的提示词，可以显著降低 token 消耗。Anthropic 提供90%的缓存读取折扣。',
      impact: '预计节省 40-60% 的 input token 成本',
      effort: 'easy',
      savings: `预计每月节省 $${(stats.monthlyCost * 0.5).toFixed(2)}`,
      steps: [
        '在 API 调用中添加 system_cache_control 参数',
        '标记需要缓存的 system 消息',
        '确保缓存的内容至少1024个tokens',
        '监控缓存命中率并调整策略',
      ],
      applied: false,
    });
  }

  if (stats.monthlyCost > 500) {
    suggestions.push({
      id: 'use-haiku-for-simple-tasks',
      category: 'cost',
      priority: 'medium',
      title: '简单任务使用 Claude 3.5 Haiku',
      description: 'Haiku 模型的成本仅为 Sonnet 的 1/3，适合简单的分类、提取等任务。',
      impact: '适合任务可节省 67% 成本',
      effort: 'medium',
      savings: `预计每月节省 $${(stats.monthlyCost * 0.3).toFixed(2)}`,
      steps: [
        '识别不需要复杂推理的任务',
        '将简单任务路由到 Haiku 模型',
        '对比输出质量，确保满足需求',
        '逐步扩大 Haiku 使用范围',
      ],
      applied: false,
    });
  }

  suggestions.push({
    id: 'batch-api-calls',
    category: 'cost',
    priority: 'medium',
    title: '批量处理 API 调用',
    description: '将多个小请求合并为一个大请求，可以减少网络开销和重复的 system prompt 成本。',
    impact: '减少 20-30% 的 API 调用次数',
    effort: 'medium',
    savings: `预计每月节省 $${(stats.monthlyCost * 0.2).toFixed(2)}`,
    steps: [
      '识别可以批量处理的场景',
      '设计批量请求的数据结构',
      '实现请求聚合逻辑',
      '添加错误处理和重试机制',
    ],
    applied: false,
  });

  // 2. 安全优化建议
  if (stats.criticalCount > 0) {
    suggestions.push({
      id: 'fix-critical-issues',
      category: 'security',
      priority: 'high',
      title: `修复 ${stats.criticalCount} 个严重安全问题`,
      description: '这些问题可能导致数据泄露、权限滥用或系统崩溃，需要立即处理。',
      impact: '消除重大安全风险',
      effort: 'hard',
      steps: [
        '审查所有严重安全问题',
        '按优先级制定修复计划',
        '实施修复并测试',
        '部署更新并验证',
      ],
      applied: false,
    });
  }

  if (stats.avgScore < 80) {
    suggestions.push({
      id: 'implement-security-best-practices',
      category: 'security',
      priority: 'high',
      title: '实施安全最佳实践',
      description: '提升整体安全评分，包括输入验证、错误处理、权限控制等。',
      impact: '将安全评分提升至 90+',
      effort: 'medium',
      steps: [
        '启用严格的输入验证',
        '实施最小权限原则',
        '添加完善的错误处理',
        '定期进行安全审计',
      ],
      applied: false,
    });
  }

  suggestions.push({
    id: 'enable-audit-logging',
    category: 'security',
    priority: 'medium',
    title: '启用审计日志',
    description: '记录所有 Agent 的操作，便于追踪异常行为和安全事件。',
    impact: '提升可审计性和事件响应能力',
    effort: 'easy',
    steps: [
      '配置日志收集器',
      '定义需要记录的事件',
      '实施日志轮转策略',
      '设置告警规则',
    ],
    applied: false,
  });

  // 3. 性能优化建议
  suggestions.push({
    id: 'optimize-context-window',
    category: 'performance',
    priority: 'medium',
    title: '优化上下文窗口使用',
    description: '通过智能总结和上下文管理，减少不必要的 token 传输。',
    impact: '提升响应速度 30-50%',
    effort: 'medium',
    steps: [
      '实施对话历史总结',
      '只保留相关的上下文',
      '使用滑动窗口策略',
      '监控上下文长度',
    ],
    applied: false,
  });

  suggestions.push({
    id: 'implement-streaming',
    category: 'performance',
    priority: 'low',
    title: '启用流式响应',
    description: '使用 streaming API 可以更快地向用户显示部分结果，改善用户体验。',
    impact: '降低首字时间 60%+',
    effort: 'easy',
    steps: [
      '修改 API 调用启用 stream: true',
      '实现流式数据处理',
      '更新 UI 支持增量渲染',
      '添加流式错误处理',
    ],
    applied: false,
  });

  // 4. 可靠性优化建议
  suggestions.push({
    id: 'implement-retry-logic',
    category: 'reliability',
    priority: 'high',
    title: '实施智能重试机制',
    description: '通过指数退避和重试策略，提升 API 调用的可靠性。',
    impact: '提升成功率至 99.9%+',
    effort: 'easy',
    steps: [
      '实现指数退避算法',
      '区分可重试和不可重试错误',
      '添加最大重试次数限制',
      '记录重试日志用于监控',
    ],
    applied: false,
  });

  if (stats.runningAgents < stats.totalAgents) {
    suggestions.push({
      id: 'setup-health-checks',
      category: 'reliability',
      priority: 'medium',
      title: '配置健康检查',
      description: '定期检查 Agent 状态，自动重启失败的服务。',
      impact: '提升系统可用性至 99.9%',
      effort: 'medium',
      steps: [
        '实施心跳检测机制',
        '配置自动重启策略',
        '添加状态监控告警',
        '记录故障恢复日志',
      ],
      applied: false,
    });
  }

  // 过滤建议
  const filteredSuggestions = activeCategory === 'all'
    ? suggestions
    : suggestions.filter(s => s.category === activeCategory);

  const handleApply = (id: string) => {
    setAppliedSuggestions(prev => new Set([...prev, id]));
    // TODO: 实际应用建议的逻辑
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'medium':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      default:
        return 'text-blue-600 bg-blue-50 border-blue-200';
    }
  };

  const getEffortBadge = (effort: string) => {
    const colors = {
      easy: 'bg-green-100 text-green-700',
      medium: 'bg-yellow-100 text-yellow-700',
      hard: 'bg-red-100 text-red-700',
    };
    const labels = {
      easy: '简单',
      medium: '中等',
      hard: '复杂',
    };
    return { color: colors[effort as keyof typeof colors], label: labels[effort as keyof typeof labels] };
  };

  const categories = [
    { key: 'all', label: '全部建议', icon: '📋', count: suggestions.length },
    { key: 'cost', label: '成本优化', icon: '💰', count: suggestions.filter(s => s.category === 'cost').length },
    { key: 'security', label: '安全加固', icon: '🔒', count: suggestions.filter(s => s.category === 'security').length },
    { key: 'performance', label: '性能提升', icon: '⚡', count: suggestions.filter(s => s.category === 'performance').length },
    { key: 'reliability', label: '可靠性', icon: '🛡️', count: suggestions.filter(s => s.category === 'reliability').length },
  ];

  const totalSavings = suggestions
    .filter(s => s.savings)
    .reduce((sum, s) => sum + parseFloat(s.savings!.replace(/[^0-9.]/g, '')), 0);

  return (
    <div className="space-y-6">
      {/* 标题和总览 */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">优化建议</h2>
          <p className="text-sm text-gray-500 mt-1">基于最佳实践的智能优化方案</p>
        </div>
        <div className="text-right">
          <div className="text-sm text-gray-600">预计总节省</div>
          <div className="text-2xl font-bold text-green-600">${totalSavings.toFixed(2)}/月</div>
        </div>
      </div>

      {/* 分类筛选 */}
      <div className="flex space-x-2 overflow-x-auto pb-2">
        {categories.map(cat => (
          <button
            key={cat.key}
            onClick={() => setActiveCategory(cat.key)}
            className={`px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap transition-all flex items-center space-x-2 ${
              activeCategory === cat.key
                ? 'bg-purple-100 text-purple-700 border-2 border-purple-300'
                : 'bg-white text-gray-600 border-2 border-gray-200 hover:border-gray-300'
            }`}
          >
            <span>{cat.icon}</span>
            <span>{cat.label}</span>
            <span className={`ml-1 px-2 py-0.5 rounded-full text-xs ${
              activeCategory === cat.key ? 'bg-purple-200' : 'bg-gray-100'
            }`}>
              {cat.count}
            </span>
          </button>
        ))}
      </div>

      {/* 建议列表 */}
      <div className="space-y-4">
        {filteredSuggestions.map((suggestion) => {
          const effortBadge = getEffortBadge(suggestion.effort);
          const isApplied = appliedSuggestions.has(suggestion.id);

          return (
            <div
              key={suggestion.id}
              className={`bg-white rounded-xl border-2 p-6 transition-all ${
                isApplied
                  ? 'border-green-200 bg-green-50'
                  : 'border-gray-100 hover:border-purple-200 hover:shadow-md'
              }`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <span className={`px-2 py-1 rounded-md text-xs font-semibold border ${getPriorityColor(suggestion.priority)}`}>
                      {suggestion.priority === 'high' ? '高优先级' :
                       suggestion.priority === 'medium' ? '中优先级' : '低优先级'}
                    </span>
                    <span className={`px-2 py-1 rounded-md text-xs font-semibold ${effortBadge.color}`}>
                      {effortBadge.label}
                    </span>
                    {suggestion.savings && (
                      <span className="px-2 py-1 rounded-md text-xs font-semibold bg-green-100 text-green-700">
                        {suggestion.savings}
                      </span>
                    )}
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {suggestion.title}
                  </h3>
                  <p className="text-gray-700 mb-3">
                    {suggestion.description}
                  </p>
                  <div className="flex items-center text-sm text-gray-600">
                    <span className="font-medium">预期影响：</span>
                    <span className="ml-2">{suggestion.impact}</span>
                  </div>
                </div>
                {!isApplied && (
                  <button
                    onClick={() => handleApply(suggestion.id)}
                    className="ml-4 px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-purple-500 to-indigo-600 rounded-lg hover:from-purple-600 hover:to-indigo-700 transition-all shadow-sm whitespace-nowrap"
                  >
                    应用建议
                  </button>
                )}
                {isApplied && (
                  <div className="ml-4 px-4 py-2 text-sm font-medium text-green-700 bg-green-100 rounded-lg flex items-center space-x-1">
                    <span>✓</span>
                    <span>已应用</span>
                  </div>
                )}
              </div>

              {/* 实施步骤 */}
              <details className="mt-4">
                <summary className="cursor-pointer text-sm font-medium text-purple-600 hover:text-purple-700">
                  查看实施步骤 →
                </summary>
                <ol className="mt-3 space-y-2 pl-5 list-decimal">
                  {suggestion.steps.map((step, index) => (
                    <li key={index} className="text-sm text-gray-700">
                      {step}
                    </li>
                  ))}
                </ol>
              </details>
            </div>
          );
        })}
      </div>

      {filteredSuggestions.length === 0 && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🎉</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            该类别没有优化建议
          </h3>
          <p className="text-gray-500">
            您的系统在此方面运行良好！
          </p>
        </div>
      )}
    </div>
  );
}
