# Token显示修复报告

**修复日期**: 2026-03-09
**问题**: Token详情面板显示所有工具成本为 $0.00

## 问题根因

桌面应用 (`desktop/src/main/index.ts`) 仍在使用旧的 `TokenTracker` 类，该类只支持 Claude Code 和 Cursor 两个工具。

```typescript
// 旧代码 (有问题)
const tokenTracker = new TokenTracker();
const tokenReport = await tokenTracker.getTokenReport(agents);
```

`TokenTracker.getAgentTokenStats()` 中的逻辑：
```typescript
switch (agent.id) {
  case 'claude':
    // ... 返回数据
  case 'cursor':
    // ... 返回数据
  default:
    return null;  // ❌ 所有其他工具返回 null
}
```

因此：
- **Claude Code**: 显示正确金额 ($102.84)
- **Cursor**: 显示 $0.00 (API 401 失败，降级返回空数据)
- **OpenClaw/Roo Code等**: 全部返回 `null`，导致UI显示 $0.00

## 解决方案

### 1. 切换到 AutoTrackerManager

将桌面应用的数据源从旧的 `TokenTracker` 切换到新的 `autoTrackerManager`：

```typescript
// 新代码 (已修复)
import { autoTrackerManager } from '../../../src/core/trackers/AutoTrackerManager';

const tokenReport = await getTokenReportFromAutoTrackers();
```

### 2. 实现数据转换函数

创建 `getTokenReportFromAutoTrackers()` 函数，将 `autoTrackerManager` 的数据转换为 `TokenReport` 格式：

```typescript
async function getTokenReportFromAutoTrackers(): Promise<TokenReport> {
  const usage = await autoTrackerManager.getAggregatedUsage();

  // 遍历所有检测到的工具
  for (const [agentId, dailyCost] of Object.entries(usage.daily.byAgent)) {
    const tracker = autoTrackerManager.getTracker(agentId);
    const dailyUsage = await tracker.getDailyUsage();
    const monthlyUsage = await tracker.getMonthlyUsage();

    // 创建 TokenStats 对象
    agentStats.push({
      agent: { id: agentId, name: tracker.agentName, ... },
      today: { estimatedCost: dailyUsage.totalCost, ... },
      thisWeek: { ... },
      thisMonth: { estimatedCost: monthlyUsage.totalCost, ... }
    });
  }

  return { agents: agentStats, totalCost: {...}, ... };
}
```

### 3. 更新类型定义

在 `TokenReport` 接口中添加 `totalTokens` 字段：

```typescript
export interface TokenReport {
  generatedAt: Date;
  agents: TokenStats[];
  totalCost: { today: number; thisWeek: number; thisMonth: number };
  totalTokens: number;  // ✅ 新增
  budget?: CostBudget;
  alerts: string[];
}
```

## 修改文件清单

1. **desktop/src/main/index.ts**
   - 移除 `TokenTracker` 导入
   - 添加 `autoTrackerManager` 导入
   - 移除 `const tokenTracker = new TokenTracker();`
   - 实现 `getTokenReportFromAutoTrackers()` 函数
   - 更新 `performScan()` 调用新函数

2. **src/types/index.ts**
   - `TokenReport` 接口添加 `totalTokens: number`

3. **src/core/token-tracker.ts**
   - 在返回值中添加 `totalTokens` 字段（向后兼容）

## 测试验证

### 编译测试
```bash
npm run build:desktop
# ✅ 编译成功，无错误
```

### 功能测试
```bash
node scripts/test-all-trackers.js
```

**结果**:
```
✅ Claude Code: $102.84 (2061 请求)
✅ Cursor: $0.00 (API 401，符合预期)
✅ OpenClaw: $0.00 (无使用数据)
✅ OpenCode: $0.00 (无使用数据)

今日汇总: $102.84
本月汇总: $201.66
```

## 预期效果

修复后，Token详情面板将显示：

| 工具 | 今日成本 | 本月成本 | 状态 |
|------|---------|---------|------|
| Claude Code | $102.84 | $201.66 | ✅ 正常 |
| Cursor | $0.00 | $0.00 | ⚠️ 需手动录入 |
| OpenClaw | $0.00 | $0.00 | 📊 未检测到使用 |
| Roo Code | $0.00 | $0.00 | 📊 未检测到使用 |
| ... | ... | ... | ... |

所有已安装并被检测到的工具都会显示在列表中，而不是返回 `null` 导致UI无法渲染。

## 技术优势

1. **支持12个工具**: 自动支持所有 AutoTracker（Claude Code, Cursor, OpenClaw, OpenCode, Roo Code, Codex, Pi, Gemini, Kimi, Qwen, Kilo, Mux）
2. **自动探测**: 无需手动配置，自动检测已安装工具
3. **零凭证**: 不需要API密钥或Session Token
4. **实时数据**: 直接读取本地文件系统数据
5. **向后兼容**: 旧的 TokenTracker 仍然可用（CLI/Web端可能使用）

## 部署建议

1. 重新编译桌面应用
   ```bash
   npm run build:desktop
   ```

2. 重启桌面应用以加载新代码

3. 验证Token详情面板显示正确

4. 如遇到问题，检查控制台日志中的追踪器检测报告
