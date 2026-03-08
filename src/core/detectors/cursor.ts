/**
 * Cursor IDE Detector
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

export class CursorDetector implements AgentDetector {
  id = 'cursor';
  name = 'Cursor IDE';
  version = '1.0.0';
  defaultConfigPath = '~/.cursor/mcp.json';
  private detectedAgent: Agent | null = null;

  async detect(): Promise<Agent | null> {
    // 检测 Cursor 进程
    const processes = await findProcessesByName(/Cursor Helper|cursor/i);

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

    // TODO: 实现 Cursor 的安全检查
    // 1. 端口绑定检查
    // 2. Workspace Trust 检查
    // 3. 扩展签名验证
    // 4. 索引目录范围检查

    return issues;
  }

  async stop(): Promise<void> {
    // Cursor 是桌面应用，不建议通过 CLI 停止
    throw new Error('Cursor IDE should be stopped through the application itself');
  }

  async restart(): Promise<void> {
    // Cursor 是桌面应用，不建议通过 CLI 重启
    throw new Error('Cursor IDE should be restarted through the application itself');
  }

  getConfigPath(): string {
    return this.defaultConfigPath;
  }
}
