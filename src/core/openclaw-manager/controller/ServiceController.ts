/**
 * OpenClaw服务控制器
 */
import { exec, spawn, ChildProcess } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

const execAsync = promisify(exec);

export class ServiceController {
  private readonly pidFile = path.join(os.homedir(), '.openclaw', 'openclaw.pid');
  private readonly logDir = path.join(os.homedir(), '.openclaw', 'logs');
  private readonly logFile = path.join(this.logDir, 'openclaw.log');

  /**
   * 启动OpenClaw
   */
  async start(configPath?: string): Promise<void> {
    // 检查是否已在运行
    if (await this.isRunning()) {
      throw new Error('OpenClaw is already running');
    }

    // 确保日志目录存在
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }

    // 配置路径
    const config = configPath || path.join(os.homedir(), '.openclaw', 'config.json');

    if (!fs.existsSync(config)) {
      throw new Error(`Config file not found: ${config}`);
    }

    // 启动进程
    const logStream = fs.createWriteStream(this.logFile, { flags: 'a' });

    const child = spawn('openclaw', ['--config', config], {
      detached: true,
      stdio: ['ignore', logStream, logStream]
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
    } catch (error: any) {
      throw new Error(`Failed to stop OpenClaw: ${error.message}`);
    }
  }

  /**
   * 重启OpenClaw
   */
  async restart(configPath?: string): Promise<void> {
    if (await this.isRunning()) {
      await this.stop();
      // 等待完全停止
      await new Promise(resolve => setTimeout(resolve, 1000));
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
   * 获取运行时间
   */
  async getUptime(): Promise<number | null> {
    const pid = await this.getPid();

    if (!pid || !(await this.isRunning())) {
      return null;
    }

    try {
      // macOS/Linux
      const { stdout } = await execAsync(`ps -o etime= -p ${pid}`);
      const timeStr = stdout.trim();

      // 解析时间字符串（如：1-02:34:56 或 02:34:56 或 34:56）
      const parts = timeStr.split(/[-:]/);
      let seconds = 0;

      if (parts.length === 4) {
        // 天-时:分:秒
        seconds = parseInt(parts[0]) * 86400 + parseInt(parts[1]) * 3600 + parseInt(parts[2]) * 60 + parseInt(parts[3]);
      } else if (parts.length === 3) {
        // 时:分:秒
        seconds = parseInt(parts[0]) * 3600 + parseInt(parts[1]) * 60 + parseInt(parts[2]);
      } else if (parts.length === 2) {
        // 分:秒
        seconds = parseInt(parts[0]) * 60 + parseInt(parts[1]);
      }

      return seconds;
    } catch {
      return null;
    }
  }

  /**
   * 获取日志内容
   */
  async getLogs(lines: number = 50): Promise<string[]> {
    if (!fs.existsSync(this.logFile)) {
      return [];
    }

    try {
      const { stdout } = await execAsync(`tail -n ${lines} "${this.logFile}"`);
      return stdout.trim().split('\n').filter(line => line.length > 0);
    } catch {
      return [];
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

    throw new Error('Startup timeout: OpenClaw did not respond within 10 seconds');
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
