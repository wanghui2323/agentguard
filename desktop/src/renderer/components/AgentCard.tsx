import { useState } from 'react';
import type { SecurityScanResult } from '../../../../src/types';
import ScoreGauge from './ScoreGauge';
import IssueItem from './IssueItem';

interface AgentCardProps {
  result: SecurityScanResult;
}

export default function AgentCard({ result }: AgentCardProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isFixing, setIsFixing] = useState(false);

  const { agent, score, issues } = result;

  const handleStop = async () => {
    const response = await window.electronAPI.stopAgent(agent.id);
    if (response.success) {
      // Success notification
    }
  };

  const handleRestart = async () => {
    const response = await window.electronAPI.restartAgent(agent.id);
    if (response.success) {
      // Success notification
    }
  };

  const handleFix = async () => {
    setIsFixing(true);
    const response = await window.electronAPI.fixIssues(agent.id);
    setIsFixing(false);
    if (response.success) {
      // Success notification and trigger rescan
      await window.electronAPI.scanAgents();
    }
  };

  const canControl = agent.status === 'running';
  const autoFixableCount = issues.filter(i => i.autoFixable).length;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden transition-all hover:shadow-md">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {/* Agent Icon */}
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">
                {agent.name.charAt(0)}
              </span>
            </div>

            {/* Agent Info */}
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-lg font-semibold text-gray-900">
                  {agent.name}
                </h3>
                <span
                  className={`px-2 py-1 text-xs font-medium rounded-full ${
                    agent.status === 'running'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {agent.status === 'running' ? '● Running' : '○ Stopped'}
                </span>
              </div>
              <div className="flex items-center space-x-3 mt-1 text-sm text-gray-500">
                {agent.pid && <span>PID {agent.pid}</span>}
                {agent.port && <span>Port {agent.port}</span>}
                <span className="text-xs text-gray-400">
                  {agent.detectedAt ? new Date(agent.detectedAt).toLocaleTimeString() : ''}
                </span>
              </div>
            </div>
          </div>

          {/* Score */}
          <div className="flex items-center space-x-4">
            <ScoreGauge score={score} size={80} />
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg
                className={`w-5 h-5 transform transition-transform ${
                  isExpanded ? 'rotate-180' : ''
                }`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="px-6 py-4">
          {/* Issues */}
          {issues.length > 0 ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-semibold text-gray-700">
                  Security Issues ({issues.length})
                </h4>
                {autoFixableCount > 0 && (
                  <span className="text-xs text-green-600">
                    {autoFixableCount} auto-fixable
                  </span>
                )}
              </div>

              {issues.map((issue, index) => (
                <IssueItem key={index} issue={issue} />
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center py-8 text-green-600">
              <svg
                className="w-8 h-8 mr-2"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span className="font-medium">No security issues detected</span>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center space-x-3 mt-6 pt-4 border-t border-gray-100">
            {autoFixableCount > 0 && (
              <button
                onClick={handleFix}
                disabled={isFixing}
                className="flex-1 px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-purple-500 to-indigo-600 rounded-lg hover:from-purple-600 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {isFixing ? (
                  <span className="flex items-center justify-center">
                    <svg
                      className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Fixing...
                  </span>
                ) : (
                  `Fix ${autoFixableCount} Issues`
                )}
              </button>
            )}

            {canControl && (
              <>
                <button
                  onClick={handleStop}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Stop
                </button>
                <button
                  onClick={handleRestart}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Restart
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
