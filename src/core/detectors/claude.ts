/**
 * Claude Desktop / Claude Code Detector
 */
import * as path from 'path';
import type {
  Agent,
  AgentDetector,
  SecurityIssue
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

  async auditConfig(): Promise<SecurityIssue[]> {
    const issues: SecurityIssue[] = [];

    if (!this.detectedAgent) {
      return issues;
    }

    // TODO: 实现 Claude Code 的安全检查
    // 1. MCP servers 权限检查
    // 2. Computer Use 模式检查
    // 3. 配置文件权限检查
    // 4. 插件安全检查

    return issues;
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
