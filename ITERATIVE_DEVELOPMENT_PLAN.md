# AgentGuard 渐进式开发计划

**理念**: 整体功能一起迭代，保持任务长时间推进，每个小步骤都能产生可用的增量价值

---

## 🎯 总体目标

将AgentGuard从"监控工具"升级为"AI工具生态管理平台"

**核心功能线**:
1. **OpenClaw管理器** - 一键安装/卸载/管理
2. **数据可视化** - 历史趋势和成本分析
3. **智能优化** - AI驱动的使用建议
4. **生态扩展** - 更多工具支持

---

## 📅 渐进式迭代计划

### 迭代周期设计

**每个迭代周期**: 2-3天
**每次交付**: 可用的功能增量
**测试验证**: 每个迭代后都可测试

---

## 🚀 Sprint 1: OpenClaw管理器基础 (Week 1)

### Day 1: 架构搭建 + 基础安装器

**目标**: 建立OpenClaw管理器的基础架构，实现最简单的npm安装

**任务分解**:

#### Task 1.1: 创建目录结构 (30分钟)
```bash
mkdir -p src/core/openclaw-manager/{installer,uninstaller,controller,config}
mkdir -p src/core/openclaw-manager/types
```

**可交付成果**:
- ✅ 清晰的目录结构
- ✅ 符合项目规范

#### Task 1.2: 定义接口和类型 (1小时)
```typescript
// src/core/openclaw-manager/types/index.ts

export interface InstallOptions {
  source: 'npm' | 'github';
  version?: string;
  preset: 'secure' | 'development';
  global?: boolean;
}

export interface InstallResult {
  success: boolean;
  installPath: string;
  config: OpenClawConfig;
  error?: string;
}

export interface OpenClawConfig {
  bind: string;
  port: number;
  auth: boolean;
  token?: string;
  dmPolicy: 'restrictive' | 'permissive';
  sandbox: boolean;
}
```

**可交付成果**:
- ✅ 完整的TypeScript接口定义
- ✅ 清晰的类型系统

#### Task 1.3: 实现基础NpmInstaller (2-3小时)
```typescript
// src/core/openclaw-manager/installer/NpmInstaller.ts

import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export class NpmInstaller {
  /**
   * 检查npm是否可用
   */
  async checkNpm(): Promise<boolean> {
    try {
      await execAsync('npm --version');
      return true;
    } catch {
      return false;
    }
  }

  /**
   * 安装OpenClaw
   */
  async install(version?: string): Promise<string> {
    const packageName = version ? `openclaw@${version}` : 'openclaw';

    console.log(`Installing ${packageName}...`);

    try {
      const { stdout } = await execAsync(`npm install -g ${packageName}`);
      console.log(stdout);

      // 获取安装路径
      const { stdout: installPath } = await execAsync('npm root -g');
      return installPath.trim() + '/openclaw';
    } catch (error) {
      throw new Error(`Installation failed: ${error.message}`);
    }
  }

  /**
   * 检查OpenClaw是否已安装
   */
  async isInstalled(): Promise<boolean> {
    try {
      await execAsync('openclaw --version');
      return true;
    } catch {
      return false;
    }
  }

  /**
   * 获取已安装版本
   */
  async getInstalledVersion(): Promise<string | null> {
    try {
      const { stdout } = await execAsync('openclaw --version');
      return stdout.trim();
    } catch {
      return null;
    }
  }
}
```

**可交付成果**:
- ✅ 可以通过npm安装OpenClaw
- ✅ 可以检测安装状态
- ✅ 基本错误处理

**测试方式**:
```typescript
// 手动测试
const installer = new NpmInstaller();
const isInstalled = await installer.isInstalled();
if (!isInstalled) {
  await installer.install();
}
```

