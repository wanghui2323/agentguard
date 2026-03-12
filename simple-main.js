const { app, BrowserWindow } = require('electron');

console.log('[SIMPLE TEST] typeof app:', typeof app);
console.log('[SIMPLE TEST] typeof BrowserWindow:', typeof BrowserWindow);

if (!app) {
  console.error('[ERROR] app is undefined!');
  console.error('[ERROR] This should NOT happen in a proper Electron environment');
  process.exit(1);
}

console.log('[SUCCESS] app object exists!');

app.whenReady().then(() => {
  console.log('[SUCCESS] App is ready!');
  
  const win = new BrowserWindow({
    width: 400,
    height: 300,
    x: 100,
    y: 100,
    title: 'AgentGuard Test',
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });
  
  win.loadURL('data:text/html,<h1 style="color: green;">✅ Electron Works!</h1><p>App object is available!</p>');
  
  console.log('[SUCCESS] Window created!');
  
  // 保持窗口打开以便查看
  setTimeout(() => {
    console.log('[INFO] Test complete. Closing app...');
    app.quit();
  }, 3000);
});

app.on('window-all-closed', () => {
  console.log('[INFO] All windows closed');
  app.quit();
});

console.log('[INFO] Main script loaded, waiting for app.whenReady()...');
