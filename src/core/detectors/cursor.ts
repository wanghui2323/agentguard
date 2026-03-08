/**
 * Cursor IDE Detector
 */
import * as path from 'path';
import * as fs from 'fs/promises';
import * as os from 'os';
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

  async getProcessInfo(): Promise<ProcessInfo[]> {
    return await findProcessesByName(/Cursor Helper|cursor/i);
  }

  async auditConfig(): Promise<SecurityIssue[]> {
    const issues: SecurityIssue[] = [];

    if (!this.detectedAgent) {
      return issues;
    }

    // 1. Workspace Trust 检查
    await this.checkWorkspaceTrust(issues);

    // 2. 扩展安全检查
    await this.checkExtensionSecurity(issues);

    // 3. 索引目录范围检查
    await this.checkIndexedDirectories(issues);

    // 4. 端口绑定检查
    await this.checkPortBindings(issues);

    return issues;
  }

  private async checkWorkspaceTrust(issues: SecurityIssue[]): Promise<void> {
    try {
      const workspaceStoragePath = path.join(os.homedir(), '.cursor', 'User', 'workspaceStorage');

      try {
        await fs.access(workspaceStoragePath);

        // Check for trusted workspaces in potentially unsafe locations
        const unsafeLocations = ['/tmp', '/var/tmp', os.homedir() + '/Downloads'];

        // Read workspace trust settings if available
        const globalStoragePath = path.join(os.homedir(), '.cursor', 'User', 'globalStorage');
        const trustFiles = ['workspaceTrust.json', 'workspace-trust.json'];

        for (const trustFile of trustFiles) {
          const trustPath = path.join(globalStoragePath, trustFile);
          try {
            const trustContent = await fs.readFile(trustPath, 'utf-8');
            const trustData = JSON.parse(trustContent);

            if (trustData.trustedFolders && Array.isArray(trustData.trustedFolders)) {
              const trustedUnsafe = trustData.trustedFolders.filter((folder: string) =>
                unsafeLocations.some(unsafe => folder.startsWith(unsafe))
              );

              if (trustedUnsafe.length > 0) {
                issues.push({
                  id: 'cursor-unsafe-trusted-folders',
                  agentId: this.id,
                  severity: 'medium',
                  title: 'Trusted folders in unsafe locations',
                  description: `Cursor has trusted ${trustedUnsafe.length} workspace(s) in potentially unsafe locations: ${trustedUnsafe.join(', ')}`,
                  recommendation: 'Review trusted folders and remove trust from temporary or download directories.',
                  autoFixable: true,
                  metadata: {
                    unsafeFolders: trustedUnsafe
                  }
                });
              }
            }
          } catch (error) {
            // Trust file doesn't exist or is invalid - continue
          }
        }
      } catch (error) {
        // Workspace storage doesn't exist - not an issue
      }
    } catch (error: any) {
      console.error('Failed to check workspace trust:', error);
    }
  }

  private async checkExtensionSecurity(issues: SecurityIssue[]): Promise<void> {
    try {
      const extensionsPath = path.join(os.homedir(), '.cursor', 'extensions');

      try {
        const extensions = await fs.readdir(extensionsPath);
        const untrustedExtensions: string[] = [];

        // Check for extensions without proper signatures
        for (const ext of extensions) {
          const extPath = path.join(extensionsPath, ext);
          const stat = await fs.stat(extPath);

          if (stat.isDirectory()) {
            // Check for package.json
            const packagePath = path.join(extPath, 'package.json');
            try {
              const packageContent = await fs.readFile(packagePath, 'utf-8');
              const packageData = JSON.parse(packageContent);

              // Check if extension is from official marketplace
              const isOfficial = packageData.publisher &&
                                (packageData.publisher.startsWith('ms-') ||
                                 packageData.publisher === 'microsoft' ||
                                 packageData.__metadata?.publisherDisplayName);

              if (!isOfficial && !packageData.__metadata) {
                untrustedExtensions.push(ext);
              }
            } catch (error) {
              // No package.json - suspicious
              untrustedExtensions.push(ext);
            }
          }
        }

        if (untrustedExtensions.length > 0) {
          issues.push({
            id: 'cursor-untrusted-extensions',
            agentId: this.id,
            severity: 'high',
            title: `Found ${untrustedExtensions.length} untrusted extension(s)`,
            description: `Cursor has extensions without marketplace verification: ${untrustedExtensions.slice(0, 3).join(', ')}${untrustedExtensions.length > 3 ? '...' : ''}`,
            recommendation: 'Review and remove extensions from untrusted sources. Only install extensions from the official marketplace.',
            autoFixable: false,
            metadata: {
              untrustedExtensions: untrustedExtensions.slice(0, 10)
            }
          });
        }
      } catch (error) {
        // Extensions directory doesn't exist - not an issue
      }
    } catch (error: any) {
      console.error('Failed to check extension security:', error);
    }
  }

  private async checkIndexedDirectories(issues: SecurityIssue[]): Promise<void> {
    try {
      const settingsPath = path.join(os.homedir(), '.cursor', 'User', 'settings.json');

      try {
        const settingsContent = await fs.readFile(settingsPath, 'utf-8');
        const settings = JSON.parse(settingsContent);

        // Check for sensitive directories in search paths
        const sensitiveDirectories = [
          os.homedir() + '/.ssh',
          os.homedir() + '/.gnupg',
          '/etc',
          os.homedir() + '/.aws',
          os.homedir() + '/.config'
        ];

        const searchExclude = settings['search.exclude'] || {};
        const filesExclude = settings['files.exclude'] || {};

        const indexedSensitive: string[] = [];

        for (const sensDir of sensitiveDirectories) {
          const isExcluded = Object.keys({...searchExclude, ...filesExclude})
            .some(pattern => sensDir.includes(pattern) || pattern.includes(sensDir));

          if (!isExcluded) {
            indexedSensitive.push(sensDir);
          }
        }

        if (indexedSensitive.length > 0) {
          issues.push({
            id: 'cursor-sensitive-directories-indexed',
            agentId: this.id,
            severity: 'medium',
            title: 'Sensitive directories may be indexed',
            description: `Cursor may index sensitive directories: ${indexedSensitive.join(', ')}`,
            recommendation: 'Add sensitive directories to files.exclude or search.exclude in Cursor settings.',
            autoFixable: false,
            metadata: {
              sensitiveDirs: indexedSensitive
            }
          });
        }
      } catch (error) {
        // Settings file doesn't exist - use defaults
      }
    } catch (error: any) {
      console.error('Failed to check indexed directories:', error);
    }
  }

  private async checkPortBindings(issues: SecurityIssue[]): Promise<void> {
    // Cursor typically binds to localhost only
    // We would need platform-specific tools to check this (netstat, lsof)
    // For now, we'll skip this check as it requires elevated permissions
  }

  async auditPermissions(): Promise<PermissionRisk[]> {
    const risks: PermissionRisk[] = [];

    // Cursor has full filesystem access
    risks.push({
      permission: 'filesystem.full',
      granted: true,
      severity: 'medium',
      reason: 'Cursor IDE has full filesystem access for editing files'
    });

    // Cursor can execute terminal commands
    risks.push({
      permission: 'terminal.execute',
      granted: true,
      severity: 'high',
      reason: 'Cursor has integrated terminal with command execution capabilities'
    });

    return risks;
  }

  async auditNetwork(): Promise<NetworkConnection[]> {
    // Cursor makes connections to:
    // - cursor.sh (telemetry and updates)
    // - AI model APIs
    // We can't easily detect these without root permissions
    return [];
  }

  canControl(): boolean {
    // Cannot directly control Cursor as it's a desktop application
    return false;
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
