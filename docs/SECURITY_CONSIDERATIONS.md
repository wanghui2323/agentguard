# AgentGuard 安全考虑

## 🔒 安全设计原则

AgentGuard 在设计时遵循以下安全原则：

### 1. 最小权限原则
- 只读取必要的本地文件
- 不请求不必要的系统权限
- 不访问网络（除非用户主动触发）

### 2. 零凭证存储
- 不存储任何 API Key
- 不存储任何 Session Token
- 不存储任何密码或认证凭证

### 3. 透明操作
- 所有数据读取操作对用户可见
- 开源代码可审计
- 不进行隐藏的后台操作

---

## 📊 各 AI 工具的追踪方式对比

### ✅ Claude Code（安全）

**追踪方式**：只读本地 JSONL 日志文件

```
数据路径：~/.claude/projects/*/session*.jsonl
权限需求：文件读取权限（用户安装时已授予）
安全等级：🟢 低风险
```

**为什么安全**：
- ✅ 不涉及任何认证
- ✅ 只读取日志文件（文件本身就是为记录而设计）
- ✅ 不修改任何文件
- ✅ 离线操作，无网络请求

---

### ✅ OpenClaw（安全）

**追踪方式**：读取本地日志和 session 文件

```
数据路径：
  - ~/.openclaw/logs/anthropic-payload.jsonl
  - ~/.openclaw/agents/*/sessions/*.jsonl
权限需求：文件读取权限
安全等级：🟢 低风险
```

**为什么安全**：
- ✅ 同 Claude Code，只读本地日志
- ✅ 支持 Payload Log（需用户主动启用）
- ✅ 自动降级到 session 文件
- ✅ 无网络请求

---

### ⚠️ Cursor（手动录入方案）

**为什么不自动追踪**：

#### ❌ 方案 A：读取 SQLite + API 调用（不安全）
```
数据路径：~/Library/Application Support/Cursor/state.vscdb
操作步骤：
  1. 读取 cursorAuth/accessToken
  2. 调用 cursor.com/api/usage-summary
```

**安全风险**：
- 🔴 **账户劫持风险**：accessToken 可完全控制用户账户
- 🔴 **存储风险**：需要缓存 Token 到本地
- 🔴 **API 认证失败**：当前返回 401，无法验证安全性
- 🔴 **违反最佳实践**：不应读取其他应用的认证凭证

#### ❌ 方案 B：要求用户提供 Session Token（不安全）
```
用户操作：
  1. 浏览器登录 cursor.com
  2. F12 开发者工具
  3. 复制 WorkosCursorSessionToken
  4. 粘贴到 AgentGuard
```

**安全风险**：
- 🔴 **凭证泄露**：用户主动泄露认证凭证
- 🔴 **中间人攻击**：复制粘贴过程可能被截获
- 🔴 **用户信任问题**：要求用户提供敏感信息
- 🔴 **教育用户不良习惯**：让用户习惯分享认证令牌

#### ✅ 方案 C：手动录入（当前方案，安全）
```
用户操作：
  1. 在 Cursor IDE 中查看使用量
  2. 在 AgentGuard 中手动输入数字
```

**为什么安全**：
- ✅ **零凭证**：不涉及任何认证信息
- ✅ **用户主动**：用户完全控制数据
- ✅ **透明操作**：用户清楚知道输入的内容
- ✅ **最小权限**：只需要用户输入权限

---

## 🔐 其他开源项目的方案对比

### tokscale（⭐1069）
```
方案：tokscale cursor login（要求用户提供 Session Token）
安全性：🔴 中等风险
问题：用户需要手动从浏览器复制 Token
```

### CursorLens（⭐386）
```
方案：代理模式（拦截所有 API 请求）
安全性：🔴 高风险
问题：
  - 可以看到所有 API 流量
  - 可能泄露代码内容
  - 需要配置代理和 ngrok
```

### Vibeviewer（⭐101）
```
方案：要求用户登录
安全性：🔴 中等风险
问题：需要存储认证信息
```

---

