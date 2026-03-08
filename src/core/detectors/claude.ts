/**
 * Claude Desktop / Claude Code Detector
 */
import * as path from 'path';
import * as fs from 'fs/promises';
import type {
  Agent,
  AgentDetector,
  SecurityIssue,
  ProcessInfo,
  PermissionRisk,
  NetworkConnection
} from '../../types';
import {
  findProcessesByName
} from '../../utils/process';
import {
  expandHome,
  fileExists
} from '../../utils/config';

export class ClaudeDetector implements AgentDetector {
  id = 'claude';
  name = 'Claude Code';
  version = '1.0.0';
  defaultConfigPath = '~/.claude/settings.json';
  private detectedAgent: Agent | null = null;

  async detect(): Promise<Agent | null> {
    // 检测 Claude Code (VSCode 扩展)
    const processes = await findProcessesByName(/claude.*stream-json|anthropic\.claude-code/i);

    if (processes.length === 0) {
      // 检查配置文件是否存在
      const configPath = expandHome(this.defaultConfigPath);
      const exists = await fileExists(configPath);

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
    const configPath = expandHome(this.defaultConfigPath);

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

  async getProcessInfo(): Promise<ProcessInfo[]> {
    return await findProcessesByName(/claude.*stream-json|anthropic\.claude-code/i);
  }

  async auditConfig(): Promise<SecurityIssue[]> {
    const issues: SecurityIssue[] = [];

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

  private async checkMCPServers(issues: SecurityIssue[]): Promise<void> {
    try {
      const configPath = expandHome(this.defaultConfigPath);
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
            const detectedRisks: string[] = [];

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
    } catch (error: any) {
      // Config file not found or invalid - not an issue
      if (error.code !== 'ENOENT') {
        console.error('Failed to check MCP servers:', error);
      }
    }
  }

  private async checkConfigPermissions(issues: SecurityIssue[]): Promise<void> {
    try {
      const configPath = expandHome(this.defaultConfigPath);
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
    } catch (error: any) {
      if (error.code !== 'ENOENT') {
        console.error('Failed to check config permissions:', error);
      }
    }
  }

  private async checkAPIKeySecurity(issues: SecurityIssue[]): Promise<void> {
    try {
      const configPath = expandHome(this.defaultConfigPath);
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
    } catch (error: any) {
      if (error.code !== 'ENOENT') {
        console.error('Failed to check API key security:', error);
      }
    }
  }

  private async checkComputerUseMode(issues: SecurityIssue[]): Promise<void> {
    try {
      const configPath = expandHome(this.defaultConfigPath);
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
    } catch (error: any) {
      if (error.code !== 'ENOENT') {
        console.error('Failed to check Computer Use mode:', error);
      }
    }
  }

  async auditPermissions(): Promise<PermissionRisk[]> {
    const risks: PermissionRisk[] = [];

    // Claude Code runs as VSCode extension - has full VSCode permissions
    risks.push({
      permission: 'vscode.full',
      granted: true,
      severity: 'medium',
      reason: 'Claude Code runs as a VSCode extension with full IDE access'
    });

    return risks;
  }

  async auditNetwork(): Promise<NetworkConnection[]> {
    // Claude Code makes HTTPS requests to Anthropic API
    // We can't easily detect these connections as they're HTTPS
    return [];
  }

  canControl(): boolean {
    // Cannot directly control Claude Code as it's a VSCode extension
    return false;
  }

  async stop(): Promise<void> {
    // Claude Code 作为 VSCode 扩展，不建议直接停止
    throw new Error('Claude Code runs as VSCode extension and cannot be stopped independently');
  }

  async restart(): Promise<void> {
    // Claude Code 作为 VSCode 扩展，不建议直接重启
    throw new Error('Claude Code runs as VSCode extension and cannot be restarted independently');
  }

  getConfigPath(): string {
    return this.defaultConfigPath;
  }
}
