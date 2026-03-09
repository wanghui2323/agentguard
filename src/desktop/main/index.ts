import { app, BrowserWindow, Tray, Menu, nativeImage, screen, ipcMain, shell } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';
import { dataServiceV2 as dataService } from '../services/DataServiceV2';

let floatingWindow: BrowserWindow | null = null;
let panelWindow: BrowserWindow | null = null;
let tray: Tray | null = null;

// 状态更新定时器
let statusUpdateTimer: NodeJS.Timeout | null = null;

// 配置文件路径
const CONFIG_DIR = path.join(os.homedir(), '.agentguard');
const POSITION_FILE = path.join(CONFIG_DIR, 'window-position.json');

// 加载保存的位置
function loadSavedPosition(): { x: number; y: number } | null {
  try {
    if (fs.existsSync(POSITION_FILE)) {
      const data = fs.readFileSync(POSITION_FILE, 'utf-8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Failed to load position:', error);
  }
  return null;
}

// 保存位置
function savePosition(x: number, y: number) {
  try {
    if (!fs.existsSync(CONFIG_DIR)) {
      fs.mkdirSync(CONFIG_DIR, { recursive: true });
    }
    fs.writeFileSync(POSITION_FILE, JSON.stringify({ x, y }, null, 2));
  } catch (error) {
    console.error('Failed to save position:', error);
  }
}

// 磁吸到屏幕边缘
function snapToEdge(x: number, y: number, windowWidth: number, windowHeight: number) {
  const { width, height } = screen.getPrimaryDisplay().workAreaSize;
  const SNAP_DISTANCE = 30; // 磁吸距离

  let newX = x;
  let newY = y;

  // 左边缘磁吸
  if (x < SNAP_DISTANCE) {
    newX = 10;
  }
  // 右边缘磁吸
  else if (x + windowWidth > width - SNAP_DISTANCE) {
    newX = width - windowWidth - 10;
  }

  // 上边缘磁吸
  if (y < SNAP_DISTANCE) {
    newY = 10;
  }
  // 下边缘磁吸
  else if (y + windowHeight > height - SNAP_DISTANCE) {
    newY = height - windowHeight - 10;
  }

  return { x: newX, y: newY };
}

// 创建悬浮球窗口
function createFloatingBall() {
  const { width, height } = screen.getPrimaryDisplay().workAreaSize;

  // 尝试加载保存的位置，否则使用默认位置
  const savedPosition = loadSavedPosition();
  const defaultX = width - 80;
  const defaultY = 80;

  floatingWindow = new BrowserWindow({
    width: 60,
    height: 60,
    x: savedPosition?.x ?? defaultX,
    y: savedPosition?.y ?? defaultY,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    resizable: false,
    skipTaskbar: true,
    hasShadow: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  // 加载 HTML（直接使用编译后的文件）
  floatingWindow.loadFile(path.join(__dirname, '../renderer/floating.html'));

  // 让窗口可拖动
  floatingWindow.setIgnoreMouseEvents(false);

  // 监听窗口移动，实现磁吸和位置保存
  let moveTimeout: NodeJS.Timeout | null = null;
  floatingWindow.on('move', () => {
    if (!floatingWindow) return;

    const bounds = floatingWindow.getBounds();
    const snapped = snapToEdge(bounds.x, bounds.y, bounds.width, bounds.height);

    // 如果需要磁吸，更新位置
    if (snapped.x !== bounds.x || snapped.y !== bounds.y) {
      floatingWindow.setBounds({
        x: snapped.x,
        y: snapped.y,
        width: bounds.width,
        height: bounds.height,
      });
    }

    // 防抖保存位置（移动停止500ms后保存）
    if (moveTimeout) clearTimeout(moveTimeout);
    moveTimeout = setTimeout(() => {
      const finalBounds = floatingWindow?.getBounds();
      if (finalBounds) {
        savePosition(finalBounds.x, finalBounds.y);
      }
    }, 500);
  });
}

// 创建快速面板
function createPanel() {
  if (!floatingWindow) return;

  const floatingBounds = floatingWindow.getBounds();

  panelWindow = new BrowserWindow({
    width: 320,
    height: 420,  // 初始简洁模式高度（包含所有内容+展开按钮）
    x: floatingBounds.x - 320 + 60, // 面板右侧对齐悬浮球
    y: floatingBounds.y + 70,        // 面板在悬浮球下方
    frame: false,
    transparent: false,
    alwaysOnTop: true,
    resizable: false,
    skipTaskbar: true,
    show: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  // 加载 HTML（直接使用编译后的文件）
  panelWindow.loadFile(path.join(__dirname, '../renderer/panel.html'));

  panelWindow.once('ready-to-show', () => {
    panelWindow?.show();
  });

  // 失焦时隐藏面板
  panelWindow.on('blur', () => {
    panelWindow?.hide();
  });
}

// 创建系统托盘
function createTray() {
  // 创建托盘图标 (黑白图标)
  const icon = nativeImage.createFromDataURL(
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAAAdgAAAHYBTnsmCAAAABl0RVh0U29mdHdhcmUAd3d3Lmlua3NjYXBlLm9yZ5vuPBoAAAFCSURBVDiNpZO9SgNBFIW/2V1jYhFBUAQLURBBEMHGRrCwECwsLCwsLHwAn8DGVxCfwEKw8QVEFAQRLCxEEBQRRBDBRhBBJJvs7sw5FhuTbLKJB6aZmXu+uXfmXvjHUgBmNgD0A73AALAA3JQZK8zsGjgE5tx9FUBVVbWnKIo94AR4BN6ATkBA3N3ngQ53nzOzHmAdGC5zHgEWgS53XwfIgFVgBPj5hzMATAN9ZjYKEIBR4P6vbWb2BDwD7wDOueQP+BvwAgQAkYhRjFGM0fR+jJI0ASheWKRSCcVKQUQVVXUC5MASMFlErYpEVaoViKZMzA0AlzVgKxGNPSOqoKqo+N8OmFkVmAFO6wATEbTAmZk9u3umadqZ53mqqupX0zRtApaAIWAXuKpv1q+q6gYYA3qBbeC2bRacc1PAOjAJPLRzvQN+imh8aY61YgAAAABJRU5ErkJggg=='
  );

  tray = new Tray(icon);

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'AgentGuard',
      enabled: false,
    },
    { type: 'separator' },
    {
      label: '✓ 3 个 Agents 运行中',
      enabled: false,
    },
    {
      label: '  今日成本: $147.01',
      enabled: false,
    },
    { type: 'separator' },
    {
      label: '🌐 打开 Dashboard',
      click: () => {
        // TODO: 打开浏览器访问 Dashboard
        require('electron').shell.openExternal('http://localhost:3000');
      },
    },
    {
      label: '🔄 快速扫描',
      click: () => {
        // TODO: 触发扫描
      },
    },
    {
      label: '📊 查看最新报告',
      click: () => {
        // TODO: 打开最新报告
      },
    },
    { type: 'separator' },
    {
      label: '⚙️ 设置...',
      click: () => {
        // TODO: 打开设置窗口
      },
    },
    {
      label: '📖 帮助文档',
      click: () => {
        require('electron').shell.openExternal('https://github.com/agentguard/docs');
      },
    },
    { type: 'separator' },
    {
      label: '❌ 退出 AgentGuard',
      click: () => {
        app.quit();
      },
    },
  ]);

  tray.setToolTip('AgentGuard - AI Agent 监控');
  tray.setContextMenu(contextMenu);

  // 点击托盘图标显示/隐藏悬浮球
  tray.on('click', () => {
    if (floatingWindow) {
      if (floatingWindow.isVisible()) {
        floatingWindow.hide();
      } else {
        floatingWindow.show();
      }
    }
  });
}

// 设置应用事件监听器（必须在 app.whenReady() 之前注册）
function setupAppListeners() {
  // 窗口全部关闭时不退出应用（macOS 行为）
  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
      app.quit();
    }
  });

  // 优雅退出
  app.on('before-quit', () => {
    if (statusUpdateTimer) {
      clearInterval(statusUpdateTimer);
    }
    if (floatingWindow) {
      floatingWindow.destroy();
    }
    if (panelWindow) {
      panelWindow.destroy();
    }
  });

  // macOS 激活
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createFloatingBall();
    }
  });
}

