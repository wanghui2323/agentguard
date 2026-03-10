/**
 * OpenClaw配置生成器
 */
import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import type { OpenClawConfig } from '../types';

export class ConfigGenerator {
  private readonly configDir = path.join(os.homedir(), '.openclaw');
  private readonly configPath = path.join(this.configDir, 'config.json');
  private readonly tokenPath = path.join(this.configDir, 'token');

  /**
   * 生成强随机令牌
   */
  generateToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * 生成安全配置（推荐）
   */
  generateSecureConfig(options: {
    bind?: string;
    port?: number;
  } = {}): OpenClawConfig {
    return {
      bind: options.bind || '127.0.0.1',
      port: options.port || 18789,
      auth: true,
      token: this.generateToken(),
      dmPolicy: 'restrictive',
      sandbox: true,
      allowedWorkspaces: [path.join(os.homedir(), 'projects')],
      rateLimit: 100,
      logLevel: 'info'
    };
  }

  /**
   * 生成开发配置
   */
  generateDevConfig(options: {
    bind?: string;
    port?: number;
  } = {}): OpenClawConfig {
    return {
      bind: options.bind || '0.0.0.0',
      port: options.port || 18789,
      auth: true,
      token: this.generateToken(),
      dmPolicy: 'permissive',
      sandbox: false,
      logLevel: 'debug'
    };
  }

  /**
   * 保存配置
   */
  async saveConfig(config: OpenClawConfig): Promise<void> {
    // 创建目录
    if (!fs.existsSync(this.configDir)) {
      fs.mkdirSync(this.configDir, { recursive: true });
    }

    // 保存配置
    fs.writeFileSync(
      this.configPath,
      JSON.stringify(config, null, 2),
      'utf-8'
    );

    // 保存令牌到单独文件（方便复制）
    if (config.token) {
      fs.writeFileSync(this.tokenPath, config.token, 'utf-8');
    }

    // 设置文件权限（仅所有者可读写）
    if (process.platform !== 'win32') {
      fs.chmodSync(this.configPath, 0o600);
      if (config.token) {
        fs.chmodSync(this.tokenPath, 0o600);
      }
    }
  }

  /**
   * 读取配置
   */
  async loadConfig(): Promise<OpenClawConfig | null> {
    try {
      if (!fs.existsSync(this.configPath)) {
        return null;
      }

      const content = fs.readFileSync(this.configPath, 'utf-8');
      return JSON.parse(content);
    } catch {
      return null;
    }
  }

  /**
   * 检查配置是否存在
   */
  configExists(): boolean {
    return fs.existsSync(this.configPath);
  }

  /**
   * 获取配置路径
   */
  getConfigPath(): string {
    return this.configPath;
  }

  /**
   * 获取令牌路径
   */
  getTokenPath(): string {
    return this.tokenPath;
  }
}
