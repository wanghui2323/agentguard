#!/bin/bash

# AgentGuard Desktop 启动脚本（修复版）
# 临时取消 ELECTRON_RUN_AS_NODE 环境变量

echo "🔧 修复 Electron 环境变量..."
echo ""

# 取消 ELECTRON_RUN_AS_NODE 变量
unset ELECTRON_RUN_AS_NODE

# 验证环境
echo "✅ 环境检查："
echo "   ELECTRON_RUN_AS_NODE = '${ELECTRON_RUN_AS_NODE:-<未设置>}'"
echo ""

# 构建项目
echo "🔨 构建 Desktop 项目..."
npm run build:desktop

# 启动 Electron
echo ""
echo "🚀 启动 AgentGuard Desktop..."
npx electron .
