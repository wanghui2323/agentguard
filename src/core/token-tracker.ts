/**
 * Token Usage Tracker (Fixed with REAL Claude data)
 */
import type {
  Agent,
  TokenUsage,
  TokenStats,
  TokenReport,
  CostBudget
} from '../types';
import { getTodayTokens, getThisWeekTokens, getThisMonthTokens, parseClaudeStats } from './claude-stats-parser';

export class TokenTracker {
  private budget: CostBudget = {};
  private manualConfigCache: any = null;
  private manualConfigCacheTime: number = 0;

  /**
   * Get token statistics for all agents
   */
  async getTokenReport(agents: Agent[]): Promise<TokenReport> {
    const agentStats: TokenStats[] = [];

    for (const agent of agents) {
      const stats = await this.getAgentTokenStats(agent);
      if (stats) {
        agentStats.push(stats);
      }
    }

    const totalCost = this.calculateTotalCost(agentStats);
    const alerts = this.checkBudgetAlerts(totalCost);
    const totalTokens = agentStats.reduce((sum, s) => sum + s.today.totalTokens, 0);

    return {
      generatedAt: new Date(),
      agents: agentStats,
      totalCost,
      totalTokens,
      budget: this.budget,
      alerts
    };
  }

  /**
   * Get token statistics for a specific agent
   */
  async getAgentTokenStats(agent: Agent): Promise<TokenStats | null> {
    try {
      let today: TokenUsage;
      let thisWeek: TokenUsage;
      let thisMonth: TokenUsage;

      switch (agent.id) {
        case 'claude':
          ({ today, thisWeek, thisMonth } = await this.getClaudeTokenStats(agent));
          break;
        case 'cursor':
          ({ today, thisWeek, thisMonth } = await this.getCursorTokenStats(agent));
          break;
        default:
          return null;
      }

      return {
        agent,
        today,
        thisWeek,
        thisMonth
      };
    } catch (error) {
      console.error(`Failed to get token stats for ${agent.name}:`, error);
      return null;
    }
  }

  /**
   * Get Claude token statistics from REAL data in ~/.claude/stats-cache.json
   * 或从手动配置文件读取 (VS Code 插件)
   */
  private async getClaudeTokenStats(agent: Agent): Promise<{
    today: TokenUsage;
    thisWeek: TokenUsage;
    thisMonth: TokenUsage;
  }> {
    try {
      // 1. 尝试读取手动配置 (优先，因为更准确)
      const manualStats = await this.readManualConfig();
      if (manualStats) {
        return manualStats;
      }

      // 2. 降级到 stats-cache.json
      const todayTokens = await getTodayTokens();
      const weekTokens = await getThisWeekTokens();
      const monthTokens = await getThisMonthTokens();

      // Get full stats for accurate cost calculation
      const stats = await parseClaudeStats();

      // Calculate costs with FULL pricing (including cache)
      const todayCost = await this.calculateClaudeCostAccurate(todayTokens.totalTokens, 'daily');
      const weekCost = await this.calculateClaudeCostAccurate(weekTokens.totalTokens, 'weekly');
      const monthCost = await this.calculateClaudeCostAccurate(monthTokens.totalTokens, 'monthly');

      const today: TokenUsage = {
        agentId: agent.id,
        agentName: agent.name,
        inputTokens: todayTokens.inputTokens,
        outputTokens: todayTokens.outputTokens,
        totalTokens: todayTokens.totalTokens,
        estimatedCost: todayCost,
        period: 'daily',
        timestamp: new Date()
      };

      const thisWeek: TokenUsage = {
        agentId: agent.id,
        agentName: agent.name,
        inputTokens: weekTokens.inputTokens,
        outputTokens: weekTokens.outputTokens,
        totalTokens: weekTokens.totalTokens,
        estimatedCost: weekCost,
        period: 'weekly',
        timestamp: new Date()
      };

      const thisMonth: TokenUsage = {
        agentId: agent.id,
        agentName: agent.name,
        inputTokens: monthTokens.inputTokens,
        outputTokens: monthTokens.outputTokens,
        totalTokens: monthTokens.totalTokens,
        estimatedCost: monthCost,
        period: 'monthly',
        timestamp: new Date()
      };

      return { today, thisWeek, thisMonth };
    } catch (error) {
      console.error('Failed to read Claude stats:', error);
      return this.getEmptyTokenStats(agent);
    }
  }

