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
exports.ClaudeDetector = void 0;
const fs = __importStar(require("fs/promises"));
const process_1 = require("../../utils/process");
const config_1 = require("../../utils/config");
class ClaudeDetector {
    constructor() {
        this.id = 'claude';
        this.name = 'Claude Code';
        this.version = '1.0.0';
        this.defaultConfigPath = '~/.claude/settings.json';
        this.detectedAgent = null;
    }
    async detect() {
        // 检测 Claude Code (VSCode 扩展)
        const processes = await (0, process_1.findProcessesByName)(/claude.*stream-json|anthropic\.claude-code/i);
        if (processes.length === 0) {
            // 检查配置文件是否存在
            const configPath = (0, config_1.expandHome)(this.defaultConfigPath);
            const exists = await (0, config_1.fileExists)(configPath);
            if (exists) {
                this.detectedAgent = {
                    id: this.id,
                    name: this.name,
                    status: 'stopped',
                    configPath,
                    detectedAt: new Date()
                };
                return this.detectedAgent;
            }
            return null;
        }
        const process = processes[0];
        const configPath = (0, config_1.expandHome)(this.defaultConfigPath);
        this.detectedAgent = {
            id: this.id,
            name: this.name,
            status: 'running',
            pid: process.pid,
            configPath,
            detectedAt: new Date()
        };
        return this.detectedAgent;
    }
    async getProcessInfo() {
        return await (0, process_1.findProcessesByName)(/claude.*stream-json|anthropic\.claude-code/i);
    }
    async auditConfig() {
        const issues = [];
        if (!this.detectedAgent) {
            return issues;
        }
        // 1. MCP servers 权限检查
        await this.checkMCPServers(issues);
        // 2. 配置文件权限检查
        await this.checkConfigPermissions(issues);
        // 3. API Key 泄露检查
        await this.checkAPIKeySecurity(issues);
        // 4. Computer Use 模式检查
        await this.checkComputerUseMode(issues);
        return issues;
    }
    async checkMCPServers(issues) {
        try {
            const configPath = (0, config_1.expandHome)(this.defaultConfigPath);
            const configContent = await fs.readFile(configPath, 'utf-8');
            const config = JSON.parse(configContent);
            if (config.mcpServers && typeof config.mcpServers === 'object') {
                const serverNames = Object.keys(config.mcpServers);
                const highRiskPermissions = ['filesystem', 'network', 'shell', 'exec'];
                for (const serverName of serverNames) {
                    const server = config.mcpServers[serverName];
                    // 检查是否有高风险权限
                    if (server.env || server.args) {
                        const serverStr = JSON.stringify(server).toLowerCase();
                        const detectedRisks = [];
                        for (const risk of highRiskPermissions) {
                            if (serverStr.includes(risk)) {
                                detectedRisks.push(risk);
                            }
                        }
                        if (detectedRisks.length > 0) {
                            issues.push({
                                id: `claude-mcp-${serverName}-permissions`,
                                agentId: this.id,
                                severity: 'high',
                                title: `MCP Server "${serverName}" has high-risk permissions`,
                                description: `The MCP server "${serverName}" has potentially dangerous permissions: ${detectedRisks.join(', ')}`,
                                recommendation: 'Review the MCP server configuration and ensure it only has necessary permissions. Consider using more restrictive settings.',
                                autoFixable: false,
                                metadata: {
                                    serverName,
                                    detectedPermissions: detectedRisks
                                }
                            });
                        }
                    }
                }
            }
        }
        catch (error) {
            // Config file not found or invalid - not an issue
            if (error.code !== 'ENOENT') {
                console.error('Failed to check MCP servers:', error);
            }
        }
    }
    async checkConfigPermissions(issues) {
        try {
            const configPath = (0, config_1.expandHome)(this.defaultConfigPath);
            const stats = await fs.stat(configPath);
            const mode = stats.mode & parseInt('777', 8);
            // Check if file is world-writable (permission 666 or 777)
            if (mode & parseInt('002', 8)) {
                issues.push({
                    id: 'claude-config-permissions',
                    agentId: this.id,
                    severity: 'high',
                    title: 'Config file has insecure permissions',
                    description: `The configuration file ${configPath} is world-writable (mode: ${mode.toString(8)}). This allows any user to modify Claude Code settings.`,
                    recommendation: 'Run: chmod 600 ~/.claude/settings.json',
                    autoFixable: true,
                    metadata: {
                        currentMode: mode.toString(8),
                        recommendedMode: '600'
                    }
                });
            }
        }
        catch (error) {
            if (error.code !== 'ENOENT') {
                console.error('Failed to check config permissions:', error);
            }
        }
    }
    async checkAPIKeySecurity(issues) {
        try {
            const configPath = (0, config_1.expandHome)(this.defaultConfigPath);
            const configContent = await fs.readFile(configPath, 'utf-8');
            const config = JSON.parse(configContent);
            // Check for API keys in config
            const apiKeyPatterns = [
                /anthropic[_-]?api[_-]?key/i,
                /sk-ant-[a-zA-Z0-9-_]+/,
                /api[_-]?key.*:.*["']sk-/i
            ];
            const configStr = JSON.stringify(config);
            for (const pattern of apiKeyPatterns) {
                if (pattern.test(configStr)) {
                    issues.push({
                        id: 'claude-api-key-plaintext',
                        agentId: this.id,
                        severity: 'critical',
                        title: 'API key stored in plaintext',
                        description: 'Claude Code configuration contains API keys in plaintext. This is a severe security risk if the config file is compromised.',
                        recommendation: 'Use environment variables for API keys instead of storing them in config files. Set ANTHROPIC_API_KEY in your shell profile.',
                        autoFixable: false,
                        metadata: {
                            foundPattern: pattern.toString()
                        }
                    });
                    break; // Only report once
                }
            }
        }
        catch (error) {
            if (error.code !== 'ENOENT') {
                console.error('Failed to check API key security:', error);
            }
        }
    }
    async checkComputerUseMode(issues) {
        try {
            const configPath = (0, config_1.expandHome)(this.defaultConfigPath);
            const configContent = await fs.readFile(configPath, 'utf-8');
            const config = JSON.parse(configContent);
            if (config.computerUse === true || config.enableComputerUse === true) {
                issues.push({
                    id: 'claude-computer-use-enabled',
                    agentId: this.id,
                    severity: 'info',
                    title: 'Computer Use mode is enabled',
                    description: 'Claude Code has Computer Use enabled, which allows it to control mouse and keyboard. This is a powerful feature that should be used with caution.',
                    recommendation: 'Ensure you trust the code being executed and monitor Claude\'s actions when Computer Use is active.',
                    autoFixable: false,
                    metadata: {
                        enabled: true
                    }
                });
            }
        }
        catch (error) {
            if (error.code !== 'ENOENT') {
                console.error('Failed to check Computer Use mode:', error);
            }
        }
    }
    async auditPermissions() {
        const risks = [];
        // Claude Code runs as VSCode extension - has full VSCode permissions
        risks.push({
            permission: 'vscode.full',
            granted: true,
            severity: 'medium',
            reason: 'Claude Code runs as a VSCode extension with full IDE access'
        });
        return risks;
    }
    async auditNetwork() {
        // Claude Code makes HTTPS requests to Anthropic API
        // We can't easily detect these connections as they're HTTPS
        return [];
    }
    canControl() {
        // Cannot directly control Claude Code as it's a VSCode extension
        return false;
    }
    async stop() {
        // Claude Code 作为 VSCode 扩展，不建议直接停止
        throw new Error('Claude Code runs as VSCode extension and cannot be stopped independently');
    }
    async restart() {
        // Claude Code 作为 VSCode 扩展，不建议直接重启
        throw new Error('Claude Code runs as VSCode extension and cannot be restarted independently');
    }
    getConfigPath() {
        return this.defaultConfigPath;
    }
}
exports.ClaudeDetector = ClaudeDetector;
