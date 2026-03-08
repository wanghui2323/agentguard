"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OpenClawDetector = void 0;
const process_1 = require("../../utils/process");
const config_1 = require("../../utils/config");
const network_1 = require("../../utils/network");
const child_process_1 = require("child_process");
const util_1 = require("util");
const execAsync = (0, util_1.promisify)(child_process_1.exec);
class OpenClawDetector {
    constructor() {
        this.id = 'openclaw';
        this.name = 'OpenClaw';
        this.version = '1.0.0';
        this.defaultConfigPath = '~/.openclaw/openclaw.json';
        this.detectedAgent = null;
    }
    /**
     * Detect if OpenClaw is installed and running
     */
    async detect() {
        const processes = await (0, process_1.findProcessesByName)(/node.*openclaw|openclaw.*gateway/i);
        if (processes.length === 0) {
            // Check if installed but not running
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
        const config = await (0, config_1.readJsonConfig)(configPath);
        const port = config?.gateway?.port || 18789;
        this.detectedAgent = {
            id: this.id,
            name: this.name,
            status: 'running',
            pid: process.pid,
            configPath,
            port,
            detectedAt: new Date()
        };
        return this.detectedAgent;
    }
    /**
     * Get process information
     */
    async getProcessInfo() {
        return await (0, process_1.findProcessesByName)(/node.*openclaw|openclaw.*gateway/i);
    }
    /**
     * Get config file path
     */
    getConfigPath() {
        return (0, config_1.expandHome)(this.defaultConfigPath);
    }
    /**
     * Audit configuration for security issues
     */
    async auditConfig() {
        const issues = [];
        const configPath = this.getConfigPath();
        if (!await (0, config_1.fileExists)(configPath)) {
            return issues;
        }
        const config = await (0, config_1.readJsonConfig)(configPath);
        if (!config) {
            return issues;
        }
        // Check 1: Port binding
        const bind = config.gateway?.bind;
        if (bind === 'lan' || bind === '0.0.0.0') {
            issues.push({
                id: 'openclaw-port-exposed',
                agentId: this.id,
                severity: 'critical',
                title: '端口暴露到所有网络接口',
                description: `当前配置 bind: "${bind}" 会将 OpenClaw 暴露到局域网甚至公网，任何人都可以尝试连接。`,
                recommendation: '将 bind 改为 "loopback" 以仅允许本机访问，或使用 VPN/SSH 隧道进行远程访问。',
                autoFixable: true,
                requireRestart: true,
                metadata: { currentValue: bind, suggestedValue: 'loopback' }
            });
        }
        // Check 2: Authentication mode
        const authMode = config.gateway?.auth?.mode;
        if (!authMode || authMode === 'none') {
            issues.push({
                id: 'openclaw-no-auth',
                agentId: this.id,
                severity: 'critical',
                title: '未启用身份认证',
                description: 'OpenClaw 未启用任何身份认证，任何人都可以无限制地访问您的 AI 助手。',
                recommendation: '启用 token 或 password 认证模式，并使用强密码。',
                autoFixable: true,
                requireRestart: true,
                metadata: { currentValue: authMode, suggestedValue: 'token' }
            });
        }
        // Check 3: Token strength
        if (authMode === 'token') {
            const token = config.gateway?.auth?.token;
            if (token && token.length < 32) {
                issues.push({
                    id: 'openclaw-weak-token',
                    agentId: this.id,
                    severity: 'medium',
                    title: '认证令牌强度不足',
                    description: `当前令牌长度为 ${token.length} 字符，低于推荐的 32 字符。`,
                    recommendation: '使用至少 32 字符的随机令牌以提高安全性。',
                    autoFixable: true,
                    requireRestart: true,
                    metadata: { currentLength: token.length, suggestedLength: 32 }
                });
            }
        }
        // Check 4: DM policy
        const dmPolicy = config.channels?.whatsapp?.dmPolicy;
        if (dmPolicy === 'open') {
            issues.push({
                id: 'openclaw-dm-policy-open',
                agentId: this.id,
                severity: 'critical',
                title: 'DM 策略过于开放',
                description: 'dmPolicy 设置为 "open" 允许任何人直接与您的 AI 助手对话，可能被滥用。',
                recommendation: '将 dmPolicy 改为 "pairing" 或 "allowlist" 以限制访问。',
                autoFixable: true,
                requireRestart: false,
                metadata: { currentValue: dmPolicy, suggestedValue: 'pairing' }
            });
        }
        // Check 5: Node.js version
        try {
            const { stdout } = await execAsync('node --version');
            const version = stdout.trim().replace('v', '');
            const [major, minor] = version.split('.').map(Number);
            if (major < 22 || (major === 22 && minor < 12)) {
                issues.push({
                    id: 'openclaw-nodejs-version',
                    agentId: this.id,
                    severity: 'high',
                    title: 'Node.js 版本过低',
                    description: `当前 Node.js 版本为 ${version}，低于推荐的 22.12.0，可能存在已知安全漏洞。`,
                    recommendation: '升级 Node.js 到 22.12.0 或更高版本以获取安全补丁。',
                    autoFixable: false,
                    metadata: { currentVersion: version, suggestedVersion: '22.12.0' }
                });
            }
        }
        catch {
            // Ignore if node version check fails
        }
        // Check 6: Sandbox status
        const sandbox = config.agents?.sandbox;
        if (sandbox === false) {
            issues.push({
                id: 'openclaw-no-sandbox',
                agentId: this.id,
                severity: 'medium',
                title: '未启用沙箱隔离',
                description: '沙箱功能未启用，代码执行可能直接访问系统资源，存在安全风险。',
                recommendation: '启用 Docker 沙箱以隔离代码执行环境。',
                autoFixable: true,
                requireRestart: true,
                metadata: { currentValue: sandbox, suggestedValue: true }
            });
        }
        // Check 7: Workspace permissions
        const workspace = config.agents?.workspace;
        if (workspace === 'rw') {
            issues.push({
                id: 'openclaw-workspace-rw',
                agentId: this.id,
                severity: 'low',
                title: '工作空间权限为读写',
                description: 'AI 代理拥有工作空间的读写权限，可能意外修改或删除文件。',
                recommendation: '如非必要，将 workspace 改为 "ro"（只读）以降低风险。',
                autoFixable: true,
                requireRestart: true,
                metadata: { currentValue: workspace, suggestedValue: 'ro' }
            });
        }
        // Check 8: Config file permissions
        const permissions = await (0, config_1.getFilePermissions)(configPath);
        if (permissions && permissions !== '600') {
            issues.push({
                id: 'openclaw-config-permissions',
                agentId: this.id,
                severity: 'medium',
                title: '配置文件权限过于宽松',
                description: `配置文件权限为 ${permissions}，可能被其他用户读取，导致令牌泄露。`,
                recommendation: '将配置文件权限改为 600（仅所有者可读写）。',
                autoFixable: true,
                requireRestart: false,
                metadata: { currentPermissions: permissions, suggestedPermissions: '600' }
            });
        }
        return issues;
    }
    /**
     * Audit permissions
     */
    async auditPermissions() {
        const risks = [];
        // OpenClaw can execute system commands
        risks.push({
            permission: 'system.run',
            granted: true,
            severity: 'high',
            reason: 'OpenClaw 可以执行系统命令，具有较高权限'
        });
        // File system access
        risks.push({
            permission: 'filesystem',
            granted: true,
            severity: 'medium',
            reason: 'OpenClaw 可以读写文件系统'
        });
        return risks;
    }
    /**
     * Audit network connections
     */
    async auditNetwork() {
        const listening = await (0, network_1.getListeningPorts)();
        const agent = await this.detect();
        if (!agent?.port) {
            return [];
        }
        return listening.filter(conn => conn.localPort === agent.port);
    }
    /**
     * Check if can control the agent
     */
    canControl() {
        return true;
    }
    /**
     * Stop OpenClaw
     */
    async stop() {
        const processes = await this.getProcessInfo();
        if (processes.length === 0) {
            throw new Error('OpenClaw is not running');
        }
        for (const process of processes) {
            await (0, process_1.stopProcess)(process.pid);
        }
    }
    /**
     * Restart OpenClaw
     */
    async restart() {
        await this.stop();
        // Wait a bit before restarting
        await new Promise(resolve => setTimeout(resolve, 1000));
        // Start OpenClaw
        try {
            // Use spawn instead of exec for background process
            const { spawn } = require('child_process');
            spawn('openclaw', ['gateway'], {
                detached: true,
                stdio: 'ignore'
            }).unref();
        }
        catch (error) {
            throw new Error(`Failed to restart OpenClaw: ${error}`);
        }
    }
    /**
     * Update configuration
     */
    async updateConfig(patch) {
        const configPath = this.getConfigPath();
        const config = await (0, config_1.readJsonConfig)(configPath) || {};
        // Deep merge the patch
        const updated = this.deepMerge(config, patch);
        await (0, config_1.writeJsonConfig)(configPath, updated);
    }
    /**
     * Helper: Deep merge objects
     */
    deepMerge(target, source) {
        const result = { ...target };
        for (const key in source) {
            const sourceValue = source[key];
            const targetValue = result[key];
            if (sourceValue &&
                typeof sourceValue === 'object' &&
                !Array.isArray(sourceValue) &&
                targetValue &&
                typeof targetValue === 'object' &&
                !Array.isArray(targetValue)) {
                result[key] = this.deepMerge(targetValue, sourceValue);
            }
            else {
                result[key] = sourceValue;
            }
        }
        return result;
    }
}
exports.OpenClawDetector = OpenClawDetector;
