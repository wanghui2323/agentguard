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
   * 获取安装路径
   */
  async getInstallPath(): Promise<string | null> {
    try {
      const { stdout } = await execAsync('which openclaw');
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
      throw new Error('npm is not available. Please install Node.js first.');
    }

    // 构建包名
    const packageName = version ? `openclaw@${version}` : 'openclaw';

    console.log(`📦 Installing ${packageName}...`);

    try {
      // 执行安装
      const { stdout, stderr } = await execAsync(`npm install -g ${packageName}`, {
        timeout: 120000 // 2分钟超时
      });

      if (stderr && !stderr.includes('WARN') && !stderr.includes('npm notice')) {
        console.warn(stderr);
      }

      console.log('✅ Installation completed');

      // 获取安装路径
      const installPath = await this.getInstallPath();
      if (!installPath) {
        throw new Error('Failed to locate openclaw after installation');
      }

      return installPath;
    } catch (error: any) {
      if (error.killed) {
        throw new Error('Installation timeout after 2 minutes');
      }
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
    } catch (error: any) {
      throw new Error(`Uninstallation failed: ${error.message}`);
    }
  }
}
