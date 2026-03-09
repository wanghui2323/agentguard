/**
 * Claude Code Stats Parser
 * Reads REAL token usage data from ~/.claude/stats-cache.json
 */

import * as fs from 'fs/promises';
import * as os from 'os';
import * as path from 'path';

export interface ClaudeStatsCache {
  version: number;
  lastComputedDate: string;
  dailyModelTokens: Array<{
    date: string;
    tokensByModel: Record<string, number>;
  }>;
  modelUsage: Record<string, {
    inputTokens: number;
    outputTokens: number;
    cacheReadInputTokens: number;
    cacheCreationInputTokens: number;
  }>;
}

/**
 * Parse Claude stats cache
 */
export async function parseClaudeStats(): Promise<ClaudeStatsCache | null> {
  try {
    const statsPath = path.join(os.homedir(), '.claude', 'stats-cache.json');
    const content = await fs.readFile(statsPath, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    return null;
  }
}

/**
 * Get today's token usage from real data
 */
export async function getTodayTokens(): Promise<{
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
}> {
  const stats = await parseClaudeStats();
  if (!stats) {
    return { inputTokens: 0, outputTokens: 0, totalTokens: 0 };
  }

  const today = new Date().toISOString().split('T')[0];

  // Find today's data
  const todayData = stats.dailyModelTokens.find(d => d.date === today);
  if (!todayData) {
    return { inputTokens: 0, outputTokens: 0, totalTokens: 0 };
  }

  // Sum all models for today
  let total = 0;
  for (const tokens of Object.values(todayData.tokensByModel)) {
    total += tokens;
  }

  // Estimate input/output split (typical ratio: ~15% input, ~85% output)
  return {
    inputTokens: Math.round(total * 0.15),
    outputTokens: Math.round(total * 0.85),
    totalTokens: total
  };
}

/**
 * Get this month's token usage from real data
 */
export async function getThisMonthTokens(): Promise<{
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  byModel: Record<string, number>;
}> {
  const stats = await parseClaudeStats();
  if (!stats) {
    return { inputTokens: 0, outputTokens: 0, totalTokens: 0, byModel: {} };
  }

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthStartStr = monthStart.toISOString().split('T')[0];

  let total = 0;
  const byModel: Record<string, number> = {};

  // Sum all days in this month
  for (const dayData of stats.dailyModelTokens) {
    if (dayData.date >= monthStartStr) {
      for (const [model, tokens] of Object.entries(dayData.tokensByModel)) {
        total += tokens;
        byModel[model] = (byModel[model] || 0) + tokens;
      }
    }
  }

  return {
    inputTokens: Math.round(total * 0.15),
    outputTokens: Math.round(total * 0.85),
    totalTokens: total,
    byModel
  };
}

/**
 * Get this week's token usage
 */
export async function getThisWeekTokens(): Promise<{
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
}> {
  const stats = await parseClaudeStats();
  if (!stats) {
    return { inputTokens: 0, outputTokens: 0, totalTokens: 0 };
  }

  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - now.getDay()); // Start of this week (Sunday)
  weekStart.setHours(0, 0, 0, 0);
  const weekStartStr = weekStart.toISOString().split('T')[0];

  let total = 0;

  for (const dayData of stats.dailyModelTokens) {
    if (dayData.date >= weekStartStr) {
      for (const tokens of Object.values(dayData.tokensByModel)) {
        total += tokens;
      }
    }
  }

  return {
    inputTokens: Math.round(total * 0.15),
    outputTokens: Math.round(total * 0.85),
    totalTokens: total
  };
}
