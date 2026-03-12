# Dashboard V2 功能说明

## 🎯 核心升级

基于悬浮应用的交互和视觉设计，全新优化的 Dashboard 提供智能分析和优化建议功能。

---

## ✨ 新增功能

### 1. 智能概览面板 (Overview Tab)

#### 📊 实时健康状态
- **动态状态指示器**：根据系统状态自动显示
  - 🟢 运行状态优秀 (评分 90+)
  - 🔵 运行状态良好 (评分 70-89)
  - 🟡 建议尽快优化 (高危问题 5+)
  - 🔴 需要立即处理 (存在严重问题)

#### 📈 增强的指标卡片
每个指标卡片都包含：
- **主要数据**：大字号显示核心指标
- **次要信息**：补充说明和细节
- **趋势对比**：与上周/上月的对比
- **快速操作**：点击卡片可进入详细页面

**四大核心指标**：
1. **安全评分**
   - 实时评分 + 可视化仪表盘
   - 评级（优秀/良好/一般/较差）
   - 趋势变化（↑ 2.5% vs 上周）

2. **运行状态**
   - 活跃 Agent 数量（2/3）
   - Agent 头像快速预览
   - 状态分组显示

3. **安全问题**
   - 严重问题高亮显示
   - 高危/中危问题统计
   - 问题分类明细

4. **Token 消耗**
   - 今日实时消耗
   - 本月累计消耗
   - 预估月底消耗

#### 🎯 智能洞察引擎

自动分析并生成洞察卡片，包括：

**1. 安全状态分析**
- 评分达标：提供鼓励和建议
- 评分不足：明确指出问题和改进方向

**2. 问题严重性分析**
- 严重问题：🚨 立即处理提醒
- 高危问题：⚡ 24小时内处理建议
- 中危问题：💡 优化建议

**3. 成本异常检测**
- 预算告警：超过 90% 立即提醒
- 消耗警告：超过 70% 发出预警
- 趋势分析：今日消耗是否异常

**4. 效率优化分析**
- Token 使用效率评估
- Prompt Caching 建议
- 模型选择优化

**5. 系统状态监控**
- Agent 停止检测
- 异常活动识别
- 健康度评估

#### 📉 可视化趋势图
- **成本趋势**：最近 7 天的消耗曲线
- **交互式悬停**：显示每天的具体金额
- **渐变柱状图**：视觉效果优秀

---

### 2. 优化建议系统 (Insights Tab)

#### 🏷️ 智能分类

**四大优化类别**：
1. **💰 成本优化** - 降低 Token 消耗和费用
2. **🔒 安全加固** - 提升系统安全性
3. **⚡ 性能提升** - 优化响应速度
4. **🛡️ 可靠性** - 提高系统稳定性

#### 📋 详细建议内容

每条建议包含：

**基础信息**：
- 标题：简明扼要的建议
- 描述：详细说明和背景
- 优先级：高/中/低（带颜色标识）
- 难度：简单/中等/复杂

**影响评估**：
- 预期影响：具体的改进效果
- 成本节省：每月可节省金额
- 实施工时：预估所需时间

**实施指南**：
- 分步骤说明：1-2-3-4 清晰步骤
- 可展开查看：不占用空间
- 可操作按钮：一键应用建议

#### 🎯 具体优化建议示例

**成本优化**：
- ✅ 启用 Prompt Caching（节省 40-60%）
- ✅ 简单任务使用 Haiku（节省 67%）
- ✅ 批量处理 API 调用（节省 20-30%）

**安全加固**：
- ✅ 修复严重安全问题
- ✅ 实施安全最佳实践
- ✅ 启用审计日志

**性能提升**：
- ✅ 优化上下文窗口（提速 30-50%）
- ✅ 启用流式响应（降低首字时间 60%）

**可靠性**：
- ✅ 实施智能重试机制（成功率 99.9%+）
- ✅ 配置健康检查（可用性 99.9%）

