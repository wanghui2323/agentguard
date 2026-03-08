# 📦 发布 AgentGuard 到 npm

## 准备工作

### 1. 注册 npm 账号（如果还没有）

访问：https://www.npmjs.com/signup

填写信息：
- Username: 选择一个用户名
- Email: 你的邮箱
- Password: 设置密码

⚠️ **重要**：验证邮箱，否则无法发布包

---

### 2. 登录 npm

```bash
cd /Users/wanghui/Desktop/AI写作空间/agentguard

# 登录 npm
npm login

# 输入你的：
# Username: 你的用户名
# Password: 你的密码
# Email: 你的邮箱

# 验证登录成功
npm whoami
```

---

## 发布前检查

### 1. 检查包名是否可用

```bash
npm view agentguard
```

如果显示 `npm error 404 'agentguard@*' is not in this registry`，说明名字可用！✅

如果已被占用，需要修改 `package.json` 中的 `name` 字段，例如：
- `@wanghui2323/agentguard`（作用域包）
- `agentguard-cli`
- `ai-agentguard`

### 2. 更新 package.json

确保以下字段正确：

```json
{
  "name": "agentguard",
  "version": "0.1.0",
  "description": "The security control center for local AI agents",
  "main": "dist/cli/index.js",
  "bin": {
    "agentguard": "./dist/cli/index.js"
  },
  "files": [
    "dist",
    "LICENSE",
    "README.md",
    "README_EN.md"
  ],
  "keywords": [
    "ai",
    "security",
    "agent",
    "monitoring",
    "claude",
    "cursor",
    "openclaw"
  ],
  "author": "wanghui2323",
  "license": "MIT",
  "repository": {
    "type": "git",
    "url": "https://github.com/wanghui2323/agentguard.git"
  },
  "homepage": "https://github.com/wanghui2323/agentguard#readme",
  "bugs": {
    "url": "https://github.com/wanghui2323/agentguard/issues"
  }
}
```

### 3. 添加 .npmignore

创建 `.npmignore` 文件，排除不需要发布的文件：

```
# 源代码（只发布编译后的 dist）
src/
*.ts
!*.d.ts

# 测试文件
tests/
test-runner.js
*.test.js
*.spec.js

# 开发文件
.git/
.github/
node_modules/
coverage/

# 文档草稿
docs/
web/
DEMO_SCRIPT.md
ROADMAP.md
PUBLISH_TO_NPM.md
INSTALL.md

# 配置文件
.eslintrc.js
.prettierrc
tsconfig.json
jest.config.js

# 临时文件
*.log
.DS_Store
.env
```

---

## 构建项目

```bash
cd /Users/wanghui/Desktop/AI写作空间/agentguard

# 安装依赖
npm install

# 构建 TypeScript
npm run build

# 检查 dist 目录
ls -la dist/
```

**预期输出**：
```
dist/
├── cli/
│   └── index.js
├── core/
│   ├── scanner.js
│   ├── fixer.js
│   └── detectors/
│       └── openclaw.js
├── types/
│   └── index.js
└── utils/
    ├── config.js
    ├── network.js
    └── process.js
```

---

## 发布到 npm

### 方式 1: 正式发布（推荐）

```bash
# 确认一切正常
npm run build
npm test

# 发布
npm publish

# 如果是作用域包（@username/package），需要公开发布
npm publish --access public
```

### 方式 2: 测试发布（先试试）

```bash
# 模拟发布，不会真正发布
npm publish --dry-run

# 查看会发布哪些文件
npm pack
tar -tzf agentguard-0.1.0.tgz
```

---

## 发布成功后验证

### 1. 在 npm 上查看

访问：https://www.npmjs.com/package/agentguard

应该能看到你的包！

### 2. 全局安装测试

```bash
# 在另一个目录测试
cd ~

# 全局安装
npm install -g agentguard

# 验证安装
agentguard --version
agentguard scan

# 卸载测试
npm uninstall -g agentguard
```

---

## 更新版本

当你需要更新包时：

### 1. 更新版本号

```bash
# 补丁版本（bug 修复）: 0.1.0 → 0.1.1
npm version patch

# 次要版本（新功能）: 0.1.1 → 0.2.0
npm version minor

# 主要版本（重大更新）: 0.2.0 → 1.0.0
npm version major
```

这会自动：
- 更新 `package.json` 中的版本号
- 创建 git commit
- 创建 git tag

### 2. 推送到 GitHub

```bash
git push origin main --tags
```

### 3. 重新发布

```bash
npm run build
npm publish
```

---

## 常见问题

### Q1: 发布时提示 "You do not have permission to publish"？

**A**: 可能是包名已被占用。解决方案：

1. **使用作用域包**（推荐）：
   ```json
   {
     "name": "@wanghui2323/agentguard"
   }
   ```
   发布时：
   ```bash
   npm publish --access public
   ```

2. **换个名字**：
   - `agentguard-cli`
   - `ai-agentguard`
   - `agent-security-guard`

### Q2: 发布后用户安装报错？

**A**: 检查：
1. `package.json` 的 `bin` 字段路径正确
2. `dist/cli/index.js` 第一行有 `#!/usr/bin/env node`
3. 文件权限正确：`chmod +x dist/cli/index.js`

### Q3: 如何撤销发布？

**A**: 发布后 72 小时内可以撤销：
```bash
npm unpublish agentguard@0.1.0
```

⚠️ **警告**：撤销后该版本号不能再使用

### Q4: 如何弃用某个版本？

**A**: 不建议使用某个版本时：
```bash
npm deprecate agentguard@0.1.0 "This version has security issues, please upgrade to 0.1.1"
```

---

## 发布检查清单

发布前确认：

- [ ] 已登录 npm (`npm whoami`)
- [ ] 包名可用 (`npm view agentguard`)
- [ ] package.json 信息完整
- [ ] README.md 文档完善
- [ ] LICENSE 文件存在
- [ ] 代码已构建 (`npm run build`)
- [ ] 测试通过 (`npm test`)
- [ ] .npmignore 配置正确
- [ ] 版本号合理
- [ ] Git 已提交并推送

---

## 自动化发布（可选）

使用 GitHub Actions 自动发布：

创建 `.github/workflows/publish.yml`：

```yaml
name: Publish to npm

on:
  push:
    tags:
      - 'v*'

jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          registry-url: 'https://registry.npmjs.org'
      - run: npm install
      - run: npm run build
      - run: npm test
      - run: npm publish
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```

配置 NPM_TOKEN：
1. 访问 https://www.npmjs.com/settings/your-username/tokens
2. 创建 Automation token
3. 在 GitHub 仓库 Settings → Secrets 添加 `NPM_TOKEN`

---

## 维护建议

### 版本规划
- **0.1.x**: 初始版本，OpenClaw 支持
- **0.2.x**: 添加 Claude Desktop、Cursor 支持
- **0.3.x**: Token 统计、报告导出
- **1.0.0**: 功能完善，稳定版本

### 文档维护
- 每次发布更新 CHANGELOG.md
- 在 GitHub Releases 添加发布说明
- 更新 README 安装示例

### 用户反馈
- 监控 npm 下载量
- 及时回复 GitHub Issues
- 收集用户建议改进

---

**准备好了吗？开始发布！** 🚀

如果遇到问题，随时告诉我！
