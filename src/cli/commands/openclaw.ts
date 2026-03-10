/**
 * OpenClaw管理命令
 */
import { Command } from 'commander';
import { NpmInstaller } from '../../core/openclaw-manager/installer/NpmInstaller';
import { ConfigGenerator } from '../../core/openclaw-manager/config/ConfigGenerator';
import { ServiceController } from '../../core/openclaw-manager/controller/ServiceController';
import type { ServiceStatus } from '../../core/openclaw-manager/types';

export function registerOpenClawCommands(program: Command) {
  const openclaw = program
    .command('openclaw')
    .description('Manage OpenClaw installation and lifecycle');

  // install命令
  openclaw
    .command('install')
    .description('Install OpenClaw with secure configuration')
    .option('--version <version>', 'Specify version to install')
    .option('--preset <type>', 'Config preset (secure|dev)', 'secure')
    .option('--bind <address>', 'Bind address (default: 127.0.0.1)')
    .option('--port <port>', 'Port number (default: 18789)')
    .action(async (options) => {
      console.log('🚀 Installing OpenClaw...\n');

      const installer = new NpmInstaller();
      const configGen = new ConfigGenerator();

      try {
        // 1. 检查是否已安装
        if (await installer.isInstalled()) {
          const version = await installer.getInstalledVersion();
          console.log(`✅ OpenClaw ${version} is already installed`);
          console.log(`   Run 'agentguard openclaw uninstall' to remove it first\n`);
          return;
        }

        // 2. 执行安装
        const installPath = await installer.install(options.version);

        // 3. 生成配置
        const config = options.preset === 'dev'
          ? configGen.generateDevConfig({ bind: options.bind, port: options.port ? parseInt(options.port) : undefined })
          : configGen.generateSecureConfig({ bind: options.bind, port: options.port ? parseInt(options.port) : undefined });

        await configGen.saveConfig(config);

        // 4. 显示结果
        console.log(`\n✅ OpenClaw installed successfully!\n`);
        console.log('━'.repeat(60));
        console.log(`\n📍 Installation: ${installPath}`);
        console.log(`🔧 Config: ${configGen.getConfigPath()}`);
        console.log(`🔑 Token: ${configGen.getTokenPath()}`);

        console.log(`\n🔒 Security Configuration:`);
        console.log(`   Bind Address: ${config.bind} ${config.bind === '127.0.0.1' ? '✅ (Secure - localhost only)' : '⚠️  (Network accessible)'}`);
        console.log(`   Authentication: ${config.auth ? '✅ Enabled' : '❌ Disabled'}`);
        console.log(`   DM Policy: ${config.dmPolicy}`);
        console.log(`   Sandbox: ${config.sandbox ? '✅ Enabled' : '❌ Disabled'}`);

        console.log(`\n🌐 Access Information:`);
        console.log(`   URL: http://${config.bind}:${config.port}`);
        console.log(`   Token: ${config.token}`);

        console.log(`\n💡 Next Steps:`);
        console.log(`   1. Start OpenClaw: agentguard openclaw start`);
        console.log(`   2. Check status: agentguard openclaw status`);
        console.log(`   3. View logs: agentguard openclaw logs`);
        console.log(`   4. Scan security: agentguard scan`);
        console.log('\n' + '━'.repeat(60) + '\n');
      } catch (error: any) {
        console.error(`\n❌ Installation failed: ${error.message}\n`);
        process.exit(1);
      }
    });

  // start命令
  openclaw
    .command('start')
    .description('Start OpenClaw service')
    .option('--config <path>', 'Custom config file path')
    .action(async (options) => {
      const controller = new ServiceController();
      const installer = new NpmInstaller();

      try {
        // 检查是否已安装
        if (!(await installer.isInstalled())) {
          console.log('❌ OpenClaw is not installed');
          console.log('   Run: agentguard openclaw install\n');
          process.exit(1);
        }

        console.log('🚀 Starting OpenClaw...');
        await controller.start(options.config);
        console.log('✅ OpenClaw started successfully\n');
      } catch (error: any) {
        console.error(`❌ ${error.message}\n`);
        process.exit(1);
      }
    });

  // stop命令
  openclaw
    .command('stop')
    .description('Stop OpenClaw service')
    .action(async () => {
      const controller = new ServiceController();

      try {
        console.log('🛑 Stopping OpenClaw...');
        await controller.stop();
        console.log('✅ OpenClaw stopped\n');
      } catch (error: any) {
        console.error(`❌ ${error.message}\n`);
        process.exit(1);
      }
    });

  // restart命令
  openclaw
    .command('restart')
    .description('Restart OpenClaw service')
    .option('--config <path>', 'Custom config file path')
    .action(async (options) => {
      const controller = new ServiceController();

      try {
        console.log('🔄 Restarting OpenClaw...');
        await controller.restart(options.config);
        console.log('✅ OpenClaw restarted successfully\n');
      } catch (error: any) {
        console.error(`❌ ${error.message}\n`);
        process.exit(1);
      }
    });

  // status命令
  openclaw
    .command('status')
    .description('Check OpenClaw status')
    .action(async () => {
      const installer = new NpmInstaller();
      const controller = new ServiceController();
      const configGen = new ConfigGenerator();

      console.log('\n📊 OpenClaw Status Report\n');
      console.log('━'.repeat(60));

      const isInstalled = await installer.isInstalled();
      const isRunning = await controller.isRunning();

      // Installation status
      if (isInstalled) {
        const version = await installer.getInstalledVersion();
        const installPath = await installer.getInstallPath();
        console.log(`\n✅ Installation: Installed`);
        console.log(`   Version: ${version}`);
        console.log(`   Path: ${installPath}`);
      } else {
        console.log(`\n❌ Installation: Not installed`);
        console.log(`   Run: agentguard openclaw install`);
      }

      // Service status
      if (isRunning) {
        const uptime = await controller.getUptime();
        console.log(`\n✅ Service: ● Running`);

        if (uptime) {
          const hours = Math.floor(uptime / 3600);
          const minutes = Math.floor((uptime % 3600) / 60);
          const seconds = uptime % 60;
          console.log(`   Uptime: ${hours}h ${minutes}m ${seconds}s`);
        }
      } else {
        console.log(`\n○ Service: Stopped`);
        if (isInstalled) {
          console.log(`   Run: agentguard openclaw start`);
        }
      }

      // Configuration
      if (configGen.configExists()) {
        const config = await configGen.loadConfig();
        if (config) {
          console.log(`\n🔧 Configuration:`);
          console.log(`   File: ${configGen.getConfigPath()}`);
          console.log(`   Bind: ${config.bind}:${config.port}`);
          console.log(`   Auth: ${config.auth ? 'Enabled' : 'Disabled'}`);
          console.log(`   DM Policy: ${config.dmPolicy}`);
          console.log(`   Sandbox: ${config.sandbox ? 'Enabled' : 'Disabled'}`);
        }
      }

      console.log('\n' + '━'.repeat(60) + '\n');
    });

  // logs命令
  openclaw
    .command('logs')
    .description('View OpenClaw logs')
    .option('-n, --lines <number>', 'Number of lines to show', '50')
    .option('-f, --follow', 'Follow log output')
    .action(async (options) => {
      const controller = new ServiceController();

      if (options.follow) {
        console.log('📜 Following OpenClaw logs (Ctrl+C to stop)...\n');
        // TODO: 实现follow功能
        console.log('Follow mode not yet implemented. Use: tail -f ~/.openclaw/logs/openclaw.log\n');
      } else {
        const lines = await controller.getLogs(parseInt(options.lines));
        if (lines.length === 0) {
          console.log('No logs found\n');
        } else {
          console.log('📜 OpenClaw Logs:\n');
          lines.forEach(line => console.log(line));
          console.log();
        }
      }
    });

  // uninstall命令
  openclaw
    .command('uninstall')
    .description('Uninstall OpenClaw')
    .option('--keep-config', 'Keep configuration files')
    .action(async (options) => {
      const installer = new NpmInstaller();
      const controller = new ServiceController();

      console.log('🗑️  Uninstalling OpenClaw...\n');

      try {
        // 1. 检查是否已安装
        if (!(await installer.isInstalled())) {
          console.log('ℹ️  OpenClaw is not installed\n');
          return;
        }

        // 2. 停止服务（如果在运行）
        if (await controller.isRunning()) {
          console.log('🛑 Stopping OpenClaw...');
          await controller.stop();
          console.log('✅ Service stopped');
        }

        // 3. 执行卸载
        await installer.uninstall();

        // 4. 清理配置（如果需要）
        if (!options.keepConfig) {
          const configDir = require('path').join(require('os').homedir(), '.openclaw');
          if (require('fs').existsSync(configDir)) {
            // 备份配置
            const backupDir = configDir + '.backup';
            console.log(`\n💾 Backing up config to ${backupDir}...`);
            require('fs').cpSync(configDir, backupDir, { recursive: true });

            // 删除配置
            require('fs').rmSync(configDir, { recursive: true, force: true });
            console.log('✅ Config removed (backup created)');
          }
        }

        console.log('\n✅ OpenClaw uninstalled successfully!\n');

        if (options.keepConfig) {
          console.log('ℹ️  Configuration files were kept in ~/.openclaw/\n');
        }
      } catch (error: any) {
        console.error(`\n❌ Uninstallation failed: ${error.message}\n`);
        process.exit(1);
      }
    });
}
