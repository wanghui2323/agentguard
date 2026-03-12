# VS Code Claude 插件统计方案

## 问题说明

你使用的是 **VS Code 的 Claude Code 插件**，而不是独立的 Claude Code CLI。

**区别**:
```
VS Code 插件:
- 数据存储: VS Code 扩展存储空间
- 统计文件: 不使用 ~/.claude/stats-cache.json
- 无法被我们的代码读取 ❌

Claude Code CLI:
- 数据存储: ~/.claude/
- 统计文件: stats-cache.json
- 我们的代码可以读取 ✅
```

## 解决方案

### 方案 1: 手动配置（最快）✅

在界面添加手动输入功能：

```typescript
// 配置文件: ~/.agentguard/manual-stats.json
{
  "claude-vscode": {
    "today": 50.00,
    "thisMonth": 500.00
  },
  "cursor": {
    // 自动读取
  }
}
```

**优点**:
- 立即可用
- 精确（基于实际账单）
- 不需要复杂解析

**缺点**:
- 需要手动更新
- 不是实时的

### 方案 2: Anthropic API 账单（推荐）✅

直接读取 Anthropic API 的使用统计：

```typescript
// 使用 Anthropic API
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY
});

// 获取使用情况
const usage = await anthropic.usage.get({
  start_date: '2026-03-01',
  end_date: '2026-03-09'
});

// 返回真实的 token 和成本数据
```

**优点**:
- 100% 准确
- 实时数据
- 包含所有使用（VS Code + CLI + API）

**缺点**:
- 需要 API Key
- 需要配置

### 方案 3: VS Code 扩展集成（长期）

开发 VS Code 扩展集成：

```typescript
// VS Code 扩展 API
vscode.workspace.onDidChangeConfiguration((e) => {
  if (e.affectsConfiguration('claude')) {
    // 读取 Claude 插件使用数据
    const claudeExt = vscode.extensions.getExtension('anthropic.claude');
    const stats = claudeExt.exports.getUsageStats();
  }
});
```

**优点**:
- 自动读取
- 实时更新

**缺点**:
- 开发复杂
- 需要 Claude 插件支持

## 快速实现：方案 1 + 方案 2

让我实现一个混合方案：

### 1. 手动配置文件

创建 `~/.agentguard/config.json`:

```json
{
  "agents": {
    "claude-vscode": {
      "type": "manual",
      "dailyBudget": 55.56,
      "monthlyBudget": 500.00,
      "currentMonthUsage": 450.00
    },
    "cursor": {
      "type": "auto",
      "source": "sqlite"
    }
  },
  "anthropic": {
    "apiKey": "sk-ant-xxxxx",
    "enabled": false
  }
}
```

### 2. 更新 token-tracker

```typescript
async getClaudeTokenStats(agent: Agent) {
  // 1. 尝试读取手动配置
  const manualConfig = await this.readManualConfig();
  if (manualConfig?.['claude-vscode']) {
    return this.createFromManualConfig(manualConfig['claude-vscode']);
  }

  // 2. 尝试读取 Anthropic API
  if (this.config.anthropic?.enabled) {
    return await this.getFromAnthropicAPI();
  }

  // 3. 降级到 stats-cache.json
  return await this.getFromStatsCache();
}
```

### 3. 添加 UI 配置页面

在 Web Dashboard 添加配置页面：

```html
<h3>Claude Code 统计方式</h3>

<input type="radio" name="claude-source" value="auto">
  自动读取 (stats-cache.json)

<input type="radio" name="claude-source" value="manual">
  手动输入

<input type="radio" name="claude-source" value="api">
  Anthropic API

<div id="manual-input">
  <label>今日消耗: $<input type="number" step="0.01"></label>
  <label>本月消耗: $<input type="number" step="0.01"></label>
  <button>保存</button>
</div>

<div id="api-config">
  <label>API Key: <input type="password"></label>
  <button>验证并保存</button>
</div>
```

## 立即可用的临时方案

在没有实现完整配置系统之前，你可以：

### 方法 1: 直接修改代码

编辑 `src/core/token-tracker.ts`:

```typescript
async getClaudeTokenStats(agent: Agent) {
  // 临时硬编码你的实际消耗
  const today: TokenUsage = {
    agentId: agent.id,
    agentName: agent.name,
    inputTokens: 0,
    outputTokens: 0,
    totalTokens: 0,
    estimatedCost: 50.00, // ← 你的今日实际消耗
    period: 'daily',
    timestamp: new Date()
  };

  const thisMonth: TokenUsage = {
    agentId: agent.id,
    agentName: agent.name,
    inputTokens: 0,
    outputTokens: 0,
    totalTokens: 0,
    estimatedCost: 450.00, // ← 你的本月实际消耗
    period: 'monthly',
    timestamp: new Date()
  };

  return { today, thisWeek: today, thisMonth };
}
```

### 方法 2: 创建配置文件

```bash
# 创建配置
cat > ~/.agentguard/manual-stats.json << 'EOF'
{
  "claude-vscode": {
    "today": 50.00,
    "thisMonth": 450.00,
    "updatedAt": "2026-03-09T02:00:00Z"
  }
}
EOF
```

然后修改代码读取这个文件。

## 推荐的最终方案

基于你的情况（VS Code 插件 + 月消耗 $500），我建议：

**短期（本周）**:
1. ✅ Cursor 自动读取（已实现）
2. ✅ Claude 手动配置（创建配置文件）
3. ✅ 界面显示混合数据

**中期（本月）**:
1. 添加 Web UI 配置页面
2. 支持手动编辑消耗数据
3. 添加"最后更新时间"显示

**长期（未来）**:
1. 集成 Anthropic API
2. 自动同步账单数据
3. 支持多种统计源

## 现在怎么办？

你有两个选择：

### 选择 A: 快速硬编码（5分钟）

我帮你修改代码，直接写入你的实际消耗数据：
- 今日: $50
- 本月: $450

### 选择 B: 实现配置系统（30分钟）

我帮你实现完整的配置文件系统：
- 创建 `~/.agentguard/config.json`
- 修改 token-tracker 读取配置
- 添加 Web UI 配置页面

**你想选哪个？或者你有其他想法？**

---

## 补充：为什么 Cursor 能读到数据？

Cursor 使用 SQLite 数据库存储所有 AI 代码生成记录：
```
~/.cursor/ai-tracking/ai-code-tracking.db
└── ai_code_hashes 表
    ├── timestamp (调用时间)
    ├── model (使用的模型)
    └── requestId (请求ID)
```

这个数据库是 Cursor 内置的，所有使用方式（IDE、CLI）都会写入同一个数据库。

但 VS Code 的 Claude 插件没有这样的统一数据库，所以需要其他方案。
