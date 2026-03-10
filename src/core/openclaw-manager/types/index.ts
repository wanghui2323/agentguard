/**
 * OpenClaw管理器类型定义
 */

export interface InstallOptions {
  source: 'npm' | 'github';
  version?: string;
  preset: 'secure' | 'development';
  global?: boolean;
}

export interface InstallResult {
  success: boolean;
  installPath: string;
  config: OpenClawConfig;
  accessInfo: AccessInfo;
  error?: string;
}

export interface OpenClawConfig {
  bind: string;
  port: number;
  auth: boolean;
  token?: string;
  dmPolicy: 'restrictive' | 'permissive';
  sandbox: boolean;
  allowedWorkspaces?: string[];
  rateLimit?: number;
  logLevel?: 'info' | 'debug' | 'error';
}

export interface AccessInfo {
  url: string;
  token: string;
  configPath: string;
}

export interface UninstallOptions {
  backup: boolean;
  removeConfig: boolean;
  removeLogs: boolean;
  stopIfRunning: boolean;
}

export interface UninstallResult {
  success: boolean;
  backupPath?: string;
  removedFiles: string[];
  error?: string;
}

export interface ServiceStatus {
  installed: boolean;
  running: boolean;
  version?: string;
  pid?: number;
  uptime?: number;
  config?: OpenClawConfig;
}
