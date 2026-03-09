# 🖥️ AgentGuard Desktop Widget

**AgentGuard Desktop v0.4.0** - 跨平台桌面监控悬浮球

---

## 📖 概述

AgentGuard Desktop 是一个轻量级的桌面悬浮球应用，实时监控你的 AI Agent 安全状态和 Token 使用情况。

### 核心特性

- ⚛️ **原子图标设计** - 模仿 Electron 的原子结构，旋转的电子轨道
- 🎨 **墨黑色主题** - 深灰到黑色的渐变背景 (#2d3748 → #1a202c)
- 📊 **两级展开面板** - 简洁视图 + 详细视图
- 💰 **智能Token统计** - 自动追踪 Claude Code (VS Code) 和 Cursor
- 🔔 **状态告警** - 根据安全风险变色（正常/警告/严重/离线）
- 🌍 **跨平台支持** - macOS、Windows、Linux

---

## 🚀 快速开始

### 安装依赖

```bash
cd agentguard
npm install
```

### 启动应用

```bash
npm run desktop
```

**注意**: 首次启动会自动编译 TypeScript 代码到 `dist/desktop/` 目录。

### 验证运行

启动后你应该看到：
1. 屏幕右上角出现一个**墨黑色的原子图标悬浮球**
2. 系统托盘（macOS 菜单栏/Windows 任务栏）出现 AgentGuard 图标

---

## 🎮 使用指南

### 1. 悬浮球交互

#### 拖拽移动
- 直接**拖拽悬浮球**到屏幕任意位置
- 位置会自动保存（未来版本）

#### 点击悬浮球
- **单击** → 打开/关闭简洁面板（280px 高度）

### 2. 简洁面板

简洁面板显示最关键的信息：

- **4 个指标卡片**:
  - 💰 **今日消耗** - 实时计算的今日成本
  - 📊 **本月消耗** - 本月累计成本
  - 🤖 **活跃 Agents** - 当前运行的 Agent 数量
  - 🔒 **安全评分** - 0-100 分的综合安全评分

- **Agent 状态摘要**:
  - 显示每个 Agent 的运行状态
  - 告警数量（如有）

- **展开按钮**:
  - 点击"查看详细信息"切换到完整视图

### 3. 完整面板

完整面板（520px 高度）额外显示：

- **Token 使用详情**:
  - Claude Code (VS Code 插件) 的详细统计
  - Cursor 的详细统计
  - 今日/本月的 Token 数量和成本

- **快捷操作**:
  - 🎛️ **打开仪表盘** - 跳转到完整的 Web UI
  - 🔍 **执行扫描** - 立即扫描所有 Agents

### 4. 托盘菜单

右键点击托盘图标：
- **显示/隐藏** - 切换悬浮球显示
- **打开仪表盘** - 启动 Web UI
- **执行扫描** - 扫描所有 Agents
- **退出** - 关闭应用

---

## 🎨 状态指示

### 悬浮球颜色

悬浮球会根据安全状态自动变色：

| 状态 | 颜色 | 含义 | 动画效果 |
|------|------|------|---------|
| **正常** 🟢 | 墨黑色 (#2d3748 → #1a202c) | 安全评分 > 70，问题 < 3 个 | 电子正常旋转 (3s) |
| **警告** 🟡 | 橙黄色 (#f59e0b → #d97706) | 安全评分 50-70，问题 3-4 个 | 电子减速 (6s) |
| **严重** 🔴 | 红色 (#ef4444 → #dc2626) | 安全评分 < 50，问题 ≥ 5 个 | 脉冲动画 + 电子加速 (1s) |
| **离线** ⚫ | 深灰色 (#4a5568 → #2d3748) | 无法连接监控服务 | 动画停止 |

### Tooltip 提示

鼠标悬停在悬浮球上会显示：
- 当前状态
- Agent 活跃数量
- 今日成本
- 安全评分
- 告警数量（如有）

---

## 💰 Token 统计

### 支持的 Agent

| Agent | 数据来源 | 准确度 | 说明 |
|-------|---------|--------|------|
| **Claude Code (VS Code)** | 手动配置 | ⭐⭐⭐ | 需要手动配置 `~/.agentguard/manual-stats.json` |
| **Cursor** | SQLite 数据库 | ⭐⭐⭐⭐⭐ | 自动读取 `~/.cursor/ai-tracking/ai-code-tracking.db` |
| **Claude Code (CLI)** | 缓存文件 | ⭐⭐⭐⭐⭐ | 自动读取 `~/.anthropic/stats-cache.json` |

### 配置 VS Code Claude Plugin

由于 VS Code Claude Plugin 不生成统计文件，需要手动配置：

1. **创建配置文件**:
```bash
mkdir -p ~/.agentguard
nano ~/.agentguard/manual-stats.json
```

2. **写入配置**:
```json
{
  "claude-vscode": {
    "today": 50.00,
    "thisMonth": 450.00,
    "updatedAt": "2026-03-09T02:00:00Z",
    "note": "VS Code Claude 插件手动配置"
  }
}
```

3. **定期更新**: 根据你的使用情况手动更新数值

**提示**: 查看详细配置指南 → [如何更新手动统计](../HOW_TO_UPDATE_MANUAL_STATS.md)

### 成本计算

基于最新的 Claude API 定价（2026 年 3 月）：

| 模型 | 输入价格 | 输出价格 |
|------|---------|----------|
| Claude Opus 4 | $15.00 / 1M tokens | $75.00 / 1M tokens |
| Claude Sonnet 3.5 | $3.00 / 1M tokens | $15.00 / 1M tokens |
| Claude Haiku 3.5 | $1.00 / 1M tokens | $5.00 / 1M tokens |

**默认假设**: 60% 输入 / 40% 输出

---

## ⚙️ 配置选项

### 环境变量

```bash
# 禁用某个功能
AGENTGUARD_DISABLE_FLOATING=true npm run desktop  # 不显示悬浮球
AGENTGUARD_DISABLE_TRAY=true npm run desktop      # 不显示托盘图标

# 自定义端口（如果与 Web UI 冲突）
PORT=3001 npm run desktop
```

### 数据存储

- **配置文件**: `~/.agentguard/`
- **日志文件**: `~/.agentguard/logs/desktop.log`
- **缓存文件**: `~/.agentguard/cache/`

---

## 🐛 故障排查

### 悬浮球不显示

1. **检查进程**:
```bash
ps aux | grep -i electron
```

2. **查看日志**:
```bash
cat ~/.agentguard/logs/desktop.log
```

3. **重启应用**:
```bash
pkill -f Electron.app
npm run desktop
```

### Token 显示为 $0.00

**问题 1: VS Code Claude Plugin 没有配置**

→ 按照上面的"配置 VS Code Claude Plugin"步骤操作

**问题 2: Cursor 数据库未找到**

→ 确认 Cursor 已安装且使用过：
```bash
ls -la ~/.cursor/ai-tracking/ai-code-tracking.db
```

**问题 3: CLI 缓存过期**

→ 手动运行一次 CLI 命令更新缓存：
```bash
npx tsx src/cli/index.ts tokens
```

### 点击崩溃

如果点击悬浮球导致崩溃：

1. **查看错误信息**:
```bash
npm run desktop 2>&1 | tee debug.log
```

2. **检查是否是 GPU 问题**（macOS 常见）:
```bash
# 尝试禁用 GPU 加速
npm run desktop -- --disable-gpu
```

3. **提交 Issue**:
   - 附上 `debug.log`
   - 说明操作系统版本
   - 描述复现步骤

---

## 🔧 开发指南

### 项目结构

```
src/desktop/
├── main/
│   └── index.ts           # Electron 主进程
├── renderer/
│   ├── floating.html      # 悬浮球 UI
│   └── panel.html         # 面板 UI
├── services/
│   └── DataService.ts     # 数据服务
└── tsconfig.json          # TypeScript 配置

dist/desktop/              # 编译后的代码
```

### 本地开发

1. **编译 TypeScript**:
```bash
npm run build:desktop
```

2. **启动应用**:
```bash
npm run desktop
```

3. **热重载开发** (未来支持):
```bash
npm run desktop:dev
```

### 调试工具

**主进程调试**:
```bash
# 启用 Electron 调试
DEBUG=* npm run desktop
```

**渲染进程调试**:
- 右键悬浮球 → "检查元素"（开发模式）

### 打包发布

```bash
# macOS
npm run package:mac

# Windows
npm run package:win

# Linux
npm run package:linux
```

---

## 🌍 跨平台兼容性

| 平台 | 支持 | 测试状态 | 已知问题 |
|------|------|---------|---------|
| **macOS** | ✅ 完整 | ✅ 已测试 (macOS 14+) | GPU 警告（无影响） |
| **Windows** | ✅ 完整 | 🚧 待测试 | - |
| **Linux** | 🟡 部分 | 🚧 待测试 | 透明窗口需要 compositor |

### macOS 特别说明

**GPU 警告** (可忽略):
```
ERROR:command_buffer_proxy_impl.cc GPU state invalid
ERROR:gpu_process_host.cc GPU process exited unexpectedly
```
这是 Electron 在某些 macOS 版本上的已知问题，不影响功能。

### Windows 特别说明

- 悬浮球支持 Windows 10/11
- 托盘图标在任务栏右下角
- 透明效果完全支持

### Linux 特别说明

- 需要桌面环境支持 compositor（如 GNOME、KDE）
- X11 和 Wayland 均支持
- 部分窗口管理器可能不支持 `alwaysOnTop`

---

## 📝 更新日志

### v0.4.0 (2026-03-09) - Beta

**新功能**:
- ⚛️ 原子图标悬浮球设计
- 🎨 墨黑色深色主题
- 📊 两级展开面板（简洁/完整）
- 💰 智能 Token 统计（Claude Code + Cursor）
- 🔔 状态告警系统
- 🌍 跨平台支持（macOS/Windows/Linux）

**修复**:
- 修复"Object has been destroyed"崩溃问题
- 修复定时器导致的内存泄漏
- 修复 Token 显示为 $0.00 的问题
- 优化安全评分阈值（5+ 问题才显示严重）

**已知问题**:
- macOS GPU 警告（无影响）
- Windows/Linux 未充分测试

---

## 🤝 反馈与支持

- 报告 Bug: [GitHub Issues](https://github.com/wanghui2323/agentguard/issues)
- 功能建议: [GitHub Discussions](https://github.com/wanghui2323/agentguard/discussions)
- 贡献代码: [Contributing Guide](../CONTRIBUTING.md)

---

## 📄 许可证

MIT License - 详见 [LICENSE](../LICENSE)
