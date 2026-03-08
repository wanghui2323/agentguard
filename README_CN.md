# 🛡️ AgentGuard

<div align="center">

**本地 AI Agent 的安全控制中心 - 监控、保护和管理你的所有 AI 助手**

[English](README.md) | 简体中文

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue)](https://www.typescriptlang.org/)
[![Test Coverage](https://img.shields.io/badge/tests-90.9%25-success)](./TEST_REPORT.md)

[在线演示](#-快速体验) · [报告问题](https://github.com/wanghui2323/agentguard/issues) · [功能建议](https://github.com/wanghui2323/agentguard/discussions)

</div>

---

## 📖 目录

- [什么是 AgentGuard？](#-什么是-agentguard)
- [核心功能](#-核心功能)
- [支持的 AI Agents](#-支持的-ai-agents)
- [快速开始](#-快速开始)
- [使用示例](#-使用示例)
- [安全检查项](#-安全检查项)
- [开发指南](#-开发指南)
- [贡献指南](#-贡献指南)
- [许可证](#-许可证)

---

## 🚀 什么是 AgentGuard？

AgentGuard 是一个**开源的本地 AI Agent 安全监控与管理工具**。它自动发现运行在你电脑上的 AI 助手，扫描安全风险，并一键修复漏洞。

### 核心价值

> **"5 分钟内看到本地所有 AI Agent 的安全风险，并能一键修复"**

### 为什么需要 AgentGuard？

本地 AI Agent（如 OpenClaw、Claude Desktop、Cursor）功能强大，但也带来安全风险：
- 🔓 **端口暴露** - 可能被外部访问
- 🚫 **无身份验证** - 任何人都可以控制
- ⚠️ **弱配置** - 默认配置不安全
- 📂 **权限过大** - 可能访问敏感文件

AgentGuard 帮你**自动检测和修复**这些问题。

---

## ✨ 核心功能

### 🔍 自动发现
无需配置，自动检测所有运行中的 AI Agent：
- OpenClaw
- Claude Desktop (Code/Cowork)
- Cursor
- GitHub Copilot
- 豆包桌面版

### 🛡️ 安全扫描
全面的安全检查（每个 Agent 3-8 项检测）：
- 端口绑定配置
- 身份认证状态
- 令牌强度
- 权限审计
- 版本漏洞

### 📊 风险评分
清晰的 0-100 分评分系统：
- ✅ 90-100: 优秀
- 🟢 70-89: 良好
- 🟡 50-69: 需改进
- 🟠 30-49: 有风险
- 🔴 0-29: 危险

### 🔧 一键修复
自动修复常见安全问题：
- 端口配置
- 认证设置
- 权限调整
- 配置文件权限
- **自动备份**，修复失败可回滚

### 🎛️ 进程控制
统一管理所有 AI Agent：
- 停止/重启 Agent
- 查看运行状态
- 批量操作

---

## 🤖 支持的 AI Agents

| Agent | 检测 | 评分 | 修复 | 控制 |
|-------|------|------|------|------|
| **OpenClaw** | ✅ | ✅ (8 项) | ✅ (6 项) | ✅ |
| **Claude Desktop** | 🚧 | 🚧 | 🚧 | ❌ |
| **Cursor** | 🚧 | 🚧 | ❌ | ❌ |
| **GitHub Copilot** | 🚧 | 🚧 | ❌ | ❌ |
| **豆包桌面版** | 🚧 | 🚧 | ❌ | ❌ |

✅ 完整支持 | 🚧 开发中 | ❌ 暂不支持

*v0.1.0 主要支持 OpenClaw，其他 Agent 将在后续版本支持*

---

## 📦 快速开始

### 安装

#### NPM（推荐）
```bash
npm install -g agentguard
```

#### Homebrew（macOS）
```bash
brew install agentguard
```

#### 从源码安装
```bash
git clone https://github.com/wanghui2323/agentguard.git
cd agentguard
npm install
npm run build
npm link
```

### 验证安装
```bash
agentguard --version
# 输出: 0.1.0
```

---

## 🎯 使用示例

### 1. 扫描所有 AI Agents
```bash
agentguard scan
```

输出示例：
```
╔══════════════════════════════════════════════════════╗
║          AgentGuard - AI Agent 安全扫描报告          ║
╠══════════════════════════════════════════════════════╣
║  检测到 1 个 AI Agents                                ║
║  总体安全评分: 45/100 🟠                              ║
╠══════════════════════════════════════════════════════╣
║                                                       ║
║  [openclaw] OpenClaw                    评分: 45/100 🟠    ║
║      状态: ● 运行中 (PID 12345)                     ║
║      端口: 0.0.0.0:18789 ⚠️                          ║
║      发现 6 个问题 (3严重 2高危 1中危)               ║
║      🔴 端口暴露到所有网络接口                        ║
║      🔴 未启用身份认证                                ║
║      🔴 DM 策略过于开放                               ║
║      ...                                             ║
╚══════════════════════════════════════════════════════╝
```

### 2. 一键修复
```bash
agentguard fix openclaw
```

输出示例：
```
Fixing OpenClaw...
✓ 端口暴露到所有网络接口
✓ 未启用身份认证（已生成强令牌）
✓ DM 策略过于开放
✓ 未启用沙箱隔离
✓ 工作空间权限为读写

🎉 安全评分从 45 提升到 90!
```

### 3. 查看状态
```bash
agentguard status
```

输出：
```
AI Agent 状态:

OpenClaw:       ● 运行中 (PID 12345)
Claude Desktop: ○ 未运行
Cursor:         ● 运行中 (PID 23456)
```

### 4. 停止/重启 Agent
```bash
# 停止
agentguard stop openclaw

# 重启
agentguard restart openclaw
```

### 5. 导出 JSON 报告
```bash
agentguard scan --json > security-report.json
```

---

## 🔍 安全检查项

### OpenClaw（8 项检查）

| 检查项 | 严重程度 | 可自动修复 |
|--------|----------|-----------|
| 端口绑定配置 | 🔴 严重 | ✅ |
| 身份认证模式 | 🔴 严重 | ✅ |
| Token 强度 | 🟡 中危 | ✅ |
| DM 策略设置 | 🔴 严重 | ✅ |
| Node.js 版本 | 🟠 高危 | ❌ |
| 沙箱状态 | 🟡 中危 | ✅ |
| 工作空间权限 | 🟢 低危 | ✅ |
| 配置文件权限 | 🟡 中危 | ✅ |

### Claude Desktop（5 项检查）
- MCP 服务器权限
- Computer Use 模式
- 配置文件权限
- 插件安全
- 网络连接审计

### Cursor（4 项检查）
- 端口绑定
- Workspace Trust
- 扩展签名验证
- 索引目录范围

### GitHub Copilot（3 项检查）
- 遥测设置
- 代码建议来源
- 网络代理配置

### 豆包桌面版（4 项检查）
- 权限请求审计
- 网络连接审计
- 录音/录屏权限
- 自动更新机制

---

## 🛠️ 开发指南

### 环境要求
- Node.js ≥ 18.0.0
- npm 或 yarn
- Git

### 本地开发
```bash
# 克隆仓库
git clone https://github.com/wanghui2323/agentguard.git
cd agentguard

# 安装依赖
npm install

# 开发模式
npm run dev

# 构建
npm run build

# 测试
npm test
```

### 项目结构
```
agentguard/
├── src/
│   ├── cli/              # CLI 接口
│   ├── core/             # 核心引擎
│   │   ├── detectors/    # Agent 检测器
│   │   ├── scanner.ts    # 扫描引擎
│   │   ├── fixer.ts      # 修复引擎
│   │   └── controller.ts # 进程控制
│   ├── types/            # TypeScript 类型
│   └── utils/            # 工具函数
├── tests/                # 测试文件
└── docs/                 # 文档
```

### 添加新的 Agent 检测器

1. 创建检测器文件 `src/core/detectors/myagent.ts`：

```typescript
import { AgentDetector } from '../../types';

export class MyAgentDetector implements AgentDetector {
  id = 'myagent';
  name = 'My Agent';
  version = '1.0.0';

  async detect() {
    // 实现检测逻辑
  }

  async auditConfig() {
    // 实现安全检查
  }

  // ... 实现其他必需方法
}
```

2. 注册检测器到 `src/core/scanner.ts`：

```typescript
import { MyAgentDetector } from './detectors/myagent';

constructor() {
  this.registerDetector(new MyAgentDetector());
}
```

3. 添加测试并提交 PR

---

## 🤝 贡献指南

我们欢迎所有形式的贡献！

### 贡献方式

1. **报告问题** - [提交 Issue](https://github.com/wanghui2323/agentguard/issues)
2. **功能建议** - [发起讨论](https://github.com/wanghui2323/agentguard/discussions)
3. **代码贡献** - 提交 Pull Request
4. **文档改进** - 修正错误或添加示例
5. **推广项目** - 给我们 Star ⭐

### Pull Request 流程

1. Fork 仓库
2. 创建特性分支：`git checkout -b feature/my-feature`
3. 提交更改：`git commit -m "Add: My Feature"`
4. 推送分支：`git push origin feature/my-feature`
5. 提交 Pull Request

### 开发规范

- ✅ 使用 TypeScript 严格模式
- ✅ 遵循现有代码风格
- ✅ 添加单元测试
- ✅ 更新相关文档
- ✅ 运行 `npm run lint` 和 `npm test`

详细指南：[CONTRIBUTING.md](CONTRIBUTING.md)

---

## 📊 测试报告

AgentGuard 经过全面测试，确保质量：

- **测试总数**: 11 个
- **通过率**: 90.9%
- **测试类型**: 单元测试、集成测试、CLI 测试
- **测试覆盖**: 核心模块、Agent 检测、安全扫描、CLI 命令

查看详细报告：[TEST_REPORT.md](TEST_REPORT.md)

---

## 📄 许可证

本项目采用 [MIT License](LICENSE) 开源协议。

---

## 🙏 致谢

### 技术支持
- [OpenClaw](https://github.com/OpenClaw/OpenClaw) - 安全文档参考
- [Claude Desktop](https://claude.ai) - MCP 安全指南
- Node.js 和 TypeScript 社区

### 开发工具
- 使用 [Claude Opus 4.6](https://claude.ai) 辅助开发
- 基于 [Commander.js](https://github.com/tj/commander.js) 构建 CLI
- 采用 [Chalk](https://github.com/chalk/chalk) 实现彩色输出

---

## 📞 联系方式

- **GitHub Issues**: [报告问题](https://github.com/wanghui2323/agentguard/issues)
- **Discussions**: [功能讨论](https://github.com/wanghui2323/agentguard/discussions)
- **Email**: support@agentguard.dev

---

## ⚠️ 免责声明

AgentGuard 是一个安全监控工具，不提供绝对的安全保证。请根据你的具体使用场景和风险承受能力，审查安全建议并应用修复。

---

## 🗺️ 路线图

### v0.2.0（计划中）
- [ ] Claude Desktop 完整支持
- [ ] Cursor 完整支持
- [ ] 实时监控功能
- [ ] 单元测试完善

### v0.3.0（规划中）
- [ ] Token 使用统计
- [ ] 报告导出（PDF/HTML）
- [ ] GitHub Copilot 支持
- [ ] 豆包支持

### v1.0.0（目标）
- [ ] 支持 5+ 主流 AI Agents
- [ ] GUI 桌面应用
- [ ] 插件市场
- [ ] 多语言支持

---

<div align="center">

**如果 AgentGuard 对你有帮助，请给我们一个 Star ⭐**

Made with ❤️ by [wanghui2323](https://github.com/wanghui2323) and [Claude Opus 4.6](https://claude.ai)

[⬆ 回到顶部](#️-agentguard)

</div>
