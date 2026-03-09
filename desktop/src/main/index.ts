/**
 * AgentGuard Desktop - Main Process
 */
import type { BrowserWindow as BrowserWindowType, Tray as TrayType } from 'electron';
import * as path from 'path';
import * as fs from 'fs';

// Import electron using destructuring directly
const { app, BrowserWindow, Tray, Menu, ipcMain, screen } = require('electron');
import { SecurityScanner } from '../../../src/core/scanner';
import { autoTrackerManager } from '../../../src/core/trackers/AutoTrackerManager';
import type { SecurityScanResult, TokenReport, Agent, TokenStats, TokenUsage } from '../../../src/types';

let mainWindow: BrowserWindowType | null = null;
let floatingWindow: BrowserWindowType | null = null;
let tray: TrayType | null = null;
let isQuitting = false;

const scanner = new SecurityScanner();

// Auto-scan interval (10 seconds)
let scanInterval: NodeJS.Timeout | null = null;

/**
 * Create main dashboard window
 */
function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    title: 'AgentGuard - Security Dashboard',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
    show: false,
  });

  // Load the renderer
  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:3000');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Hide to tray instead of close
  mainWindow.on('close', (event) => {
    if (!isQuitting) {
      event.preventDefault();
      mainWindow?.hide();
    }
  });
}

/**
 * Create floating monitoring widget
 */
function createFloatingWindow() {
  const { width: screenWidth } = screen.getPrimaryDisplay().workAreaSize;

  floatingWindow = new BrowserWindow({
    width: 320,
    height: 200,
    x: screenWidth - 340,
    y: 20,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    skipTaskbar: true,
    resizable: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  if (process.env.NODE_ENV === 'development') {
    floatingWindow.loadURL('http://localhost:3000/floating');
  } else {
    floatingWindow.loadFile(path.join(__dirname, '../renderer/floating.html'));
  }

  // Make window draggable
  floatingWindow.setIgnoreMouseEvents(false);

  floatingWindow.on('closed', () => {
    floatingWindow = null;
  });
}

/**
 * Create system tray
 */
function createTray() {
  // Try to use custom icon, fallback to nativeImage
  const iconPath = path.join(__dirname, '../../assets/icon.png');

  // Create tray icon (will use default if file doesn't exist)
  try {
    if (fs.existsSync(iconPath)) {
      tray = new Tray(iconPath);
    } else {
      // Use a simple text-based tray icon as fallback
      const { nativeImage } = require('electron');
      const icon = nativeImage.createEmpty();
      tray = new Tray(icon);
    }
  } catch (error) {
    console.error('Failed to create tray icon:', error);
    const { nativeImage } = require('electron');
    const icon = nativeImage.createEmpty();
    tray = new Tray(icon);
  }

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Show Dashboard',
      click: () => {
        if (mainWindow) {
          mainWindow.show();
          mainWindow.focus();
        } else {
          createMainWindow();
        }
      },
    },
    {
      label: 'Toggle Floating Widget',
      click: () => {
        if (floatingWindow) {
          floatingWindow.close();
        } else {
          createFloatingWindow();
        }
      },
    },
    { type: 'separator' },
    {
      label: 'Scan Now',
      click: async () => {
        await performScan();
      },
    },
    { type: 'separator' },
    {
      label: 'Quit',
      click: () => {
        isQuitting = true;
        app.quit();
      },
    },
  ]);

  tray.setToolTip('AgentGuard - AI Agent Security Monitor');
  tray.setContextMenu(contextMenu);

  tray.on('click', () => {
    if (mainWindow) {
      mainWindow.show();
      mainWindow.focus();
    } else {
      createMainWindow();
    }
  });
}

/**
 * Perform security scan
 */
async function performScan(): Promise<void> {
  try {
    const results = await scanner.scanAll();

    // Get token report using autoTrackerManager
    const tokenReport = await getTokenReportFromAutoTrackers();

    // Send to all windows
    if (mainWindow) {
      mainWindow.webContents.send('scan-results', { results, tokenReport });
    }

    if (floatingWindow) {
      // Send summarized data to floating window
      const avgScore = results.length > 0
        ? Math.round(results.reduce((sum, r) => sum + r.score, 0) / results.length)
        : 0;

      const criticalCount = results.reduce((sum, r) =>
        sum + r.issues.filter(i => i.severity === 'critical').length, 0);

      floatingWindow.webContents.send('scan-summary', {
        score: avgScore,
        agentCount: results.length,
        criticalIssues: criticalCount,
        totalCost: tokenReport.totalCost.today,
      });
    }

    // Check for critical issues and send notification
    const criticalIssues = results.flatMap(r =>
      r.issues.filter(i => i.severity === 'critical')
    );

    if (criticalIssues.length > 0) {
      // TODO: Send system notification
    }
  } catch (error) {
    console.error('Scan failed:', error);
  }
}

/**
 * Get token report from autoTrackerManager
 */
