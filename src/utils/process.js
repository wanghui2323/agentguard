"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRunningProcesses = getRunningProcesses;
exports.findProcessesByName = findProcessesByName;
exports.isProcessRunning = isProcessRunning;
exports.stopProcess = stopProcess;
exports.getProcessByPid = getProcessByPid;
exports.getProcessPorts = getProcessPorts;
/**
 * Process management utilities
 */
const child_process_1 = require("child_process");
const util_1 = require("util");
const execAsync = (0, util_1.promisify)(child_process_1.exec);
/**
 * Get all running processes
 */
async function getRunningProcesses() {
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
    }
    catch (error) {
        console.error('Failed to get running processes:', error);
        return [];
    }
}
/**
 * Find processes by name pattern
 */
async function findProcessesByName(pattern) {
    const processes = await getRunningProcesses();
    const regex = typeof pattern === 'string' ? new RegExp(pattern, 'i') : pattern;
    return processes.filter(p => regex.test(p.name) || regex.test(p.command));
}
/**
 * Check if a process is running
 */
async function isProcessRunning(pid) {
    try {
        process.kill(pid, 0); // Signal 0 just checks if process exists
        return true;
    }
    catch {
        return false;
    }
}
/**
 * Stop a process gracefully
 */
async function stopProcess(pid, timeout = 5000) {
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
async function getProcessByPid(pid) {
    const processes = await getRunningProcesses();
    return processes.find(p => p.pid === pid) || null;
}
/**
 * Get listening ports for a process
 */
async function getProcessPorts(pid) {
    try {
        const { stdout } = await execAsync(`lsof -Pan -p ${pid} -i`);
        const lines = stdout.split('\n').slice(1);
        const ports = [];
        for (const line of lines) {
            const match = line.match(/:(\d+)/);
            if (match) {
                ports.push(parseInt(match[1]));
            }
        }
        return [...new Set(ports)]; // Deduplicate
    }
    catch {
        return [];
    }
}
