# 🖥️ AgentGuard Desktop v1.0.0

**AgentGuard Desktop** 是 AgentGuard 的桌面应用版本，提供实时监控、可视化 Dashboard 和浮窗小部件。

---

## ✨ 功能特性

### 🎯 核心功能
- **实时监控** - 每 10 秒自动扫描所有 AI Agent
- **可视化 Dashboard** - 完整的安全分析和 Token 统计界面
- **浮窗小部件** - Always-on-top 的紧凑监控窗口
- **系统托盘** - 最小化到系统托盘，快速访问
- **一键修复** - 自动修复可修复的安全问题
- **Agent 控制** - 停止/重启 AI Agent

### 📊 Dashboard 界面
- **统计概览**
  - 安全评分（带仪表盘可视化）
  - 活跃 Agent 数量
  - 严重问题统计
  - 今日成本显示
- **安全分析**
  - 每个 Agent 的详细安全评分
  - 问题列表和严重程度
  - 自动修复建议
- **Token 统计**
  - 日/周/月成本统计
  - 预算追踪（带进度条）
  - 每个 Agent 的详细分解

### 🪟 浮窗小部件
- 320x200 紧凑设计
- Always-on-top，始终可见
- 可拖动到任意位置
- 实时显示关键指标

---

## 🚀 快速开始

### 1. 安装依赖

```bash
cd desktop
npm install
```

### 2. 开发模式运行

```bash
npm run dev
```

这会同时启动：
- Electron 主进程（自动重载）
- Vite 开发服务器（热更新）

### 3. 构建应用

```bash
npm run build
```

### 4. 打包应用

```bash
# macOS
npm run package:mac

# Windows
npm run package:win
```

打包后的应用会生成在 `release/` 目录。

---

## 📁 项目结构

```
desktop/
├── package.json              # 依赖和构建配置
├── tsconfig.json             # TypeScript 配置
├── tsconfig.main.json        # 主进程 TS 配置
├── vite.config.ts            # Vite 构建配置
├── tailwind.config.js        # Tailwind CSS 配置
└── src/
    ├── main/                 # Electron 主进程
    │   ├── index.ts          # 主进程入口，窗口管理
    │   └── preload.ts        # IPC 安全桥接
    └── renderer/             # React 渲染进程
        ├── index.html        # Dashboard 入口
        ├── main.tsx          # Dashboard React 入口
        ├── floating.html     # 浮窗入口
        ├── floating.tsx      # 浮窗 React 入口
        ├── App.tsx           # 主应用组件
        ├── index.css         # 全局样式
        └── components/       # React 组件
            ├── Dashboard.tsx        # 主仪表盘
            ├── AgentCard.tsx        # Agent 卡片
            ├── TokenStats.tsx       # Token 统计
            ├── FloatingWidget.tsx   # 浮窗组件
            ├── ScoreGauge.tsx       # 分数仪表盘
            └── IssueItem.tsx        # 问题项展示
```

---

## 🛠️ 技术栈

- **Electron 28** - 跨平台桌面应用框架
- **React 18** - UI 框架
- **TypeScript 5** - 类型安全
- **Vite 5** - 快速构建工具
- **Tailwind CSS 3** - 样式系统
- **AgentGuard Core** - 复用 CLI 版本的扫描引擎

---

## 🎮 使用指南

### Dashboard 界面

1. **查看安全概览**
   - 顶部显示 4 个关键指标卡片
   - 点击 "Scan Now" 手动触发扫描

2. **管理 Agent**
   - 查看每个 Agent 的详细信息
   - 点击 "Fix" 自动修复问题
   - 使用 "Stop/Restart" 控制 Agent

3. **查看 Token 统计**
   - 切换到 "Token Usage & Cost" 标签
   - 查看成本摘要和预算进度
   - 查看每个 Agent 的详细分解

### 浮窗小部件

1. **显示/隐藏**
   - Dashboard 顶部点击 "Toggle Widget"
   - 或从系统托盘右键菜单选择

2. **拖动位置**
   - 鼠标拖动紫色标题栏
   - 窗口会记住位置

3. **关闭浮窗**
   - 点击右上角 X 按钮
   - 不会关闭主应用

### 系统托盘

1. **左键点击** - 显示 Dashboard
2. **右键菜单**:
   - Show Dashboard - 显示主窗口
   - Toggle Floating Widget - 切换浮窗
   - Scan Now - 立即扫描
   - Quit - 退出应用

---

## 📝 开发说明

### 调试

开发模式下会自动打开 DevTools：

```bash
npm run dev
```

### 热更新

- **主进程**: 使用 tsx watch，修改后自动重启
- **渲染进程**: 使用 Vite HMR，修改后即时更新

### 构建优化

```bash
# 仅构建主进程
npm run build:main

# 仅构建渲染进程
npm run build:renderer
```

---

## 🔧 配置

### 修改窗口大小

编辑 `src/main/index.ts`:

```typescript
// Dashboard 窗口
mainWindow = new BrowserWindow({
  width: 1200,  // 修改宽度
  height: 800,  // 修改高度
  // ...
});

// 浮窗
floatingWindow = new BrowserWindow({
  width: 320,   // 修改宽度
  height: 200,  // 修改高度
  // ...
});
```

### 修改扫描间隔

编辑 `src/main/index.ts`:

```typescript
// 默认 10 秒
scanInterval = setInterval(() => {
  performScan();
}, 10000);  // 修改为需要的毫秒数
```

### 修改样式

编辑 `src/renderer/index.css` 或组件内的 Tailwind 类名。

---

## 🐛 故障排除

### 问题 1: 无法启动应用

**解决方案**:
```bash
# 清理并重新安装依赖
rm -rf node_modules package-lock.json
npm install
npm run dev
```

### 问题 2: 扫描不工作

**原因**: 可能未正确链接核心模块

**解决方案**:
确保从正确的目录运行，核心模块路径为 `../src/core/scanner.ts`

### 问题 3: 浮窗不显示

**解决方案**:
检查主进程日志，确保 `createFloatingWindow()` 被正确调用。

---

## 📦 打包说明

### macOS

```bash
npm run package:mac
```

生成文件:
- `release/AgentGuard-1.0.0.dmg`
- `release/AgentGuard-1.0.0-mac.zip`

### Windows

```bash
npm run package:win
```

生成文件:
- `release/AgentGuard Setup 1.0.0.exe`
- `release/AgentGuard 1.0.0.exe` (portable)

### 签名和公证

生产发布需要配置代码签名:

```json
// package.json
{
  "build": {
    "mac": {
      "identity": "Developer ID Application: Your Name (XXXXXXXXXX)"
    },
    "win": {
      "certificateFile": "path/to/cert.pfx",
      "certificatePassword": "password"
    }
  }
}
```

---

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

---

## 📄 许可证

MIT License - 详见 [../LICENSE](../LICENSE)

---

## 🔗 相关链接

- [CLI 版本文档](../README.md)
- [GitHub Repository](https://github.com/wanghui2323/agentguard)
- [问题反馈](https://github.com/wanghui2323/agentguard/issues)

---

**AgentGuard Desktop v1.0.0** - The security control center for local AI agents 🛡️