#### 💡 应用状态跟踪
- 未应用：显示"应用建议"按钮
- 已应用：显示绿色"✓ 已应用"标签
- 持久化存储：记录用户已采纳的建议

---

### 3. 视觉设计升级

#### 🎨 现代化 UI

**配色方案**：
- 渐变背景：`from-gray-50 via-white to-gray-50`
- 主色调：紫色 → 靛蓝渐变
- 状态色：
  - 成功/优秀：绿色
  - 警告：黄色
  - 危险：红色
  - 信息：蓝色

**卡片设计**：
- 圆角：2xl (16px)
- 阴影：sm → md 渐变（hover 效果）
- 边框：细边框 + 渐变背景
- 过渡：all 300ms 平滑动画

**图标系统**：
- Emoji 图标：🛡️ 🤖 ⚠️ 💰
- 渐变图标背景
- 圆角图标容器

#### 📱 响应式布局

- **桌面**：4 列网格
- **平板**：2 列网格
- **手机**：1 列堆叠

**自适应元素**：
- 卡片自动调整大小
- 文字大小响应式
- 图表适配屏幕宽度

---

### 4. 交互增强

#### 🎭 动画效果

**微交互**：
- Hover 状态：卡片阴影加深
- 点击反馈：按钮颜色变化
- 状态切换：淡入淡出
- 加载动画：脉冲效果

**过渡动画**：
- Tab 切换：平滑过渡
- 数据更新：渐变显示
- 详情展开：滑动展开

#### 🔄 实时更新

- 自动刷新：每 30 秒更新数据
- 手动刷新：点击"立即扫描"按钮
- WebSocket 支持：实时推送（未来）

---

## 📐 组件架构

```
DashboardV2.tsx (主控制器)
├── Header (顶部栏)
│   ├── Logo & Title
│   ├── 健康状态指示器
│   └── 操作按钮
│
├── 核心指标卡片 (4个)
│   ├── 安全评分
│   ├── 运行状态
│   ├── 安全问题
│   └── Token 消耗
│
├── Tab 导航
│   ├── 智能概览
│   ├── 安全分析
│   ├── Token 分析
│   └── 优化建议
│
└── 内容区域
    ├── InsightsPanel.tsx (智能洞察)
    │   ├── 快速统计
    │   ├── 洞察卡片
    │   └── 趋势图
    │
    ├── SecurityOverview (安全分析)
    │   └── AgentCard[] (复用原有组件)
    │
    ├── TokenStats.tsx (Token 分析)
    │   └── 复用原有组件
    │
    └── OptimizationSuggestions.tsx (优化建议)
        ├── 分类筛选
        ├── 建议列表
        └── 实施步骤
```

---

## 🚀 技术实现

### 状态管理

```typescript
// 核心状态
const [activeTab, setActiveTab] = useState<'overview' | 'security' | 'tokens' | 'insights'>('overview');
const [appliedSuggestions, setAppliedSuggestions] = useState<Set<string>>(new Set());

// 计算属性
const stats = useMemo(() => {
  // 从 scanData 中计算各种统计指标
  return {
    avgScore,
    criticalCount,
    highCount,
    // ...
  };
}, [results, tokenReport]);

// 健康状态
const healthStatus = useMemo(() => {
  // 根据 stats 计算健康状态
  if (stats.criticalCount > 0) return { level: 'critical', ... };
  // ...
}, [stats]);
```

### 智能分析算法

```typescript
// 洞察生成引擎
const insights: Insight[] = [];

// 1. 安全评分分析
if (stats.avgScore >= 90) {
  insights.push({ type: 'success', title: '安全状态优秀', ... });
} else if (stats.avgScore >= 70) {
  insights.push({ type: 'info', title: '安全状态良好', ... });
} else {
  insights.push({ type: 'warning', title: '安全状态需要改进', ... });
}

// 2. 成本分析
const budgetUsage = (stats.monthlyCost / monthlyBudget) * 100;
if (budgetUsage > 90) {
  insights.push({ type: 'danger', title: '预算即将耗尽', ... });
}

// 3. 趋势分析
const dailyAvg = stats.monthlyCost / new Date().getDate();
if (stats.todayCost > dailyAvg * 1.5) {
  insights.push({ type: 'warning', title: '今日消耗异常', ... });
}
```

