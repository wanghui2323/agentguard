/**
 * 自动追踪管理器
 * 启动时自动探测可用的 AI 工具并初始化追踪器
 */

import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { BaseTracker, DailyUsage, MonthlyUsage } from './BaseTracker';
import { AutoClaudeTracker } from './AutoClaudeTracker';
import { AutoCursorTracker } from './AutoCursorTracker';
import { AutoOpenClawTracker } from './AutoOpenClawTracker';
import { AutoRooCodeTracker } from './AutoRooCodeTracker';
import { AutoCodexTracker } from './AutoCodexTracker';
import { AutoOpenCodeTracker } from './AutoOpenCodeTracker';
import { AutoPiTracker } from './AutoPiTracker';
import { AutoGeminiTracker } from './AutoGeminiTracker';
import { AutoKimiTracker } from './AutoKimiTracker';
import { AutoQwenTracker } from './AutoQwenTracker';
import { AutoKiloTracker } from './AutoKiloTracker';
import { AutoMuxTracker } from './AutoMuxTracker';

export interface AggregatedUsage {
  daily: {
    total: number;
    byAgent: Record<string, number>;
  };
  monthly: {
    total: number;
    byAgent: Record<string, number>;
  };
}

export class AutoTrackerManager {
  private trackers: Map<string, BaseTracker> = new Map();
  private detectionCache: Map<string, boolean> = new Map();

  constructor() {
    this.autoDetectAndRegister();
  }

  /**
   * 自动探测系统中安装的 AI 工具
   */
  private autoDetectAndRegister(): void {
    console.log('[AutoTrackerManager] Auto-detecting AI tools...');

    // 探测 Claude Code
    if (this.detectClaudeCode()) {
      this.trackers.set('claude-code', new AutoClaudeTracker());
      console.log('[AutoTrackerManager] ✅ Claude Code detected');
    }

    // 探测 Cursor
    if (this.detectCursor()) {
      this.trackers.set('cursor', new AutoCursorTracker());
      console.log('[AutoTrackerManager] ✅ Cursor detected');
    }

    // 探测 OpenClaw
    if (this.detectOpenClaw()) {
      this.trackers.set('openclaw', new AutoOpenClawTracker());
      console.log('[AutoTrackerManager] ✅ OpenClaw detected');
    }

    // 探测 Roo Code
    if (this.detectRooCode()) {
      this.trackers.set('roo-code', new AutoRooCodeTracker());
      console.log('[AutoTrackerManager] ✅ Roo Code detected');
    }

    // 探测 Codex CLI
    if (this.detectCodex()) {
      this.trackers.set('codex', new AutoCodexTracker());
      console.log('[AutoTrackerManager] ✅ Codex CLI detected');
    }

    // 探测 OpenCode
    if (this.detectOpenCode()) {
      this.trackers.set('opencode', new AutoOpenCodeTracker());
      console.log('[AutoTrackerManager] ✅ OpenCode detected');
    }

    // 探测 Pi
    if (this.detectPi()) {
      this.trackers.set('pi', new AutoPiTracker());
      console.log('[AutoTrackerManager] ✅ Pi detected');
    }

    // 探测 Gemini CLI
    if (this.detectGemini()) {
      this.trackers.set('gemini', new AutoGeminiTracker());
      console.log('[AutoTrackerManager] ✅ Gemini CLI detected');
    }

    // 探测 Kimi CLI
    if (this.detectKimi()) {
      this.trackers.set('kimi', new AutoKimiTracker());
      console.log('[AutoTrackerManager] ✅ Kimi CLI detected');
    }

    // 探测 Qwen CLI
    if (this.detectQwen()) {
      this.trackers.set('qwen', new AutoQwenTracker());
      console.log('[AutoTrackerManager] ✅ Qwen CLI detected');
    }

    // 探测 Kilo
    if (this.detectKilo()) {
      this.trackers.set('kilo', new AutoKiloTracker());
      console.log('[AutoTrackerManager] ✅ Kilo detected');
    }

    // 探测 Mux
    if (this.detectMux()) {
      this.trackers.set('mux', new AutoMuxTracker());
      console.log('[AutoTrackerManager] ✅ Mux detected');
    }

    // TODO: 探测 Windsurf
    // if (this.detectWindsurf()) {
    //   this.trackers.set('windsurf', new AutoWindsurfTracker());
    // }

    console.log(`[AutoTrackerManager] Detected ${this.trackers.size} tools`);
  }

  /**
   * 探测 Claude Code
   */
  private detectClaudeCode(): boolean {
    if (this.detectionCache.has('claude-code')) {
      return this.detectionCache.get('claude-code')!;
    }

    const claudeDir = path.join(os.homedir(), '.claude');
    const exists = fs.existsSync(claudeDir);

    this.detectionCache.set('claude-code', exists);
    return exists;
  }

