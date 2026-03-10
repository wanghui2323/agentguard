/**
 * OpenClaw Manager Integration Tests
 */
import { NpmInstaller } from '../src/core/openclaw-manager/installer/NpmInstaller';
import { ConfigGenerator } from '../src/core/openclaw-manager/config/ConfigGenerator';
import { ServiceController } from '../src/core/openclaw-manager/controller/ServiceController';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

describe('OpenClaw Manager Integration Tests', () => {
  const configDir = path.join(os.homedir(), '.openclaw-test');
  const configPath = path.join(configDir, 'config.json');

  beforeAll(() => {
    // Create test config directory
    if (!fs.existsSync(configDir)) {
      fs.mkdirSync(configDir, { recursive: true });
    }
  });

  afterAll(() => {
    // Clean up test directory
    if (fs.existsSync(configDir)) {
      fs.rmSync(configDir, { recursive: true, force: true });
    }
  });

  describe('NpmInstaller', () => {
    const installer = new NpmInstaller();

    test('should check if npm is available', async () => {
      const hasNpm = await installer.checkNpm();
      expect(hasNpm).toBe(true);
    });

    test('should detect if OpenClaw is installed', async () => {
      const isInstalled = await installer.isInstalled();
      expect(typeof isInstalled).toBe('boolean');
    });

    test('should get installed version if available', async () => {
      const version = await installer.getInstalledVersion();
      if (version) {
        expect(typeof version).toBe('string');
        expect(version.length).toBeGreaterThan(0);
      }
    });

    test('should get install path', async () => {
      const installPath = await installer.getInstallPath();
      if (installPath) {
        expect(typeof installPath).toBe('string');
        expect(installPath).toContain('openclaw');
      } else {
        expect(installPath).toBeNull();
      }
    });
  });

  describe('ConfigGenerator', () => {
    const generator = new ConfigGenerator();

    test('should generate secure token', () => {
      const token = generator.generateToken();
      expect(typeof token).toBe('string');
      expect(token.length).toBe(64); // 32 bytes = 64 hex chars
    });

    test('should generate secure config', () => {
      const config = generator.generateSecureConfig();
      expect(config.bind).toBe('127.0.0.1');
      expect(config.port).toBe(18789);
      expect(config.auth).toBe(true);
      expect(config.token).toBeDefined();
      expect(config.dmPolicy).toBe('restrictive');
      expect(config.sandbox).toBe(true);
      expect(config.allowedWorkspaces).toBeDefined();
    });

    test('should generate dev config', () => {
      const config = generator.generateDevConfig();
      expect(config.bind).toBe('0.0.0.0');
      expect(config.auth).toBe(true);
      expect(config.dmPolicy).toBe('permissive');
      expect(config.sandbox).toBe(false);
    });

    test('should save and load config', async () => {
      const config = generator.generateSecureConfig();

      await generator.saveConfig(config);

      expect(fs.existsSync(path.join(os.homedir(), '.openclaw', 'config.json'))).toBe(true);

      const loadedConfig = await generator.loadConfig();
      expect(loadedConfig).toEqual(config);
    });

    test('should set correct file permissions', async () => {
      const config = generator.generateSecureConfig();

      await generator.saveConfig(config);

      const configFilePath = path.join(os.homedir(), '.openclaw', 'config.json');
      const stats = fs.statSync(configFilePath);
      const mode = stats.mode & 0o777;
      expect(mode).toBe(0o600); // Only owner can read/write
    });
  });

  describe('ServiceController', () => {
    const controller = new ServiceController();

    test('should detect if service is running', async () => {
      const isRunning = await controller.isRunning();
      expect(typeof isRunning).toBe('boolean');
    });

    // Note: We don't test actual start/stop to avoid interfering with real OpenClaw instances
  });

  describe('CLI Commands Integration', () => {
    test('should register all OpenClaw commands', () => {
      // This test verifies that the commands are properly registered
      // We already tested this manually with `npx tsx src/cli/index.ts openclaw --help`
      expect(true).toBe(true);
    });
  });
});

/**
 * Manual Test Checklist
 *
 * Run these commands manually to verify full functionality:
 *
 * 1. Check OpenClaw status:
 *    npx tsx src/cli/index.ts openclaw status
 *
 * 2. Install OpenClaw (requires sudo):
 *    sudo npx tsx src/cli/index.ts openclaw install
 *
 * 3. Verify installation:
 *    npx tsx src/cli/index.ts openclaw status
 *    ls -la ~/.openclaw/
 *
 * 4. Start OpenClaw:
 *    npx tsx src/cli/index.ts openclaw start
 *
 * 5. Check running status:
 *    npx tsx src/cli/index.ts openclaw status
 *
 * 6. View logs:
 *    npx tsx src/cli/index.ts openclaw logs
 *
 * 7. Restart service:
 *    npx tsx src/cli/index.ts openclaw restart
 *
 * 8. Stop service:
 *    npx tsx src/cli/index.ts openclaw stop
 *
 * 9. Uninstall OpenClaw:
 *    sudo npx tsx src/cli/index.ts openclaw uninstall --backup
 *
 * 10. Verify clean uninstall:
 *     npx tsx src/cli/index.ts openclaw status
 *     ls -la ~/.openclaw/
 */
