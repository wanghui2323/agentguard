# 🚀 AgentGuard 版本发布检查清单

> 每次发布新版本时使用此清单确保流程完整

## 📝 发布前准备

### 1. 代码完成度检查
- [ ] 所有计划功能已实现
- [ ] 代码已通过 `npm run lint`
- [ ] 代码已格式化 `npm run format`
- [ ] 所有测试通过 `npm test`
- [ ] 本地测试通过 `npx tsx src/cli/index.ts scan`

### 2. 文档更新
- [ ] 更新 [README.md](README.md) - 新功能说明
- [ ] 更新 [README_EN.md](README_EN.md) - 英文版同步
- [ ] 更新 [CHANGELOG.md](CHANGELOG.md) - 记录所有变更
- [ ] 如有新功能，更新 [QUICKSTART.md](QUICKSTART.md)
- [ ] 检查所有文档中的版本号引用

### 3. 版本号更新
- [ ] 更新 [package.json](package.json) 中的 `version` 字段
- [ ] 确认版本号遵循语义化版本规范

### 4. 构建测试
- [ ] 运行 `npm run build` 确保构建成功
- [ ] 测试构建后的文件: `node dist/cli/index.js scan`
- [ ] 检查 dist/ 目录内容完整性

## 📦 创建 GitHub Release

### 5. Git 提交和标签
```bash
# 1. 提交所有变更
git add .
git commit -m "chore: prepare release vX.Y.Z

- Update version to X.Y.Z
- Update CHANGELOG
- Update documentation

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"

# 2. 创建版本标签
git tag -a vX.Y.Z -m "Release version X.Y.Z"

# 3. 推送到 GitHub
git push origin main
git push origin vX.Y.Z
```

### 6. 编写 Release Notes
创建 GitHub Release 时包含以下内容:

```markdown
# 🛡️ AgentGuard vX.Y.Z

## ✨ 新功能 (New Features)
- 功能1描述
- 功能2描述

## 🐛 Bug 修复 (Bug Fixes)
- 修复问题1
- 修复问题2

## 📈 改进 (Improvements)
- 性能优化1
- 用户体验改进2

## ⚠️ 已知问题 (Known Issues)
- 问题1及影响范围
- 问题2及计划修复版本

## 📦 安装方法 (Installation)

### 从源码安装
\`\`\`bash
git clone https://github.com/wanghui2323/agentguard.git
cd agentguard
npm install
npx tsx src/cli/index.ts scan
\`\`\`

### npm 安装 (如已发布)
\`\`\`bash
npm install -g agentguard
agentguard scan
\`\`\`

## 🔄 升级指南 (Upgrade Guide)
从 vX.Y.Z 升级的注意事项...

## 📊 测试环境
- macOS / Linux / Windows
- Node.js >= 18.0.0
- 测试状态: ✅ 通过

## 🙏 贡献者
感谢所有参与此版本的贡献者!
```

### 7. 上传附件 (可选)
- [ ] 如有预编译二进制文件,上传到 Release
- [ ] 上传完整的测试报告 (如 LATEST_TEST_RESULT.md)

## 📢 发布后

### 8. npm 发布 (如适用)
```bash
# 确保已登录 npm
npm login

# 发布到 npm
npm publish

# 验证发布成功
npm view agentguard
```

### 9. 通知和宣传
- [ ] 在项目 README 中更新"最新版本"徽章
- [ ] 在相关社区发布更新公告 (如适用)
- [ ] 更新项目网站 (如有)
- [ ] 关闭对应的 GitHub Issues/Milestones

### 10. 准备下一版本
- [ ] 创建 `vX.Y.Z+1` 的 Milestone
- [ ] 整理下一版本的待实现功能
- [ ] 更新 [ROADMAP.md](ROADMAP.md) (如有)

---

## 📌 快速命令参考

```bash
# 查看当前版本
npm version

# 自动更新版本号并创建 git tag
npm version patch   # 0.1.0 -> 0.1.1
npm version minor   # 0.1.0 -> 0.2.0
npm version major   # 0.1.0 -> 1.0.0

# 查看所有标签
git tag -l

# 删除错误的标签
git tag -d vX.Y.Z
git push origin :refs/tags/vX.Y.Z
```

---

## 🔗 相关文档
- [CHANGELOG.md](CHANGELOG.md) - 完整变更历史
- [PUBLISH_TO_NPM.md](PUBLISH_TO_NPM.md) - npm 发布指南
- [CONTRIBUTING.md](CONTRIBUTING.md) - 贡献指南
