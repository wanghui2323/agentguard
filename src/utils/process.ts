/**
 * Process management utilities
 */
import { exec } from 'child_process';
import { promisify } from 'util';
import type { ProcessInfo } from '../types';

const execAsync = promisify(exec);

/**
 * Get all running processes
 */
export async function getRunningProcesses(): Promise<ProcessInfo[]> {
  try {
    const { stdout } = await execAsync('ps aux');
    const lines = stdout.split('\n').slice(1); // Skip header

    return lines
      .filter(line => line.trim())
      .map(line => {
        const parts = line.trim().split(/\s+/);
        return {
          pid: parseInt(parts[1]),
          name: parts[10],
          command: parts.slice(10).join(' '),
          cpu: parseFloat(parts[2]),
          memory: parseFloat(parts[3])
        };
      });
  } catch (error) {
    console.error('Failed to get running processes:', error);
    return [];
  }
}

/**
 * Find processes by name pattern
 */
export async function findProcessesByName(pattern: string | RegExp): Promise<ProcessInfo[]> {
  const processes = await getRunningProcesses();
  const regex = typeof pattern === 'string' ? new RegExp(pattern, 'i') : pattern;

  return processes.filter(p =>
    regex.test(p.name) || regex.test(p.command)
  );
}

/**
 * Check if a process is running
 */
export async function isProcessRunning(pid: number): Promise<boolean> {
  try {
    process.kill(pid, 0); // Signal 0 just checks if process exists
    return true;
  } catch {
    return false;
  }
}

/**
 * Stop a process gracefully
 */
export async function stopProcess(pid: number, timeout = 5000): Promise<void> {
  if (!await isProcessRunning(pid)) {
    return;
  }

  // Try SIGTERM first
  process.kill(pid, 'SIGTERM');

  // Wait for graceful shutdown
  const startTime = Date.now();
  while (await isProcessRunning(pid)) {
    if (Date.now() - startTime > timeout) {
      // Force kill if timeout
      process.kill(pid, 'SIGKILL');
      break;
    }
    await new Promise(resolve => setTimeout(resolve, 100));
  }
}

/**
 * Get process by PID
 */
export async function getProcessByPid(pid: number): Promise<ProcessInfo | null> {
  const processes = await getRunningProcesses();
  return processes.find(p => p.pid === pid) || null;
}

/**
 * Get listening ports for a process
 */
export async function getProcessPorts(pid: number): Promise<number[]> {
  try {
    const { stdout } = await execAsync(`lsof -Pan -p ${pid} -i`);
    const lines = stdout.split('\n').slice(1);

    const ports: number[] = [];
    for (const line of lines) {
      const match = line.match(/:(\d+)/);
      if (match) {
        ports.push(parseInt(match[1]));
      }
    }

    return [...new Set(ports)]; // Deduplicate
  } catch {
    return [];
  }
}
