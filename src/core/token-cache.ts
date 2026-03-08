/**
 * Token Usage Cache using SQLite
 *
 * Inspired by Toktrack's approach to cache token usage data
 * Solves the problem of Claude Code deleting data after 30 days
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { expandHome } from '../utils/config';
import type { Agent, TokenUsage } from '../types';

export class TokenCache {
  private dbPath: string;
  private initialized = false;

  constructor(cacheDir?: string) {
    const dir = cacheDir || expandHome('~/.agentguard/cache');
    this.dbPath = path.join(dir, 'token-usage.db');
  }

  /**
   * Initialize SQLite database
   */
  async init(): Promise<void> {
    if (this.initialized) return;

    // Ensure cache directory exists
    const dir = path.dirname(this.dbPath);
    await fs.mkdir(dir, { recursive: true });

    // Check if database exists
    try {
      await fs.access(this.dbPath);
    } catch {
      // Database doesn't exist, we'll create it on first write
    }

    this.initialized = true;
  }

  /**
   * Cache token usage data
   */
  async cacheUsage(agentId: string, date: Date, usage: TokenUsage): Promise<void> {
    await this.init();

    try {
      const { execSync } = require('child_process');
      const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD

      // Create table if not exists
      const createTableSQL = `
        CREATE TABLE IF NOT EXISTS token_usage (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          agent_id TEXT NOT NULL,
          date TEXT NOT NULL,
          input_tokens INTEGER NOT NULL,
          output_tokens INTEGER NOT NULL,
          total_tokens INTEGER NOT NULL,
          estimated_cost REAL NOT NULL,
          cached_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(agent_id, date)
        );
        CREATE INDEX IF NOT EXISTS idx_agent_date ON token_usage(agent_id, date);
      `;

      execSync(`sqlite3 "${this.dbPath}" "${createTableSQL}"`, { encoding: 'utf-8' });

      // Insert or replace usage data
      const insertSQL = `
        INSERT OR REPLACE INTO token_usage
        (agent_id, date, input_tokens, output_tokens, total_tokens, estimated_cost)
        VALUES ('${agentId}', '${dateStr}', ${usage.inputTokens}, ${usage.outputTokens}, ${usage.totalTokens}, ${usage.estimatedCost});
      `;

      execSync(`sqlite3 "${this.dbPath}" "${insertSQL}"`, { encoding: 'utf-8' });
    } catch (error) {
      console.error('Failed to cache token usage:', error);
    }
  }

  /**
   * Get cached usage for a date range
   */
  async getCachedUsage(
    agentId: string,
    startDate: Date,
    endDate: Date
  ): Promise<Array<{ date: string; usage: TokenUsage }>> {
    await this.init();

    try {
      const { execSync } = require('child_process');
      const startStr = startDate.toISOString().split('T')[0];
      const endStr = endDate.toISOString().split('T')[0];

      const query = `
        SELECT date, input_tokens, output_tokens, total_tokens, estimated_cost
        FROM token_usage
        WHERE agent_id = '${agentId}' AND date >= '${startStr}' AND date <= '${endStr}'
        ORDER BY date DESC;
      `;

      const result = execSync(`sqlite3 "${this.dbPath}" "${query}"`, { encoding: 'utf-8' });
      const lines = result.trim().split('\n').filter(l => l);

      return lines.map(line => {
        const [date, input, output, total, cost] = line.split('|');
        return {
          date,
          usage: {
            agentId,
            agentName: agentId,
            inputTokens: parseInt(input, 10),
            outputTokens: parseInt(output, 10),
            totalTokens: parseInt(total, 10),
            estimatedCost: parseFloat(cost),
            period: 'daily',
            startDate: new Date(date),
            endDate: new Date(date)
          }
        };
      });
    } catch (error) {
      console.error('Failed to read cached usage:', error);
      return [];
    }
  }

  /**
   * Get total usage for an agent
   */
  async getTotalUsage(agentId: string, days: number = 30): Promise<{
    totalInput: number;
    totalOutput: number;
    totalTokens: number;
    totalCost: number;
  }> {
    await this.init();

    try {
      const { execSync } = require('child_process');
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      const startStr = startDate.toISOString().split('T')[0];

      const query = `
        SELECT
          SUM(input_tokens) as total_input,
          SUM(output_tokens) as total_output,
          SUM(total_tokens) as total_tokens,
          SUM(estimated_cost) as total_cost
        FROM token_usage
        WHERE agent_id = '${agentId}' AND date >= '${startStr}';
      `;

      const result = execSync(`sqlite3 "${this.dbPath}" "${query}"`, { encoding: 'utf-8' });
      const [totalInput, totalOutput, totalTokens, totalCost] = result.trim().split('|');

      return {
        totalInput: parseInt(totalInput, 10) || 0,
        totalOutput: parseInt(totalOutput, 10) || 0,
        totalTokens: parseInt(totalTokens, 10) || 0,
        totalCost: parseFloat(totalCost) || 0
      };
    } catch (error) {
      console.error('Failed to get total usage:', error);
      return {
        totalInput: 0,
        totalOutput: 0,
        totalTokens: 0,
        totalCost: 0
      };
    }
  }

  /**
   * Clear old cache data (keep last N days)
   */
  async clearOldData(keepDays: number = 90): Promise<void> {
    await this.init();

    try {
      const { execSync } = require('child_process');
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - keepDays);
      const cutoffStr = cutoffDate.toISOString().split('T')[0];

      const deleteSQL = `DELETE FROM token_usage WHERE date < '${cutoffStr}';`;
      execSync(`sqlite3 "${this.dbPath}" "${deleteSQL}"`, { encoding: 'utf-8' });
    } catch (error) {
      console.error('Failed to clear old cache data:', error);
    }
  }

  /**
   * Get cache statistics
   */
  async getStats(): Promise<{
    totalRecords: number;
    oldestDate: string;
    newestDate: string;
    agents: string[];
  }> {
    await this.init();

    try {
      const { execSync } = require('child_process');

      const statsQuery = `
        SELECT
          COUNT(*) as count,
          MIN(date) as oldest,
          MAX(date) as newest
        FROM token_usage;
      `;

      const agentsQuery = `SELECT DISTINCT agent_id FROM token_usage;`;

      const statsResult = execSync(`sqlite3 "${this.dbPath}" "${statsQuery}"`, { encoding: 'utf-8' });
      const [count, oldest, newest] = statsResult.trim().split('|');

      const agentsResult = execSync(`sqlite3 "${this.dbPath}" "${agentsQuery}"`, { encoding: 'utf-8' });
      const agents = agentsResult.trim().split('\n').filter(a => a);

      return {
        totalRecords: parseInt(count, 10) || 0,
        oldestDate: oldest || 'N/A',
        newestDate: newest || 'N/A',
        agents
      };
    } catch (error) {
      return {
        totalRecords: 0,
        oldestDate: 'N/A',
        newestDate: 'N/A',
        agents: []
      };
    }
  }
}
