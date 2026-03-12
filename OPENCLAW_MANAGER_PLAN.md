# OpenClaw管理器功能规划

**目标**: 在AgentGuard中实现OpenClaw的一键安装、卸载、升级和管理

---

## 🎯 核心功能

### 1. 一键安装 OpenClaw

**功能**:
```bash
agentguard install openclaw
# 或
agentguard openclaw:install
```

**安装步骤**:
```typescript
1. 检测系统环境
   - 检查Node.js版本 (≥18.0.0)
   - 检查npm/yarn可用性
   - 检查磁盘空间 (需要~200MB)
   - 检查端口18789是否被占用

2. 下载OpenClaw
   方式A: 从npm安装 (推荐)
   - npm install -g openclaw@latest

   方式B: 从GitHub克隆 (开发版)
   - git clone https://github.com/cline/openclaw.git
   - cd openclaw && npm install && npm run build

3. 初始化配置
   - 创建 ~/.openclaw/config.json
   - 设置默认安全配置:
     * bind: "127.0.0.1" (仅本地)
     * auth: true (启用认证)
     * token: 生成强随机令牌
     * dmPolicy: "restrictive" (限制DM策略)
     * sandbox: true (启用沙箱)

4. 启动验证
   - 启动OpenClaw服务
   - 检查端口18789是否响应
   - 运行安全扫描
   - 显示安装结果和访问信息

5. 可选：注册为系统服务
   - macOS: launchd
   - Linux: systemd
   - Windows: NSSM
```

**交互式安装**:
```bash
? 选择安装方式: (Use arrow keys)
  ❯ Stable (npm) - 推荐
    Latest (GitHub) - 开发版
    Custom - 指定版本

? 选择配置模式:
  ❯ Secure (推荐) - 安全配置，仅本地访问
    Development - 开发配置，允许网络访问
    Custom - 自定义配置

? 是否注册为系统服务？(Y/n)

? 安装位置:
  ❯ Global (/usr/local/bin)
    User (~/.local/bin)
    Custom
```

**安装完成提示**:
```
✅ OpenClaw 安装成功！

📍 安装位置: /usr/local/lib/node_modules/openclaw
🔧 配置文件: ~/.openclaw/config.json
🔑 访问令牌: abc123xyz... (已保存)

🚀 启动命令:
   agentguard start openclaw
   或
   openclaw --config ~/.openclaw/config.json

🌐 访问地址:
   http://127.0.0.1:18789
   Token: abc123xyz...

📊 安全评分: 95/100 ✅

💡 提示:
   - 令牌已保存到 ~/.openclaw/token
   - 运行 'agentguard scan' 查看完整安全报告
   - 运行 'agentguard openclaw:status' 查看状态
```

---

### 2. 一键卸载 OpenClaw

**功能**:
```bash
agentguard uninstall openclaw
# 或
agentguard openclaw:uninstall
```

**卸载步骤**:
```typescript
1. 检查运行状态
   - 检测OpenClaw是否正在运行
   - 如果运行中，询问是否停止

2. 停止服务
   - 停止OpenClaw进程
   - 如果注册了系统服务，停止并注销服务

3. 备份数据 (可选)
   - 备份配置文件到 ~/.openclaw.backup/
   - 备份工作空间数据 (如果有)
   - 生成备份清单

4. 删除文件
   - 删除程序文件 (npm uninstall -g openclaw)
   - 询问是否删除配置文件 (~/.openclaw/)
   - 询问是否删除日志文件

5. 清理环境
   - 清理环境变量
   - 清理PATH
   - 清理系统服务注册

6. 验证卸载
   - 检查程序是否已删除
   - 检查配置是否已删除
   - 运行扫描确认
```

**交互式卸载**:
```bash
? 检测到OpenClaw正在运行，是否停止？(Y/n)

? 是否备份配置文件？(Y/n)
  备份位置: ~/.openclaw.backup/

? 是否删除以下内容：
  [✓] 程序文件
  [✓] 配置文件 (~/.openclaw/)
  [✓] 日志文件 (~/.openclaw/logs/)
  [ ] 工作空间数据 (~/.openclaw/workspaces/)

? 确认卸载？这将删除OpenClaw及其所有配置 (y/N)
```

**卸载完成提示**:
```
✅ OpenClaw 卸载成功！

📦 已删除:
   ✓ 程序文件 (/usr/local/lib/node_modules/openclaw)
   ✓ 配置文件 (~/.openclaw/config.json)
   ✓ 系统服务 (openclaw.service)

💾 已备份:
   ✓ 配置文件 → ~/.openclaw.backup/config.json
   ✓ 令牌文件 → ~/.openclaw.backup/token

📊 扫描结果:
   OpenClaw: 未检测到 ✅

💡 如需重新安装:
   agentguard install openclaw
```

---

### 3. 升级 OpenClaw

**功能**:
```bash
agentguard upgrade openclaw
# 或
agentguard openclaw:upgrade
```

