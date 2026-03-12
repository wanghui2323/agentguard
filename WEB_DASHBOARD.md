# AgentGuard Web Dashboard

🎯 **实时监控界面** - 基于 Web 的 AI Agent 安全监控面板

## 功能特性

### ✨ 核心功能

- **实时状态监控** - 每 10 秒自动刷新,展示最新监控数据
- **Agent 管理** - 查看所有运行中的 AI Agent 及其状态
- **成本追踪** - 实时显示今日和本月 Token 使用成本
- **安全评分** - 动态圆环图展示整体安全评分
- **告警中心** - 自动检测并显示安全告警(严重/警告级别)

### 📊 监控指标

1. **Agent 统计**
   - 总数量 / 活跃数 / 离线数
   - 实时状态更新

2. **成本分析**
   - 今日花费
   - 本月累计花费
   - Token 使用详情

3. **安全评分**
   - 0-100 分评分系统
   - 四个等级: 优秀/良好/一般/较差
   - 动态可视化展示

4. **告警统计**
   - 严重告警数量
   - 警告告警数量
   - 实时风险提示

### 🎨 界面特色

- **渐变背景** - 紫色渐变(#667eea → #764ba2)
- **毛玻璃效果** - 半透明白色卡片(rgba(255,255,255,0.95))
- **悬浮动画** - 鼠标悬停时卡片上浮效果
- **状态颜色** - 绿色(正常) / 黄色(警告) / 红色(严重)
- **脉冲动画** - 严重状态时红色脉冲提示
- **响应式布局** - 自适应不同屏幕尺寸

## 快速开始

### 方法 1: 使用启动脚本

```bash
./start-web.sh
```

### 方法 2: 使用 npm 脚本

```bash
# 生产模式(先构建后启动)
npm run web

# 开发模式(热重载)
npm run dev:web
```

### 方法 3: 手动启动

```bash
# 1. 构建项目
npm run build:web

# 2. 启动服务器
node dist/web/web/server/index.js
```

## 访问方式

启动成功后,在浏览器中访问:

- **主界面**: http://localhost:3000
- **API 接口**: http://localhost:3000/api
- **健康检查**: http://localhost:3000/api/health

## API 端点

### GET /api/status
获取实时监控状态概览

**响应示例:**
```json
{
  "status": "normal",
  "agents": {
    "total": 3,
    "active": 2,
    "inactive": 1
  },
  "cost": {
    "today": 0.0234,
    "thisMonth": 1.2567,
    "formatted": {
      "today": "$0.0234",
      "thisMonth": "$1.2567"
    }
  },
  "security": {
    "score": 92,
    "level": "excellent"
  },
  "alerts": {
    "count": 0,
    "critical": 0,
    "warning": 0
  },
  "timestamp": "2026-03-08T15:50:00.000Z"
}
```

### GET /api/agents
获取所有 Agent 详细信息

**响应示例:**
```json
[
  {
    "name": "Claude Code",
    "pid": 12345,
    "status": "running",
    "port": 3000,
    "security": {
      "score": 95,
      "riskLevel": "excellent",
      "issues": []
    },
    "timestamp": "2026-03-08T15:50:00.000Z"
  }
]
```

### GET /api/tokens
获取 Token 使用情况详细报告

**响应示例:**
```json
{
  "total": {
    "inputTokens": 15000,
    "outputTokens": 8000,
    "totalTokens": 23000,
    "cost": {
      "today": 0.0234,
      "thisWeek": 0.1567,
      "thisMonth": 1.2567
    },
    "formatted": {
      "today": "$0.0234",
      "thisWeek": "$0.1567",
      "thisMonth": "$1.2567"
    }
  },
  "byAgent": [
    {
      "name": "Claude Code",
      "inputTokens": 10000,
      "outputTokens": 5000,
      "totalTokens": 15000,
      "cost": 0.0156,
      "formatted": "$0.0156"
    }
  ],
  "timestamp": "2026-03-08T15:50:00.000Z"
}
```

### POST /api/scan
触发全量安全扫描

**响应示例:**
```json
{
  "success": true,
  "scanned": 3,
  "timestamp": "2026-03-08T15:50:00.000Z"
}
```

### GET /api/health
健康检查端点

**响应示例:**
```json
{
  "status": "healthy",
  "version": "0.4.0",
  "uptime": 3600.5,
  "timestamp": "2026-03-08T15:50:00.000Z"
}
```

## 技术架构

### 后端技术栈

- **Express.js** - Web 服务器框架
- **TypeScript** - 类型安全的 JavaScript
- **CORS** - 跨域资源共享支持

### 前端技术栈

- **原生 JavaScript** - 无框架依赖,轻量高效
- **Fetch API** - 异步数据获取
- **CSS3** - 现代化 UI 样式

### 核心服务

- **SecurityScanner** - 安全扫描引擎(来自 core/scanner.ts)
- **TokenTracker** - Token 使用追踪(来自 core/token-tracker.ts)

## 项目结构

```
src/web/
├── server/
│   └── index.ts          # Express 服务器主入口
├── public/
│   └── index.html        # Dashboard 主界面
└── tsconfig.json         # TypeScript 配置

dist/web/
├── web/
│   └── server/
│       └── index.js      # 编译后的服务器代码
└── public/
    └── index.html        # 静态资源
```

## 端口配置

默认端口: **3000**

如需修改端口,编辑 [src/web/server/index.ts](src/web/server/index.ts):

```typescript
const PORT = 3000; // 修改为你想要的端口号
```

## 开发指南

### 添加新的 API 端点

1. 在 `src/web/server/index.ts` 中添加路由:

```typescript
app.get('/api/your-endpoint', async (req: Request, res: Response) => {
  try {
    // 你的逻辑
    res.json({ data: 'your data' });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Error message' });
  }
});
```

2. 重新构建并启动:

```bash
npm run build:web
node dist/web/web/server/index.js
```

### 修改前端界面

编辑 `src/web/public/index.html` 即可,无需额外编译步骤。

## 常见问题

### Q: 为什么选择 Web Dashboard 而不是 Electron Desktop?

**A:** 在开发过程中遇到了 Electron 模块加载问题(require('electron') 返回字符串路径而非 API 对象,process.type 为 undefined)。Web Dashboard 提供了一个可靠的替代方案:

- ✅ 无需 Electron 依赖
- ✅ 跨平台兼容性更好
- ✅ 可以通过任何浏览器访问
- ✅ 更轻量级的实现
- ✅ 更容易调试和维护

### Q: 如何在生产环境中部署?

**A:** 生产部署建议:

1. 使用进程管理器(如 PM2):
```bash
npm install -g pm2
pm2 start dist/web/web/server/index.js --name agentguard-web
```

2. 配置 Nginx 反向代理:
```nginx
server {
    listen 80;
    server_name agentguard.yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

3. 使用 HTTPS (Let's Encrypt):
```bash
certbot --nginx -d agentguard.yourdomain.com
```

### Q: 数据多久刷新一次?

**A:** 前端每 10 秒自动刷新一次数据。你可以在 `src/web/public/index.html` 中修改刷新间隔:

```javascript
// 修改这行(单位:毫秒)
refreshInterval = setInterval(refreshData, 10000); // 10 秒
```

### Q: 如何添加身份认证?

**A:** 建议使用 JWT 或 Session 中间件:

```bash
npm install express-session
```

然后在 `src/web/server/index.ts` 中添加认证中间件。

## 后续计划

- [ ] 添加历史数据图表(Chart.js)
- [ ] 支持多语言切换(中文/英文)
- [ ] 添加用户身份认证
- [ ] 导出报告功能(PDF/Excel)
- [ ] WebSocket 实时推送(替代定时轮询)
- [ ] 移动端响应式优化

## 许可证

MIT License - 详见 [LICENSE](LICENSE) 文件

## 支持

- GitHub Issues: https://github.com/wanghui2323/agentguard/issues
- 文档: https://github.com/wanghui2323/agentguard#readme
