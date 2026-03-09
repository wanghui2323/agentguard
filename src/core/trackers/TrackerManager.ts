/**
 * 追踪器管理器
 * 统一管理所有AI产品的token追踪
 * 支持动态添加新的追踪器
 */

import { BaseTracker, DailyUsage, MonthlyUsage } from './BaseTracker';
import { ClaudeTracker } from './ClaudeTracker';
import { CursorTracker } from './CursorTracker';

export type TrackerType = 'claude' | 'cursor' | 'openai' | 'github-copilot' | 'custom';

interface TrackerConfig {
  type: TrackerType;
  agentId: string;
  agentName: string;
  enabled?: boolean;
  config?: any; // 具体追踪器的配置
}

interface AggregatedUsage {
  daily: {
    total: number;
    byAgent: Record<string, number>;
  };
  monthly: {
    total: number;
    byAgent: Record<string, number>;
  };
}

export class TrackerManager {
  private trackers: Map<string, BaseTracker> = new Map();
  private configs: Map<string, TrackerConfig> = new Map();

  /**
   * 注册追踪器
   */
  registerTracker(config: TrackerConfig): void {
    if (config.enabled === false) {
      console.log(`[TrackerManager] Tracker ${config.agentId} is disabled`);
      return;
    }

    let tracker: BaseTracker;

    switch (config.type) {
      case 'claude':
        tracker = new ClaudeTracker({
          agentId: config.agentId,
          agentName: config.agentName,
          ...config.config
        });
        break;

      case 'cursor':
        tracker = new CursorTracker({
          agentId: config.agentId,
          agentName: config.agentName,
          ...config.config
        });
        break;

      case 'custom':
        if (!config.config?.customTracker) {
          throw new Error('Custom tracker must provide a customTracker instance');
        }
        tracker = config.config.customTracker;
        break;

      default:
        console.warn(`[TrackerManager] Unknown tracker type: ${config.type}`);
        return;
    }

    this.trackers.set(config.agentId, tracker);
    this.configs.set(config.agentId, config);
    console.log(`[TrackerManager] Registered tracker: ${config.agentId} (${config.type})`);
  }

  /**
   * 批量注册追踪器
   */
  registerTrackers(configs: TrackerConfig[]): void {
    configs.forEach(config => this.registerTracker(config));
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
   * 获取所有已注册的Agent ID
   */
  getAgentIds(): string[] {
    return Array.from(this.trackers.keys());
  }

  /**
   * 获取汇总的使用数据
   */
  async getAggregatedUsage(date?: Date): Promise<AggregatedUsage> {
    const targetDate = date || new Date();
    const dailyByAgent: Record<string, number> = {};
    const monthlyByAgent: Record<string, number> = {};

    const promises = Array.from(this.trackers.entries()).map(async ([agentId, tracker]) => {
      try {
        const daily = await tracker.getDailyUsage(targetDate);
        const monthly = await tracker.getMonthlyUsage();

        dailyByAgent[agentId] = daily.totalCost;
        monthlyByAgent[agentId] = monthly.totalCost;
      } catch (error) {
        console.error(`[TrackerManager] Failed to get usage for ${agentId}:`, error);
        dailyByAgent[agentId] = 0;
        monthlyByAgent[agentId] = 0;
      }
    });

    await Promise.all(promises);

    return {
      daily: {
        total: Object.values(dailyByAgent).reduce((sum, cost) => sum + cost, 0),
        byAgent: dailyByAgent
      },
      monthly: {
        total: Object.values(monthlyByAgent).reduce((sum, cost) => sum + cost, 0),
        byAgent: monthlyByAgent
      }
    };
  }

  /**
   * 获取所有Agent的详细使用数据
   */
  async getAllUsageDetails(date?: Date): Promise<Map<string, { daily: DailyUsage; monthly: MonthlyUsage }>> {
    const targetDate = date || new Date();
    const results = new Map();

    const promises = Array.from(this.trackers.entries()).map(async ([agentId, tracker]) => {
      try {
        const daily = await tracker.getDailyUsage(targetDate);
        const monthly = await tracker.getMonthlyUsage();
        results.set(agentId, { daily, monthly });
      } catch (error) {
        console.error(`[TrackerManager] Failed to get details for ${agentId}:`, error);
      }
    });

    await Promise.all(promises);
    return results;
  }

  /**
   * 移除追踪器
   */
  unregisterTracker(agentId: string): boolean {
    this.configs.delete(agentId);
    return this.trackers.delete(agentId);
  }

  /**
   * 清理所有追踪器的过期数据
   */
  async cleanupAll(daysToKeep: number = 90): Promise<void> {
    const promises = Array.from(this.trackers.values()).map(tracker => {
      if (tracker.cleanup) {
        return tracker.cleanup(daysToKeep);
      }
      return Promise.resolve();
    });

    await Promise.all(promises);
    console.log(`[TrackerManager] Cleanup completed for all trackers`);
  }
}

// 导出单例
export const trackerManager = new TrackerManager();
