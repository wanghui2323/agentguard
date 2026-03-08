# 📋 Changelog

All notable changes to AgentGuard will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

### Planned for v0.3.0 (1-2 months)
- Token 使用统计功能
- 报告导出 (PDF/HTML)
- GitHub Copilot 支持
- 豆包 (Doubao) 支持
- 单元测试覆盖率 > 80%

---

## [0.2.0] - 2026-03-08

### ✨ 新增功能 (Added)
- 🔒 **Claude Code 深度安全检查** (4 项)
  - MCP Servers 权限审计（检测 filesystem, network, shell 等高风险权限）
  - 配置文件权限检查（world-writable 检测）
  - API Key 泄露检查（明文 API Key 扫描）
  - Computer Use 模式检查（鼠标键盘控制能力）
- 🔒 **Cursor IDE 深度安全检查** (4 项)
  - Workspace Trust 检查（不安全目录检测：/tmp, Downloads）
  - 扩展安全检查（非官方扩展识别）
  - 索引目录范围检查（~/.ssh/, /etc/ 等敏感目录）
  - 端口绑定检查（外部可访问端口检测）
- 🛠️ **自动修复增强**
  - Claude Code 配置文件权限修复
  - Cursor unsafe trusted folders 提示（需用户确认）
- 🎨 **用户体验优化**
  - 扫描进度提示（ora spinner）
  - `--verbose` 详细模式（逐步显示扫描过程）
  - 并行扫描（性能提升 53%：0.15s → 0.07s）

### 🐛 修复 (Fixed)
- ✅ **构建问题** - 删除 server 模块，修复 TypeScript 编译错误
- ✅ **接口实现** - ClaudeDetector 和 CursorDetector 实现完整的 AgentDetector 接口
  - `getProcessInfo()` - 进程信息获取
  - `auditPermissions()` - 权限风险审计
  - `auditNetwork()` - 网络连接审计
  - `canControl()` - 控制能力检测

### 📈 性能改进 (Performance)
- ⚡ **并行扫描** - 从串行改为并行执行，扫描速度提升 53%
- 💾 **内存优化** - 内存占用从 ~50MB 降至 ~45MB

### 📝 文档更新 (Documentation)
- 📋 完整的 v0.2.0 测试报告 ([TEST_RESULT_v0.2.0.md](TEST_RESULT_v0.2.0.md))
- 🗺️ 产品路线图 ([ROADMAP.md](ROADMAP.md))
- 📋 版本发布检查清单 ([RELEASE_CHECKLIST.md](RELEASE_CHECKLIST.md))

### 🔧 技术细节 (Technical)
- 移除 `src/server/` 目录和相关 Web UI 代码
- 移除 package.json 中的 `server` 和 `web` 脚本
- Scanner.scanAll() 改用 Promise.all() 实现并行扫描
- CLI 增加 ora spinner 进度提示
- CLI 增加 --verbose 选项支持详细输出

### ⚠️ 已知限制 (Known Limitations)
- Claude Code 和 Cursor 的 `auditNetwork()` 返回空数组（需要 root 权限）
- Claude Code 和 Cursor 的 `canControl()` 返回 false（VSCode 扩展和桌面应用无法直接控制）

### 📦 发布准备 (Release Preparation)
- ✅ npm run build 成功
- ✅ 所有功能测试通过（17/17）
- ✅ 性能测试通过（0.07s 扫描时间）
- 🔄 待发布到 npm registry
- 🔄 待创建 GitHub Release

---

## [0.1.0] - 2026-03-08

### ✨ 新增功能 (Added)
- 🎯 核心扫描引擎 (`SecurityScanner`)
- 🔍 OpenClaw 检测器 (`OpenClawDetector`)
  - 8 项安全检查 (Node.js 版本、API 密钥、配置权限等)
  - 6 项自动修复功能
  - 完整的进程状态检测
- 🔍 Claude Code 检测器 (`ClaudeDetector`)
  - 进程识别 (`claude --output-format stream-json`)
  - 配置文件检测 (`~/.claude/settings.json`)
  - 基础状态监控
- 🔍 Cursor IDE 检测器 (`CursorDetector`)
  - 进程识别 (`Cursor Helper`)
  - 配置文件检测 (`~/.cursor/mcp.json`)
  - 基础状态监控
- 🎨 CLI 工具
  - `scan` - 全面安全扫描
  - `status` - Agent 状态查看
  - `fix` - 自动修复问题 (仅 OpenClaw)
  - `--json` - JSON 格式输出
  - `--help` - 帮助信息
- 📊 安全评分系统 (0-100 分，5 个等级)
- 🎨 精美的终端输出界面 (使用 chalk, boxen, ora)

### 📝 文档 (Documentation)
- 中英文 README ([README.md](README.md), [README_EN.md](README_EN.md))
- 快速开始指南 ([QUICKSTART.md](QUICKSTART.md))
- npm 发布指南 ([PUBLISH_TO_NPM.md](PUBLISH_TO_NPM.md))
- 贡献指南 ([CONTRIBUTING.md](CONTRIBUTING.md))
- 完整测试报告 ([LATEST_TEST_RESULT.md](LATEST_TEST_RESULT.md))

### 🧪 测试结果 (Testing)
- ✅ 成功检测 3 种 AI Agents (OpenClaw, Claude Code, Cursor)
- ✅ 总体安全评分: 92/100
- ✅ 扫描性能: ~0.15 秒
- ✅ 内存占用: ~50MB
- ✅ 测试环境: macOS (Darwin 23.4.0), Node.js v20.19.6

### ⚠️ 已知限制 (Known Limitations)
- Claude Code 和 Cursor 仅支持基础检测，深度安全检查待实现
- Web UI 不可用 (构建失败: `src/server/index.ts` 缺少依赖)
- 尚未发布到 npm registry
- 仅支持从源码安装

### 🔧 技术栈 (Technical)
- TypeScript 5.3.0
- Node.js >= 18.0.0
- 依赖: chalk, commander, yaml, ps-node, ora, boxen, table

---

## 版本号规则

- **主版本号 (Major)**: 重大架构变更或不兼容更新
- **次版本号 (Minor)**: 新功能添加，保持向后兼容
- **修订号 (Patch)**: Bug 修复和小改进

---

## 链接

- [GitHub Repository](https://github.com/wanghui2323/agentguard)
- [Issues](https://github.com/wanghui2323/agentguard/issues)
- [Releases](https://github.com/wanghui2323/agentguard/releases)

---

**格式说明**:
- `Added` - 新增功能
- `Changed` - 现有功能的变更
- `Deprecated` - 即将废弃的功能
- `Removed` - 已删除的功能
- `Fixed` - Bug 修复
- `Security` - 安全相关的修复
