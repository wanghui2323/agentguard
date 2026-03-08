/**
 * Auto-fix Engine
 */
import type { SecurityIssue, FixResult, AgentDetector } from '../types';
import { backupConfig, setFilePermissions, expandHome } from '../utils/config';
import { SecurityScanner } from './scanner';
import { randomBytes } from 'crypto';

export class AutoFixer {
  constructor(private scanner: SecurityScanner) {}

  /**
   * Fix a specific issue
   */
  async fixIssue(issue: SecurityIssue): Promise<FixResult> {
    if (!issue.autoFixable) {
      return {
        issue,
        success: false,
        message: 'This issue cannot be auto-fixed'
      };
    }

    try {
      const detector = this.scanner.getDetector(issue.agentId);
      if (!detector) {
        return {
          issue,
          success: false,
          message: `Detector not found for agent: ${issue.agentId}`
        };
      }

      // Backup config before fixing
      const configPath = detector.getConfigPath();
      if (typeof configPath === 'string') {
        const backupPath = await backupConfig(expandHome(configPath));

        try {
          await this.applyFix(issue, detector);

          return {
            issue,
            success: true,
            message: 'Issue fixed successfully',
            backupPath
          };
        } catch (error) {
          // TODO: Restore from backup on failure
          throw error;
        }
      }

      return {
        issue,
        success: false,
        message: 'Config path not found'
      };
    } catch (error) {
      return {
        issue,
        success: false,
        message: `Failed to fix: ${error}`
      };
    }
  }

  /**
   * Fix all auto-fixable issues for an agent
   */
  async fixAllIssues(issues: SecurityIssue[]): Promise<FixResult[]> {
    const results: FixResult[] = [];

    for (const issue of issues) {
      if (issue.autoFixable) {
        const result = await this.fixIssue(issue);
        results.push(result);
      }
    }

    return results;
  }

  /**
   * Apply fix based on issue type
   */
  private async applyFix(issue: SecurityIssue, detector: AgentDetector): Promise<void> {
    if (!detector.updateConfig) {
      throw new Error('Detector does not support config updates');
    }

    switch (issue.id) {
      case 'openclaw-port-exposed':
        await detector.updateConfig({
          gateway: { bind: 'loopback' }
        });
        break;

      case 'openclaw-no-auth':
        await detector.updateConfig({
          gateway: {
            auth: {
              mode: 'token',
              token: this.generateStrongToken()
            }
          }
        });
        break;

      case 'openclaw-weak-token':
        await detector.updateConfig({
          gateway: {
            auth: {
              token: this.generateStrongToken()
            }
          }
        });
        break;

      case 'openclaw-dm-policy-open':
        await detector.updateConfig({
          channels: {
            whatsapp: {
              dmPolicy: 'pairing'
            }
          }
        });
        break;

      case 'openclaw-no-sandbox':
        await detector.updateConfig({
          agents: { sandbox: true }
        });
        break;

      case 'openclaw-workspace-rw':
        await detector.updateConfig({
          agents: { workspace: 'ro' }
        });
        break;

      case 'openclaw-config-permissions':
        const configPath = detector.getConfigPath();
        if (typeof configPath === 'string') {
          await setFilePermissions(expandHome(configPath), '600');
        }
        break;

      // Claude Code fixes
      case 'claude-config-permissions':
        const claudeConfigPath = detector.getConfigPath();
        if (typeof claudeConfigPath === 'string') {
          await setFilePermissions(expandHome(claudeConfigPath), '600');
        }
        break;

      // Cursor IDE fixes
      case 'cursor-unsafe-trusted-folders':
        // This requires reading and modifying the trust file
        // For now, we'll mark it as manual fix needed
        throw new Error('This fix requires manual user confirmation. Please use Cursor IDE settings to untrust unsafe folders.');
        break;

      default:
        throw new Error(`Unknown issue type: ${issue.id}`);
    }
  }

  /**
   * Generate a strong random token
   */
  private generateStrongToken(length = 32): string {
    return randomBytes(length).toString('base64').slice(0, length);
  }
}
