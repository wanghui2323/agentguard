/**
 * AgentGuard Desktop - Bootstrap Entry Point
 * This file loads the electron module and then launches the actual main process
 */

// Import Electron - this should work in the Electron runtime
const { app, BrowserWindow } = require('electron');

console.log('Bootstrap: Electron loaded successfully!');
console.log('App:', typeof app);
console.log('BrowserWindow:', typeof BrowserWindow);

// Simple test window
app.whenReady().then(() => {
  const win = new BrowserWindow({
    width: 800,
    height: 600
  });

  win.loadURL('data:text/html,<h1>AgentGuard Desktop - Electron Test</h1><p>If you see this, Electron is working!</p>');

  console.log('Window created successfully!');
});

app.on('window-all-closed', () => {
  app.quit();
});
