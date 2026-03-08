import { useState } from 'react';
import type { SecurityScanResult, TokenReport } from '../../../../src/types';
import AgentCard from './AgentCard';
import TokenStats from './TokenStats';
import ScoreGauge from './ScoreGauge';

interface DashboardProps {
  scanData: {
    results: SecurityScanResult[];
    tokenReport: TokenReport;
  } | null;
}

export default function Dashboard({ scanData }: DashboardProps) {
  const [activeTab, setActiveTab] = useState<'security' | 'tokens'>('security');

  if (!scanData) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-gray-500">No data available</p>
      </div>
    );
  }

  const { results, tokenReport } = scanData;

  // Calculate statistics
  const avgScore = results.length > 0
    ? Math.round(results.reduce((sum, r) => sum + r.score, 0) / results.length)
    : 0;

  const criticalCount = results.reduce((sum, r) =>
    sum + r.issues.filter(i => i.severity === 'critical').length, 0);

  const highCount = results.reduce((sum, r) =>
    sum + r.issues.filter(i => i.severity === 'high').length, 0);

  const runningAgents = results.filter(r => r.agent.status === 'running').length;

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-8 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">🛡️</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">AgentGuard</h1>
              <p className="text-sm text-gray-500">AI Agent Security Monitor</p>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <button
              onClick={() => window.electronAPI.toggleFloatingWindow()}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Toggle Widget
            </button>
            <button
              onClick={() => window.electronAPI.scanAgents()}
              className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-purple-500 to-indigo-600 rounded-lg hover:from-purple-600 hover:to-indigo-700 transition-all shadow-sm"
            >
              Scan Now
            </button>
          </div>
        </div>
      </header>

      {/* Stats Overview */}
      <div className="px-8 py-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Overall Score */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-gray-600">Security Score</h3>
              <ScoreGauge score={avgScore} size={60} />
            </div>
            <div className="text-3xl font-bold text-gray-900">{avgScore}/100</div>
            <p className="text-sm text-gray-500 mt-1">
              {avgScore >= 90 ? 'Excellent' :
               avgScore >= 70 ? 'Good' :
               avgScore >= 50 ? 'Fair' : 'Poor'}
            </p>
          </div>

          {/* Running Agents */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-gray-600">Active Agents</h3>
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <span className="text-2xl">🤖</span>
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900">{runningAgents}/{results.length}</div>
            <p className="text-sm text-gray-500 mt-1">Agents running</p>
          </div>

          {/* Critical Issues */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-gray-600">Critical Issues</h3>
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <span className="text-2xl">🔴</span>
              </div>
            </div>
            <div className="text-3xl font-bold text-red-600">{criticalCount}</div>
            <p className="text-sm text-gray-500 mt-1">
              {highCount > 0 && `+${highCount} high severity`}
            </p>
          </div>

          {/* Today's Cost */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-gray-600">Today's Cost</h3>
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-2xl">💰</span>
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900">
              ${tokenReport.totalCost.today.toFixed(2)}
            </div>
            <p className="text-sm text-gray-500 mt-1">
              ${tokenReport.totalCost.thisMonth.toFixed(2)} this month
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="px-8">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('security')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'security'
                  ? 'border-purple-500 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Security Overview
            </button>
            <button
              onClick={() => setActiveTab('tokens')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'tokens'
                  ? 'border-purple-500 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Token Usage & Cost
            </button>
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="px-8 py-6">
        {activeTab === 'security' ? (
          <div className="space-y-6">
            {results.map((result) => (
              <AgentCard key={result.agent.id} result={result} />
            ))}
          </div>
        ) : (
          <TokenStats tokenReport={tokenReport} />
        )}
      </div>
    </div>
  );
}