**升级步骤**:
```typescript
1. 检查当前版本
   - 读取已安装版本
   - 检查最新可用版本

2. 备份当前配置
   - 自动备份配置文件
   - 记录当前版本信息

3. 升级程序
   - npm update -g openclaw
   或
   - cd openclaw && git pull && npm install && npm run build

4. 迁移配置
   - 检查配置兼容性
   - 自动迁移配置到新版本
   - 合并新增配置项

5. 重启服务
   - 停止旧版本
   - 启动新版本
   - 验证升级成功

6. 安全扫描
   - 运行安全扫描
   - 对比升级前后安全评分
```

---

### 4. OpenClaw状态管理

**功能**:
```bash
agentguard openclaw:status    # 查看状态
agentguard openclaw:start     # 启动
agentguard openclaw:stop      # 停止
agentguard openclaw:restart   # 重启
agentguard openclaw:logs      # 查看日志
agentguard openclaw:config    # 查看/编辑配置
```

**状态信息**:
```
OpenClaw 状态报告
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📊 基本信息:
   状态: ● 运行中 (PID 12345)
   版本: v1.2.3
   运行时间: 2天 5小时 30分钟
   端口: 127.0.0.1:18789

🔒 安全状态:
   评分: 92/100 ✅
   认证: ✅ 已启用
   绑定: ✅ 仅本地 (127.0.0.1)
   沙箱: ✅ 已启用

💰 Token使用 (今日):
   请求数: 1,234 次
   成本: $15.67
   输入: 2.3M tokens
   输出: 1.1M tokens

📁 配置:
   配置文件: ~/.openclaw/config.json
   日志目录: ~/.openclaw/logs/
   工作空间: ~/.openclaw/workspaces/

⚡ 最近活动:
   [14:23] API请求: 生成代码 (145 tokens)
   [14:20] API请求: 代码审查 (892 tokens)
   [14:15] 配置更新: DM策略改为restrictive
```

---

### 5. 配置管理

**功能**:
```bash
agentguard openclaw:config:get <key>     # 读取配置
agentguard openclaw:config:set <key> <value>  # 设置配置
agentguard openclaw:config:reset         # 重置为默认
agentguard openclaw:config:validate      # 验证配置
agentguard openclaw:config:export        # 导出配置
agentguard openclaw:config:import <file> # 导入配置
```

**安全配置模板**:
```json
{
  "presets": {
    "secure": {
      "bind": "127.0.0.1",
      "port": 18789,
      "auth": true,
      "tokenStrength": "strong",
      "dmPolicy": "restrictive",
      "sandbox": true,
      "allowedWorkspaces": ["~/projects"],
      "rateLimit": 100,
      "logLevel": "info"
    },
    "development": {
      "bind": "0.0.0.0",
      "port": 18789,
      "auth": true,
      "tokenStrength": "medium",
      "dmPolicy": "permissive",
      "sandbox": false,
      "logLevel": "debug"
    }
  }
}
```

---

## 🏗️ 技术实现

### 架构设计

```typescript
// src/core/openclaw-manager/

├── OpenClawManager.ts           // 主管理器
├── installer/
│   ├── Installer.ts            // 安装器
│   ├── NpmInstaller.ts         // npm安装
│   ├── GitInstaller.ts         // Git克隆安装
│   └── ConfigGenerator.ts      // 配置生成
├── uninstaller/
│   ├── Uninstaller.ts          // 卸载器
│   └── BackupManager.ts        // 备份管理
├── updater/
│   ├── Updater.ts              // 升级器
│   └── VersionManager.ts       // 版本管理
├── controller/
│   ├── ServiceController.ts    // 服务控制
│   └── ProcessManager.ts       // 进程管理
└── config/
    ├── ConfigManager.ts        // 配置管理
    └── presets/                // 配置模板
        ├── secure.json
        └── development.json
```

### 核心代码示例

