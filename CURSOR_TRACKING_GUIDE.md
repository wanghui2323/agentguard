# Cursor Token 追踪改进指南

## 📊 准确度提升

从 **30-40%** 提升到 **60-100%**

---

## 🎯 三种追踪方式对比

| 方式 | 准确度 | 自动化 | 可靠性 | 推荐度 | 说明 |
|------|--------|--------|--------|--------|------|
| **数据库估算** | 30-40% | ✅ | 高 | ⭐⭐⭐ | 无需配置，自动降级（推荐） |
| **Tokscale集成** | 60-80% | ✅ | 中 | ⭐⭐ | 可选安装，中等准确度 |
| **手动配置** | **100%** ✅ | ❌ | 高 | ⭐ | 需要人工维护（不推荐） |

---

## 方式1: 数据库估算 (默认 - 推荐 🌟)

### 优势
- ✅ **零配置** - 开箱即用
- ✅ **高可靠性** - 不依赖外部工具
- ✅ **自动降级** - Tokscale不可用时的保底方案
- ⚠️ **30-40%准确度** - 足够用于日常监控

### 工作原理

AgentGuard会自动读取Cursor数据库:
```
~/.cursor/ai-tracking/ai-code-tracking.db
```

由于数据库只存储操作记录（没有token详情），使用估算：
```typescript
// 每条记录 ≈ 500 tokens
估算tokens = 记录数 × 500
估算成本 = 估算tokens × 模型单价
```

### 何时使用

- ✅ 首次使用AgentGuard（默认启用）
- ✅ 不想安装额外工具
- ✅ 只需要大致成本监控
- ✅ Tokscale不可用时的自动降级

**说明**: 这是AgentGuard的默认方案，无需任何配置。

---

## 方式2: Tokscale集成 (可选优化)

### 优势
- ✅ **自动追踪** - 无需手动更新
- ✅ **60-80%准确** - 比数据库估算好2倍
- ✅ **优化集成** - 三级缓存，快速可靠

### 安装

```bash
# 全局安装（推荐）
npm install -g tokscale

# 或使用npx（AgentGuard会自动调用）
# 无需手动安装
```

### 使用

安装后，AgentGuard会自动优先使用Tokscale：

```
Priority 1: Tokscale (60-80% 准确)
    ↓ (如果失败)
Priority 2: 数据库估算 (30-40% 准确)
```

### 性能优化

v0.5.2优化后的特性：
- ✅ **内存缓存**: 5分钟TTL，重复查询 <10ms
- ✅ **智能调用**: 优先本地安装，降级npx
- ✅ **重试机制**: 2次重试，提升成功率到90%+
- ✅ **超时控制**: 3秒首次，5秒重试

---

## 方式3: 手动配置 (不推荐)

### 为什么不推荐

- ❌ **需要人工维护** - 每周/每天更新
- ❌ **容易忘记** - 数据过时
- ❌ **无法自动化** - 违背设计初衷

虽然准确度100%，但违背了AgentGuard自动化监控的核心理念。

### 优势（仅参考）
- ✅ **100%准确** - 直接来自Cursor官方数据
- ⚠️ **需要手动维护** - 每次都要更新

### 操作步骤

#### 1. 查看Cursor用量

打开Cursor IDE → Settings → Usage 或访问 https://cursor.com/usage

假设看到:
```
Today: $15.20
This Month: $298.50
```

#### 2. 创建配置文件

```bash
# 创建目录
mkdir -p ~/.agentguard

# 创建配置文件
cat > ~/.agentguard/manual-stats.json << 'EOF'
{
  "cursor": {
    "today": 15.20,
    "thisMonth": 298.50
  },
  "claude-vscode": {
    "today": 8.50,
    "thisMonth": 185.00
  }
}
EOF
```

#### 3. 验证配置

```bash
# 测试配置
node << 'EOF'
const { TokenTracker } = require('./dist/core/token-tracker');
const tracker = new TokenTracker();
const agent = { id: 'cursor', name: 'Cursor', status: 'running', detectedAt: new Date() };

tracker.getTokenReport([agent]).then(report => {
  const stats = report.agents[0];
  console.log(`Today: $${stats.today.estimatedCost.toFixed(2)}`);
  console.log(`Data Source: ${stats.today.dataSource}`);
  console.log(`Accuracy: ${stats.today.accuracy}`);
});
EOF
```

期望输出:
```
Today: $15.20
Data Source: manual
Accuracy: high
```

#### 4. 定期更新

建议每周更新一次配置文件:

```bash
# 快速更新脚本
cat > ~/.agentguard/update-cursor.sh << 'EOF'
#!/bin/bash
echo "Enter Cursor today cost (e.g., 12.50):"
read TODAY
echo "Enter Cursor month cost (e.g., 285.00):"
read MONTH

cat > ~/.agentguard/manual-stats.json << JSON
{
  "cursor": {
    "today": $TODAY,
    "thisMonth": $MONTH
  }
}
JSON

echo "✅ Updated successfully!"
EOF

chmod +x ~/.agentguard/update-cursor.sh
```

使用:
```bash
~/.agentguard/update-cursor.sh
```

### 仅在极端情况使用

如果确实需要手动配置（例如演示、审计）:

```bash
mkdir -p ~/.agentguard
cat > ~/.agentguard/manual-stats.json << 'EOF'
{
  "cursor": {
    "today": 15.20,
    "thisMonth": 298.50
  }
}
EOF
```