  /**
   * 探测 Cursor
   */
  private detectCursor(): boolean {
    if (this.detectionCache.has('cursor')) {
      return this.detectionCache.get('cursor')!;
    }

    const platform = os.platform();
    let cursorPath = '';

    switch (platform) {
      case 'darwin':
        cursorPath = path.join(os.homedir(), 'Library', 'Application Support', 'Cursor');
        break;
      case 'win32':
        cursorPath = path.join(process.env.APPDATA || '', 'Cursor');
        break;
      case 'linux':
        cursorPath = path.join(os.homedir(), '.config', 'Cursor');
        break;
    }

    const exists = fs.existsSync(cursorPath);
    this.detectionCache.set('cursor', exists);
    return exists;
  }

  /**
   * 探测 OpenClaw
   */
  private detectOpenClaw(): boolean {
    if (this.detectionCache.has('openclaw')) {
      return this.detectionCache.get('openclaw')!;
    }

    const openclawPaths = [
      path.join(os.homedir(), '.openclaw'),
      path.join(os.homedir(), '.clawdbot'),  // 旧版
      path.join(os.homedir(), '.moldbot'),   // 旧版
    ];

    const exists = openclawPaths.some(p => fs.existsSync(p));
    this.detectionCache.set('openclaw', exists);
    return exists;
  }

  /**
   * 探测 Roo Code
   */
  private detectRooCode(): boolean {
    if (this.detectionCache.has('roo-code')) {
      return this.detectionCache.get('roo-code')!;
    }

    const platform = os.platform();
    const paths = [
      platform === 'darwin'
        ? path.join(os.homedir(), 'Library', 'Application Support', 'Code', 'User', 'globalStorage', 'rooveterinaryinc.roo-cline', 'tasks')
        : platform === 'win32'
        ? path.join(process.env.APPDATA || '', 'Code', 'User', 'globalStorage', 'rooveterinaryinc.roo-cline', 'tasks')
        : path.join(os.homedir(), '.config', 'Code', 'User', 'globalStorage', 'rooveterinaryinc.roo-cline', 'tasks'),
    ];

    const exists = paths.some(p => fs.existsSync(p));
    this.detectionCache.set('roo-code', exists);
    return exists;
  }

  /**
   * 探测 Codex CLI
   */
  private detectCodex(): boolean {
    if (this.detectionCache.has('codex')) {
      return this.detectionCache.get('codex')!;
    }

    const codexPath = path.join(os.homedir(), '.codex', 'sessions');
    const exists = fs.existsSync(codexPath);
    this.detectionCache.set('codex', exists);
    return exists;
  }

  /**
   * 探测 OpenCode
   */
  private detectOpenCode(): boolean {
    if (this.detectionCache.has('opencode')) {
      return this.detectionCache.get('opencode')!;
    }

    const opencodePath = path.join(os.homedir(), '.local', 'share', 'opencode');
    const exists = fs.existsSync(opencodePath);
    this.detectionCache.set('opencode', exists);
    return exists;
  }

  /**
   * 探测 Pi
   */
  private detectPi(): boolean {
    if (this.detectionCache.has('pi')) {
      return this.detectionCache.get('pi')!;
    }

    const piPath = path.join(os.homedir(), '.pi', 'agent', 'sessions');
    const exists = fs.existsSync(piPath);
    this.detectionCache.set('pi', exists);
    return exists;
  }

  /**
   * 探测 Gemini CLI
   */
  private detectGemini(): boolean {
    if (this.detectionCache.has('gemini')) {
      return this.detectionCache.get('gemini')!;
    }

    const geminiPath = path.join(os.homedir(), '.gemini', 'tmp');
    const exists = fs.existsSync(geminiPath);
    this.detectionCache.set('gemini', exists);
    return exists;
  }

  /**
   * 探测 Kimi CLI
   */
  private detectKimi(): boolean {
    if (this.detectionCache.has('kimi')) {
      return this.detectionCache.get('kimi')!;
    }

    const kimiPath = path.join(os.homedir(), '.kimi', 'sessions');
    const exists = fs.existsSync(kimiPath);
    this.detectionCache.set('kimi', exists);
    return exists;
  }

  /**
   * 探测 Qwen CLI
   */
  private detectQwen(): boolean {
    if (this.detectionCache.has('qwen')) {
      return this.detectionCache.get('qwen')!;
    }

    const qwenPath = path.join(os.homedir(), '.qwen', 'projects');
    const exists = fs.existsSync(qwenPath);
    this.detectionCache.set('qwen', exists);
    return exists;
  }