// ===== IPC 通信 =====

// 设置 IPC 监听器
function setupIpcHandlers() {
  // 获取状态数据
  ipcMain.handle('get-status', async () => {
    try {
      return await dataService.getStatus();
    } catch (error) {
      console.error('Failed to get status:', error);
      return {
        level: 'offline',
        agents: 0,
        activeAgents: 0,
        cost: 0,
        score: 0,
        hasAlerts: false,
        alerts: [],
      };
    }
  });

  // 获取详细数据
  ipcMain.handle('get-detailed-data', async () => {
    try {
      console.log('[Main] 收到 get-detailed-data 请求');
      const data = await dataService.getDetailedData();
      console.log('[Main] 返回数据 - 今日:', data.costs.daily, '本月:', data.costs.monthly);
      return data;
    } catch (error) {
      console.error('[Main] 获取详细数据失败:', error);
      throw error;
    }
  });

  // 触发扫描
  ipcMain.handle('trigger-scan', async () => {
    try {
      return await dataService.triggerScan();
    } catch (error) {
      console.error('Failed to trigger scan:', error);
      throw error;
    }
  });

  // 打开外部链接
  ipcMain.handle('open-external', async (_, url: string) => {
    await shell.openExternal(url);
  });

  // 切换面板显示
  ipcMain.on('toggle-panel', () => {
    try {
      if (panelWindow && !panelWindow.isDestroyed()) {
        if (panelWindow.isVisible()) {
          panelWindow.hide();
        } else {
          panelWindow.show();
        }
      } else {
        createPanel();
      }
    } catch (error) {
      // 窗口已销毁，重新创建
      createPanel();
    }
  });

  // 拖动相关事件
  let dragStartPos: { x: number; y: number } | null = null;

  ipcMain.on('start-drag', (_, { x, y }) => {
    if (!floatingWindow) return;
    const bounds = floatingWindow.getBounds();
    dragStartPos = {
      x: x - bounds.x,
      y: y - bounds.y,
    };
  });

  ipcMain.on('drag-move', (_, { x, y }) => {
    if (!floatingWindow || !dragStartPos) return;

    const newX = x - dragStartPos.x;
    const newY = y - dragStartPos.y;

    // 应用磁吸
    const snapped = snapToEdge(newX, newY, 60, 60);
    floatingWindow.setPosition(snapped.x, snapped.y);
  });

  ipcMain.on('stop-drag', () => {
    if (!floatingWindow) return;
    dragStartPos = null;

    // 保存最终位置
    const bounds = floatingWindow.getBounds();
    savePosition(bounds.x, bounds.y);
  });

  // 调整面板高度
  ipcMain.on('resize-panel', (_, { height }: { height: number }) => {
    if (!panelWindow || panelWindow.isDestroyed()) return;
    const bounds = panelWindow.getBounds();
    panelWindow.setBounds({
      x: bounds.x,
      y: bounds.y,
      width: 320,
      height: height,
    });
  });
}

