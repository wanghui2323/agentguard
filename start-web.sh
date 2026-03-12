#!/bin/bash

# AgentGuard Web Dashboard 启动脚本

echo "🚀 启动 AgentGuard Web Dashboard..."
echo ""

# 构建项目
npm run build:web

# 启动服务器
echo ""
echo "✨ 启动 Web 服务器..."
node dist/web/web/server/index.js
