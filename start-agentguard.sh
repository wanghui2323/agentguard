#!/bin/bash
set -e

cd "$(dirname "$0")"

echo "🛡️  AgentGuard v0.4.0 启动脚本"
echo "================================"
echo ""

# 清理旧进程
echo "🧹 清理旧进程..."
pkill -9 -f "Electron.*agentguard" 2>/dev/null || true
pkill -9 -f "node dist/web" 2>/dev/null || true
sleep 2

# 检查环境变量
echo "✅ 检查环境变量..."
if [ ! -z "$ELECTRON_RUN_AS_NODE" ]; then
  echo "⚠️  警告: ELECTRON_RUN_AS_NODE 已设置，将清除"
  unset ELECTRON_RUN_AS_NODE
fi

# 编译项目
echo "🔨 编译项目..."
npm run build:desktop > /dev/null 2>&1 && echo "   ✓ Desktop 编译完成"
npm run build:web > /dev/null 2>&1 && echo "   ✓ Web 编译完成"

echo ""
echo "🚀 启动服务..."
echo ""

# 启动 Web Dashboard
echo "📊 启动 Web Dashboard (http://localhost:3000)..."
node dist/web/web/server/index.js > /tmp/agentguard-web.log 2>&1 &
WEB_PID=$!
sleep 2

# 启动 Desktop 悬浮球
echo "🎯 启动 Desktop 悬浮球..."
unset ELECTRON_RUN_AS_NODE
npx electron . > /tmp/agentguard-desktop.log 2>&1 &
DESKTOP_PID=$!
sleep 3

echo ""
echo "✅ 启动完成！"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📱 Desktop 悬浮球"
echo "   - 已启动 (PID: $DESKTOP_PID)"
echo "   - 查看右上角绿色盾牌图标"
echo "   - 点击查看详细信息"
echo "   - 日志: /tmp/agentguard-desktop.log"
echo ""
echo "🌐 Web Dashboard"
echo "   - 已启动 (PID: $WEB_PID)"
echo "   - 访问: http://localhost:3000"
echo "   - 日志: /tmp/agentguard-web.log"
echo ""
echo "🔍 检查状态:"
echo "   ps aux | grep -E 'Electron|node dist/web' | grep -v grep"
echo ""
echo "📋 查看日志:"
echo "   tail -f /tmp/agentguard-desktop.log"
echo "   tail -f /tmp/agentguard-web.log"
echo ""
echo "❌ 停止服务:"
echo "   pkill -f 'Electron.*agentguard'"
echo "   pkill -f 'node dist/web'"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# 监控 5 秒查看是否有启动错误
sleep 5
if ! ps -p $DESKTOP_PID > /dev/null 2>&1; then
  echo "⚠️  Desktop 进程异常退出！"
  echo "查看日志: tail -50 /tmp/agentguard-desktop.log"
  exit 1
fi

if ! ps -p $WEB_PID > /dev/null 2>&1; then
  echo "⚠️  Web 进程异常退出！"
  echo "查看日志: tail -50 /tmp/agentguard-web.log"
  exit 1
fi

echo "✨ 所有服务运行正常！"
echo ""
