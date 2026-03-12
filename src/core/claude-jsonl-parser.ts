/**
 * Claude JSONL Log Parser
 * Parses JSONL session logs for ACCURATE token usage data
 * Location: ~/.claude/projects/<project>/<session>.jsonl
 */

import * as fs from 'fs';
import * as fsp from 'fs/promises';
import * as path from 'path';
import * as os from 'os';
import * as readline from 'readline';

export interface ClaudeUsageData {
  input_tokens: number;
  cache_creation_input_tokens: number;
  cache_read_input_tokens: number;
  output_tokens: number;
}

export interface ClaudeMessageEvent {
  type: 'assistant' | 'user';
  timestamp: string;
  message?: {
    model?: string;
    usage?: ClaudeUsageData;
  };
}

export interface TokenBreakdown {
  inputTokens: number;
  outputTokens: number;
  cacheReadTokens: number;
  cacheCreationTokens: number;
  totalTokens: number;
  estimatedCost: number;
  messageCount: number;
  modelBreakdown: Record<string, {
    inputTokens: number;
    outputTokens: number;
    cacheReadTokens: number;
    cacheCreationTokens: number;
    cost: number;
  }>;
}

/**
 * Parse a single JSONL file and extract token usage
 */
async function parseJSONLFile(filePath: string): Promise<TokenBreakdown> {
  const fileStream = fs.createReadStream(filePath);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  const breakdown: TokenBreakdown = {
    inputTokens: 0,
    outputTokens: 0,
    cacheReadTokens: 0,
    cacheCreationTokens: 0,
    totalTokens: 0,
    estimatedCost: 0,
    messageCount: 0,
    modelBreakdown: {}
  };

  for await (const line of rl) {
    try {
      const event: ClaudeMessageEvent = JSON.parse(line);

      // Only process assistant messages with usage data
      if (event.type === 'assistant' && event.message?.usage) {
        const usage = event.message.usage;
        const model = event.message.model || 'unknown';

        // Aggregate totals
        breakdown.inputTokens += usage.input_tokens || 0;
        breakdown.outputTokens += usage.output_tokens || 0;
        breakdown.cacheReadTokens += usage.cache_read_input_tokens || 0;
        breakdown.cacheCreationTokens += usage.cache_creation_input_tokens || 0;
        breakdown.messageCount++;

        // Track by model
        if (!breakdown.modelBreakdown[model]) {
          breakdown.modelBreakdown[model] = {
            inputTokens: 0,
            outputTokens: 0,
            cacheReadTokens: 0,
            cacheCreationTokens: 0,
            cost: 0
          };
        }

        const modelStats = breakdown.modelBreakdown[model];
        modelStats.inputTokens += usage.input_tokens || 0;
        modelStats.outputTokens += usage.output_tokens || 0;
        modelStats.cacheReadTokens += usage.cache_read_input_tokens || 0;
        modelStats.cacheCreationTokens += usage.cache_creation_input_tokens || 0;
      }
    } catch (error) {
      // Skip invalid JSON lines
      continue;
    }
  }

  // Calculate total tokens
  breakdown.totalTokens =
    breakdown.inputTokens +
    breakdown.outputTokens +
    breakdown.cacheReadTokens +
    breakdown.cacheCreationTokens;

  // Calculate costs per model
  for (const [model, stats] of Object.entries(breakdown.modelBreakdown)) {
    stats.cost = calculateModelCost(model, stats);
  }

  // Calculate total cost
  breakdown.estimatedCost = Object.values(breakdown.modelBreakdown)
    .reduce((sum, stats) => sum + stats.cost, 0);

  return breakdown;
}

/**
 * Calculate cost for a specific model and usage
 */