// 安全发送消息到窗口（避免 destroyed 异常）
function safeWebContentsSend(window: BrowserWindow | null, channel: string, ...args: any[]) {
  try {
    if (!window || window.isDestroyed()) return false;
    const contents = window.webContents;
    if (!contents || contents.isDestroyed()) return false;
    contents.send(channel, ...args);
    return true;
  } catch (error) {
    // 静默失败，避免日志污染
    return false;
  }
}

// 启动状态更新定时器 (每 10 秒)
function startStatusUpdater() {
  statusUpdateTimer = setInterval(async () => {
    // 更新悬浮球状态
    if (floatingWindow && !floatingWindow.isDestroyed()) {
      try {
        const status = await dataService.getStatus();
        safeWebContentsSend(floatingWindow, 'status-update', status);
      } catch (error) {
        // 静默失败
      }
    }

    // 更新面板数据
    if (panelWindow && !panelWindow.isDestroyed() && panelWindow.isVisible()) {
      try {
        const data = await dataService.getDetailedData();
        safeWebContentsSend(panelWindow, 'data-update', data);
      } catch (error) {
        // 静默失败
      }
    }
  }, 10000);
}

// 设置事件监听器（模块加载时立即执行）
setupAppListeners();
setupIpcHandlers();

// 应用准备完成后启动
app.whenReady().then(() => {
  createFloatingBall();
  createTray();
  startStatusUpdater();
});
