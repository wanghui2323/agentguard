# 🎉 AgentGuard Desktop v0.4.0 Release Notes

**发布日期**: 2026-03-09
**版本**: Desktop v0.4.0 Beta

---

## 🚀 重大更新

### 全新桌面悬浮球监控应用

AgentGuard Desktop v0.4.0 带来了全新的**跨平台桌面监控体验**，通过精美的悬浮球设计，实时追踪你的 AI Agent 安全状态和 Token 使用情况。

---

## ✨ 新功能

### 1. ⚛️ 原子图标悬浮球

- **设计灵感**: 模仿 Electron 的原子结构
- **视觉效果**:
  - 墨黑色渐变背景 (#2d3748 → #1a202c)
  - 3条旋转的电子轨道
  - 1个动态旋转的电子
- **交互特性**:
  - 可拖拽到屏幕任意位置
  - 置顶显示，不会被其他窗口遮挡
  - 点击打开/关闭面板

### 2. 📊 两级展开面板

#### 简洁模式 (280px)
- **4个关键指标卡片**:
  - 💰 今日消耗
  - 📊 本月消耗
  - 🤖 活跃Agents
  - 🔒 安全评分
- **Agent状态摘要**
- **展开按钮** - 切换到完整视图

#### 完整模式 (520px)
- **Token使用详情**:
  - Claude Code (VS Code) 详细统计
  - Cursor 详细统计
  - 今日/本月Token数量和成本
- **快捷操作**:
  - 🎛️ 打开仪表盘
  - 🔍 执行扫描

### 3. 💰 智能Token追踪

支持多种数据源，自动或手动配置：

| Agent | 数据来源 | 自动/手动 |
|-------|---------|----------|
| **Claude Code (CLI)** | `~/.anthropic/stats-cache.json` | ✅ 自动 |
| **Cursor** | SQLite 数据库 | ✅ 自动 |
| **Claude Code (VS Code)** | `~/.agentguard/manual-stats.json` | 📝 手动 |

**成本计算**:
- 基于最新 Claude API 定价（2026年3月）
- 支持 Opus 4、Sonnet 3.5、Haiku 3.5
- 默认假设 60% 输入 / 40% 输出比例

### 4. 🔔 状态告警系统

悬浮球颜色随安全状态动态变化：

| 状态 | 颜色 | 触发条件 | 动画效果 |
|------|------|---------|---------|
| 🟢 **正常** | 墨黑色 | 评分>70, 问题<3 | 电子正常旋转(3s) |
| 🟡 **警告** | 橙黄色 | 评分50-70, 问题3-4 | 电子减速(6s) |
| 🔴 **严重** | 红色 | 评分<50, 问题≥5 | 脉冲动画+加速(1s) |
| ⚫ **离线** | 深灰色 | 服务不可用 | 动画停止 |

### 5. 🌍 跨平台支持

| 平台 | 支持 | 测试状态 |
|------|------|---------|
| **macOS** | ✅ 完整 | ✅ 已测试 (macOS 14+) |
| **Windows** | ✅ 完整 | 🚧 待社区测试 |
| **Linux** | 🟡 部分 | 🚧 待社区测试 |

---

## 🐛 Bug 修复

### 严重问题修复

1. **"Object has been destroyed" 崩溃**
   - **问题**: 点击悬浮球导致 Electron 崩溃
   - **原因**: 定时器向已销毁的 webContents 发送消息
   - **修复**: 添加 `isDestroyed()` 检查和安全包装函数

2. **Token显示$0.00**
   - **问题**: 所有Token统计显示为0
   - **原因**:
     - VS Code Claude 插件无统计文件
     - Cursor SQLite 数据库未读取
     - stats-cache.json 数据过期
   - **修复**:
     - 实现手动配置系统
     - 添加 Cursor SQLite 读取
     - 优先级机制（手动 > SQLite > 缓存）

3. **定时器内存泄漏**
   - **问题**: 长时间运行后内存占用持续增长
   - **原因**: 定时器未正确清理
   - **修复**: 在窗口销毁时清理所有定时器

4. **安全评分误报**
   - **问题**: 1-2个问题就显示红色严重告警
   - **原因**: 阈值设置过低
   - **修复**: 调整为5+问题才触发严重告警

---

## 📚 文档更新

### 新增文档

1. **[DESKTOP_WIDGET.md](docs/DESKTOP_WIDGET.md)** - 完整的桌面应用使用指南
   - 快速开始
   - 使用指南
   - Token配置
   - 故障排查
   - 跨平台兼容性
   - 开发指南

2. **[HOW_TO_UPDATE_MANUAL_STATS.md](HOW_TO_UPDATE_MANUAL_STATS.md)** - 手动Token配置教程

### 更新文档

1. **README.md**
   - 添加"桌面悬浮球"作为推荐使用方式
   - 更新版本号为 Desktop v0.4.0
   - 添加跨平台支持说明

---

## 🎯 快速开始

### 安装

```bash
# 克隆仓库
git clone https://github.com/wanghui2323/agentguard.git
cd agentguard

# 安装依赖
npm install
```

### 启动桌面应用

```bash
npm run desktop
```

### 配置 VS Code Claude Token 追踪

```bash
# 创建配置文件
mkdir -p ~/.agentguard
nano ~/.agentguard/manual-stats.json
```

添加以下内容：
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

---

## ⚠️ 已知问题

### macOS

- **GPU 警告**: 启动时可能出现 GPU 相关错误日志（可忽略）
  ```
  ERROR:command_buffer_proxy_impl.cc GPU state invalid
  ERROR:gpu_process_host.cc GPU process exited unexpectedly
  ```
  这是 Electron 在某些 macOS 版本的已知问题，不影响功能。

### Windows & Linux

- **未充分测试**: 欢迎社区测试反馈
- **透明效果** (Linux): 需要桌面环境支持 compositor

---

## 🔮 未来计划

### v0.5.0 (计划中)

- [ ] Windows/Linux 平台充分测试
- [ ] 悬浮球位置持久化保存
- [ ] 自定义主题和颜色
- [ ] 更多 Token 数据源（OpenAI, Gemini）
- [ ] 桌面通知（严重告警）
- [ ] 快捷键支持

### v1.0.0 (长期)

- [ ] 打包为独立应用（.app, .exe, .AppImage）
- [ ] 自动更新功能
- [ ] 多语言支持（English, 日本語）
- [ ] 云端数据同步（可选）

---

## 🤝 贡献

欢迎贡献代码、报告问题或提出建议！

- 报告 Bug: [GitHub Issues](https://github.com/wanghui2323/agentguard/issues)
- 功能建议: [GitHub Discussions](https://github.com/wanghui2323/agentguard/discussions)
- 提交PR: [Contributing Guide](CONTRIBUTING.md)

---

## 🙏 致谢

感谢所有测试和反馈的用户！

特别感谢：
- Electron 团队提供的跨平台框架
- Anthropic 的 Claude API
- 开源社区的支持

---

## 📄 许可证

MIT License - 详见 [LICENSE](LICENSE)

---

**下载最新版本**: [GitHub Releases](https://github.com/wanghui2323/agentguard/releases/tag/v0.4.0)

**使用文档**: [Desktop Widget Guide](docs/DESKTOP_WIDGET.md)

**问题反馈**: [Report Issue](https://github.com/wanghui2323/agentguard/issues/new)