---

## 📊 数据流

```
User Action (点击扫描)
    ↓
electronAPI.scanAgents()
    ↓
Main Process (Electron)
    ↓
DataServiceV2.getDetailedData()
    ↓
autoTrackerManager.getAggregatedUsage()
    ↓
返回数据到 Renderer
    ↓
DashboardV2 接收并分析
    ↓
生成洞察和建议
    ↓
UI 更新显示
```

---

## 🎯 使用场景

### 场景 1：日常监控
**用户**：每天早上打开 AgentGuard
**目标**：快速了解系统状态

**流程**：
1. 看到"运行状态优秀"的健康指示器 ✅
2. 查看核心指标卡片，一切正常
3. 切换到"智能概览"，看到昨天节省了 $12
4. 关闭应用，继续工作

### 场景 2：成本优化
**用户**：发现本月消耗过高
**目标**：降低成本

**流程**：
1. 看到"预算已用 78%"的警告 ⚠️
2. 点击"Token 消耗"卡片，查看详情
3. 切换到"优化建议"标签
4. 筛选"成本优化"类别
5. 看到"启用 Prompt Caching"建议，预计节省 $200/月
6. 点击"应用建议"，查看实施步骤
7. 按照步骤实施优化

### 场景 3：安全加固
**用户**：收到严重安全问题告警
**目标**：快速修复问题

**流程**：
1. 看到红色"需要立即处理"指示器 🔴
2. 智能概览显示"发现 3 个严重安全问题"
3. 点击"立即修复"按钮
4. 跳转到"安全分析"标签
5. 逐个查看并修复问题
6. 重新扫描，评分从 65 提升到 88

---

## 🔮 未来规划

### Phase 1 (当前)
- ✅ 智能概览面板
- ✅ 优化建议系统
- ✅ 视觉升级
- ✅ 健康状态指示

### Phase 2 (计划中)
- ⏳ 实时数据推送（WebSocket）
- ⏳ 导出 PDF 报告
- ⏳ 自定义预算设置
- ⏳ 邮件告警通知

### Phase 3 (未来)
- 🔮 AI 驱动的智能建议
- 🔮 多租户支持
- 🔮 集成 Slack/Discord 通知
- 🔮 移动端应用

---

## 💡 开发建议

### 添加新的洞察
在 `InsightsPanel.tsx` 中添加：
```typescript
// 新的分析逻辑
if (某个条件) {
  insights.push({
    type: 'warning',
    icon: '🔔',
    title: '新洞察标题',
    description: '详细描述',
    action: '操作按钮文字',
  });
}
```

### 添加新的优化建议
在 `OptimizationSuggestions.tsx` 中添加：
```typescript
suggestions.push({
  id: 'unique-id',
  category: 'cost',
  priority: 'high',
  title: '建议标题',
  description: '详细说明',
  impact: '预期影响',
  effort: 'easy',
  savings: '$100/月',
  steps: ['步骤1', '步骤2', '步骤3'],
  applied: false,
});
```

---

## 📚 相关文档

- [AUTO_TRACKING_GUIDE.md](AUTO_TRACKING_GUIDE.md) - 自动追踪使用指南
- [TOKEN_TRACKING.md](TOKEN_TRACKING.md) - Token 追踪系统架构
- [OpenClaw_Token_Tracking_Analysis.md](OpenClaw_Token_Tracking_Analysis.md) - OpenClaw 技术分析

---

**最后更新**: 2026-03-09
**AgentGuard 版本**: 0.3.0
**Dashboard 版本**: V2.0
