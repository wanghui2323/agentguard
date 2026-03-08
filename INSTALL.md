# 📦 AgentGuard 安装指南

## ⚠️ 重要提示

**AgentGuard 目前处于开发阶段，还未发布到 npm 仓库。**

❌ 以下命令**暂时无法使用**：
```bash
npm install -g agentguard  # ← 这个不行！
```

✅ 请使用以下方式安装和使用：

---

## 方法 1: 直接使用本地源码（最简单）

如果你已经有项目代码：

```bash
# 进入项目目录
cd /Users/wanghui/Desktop/AI写作空间/agentguard

# 安装依赖（如果还没安装）
npm install

# 直接使用 CLI
npx tsx src/cli/index.ts scan
npx tsx src/cli/index.ts fix openclaw
npx tsx src/cli/index.ts status
```

---

## 方法 2: 从 GitHub 克隆

如果你是第一次使用：

```bash
# 1. 克隆仓库
git clone https://github.com/wanghui2323/agentguard.git

# 2. 进入目录
cd agentguard

# 3. 安装依赖
npm install

# 4. 查看帮助
npx tsx src/cli/index.ts --help

# 5. 开始使用
npx tsx src/cli/index.ts scan
```

---

## 方法 3: 创建命令别名（推荐）

为了方便使用，可以在 shell 配置文件中添加别名：

### 对于 zsh (macOS 默认):

```bash
# 编辑 ~/.zshrc
echo 'alias agentguard="npx tsx /Users/wanghui/Desktop/AI写作空间/agentguard/src/cli/index.ts"' >> ~/.zshrc

# 重新加载配置
source ~/.zshrc

# 现在可以这样使用
agentguard scan
agentguard fix openclaw
agentguard status
```

### 对于 bash:

```bash
# 编辑 ~/.bash_profile 或 ~/.bashrc
echo 'alias agentguard="npx tsx /Users/wanghui/Desktop/AI写作空间/agentguard/src/cli/index.ts"' >> ~/.bash_profile

# 重新加载配置
source ~/.bash_profile

# 使用
agentguard scan
```

---

## 可用命令

安装完成后，你可以使用以下命令：

### 查看帮助
```bash
npx tsx src/cli/index.ts --help
# 或
agentguard --help  # (如果设置了别名)
```

### 扫描所有 AI Agents
```bash
npx tsx src/cli/index.ts scan
```

输出示例：
```
╔══════════════════════════════════════════════════════╗
║          AgentGuard - AI Agent 安全扫描报告          ║
╠══════════════════════════════════════════════════════╣
║  检测到 1 个 AI Agents                                ║
║  总体安全评分: 45/100 🟠                              ║
╠══════════════════════════════════════════════════════╣
║  [openclaw] OpenClaw                    评分: 45/100 🟠
║      状态: ● 运行中 (PID 12345)
║      发现 6 个问题 (3严重 2高危 1中危)
╚══════════════════════════════════════════════════════╝
```

### 修复安全问题
```bash
# 修复所有 Agents
npx tsx src/cli/index.ts fix

# 修复特定 Agent
npx tsx src/cli/index.ts fix openclaw
```

### 查看运行状态
```bash
npx tsx src/cli/index.ts status
```

### 停止 Agent
```bash
npx tsx src/cli/index.ts stop openclaw
```

### 重启 Agent
```bash
npx tsx src/cli/index.ts restart openclaw
```

---

## 查看 Web UI（可视化界面）

虽然 Web UI 后端还在开发中，但你可以打开独立的 Web UI 页面查看项目信息：

```bash
# macOS
open /Users/wanghui/Desktop/AI写作空间/agentguard/web/standalone.html

# 或者在浏览器中打开
file:///Users/wanghui/Desktop/AI写作空间/agentguard/web/standalone.html
```

---

## 常见问题

### Q1: 为什么 `npm install -g agentguard` 不行？

**A**: AgentGuard 还在开发中，暂未发布到 npm 仓库。预计 v0.2.0 正式版会发布到 npm。

### Q2: 如何更新到最新版？

**A**: 如果你是从 GitHub 克隆的：
```bash
cd agentguard
git pull origin main
npm install
```

### Q3: 能否将项目安装到 `/usr/local/bin`？

**A**: 可以，但需要先构建：
```bash
cd agentguard
npm run build
npm link  # 全局链接
agentguard --version
```

**注意**：当前版本构建可能有问题，建议使用 `npx tsx` 方式。

### Q4: 我没有 tsx，如何安装？

**A**: 安装 tsx：
```bash
npm install -g tsx
```

或者使用项目本地的 tsx：
```bash
npm install  # 会自动安装 tsx 到 node_modules
```

### Q5: 提示找不到 OpenClaw？

**A**:
1. 确保 OpenClaw 正在运行
2. 检查配置文件路径：`~/.openclaw/openclaw.json`
3. 尝试手动指定配置路径（未来版本支持）

---

## 开发计划

- **v0.1.0** (当前): OpenClaw 支持
- **v0.2.0** (1个月内): Claude Desktop + Cursor 支持，发布到 npm
- **v0.3.0** (2个月内): Token 统计 + 报告导出
- **v1.0.0** (6个月内): GUI 桌面应用 + 插件市场

---

## 需要帮助？

- 🐛 [提交 Issue](https://github.com/wanghui2323/agentguard/issues)
- 💬 [讨论功能](https://github.com/wanghui2323/agentguard/discussions)
- 📧 Email: support@agentguard.dev

---

**祝使用愉快！** 🎉

如果 AgentGuard 对你有帮助，请给我们 [Star ⭐](https://github.com/wanghui2323/agentguard)