#### Task 1.4: 添加基础CLI命令 (1小时)
```typescript
// src/cli/commands/openclaw.ts

import { Command } from 'commander';
import { NpmInstaller } from '../../core/openclaw-manager/installer/NpmInstaller';

export function registerOpenClawCommands(program: Command) {
  const openclaw = program
    .command('openclaw')
    .description('Manage OpenClaw installation');

  openclaw
    .command('install')
    .description('Install OpenClaw')
    .option('--version <version>', 'Specify version')
    .action(async (options) => {
      console.log('🚀 Installing OpenClaw...\n');

      const installer = new NpmInstaller();

      // 检查是否已安装
      if (await installer.isInstalled()) {
        const version = await installer.getInstalledVersion();
        console.log(`✅ OpenClaw ${version} is already installed`);
        return;
      }

      try {
        const installPath = await installer.install(options.version);
        console.log(`\n✅ OpenClaw installed successfully!`);
        console.log(`📍 Installation path: ${installPath}`);
      } catch (error) {
        console.error(`\n❌ Installation failed: ${error.message}`);
        process.exit(1);
      }
    });

  openclaw
    .command('status')
    .description('Check OpenClaw installation status')
    .action(async () => {
      const installer = new NpmInstaller();

      if (await installer.isInstalled()) {
        const version = await installer.getInstalledVersion();
        console.log(`✅ OpenClaw ${version} is installed`);
      } else {
        console.log(`❌ OpenClaw is not installed`);
        console.log(`   Run: agentguard openclaw install`);
      }
    });
}
```

**可交付成果**:
- ✅ `agentguard openclaw install` 可用
- ✅ `agentguard openclaw status` 可用
- ✅ 友好的输出信息

**Day 1 总结**:
- ✅ 基础架构搭建完成
- ✅ npm方式安装OpenClaw可用
- ✅ CLI命令可用
- ✅ 可以测试和演示

---

### Day 2: 安全配置生成

**目标**: 自动生成安全的OpenClaw配置

#### Task 2.1: 实现ConfigGenerator (2小时)
```typescript
// src/core/openclaw-manager/config/ConfigGenerator.ts

import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

export class ConfigGenerator {
  private readonly configDir = path.join(os.homedir(), '.openclaw');
  private readonly configPath = path.join(this.configDir, 'config.json');

  /**
   * 生成强随机令牌
   */
  generateToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * 生成安全配置
   */
  generateSecureConfig(options: {
    bind?: string;
    port?: number;
  } = {}): OpenClawConfig {
    return {
      bind: options.bind || '127.0.0.1',
      port: options.port || 18789,
      auth: true,
      token: this.generateToken(),
      dmPolicy: 'restrictive',
      sandbox: true,
      allowedWorkspaces: [path.join(os.homedir(), 'projects')],
      rateLimit: 100,
      logLevel: 'info'
    };
  }

  /**
   * 生成开发配置
   */
  generateDevConfig(): OpenClawConfig {
    return {
      bind: '0.0.0.0',
      port: 18789,
      auth: true,
      token: this.generateToken(),
      dmPolicy: 'permissive',
      sandbox: false,
      logLevel: 'debug'
    };
  }

  /**
   * 保存配置
   */
  async saveConfig(config: OpenClawConfig): Promise<void> {
    // 创建目录
    if (!fs.existsSync(this.configDir)) {
      fs.mkdirSync(this.configDir, { recursive: true });
    }

    // 保存配置
    fs.writeFileSync(
      this.configPath,
      JSON.stringify(config, null, 2),
      'utf-8'
    );

    // 保存令牌到单独文件（方便复制）
    const tokenPath = path.join(this.configDir, 'token');
    fs.writeFileSync(tokenPath, config.token || '', 'utf-8');

    // 设置文件权限（仅所有者可读写）
    fs.chmodSync(this.configPath, 0o600);
    fs.chmodSync(tokenPath, 0o600);
  }

  /**
   * 读取配置
   */
  async loadConfig(): Promise<OpenClawConfig | null> {
    try {
      if (!fs.existsSync(this.configPath)) {
        return null;
      }

      const content = fs.readFileSync(this.configPath, 'utf-8');
      return JSON.parse(content);
    } catch {
      return null;
    }
  }
}
```

**可交付成果**:
- ✅ 自动生成安全配置
- ✅ 自动生成强随机令牌
- ✅ 配置文件权限保护

