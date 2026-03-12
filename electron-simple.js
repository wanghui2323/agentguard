// 简化的 Electron 启动脚本 - 直接使用字面量方式避免 require 问题
const path = require('path');
const { spawn } = require('child_process');

// 获取 Electron 可执行文件路径
const electronPath = require('electron');
console.log('Electron path:', electronPath);

// 创建最简单的主进程代码
const mainCode = `
const { app, BrowserWindow } = require('electron');
const path = require('path');

console.log('Starting AgentGuard Desktop...');
console.log('Electron version:', process.versions.electron);
console.log('Node version:', process.versions.node);

app.whenReady().then(() => {
  console.log('App is ready!');

  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  // 加载一个简单的 HTML 来测试
  win.loadURL('data:text/html,<h1>AgentGuard Desktop</h1><p>Testing...</p>');

  win.webContents.openDevTools();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
`;

// 将代码写入临时文件
const fs = require('fs');
const tmpFile = path.join(__dirname, '.electron-main-temp.js');
fs.writeFileSync(tmpFile, mainCode);

console.log('Starting Electron with temp main file...');

// 启动 Electron
const child = spawn(electronPath, [tmpFile], {
  stdio: 'inherit',
  env: process.env
});

child.on('close', (code) => {
  console.log('Electron exited with code:', code);
  // 清理临时文件
  try {
    fs.unlinkSync(tmpFile);
  } catch (e) {
    // ignore
  }
  process.exit(code);
});
