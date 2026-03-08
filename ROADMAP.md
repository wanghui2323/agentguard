# 🗺️ AgentGuard 产品路线图

> 从 CLI 工具到桌面安全中心的完整演进计划

---

## 📊 当前状态：v0.1.0（已发布）

### ✅ 已完成功能
- ✅ 核心扫描引擎（SecurityScanner）
- ✅ 3 个 Agent 检测器：OpenClaw, Claude Code, Cursor
- ✅ CLI 工具：scan, status, fix（仅 OpenClaw）
- ✅ 安全评分系统（0-100 分）
- ✅ JSON 导出功能
- ✅ OpenClaw 完整的 8 项安全检查 + 6 项自动修复

### ⚠️ 已知问题
- ⚠️ 构建失败（server 模块缺少依赖）
- ⚠️ Claude Code 和 Cursor 仅基础检测，无深度安全检查
- ⚠️ 未发布到 npm（因构建问题）
- ⚠️ 无 Token 统计功能
- ⚠️ 无桌面应用

### 📈 数据
- 总体安全评分：92/100
- 扫描性能：~0.15 秒
- 内存占用：~50MB

---

## 🎯 v0.2.0：完善 CLI + 深度安全检查（预计 2 周）

> **目标**：修复核心问题，实现完整的安全检查，发布到 npm

### 🔧 核心修复（优先级最高）

#### 1. 修复构建问题 ✅ 必须
- 删除 `src/server/` 目录（Web UI 推迟到桌面应用）
- 删除 package.json 中的 `server` 和 `web` 脚本
- 确保 `npm run build` 成功
- **验收标准**：`npm run build && node dist/cli/index.js scan` 运行正常

#### 2. 实现 Claude Code 深度安全检查 ✅ 核心
- ✅ MCP Servers 权限审计
  - 读取 `~/.claude/settings.json` 中的 mcpServers 配置
  - 检查每个 MCP server 的权限范围
  - 识别高风险权限：filesystem write, network access, shell execution
  - 评分影响：每个高风险权限 -15 分
- ✅ 配置文件权限检查
  - 检查 `~/.claude/settings.json` 文件权限
  - 不应该是全局可写（推荐 600）
  - 评分影响：全局可写 -25 分
- ✅ API Key 泄露检查
  - 扫描配置中是否有明文 API Key
  - 建议使用环境变量
  - 评分影响：明文存储 -40 分（critical）
- ✅ Computer Use 模式检查
  - 检测是否启用了 Computer Use（可以控制鼠标键盘）
  - 评估风险等级
  - 评分影响：info 级别（不扣分，仅提示）
- **验收标准**：Claude Code 显示真实安全评分（不再是虚高的 100 分）

#### 3. 实现 Cursor 深度安全检查 ✅ 核心
- ✅ Workspace Trust 检查
  - 读取 Cursor 的 workspace trust 设置
  - 检测是否信任了不安全的目录（如 /tmp, Downloads）
  - 评分影响：每个不安全目录 -15 分
- ✅ 扩展安全检查
  - 读取 `~/.cursor/extensions/` 目录
  - 检查扩展签名
  - 识别非官方/不受信任的扩展
  - 评分影响：每个不受信任扩展 -25 分
- ✅ 端口绑定检查
  - 检测 Cursor 是否监听外部可访问的端口
  - 避免远程代码执行风险
  - 评分影响：外部端口 -40 分（critical）
- ✅ 索引目录范围检查
  - 检查 Cursor 索引的目录范围
  - 警告如果索引了敏感目录（~/.ssh/, /etc/）
  - 评分影响：每个敏感目录 -15 分
- **验收标准**：Cursor 显示真实安全评分

#### 4. 添加自动修复功能 ✅ 重要
- ✅ Claude Code 自动修复
  - 修复配置文件权限：chmod 600 ~/.claude/settings.json
  - 禁用高风险 MCP server（需用户确认）
