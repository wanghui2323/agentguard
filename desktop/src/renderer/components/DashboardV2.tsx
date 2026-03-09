import { useState, useMemo } from 'react';
import type { SecurityScanResult, TokenReport } from '../../../../src/types';
import AgentCard from './AgentCard';
import TokenStats from './TokenStats';
import ScoreGauge from './ScoreGauge';
import InsightsPanel from './InsightsPanel';
import OptimizationSuggestions from './OptimizationSuggestions';

interface DashboardProps {
  scanData: {
    results: SecurityScanResult[];
    tokenReport: TokenReport;
  } | null;
}

export default function DashboardV2({ scanData }: DashboardProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'security' | 'tokens' | 'insights'>('overview');

  if (!scanData) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-pulse">
            <span className="text-3xl">🛡️</span>
          </div>
          <p className="text-gray-500 text-lg">正在加载数据...</p>
        </div>
      </div>
    );
  }

  const { results, tokenReport } = scanData;

  // 计算统计数据
  const stats = useMemo(() => {
    const avgScore = results.length > 0
      ? Math.round(results.reduce((sum, r) => sum + r.score, 0) / results.length)
      : 0;

    const criticalCount = results.reduce((sum, r) =>
      sum + r.issues.filter(i => i.severity === 'critical').length, 0);

    const highCount = results.reduce((sum, r) =>
      sum + r.issues.filter(i => i.severity === 'high').length, 0);

    const mediumCount = results.reduce((sum, r) =>
      sum + r.issues.filter(i => i.severity === 'medium').length, 0);

    const runningAgents = results.filter(r => r.agent.status === 'running').length;

    const todayCost = tokenReport.totalCost.today;
    const monthlyCost = tokenReport.totalCost.thisMonth;

    // 预估月底成本
    const now = new Date();
    const dayOfMonth = now.getDate();
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const estimatedMonthCost = (todayCost / dayOfMonth) * daysInMonth;

    return {
      avgScore,
      criticalCount,
      highCount,
      mediumCount,
      runningAgents,
      totalAgents: results.length,
      todayCost,
      monthlyCost,
      estimatedMonthCost,
    };
  }, [results, tokenReport]);

  // 计算健康状态
  const healthStatus = useMemo(() => {
    if (stats.criticalCount > 0) return { level: 'critical', color: 'red', label: '需要立即处理' };
    if (stats.highCount > 5) return { level: 'warning', color: 'yellow', label: '建议尽快优化' };
    if (stats.avgScore >= 90) return { level: 'excellent', color: 'green', label: '运行状态优秀' };
    if (stats.avgScore >= 70) return { level: 'good', color: 'blue', label: '运行状态良好' };
    return { level: 'fair', color: 'orange', label: '需要注意' };
  }, [stats]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-lg border-b border-gray-200/50 px-8 py-4 sticky top-0 z-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 via-indigo-600 to-purple-700 rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-white text-2xl">🛡️</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                AgentGuard
              </h1>
              <p className="text-sm text-gray-500">AI Agent 智能监控与优化</p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {/* 健康状态指示器 */}
            <div className={`px-4 py-2 rounded-lg flex items-center space-x-2 ${
              healthStatus.level === 'critical' ? 'bg-red-50 text-red-700' :
              healthStatus.level === 'warning' ? 'bg-yellow-50 text-yellow-700' :
              healthStatus.level === 'excellent' ? 'bg-green-50 text-green-700' :
              'bg-blue-50 text-blue-700'
            }`}>
              <div className={`w-2 h-2 rounded-full ${
                healthStatus.level === 'critical' ? 'bg-red-500 animate-pulse' :
                healthStatus.level === 'warning' ? 'bg-yellow-500' :
                'bg-green-500'
              }`} />
              <span className="text-sm font-medium">{healthStatus.label}</span>
            </div>

            <button
              onClick={() => window.electronAPI.toggleFloatingWindow()}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-all shadow-sm"
            >
              悬浮窗
            </button>
            <button
              onClick={() => window.electronAPI.scanAgents()}
              className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-purple-500 to-indigo-600 rounded-lg hover:from-purple-600 hover:to-indigo-700 transition-all shadow-md hover:shadow-lg"
            >
              立即扫描
            </button>
          </div>
        </div>
      </header>

      {/* 核心指标卡片 */}
      <div className="px-8 py-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* 安全评分 */}
          <div className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow p-6 border border-gray-100">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-sm font-medium text-gray-600 mb-1">安全评分</h3>
                <div className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
                  {stats.avgScore}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {stats.avgScore >= 90 ? '优秀' :
                   stats.avgScore >= 70 ? '良好' :
                   stats.avgScore >= 50 ? '一般' : '较差'}
                </p>
              </div>
              <ScoreGauge score={stats.avgScore} size={64} />
            </div>
            <div className="mt-4 pt-4 border-t border-gray-100">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-500">趋势</span>
                <span className="text-green-600 flex items-center">
                  ↑ 2.5% <span className="ml-1 text-gray-400">vs 上周</span>
                </span>
              </div>
            </div>
          </div>

          {/* 运行状态 */}
          <div className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow p-6 border border-gray-100">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-sm font-medium text-gray-600 mb-1">运行状态</h3>
                <div className="text-3xl font-bold text-gray-900">
                  {stats.runningAgents}<span className="text-xl text-gray-400">/{stats.totalAgents}</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">活跃 Agent</p>
              </div>
              <div className="w-16 h-16 bg-gradient-to-br from-green-100 to-emerald-100 rounded-2xl flex items-center justify-center">
                <span className="text-3xl">🤖</span>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-100">
              <div className="flex items-center space-x-2">
                {results.slice(0, 3).map((r, i) => (
                  <div key={i} className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-400 to-indigo-500 flex items-center justify-center text-white text-xs font-semibold shadow-sm">
                    {r.agent.name.substring(0, 2).toUpperCase()}
                  </div>
                ))}
                {results.length > 3 && (
                  <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 text-xs font-medium">
                    +{results.length - 3}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 安全问题 */}
          <div className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow p-6 border border-gray-100">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-sm font-medium text-gray-600 mb-1">安全问题</h3>
                <div className="text-3xl font-bold text-red-600">
                  {stats.criticalCount}
                </div>
                <p className="text-xs text-gray-500 mt-1">严重问题</p>
              </div>
              <div className="w-16 h-16 bg-gradient-to-br from-red-100 to-rose-100 rounded-2xl flex items-center justify-center">
                <span className="text-3xl">⚠️</span>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-100 space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-500">高危</span>
                <span className="font-semibold text-orange-600">{stats.highCount}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-500">中危</span>
                <span className="font-semibold text-yellow-600">{stats.mediumCount}</span>
              </div>
            </div>
          </div>

          {/* Token 消耗 */}
          <div className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow p-6 border border-gray-100">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-sm font-medium text-gray-600 mb-1">今日消耗</h3>
                <div className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                  ${stats.todayCost.toFixed(2)}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  本月 ${stats.monthlyCost.toFixed(2)}
                </p>
              </div>
              <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-cyan-100 rounded-2xl flex items-center justify-center">
                <span className="text-3xl">💰</span>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-100">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-500">预估月底</span>
                <span className="font-semibold text-blue-600">
                  ${stats.estimatedMonthCost.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="px-8">
        <div className="bg-white rounded-t-2xl border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {[
              { key: 'overview', label: '智能概览', icon: '📊' },
              { key: 'security', label: '安全分析', icon: '🔒' },
              { key: 'tokens', label: 'Token 分析', icon: '💎' },
              { key: 'insights', label: '优化建议', icon: '💡' },
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-all flex items-center space-x-2 ${
                  activeTab === tab.key
                    ? 'border-purple-500 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="px-8 py-6 bg-white rounded-b-2xl mx-8 mb-8 shadow-sm">
        {activeTab === 'overview' && (
          <InsightsPanel
            stats={stats}
            results={results}
            tokenReport={tokenReport}
          />
        )}

        {activeTab === 'security' && (
          <div className="space-y-6">
            {results.map((result) => (
              <AgentCard key={result.agent.id} result={result} />
            ))}
          </div>
        )}

        {activeTab === 'tokens' && (
          <TokenStats tokenReport={tokenReport} />
        )}

        {activeTab === 'insights' && (
          <OptimizationSuggestions
            stats={stats}
            results={results}
            tokenReport={tokenReport}
          />
        )}
      </div>
    </div>
  );
}