  /**
   * Calculate accurate Claude cost including cache tokens
   */
  private async calculateClaudeCostAccurate(totalTokens: number, period: 'daily' | 'weekly' | 'monthly'): Promise<number> {
    try {
      const stats = await parseClaudeStats();
      if (!stats) return 0;

      let cost = 0;

      // Calculate based on model usage proportions
      for (const [model, usage] of Object.entries(stats.modelUsage)) {
        const modelTotal = usage.inputTokens + usage.outputTokens + usage.cacheReadInputTokens + usage.cacheCreationInputTokens;
        if (modelTotal === 0) continue;

        // Proportion of this model
        const proportion = modelTotal / Object.values(stats.modelUsage).reduce((sum, u) =>
          sum + u.inputTokens + u.outputTokens + u.cacheReadInputTokens + u.cacheCreationInputTokens, 0);

        // Estimate token breakdown for this period
        const periodTokens = totalTokens * proportion;
        const inputRatio = usage.inputTokens / modelTotal;
        const outputRatio = usage.outputTokens / modelTotal;
        const cacheReadRatio = usage.cacheReadInputTokens / modelTotal;
        const cacheCreateRatio = usage.cacheCreationInputTokens / modelTotal;

        const periodInput = periodTokens * inputRatio;
        const periodOutput = periodTokens * outputRatio;
        const periodCacheRead = periodTokens * cacheReadRatio;
        const periodCacheCreate = periodTokens * cacheCreateRatio;

        // Apply correct pricing per model
        if (model.includes('sonnet')) {
          // Sonnet 4.6: $3/$15 per 1M, cache read $0.30, cache create $3.75
          cost += (periodInput * 3 + periodOutput * 15 + periodCacheRead * 0.30 + periodCacheCreate * 3.75) / 1_000_000;
        } else if (model.includes('opus')) {
          // Opus 4.6: $15/$75 per 1M, cache read $1.50, cache create $18.75
          cost += (periodInput * 15 + periodOutput * 75 + periodCacheRead * 1.50 + periodCacheCreate * 18.75) / 1_000_000;
        } else if (model.includes('haiku')) {
          // Haiku 4.5: $0.25/$1.25 per 1M, cache read $0.03, cache create $0.30
          cost += (periodInput * 0.25 + periodOutput * 1.25 + periodCacheRead * 0.03 + periodCacheCreate * 0.30) / 1_000_000;
        }
      }

      return cost;
    } catch (error) {
      // Fallback to simple estimation
      return (totalTokens * 10) / 1_000_000; // $10 per 1M as fallback
    }
  }

  /**
   * Get Cursor token statistics from SQLite database
   */
  private async getCursorTokenStats(agent: Agent): Promise<{
    today: TokenUsage;
    thisWeek: TokenUsage;
    thisMonth: TokenUsage;
  }> {
    try {
      const { execSync } = require('child_process');
      const os = require('os');
      const path = require('path');
      const fs = require('fs');

      const dbPath = path.join(os.homedir(), '.cursor', 'ai-tracking', 'ai-code-tracking.db');

      // 检查数据库是否存在
      if (!fs.existsSync(dbPath)) {
        return this.getEmptyTokenStats(agent);
      }

      // 查询今日数据
      const todayQuery = `SELECT COUNT(*) as count FROM ai_code_hashes WHERE timestamp > (strftime('%s', 'now', 'start of day') * 1000)`;
      const todayResult = execSync(`sqlite3 "${dbPath}" "${todayQuery}"`, { encoding: 'utf-8' });
      const todayCount = parseInt(todayResult.trim() || '0');

      // 查询本周数据
      const weekQuery = `SELECT COUNT(*) as count FROM ai_code_hashes WHERE timestamp > (strftime('%s', 'now', '-7 days') * 1000)`;
      const weekResult = execSync(`sqlite3 "${dbPath}" "${weekQuery}"`, { encoding: 'utf-8' });
      const weekCount = parseInt(weekResult.trim() || '0');

      // 查询本月数据
      const monthQuery = `SELECT COUNT(*) as count FROM ai_code_hashes WHERE timestamp > (strftime('%s', 'now', 'start of month') * 1000)`;
      const monthResult = execSync(`sqlite3 "${dbPath}" "${monthQuery}"`, { encoding: 'utf-8' });
      const monthCount = parseInt(monthResult.trim() || '0');

      // 每次代码生成约 500 tokens (200 input + 300 output)
      const todayTokens = todayCount * 500;
      const weekTokens = weekCount * 500;
      const monthTokens = monthCount * 500;

      const today: TokenUsage = {
        agentId: agent.id,
        agentName: agent.name,
        inputTokens: Math.round(todayTokens * 0.4),
        outputTokens: Math.round(todayTokens * 0.6),
        totalTokens: todayTokens,
        estimatedCost: this.calculateCursorCost(todayTokens),
        period: 'daily',
        timestamp: new Date()
      };

      const thisWeek: TokenUsage = {
        agentId: agent.id,
        agentName: agent.name,
        inputTokens: Math.round(weekTokens * 0.4),
        outputTokens: Math.round(weekTokens * 0.6),
        totalTokens: weekTokens,
        estimatedCost: this.calculateCursorCost(weekTokens),
        period: 'weekly',
        timestamp: new Date()
      };

      const thisMonth: TokenUsage = {
        agentId: agent.id,
        agentName: agent.name,
        inputTokens: Math.round(monthTokens * 0.4),
        outputTokens: Math.round(monthTokens * 0.6),
        totalTokens: monthTokens,
        estimatedCost: this.calculateCursorCost(monthTokens),
        period: 'monthly',
        timestamp: new Date()
      };

      return { today, thisWeek, thisMonth };
    } catch (error) {
      console.error('Failed to query Cursor database:', error);
      return this.getEmptyTokenStats(agent);
    }
  }

