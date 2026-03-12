/**
 * Core types for AgentGuard
 */

export interface Agent {
  id: string;
  name: string;
  version?: string;
  status: 'running' | 'stopped' | 'unknown';
  pid?: number;
  configPath?: string;
  port?: number;
  detectedAt: Date;
  tokenUsage?: TokenUsage;
}

export type SeverityLevel = 'critical' | 'high' | 'medium' | 'low' | 'info';

export interface SecurityIssue {
  id: string;
  agentId: string;
  severity: SeverityLevel;
  title: string;
  description: string;
  recommendation: string;
  autoFixable: boolean;
  requireRestart?: boolean;
  metadata?: Record<string, any>;
}

export interface SecurityScanResult {
  agent: Agent;
  issues: SecurityIssue[];
  score: number;
  level: 'excellent' | 'good' | 'needs-improvement' | 'risky' | 'dangerous';
  scannedAt: Date;
}

export interface ProcessInfo {
  pid: number;
  name: string;
  command: string;
  cpu?: number;
  memory?: number;
}

export interface NetworkConnection {
  protocol: string;
  localAddress: string;
  localPort: number;
  remoteAddress?: string;
  remotePort?: number;
  state: string;
}

export interface PermissionRisk {
  permission: string;
  granted: boolean;
  severity: SeverityLevel;
  reason: string;
}

export type DataSource = 'manual' | 'jsonl' | 'stats-cache' | 'database' | 'estimated';
export type DataAccuracy = 'high' | 'medium' | 'low';

export interface TokenUsage {
  agentId: string;
  agentName: string;
  inputTokens: number;
  outputTokens: number;
  cacheCreationInputTokens?: number;
  cacheReadInputTokens?: number;
  totalTokens: number;
  estimatedCost: number;
  requestCount?: number;
  period: 'daily' | 'weekly' | 'monthly';
  timestamp: Date;
  dataSource?: DataSource;
  accuracy?: DataAccuracy;
}

export interface TokenStats {
  agent: Agent;
  today: TokenUsage;
  thisWeek: TokenUsage;
  thisMonth: TokenUsage;
  history?: TokenUsageHistory[];
}

export interface TokenUsageHistory {
  date: Date;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  estimatedCost: number;
}

export interface CostBudget {
  daily?: number;
  weekly?: number;
  monthly?: number;
}

export interface TokenReport {
  generatedAt: Date;
  agents: TokenStats[];
  totalCost: {
    today: number;
    thisWeek: number;
    thisMonth: number;
  };
  totalTokens: number;
  budget?: CostBudget;
  alerts: string[];
}

export interface FixResult {
  issue: SecurityIssue;
  success: boolean;
  message: string;
  backupPath?: string;
}

/**
 * Agent detector interface
 */
export interface AgentDetector {
  // Basic info
  id: string;
  name: string;
  version: string;

  // Detection
  detect(): Promise<Agent | null>;
  getProcessInfo(): Promise<ProcessInfo[]>;
  getConfigPath(): string | string[] | null;

  // Security auditing
  auditConfig(): Promise<SecurityIssue[]>;
  auditPermissions(): Promise<PermissionRisk[]>;
  auditNetwork(): Promise<NetworkConnection[]>;

  // Control capabilities
  canControl(): boolean;
  stop(): Promise<void>;
  restart(): Promise<void>;
  updateConfig?(patch: Record<string, any>): Promise<void>;
}

/**
 * Configuration
 */
export interface AgentGuardConfig {
  detectors: string[];
  monitoring: {
    enabled: boolean;
    interval: number; // milliseconds
  };
  tokenTracking: {
    enabled: boolean;
    apiEndpoints: Record<string, string>;
  };
  alerts: {
    enabled: boolean;
    email?: string;
    webhook?: string;
  };
}

/**
 * CLI options
 */
export interface ScanOptions {
  agent?: string;
  full?: boolean;
  json?: boolean;
}

export interface FixOptions {
  agent?: string;
  auto?: boolean;
  backup?: boolean;
}

export interface MonitorOptions {
  interval?: number;
  agents?: string[];
}

export interface ExportOptions {
  format: 'json' | 'pdf' | 'html';
  output: string;
  agents?: string[];
}
