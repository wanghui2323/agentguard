#!/bin/bash

echo "🧪 测试 Desktop 点击功能"
echo ""

# 等待 5 秒让你手动点击悬浮球
echo "⏳ 请在接下来的 30 秒内点击悬浮球..."
echo "   观察是否弹出面板窗口"
echo "   检查终端是否有报错"
echo ""

# 监控日志
sleep 30 && tail -50 /tmp/agentguard.log | grep -i "error\|failed\|exception" || echo "✅ 未发现错误日志"
