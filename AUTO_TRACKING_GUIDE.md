# AgentGuard 自动追踪使用指南

## 📊 支持的 AI 工具

AgentGuard 可以**零配置自动追踪**以下 AI 编程工具的 token 消耗：

| 工具 | 状态 | 追踪方式 | 配置需求 |
|------|------|---------|---------|
| **Claude Code** | ✅ 生产就绪 | 文件解析（JSONL） | 零配置 |
| **Cursor** | ⚠️ 部分支持 | SQLite + API | 零配置 |
| **OpenClaw** | ✅ 生产就绪 | Payload Log + Sessions | 零配置 |

---

## 🚀 快速开始

### 1. 安装 AgentGuard

```bash
# 下载并安装 AgentGuard
npm install
npm run build
npm run dev:desktop
```

### 2. 自动探测

启动后，AgentGuard 会自动探测系统中安装的 AI 工具：

```
[AutoTrackerManager] Auto-detecting AI tools...
[AutoTrackerManager] ✅ Claude Code detected
[AutoTrackerManager] ✅ Cursor detected
[AutoTrackerManager] ✅ OpenClaw detected
[AutoTrackerManager] Detected 3 tools
```

### 3. 查看实时数据

打开 AgentGuard 桌面应用，即可看到：
- 今日总消费
- 各工具分别的消费
- 本月累计消费
- Token 使用详情

---

## 📁 数据源详解

### Claude Code

**数据位置**: `~/.claude/projects/{project-name}/{session-id}.jsonl`

**数据格式**:
```json
{
  "message": {
    "usage": {
      "input_tokens": 3,
      "cache_creation_input_tokens": 6143,
      "cache_read_input_tokens": 15778,
      "output_tokens": 332
    }
  },
  "timestamp": "2026-03-09T08:30:15.123Z"
}
```

**特点**:
- ✅ 默认启用，无需配置
- ✅ 包含完整的 Prompt Caching 数据
- ✅ 实时写入，即时可读
- ✅ 支持多项目追踪

**定价**:
- Input: $3.00 / 1M tokens
- Output: $15.00 / 1M tokens
- Cache Write: $3.75 / 1M tokens
- Cache Read: $0.30 / 1M tokens (90% 折扣)

---

### Cursor

**数据位置**:
- macOS: `~/Library/Application Support/Cursor/User/globalStorage/state.vscdb`
- Windows: `%APPDATA%/Cursor/User/globalStorage/state.vscdb`
- Linux: `~/.config/Cursor/User/globalStorage/state.vscdb`

**追踪方式**:
1. 从 SQLite 读取 access token
2. 调用 Cursor API: `https://cursor.com/api/usage-summary`

**API 响应**:
```json
{
  "membershipType": "pro",
  "billingCycleEnd": "2026-04-01T00:00:00Z",
  "individualUsage": {
    "plan": {
      "used": 450,
      "limit": 500
    },
    "onDemand": {
      "used": 25,
      "limit": 100
    }
  }
}
```

**当前状态**: ⚠️ API 认证需要优化（401 错误）

---

### OpenClaw

**数据位置**:
- 主目录: `~/.openclaw/`
- Payload Log: `~/.openclaw/logs/anthropic-payload.jsonl`
- 会话文件: `~/.openclaw/agents/{agent-id}/sessions/{session-id}.jsonl`

**追踪策略**: 双数据源自动降级

#### 数据源 1: Anthropic Payload Log（推荐）

**启用方式**:
```bash
# 在 ~/.zshrc 或 ~/.bashrc 中添加
export OPENCLAW_ANTHROPIC_PAYLOAD_LOG=1

# 重新加载
source ~/.zshrc

# 重启 OpenClaw Gateway（如果正在运行）
openclaw gateway stop
openclaw gateway start
```

**数据格式**:
```json
{
  "ts": "2026-03-09T08:30:18.456Z",
  "stage": "usage",
  "runId": "run_abc123",
  "sessionId": "session_xyz",
  "provider": "anthropic",
  "modelId": "claude-opus-4-20250514",
  "usage": {
    "input_tokens": 1250,
    "output_tokens": 850,
    "cache_creation_input_tokens": 0,
    "cache_read_input_tokens": 450
  }
}
```

**特点**:
- ✅ 完整的请求/响应数据
- ✅ 与 Claude Code 格式相同
- ✅ 支持成本估算所需的所有字段
- ✅ 支持自定义存储路径

#### 数据源 2: Session Files（备选）

**位置**: `~/.openclaw/agents/default/sessions/*.jsonl`

**数据格式**:
```json
{
  "timestamp": "2026-03-09T08:30:15.123Z",
  "message": {
    "role": "assistant",
    "usage": {
      "input_tokens": 1250,
      "output_tokens": 850
    },
    "model": "claude-opus-4-20250514"
  }
}
```

**特点**:
- ✅ 默认启用，无需配置
- ✅ 支持所有 AI 模型（不限于 Anthropic）
- ✅ 包含会话上下文
- ⚠️ 数据分散在多个文件中

**定价** (Claude Opus 4):
- Input: $15.00 / 1M tokens
- Output: $75.00 / 1M tokens
- Cache Write: $18.75 / 1M tokens
- Cache Read: $1.50 / 1M tokens

---

## 🔧 高级配置

### 手动录入数据

如果自动追踪暂时无法使用，可以手动录入：

```bash
node scripts/update-usage.js
```

交互式菜单：
1. 查看当前数据
2. 添加使用记录
3. 清空所有数据
4. 退出