- ✅ Cursor 自动修复
  - 取消不安全目录的 Trust
  - 卸载不受信任的扩展（需用户确认）
- **验收标准**：`agentguard fix` 可以修复 Claude 和 Cursor 的问题

### 🎨 用户体验优化

#### 5. 改进扫描进度提示 ✅ 重要
- 使用 ora spinner 显示进度
- 显示耗时统计

#### 6. 添加详细模式 ✅ 有用
- `agentguard scan --verbose` 显示详细扫描过程

#### 7. 并行扫描优化 ✅ 性能
- 改为并行扫描（预计从 0.15s 降到 0.08s）

### 📦 发布准备

#### 8. 发布到 npm ✅ 必须
- 确保构建成功
- 更新 CHANGELOG.md
- 运行 `npm publish`
- 更新 README 安装说明
- **验收标准**：`npm install -g agentguard && agentguard scan` 可用

#### 9. 更新文档 ✅ 必须
- 更新 README.md - 添加 npm 安装方式
- 更新 README_EN.md - 同步英文版
- 更新 CHANGELOG.md - 记录 v0.2.0 变更
- 创建 GitHub Release v0.2.0

### ✅ v0.2.0 验收标准
- [ ] `npm run build` 成功
- [ ] Claude Code 安全检查完整（4 项）
- [ ] Cursor 安全检查完整（4 项）
- [ ] 自动修复功能可用
- [ ] 并行扫描性能提升
- [ ] 发布到 npm 成功
- [ ] 文档完整更新

---

## 🚀 v0.3.0：Token 统计 + 报告导出（预计 3-4 周）

> **目标**：添加成本监控功能，生成专业报告

### 💰 Token 使用统计（核心新功能）

#### 1. 基础 Token 追踪
- 读取各 Agent 的日志文件
- 按日期统计 Token 使用量
- 计算成本（基于各模型价格）

#### 2. Token 统计命令
- `agentguard tokens` 显示使用统计

#### 3. 成本预警
- 设置日/周/月预算
- 超出预算时警告

### 📄 报告导出功能

#### 4. HTML 报告导出
- `agentguard scan --export html report.html`

#### 5. PDF 报告导出
- `agentguard scan --export pdf report.pdf`

#### 6. Markdown 报告
- `agentguard scan --export md report.md`

### 🆕 新 Agent 支持

#### 7. GitHub Copilot 检测器
- 检测 VSCode + Copilot 扩展
- 安全检查：Telemetry 设置、代码分享策略

#### 8. 豆包（Doubao）检测器
- 检测豆包客户端
- 配置路径：待调研

### 🧪 单元测试

#### 9. 添加测试覆盖
- 测试各个 Detector
- 测试评分计算
- 测试 fix 功能
- 测试 Token 统计
- 目标覆盖率 > 80%

### ✅ v0.3.0 验收标准
- [ ] Token 统计功能完整
- [ ] 支持 HTML/PDF/Markdown 报告导出
- [ ] 新增 Copilot 和 Doubao 支持
- [ ] 单元测试覆盖率 > 80%
- [ ] 文档完整更新

---

## 💻 v1.0.0：桌面应用（AgentGuard Desktop）（预计 6-8 周）

> **目标**：打造专业的桌面安全监控中心

### 🏗️ 技术架构
- **框架**：Electron + React + TypeScript
- **UI 库**：Tailwind CSS + shadcn/ui
- **状态管理**：Zustand
- **构建工具**：Vite + electron-builder
- **跨平台**：macOS + Windows

### 🎨 核心界面

#### 1. 悬浮窗模式（Mini Widget）
- 始终置顶（Always on Top）
- 半透明背景
- 可拖动到屏幕任意位置
- 实时更新（每 10 秒）
- 显示总体评分和今日成本

#### 2. 完整 Dashboard
- 总体安全评分仪表盘
- Agent 详细列表（运行状态、Token 使用、权限）
- 快捷操作（查看详情、停止、重启、修复）

