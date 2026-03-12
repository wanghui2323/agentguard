#!/bin/bash

echo "🛑 停止所有 AgentGuard Desktop 进程..."
killall -9 Electron 2>/dev/null
killall -9 "Electron Helper" 2>/dev/null
sleep 2

echo "🔨 重新编译..."
npm run build:desktop

echo "🚀 启动 AgentGuard Desktop..."
unset ELECTRON_RUN_AS_NODE
npx electron .

# 不要在后台运行，这样可以看到实时日志
