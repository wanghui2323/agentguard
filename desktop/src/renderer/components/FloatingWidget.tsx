import { useEffect, useState } from 'react';

interface ScanSummary {
  score: number;
  agentCount: number;
  criticalIssues: number;
  totalCost: number;
}

export default function FloatingWidget() {
  const [summary, setSummary] = useState<ScanSummary>({
    score: 0,
    agentCount: 0,
    criticalIssues: 0,
    totalCost: 0,
  });

  useEffect(() => {
    // Listen for scan summary updates
    window.electronAPI.onScanSummary((data: ScanSummary) => {
      setSummary(data);
    });

    return () => {
      window.electronAPI.removeAllListeners('scan-summary');
    };
  }, []);

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-500';
    if (score >= 70) return 'text-lime-500';
    if (score >= 50) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getScoreEmoji = (score: number) => {
    if (score >= 90) return '✅';
    if (score >= 70) return '🟢';
    if (score >= 50) return '🟡';
    return '🔴';
  };

  return (
    <div className="w-full h-full bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden">
      {/* Draggable Header */}
      <div className="bg-gradient-to-r from-purple-500 to-indigo-600 px-4 py-2 cursor-move select-none">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-white font-bold text-sm">🛡️ AgentGuard</span>
          </div>
          <button
            onClick={() => window.electronAPI.toggleFloatingWindow()}
            className="text-white hover:text-gray-200 transition-colors"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        {/* Security Score */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-2xl">{getScoreEmoji(summary.score)}</span>
            <div>
              <p className="text-xs text-gray-500">Security Score</p>
              <p className={`text-2xl font-bold ${getScoreColor(summary.score)}`}>
                {summary.score}
                <span className="text-sm text-gray-400">/100</span>
              </p>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          {/* Agents */}
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-xs text-gray-500 mb-1">Agents</p>
            <p className="text-xl font-bold text-gray-900">{summary.agentCount}</p>
          </div>

          {/* Critical Issues */}
          <div className="bg-red-50 rounded-lg p-3">
            <p className="text-xs text-red-600 mb-1">Critical</p>
            <p className="text-xl font-bold text-red-600">{summary.criticalIssues}</p>
          </div>
        </div>

        {/* Cost */}
        <div className="bg-blue-50 rounded-lg p-3">
          <p className="text-xs text-blue-600 mb-1">Today's Cost</p>
          <p className="text-xl font-bold text-blue-600">
            ${summary.totalCost.toFixed(2)}
          </p>
        </div>

        {/* Last Update */}
        <div className="text-center">
          <p className="text-xs text-gray-400">
            Auto-updating every 10s
          </p>
        </div>
      </div>
    </div>
  );
}
