# 🚀 AgentGuard Desktop 快速启动指南

## 📍 重要提示

**请务必在正确的目录下运行命令！**

AgentGuard 有两个版本：
1. **CLI 版本** - 在 `agentguard/` 根目录
2. **Desktop 版本** - 在 `agentguard/desktop/` 子目录

---

## 🎯 快速启动 Desktop 版本

### 步骤 1: 进入 desktop 目录

```bash
# 从你的终端，进入正确的目录
cd ~/Desktop/AI写作空间/agentguard/desktop
```

**验证**: 运行 `ls` 应该能看到 `package.json` 文件

### 步骤 2: 安装依赖（首次运行）

```bash
npm install
```

这会安装 Electron、React 等所有依赖（可能需要 2-3 分钟）

### 步骤 3: 启动开发模式

```bash
npm run dev
```

**会发生什么**:
1. Vite 开发服务器启动 (http://localhost:3000)
2. Electron 窗口自动打开
3. 显示 AgentGuard Dashboard
4. 自动开始扫描 AI Agents

---

## 🖥️ 界面说明

### Dashboard (主窗口)

启动后你会看到:

```
╔══════════════════════════════════════════════╗
║  🛡️ AgentGuard    [Toggle Widget] [Scan Now] ║
╠══════════════════════════════════════════════╣
║                                              ║
║  [安全评分: 92/100]  [运行中: 3/3]           ║
║  [严重问题: 0]       [今日成本: $0.00]       ║
║                                              ║
║  ┌─ Security Overview ─┬─ Token Usage ─┐   ║
║  │                                      │   ║
║  │  Claude Code        评分: 100/100   │   ║
║  │  ● Running (PID 95846)              │   ║
║  │  ✓ 无安全问题                        │   ║
║  │                                      │   ║
║  │  Cursor IDE         评分: 100/100   │   ║
║  │  ● Running (PID 43331)              │   ║
║  │  ✓ 无安全问题                        │   ║
║  │                                      │   ║
║  │  OpenClaw           评分: 75/100    │   ║
║  │  ○ Stopped                          │   ║
║  │  🟠 发现 1 个问题                    │   ║
║  │  [Fix] [Stop] [Restart]             │   ║
║  └─────────────────────────────────────┘   ║
╚══════════════════════════════════════════════╝
```

### 浮窗 (Floating Widget)

点击 "Toggle Widget" 会在右上角显示:

```
╔═══════════════════╗
║ 🛡️ AgentGuard  [X]║
╠═══════════════════╣
║                   ║
║  ✅ 安全评分      ║
║     92/100        ║
║                   ║
║  Agents │ 严重问题 ║
║    3    │    0    ║
║                   ║
║  今日成本          ║
║  $0.00            ║
║                   ║
║  每10秒自动更新    ║
╚═══════════════════╝
```

- 可以拖动到任意位置
- Always-on-top（始终置顶）
- 点击 X 关闭（不会关闭主应用）

### 系统托盘

最小化窗口后，应用会在系统托盘运行：

**macOS**: 右上角菜单栏
**Windows**: 右下角任务栏

**右键菜单**:
- Show Dashboard - 显示主窗口
- Toggle Floating Widget - 开关浮窗
- Scan Now - 立即扫描
- Quit - 退出应用

---

## 🔧 常见操作

### 手动扫描

点击右上角 "Scan Now" 按钮

### 修复问题

1. 找到有问题的 Agent 卡片
2. 点击 "Fix X Issues" 按钮
3. 等待修复完成
4. 自动重新扫描

### 停止/重启 Agent

1. 找到运行中的 Agent
2. 点击 "Stop" 或 "Restart" 按钮

### 查看 Token 统计

1. 点击 "Token Usage & Cost" 标签
2. 查看日/周/月成本
3. 查看每个 Agent 的详细分解

---

## ❌ 常见错误

### 错误 1: `npm error code ENOENT`

**原因**: 你在错误的目录！

**解决方案**:
```bash
# 确保在 desktop 目录
cd ~/Desktop/AI写作空间/agentguard/desktop

# 验证
ls package.json  # 应该存在
```

### 错误 2: `Cannot find module`

**原因**: 依赖未安装

**解决方案**:
```bash
npm install
```

### 错误 3: 窗口打开但是空白

**原因**: 开发服务器未启动

**解决方案**:
```bash
# 停止当前进程 (Ctrl+C)
# 重新运行
npm run dev
```

### 错误 4: 端口 3000 被占用

**解决方案**:
```bash
# 杀掉占用端口的进程
lsof -ti:3000 | xargs kill -9

# 或修改端口 (编辑 vite.config.ts)
server: {
  port: 3001  # 改为其他端口
}
```

---

## 📊 开发模式功能

### 热更新

修改代码后:
- **React 组件**: 即时更新（无需刷新）
- **主进程代码**: 自动重启 Electron

### DevTools

开发模式自动打开 Chrome DevTools，可以:
- 查看 Console 日志
- 调试 React 组件
- 查看网络请求
- 性能分析

### 错误提示

开发模式会显示详细的错误堆栈，帮助快速定位问题。

---

## 🏗️ 构建生产版本

### 步骤 1: 构建代码

```bash
npm run build
```

会生成:
- `dist/main/` - 编译后的主进程代码
- `dist/renderer/` - 编译后的渲染进程代码

### 步骤 2: 打包应用

```bash
# macOS
npm run package:mac

# Windows
npm run package:win
```

打包后的应用在 `release/` 目录：

**macOS**:
- `AgentGuard-1.0.0.dmg` - 安装器
- `AgentGuard-1.0.0-mac.zip` - 压缩包

**Windows**:
- `AgentGuard Setup 1.0.0.exe` - 安装程序
- `AgentGuard 1.0.0.exe` - 便携版

### 步骤 3: 安装测试

**macOS**:
```bash
open release/AgentGuard-1.0.0.dmg
```

**Windows**:
双击 `AgentGuard Setup 1.0.0.exe`

---

## 🎓 进阶技巧

### 1. 修改扫描间隔

编辑 `src/main/index.ts`:

```typescript
// 改为 30 秒扫描一次
scanInterval = setInterval(() => {
  performScan();
}, 30000);  // 30秒 = 30000毫秒
```

### 2. 自定义窗口大小

编辑 `src/main/index.ts`:

```typescript
mainWindow = new BrowserWindow({
  width: 1400,   // 改为更宽
  height: 900,   // 改为更高
  // ...
});
```

### 3. 添加键盘快捷键

编辑 `src/main/index.ts`:

```typescript
import { globalShortcut } from 'electron';

app.whenReady().then(() => {
  // Cmd+Shift+S 触发扫描
  globalShortcut.register('CommandOrControl+Shift+S', () => {
    performScan();
  });
});
```

### 4. 自定义颜色主题

编辑 `src/renderer/index.css` 中的 CSS 变量：

```css
:root {
  --primary: 262 83% 58%;  /* 紫色 */
  --background: 0 0% 100%; /* 白色背景 */
  /* 修改为你喜欢的颜色 */
}
```

---

## 📝 下一步

1. **熟悉界面** - 探索所有功能
2. **查看文档** - 阅读 [desktop/README.md](desktop/README.md)
3. **自定义配置** - 根据需求调整
4. **打包分发** - 构建生产版本

---

## 🆘 获取帮助

遇到问题？

1. 查看 [desktop/README.md](desktop/README.md) 详细文档
2. 查看 [GitHub Issues](https://github.com/wanghui2323/agentguard/issues)
3. 查看开发日志: `V1.0.0_PROGRESS.md`

---

**祝你使用愉快！ 🎉**

AgentGuard Desktop v1.0.0 - The security control center for local AI agents