function calculateModelCost(
  model: string,
  usage: {
    inputTokens: number;
    outputTokens: number;
    cacheReadTokens: number;
    cacheCreationTokens: number;
  }
): number {
  // Pricing per 1M tokens (as of 2026-03)
  let inputPrice = 3;
  let outputPrice = 15;
  let cacheReadPrice = 0.30;
  let cacheCreationPrice = 3.75;

  if (model.includes('opus') || model.includes('4-6')) {
    // Opus 4.6
    inputPrice = 15;
    outputPrice = 75;
    cacheReadPrice = 1.50;
    cacheCreationPrice = 18.75;
  } else if (model.includes('sonnet')) {
    // Sonnet 4.6/4.5 (default)
    inputPrice = 3;
    outputPrice = 15;
    cacheReadPrice = 0.30;
    cacheCreationPrice = 3.75;
  } else if (model.includes('haiku')) {
    // Haiku 4.5
    inputPrice = 0.25;
    outputPrice = 1.25;
    cacheReadPrice = 0.03;
    cacheCreationPrice = 0.30;
  }

  const cost = (
    usage.inputTokens * inputPrice +
    usage.outputTokens * outputPrice +
    usage.cacheReadTokens * cacheReadPrice +
    usage.cacheCreationTokens * cacheCreationPrice
  ) / 1_000_000;

  return cost;
}

/**
 * Get all JSONL files from Claude projects directory
 */
function getClaudeJSONLFiles(): string[] {
  const projectsDir = path.join(os.homedir(), '.claude', 'projects');

  if (!fs.existsSync(projectsDir)) {
    return [];
  }

  const allFiles: string[] = [];
  const projectDirs = fs.readdirSync(projectsDir);

  for (const projectDir of projectDirs) {
    const projectPath = path.join(projectsDir, projectDir);
    if (!fs.statSync(projectPath).isDirectory()) continue;

    const files = fs.readdirSync(projectPath)
      .filter(f => f.endsWith('.jsonl'))
      .map(f => path.join(projectPath, f));

    allFiles.push(...files);
  }

  return allFiles;
}

/**
 * Filter files by date range
 */
function filterFilesByDate(files: string[], startDate: Date, endDate: Date): string[] {
  return files.filter(filePath => {
    const stat = fs.statSync(filePath);
    const mtime = stat.mtime;
    return mtime >= startDate && mtime <= endDate;
  });
}

/**
 * Get token usage for today
 */
export async function getTodayTokensFromJSONL(): Promise<TokenBreakdown> {
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);

  const allFiles = getClaudeJSONLFiles();
  const todayFiles = filterFilesByDate(allFiles, startOfDay, endOfDay);

  const aggregated: TokenBreakdown = {
    inputTokens: 0,
    outputTokens: 0,
    cacheReadTokens: 0,
    cacheCreationTokens: 0,
    totalTokens: 0,
    estimatedCost: 0,
    messageCount: 0,
    modelBreakdown: {}
  };

  for (const file of todayFiles) {
    const breakdown = await parseJSONLFile(file);

    aggregated.inputTokens += breakdown.inputTokens;
    aggregated.outputTokens += breakdown.outputTokens;
    aggregated.cacheReadTokens += breakdown.cacheReadTokens;
    aggregated.cacheCreationTokens += breakdown.cacheCreationTokens;
    aggregated.totalTokens += breakdown.totalTokens;
    aggregated.estimatedCost += breakdown.estimatedCost;
    aggregated.messageCount += breakdown.messageCount;

    // Merge model breakdowns
    for (const [model, stats] of Object.entries(breakdown.modelBreakdown)) {
      if (!aggregated.modelBreakdown[model]) {
        aggregated.modelBreakdown[model] = {
          inputTokens: 0,
          outputTokens: 0,
          cacheReadTokens: 0,
          cacheCreationTokens: 0,
          cost: 0
        };
      }

      const aggStats = aggregated.modelBreakdown[model];
      aggStats.inputTokens += stats.inputTokens;
      aggStats.outputTokens += stats.outputTokens;
      aggStats.cacheReadTokens += stats.cacheReadTokens;
      aggStats.cacheCreationTokens += stats.cacheCreationTokens;
      aggStats.cost += stats.cost;
    }
  }

  return aggregated;
}

