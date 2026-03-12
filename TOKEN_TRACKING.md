# Token追踪系统

## 架构设计

AgentGuard采用**可扩展的混合追踪架构**，支持多种AI产品的token使用量监控。

### 核心组件

```
src/core/trackers/
├── BaseTracker.ts          # 基础追踪器接口（所有追踪器必须实现）
├── LocalStorageTracker.ts  # 本地存储追踪器（JSON文件）
├── ClaudeTracker.ts        # Claude API追踪器
├── CursorTracker.ts        # Cursor追踪器
├── TrackerManager.ts       # 追踪器管理器（统一接口）
└── index.ts                # 导出和使用示例
```

### 设计特点

1. **插件化架构**：每个AI产品都是独立的追踪器，易于添加新产品
2. **多层级数据源**：Console API → 日志解析 → 本地追踪
3. **自动降级**：API失败时自动回退到本地数据
4. **统一接口**：所有追踪器实现相同的接口，使用方式一致

---

## 快速开始

### 1. 初始化追踪器

```typescript
import { trackerManager } from './core/trackers';

// 注册Claude追踪器
trackerManager.registerTracker({
  type: 'claude',
  agentId: 'claude-code',
  agentName: 'Claude Code',
  config: {
    // 可选：Organization API Key（如果有，会使用Console API）
    organizationApiKey: process.env.ANTHROPIC_ORG_API_KEY,
    // 启用本地追踪（推荐）
    enableLocalTracking: true
  }
});

// 注册Cursor追踪器
trackerManager.registerTracker({
  type: 'cursor',
  agentId: 'cursor',
  agentName: 'Cursor',
  config: {
    // 可选：自定义日志路径
    logPath: '/custom/path/to/cursor/logs',
    enableLocalTracking: true
  }
});
```

### 2. 记录Token使用

```typescript
// 方式1: 通过TrackerManager获取特定追踪器
const claudeTracker = trackerManager.getTracker('claude-code');

await claudeTracker?.trackUsage({
  inputTokens: 150,
  outputTokens: 300,
  cost: 0.0054, // 或者让追踪器自动计算
  model: 'claude-3-5-sonnet-20241022'
});

// 方式2: 自动计算成本
import { ClaudeTracker } from './core/trackers';

const tracker = new ClaudeTracker({
  agentId: 'my-agent',
  agentName: 'My Agent'
});

const cost = tracker.calculateCost(150, 300, 'claude-3-5-sonnet-20241022');
await tracker.trackUsage({
  inputTokens: 150,
  outputTokens: 300,
  cost
});
```

### 3. 查询使用数据

```typescript
// 获取汇总数据（所有Agent）
const usage = await trackerManager.getAggregatedUsage();
console.log('今日总消耗:', usage.daily.total);
console.log('本月总消耗:', usage.monthly.total);
console.log('各Agent消耗:', usage.daily.byAgent);

// 获取单个Agent的详细数据
const claudeTracker = trackerManager.getTracker('claude-code');
const dailyUsage = await claudeTracker.getDailyUsage();
const monthlyUsage = await claudeTracker.getMonthlyUsage();

console.log('Claude Code今日:', dailyUsage);
console.log('Claude Code本月:', monthlyUsage);
```

---

## 添加新的AI产品

### 步骤1: 创建追踪器类

```typescript
// src/core/trackers/NewProductTracker.ts
import { BaseTracker, DailyUsage, MonthlyUsage, UsageData } from './BaseTracker';
import { LocalStorageTracker } from './LocalStorageTracker';

export class NewProductTracker extends BaseTracker {
  private localTracker: LocalStorageTracker;

  constructor(config: { agentId: string; agentName: string }) {
    super(config.agentId, config.agentName);
    this.localTracker = new LocalStorageTracker(config.agentId, config.agentName);
  }

  async getDailyUsage(date?: Date): Promise<DailyUsage> {
    // 实现获取今日使用量的逻辑
    // 可以从API、日志文件或本地存储获取
    return await this.localTracker.getDailyUsage(date);
  }

  async getMonthlyUsage(month?: string): Promise<MonthlyUsage> {
    // 实现获取本月使用量的逻辑
    return await this.localTracker.getMonthlyUsage(month);
  }

  async trackUsage(usage: Omit<UsageData, 'timestamp'>): Promise<void> {
    // 记录使用数据到本地
    await this.localTracker.trackUsage(usage);
  }
}
```

### 步骤2: 在TrackerManager中注册