但我们**强烈建议**使用数据库估算或Tokscale，而不是手动维护。

---

## 📊 完整数据流

```
┌─────────────────────────────────────────────┐
│ AgentGuard Token Tracker (Cursor)          │
└─────────────────────────────────────────────┘
                    ↓
    ┌───────────────┴───────────────┐
    │ Priority 1: Manual Config     │ ← 100% 准确
    │ ~/.agentguard/manual-stats.json│
    └───────────────┬───────────────┘
                    ↓ (如果没有)
    ┌───────────────┴───────────────┐
    │ Priority 2: Tokscale          │ ← 60-80% 准确
    │ CLI or Cache                  │
    └───────────────┬───────────────┘
                    ↓ (如果失败)
    ┌───────────────┴───────────────┐
    │ Priority 3: Database          │ ← 30-40% 准确
    │ ~/.cursor/ai-tracking/*.db    │
    └───────────────────────────────┘
```

---

## 🎨 UI显示

桌面应用会显示数据来源标识:

```
┌─────────────────────────────────────┐
│ TOKEN 使用详情                       │
├─────────────────────────────────────┤
│ Claude Code (今日) [JSONL 🟢]       │
│                         $169.14     │
│ Cursor (今日) [手动 🟢]              │
│                          $15.20     │  ← 手动配置
└─────────────────────────────────────┘

或

┌─────────────────────────────────────┐
│ Cursor (今日) [Tokscale 🟡]         │
│                          $12.50     │  ← Tokscale
└─────────────────────────────────────┘

或

┌─────────────────────────────────────┐
│ Cursor (今日) [数据库 🔴]            │
│                           $8.30     │  ← 数据库估算
└─────────────────────────────────────┘
```

---

## 🔧 故障排查

### 问题1: 手动配置不生效

**检查文件格式**:
```bash
cat ~/.agentguard/manual-stats.json
```

确保JSON格式正确:
```json
{
  "cursor": {
    "today": 15.20,
    "thisMonth": 298.50
  }
}
```

### 问题2: Tokscale超时

**原因**: npx首次下载需要时间

**解决**:
```bash
# 预先安装
npm install -g tokscale

# 或增加超时时间（已设置5秒）
```

### 问题3: 数据显示为$0.00

**检查优先级**:
1. 是否有手动配置？
2. Tokscale是否可用？
3. Cursor数据库是否存在？

**诊断命令**:
```bash
# 检查手动配置
cat ~/.agentguard/manual-stats.json

# 检查Tokscale
npx tokscale@latest --version

# 检查Cursor数据库
ls -la ~/.cursor/ai-tracking/ai-code-tracking.db
```

---

## 💡 最佳实践

### 日常使用

**推荐配置**:
```bash
# 每周一次手动更新
~/.agentguard/update-cursor.sh

# 或安装Tokscale自动追踪
npm install -g tokscale
```

### 生产环境

**关键项目建议**:
- ✅ 使用手动配置 (100%准确)
- ✅ 每天更新配置
- ✅ 设置提醒/自动化脚本

### 个人开发

**轻度使用建议**:
- ✅ 安装Tokscale (自动化)
- ⚠️ 数据库估算作为降级

---

## 📈 准确度验证

### 验证方法

1. **查看Cursor官方数据**:
   - 打开Cursor Settings → Usage
   - 记录今日/本月成本

2. **查看AgentGuard显示**:
   ```bash
   npm run dev:desktop
   ```

3. **对比差异**:
   - 手动配置: 应该完全一致
   - Tokscale: 误差 ±10-20%
   - 数据库: 误差 ±50-70%

---

## 🚀 自动化脚本

### Cron定时更新

```bash
# 编辑crontab
crontab -e

# 添加每天早上9点更新
0 9 * * * /Users/你的用户名/.agentguard/update-cursor.sh

# 或使用macOS launchd
```

### GitHub Actions同步

如果需要团队共享配置:

```yaml
name: Update AgentGuard Config
on:
  schedule:
    - cron: '0 9 * * *'

jobs:
  update:
    runs-on: ubuntu-latest
    steps:
      - name: Get Cursor Usage
        run: |
          # 调用Cursor API (如果有)
          # 或手动设置
          echo '{"cursor":{"today":12.5,"thisMonth":280}}' > stats.json

      - name: Upload to Cloud
        run: |
          # 上传到私有存储
```

---

## 📝 配置文件模板

### 完整示例

```json
{
  "cursor": {
    "today": 15.20,
    "thisMonth": 298.50
  },
  "claude-vscode": {
    "today": 8.50,
    "thisMonth": 185.00
  },
  "notes": {
    "last_updated": "2026-03-12",
    "source": "Cursor Settings → Usage"
  }
}
```

### 最小示例

```json
{
  "cursor": {
    "today": 0,
    "thisMonth": 285.50
  }
}
```

---

## 🎯 总结

| 使用场景 | 推荐方案 | 准确度 | 维护成本 |
|---------|---------|--------|----------|
| **日常监控** | 数据库估算（默认） | 30-40% ✅ | 零 |
| **精确追踪** | Tokscale（可选） | 60-80% ✅ | 低 |
| **演示/审计** | 手动配置 | 100% ⚠️ | 高 |

**最佳实践**:
1. 使用默认的数据库估算（零配置）
2. 可选安装Tokscale（`npm i -g tokscale`）提升准确度
3. 避免手动配置（违背自动化理念）

---

**AgentGuard v0.5.2 - 让Cursor成本追踪更准确！** 🚀
