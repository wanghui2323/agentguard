/**
 * Token Usage Tracker
 */
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';
import type {
  Agent,
  TokenUsage,
  TokenStats,
  TokenUsageHistory,
  TokenReport,
  CostBudget
} from '../types';
import { expandHome } from '../utils/config';

export class TokenTracker {
  private budget: CostBudget = {};

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

    return {
      generatedAt: new Date(),
      agents: agentStats,
      totalCost,
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
        case 'openclaw':
          ({ today, thisWeek, thisMonth } = await this.getOpenClawTokenStats(agent));
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
   * Get Claude Code token statistics
   */
  private async getClaudeTokenStats(agent: Agent): Promise<{
    today: TokenUsage;
    thisWeek: TokenUsage;
    thisMonth: TokenUsage;
  }> {
    // Claude Code logs are typically in ~/.claude/logs/
    const logsDir = expandHome('~/.claude/logs');

    try {
      // Try to read recent log files
      const files = await fs.readdir(logsDir);
      const logFiles = files.filter(f => f.endsWith('.log') || f.endsWith('.jsonl'));

      let totalInput = 0;
      let totalOutput = 0;

      // Parse log files for token usage
      for (const file of logFiles.slice(-10)) { // Last 10 log files
        const filePath = path.join(logsDir, file);
        try {
          const content = await fs.readFile(filePath, 'utf-8');
          const lines = content.split('\n').filter(l => l.trim());

          for (const line of lines) {
            try {
              const log = JSON.parse(line);
              if (log.usage || log.token_usage) {
                const usage = log.usage || log.token_usage;
                totalInput += usage.input_tokens || 0;
                totalOutput += usage.output_tokens || 0;
              }
            } catch {
              // Not JSON or doesn't have token info
            }
          }
        } catch {
          // File read error
        }
      }

      const today = this.createTokenUsage(agent, totalInput, totalOutput, 'daily');
      const thisWeek = this.createTokenUsage(agent, totalInput, totalOutput, 'weekly');
      const thisMonth = this.createTokenUsage(agent, totalInput, totalOutput, 'monthly');

      return { today, thisWeek, thisMonth };
    } catch (error) {
      // Logs directory doesn't exist or can't be read
      return this.getEmptyTokenStats(agent);
    }
  }

  /**
   * Get Cursor token statistics
   */
  private async getCursorTokenStats(agent: Agent): Promise<{
    today: TokenUsage;
    thisWeek: TokenUsage;
    thisMonth: TokenUsage;
  }> {
    // Cursor doesn't publicly expose token usage logs
    // Return estimated based on activity if possible
    return this.getEmptyTokenStats(agent);
  }

  /**
   * Get OpenClaw token statistics
   */
  private async getOpenClawTokenStats(agent: Agent): Promise<{
    today: TokenUsage;
    thisWeek: TokenUsage;
    thisMonth: TokenUsage;
  }> {
    // OpenClaw logs might be in ~/.openclaw/logs/
    const logsDir = expandHome('~/.openclaw/logs');

    try {
      const files = await fs.readdir(logsDir);
      const logFiles = files.filter(f => f.includes('usage') || f.includes('token'));

      let totalInput = 0;
      let totalOutput = 0;

      for (const file of logFiles) {
        const filePath = path.join(logsDir, file);
        try {
          const content = await fs.readFile(filePath, 'utf-8');
          // Parse OpenClaw log format (implementation depends on actual format)
          const lines = content.split('\n');
          for (const line of lines) {
            const match = line.match(/tokens?[:\s]+(\d+)/i);
            if (match) {
              totalInput += parseInt(match[1], 10);
            }
          }
        } catch {
          // File read error
        }
      }

      const today = this.createTokenUsage(agent, totalInput, totalOutput, 'daily');
      const thisWeek = this.createTokenUsage(agent, totalInput, totalOutput, 'weekly');
      const thisMonth = this.createTokenUsage(agent, totalInput, totalOutput, 'monthly');

      return { today, thisWeek, thisMonth };
    } catch (error) {
      return this.getEmptyTokenStats(agent);
    }
  }

  /**
   * Create a TokenUsage object
   */
  private createTokenUsage(
    agent: Agent,
    inputTokens: number,
    outputTokens: number,
    period: 'daily' | 'weekly' | 'monthly'
  ): TokenUsage {
    const totalTokens = inputTokens + outputTokens;
    const estimatedCost = this.calculateCost(agent.id, inputTokens, outputTokens);

    return {
      agentId: agent.id,
      agentName: agent.name,
      inputTokens,
      outputTokens,
      totalTokens,
      estimatedCost,
      period,
      timestamp: new Date()
    };
  }

  /**
   * Get empty token stats (when no data available)
   */
  private getEmptyTokenStats(agent: Agent) {
    const empty = this.createTokenUsage(agent, 0, 0, 'daily');
    return {
      today: { ...empty, period: 'daily' as const },
      thisWeek: { ...empty, period: 'weekly' as const },
      thisMonth: { ...empty, period: 'monthly' as const }
    };
  }

  /**
   * Calculate cost based on agent and tokens
   */
  private calculateCost(agentId: string, inputTokens: number, outputTokens: number): number {
    // Pricing per 1M tokens (approximate, as of 2026)
    const pricing: Record<string, { input: number; output: number }> = {
      claude: {
        input: 15,    // $15 per 1M input tokens
        output: 75    // $75 per 1M output tokens
      },
      cursor: {
        input: 10,    // Estimated
        output: 30    // Estimated
      },
      openclaw: {
        input: 0.50,  // Uses various models
        output: 1.50
      }
    };

    const prices = pricing[agentId] || { input: 0, output: 0 };

    const inputCost = (inputTokens / 1_000_000) * prices.input;
    const outputCost = (outputTokens / 1_000_000) * prices.output;

    return inputCost + outputCost;
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
      alerts.push(`Daily budget exceeded by $${excess.toFixed(2)} ($${totalCost.today.toFixed(2)} / $${this.budget.daily.toFixed(2)})`);
    }

    if (this.budget.weekly && totalCost.thisWeek > this.budget.weekly) {
      const excess = totalCost.thisWeek - this.budget.weekly;
      alerts.push(`Weekly budget exceeded by $${excess.toFixed(2)} ($${totalCost.thisWeek.toFixed(2)} / $${this.budget.weekly.toFixed(2)})`);
    }

    if (this.budget.monthly && totalCost.thisMonth > this.budget.monthly) {
      const excess = totalCost.thisMonth - this.budget.monthly;
      alerts.push(`Monthly budget exceeded by $${excess.toFixed(2)} ($${totalCost.thisMonth.toFixed(2)} / $${this.budget.monthly.toFixed(2)})`);
    }

    // Warning alerts (80% of budget)
    if (this.budget.monthly && totalCost.thisMonth > this.budget.monthly * 0.8 && totalCost.thisMonth <= this.budget.monthly) {
      const remaining = this.budget.monthly - totalCost.thisMonth;
      alerts.push(`Monthly budget warning: $${remaining.toFixed(2)} remaining (${((totalCost.thisMonth / this.budget.monthly) * 100).toFixed(0)}% used)`);
    }

    return alerts;
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
