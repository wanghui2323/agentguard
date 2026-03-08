/**
 * Configuration file utilities
 */
import * as fs from 'fs/promises';
import * as path from 'path';
import YAML from 'yaml';

/**
 * Read JSON config file
 */
export async function readJsonConfig<T = any>(filePath: string): Promise<T | null> {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    return null;
  }
}

/**
 * Read YAML config file
 */
export async function readYamlConfig<T = any>(filePath: string): Promise<T | null> {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    return YAML.parse(content);
  } catch (error) {
    return null;
  }
}

/**
 * Write JSON config file
 */
export async function writeJsonConfig(filePath: string, data: any): Promise<void> {
  const content = JSON.stringify(data, null, 2);
  await fs.writeFile(filePath, content, 'utf-8');
}

/**
 * Write YAML config file
 */
export async function writeYamlConfig(filePath: string, data: any): Promise<void> {
  const content = YAML.stringify(data);
  await fs.writeFile(filePath, content, 'utf-8');
}

/**
 * Backup config file
 */
export async function backupConfig(filePath: string): Promise<string> {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupPath = `${filePath}.backup.${timestamp}`;
  await fs.copyFile(filePath, backupPath);
  return backupPath;
}

/**
 * Restore config from backup
 */
export async function restoreConfig(backupPath: string, targetPath: string): Promise<void> {
  await fs.copyFile(backupPath, targetPath);
}

/**
 * Check file permissions
 */
export async function getFilePermissions(filePath: string): Promise<string> {
  try {
    const stats = await fs.stat(filePath);
    return (stats.mode & parseInt('777', 8)).toString(8);
  } catch {
    return '';
  }
}

/**
 * Set file permissions
 */
export async function setFilePermissions(filePath: string, mode: string): Promise<void> {
  await fs.chmod(filePath, parseInt(mode, 8));
}

/**
 * Expand home directory in path
 */
export function expandHome(filePath: string): string {
  if (filePath.startsWith('~/')) {
    return path.join(process.env.HOME || '', filePath.slice(2));
  }
  return filePath;
}

/**
 * Check if file exists
 */
export async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

/**
 * Deep merge objects
 */
export function deepMerge<T extends Record<string, any>>(target: T, source: Partial<T>): T {
  const result = { ...target };

  for (const key in source) {
    const sourceValue = source[key];
    const targetValue = result[key];

    if (
      sourceValue &&
      typeof sourceValue === 'object' &&
      !Array.isArray(sourceValue) &&
      targetValue &&
      typeof targetValue === 'object' &&
      !Array.isArray(targetValue)
    ) {
      result[key] = deepMerge(targetValue, sourceValue);
    } else {
      result[key] = sourceValue as T[Extract<keyof T, string>];
    }
  }

  return result;
}
