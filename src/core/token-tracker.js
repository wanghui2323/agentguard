"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.TokenTracker = void 0;
/**
 * Token Usage Tracker
 */
const fs = __importStar(require("fs/promises"));
const path = __importStar(require("path"));
const config_1 = require("../utils/config");
class TokenTracker {
    constructor() {
        this.budget = {};
    }
    /**
     * Get token statistics for all agents
     */
    async getTokenReport(agents) {
        const agentStats = [];
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
    async getAgentTokenStats(agent) {
        try {
            let today;
            let thisWeek;
            let thisMonth;
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
        }
        catch (error) {
            console.error(`Failed to get token stats for ${agent.name}:`, error);
            return null;
        }
    }
    /**
     * Get Claude Code token statistics (from tasks and projects)
     */
    async getClaudeTokenStats(agent) {
        try {
            // Claude Code stores task data in ~/.claude/tasks/ and project transcripts
            const tasksDir = (0, config_1.expandHome)('~/.claude/tasks');
            const projectsDir = (0, config_1.expandHome)('~/.claude/projects');
            const now = Date.now();
            const oneDayAgo = now - 24 * 60 * 60 * 1000;
            const oneWeekAgo = now - 7 * 24 * 60 * 60 * 1000;
            const oneMonthAgo = now - 30 * 24 * 60 * 60 * 1000;
            let dailyInput = 0;
            let dailyOutput = 0;
            let weeklyInput = 0;
            let weeklyOutput = 0;
            let monthlyInput = 0;
            let monthlyOutput = 0;
            // Count conversation transcripts in projects
            try {
                const projectDirs = await fs.readdir(projectsDir);
                for (const projectDir of projectDirs) {
                    const transcriptPath = path.join(projectsDir, projectDir);
                    const transcriptFiles = await fs.readdir(transcriptPath).catch(() => []);
                    for (const file of transcriptFiles) {
                        if (file.endsWith('.jsonl')) {
                            const filePath = path.join(transcriptPath, file);
                            const stats = await fs.stat(filePath);
                            const fileTime = stats.mtimeMs;
                            // Read and count messages
                            try {
                                const content = await fs.readFile(filePath, 'utf-8');
                                const lines = content.split('\n').filter(l => l.trim());
                                // Estimate: each message exchange ~1000 tokens (500 in, 500 out)
                                const messageCount = lines.length;
                                const estimatedInput = messageCount * 500;
                                const estimatedOutput = messageCount * 500;
                                if (fileTime > oneDayAgo) {
                                    dailyInput += estimatedInput;
                                    dailyOutput += estimatedOutput;
                                }
                                if (fileTime > oneWeekAgo) {
                                    weeklyInput += estimatedInput;
                                    weeklyOutput += estimatedOutput;
                                }
                                if (fileTime > oneMonthAgo) {
                                    monthlyInput += estimatedInput;
                                    monthlyOutput += estimatedOutput;
                                }
                            }
                            catch {
                                // Skip file on error
                            }
                        }
                    }
                }
            }
            catch (error) {
                // Projects directory doesn't exist or can't be read
            }
            // Also check tasks directory for task-based token usage
            try {
                const taskDirs = await fs.readdir(tasksDir);
                for (const taskDir of taskDirs) {
                    const taskPath = path.join(tasksDir, taskDir);
                    const taskStat = await fs.stat(taskPath);
                    if (taskStat.isDirectory()) {
                        const taskTime = taskStat.mtimeMs;
                        // Each task represents ~2000-5000 tokens of conversation
                        const avgTaskTokens = 3000;
                        const taskInput = avgTaskTokens * 0.4; // 40% input
                        const taskOutput = avgTaskTokens * 0.6; // 60% output
                        if (taskTime > oneDayAgo) {
                            dailyInput += taskInput;
                            dailyOutput += taskOutput;
                        }
                        if (taskTime > oneWeekAgo) {
                            weeklyInput += taskInput;
                            weeklyOutput += taskOutput;
                        }
                        if (taskTime > oneMonthAgo) {
                            monthlyInput += taskInput;
                            monthlyOutput += taskOutput;
                        }
                    }
                }
            }
            catch {
                // Tasks directory doesn't exist or can't be read
            }
            const today = this.createTokenUsage(agent, Math.round(dailyInput), Math.round(dailyOutput), 'daily');
            const thisWeek = this.createTokenUsage(agent, Math.round(weeklyInput), Math.round(weeklyOutput), 'weekly');
            const thisMonth = this.createTokenUsage(agent, Math.round(monthlyInput), Math.round(monthlyOutput), 'monthly');
            return { today, thisWeek, thisMonth };
        }
        catch (error) {
            // Error reading Claude directories
            return this.getEmptyTokenStats(agent);
        }
    }
    /**
     * Get Cursor token statistics (from SQLite database)
     */
    async getCursorTokenStats(agent) {
        try {
            const { execSync } = require('child_process');
            const dbPath = (0, config_1.expandHome)('~/.cursor/ai-tracking/ai-code-tracking.db');
            // Check if database exists
            try {
                await fs.access(dbPath);
            }
            catch {
                return this.getEmptyTokenStats(agent);
            }
            const now = Date.now();
            const oneDayAgo = now - 24 * 60 * 60 * 1000;
            const oneWeekAgo = now - 7 * 24 * 60 * 60 * 1000;
            const oneMonthAgo = now - 30 * 24 * 60 * 60 * 1000;
            // Query AI code generation records
            const dailyQuery = `SELECT COUNT(*) as count FROM ai_code_hashes WHERE timestamp > ${oneDayAgo}`;
            const weeklyQuery = `SELECT COUNT(*) as count FROM ai_code_hashes WHERE timestamp > ${oneWeekAgo}`;
            const monthlyQuery = `SELECT COUNT(*) as count FROM ai_code_hashes WHERE timestamp > ${oneMonthAgo}`;
            let dailyCount = 0;
            let weeklyCount = 0;
            let monthlyCount = 0;
            try {
                const dailyResult = execSync(`sqlite3 "${dbPath}" "${dailyQuery}"`, { encoding: 'utf-8' });
                dailyCount = parseInt(dailyResult.trim(), 10) || 0;
                const weeklyResult = execSync(`sqlite3 "${dbPath}" "${weeklyQuery}"`, { encoding: 'utf-8' });
                weeklyCount = parseInt(weeklyResult.trim(), 10) || 0;
                const monthlyResult = execSync(`sqlite3 "${dbPath}" "${monthlyQuery}"`, { encoding: 'utf-8' });
                monthlyCount = parseInt(monthlyResult.trim(), 10) || 0;
            }
            catch (error) {
                // SQLite query failed, return empty stats
                return this.getEmptyTokenStats(agent);
            }
            // Estimate tokens: ~500 tokens per code generation (conservative estimate)
            // Average code generation: 200 input (prompt) + 300 output (code)
            const avgInputPerGen = 200;
            const avgOutputPerGen = 300;
            const dailyInput = dailyCount * avgInputPerGen;
            const dailyOutput = dailyCount * avgOutputPerGen;
            const weeklyInput = weeklyCount * avgInputPerGen;
            const weeklyOutput = weeklyCount * avgOutputPerGen;
            const monthlyInput = monthlyCount * avgInputPerGen;
            const monthlyOutput = monthlyCount * avgOutputPerGen;
            const today = this.createTokenUsage(agent, dailyInput, dailyOutput, 'daily');
            const thisWeek = this.createTokenUsage(agent, weeklyInput, weeklyOutput, 'weekly');
            const thisMonth = this.createTokenUsage(agent, monthlyInput, monthlyOutput, 'monthly');
            return { today, thisWeek, thisMonth };
        }
        catch (error) {
            console.error('Failed to query Cursor database:', error);
            return this.getEmptyTokenStats(agent);
        }
    }
    /**
     * Get OpenClaw token statistics
     */
    async getOpenClawTokenStats(agent) {
        // OpenClaw logs might be in ~/.openclaw/logs/
        const logsDir = (0, config_1.expandHome)('~/.openclaw/logs');
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
                }
                catch {
                    // File read error
                }
            }
            const today = this.createTokenUsage(agent, totalInput, totalOutput, 'daily');
            const thisWeek = this.createTokenUsage(agent, totalInput, totalOutput, 'weekly');
            const thisMonth = this.createTokenUsage(agent, totalInput, totalOutput, 'monthly');
            return { today, thisWeek, thisMonth };
        }
        catch (error) {
            return this.getEmptyTokenStats(agent);
        }
    }
    /**
     * Create a TokenUsage object
     */
    createTokenUsage(agent, inputTokens, outputTokens, period) {
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
    getEmptyTokenStats(agent) {
        const empty = this.createTokenUsage(agent, 0, 0, 'daily');
        return {
            today: { ...empty, period: 'daily' },
            thisWeek: { ...empty, period: 'weekly' },
            thisMonth: { ...empty, period: 'monthly' }
        };
    }
    /**
     * Calculate cost based on agent and tokens
     */
    calculateCost(agentId, inputTokens, outputTokens) {
        // Pricing per 1M tokens (approximate, as of 2026)
        const pricing = {
            claude: {
                input: 15, // $15 per 1M input tokens
                output: 75 // $75 per 1M output tokens
            },
            cursor: {
                input: 10, // Estimated
                output: 30 // Estimated
            },
            openclaw: {
                input: 0.50, // Uses various models
                output: 1.50
            }
        };
        const prices = pricing[agentId] || { input: 0, output: 0 };
        const inputCost = (inputTokens / 1000000) * prices.input;
        const outputCost = (outputTokens / 1000000) * prices.output;
        return inputCost + outputCost;
    }
    /**
     * Calculate total cost across all agents
     */
    calculateTotalCost(stats) {
        return {
            today: stats.reduce((sum, s) => sum + s.today.estimatedCost, 0),
            thisWeek: stats.reduce((sum, s) => sum + s.thisWeek.estimatedCost, 0),
            thisMonth: stats.reduce((sum, s) => sum + s.thisMonth.estimatedCost, 0)
        };
    }
    /**
     * Check budget and generate alerts
     */
    checkBudgetAlerts(totalCost) {
        const alerts = [];
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
    setBudget(budget) {
        this.budget = budget;
    }
    /**
     * Get current budget
     */
    getBudget() {
        return this.budget;
    }
}
exports.TokenTracker = TokenTracker;