#### Task 2.2: 集成到安装流程 (1小时)
```typescript
// 更新 openclaw install 命令

openclaw
  .command('install')
  .option('--preset <type>', 'Config preset (secure|dev)', 'secure')
  .action(async (options) => {
    const installer = new NpmInstaller();
    const configGen = new ConfigGenerator();

    // 1. 安装
    const installPath = await installer.install();

    // 2. 生成配置
    const config = options.preset === 'dev'
      ? configGen.generateDevConfig()
      : configGen.generateSecureConfig();

    await configGen.saveConfig(config);

    // 3. 显示信息
    console.log(`\n✅ OpenClaw installed successfully!\n`);
    console.log(`📍 Installation: ${installPath}`);
    console.log(`🔧 Config: ~/.openclaw/config.json`);
    console.log(`🔑 Token: ${config.token}\n`);
    console.log(`🌐 Start with:`);
    console.log(`   openclaw --config ~/.openclaw/config.json\n`);
    console.log(`📊 Access:`);
    console.log(`   http://${config.bind}:${config.port}`);
    console.log(`   Token: ${config.token}`);
  });
```

**可交付成果**:
- ✅ 安装后自动生成配置
- ✅ 清晰的安装完成提示
- ✅ 包含访问信息

**Day 2 总结**:
- ✅ 安全配置自动生成
- ✅ 安装体验完整
- ✅ 可以完整演示安装流程

---

### Day 3: 服务控制

**目标**: 实现OpenClaw的启动/停止/状态查询

#### Task 3.1: 实现ServiceController (2-3小时)
```typescript
// src/core/openclaw-manager/controller/ServiceController.ts

import { exec, spawn } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

const execAsync = promisify(exec);

export class ServiceController {
  private readonly pidFile = path.join(os.homedir(), '.openclaw', 'openclaw.pid');
  private readonly logFile = path.join(os.homedir(), '.openclaw', 'logs', 'openclaw.log');

  /**
   * 启动OpenClaw
   */
  async start(configPath?: string): Promise<void> {
    // 检查是否已在运行
    if (await this.isRunning()) {
      throw new Error('OpenClaw is already running');
    }

    // 确保日志目录存在
    const logDir = path.dirname(this.logFile);
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }

    // 启动进程
    const config = configPath || path.join(os.homedir(), '.openclaw', 'config.json');
    const child = spawn('openclaw', ['--config', config], {
      detached: true,
      stdio: ['ignore', 'ignore', 'ignore']
    });

    // 保存PID
    fs.writeFileSync(this.pidFile, child.pid!.toString(), 'utf-8');

    // 分离进程
    child.unref();

    // 等待启动
    await this.waitForStartup();
  }

  /**
   * 停止OpenClaw
   */
  async stop(): Promise<void> {
    const pid = await this.getPid();

    if (!pid) {
      throw new Error('OpenClaw is not running');
    }

    try {
      process.kill(pid, 'SIGTERM');

      // 等待进程结束
      await this.waitForShutdown(pid);

      // 删除PID文件
      if (fs.existsSync(this.pidFile)) {
        fs.unlinkSync(this.pidFile);
      }
    } catch (error) {
      throw new Error(`Failed to stop OpenClaw: ${error.message}`);
    }
  }

  /**
   * 重启OpenClaw
   */
  async restart(configPath?: string): Promise<void> {
    if (await this.isRunning()) {
      await this.stop();
    }
    await this.start(configPath);
  }

  /**
   * 检查是否运行
   */
  async isRunning(): Promise<boolean> {
    const pid = await this.getPid();

    if (!pid) {
      return false;
    }

    try {
      // 发送信号0检查进程是否存在
      process.kill(pid, 0);
      return true;
    } catch {
      // 进程不存在，清理PID文件
      if (fs.existsSync(this.pidFile)) {
        fs.unlinkSync(this.pidFile);
      }
      return false;
    }
  }

  /**
   * 获取PID
   */
  private async getPid(): Promise<number | null> {
    try {
      if (!fs.existsSync(this.pidFile)) {
        return null;
      }

      const pidStr = fs.readFileSync(this.pidFile, 'utf-8').trim();
      return parseInt(pidStr, 10);
    } catch {
      return null;
    }
  }

  /**
   * 等待启动完成
   */
  private async waitForStartup(timeout = 10000): Promise<void> {
    const startTime = Date.now();

    while (Date.now() - startTime < timeout) {
      try {
        // 尝试连接检查
        const response = await fetch('http://127.0.0.1:18789/health');
        if (response.ok) {
          return;
        }
      } catch {
        // 继续等待
      }

      await new Promise(resolve => setTimeout(resolve, 500));
    }

    throw new Error('Startup timeout');
  }

  /**
   * 等待进程结束
   */
  private async waitForShutdown(pid: number, timeout = 5000): Promise<void> {
    const startTime = Date.now();

    while (Date.now() - startTime < timeout) {
      try {
        process.kill(pid, 0);
        await new Promise(resolve => setTimeout(resolve, 200));
      } catch {
        // 进程已结束
        return;
      }
    }

    // 超时，强制kill
    try {
      process.kill(pid, 'SIGKILL');
    } catch {
      // 忽略错误
    }
  }
}
```

**可交付成果**:
- ✅ 可以启动OpenClaw
- ✅ 可以停止OpenClaw
- ✅ 可以查询运行状态
- ✅ 进程管理健壮

#### Task 3.2: 添加CLI命令 (1小时)
```typescript
openclaw
  .command('start')
  .description('Start OpenClaw')
  .action(async () => {
    const controller = new ServiceController();

    try {
      await controller.start();
      console.log('✅ OpenClaw started successfully');
    } catch (error) {
      console.error(`❌ ${error.message}`);
      process.exit(1);
    }
  });

