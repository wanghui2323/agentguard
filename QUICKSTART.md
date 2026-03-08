# 🚀 AgentGuard 快速开始

## 5 分钟快速体验

### 1. 安装依赖

```bash
cd agentguard
npm install
```

### 2. 构建项目

```bash
npm run build
```

### 3. 本地测试（无需安装）

```bash
# 扫描所有 AI Agents
npm run dev scan

# 查看 Agent 状态
npm run dev status

# 自动修复问题
npm run dev fix

# 停止 Agent
npm run dev stop openclaw

# 重启 Agent
npm run dev restart openclaw
```

### 4. 全局安装（可选）

```bash
npm link

# 之后可以在任何地方使用
agentguard scan
agentguard fix
agentguard status
```

## 📖 使用示例

### 场景 1: 首次扫描

```bash
$ agentguard scan

╔══════════════════════════════════════════════════════╗
║          AgentGuard - AI Agent 安全扫描报告          ║
╠══════════════════════════════════════════════════════╣
║  扫描时间: 2026-03-08 15:30:42                       ║
║  检测到 1 个 AI Agents                                ║
║  总体安全评分: 45/100 🟠                              ║
╠══════════════════════════════════════════════════════╣
║                                                       ║
║  [openclaw] OpenClaw                    评分: 45/100 🟠    ║
║      状态: ● running (PID 12345)                     ║
║      端口: 18789                                      ║
║      发现 6 个问题 (3严重 2高危 1中危)               ║
║      🔴 端口暴露到公网                            ║
║      🔴 未启用认证                                ║
║      🔴 DM 策略过于开放                           ║
║      ...                                             ║
╚══════════════════════════════════════════════════════╝

建议操作:
  运行 agentguard fix 自动修复问题
```

### 场景 2: 自动修复

```bash
$ agentguard fix openclaw

Fixing OpenClaw...
✓ 端口暴露到公网
✓ 未启用认证
✓ DM 策略过于开放
✓ 未启用沙箱
✓ 工作空间权限为读写
✓ 配置文件权限过于宽松

修复完成! OpenClaw 需要重启以应用更改.
是否立即重启? (y/n): y

● 正在重启 OpenClaw...
✅ OpenClaw 已成功重启
🎉 安全评分从 45 提升到 90!
```

### 场景 3: 导出 JSON 报告

```bash
$ agentguard scan --json > security-report.json
```

## 🔧 开发模式

### 运行单元测试

```bash
npm test
```

### 代码检查

```bash
npm run lint
```

### 格式化代码

```bash
npm run format
```

### 监听模式开发

```bash
npm run dev
```

## 📁 项目结构

```
agentguard/
├── src/
│   ├── cli/              # CLI 入口
│   ├── core/
│   │   ├── detectors/    # Agent 检测器
│   │   ├── scanner.ts    # 扫描引擎
│   │   ├── fixer.ts      # 修复引擎
│   │   ├── monitor.ts    # 监控服务
│   │   └── tokens.ts     # Token 统计
│   ├── types/            # TypeScript 类型
│   └── utils/            # 工具函数
├── tests/                # 测试文件
└── dist/                 # 构建输出
```

## 🐛 调试技巧

### 查看详细日志

```bash
DEBUG=agentguard:* npm run dev scan
```

### 测试特定检测器

```typescript
// tests/detectors/openclaw.test.ts
import { OpenClawDetector } from '../../src/core/detectors/openclaw';

const detector = new OpenClawDetector();
const agent = await detector.detect();
console.log(agent);
```

## 🚧 常见问题

### Q: 找不到 Agent
**A**: 确保 Agent 正在运行，或配置文件存在于默认路径

### Q: 修复失败
**A**: 检查是否有配置文件的写权限，备份文件在 `~/.openclaw/openclaw.json.backup.*`

### Q: 无法停止 Agent
**A**: 可能需要 sudo 权限，或 Agent 已经停止

## 📚 下一步

- 阅读 [CONTRIBUTING.md](CONTRIBUTING.md) 了解如何贡献
- 查看 [API 文档](docs/API.md) 了解编程接口
- 加入 [GitHub Discussions](https://github.com/yourusername/agentguard/discussions) 讨论

---

需要帮助？[提交 Issue](https://github.com/yourusername/agentguard/issues) 或发邮件到 support@agentguard.dev
