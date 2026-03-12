# 快速开始开发 - OpenClaw管理器

**目标**: 30分钟内完成第一个可演示的功能

---

## 🚀 立即开始

### Step 1: 创建分支 (1分钟)

```bash
cd /Users/wanghui/Desktop/AI写作空间/agentguard
git checkout -b feature/openclaw-manager
```

### Step 2: 创建目录结构 (2分钟)

```bash
# 创建OpenClaw管理器目录
mkdir -p src/core/openclaw-manager/installer
mkdir -p src/core/openclaw-manager/uninstaller
mkdir -p src/core/openclaw-manager/controller
mkdir -p src/core/openclaw-manager/config
mkdir -p src/core/openclaw-manager/types

# 创建CLI命令目录
mkdir -p src/cli/commands

# 验证目录结构
tree src/core/openclaw-manager -L 2
```

### Step 3: 创建类型定义 (5分钟)

创建文件: `src/core/openclaw-manager/types/index.ts`

```typescript
/**
 * OpenClaw管理器类型定义
 */

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
  accessInfo: AccessInfo;
  error?: string;
}

export interface OpenClawConfig {
  bind: string;
  port: number;
  auth: boolean;
  token?: string;
  dmPolicy: 'restrictive' | 'permissive';
  sandbox: boolean;
  allowedWorkspaces?: string[];
  rateLimit?: number;
  logLevel?: 'info' | 'debug' | 'error';
}

export interface AccessInfo {
  url: string;
  token: string;
  configPath: string;
}

export interface UninstallOptions {
  backup: boolean;
  removeConfig: boolean;
  removeLogs: boolean;
  stopIfRunning: boolean;
}

export interface UninstallResult {
  success: boolean;
  backupPath?: string;
  removedFiles: string[];
  error?: string;
}

export interface ServiceStatus {
  installed: boolean;
  running: boolean;
  version?: string;
  pid?: number;
  uptime?: number;
}
```

### Step 4: 实现NpmInstaller (10分钟)

创建文件: `src/core/openclaw-manager/installer/NpmInstaller.ts`

```typescript
/**
 * NPM方式安装OpenClaw
 */
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

  /**
   * 安装OpenClaw
   */
  async install(version?: string): Promise<string> {
    // 检查npm
    if (!(await this.checkNpm())) {
      throw new Error('npm is not available');
    }

    // 构建包名
    const packageName = version ? `openclaw@${version}` : 'openclaw';

    console.log(`📦 Installing ${packageName}...`);

    try {
      // 执行安装
      const { stdout, stderr } = await execAsync(`npm install -g ${packageName}`);

      if (stderr && !stderr.includes('WARN')) {
        console.warn(stderr);
      }

      console.log('✅ Installation completed');

      // 获取安装路径
      const { stdout: npmRoot } = await execAsync('npm root -g');
      const installPath = npmRoot.trim() + '/openclaw';

      return installPath;
    } catch (error) {
      throw new Error(`Installation failed: ${error.message}`);
    }
  }

  /**
   * 卸载OpenClaw
   */
  async uninstall(): Promise<void> {
    try {
      console.log('📦 Uninstalling openclaw...');
      const { stdout } = await execAsync('npm uninstall -g openclaw');
      console.log(stdout);
      console.log('✅ Uninstallation completed');
    } catch (error) {
      throw new Error(`Uninstallation failed: ${error.message}`);
    }
  }
}
```

### Step 5: 添加CLI命令 (10分钟)

创建文件: `src/cli/commands/openclaw.ts`

