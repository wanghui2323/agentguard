import type { TokenReport } from '../../../../src/types';

interface TokenStatsProps {
  tokenReport: TokenReport;
}

export default function TokenStats({ tokenReport }: TokenStatsProps) {
  const formatTokens = (usage: any): string => {
    const total = usage.totalTokens.toLocaleString();
    if (usage.inputTokens > 0 && usage.outputTokens > 0) {
      return `${total} tokens (${usage.inputTokens.toLocaleString()} in / ${usage.outputTokens.toLocaleString()} out)`;
    }
    return `${total} tokens`;
  };

  const getBudgetPercentage = (used: number, budget: number): number => {
    return Math.min((used / budget) * 100, 100);
  };

  const getBudgetColor = (percentage: number): string => {
    if (percentage >= 90) return 'bg-red-500';
    if (percentage >= 80) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  return (
    <div className="space-y-6">
      {/* Cost Summary */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">💰 Cost Summary</h3>
        <div className="grid grid-cols-3 gap-6">
          <div>
            <p className="text-sm text-gray-600 mb-1">Today</p>
            <p className="text-3xl font-bold text-gray-900">
              ${tokenReport.totalCost.today.toFixed(2)}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-1">This Week</p>
            <p className="text-3xl font-bold text-gray-900">
              ${tokenReport.totalCost.thisWeek.toFixed(2)}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-1">This Month</p>
            <p className="text-3xl font-bold text-gray-900">
              ${tokenReport.totalCost.thisMonth.toFixed(2)}
            </p>
          </div>
        </div>
      </div>

      {/* Budget Tracking */}
      {tokenReport.budget &&
        (tokenReport.budget.daily ||
          tokenReport.budget.weekly ||
          tokenReport.budget.monthly) && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              📊 Budget Tracking
            </h3>
            <div className="space-y-4">
              {tokenReport.budget.daily && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Daily</span>
                    <span className="text-sm text-gray-600">
                      ${tokenReport.totalCost.today.toFixed(2)} / $
                      {tokenReport.budget.daily.toFixed(2)}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all ${getBudgetColor(
                        getBudgetPercentage(
                          tokenReport.totalCost.today,
                          tokenReport.budget.daily
                        )
                      )}`}
                      style={{
                        width: `${getBudgetPercentage(
                          tokenReport.totalCost.today,
                          tokenReport.budget.daily
                        )}%`,
                      }}
                    ></div>
                  </div>
                </div>
              )}

              {tokenReport.budget.weekly && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Weekly</span>
                    <span className="text-sm text-gray-600">
                      ${tokenReport.totalCost.thisWeek.toFixed(2)} / $
                      {tokenReport.budget.weekly.toFixed(2)}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all ${getBudgetColor(
                        getBudgetPercentage(
                          tokenReport.totalCost.thisWeek,
                          tokenReport.budget.weekly
                        )
                      )}`}
                      style={{
                        width: `${getBudgetPercentage(
                          tokenReport.totalCost.thisWeek,
                          tokenReport.budget.weekly
                        )}%`,
                      }}
                    ></div>
                  </div>
                </div>
              )}

              {tokenReport.budget.monthly && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Monthly</span>
                    <span className="text-sm text-gray-600">
                      ${tokenReport.totalCost.thisMonth.toFixed(2)} / $
                      {tokenReport.budget.monthly.toFixed(2)}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all ${getBudgetColor(
                        getBudgetPercentage(
                          tokenReport.totalCost.thisMonth,
                          tokenReport.budget.monthly
                        )
                      )}`}
                      style={{
                        width: `${getBudgetPercentage(
                          tokenReport.totalCost.thisMonth,
                          tokenReport.budget.monthly
                        )}%`,
                      }}
                    ></div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

      {/* Alerts */}
      {tokenReport.alerts.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-red-900 mb-3">
            ⚠️ Budget Alerts
          </h3>
          <ul className="space-y-2">
            {tokenReport.alerts.map((alert, index) => (
              <li key={index} className="text-sm text-red-800 flex items-start">
                <span className="mr-2">•</span>
                <span>{alert}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Per-Agent Breakdown */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          🤖 Per-Agent Breakdown
        </h3>
        <div className="space-y-6">
          {tokenReport.agents.map((stats) => (
            <div key={stats.agent.id} className="border-b border-gray-100 pb-6 last:border-0 last:pb-0">
              <h4 className="font-semibold text-gray-900 mb-3">{stats.agent.name}</h4>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-gray-600 mb-1">Today</p>
                  <p className="font-medium text-gray-900">
                    {formatTokens(stats.today)}
                  </p>
                  <p className="text-blue-600 font-semibold mt-1">
                    ${stats.today.estimatedCost.toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600 mb-1">This Week</p>
                  <p className="font-medium text-gray-900">
                    {formatTokens(stats.thisWeek)}
                  </p>
                  <p className="text-blue-600 font-semibold mt-1">
                    ${stats.thisWeek.estimatedCost.toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600 mb-1">This Month</p>
                  <p className="font-medium text-gray-900">
                    {formatTokens(stats.thisMonth)}
                  </p>
                  <p className="text-blue-600 font-semibold mt-1">
                    ${stats.thisMonth.estimatedCost.toFixed(2)}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Pricing Note */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <p className="text-sm text-blue-800">
          <strong>💡 Note:</strong> Costs are estimated based on 2026 API pricing. Claude
          Opus 4.6: $15/$75 per 1M tokens, Cursor: $10/$30 (estimated), OpenClaw:
          $0.50/$1.50 per 1M tokens.
        </p>
      </div>
    </div>
  );
}
