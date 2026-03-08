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
     * Get Claude Code token statistics
     */
    async getClaudeTokenStats(agent) {
        // Claude Code logs are typically in ~/.claude/logs/
        const logsDir = (0, config_1.expandHome)('~/.claude/logs');
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
                        }
                        catch {
                            // Not JSON or doesn't have token info
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
            // Logs directory doesn't exist or can't be read
            return this.getEmptyTokenStats(agent);
        }
    }
    /**
     * Get Cursor token statistics
     */
    async getCursorTokenStats(agent) {
        // Cursor doesn't publicly expose token usage logs
        // Return estimated based on activity if possible
        return this.getEmptyTokenStats(agent);
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