```typescript
// src/core/openclaw-manager/OpenClawManager.ts

export class OpenClawManager {
  private installer: Installer;
  private uninstaller: Uninstaller;
  private updater: Updater;
  private controller: ServiceController;
  private configManager: ConfigManager;

  /**
   * 一键安装
   */
  async install(options: InstallOptions): Promise<InstallResult> {
    // 1. 环境检查
    await this.checkEnvironment();

    // 2. 选择安装方式
    const installer = options.source === 'npm'
      ? new NpmInstaller()
      : new GitInstaller();

    // 3. 下载安装
    const installPath = await installer.install(options.version);

    // 4. 生成配置
    const config = await this.configManager.generate(options.preset);
    await this.configManager.save(config);

    // 5. 启动验证
    await this.controller.start();
    await this.verifyInstallation();

    // 6. 安全扫描
    const scanResult = await this.scanner.scan();

    return {
      success: true,
      installPath,
      config,
      scanResult,
      accessInfo: {
        url: `http://${config.bind}:${config.port}`,
        token: config.token
      }
    };
  }

  /**
   * 一键卸载
   */
  async uninstall(options: UninstallOptions): Promise<UninstallResult> {
    // 1. 检查运行状态
    const isRunning = await this.controller.isRunning();
    if (isRunning && options.stopIfRunning) {
      await this.controller.stop();
    }

    // 2. 备份
    if (options.backup) {
      await this.uninstaller.backup();
    }

    // 3. 删除文件
    await this.uninstaller.removeFiles(options.removeConfig);

    // 4. 清理环境
    await this.uninstaller.cleanup();

    // 5. 验证
    const verified = await this.verifyUninstallation();

    return {
      success: verified,
      backupPath: options.backup ? '~/.openclaw.backup/' : undefined,
      removedFiles: this.uninstaller.getRemovedFiles()
    };
  }

  /**
   * 升级
   */
  async upgrade(options: UpgradeOptions): Promise<UpgradeResult> {
    const currentVersion = await this.getVersion();
    const latestVersion = await this.updater.getLatestVersion();

    if (currentVersion === latestVersion) {
      return { success: true, message: 'Already up to date' };
    }

    // 备份配置
    await this.uninstaller.backup();

    // 升级
    await this.updater.upgrade(latestVersion);

    // 迁移配置
    await this.configManager.migrate(currentVersion, latestVersion);

    // 重启
    await this.controller.restart();

    return {
      success: true,
      oldVersion: currentVersion,
      newVersion: latestVersion,
      configMigrated: true
    };
  }
}
```

---

## 🎨 CLI命令设计

### 主命令

```bash
agentguard openclaw [command] [options]
```

### 子命令

```bash
# 安装
agentguard openclaw:install [--source npm|github] [--preset secure|dev]
agentguard openclaw:install --version 1.2.3
agentguard openclaw:install --custom  # 自定义安装

# 卸载
agentguard openclaw:uninstall [--backup] [--keep-config]

# 升级
agentguard openclaw:upgrade [--to version]
agentguard openclaw:upgrade --check  # 仅检查更新

# 控制
agentguard openclaw:start
agentguard openclaw:stop
agentguard openclaw:restart
agentguard openclaw:status

# 配置
agentguard openclaw:config:get bind
agentguard openclaw:config:set bind 127.0.0.1
agentguard openclaw:config:reset
agentguard openclaw:config:edit  # 用编辑器打开

# 日志
agentguard openclaw:logs [--tail 100] [--follow]

# 工具
agentguard openclaw:doctor  # 诊断问题
agentguard openclaw:repair  # 修复问题
```

---

## 📊 优先级建议

### Phase 1 (MVP - 2周)
**必需功能，优先实现**:
1. ✅ OpenClaw检测 (已完成)
2. ⭐ 一键安装 (npm方式)
3. ⭐ 一键卸载
4. ⭐ 启动/停止控制
5. ⭐ 状态查询

### Phase 2 (增强 - 1周)
**重要但不紧急**:
1. 升级功能
2. 配置管理
3. Git方式安装
4. 备份恢复
5. 日志查看

### Phase 3 (完善 - 1周)
**锦上添花**:
1. 系统服务注册
2. 配置模板
3. 诊断修复工具
4. 交互式安装向导
5. Web UI集成

---

## 💡 AgentGuard的独特优势

相比直接使用OpenClaw官方安装：

1. **安全默认配置** - 自动设置最安全的配置
2. **一键安装** - 无需手动配置
3. **集成监控** - 安装后自动监控Token使用
4. **安全扫描** - 安装后立即扫描安全风险
5. **统一管理** - 在AgentGuard中管理所有AI工具
6. **备份恢复** - 自动备份配置
7. **版本管理** - 轻松升级回退

---

## 🚀 实施建议

### 立即开始 (本周)
```bash
# 1. 创建目录结构
mkdir -p src/core/openclaw-manager/{installer,uninstaller,updater,controller,config}

# 2. 实现基础Installer
touch src/core/openclaw-manager/installer/NpmInstaller.ts

# 3. 实现基础Controller
touch src/core/openclaw-manager/controller/ServiceController.ts

# 4. 添加CLI命令
# 更新 src/cli/index.ts 添加 openclaw 命令组
```

### 测试计划
```bash
# 1. 单元测试
npm test -- openclaw-manager

# 2. 集成测试
agentguard openclaw:install --dry-run  # 模拟安装
agentguard openclaw:install --test     # 测试环境安装

# 3. 真实测试
agentguard openclaw:install            # 真实安装
agentguard openclaw:status             # 验证状态
agentguard scan                        # 安全扫描
agentguard openclaw:uninstall --backup # 卸载
```

---

## 📝 注意事项

### 权限问题
- macOS/Linux可能需要sudo权限（global安装）
- 建议支持用户级安装（~/.local/bin）
- Windows需要管理员权限

### 兼容性
- 支持多种OpenClaw版本
- 配置向后兼容
- 优雅降级处理

### 错误处理
- 网络问题（npm下载失败）
- 权限问题（无法写入）
- 端口冲突（18789被占用）
- 版本冲突（依赖不兼容）

### 用户体验
- 进度显示（安装进度条）
- 错误提示清晰
- 支持--yes跳过确认
- 支持--quiet静默模式

---

**总结**: 这个功能将使AgentGuard成为OpenClaw的完整管理工具，大大提升用户体验！
