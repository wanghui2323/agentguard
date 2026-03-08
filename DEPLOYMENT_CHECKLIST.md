# 🚀 AgentGuard 部署检查清单

## 📋 发布到 GitHub 前的准备

### 1. 代码质量检查
- [x] 所有核心功能已实现
- [x] 代码结构清晰、模块化
- [x] TypeScript 类型定义完整
- [ ] 单元测试覆盖（目标 70%+）
- [ ] 运行 `npm run lint` 无错误
- [ ] 运行 `npm run build` 成功

### 2. 文档完整性
- [x] README.md 完整
- [x] CONTRIBUTING.md 有贡献指南
- [x] QUICKSTART.md 有快速开始
- [x] LICENSE 文件存在
- [x] PROJECT_SUMMARY.md 有项目总结
- [ ] API 文档（可选）
- [ ] CHANGELOG.md（首个版本可暂无）

### 3. 配置文件检查
- [x] package.json 信息完整
  - [x] name, version, description
  - [x] repository URL
  - [x] keywords
  - [x] author, license
  - [ ] ⚠️ 需要更新 repository URL
- [x] .gitignore 正确配置
- [x] tsconfig.json 配置合理

### 4. Git 仓库准备
- [x] 初始化 Git 仓库
- [x] 创建初始提交
- [ ] 创建 .github/ 目录（可选）
  - [ ] ISSUE_TEMPLATE/
  - [ ] PULL_REQUEST_TEMPLATE.md
  - [ ] workflows/ (GitHub Actions)

## 🌐 GitHub 发布步骤

### 步骤 1: 在 GitHub 创建仓库

```bash
# 在 GitHub 上创建新仓库（推荐仓库名：agentguard）
# 不要初始化 README、.gitignore 或 License（本地已有）
```

### 步骤 2: 连接远程仓库

```bash
# 替换为你的 GitHub 用户名
git remote add origin https://github.com/YOUR_USERNAME/agentguard.git

# 或使用 SSH
git remote add origin git@github.com:YOUR_USERNAME/agentguard.git
```

### 步骤 3: 推送代码

```bash
git branch -M main
git push -u origin main
```

### 步骤 4: 设置仓库信息

在 GitHub 仓库页面设置：
- [ ] Description: "Security control center for local AI agents"
- [ ] Topics: `ai`, `security`, `agent-monitoring`, `claude`, `cursor`, `typescript`
- [ ] Website: 留空或填写文档站点
- [ ] Enable Issues
- [ ] Enable Discussions（推荐）

### 步骤 5: 创建第一个 Release

```bash
# 打标签
git tag -a v0.1.0 -m "Release v0.1.0: MVP with OpenClaw support"
git push origin v0.1.0
```

在 GitHub 上创建 Release：
- Tag: v0.1.0
- Title: v0.1.0 - Initial MVP Release
- Description: 使用 PROJECT_SUMMARY.md 中的内容

## 📦 NPM 发布（可选）

### 准备工作

1. **注册 NPM 账号**
   ```bash
   npm login
   ```

2. **检查包名是否可用**
   ```bash
   npm search agentguard
   ```

3. **更新 package.json**
   ```json
   {
     "name": "agentguard",
     "version": "0.1.0",
     "publishConfig": {
       "access": "public"
     }
   }
   ```

### 发布步骤

```bash
# 构建
npm run build

# 测试本地安装
npm pack
npm install -g agentguard-0.1.0.tgz
agentguard scan

# 发布到 NPM
npm publish
```

### 发布后验证

```bash
npm info agentguard
npm install -g agentguard
agentguard --version
```

## 🍺 Homebrew 发布（可选，macOS）

### 1. 创建 Formula

```ruby
# Formula/agentguard.rb
class Agentguard < Formula
  desc "Security control center for local AI agents"
  homepage "https://github.com/YOUR_USERNAME/agentguard"
  url "https://github.com/YOUR_USERNAME/agentguard/archive/v0.1.0.tar.gz"
  sha256 "..." # 使用 shasum -a 256 计算
  license "MIT"

  depends_on "node"

  def install
    system "npm", "install", *std_npm_args
    bin.install_symlink Dir["#{libexec}/bin/*"]
  end

  test do
    system "#{bin}/agentguard", "--version"
  end
end
```

### 2. 提交到 homebrew-core（或创建自己的 tap）

```bash
# 创建自己的 tap
brew tap YOUR_USERNAME/agentguard
brew install agentguard
```

## 🎉 发布后的工作

### 社区推广

- [ ] 在 Product Hunt 发布（可选）
- [ ] 在 Hacker News 分享（可选）
- [ ] 在 Reddit r/opensource 分享
- [ ] 在 Twitter/X 发布
- [ ] 在相关论坛/社区分享（如 OpenClaw 社区）

### 文档站点（可选）

使用以下工具创建文档站点：
- Docusaurus
- VitePress
- GitBook

### 持续集成（推荐）

创建 `.github/workflows/ci.yml`:

```yaml
name: CI

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm install
      - run: npm run lint
      - run: npm run build
      - run: npm test
```

### 监控和分析

- [ ] 设置 GitHub Stars 监控
- [ ] 添加 GitHub Insights 跟踪
- [ ] 使用 npm 下载统计

## 🐛 Issue 模板

创建 `.github/ISSUE_TEMPLATE/bug_report.md`:

```markdown
---
name: Bug Report
about: Report a bug
---

**Describe the bug**
A clear description of the bug.

**To Reproduce**
Steps to reproduce:
1. ...

**Expected behavior**
What you expected to happen.

**Environment:**
- OS: [e.g., macOS 13.0]
- Node version: [e.g., 18.0.0]
- AgentGuard version: [e.g., 0.1.0]

**Additional context**
Any other context.
```

## ✅ 发布前最终检查

- [ ] 所有代码已提交
- [ ] 版本号正确（package.json, git tag）
- [ ] README 中的链接全部有效
- [ ] LICENSE 文件存在
- [ ] .gitignore 排除敏感文件
- [ ] 构建产物可用（npm run build）
- [ ] 本地测试通过
- [ ] 文档完整且易读

## 🎯 成功指标

第一个月目标：
- [ ] GitHub Stars: 50+
- [ ] Issues opened: 5+（说明有人在用）
- [ ] Contributors: 2+（除了作者）
- [ ] NPM downloads: 100+

## 📞 获取帮助

如果遇到问题：
- 查看 GitHub Docs: https://docs.github.com
- 查看 NPM Docs: https://docs.npmjs.com
- 提问在 GitHub Discussions

---

**准备好了吗？** 🚀

运行以下命令开始发布：

```bash
# 1. 连接 GitHub 仓库
git remote add origin https://github.com/YOUR_USERNAME/agentguard.git

# 2. 推送代码
git push -u origin main

# 3. 打标签
git tag -a v0.1.0 -m "Release v0.1.0"
git push origin v0.1.0

# 4. （可选）发布到 NPM
npm run build
npm publish
```

祝发布顺利！🎉
