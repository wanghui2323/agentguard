"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.readJsonConfig = readJsonConfig;
exports.readYamlConfig = readYamlConfig;
exports.writeJsonConfig = writeJsonConfig;
exports.writeYamlConfig = writeYamlConfig;
exports.backupConfig = backupConfig;
exports.restoreConfig = restoreConfig;
exports.getFilePermissions = getFilePermissions;
exports.setFilePermissions = setFilePermissions;
exports.expandHome = expandHome;
exports.fileExists = fileExists;
exports.deepMerge = deepMerge;
/**
 * Configuration file utilities
 */
const fs = __importStar(require("fs/promises"));
const path = __importStar(require("path"));
const yaml_1 = __importDefault(require("yaml"));
/**
 * Read JSON config file
 */
async function readJsonConfig(filePath) {
    try {
        const content = await fs.readFile(filePath, 'utf-8');
        return JSON.parse(content);
    }
    catch (error) {
        return null;
    }
}
/**
 * Read YAML config file
 */
async function readYamlConfig(filePath) {
    try {
        const content = await fs.readFile(filePath, 'utf-8');
        return yaml_1.default.parse(content);
    }
    catch (error) {
        return null;
    }
}
/**
 * Write JSON config file
 */
async function writeJsonConfig(filePath, data) {
    const content = JSON.stringify(data, null, 2);
    await fs.writeFile(filePath, content, 'utf-8');
}
/**
 * Write YAML config file
 */
async function writeYamlConfig(filePath, data) {
    const content = yaml_1.default.stringify(data);
    await fs.writeFile(filePath, content, 'utf-8');
}
/**
 * Backup config file
 */
async function backupConfig(filePath) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = `${filePath}.backup.${timestamp}`;
    await fs.copyFile(filePath, backupPath);
    return backupPath;
}
/**
 * Restore config from backup
 */
async function restoreConfig(backupPath, targetPath) {
    await fs.copyFile(backupPath, targetPath);
}
/**
 * Check file permissions
 */
async function getFilePermissions(filePath) {
    try {
        const stats = await fs.stat(filePath);
        return (stats.mode & parseInt('777', 8)).toString(8);
    }
    catch {
        return '';
    }
}
/**
 * Set file permissions
 */
async function setFilePermissions(filePath, mode) {
    await fs.chmod(filePath, parseInt(mode, 8));
}
/**
 * Expand home directory in path
 */
function expandHome(filePath) {
    if (filePath.startsWith('~/')) {
        return path.join(process.env.HOME || '', filePath.slice(2));
    }
    return filePath;
}
/**
 * Check if file exists
 */
async function fileExists(filePath) {
    try {
        await fs.access(filePath);
        return true;
    }
    catch {
        return false;
    }
}
/**
 * Deep merge objects
 */
function deepMerge(target, source) {
    const result = { ...target };
    for (const key in source) {
        const sourceValue = source[key];
        const targetValue = result[key];
        if (sourceValue &&
            typeof sourceValue === 'object' &&
            !Array.isArray(sourceValue) &&
            targetValue &&
            typeof targetValue === 'object' &&
            !Array.isArray(targetValue)) {
            result[key] = deepMerge(targetValue, sourceValue);
        }
        else {
            result[key] = sourceValue;
        }
    }
    return result;
}
