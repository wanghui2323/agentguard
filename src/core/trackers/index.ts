/**
 * Token Tracking System
 *
 * 使用示例:
 *
 * ```typescript
 * import { trackerManager } from './trackers';
 *
 * // 1. 注册追踪器
 * trackerManager.registerTrackers([
 *   {
 *     type: 'claude',
 *     agentId: 'claude-code',
 *     agentName: 'Claude Code',
 *     config: {
 *       organizationApiKey: process.env.ANTHROPIC_ORG_API_KEY, // 可选
 *       enableLocalTracking: true
 *     }
 *   },
 *   {
 *     type: 'cursor',
 *     agentId: 'cursor',
 *     agentName: 'Cursor',
 *     config: {
 *       enableLocalTracking: true
 *     }
 *   }
 * ]);
 *
 * // 2. 记录使用
 * const claudeTracker = trackerManager.getTracker('claude-code');
 * await claudeTracker?.trackUsage({
 *   inputTokens: 150,
 *   outputTokens: 300,
 *   cost: 0.005,
 *   model: 'claude-3-5-sonnet-20241022'
 * });
 *
 * // 3. 获取统计
 * const usage = await trackerManager.getAggregatedUsage();
 * console.log('Today:', usage.daily.total);
 * console.log('This month:', usage.monthly.total);
 * ```
 */

export * from './BaseTracker';
export * from './LocalStorageTracker';
export * from './ClaudeTracker';
export * from './CursorTracker';
export * from './TrackerManager';
export { trackerManager } from './TrackerManager';

// 自动追踪系统（推荐使用）
export * from './AutoClaudeTracker';
export * from './AutoCursorTracker';
export * from './AutoOpenClawTracker';
export * from './AutoRooCodeTracker';
export * from './AutoCodexTracker';
export * from './AutoOpenCodeTracker';
export * from './AutoPiTracker';
export * from './AutoGeminiTracker';
export * from './AutoKimiTracker';
export * from './AutoQwenTracker';
export * from './AutoKiloTracker';
export * from './AutoMuxTracker';
export * from './AutoTrackerManager';
export { autoTrackerManager } from './AutoTrackerManager';
