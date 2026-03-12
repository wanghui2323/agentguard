#!/bin/bash
# AgentGuard Desktop 启动脚本
# 自动清除 ELECTRON_RUN_AS_NODE 环境变量

cd "$(dirname "$0")"

echo "🚀 启动 AgentGuard Desktop..."
echo "📍 清除 ELECTRON_RUN_AS_NODE 环境变量"
echo ""

# 清除环境变量并启动
env -u ELECTRON_RUN_AS_NODE npm run build:desktop && env -u ELECTRON_RUN_AS_NODE npm run desktop

echo ""
echo "✅ AgentGuard Desktop 已启动"
echo "🎯 悬浮球位置：屏幕右上角"
echo "💡 提示：点击悬浮球查看详细信息"
