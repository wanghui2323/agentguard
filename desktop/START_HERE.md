# 🎉 AgentGuard Desktop 已就绪！

## ✅ 构建完成

所有代码已成功构建：
- ✅ 主进程 (Electron) - `dist/main/`
- ✅ 渲染进程 (React) - `dist/renderer/`
- ✅ 500 个 npm 包已安装
- ✅ TypeScript 编译成功

---

## 🚀 现在就启动！

### 方式 1: 开发模式（推荐第一次使用）

```bash
# 确保在 desktop 目录
cd ~/Desktop/AI写作空间/agentguard/desktop

# 启动开发模式
npm run dev
```

**会发生什么**:
1. ⚡ Vite 开发服务器启动 (http://localhost:3000)
2. 🖥️ Electron 窗口自动打开
3. 📊 显示 AgentGuard Dashboard
4. 🔍 自动开始扫描 AI Agents（每 10 秒）
5. 🔧 支持热更新（修改代码即时生效）

### 方式 2: 生产模式

```bash
# 先构建（如果还没构建）
npm run build

# 启动应用
npm start
```

---

## 📱 界面功能

### Dashboard (主窗口)

启动后会看到:

```
┌─────────────────────────────────────────────────┐
│ 🛡️ AgentGuard    [Toggle Widget] [Scan Now]     │
├─────────────────────────────────────────────────┤
│                                                 │
│  [安全评分: 92/100]  [运行中: 3/3]              │
│  [严重问题: 0]       [今日成本: $0.00]          │
│                                                 │
│  ┌─ Security Overview ─┬─ Token Usage ─┐      │
│  │                                      │      │
│  │  Claude Code        评分: 100/100   │      │
│  │  ● Running (PID 95846)              │      │
│  │  ✓ 无安全问题                        │      │
│  │  [Fix] [Stop] [Restart]             │      │
│  └─────────────────────────────────────┘      │
└─────────────────────────────────────────────────┘
```

### 浮窗 (Floating Widget)

点击 "Toggle Widget" 显示浮窗：

```
╔═══════════════════╗
║ 🛡️ AgentGuard  [X]║
╠═══════════════════╣
║  ✅ 安全评分      ║
║     92/100        ║
║                   ║
║  Agents │ 严重    ║
║    3    │   0     ║
║                   ║
║  今日成本          ║
║  $0.00            ║
╚═══════════════════╝
```

- 可拖动到任意位置
- Always-on-top（始终置顶）
- 自动更新（每 10 秒）

### 系统托盘

**macOS**: 顶部菜单栏
**Windows**: 右下角任务栏

**右键菜单**:
- Show Dashboard
- Toggle Floating Widget
- Scan Now
- Quit

---

## 🎮 快速操作

### 手动扫描
点击右上角 "Scan Now" 按钮

### 自动修复问题
1. 找到有问题的 Agent 卡片
2. 点击 "Fix X Issues" 按钮
3. 等待修复完成

### 查看 Token 统计
1. 点击 "Token Usage & Cost" 标签
2. 查看成本和预算

### 停止/重启 Agent
点击 Agent 卡片中的 "Stop" 或 "Restart" 按钮

---

## 🔧 开发模式功能

### 热更新
- **React 组件**: 修改后即时更新（无需刷新）
- **主进程代码**: 修改后自动重启 Electron

### DevTools
开发模式自动打开 Chrome DevTools：
- 查看 Console 日志
- 调试 React 组件
- 查看网络请求

### 实时日志
主进程日志会输出到终端

---

## 📦 打包应用

### macOS

```bash
npm run package:mac
```

生成文件在 `release/`:
- `AgentGuard-1.0.0.dmg` - 安装器
- `AgentGuard-1.0.0-mac.zip` - 压缩包

### Windows

```bash
npm run package:win
```

生成文件在 `release/`:
- `AgentGuard Setup 1.0.0.exe` - 安装程序
- `AgentGuard 1.0.0.exe` - 便携版

---

## ❓ 常见问题

### Q: 窗口打开但是空白？
**A**: 检查是否在 desktop 目录，尝试重新运行 `npm run dev`

### Q: 报错 "Cannot find module"？
**A**: 运行 `npm install` 重新安装依赖

### Q: 端口 3000 被占用？
**A**:
```bash
# 杀掉占用端口的进程
lsof -ti:3000 | xargs kill -9
```

### Q: Electron 窗口没有打开？
**A**: 检查终端是否有错误信息，确保构建成功

---

## 🎯 下一步

1. **启动应用**: `npm run dev`
2. **探索功能**: 熟悉所有界面
3. **查看文档**: 阅读 [README.md](README.md)
4. **自定义**: 修改样式和配置
5. **打包分发**: `npm run package:mac`

---

## 📚 完整文档

- [README.md](README.md) - 完整技术文档
- [DESKTOP_QUICKSTART.md](../DESKTOP_QUICKSTART.md) - 快速启动指南
- [V1.0.0_PROGRESS.md](../V1.0.0_PROGRESS.md) - 开发进度

---

## 🎊 准备好了吗？

现在就运行：

```bash
npm run dev
```

享受 AgentGuard Desktop 带来的实时安全监控体验！ 🛡️✨

---

**AgentGuard Desktop v1.0.0** - The security control center for local AI agents
