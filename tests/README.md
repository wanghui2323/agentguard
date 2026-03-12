# AgentGuard 测试指南

## 自动化 UI 测试

### 环境要求

```bash
# 安装 Playwright
pip3 install playwright

# 安装浏览器驱动
python3 -m playwright install chromium
```

### 运行测试

```bash
# 进入测试目录
cd tests

# 运行 UI 自动化测试
python3 ui_automation_test.py
```

### 测试输出

测试脚本会生成以下文件：

- `/tmp/test_1_floating_ball.png` - 悬浮球初始状态
- `/tmp/test_2_tooltip.png` - 悬浮球 Tooltip
- `/tmp/test_3_panel_compact.png` - 面板简洁模式 (360px)
- `/tmp/test_4_panel_expanded.png` - 面板详细模式 (600px)
- `/tmp/test_5_alerts.png` - 告警显示（如果有）

### 测试覆盖

#### ✅ 已自动化测试
- 悬浮球渲染
- 白色状态点移除
- Tooltip DOM 结构
- 面板布局 (360px/600px)
- Agent 圆点显示
- 快捷按钮可见性
- 统计卡片数量

#### 🔧 需要手动测试
- 拖拽功能（磁吸边缘）
- Tooltip 显示（需要 Electron IPC）
- 位置持久化
- 面板展开动画
- 告警点击交互

## 手动测试清单

### 1. 拖拽测试
```
步骤:
1. 启动 AgentGuard Desktop
2. 拖动悬浮球到屏幕左边缘
   → 应该自动吸附 (距离边缘 10px)
3. 拖动到右边缘、上边缘、下边缘
   → 都应该自动吸附
4. 检查配置文件:
   cat ~/.agentguard/window-position.json
   → 应该包含最新位置
5. 重启应用
   → 悬浮球应该出现在上次位置
```

### 2. Tooltip 测试
```
步骤:
1. 将鼠标悬停在悬浮球上
2. 等待 500ms
   → 应该显示 Tooltip
   → 显示今日消耗和安全评分
3. 移开鼠标
   → Tooltip 应该消失
```

### 3. 面板测试
```
步骤:
1. 单击悬浮球
   → 打开简洁面板 (360px)
2. 检查内容:
   ✓ 4 个统计卡片
   ✓ Agent 圆点 (● ● ○)
   ✓ Agent 摘要 (如: "2/3 运行中")
   ✓ Dashboard 和扫描按钮
3. 点击"查看 Token 详情"
   → 面板平滑展开到 600px
   → 显示详细信息
```

### 4. 告警测试
```
步骤:
1. 如果有告警显示
   → 检查告警颜色 (红色/黄色)
2. 点击"查看"按钮
   → 应该自动展开到详细模式
   → 滚动到问题列表
```

## 测试报告

详细的自动化测试报告请查看:
- [AUTOMATED_TEST_RESULTS.md](../AUTOMATED_TEST_RESULTS.md)

## 问题反馈

如果发现测试失败或功能异常，请提供:
1. 测试截图
2. 控制台错误信息
3. 系统信息 (macOS/Windows/Linux + 版本)
4. 复现步骤