  /**
   * Calculate Cursor cost (uses Claude Sonnet/Opus pricing)
   */
  private calculateCursorCost(totalTokens: number): number {
    // Cursor 使用 Sonnet/Opus 混合 (假设 80% Sonnet, 20% Opus)
    // Sonnet: Input $3/1M, Output $15/1M
    // Opus: Input $15/1M, Output $75/1M
    const inputTokens = totalTokens * 0.4;
    const outputTokens = totalTokens * 0.6;

    const sonnetCost = (inputTokens * 0.8 * 3 + outputTokens * 0.8 * 15) / 1_000_000;
    const opusCost = (inputTokens * 0.2 * 15 + outputTokens * 0.2 * 75) / 1_000_000;

    return sonnetCost + opusCost;
  }

  /**
   * Get empty token stats
   */
  private getEmptyTokenStats(agent: Agent) {
    const empty: TokenUsage = {
      agentId: agent.id,
      agentName: agent.name,
      inputTokens: 0,
      outputTokens: 0,
      totalTokens: 0,
      estimatedCost: 0,
      period: 'daily',
      timestamp: new Date()
    };

    return {
      today: { ...empty, period: 'daily' as const },
      thisWeek: { ...empty, period: 'weekly' as const },
      thisMonth: { ...empty, period: 'monthly' as const }
    };
  }

  /**
   * Calculate total cost across all agents
   */
  private calculateTotalCost(stats: TokenStats[]): {
    today: number;
    thisWeek: number;
    thisMonth: number;
  } {
    return {
      today: stats.reduce((sum, s) => sum + s.today.estimatedCost, 0),
      thisWeek: stats.reduce((sum, s) => sum + s.thisWeek.estimatedCost, 0),
      thisMonth: stats.reduce((sum, s) => sum + s.thisMonth.estimatedCost, 0)
    };
  }

  /**
   * Check budget and generate alerts
   */
  private checkBudgetAlerts(totalCost: { today: number; thisWeek: number; thisMonth: number }): string[] {
    const alerts: string[] = [];

    if (this.budget.daily && totalCost.today > this.budget.daily) {
      const excess = totalCost.today - this.budget.daily;
      alerts.push(`Daily budget exceeded by $${excess.toFixed(2)}`);
    }

    if (this.budget.monthly && totalCost.thisMonth > this.budget.monthly) {
      const excess = totalCost.thisMonth - this.budget.monthly;
      alerts.push(`Monthly budget exceeded by $${excess.toFixed(2)}`);
    }

    return alerts;
  }

  /**
   * Read manual configuration from ~/.agentguard/manual-stats.json
   */
  private async readManualConfig(): Promise<{
    today: TokenUsage;
    thisWeek: TokenUsage;
    thisMonth: TokenUsage;
  } | null> {
    try {
      const os = require('os');
      const path = require('path');
      const fs = require('fs').promises;

      // 缓存5分钟，避免频繁读取文件
      const now = Date.now();
      if (this.manualConfigCache && (now - this.manualConfigCacheTime) < 5 * 60 * 1000) {
        if (!this.manualConfigCache['claude-vscode']) return null;
        return this.createTokenUsageFromManual(this.manualConfigCache['claude-vscode']);
      }

      const configPath = path.join(os.homedir(), '.agentguard', 'manual-stats.json');

      try {
        const content = await fs.readFile(configPath, 'utf-8');
        const config = JSON.parse(content);
        this.manualConfigCache = config;
        this.manualConfigCacheTime = now;

        if (config['claude-vscode']) {
          return this.createTokenUsageFromManual(config['claude-vscode']);
        }
      } catch (err) {
        // 文件不存在或解析失败，返回 null
        return null;
      }

      return null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Create TokenUsage from manual configuration
   */
  private createTokenUsageFromManual(config: any): {
    today: TokenUsage;
    thisWeek: TokenUsage;
    thisMonth: TokenUsage;
  } {
    const today: TokenUsage = {
      agentId: 'claude',
      agentName: 'Claude Code (VS Code)',
      inputTokens: 0,
      outputTokens: 0,
      totalTokens: 0,
      estimatedCost: config.today || 0,
      period: 'daily',
      timestamp: new Date()
    };

    const thisWeek: TokenUsage = {
      agentId: 'claude',
      agentName: 'Claude Code (VS Code)',
      inputTokens: 0,
      outputTokens: 0,
      totalTokens: 0,
      estimatedCost: config.thisMonth || 0, // 周用月数据估算
      period: 'weekly',
      timestamp: new Date()
    };

    const thisMonth: TokenUsage = {
      agentId: 'claude',
      agentName: 'Claude Code (VS Code)',
      inputTokens: 0,
      outputTokens: 0,
      totalTokens: 0,
      estimatedCost: config.thisMonth || 0,
      period: 'monthly',
      timestamp: new Date()
    };

    return { today, thisWeek, thisMonth };
  }

  /**
   * Set budget limits
   */
  setBudget(budget: CostBudget): void {
    this.budget = budget;
  }

  /**
   * Get current budget
   */
  getBudget(): CostBudget {
    return this.budget;
  }
}