openclaw
  .command('stop')
  .description('Stop OpenClaw')
  .action(async () => {
    const controller = new ServiceController();

    try {
      await controller.stop();
      console.log('✅ OpenClaw stopped');
    } catch (error) {
      console.error(`❌ ${error.message}`);
      process.exit(1);
    }
  });

openclaw
  .command('status')
  .description('Check OpenClaw status')
  .action(async () => {
    const controller = new ServiceController();
    const installer = new NpmInstaller();

    const isInstalled = await installer.isInstalled();
    const isRunning = await controller.isRunning();

    console.log('\nOpenClaw Status:\n');
    console.log(`Installation: ${isInstalled ? '✅ Installed' : '❌ Not installed'}`);
    console.log(`Service: ${isRunning ? '● Running' : '○ Stopped'}`);

    if (isInstalled) {
      const version = await installer.getInstalledVersion();
      console.log(`Version: ${version}`);
    }
  });
```

**可交付成果**:
- ✅ 完整的服务控制命令
- ✅ 友好的状态显示

**Day 3 总结**:
- ✅ OpenClaw完整生命周期管理
- ✅ 可以演示完整工作流：安装→启动→停止→卸载

---

## 🎯 Sprint 1总结（Day 1-3）

**已完成功能**:
1. ✅ OpenClaw一键安装（npm方式）
2. ✅ 自动安全配置生成
3. ✅ 服务启动/停止/状态查询
4. ✅ CLI命令完整

**可演示场景**:
```bash
# 完整工作流
agentguard openclaw install          # 安装
agentguard openclaw start            # 启动
agentguard openclaw status           # 查询状态
agentguard scan                      # 扫描（已有功能）
agentguard openclaw stop             # 停止
```

**用户价值**:
- ✅ 5分钟内开始使用OpenClaw
- ✅ 自动安全配置
- ✅ 统一管理入口

---

## 📊 后续Sprint预览

### Sprint 2: 数据可视化 (Day 4-6)
- 历史数据记录
- 成本趋势图表
- 对比分析

### Sprint 3: Web升级 (Day 7-9)
- Web集成autoTrackerManager
- 实时图表
- WebSocket更新

### Sprint 4: 智能优化 (Day 10-12)
- 优化建议引擎
- 异常检测
- 预算管理增强

---

## 💡 渐进式开发原则

### 1. 小步快跑
- 每个任务2-4小时完成
- 每天都有可演示成果
- 及时获得反馈

### 2. 持续集成
- 每个功能完成后立即测试
- 保持代码可运行
- 不累积技术债

### 3. 增量价值
- 每个迭代都增加实用功能
- 优先高价值功能
- 快速验证假设

### 4. 灵活调整
- 根据反馈调整优先级
- 发现更好方案及时切换
- 不死守计划

---

## 🚀 下一步行动

**立即开始**:
```bash
# 1. 创建分支
git checkout -b feature/openclaw-manager

# 2. 开始Day 1 Task 1.1
mkdir -p src/core/openclaw-manager/{installer,uninstaller,controller,config,types}

# 3. 完成后提交
git add .
git commit -m "feat: OpenClaw管理器基础架构"

# 4. 继续下一个任务
```

**保持节奏**:
- 每完成一个Task就提交代码
- 每天都推送到GitHub
- 每个Sprint结束发布一个小版本

---

**Let's start building! 🚀**
