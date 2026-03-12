// 纯 JavaScript 测试 - 不经过 TypeScript
console.log('[TEST] Starting plain JS test...');
console.log('[TEST] process.type:', process.type);
console.log('[TEST] process.versions.electron:', process.versions.electron);

const electron = require('electron');
console.log('[TEST] electron type:', typeof electron);
console.log('[TEST] electron value:', electron);

if (typeof electron === 'string') {
  console.error('[ERROR] electron is a string (path), not API object!');
  console.error('[ERROR] This means we are NOT in Electron main process context!');
  process.exit(1);
}

const { app } = electron;
console.log('[TEST] app type:', typeof app);

if (!app) {
  console.error('[ERROR] app is undefined!');
  process.exit(1);
}

console.log('[SUCCESS] app is available!');
app.whenReady().then(() => {
  console.log('[SUCCESS] App ready!');
  app.quit();
});