```typescript
// src/core/trackers/TrackerManager.ts
import { NewProductTracker } from './NewProductTracker';

// 在registerTracker方法中添加:
case 'newproduct':
  tracker = new NewProductTracker({
    agentId: config.agentId,
    agentName: config.agentName,
    ...config.config
  });
  break;
```

### 步骤3: 导出新追踪器

```typescript
// src/core/trackers/index.ts
export * from './NewProductTracker';
```

### 步骤4: 使用新追踪器

```typescript
trackerManager.registerTracker({
  type: 'newproduct',
  agentId: 'new-ai-tool',
  agentName: 'New AI Tool',
  config: {
    // 自定义配置
  }
});
```

---

## 数据存储

### 本地存储位置

```
~/.agentguard/usage/
├── claude-code.json
├── cursor.json
└── new-product.json
```

### 数据格式

```json
[
  {
    "agentId": "claude-code",
    "agentName": "Claude Code",
    "inputTokens": 150,
    "outputTokens": 300,
    "cost": 0.0054,
    "timestamp": "2024-03-09T10:30:00.000Z",
    "model": "claude-3-5-sonnet-20241022",
    "metadata": {}
  }
]
```

---

## Claude Console API配置

### 获取Organization API Key

1. 访问 [Anthropic Console](https://console.anthropic.com)
2. 进入 Organization Settings
3. 创建一个新的 API Key（需要 Organization 权限）
4. 设置环境变量：
   ```bash
   export ANTHROPIC_ORG_API_KEY=your_org_api_key
   ```

### API端点

```
GET https://api.anthropic.com/v1/organization/usage?start_date=2024-03-01&end_date=2024-03-09
Headers:
  x-api-key: {organization_api_key}
  anthropic-version: 2023-06-01
```

---

## Cursor日志解析

### 日志位置

- **macOS**: `~/Library/Application Support/Cursor/logs/`
- **Windows**: `%APPDATA%/Cursor/logs/`
- **Linux**: `~/.config/Cursor/logs/`

### 注意事项

Cursor的日志格式可能会变化，需要根据实际情况调整解析逻辑。当前实现是示例性的，需要根据实际日志格式进行调整。

---

## 最佳实践

### 1. 混合使用多种数据源

```typescript
// 优先级：Console API > 日志解析 > 本地追踪
tracker.registerTracker({
  type: 'claude',
  agentId: 'claude-code',
  agentName: 'Claude Code',
  config: {
    // 如果有Organization Key，优先使用API
    organizationApiKey: process.env.ANTHROPIC_ORG_API_KEY,
    // 始终启用本地追踪作为备份
    enableLocalTracking: true
  }
});
```

### 2. 定期清理过期数据

```typescript
// 每周清理90天前的数据
setInterval(async () => {
  await trackerManager.cleanupAll(90);
}, 7 * 24 * 60 * 60 * 1000);
```

### 3. 错误处理

```typescript
try {
  const usage = await trackerManager.getAggregatedUsage();
} catch (error) {
  console.error('Failed to get usage:', error);
  // 使用备用数据或提示用户
}
```

---

## 模型定价（2024年）

### Claude模型

| 模型 | Input (per 1M tokens) | Output (per 1M tokens) |
|------|----------------------|------------------------|
| Claude 3.5 Sonnet | $3.00 | $15.00 |
| Claude 3.5 Haiku | $1.00 | $5.00 |
| Claude Opus 4 | $15.00 | $75.00 |

### 其他模型

| 模型 | Input (per 1M tokens) | Output (per 1M tokens) |
|------|----------------------|------------------------|
| GPT-4 | $30.00 | $60.00 |
| GPT-4 Turbo | $10.00 | $30.00 |

---

## 故障排查

### 问题: 显示$0.00

**原因**: 没有真实数据或追踪器未正确初始化

**解决方案**:
1. 检查追踪器是否已注册
2. 确认有实际的API调用记录
3. 查看日志: `~/.agentguard/usage/`

### 问题: Console API调用失败

**原因**: API Key无效或网络问题

**解决方案**:
1. 验证Organization API Key是否正确
2. 检查网络连接
3. 查看错误日志，会自动回退到本地数据

### 问题: Cursor日志解析失败

**原因**: 日志格式变化或路径错误

**解决方案**:
1. 检查日志路径是否正确
2. 打开日志文件查看实际格式
3. 修改`CursorTracker.parseLogLine()`的正则表达式

---

## 未来扩展

可以轻松添加的新产品：

- [ ] GitHub Copilot
- [ ] OpenAI API (GPT-4/ChatGPT)
- [ ] Gemini
- [ ] Perplexity
- [ ] 自定义API服务

每个新产品只需创建一个新的Tracker类即可！