```typescript
/**
 * OpenClaw管理命令
 */
import { Command } from 'commander';
import { NpmInstaller } from '../../core/openclaw-manager/installer/NpmInstaller';

export function registerOpenClawCommands(program: Command) {
  const openclaw = program
    .command('openclaw')
    .description('Manage OpenClaw installation and lifecycle');

  // install命令
  openclaw
    .command('install')
    .description('Install OpenClaw')
    .option('--version <version>', 'Specify version to install')
    .action(async (options) => {
      console.log('🚀 Installing OpenClaw...\n');

      const installer = new NpmInstaller();

      try {
        // 检查是否已安装
        if (await installer.isInstalled()) {
          const version = await installer.getInstalledVersion();
          console.log(`✅ OpenClaw ${version} is already installed`);
          console.log(`   Run 'agentguard openclaw uninstall' to remove it first\n`);
          return;
        }

        // 执行安装
        const installPath = await installer.install(options.version);

        // 显示结果
        console.log(`\n✅ OpenClaw installed successfully!\n`);
        console.log(`📍 Installation path: ${installPath}`);
        console.log(`\n💡 Next steps:`);
        console.log(`   1. Run: agentguard openclaw status`);
        console.log(`   2. Configure: ~/.openclaw/config.json`);
        console.log(`   3. Start: openclaw --config ~/.openclaw/config.json\n`);
      } catch (error) {
        console.error(`\n❌ Installation failed: ${error.message}\n`);
        process.exit(1);
      }
    });

  // status命令
  openclaw
    .command('status')
    .description('Check OpenClaw installation status')
    .action(async () => {
      const installer = new NpmInstaller();

      console.log('\n📊 OpenClaw Status\n');
      console.log('━'.repeat(50));

      const isInstalled = await installer.isInstalled();

      if (isInstalled) {
        const version = await installer.getInstalledVersion();
        console.log(`\n✅ Installation: Installed`);
        console.log(`📦 Version: ${version}`);
      } else {
        console.log(`\n❌ Installation: Not installed`);
        console.log(`\n💡 Install with: agentguard openclaw install`);
      }

      console.log('\n' + '━'.repeat(50) + '\n');
    });

  // uninstall命令
  openclaw
    .command('uninstall')
    .description('Uninstall OpenClaw')
    .action(async () => {
      const installer = new NpmInstaller();

      console.log('🗑️  Uninstalling OpenClaw...\n');

      try {
        // 检查是否已安装
        if (!(await installer.isInstalled())) {
          console.log('ℹ️  OpenClaw is not installed\n');
          return;
        }

        // 执行卸载
        await installer.uninstall();

        console.log('\n✅ OpenClaw uninstalled successfully!\n');
      } catch (error) {
        console.error(`\n❌ Uninstallation failed: ${error.message}\n`);
        process.exit(1);
      }
    });
}
```

### Step 6: 集成到CLI (5分钟)

修改文件: `src/cli/index.ts`

```typescript
// 在文件顶部添加导入
import { registerOpenClawCommands } from './commands/openclaw';

// 在现有命令注册之后添加
registerOpenClawCommands(program);
```

### Step 7: 编译和测试 (5分钟)

```bash
# 编译TypeScript
npm run build

# 测试命令
npx tsx src/cli/index.ts openclaw --help

# 测试status
npx tsx src/cli/index.ts openclaw status

# 如果要测试安装（需要sudo权限）
# sudo npx tsx src/cli/index.ts openclaw install
```

---

## ✅ 30分钟成果检查

完成后你应该有：

1. ✅ 完整的目录结构
2. ✅ 类型定义完整
3. ✅ NpmInstaller可用
4. ✅ CLI命令可用
5. ✅ 可以查询OpenClaw状态

**可演示的命令**:
```bash
agentguard openclaw --help
agentguard openclaw status
```

---

## 🎯 下一步 (Day 1下午)

**添加配置生成器** (1-2小时):

1. 创建 `src/core/openclaw-manager/config/ConfigGenerator.ts`
2. 实现安全配置生成
3. 集成到install命令
4. 测试完整安装流程

**完成后可演示**:
```bash
agentguard openclaw install
# 自动生成配置
# 显示访问令牌
```

---

## 📝 提交代码

完成后提交：

```bash
git add .
git commit -m "feat: OpenClaw管理器基础功能

- 添加NpmInstaller支持npm安装
- 添加CLI命令: install/status/uninstall
- 完整类型定义

可用命令:
- agentguard openclaw install
- agentguard openclaw status
- agentguard openclaw uninstall
"

git push origin feature/openclaw-manager
```

---

## 💡 开发技巧

### 快速测试循环

```bash
# 编译 + 测试
npm run build && npx tsx src/cli/index.ts openclaw status

# 或创建别名
alias ag='npx tsx src/cli/index.ts'
ag openclaw status
```

### 调试技巧

在代码中添加调试日志：
```typescript
console.log('[DEBUG]', variable);
```

编译时查看错误：
```bash
npm run build 2>&1 | grep error
```

---

## 🎊 完成第一天目标

Day 1结束时你应该有：

1. ✅ OpenClaw基础架构
2. ✅ npm方式安装可用
3. ✅ 安全配置自动生成
4. ✅ CLI命令完整
5. ✅ 可以完整演示安装流程

**庆祝一下！你已经完成了OpenClaw管理器的核心基础！🎉**

---

**明天继续**: Day 2 - 服务控制（启动/停止/状态）