  /**
   * 探测 Kilo
   */
  private detectKilo(): boolean {
    if (this.detectionCache.has('kilo')) {
      return this.detectionCache.get('kilo')!;
    }

    const platform = os.platform();
    const kiloPath = platform === 'darwin'
      ? path.join(os.homedir(), 'Library', 'Application Support', 'Code', 'User', 'globalStorage', 'kilocode.kilo-code', 'tasks')
      : platform === 'win32'
      ? path.join(process.env.APPDATA || '', 'Code', 'User', 'globalStorage', 'kilocode.kilo-code', 'tasks')
      : path.join(os.homedir(), '.config', 'Code', 'User', 'globalStorage', 'kilocode.kilo-code', 'tasks');

    const exists = fs.existsSync(kiloPath);
    this.detectionCache.set('kilo', exists);
    return exists;
  }

  /**
   * 探测 Mux
   */
  private detectMux(): boolean {
    if (this.detectionCache.has('mux')) {
      return this.detectionCache.get('mux')!;
    }

    const muxPath = path.join(os.homedir(), '.mux', 'sessions');
    const exists = fs.existsSync(muxPath);
    this.detectionCache.set('mux', exists);
    return exists;
  }

  /**
   * 探测 Windsurf
   */
  private detectWindsurf(): boolean {
    if (this.detectionCache.has('windsurf')) {
      return this.detectionCache.get('windsurf')!;
    }

    const platform = os.platform();
    let windsurfPath = '';

    switch (platform) {
      case 'darwin':
        windsurfPath = path.join(os.homedir(), 'Library', 'Application Support', 'Windsurf');
        break;
      case 'win32':
        windsurfPath = path.join(process.env.APPDATA || '', 'Windsurf');
        break;
      case 'linux':
        windsurfPath = path.join(os.homedir(), '.config', 'Windsurf');
        break;
    }

    const exists = fs.existsSync(windsurfPath);
    this.detectionCache.set('windsurf', exists);
    return exists;
  }

  /**
   * 获取特定追踪器
   */
  getTracker(agentId: string): BaseTracker | undefined {
    return this.trackers.get(agentId);
  }

  /**
   * 获取所有已注册的追踪器
   */
  getAllTrackers(): BaseTracker[] {
    return Array.from(this.trackers.values());
  }

  /**
   * 获取汇总使用数据
   */
  async getAggregatedUsage(date?: Date): Promise<AggregatedUsage> {
    const targetDate = date || new Date();

    const dailyResults = await Promise.all(
      Array.from(this.trackers.entries()).map(async ([agentId, tracker]) => {
        try {
          const daily = await tracker.getDailyUsage(targetDate);
          return { agentId, daily };
        } catch (error) {
          console.error(`[AutoTrackerManager] Failed to get daily usage for ${agentId}:`, error);
          return { agentId, daily: { date: '', totalCost: 0, totalInputTokens: 0, totalOutputTokens: 0, requestCount: 0 } };
        }
      })
    );

    const monthlyResults = await Promise.all(
      Array.from(this.trackers.entries()).map(async ([agentId, tracker]) => {
        try {
          const monthly = await tracker.getMonthlyUsage();
          return { agentId, monthly };
        } catch (error) {
          console.error(`[AutoTrackerManager] Failed to get monthly usage for ${agentId}:`, error);
          return { agentId, monthly: { month: '', totalCost: 0, totalInputTokens: 0, totalOutputTokens: 0, requestCount: 0 } };
        }
      })
    );

    const dailyTotal = dailyResults.reduce((sum, r) => sum + r.daily.totalCost, 0);
    const monthlyTotal = monthlyResults.reduce((sum, r) => sum + r.monthly.totalCost, 0);

    const dailyByAgent: Record<string, number> = {};
    const monthlyByAgent: Record<string, number> = {};

    dailyResults.forEach(r => {
      dailyByAgent[r.agentId] = r.daily.totalCost;
    });

    monthlyResults.forEach(r => {
      monthlyByAgent[r.agentId] = r.monthly.totalCost;
    });

    return {
      daily: {
        total: dailyTotal,
        byAgent: dailyByAgent,
      },
      monthly: {
        total: monthlyTotal,
        byAgent: monthlyByAgent,
      },
    };
  }

  /**
   * 重新扫描系统，刷新追踪器
   */
  refresh(): void {
    this.detectionCache.clear();
    this.trackers.clear();
    this.autoDetectAndRegister();
  }

  /**
   * 获取检测报告
   */
  getDetectionReport(): { tool: string; detected: boolean; tracker: string }[] {
    return [
      {
        tool: 'Claude Code',
        detected: this.detectClaudeCode(),
        tracker: 'AutoClaudeTracker (File Parsing)',
      },
      {
        tool: 'Cursor',
        detected: this.detectCursor(),
        tracker: 'AutoCursorTracker (SQLite + API)',
      },
      {
        tool: 'OpenClaw',
        detected: this.detectOpenClaw(),
        tracker: 'AutoOpenClawTracker (Payload Log + Sessions)',
      },
      {
        tool: 'Windsurf',
        detected: this.detectWindsurf(),
        tracker: 'Not Implemented',
      },
    ];
  }
}

// 导出单例
export const autoTrackerManager = new AutoTrackerManager();