## 💡 AgentGuard 的安全优势

### 对比其他方案

| 项目 | Cursor 追踪方式 | 安全风险 | AgentGuard |
|------|----------------|---------|-----------|
| tokscale | 要求 Session Token | 🔴 中等 | ✅ 手动录入（无风险） |
| CursorLens | 代理拦截 | 🔴 高 | ✅ 手动录入（无风险） |
| Vibeviewer | 登录认证 | 🔴 中等 | ✅ 手动录入（无风险） |

### 我们的选择

```
安全性 > 便利性
```

虽然手动录入不如自动追踪方便，但我们**优先考虑用户的账户安全**：

1. **不存储任何凭证** - 即使 AgentGuard 被黑客攻击，也无法获取用户的 Cursor 账户
2. **不读取认证信息** - 不触碰其他应用的敏感数据
3. **透明可控** - 用户完全控制输入的数据
4. **符合最佳实践** - 遵循安全开发标准

---

## 🛡️ 用户数据保护

### 本地存储

```typescript
// 数据存储位置
~/.agentguard/
├── usage/
│   ├── claude-code.json    // Claude Code 使用量
│   ├── openclaw.json        // OpenClaw 使用量
│   └── cursor.json          // Cursor 手动录入数据
└── config.json              // 应用配置
```

**存储的数据**：
- ✅ Token 使用量（数字）
- ✅ 成本数据（数字）
- ✅ 时间戳
- ❌ 不存储任何认证凭证
- ❌ 不存储任何代码内容
- ❌ 不存储任何个人身份信息

### 数据传输

```
✅ 无网络传输
✅ 所有数据仅存储在本地
✅ 不上传到任何服务器
✅ 不与第三方共享
```

---

## 🔍 安全审计

### 开源透明

```bash
# 用户可以审计所有代码
git clone https://github.com/yourusername/agentguard
cd agentguard

# 检查是否有网络请求
grep -r "fetch\|axios\|request" src/

# 检查是否存储凭证
grep -r "token\|password\|credential" src/
```

### 权限声明

AgentGuard 只请求以下权限：

1. **文件读取权限** - 读取 AI 工具的日志文件
2. **本地存储权限** - 存储使用量数据到 `~/.agentguard/`
3. **系统托盘权限** - 显示悬浮窗（Electron）

**不需要的权限**：
- ❌ 网络访问权限（除非用户主动触发）
- ❌ 摄像头/麦克风权限
- ❌ 位置信息权限
- ❌ 联系人/日历权限

---

## ⚠️ 用户注意事项

### 不要这样做

```
❌ 不要与任何人分享 Session Token
❌ 不要在公共电脑上使用 Cursor
❌ 不要截图包含 Token 的开发者工具界面
❌ 不要将 Token 提交到 Git 仓库
```

### 安全建议

```
✅ 定期更换密码
✅ 启用两步验证（如果 Cursor 支持）
✅ 使用 AgentGuard 的手动录入功能
✅ 定期检查账户活动
```

---

## 🚀 未来计划

### 期待 Cursor 官方 API

当 Cursor 提供官方的、安全的 API 时，我们会立即适配：

```typescript
// 理想的官方 API 方案
const usage = await cursor.getUsage({
  scope: 'usage:read', // 只读使用量，不涉及账户控制
  authorization: 'OAuth 2.0', // 标准授权流程
});
```

**官方 API 的优势**：
- ✅ 使用 OAuth 标准授权
- ✅ 细粒度权限控制
- ✅ Token 自动过期和刷新
- ✅ 审计日志
- ✅ 安全最佳实践

---

## 📞 安全问题报告

如果您发现任何安全问题，请通过以下方式报告：

```
Email: security@agentguard.dev（示例）
GitHub: 私密 Security Advisory
不要在公开 Issue 中披露安全漏洞
```

---

## 📄 许可证

AgentGuard 是开源软件，遵循 MIT 许可证。
代码可审计，用户可验证安全性。

**最后更新**：2026-03-09
**文档版本**：1.0.0
