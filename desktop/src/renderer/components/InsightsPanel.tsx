import type { SecurityScanResult, TokenReport } from '../../../../src/types';

interface InsightsPanelProps {
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

interface Insight {
  type: 'success' | 'warning' | 'danger' | 'info';
  icon: string;
  title: string;
  description: string;
  action?: string;
}

export default function InsightsPanel({ stats, results, tokenReport }: InsightsPanelProps) {
  // 智能分析生成洞察
  const insights: Insight[] = [];

  // 1. 安全评分分析
  if (stats.avgScore >= 90) {
    insights.push({
      type: 'success',
      icon: '✅',
      title: '安全状态优秀',
      description: `您的 AI Agents 安全评分达到 ${stats.avgScore}分，处于优秀水平。所有 Agent 都遵循了最佳安全实践。`,
    });
  } else if (stats.avgScore >= 70) {
    insights.push({
      type: 'info',
      icon: '💡',
      title: '安全状态良好',
      description: `当前安全评分为 ${stats.avgScore}分，建议关注中低风险项，可进一步提升至90分以上。`,
      action: '查看优化建议',
    });
  } else {
    insights.push({
      type: 'warning',
      icon: '⚠️',
      title: '安全状态需要改进',
      description: `安全评分为 ${stats.avgScore}分，存在较多安全隐患。建议立即查看并处理高危问题。`,
      action: '查看安全问题',
    });
  }

  // 2. 严重问题分析
  if (stats.criticalCount > 0) {
    insights.push({
      type: 'danger',
      icon: '🚨',
      title: `发现 ${stats.criticalCount} 个严重安全问题`,
      description: '这些问题可能导致数据泄露、权限滥用或系统崩溃。强烈建议立即处理。',
      action: '立即修复',
    });
  }

  // 3. 高危问题分析
  if (stats.highCount > 5) {
    insights.push({
      type: 'warning',
      icon: '⚡',
      title: `检测到 ${stats.highCount} 个高危风险`,
      description: '大量高危问题可能影响系统稳定性和数据安全，建议在24小时内处理。',
      action: '查看详情',
    });
  }

  // 4. Token 消耗分析
  const monthlyBudget = 1000; // 假设月预算 $1000
  const budgetUsage = (stats.monthlyCost / monthlyBudget) * 100;

  if (budgetUsage > 90) {
    insights.push({
      type: 'danger',
      icon: '💸',
      title: '预算即将耗尽',
      description: `本月已使用 ${budgetUsage.toFixed(1)}% 的预算（$${stats.monthlyCost.toFixed(2)}/$${monthlyBudget}）。预计月底将超支 $${(stats.estimatedMonthCost - monthlyBudget).toFixed(2)}。`,
      action: '优化成本',
    });
  } else if (budgetUsage > 70) {
    insights.push({
      type: 'warning',
      icon: '📊',
      title: '成本使用较高',
      description: `本月已使用 ${budgetUsage.toFixed(1)}% 的预算。按当前速度预计月底消耗 $${stats.estimatedMonthCost.toFixed(2)}。`,
      action: '查看详情',
    });
  } else if (stats.todayCost > 50) {
    insights.push({
      type: 'info',
      icon: '💎',
      title: '今日消耗较高',
      description: `今天已消耗 $${stats.todayCost.toFixed(2)}，高于平均水平。建议检查是否有异常的 API 调用。`,
      action: '查看 Token 详情',
    });
  }

  // 5. 效率分析
  const avgTokensPerAgent = tokenReport.totalTokens / stats.totalAgents;
  if (avgTokensPerAgent > 1000000) {
    insights.push({
      type: 'info',
      icon: '🔍',
      title: 'Token 使用效率有优化空间',
      description: `平均每个 Agent 使用了 ${(avgTokensPerAgent / 1000000).toFixed(2)}M tokens。建议启用 Prompt Caching 来降低成本。`,
      action: '查看优化方案',
    });
  }

  // 6. Agent 状态分析
  if (stats.runningAgents < stats.totalAgents) {
    const stoppedCount = stats.totalAgents - stats.runningAgents;
    insights.push({
      type: 'info',
      icon: '🔄',
      title: `${stoppedCount} 个 Agent 已停止`,
      description: '部分 Agent 未在运行状态，可能影响工作流程的完整性。',
      action: '查看详情',
    });
  }

  // 7. 趋势分析
  const dailyAvg = stats.monthlyCost / new Date().getDate();
  if (stats.todayCost > dailyAvg * 1.5) {
    insights.push({
      type: 'warning',
      icon: '📈',
      title: '今日消耗异常',
      description: `今日消耗（$${stats.todayCost.toFixed(2)}）是日均消耗（$${dailyAvg.toFixed(2)}）的 ${(stats.todayCost / dailyAvg).toFixed(1)} 倍。建议检查是否有异常活动。`,
      action: '查看详细日志',
    });
  }

  // 8. 积极反馈
  if (insights.length === 0 || insights.every(i => i.type === 'success' || i.type === 'info')) {
    insights.push({
      type: 'success',
      icon: '🎉',
      title: '系统运行状态良好',
      description: '所有指标都在正常范围内，没有检测到需要立即关注的问题。继续保持！',
    });
  }

  const getInsightStyle = (type: string) => {
    switch (type) {
      case 'success':
        return 'bg-green-50 border-green-200';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200';
      case 'danger':
        return 'bg-red-50 border-red-200';
      default:
        return 'bg-blue-50 border-blue-200';
    }
  };

  const getIconStyle = (type: string) => {
    switch (type) {
      case 'success':
        return 'bg-green-100';
      case 'warning':
        return 'bg-yellow-100';
      case 'danger':
        return 'bg-red-100';
      default:
        return 'bg-blue-100';
    }
  };

  // 快速统计
  const quickStats = [
    {
      label: '扫描完成',
      value: `${results.length} 个`,
      change: '+2',
      trend: 'up',
    },
    {
      label: '平均响应',
      value: '245ms',
      change: '-12ms',
      trend: 'up',
    },
    {
      label: '缓存命中率',
      value: '87.3%',
      change: '+5.2%',
      trend: 'up',
    },
    {
      label: 'API 成功率',
      value: '99.8%',
      change: '+0.1%',
      trend: 'up',
    },
  ];

  return (
    <div className="space-y-6">
      {/* 智能洞察标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">智能洞察</h2>
          <p className="text-sm text-gray-500 mt-1">基于实时数据的智能分析和建议</p>
        </div>
        <button className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
          导出报告
        </button>
      </div>

      {/* 快速统计 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {quickStats.map((stat, index) => (
          <div key={index} className="bg-white rounded-xl p-4 border border-gray-100">
            <div className="text-sm text-gray-600 mb-1">{stat.label}</div>
            <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
            <div className={`text-xs mt-1 flex items-center ${
              stat.trend === 'up' ? 'text-green-600' : 'text-red-600'
            }`}>
              <span>{stat.trend === 'up' ? '↑' : '↓'}</span>
              <span className="ml-1">{stat.change}</span>
            </div>
          </div>
        ))}
      </div>

      {/* 洞察卡片 */}
      <div className="space-y-4">
        {insights.map((insight, index) => (
          <div
            key={index}
            className={`rounded-xl border-2 p-6 transition-all hover:shadow-md ${getInsightStyle(insight.type)}`}
          >
            <div className="flex items-start space-x-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${getIconStyle(insight.type)}`}>
                <span className="text-2xl">{insight.icon}</span>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {insight.title}
                </h3>
                <p className="text-gray-700 leading-relaxed">
                  {insight.description}
                </p>
                {insight.action && (
                  <button className="mt-4 px-4 py-2 text-sm font-medium bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors shadow-sm">
                    {insight.action} →
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 趋势图预览 */}
      <div className="bg-white rounded-xl p-6 border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">成本趋势（最近7天）</h3>
        <div className="h-48 flex items-end space-x-2">
          {[65, 78, 82, 71, 88, 95, stats.todayCost].map((value, index) => (
            <div
              key={index}
              className="flex-1 bg-gradient-to-t from-purple-500 to-indigo-500 rounded-t-lg relative group cursor-pointer hover:from-purple-600 hover:to-indigo-600 transition-all"
              style={{ height: `${(value / 100) * 100}%` }}
            >
              <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                ${value.toFixed(2)}
              </div>
            </div>
          ))}
        </div>
        <div className="flex justify-between mt-4 text-xs text-gray-500">
          <span>7天前</span>
          <span>今天</span>
        </div>
      </div>
    </div>
  );
}