### 测试追踪功能

```bash
node scripts/test-auto-tracking.js
```

输出示例：
```
📊 工具探测报告:
==================================================

Claude Code:
  状态: ✅ 已安装
  追踪器: AutoClaudeTracker (File Parsing)

Cursor:
  状态: ✅ 已安装
  追踪器: AutoCursorTracker (SQLite + API)

OpenClaw:
  状态: ✅ 已安装
  追踪器: AutoOpenClawTracker (Payload Log + Sessions)

💰 今日使用统计 (最近24小时):
==================================================

总计: $90.33

各工具详情:
  Claude Code: $90.33
  Cursor: $0.00
  OpenClaw: $0.00
```

### 提取 Claude Code 真实数据

```bash
node scripts/extract-real-usage.js
```

这会扫描 `~/.claude/projects/` 下的所有 session 日志，计算最近24小时的真实消耗。

---

## 🛠️ 故障排查

### 问题 1: Claude Code 显示 $0.00

**原因**: 没有最近的 session 数据

**解决方案**:
1. 确认 Claude Code 已经使用过
2. 检查 `~/.claude/projects/` 是否存在
3. 查看 session 日志文件是否包含 usage 数据

### 问题 2: Cursor API 401 错误

**原因**: Token 格式或认证方式不正确

**解决方案**:
1. 暂时使用手动录入: `node scripts/update-usage.js`
2. 等待后续版本修复 API 认证

### 问题 3: OpenClaw 没有数据

**原因**: 未启用 Payload Log，且没有使用记录

**解决方案**:

**方案 A**: 启用 Payload Log（推荐）
```bash
echo 'export OPENCLAW_ANTHROPIC_PAYLOAD_LOG=1' >> ~/.zshrc
source ~/.zshrc
openclaw gateway restart
```

**方案 B**: 正常使用 OpenClaw
- Session 文件会自动记录 usage 数据
- AgentGuard 会自动从 session 文件中提取

### 问题 4: 数据不准确

**原因**: 时间过滤、定价配置或数据解析问题

**解决方案**:
1. 检查系统时间是否正确
2. 查看日志文件的 timestamp 格式
3. 确认使用的模型定价是否正确

---

## 📊 架构对比

| 特性 | Claude Code | Cursor | OpenClaw |
|------|------------|--------|----------|
| **数据格式** | JSONL | SQLite | JSONL |
| **默认启用** | ✅ | ✅ | ⚠️ 需启用 Payload Log |
| **多模型支持** | ❌ 仅 Claude | ⚠️ 主要 Claude | ✅ 所有模型 |
| **缓存追踪** | ✅ 完整 | ⚠️ 有限 | ✅ 完整 |
| **历史数据** | ✅ 全部保留 | ⚠️ 数据库锁定 | ✅ 全部保留 |
| **开源程度** | ❌ 闭源 | ❌ 部分开源 | ✅ 完全开源 |
| **追踪难度** | ⭐ 简单 | ⭐⭐⭐ 中等 | ⭐⭐ 简单 |

---

## 🎯 最佳实践

### 1. 定期检查数据

```bash
# 每天运行一次
node scripts/test-auto-tracking.js
```

### 2. 备份历史数据

```bash
# 备份 Claude Code 数据
tar -czf claude-backup-$(date +%Y%m%d).tar.gz ~/.claude/projects/

# 备份 OpenClaw 数据
tar -czf openclaw-backup-$(date +%Y%m%d).tar.gz ~/.openclaw/
```

### 3. 设置预算告警

在 AgentGuard 中配置月度预算，超出时会自动告警。

### 4. 分析 Token 效率

使用 AgentGuard 的数据可视化功能，分析：
- 哪个工具的 token 效率最高
- 缓存命中率如何
- 不同时间段的使用模式

---

## 📚 技术参考

### Claude Code
- 日志格式: JSONL (每行一个 JSON)
- usage 字段位置: `entry.message.usage`
- 支持字段: input_tokens, output_tokens, cache_creation_input_tokens, cache_read_input_tokens

### Cursor
- 数据库: SQLite (better-sqlite3)
- Token 存储: ItemTable 表的 `cursorAuth/accessToken` key
- API 端点: https://cursor.com/api/usage-summary

### OpenClaw
- 配置文件: ~/.openclaw/openclaw.json
- Payload Log: 需要环境变量 OPENCLAW_ANTHROPIC_PAYLOAD_LOG=1
- Session 文件: 自动生成，位于 agents/{agent-id}/sessions/
- 支持字段: input_tokens, output_tokens, cache_read_input_tokens, cache_creation_input_tokens

---

## 🔮 未来支持

计划支持的工具：
- [ ] Windsurf
- [ ] GitHub Copilot
- [ ] OpenAI Playground
- [ ] Gemini Code Assist
- [ ] Amazon CodeWhisperer

---

## 💡 贡献指南

想要添加新工具的支持？

1. 在 `src/core/trackers/` 创建新的 Tracker 类
2. 继承 `BaseTracker` 并实现必要方法
3. 在 `AutoTrackerManager` 中添加探测逻辑
4. 提交 PR，附上测试数据

详见: [CONTRIBUTING.md](CONTRIBUTING.md)

---

## 📞 支持

- GitHub Issues: https://github.com/yourusername/agentguard/issues
- 文档: https://agentguard.dev/docs
- 社区: https://discord.gg/agentguard

---

**最后更新**: 2026-03-09
**AgentGuard 版本**: 0.3.0
**支持的工具**: Claude Code, Cursor, OpenClaw