async function getTokenReportFromAutoTrackers(): Promise<TokenReport> {
  try {
    const usage = await autoTrackerManager.getAggregatedUsage();

    // Convert autoTracker data to TokenReport format
    const agentStats: TokenStats[] = [];

    for (const [agentId, dailyCost] of Object.entries(usage.daily.byAgent)) {
      const monthlyCost = usage.monthly.byAgent[agentId] || 0;

      // Get tracker for this agent
      const tracker = autoTrackerManager.getTracker(agentId);
      if (!tracker) continue;

      // Get detailed usage data
      const dailyUsage = await tracker.getDailyUsage();
      const monthlyUsage = await tracker.getMonthlyUsage();

      // Create agent object
      const agent: Agent = {
        id: agentId,
        name: tracker.agentName,
        version: '1.0.0',
        status: 'running',
        installPath: '',
        configPath: '',
      };

      // Create TokenUsage objects
      const today: TokenUsage = {
        agentId,
        agentName: tracker.agentName,
        inputTokens: dailyUsage.totalInputTokens,
        outputTokens: dailyUsage.totalOutputTokens,
        totalTokens: dailyUsage.totalInputTokens + dailyUsage.totalOutputTokens,
        estimatedCost: dailyUsage.totalCost,
        period: 'daily',
        timestamp: new Date(),
      };

      const thisWeek: TokenUsage = {
        agentId,
        agentName: tracker.agentName,
        inputTokens: monthlyUsage.totalInputTokens,
        outputTokens: monthlyUsage.totalOutputTokens,
        totalTokens: monthlyUsage.totalInputTokens + monthlyUsage.totalOutputTokens,
        estimatedCost: monthlyCost,
        period: 'weekly',
        timestamp: new Date(),
      };

      const thisMonth: TokenUsage = {
        agentId,
        agentName: tracker.agentName,
        inputTokens: monthlyUsage.totalInputTokens,
        outputTokens: monthlyUsage.totalOutputTokens,
        totalTokens: monthlyUsage.totalInputTokens + monthlyUsage.totalOutputTokens,
        estimatedCost: monthlyCost,
        period: 'monthly',
        timestamp: new Date(),
      };

      agentStats.push({
        agent,
        today,
        thisWeek,
        thisMonth,
      });
    }

    return {
      generatedAt: new Date(),
      agents: agentStats,
      totalCost: {
        today: usage.daily.total,
        thisWeek: usage.monthly.total * 0.25, // Estimate weekly as 25% of monthly
        thisMonth: usage.monthly.total,
      },
      totalTokens: agentStats.reduce((sum, s) => sum + s.today.totalTokens, 0),
      alerts: [],
    };
  } catch (error) {
    console.error('Failed to get token report from autoTrackers:', error);
    return {
      generatedAt: new Date(),
      agents: [],
      totalCost: {
        today: 0,
        thisWeek: 0,
        thisMonth: 0,
      },
      totalTokens: 0,
      alerts: [],
    };
  }
}

/**
 * Start auto-scan
 */
function startAutoScan() {
  if (scanInterval) return;

  // Initial scan
  performScan();

  // Scan every 10 seconds
  scanInterval = setInterval(() => {
    performScan();
  }, 10000);
}

/**
 * Stop auto-scan
 */
function stopAutoScan() {
  if (scanInterval) {
    clearInterval(scanInterval);
    scanInterval = null;
  }
}

/**
 * Setup IPC handlers
 */
function setupIPC() {
  ipcMain.handle('scan-agents', async () => {
    await performScan();
  });

  ipcMain.handle('fix-issues', async (_event, agentId: string) => {
    // TODO: Implement fix functionality
    return { success: true };
  });

  ipcMain.handle('stop-agent', async (_event, agentId: string) => {
    const detector = scanner.getDetector(agentId);
    if (detector && detector.canControl()) {
      await detector.stop();
      return { success: true };
    }
    return { success: false, error: 'Cannot control agent' };
  });

  ipcMain.handle('restart-agent', async (_event, agentId: string) => {
    const detector = scanner.getDetector(agentId);
    if (detector && detector.canControl()) {
      await detector.restart();
      return { success: true };
    }
    return { success: false, error: 'Cannot control agent' };
  });

  ipcMain.handle('toggle-floating-window', () => {
    if (floatingWindow) {
      floatingWindow.close();
    } else {
      createFloatingWindow();
    }
  });
}

// App lifecycle
app.whenReady().then(() => {
  setupIPC();
  createMainWindow();
  createTray();
  startAutoScan();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
    }
  });
});

app.on('window-all-closed', () => {
  // Keep app running in background (system tray)
  if (process.platform !== 'darwin') {
    // On macOS, don't quit
  }
});

app.on('before-quit', () => {
  stopAutoScan();
  isQuitting = true;
});

// Handle errors
process.on('uncaughtException', (error) => {
  console.error('Uncaught exception:', error);
});