/**
 * Get token usage for this week
 */
export async function getThisWeekTokensFromJSONL(): Promise<TokenBreakdown> {
  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);

  const allFiles = getClaudeJSONLFiles();
  const weekFiles = filterFilesByDate(allFiles, startOfWeek, now);

  const aggregated: TokenBreakdown = {
    inputTokens: 0,
    outputTokens: 0,
    cacheReadTokens: 0,
    cacheCreationTokens: 0,
    totalTokens: 0,
    estimatedCost: 0,
    messageCount: 0,
    modelBreakdown: {}
  };

  for (const file of weekFiles) {
    const breakdown = await parseJSONLFile(file);

    aggregated.inputTokens += breakdown.inputTokens;
    aggregated.outputTokens += breakdown.outputTokens;
    aggregated.cacheReadTokens += breakdown.cacheReadTokens;
    aggregated.cacheCreationTokens += breakdown.cacheCreationTokens;
    aggregated.totalTokens += breakdown.totalTokens;
    aggregated.estimatedCost += breakdown.estimatedCost;
    aggregated.messageCount += breakdown.messageCount;

    for (const [model, stats] of Object.entries(breakdown.modelBreakdown)) {
      if (!aggregated.modelBreakdown[model]) {
        aggregated.modelBreakdown[model] = {
          inputTokens: 0,
          outputTokens: 0,
          cacheReadTokens: 0,
          cacheCreationTokens: 0,
          cost: 0
        };
      }

      const aggStats = aggregated.modelBreakdown[model];
      aggStats.inputTokens += stats.inputTokens;
      aggStats.outputTokens += stats.outputTokens;
      aggStats.cacheReadTokens += stats.cacheReadTokens;
      aggStats.cacheCreationTokens += stats.cacheCreationTokens;
      aggStats.cost += stats.cost;
    }
  }

  return aggregated;
}

/**
 * Get token usage for this month
 */
export async function getThisMonthTokensFromJSONL(): Promise<TokenBreakdown> {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const allFiles = getClaudeJSONLFiles();
  const monthFiles = filterFilesByDate(allFiles, startOfMonth, now);

  const aggregated: TokenBreakdown = {
    inputTokens: 0,
    outputTokens: 0,
    cacheReadTokens: 0,
    cacheCreationTokens: 0,
    totalTokens: 0,
    estimatedCost: 0,
    messageCount: 0,
    modelBreakdown: {}
  };

  for (const file of monthFiles) {
    const breakdown = await parseJSONLFile(file);

    aggregated.inputTokens += breakdown.inputTokens;
    aggregated.outputTokens += breakdown.outputTokens;
    aggregated.cacheReadTokens += breakdown.cacheReadTokens;
    aggregated.cacheCreationTokens += breakdown.cacheCreationTokens;
    aggregated.totalTokens += breakdown.totalTokens;
    aggregated.estimatedCost += breakdown.estimatedCost;
    aggregated.messageCount += breakdown.messageCount;

    for (const [model, stats] of Object.entries(breakdown.modelBreakdown)) {
      if (!aggregated.modelBreakdown[model]) {
        aggregated.modelBreakdown[model] = {
          inputTokens: 0,
          outputTokens: 0,
          cacheReadTokens: 0,
          cacheCreationTokens: 0,
          cost: 0
        };
      }

      const aggStats = aggregated.modelBreakdown[model];
      aggStats.inputTokens += stats.inputTokens;
      aggStats.outputTokens += stats.outputTokens;
      aggStats.cacheReadTokens += stats.cacheReadTokens;
      aggStats.cacheCreationTokens += stats.cacheCreationTokens;
      aggStats.cost += stats.cost;
    }
  }

  return aggregated;
}
