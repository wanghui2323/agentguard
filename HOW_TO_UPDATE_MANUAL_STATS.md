# 如何更新手动统计数据

## 📍 配置文件位置

```
~/.agentguard/manual-stats.json
```

## 📝 文件格式

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

## ✏️ 如何修改

### 方法 1: 使用文本编辑器

```bash
# 打开配置文件
open -a TextEdit ~/.agentguard/manual-stats.json

# 或使用 VS Code
code ~/.agentguard/manual-stats.json

# 或使用 vim
vim ~/.agentguard/manual-stats.json
```

修改 `today` 和 `thisMonth` 的数值，然后保存。

### 方法 2: 使用命令行

```bash
# 更新今日消耗
cat > ~/.agentguard/manual-stats.json << 'EOF'
{
  "claude-vscode": {
    "today": 55.00,
    "thisMonth": 480.00,
    "updatedAt": "2026-03-09T10:00:00Z"
  }
}
EOF

# 重启 Desktop 查看效果
pkill -f Electron && npx electron .
```

### 方法 3: 快速脚本

创建一个更新脚本：

```bash
#!/bin/bash
# update-claude-stats.sh

TODAY=$1
MONTH=$2

if [ -z "$TODAY" ] || [ -z "$MONTH" ]; then
  echo "用法: ./update-claude-stats.sh <今日> <本月>"
  echo "示例: ./update-claude-stats.sh 55.50 480.00"
  exit 1
fi

cat > ~/.agentguard/manual-stats.json << EOF
{
  "claude-vscode": {
    "today": $TODAY,
    "thisMonth": $MONTH,
    "updatedAt": "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
  }
}
EOF

echo "✅ 更新成功!"
echo "   今日: \$$TODAY"
echo "   本月: \$$MONTH"
echo ""
echo "重启 Desktop 查看效果:"
echo "  pkill -f Electron && npx electron ."
```

使用：
```bash
chmod +x update-claude-stats.sh
./update-claude-stats.sh 60.00 500.00
```

## 🔄 数据刷新

修改配置文件后，有3种方式让数据生效：

### 1. 等待自动刷新（10秒）
配置文件有5分钟缓存，但界面每10秒自动更新

### 2. 重启 Desktop
```bash
pkill -f Electron
npx electron .
```

### 3. 刷新 Web Dashboard
直接刷新浏览器: http://localhost:3000

## 📊 当前数据

你现在的配置：
```json
{
  "claude-vscode": {
    "today": 50.00,
    "thisMonth": 450.00
  }
}
```

加上 Cursor 自动统计：
```
总计:
  今日: $87.90 (Claude $50 + Cursor $37.90)
  本月: $527.85 (Claude $450 + Cursor $77.85)
```

## 💡 如何获取准确数据

### 从 Anthropic Console

1. 访问 https://console.anthropic.com
2. 进入 Usage & Billing
3. 查看每日/每月消耗
4. 更新到配置文件

### 从邮件账单

如果你收到 Anthropic 的账单邮件：
1. 查看当前消耗
2. 更新配置文件

### 估算方法

如果没有精确数据，可以估算：
```
月预算: $500
已用天数: 9天
日均: $500 / 30 = $16.67
今日估算: $16.67
本月估算: $16.67 × 9 = $150
```

## 🎯 界面效果

修改配置后，界面会显示：

```
悬浮球 Tooltip:
⚛️ AgentGuard 运行正常

📊 Agent: 2/3 活跃
💰 今日: $87.9000  ← 会显示你配置的数据
🔒 安全评分: 92/100
```

面板窗口:
```
💰 今日: $87.90
   本月: $527.85

Agent 列表:
  - Claude Code (VS Code): 运行中
  - Cursor IDE: 运行中
```

## ⚠️ 注意事项

1. **数值格式**: 必须是数字，不要加引号
   ```json
   ✅ "today": 50.00
   ❌ "today": "50.00"
   ```

2. **JSON 格式**: 确保格式正确
   - 键名用双引号
   - 最后一项后面不要有逗号

3. **小数位数**: 建议保留2位小数
   ```json
   "today": 50.00  ← 推荐
   "today": 50     ← 也可以
   ```

4. **缓存时间**: 配置有5分钟缓存
   - 修改后可能需要等待或重启

## 🔧 高级配置

### 添加更多 Agent

如果将来需要手动配置其他 Agent：

```json
{
  "claude-vscode": {
    "today": 50.00,
    "thisMonth": 450.00
  },
  "github-copilot": {
    "today": 10.00,
    "thisMonth": 100.00
  },
  "openclaw": {
    "today": 5.00,
    "thisMonth": 50.00
  }
}
```

### 添加备注

```json
{
  "claude-vscode": {
    "today": 50.00,
    "thisMonth": 450.00,
    "updatedAt": "2026-03-09T10:00:00Z",
    "note": "数据来自 Anthropic Console",
    "source": "https://console.anthropic.com/usage"
  }
}
```

## 📞 遇到问题？

### 配置不生效

1. 检查文件路径: `cat ~/.agentguard/manual-stats.json`
2. 检查 JSON 格式: `python3 -m json.tool ~/.agentguard/manual-stats.json`
3. 查看日志: `tail -f /tmp/agentguard-final-fixed.log`
4. 重启应用: `pkill -f Electron && npx electron .`

### 显示还是 $0

1. 确认配置文件存在
2. 检查 JSON 格式
3. 清除缓存并重启

### 数据不准确

调整配置文件中的数值，重启应用即可。

---

**现在你的界面应该显示:**
- **今日: $87.90**
- **本月: $527.85**

不再是 $0.00 了！🎉