#### 3. Token 统计页面
- 使用趋势图表（最近 30 天）
- 今日/本周/本月明细
- 成本预算进度条
- 按 Agent 分类统计

#### 4. 系统托盘
- 显示简要信息
- 快捷菜单（显示 Dashboard、立即扫描、查看 Token）

### 🔔 实时监控与通知

#### 1. 自动扫描
- 每 10 秒自动扫描一次
- 检测 Agent 启动/停止

#### 2. 安全警报
- Critical 问题立即通知
- 托盘图标变红
- 播放警报音（可选）

#### 3. 成本警报
- 超出预算时通知
- 月度预测提醒

### 📦 打包与分发

#### 1. macOS
- .dmg 安装包
- 代码签名

#### 2. Windows
- .exe 安装程序
- NSIS 安装包

#### 3. 自动更新
- 检查 GitHub Releases
- 后台下载更新

### 🎨 主题与定制

#### 1. 亮色/暗色主题
- 跟随系统主题
- 手动切换

#### 2. 悬浮窗自定义
- 调整大小
- 调整透明度

#### 3. 通知设置
- 启用/禁用通知
- 优先级过滤

### ✅ v1.0.0 验收标准
- [ ] 悬浮窗功能完整（Mac + Windows）
- [ ] 完整 Dashboard 界面
- [ ] 实时扫描（每 10 秒）
- [ ] Token 统计和成本监控
- [ ] 系统通知（安全警报 + 成本警报）
- [ ] 系统托盘集成
- [ ] 打包成 .dmg（Mac）和 .exe（Windows）
- [ ] 自动更新功能
- [ ] 文档完整（用户手册 + 开发文档）

---

## 🚀 v1.1+：高级功能（未来规划）

### 可能的功能
1. **远程监控** - 监控团队成员的 Agent 使用情况
2. **历史记录与审计** - 记录所有扫描历史，导出审计日志
3. **自定义规则** - 用户自定义安全检查规则，插件系统
4. **云同步** - 同步设置和历史记录，多设备协同
5. **团队协作** - 分享安全配置，团队仪表盘

---

## 📅 总体时间规划

```
2026-03 ──┬─── v0.2.0 (2 周)
          │    ├─ 修复构建问题
          │    ├─ 深度安全检查
          │    └─ 发布到 npm
          │
2026-04 ──┼─── v0.3.0 (3-4 周)
          │    ├─ Token 统计
          │    ├─ 报告导出
          │    └─ 新 Agent 支持
          │
2026-05 ──┤
2026-06 ──┼─── v1.0.0 (6-8 周)
2026-07 ──┤    ├─ Electron 桌面应用
          │    ├─ 悬浮窗 + Dashboard
          │    ├─ 实时监控
          │    ├─ 系统通知
          │    └─ 打包分发
          │
2026-08 ──┴─── v1.1+ (持续迭代)
               └─ 高级功能
```

---

## 🎯 当前优先级（本次优化）

**建议本次优化目标**：完成 v0.2.0（2 周内）

### 本次 Sprint 任务清单
- [ ] 1. 删除 server 模块，修复构建
- [ ] 2. 实现 Claude Code 深度安全检查（4 项）
- [ ] 3. 实现 Cursor 深度安全检查（4 项）
- [ ] 4. 添加 Claude/Cursor 自动修复功能
- [ ] 5. 改进扫描进度提示（ora spinner）
- [ ] 6. 添加 --verbose 详细模式
- [ ] 7. 并行扫描优化
- [ ] 8. 更新所有文档
- [ ] 9. 发布到 npm
- [ ] 10. 创建 GitHub Release v0.2.0

完成后，v0.2.0 将是一个**功能完整、可发布到 npm 的专业 CLI 工具**，为后续的桌面应用打下坚实基础。

---

**准备好开始了吗？我们从第 1 步开始：删除 server 模块！** 🚀
