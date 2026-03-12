#!/bin/bash

echo "🔍 AgentGuard 诊断工具"
echo "========================"
echo ""

echo "📊 运行进程:"
DESKTOP_COUNT=$(ps aux | grep "Electron.*agentguard" | grep -v grep | wc -l)
WEB_COUNT=$(ps aux | grep "node dist/web" | grep -v grep | wc -l)

if [ $DESKTOP_COUNT -gt 0 ]; then
  echo "   ✅ Desktop 运行中 ($DESKTOP_COUNT 个进程)"
else
  echo "   ❌ Desktop 未运行"
fi

if [ $WEB_COUNT -gt 0 ]; then
  echo "   ✅ Web Dashboard 运行中 ($WEB_COUNT 个进程)"
else
  echo "   ❌ Web Dashboard 未运行"
fi

echo ""
echo "📝 最近日志 (Desktop):"
if [ -f /tmp/agentguard-desktop.log ]; then
  tail -10 /tmp/agentguard-desktop.log | sed 's/^/   /'
else
  echo "   无日志文件"
fi

echo ""
echo "📝 最近日志 (Web):"
if [ -f /tmp/agentguard-web.log ]; then
  tail -5 /tmp/agentguard-web.log | sed 's/^/   /'
else
  echo "   无日志文件"
fi

echo ""
echo "🔴 错误日志:"
ERROR_COUNT=$(grep -i "error" /tmp/agentguard-desktop.log 2>/dev/null | wc -l)
if [ $ERROR_COUNT -gt 0 ]; then
  echo "   ⚠️  发现 $ERROR_COUNT 个错误"
  grep -i "error" /tmp/agentguard-desktop.log | tail -3 | sed 's/^/   /'
else
  echo "   ✅ 无错误"
fi

echo ""
echo "🌐 Web 服务测试:"
if curl -s http://localhost:3000/api/health > /dev/null 2>&1; then
  echo "   ✅ Web API 正常响应"
  curl -s http://localhost:3000/api/health | jq -r '"\n   版本: \(.version)\n   运行时间: \(.uptime)s"' 2>/dev/null || echo ""
else
  echo "   ❌ Web API 无响应"
fi

echo ""
