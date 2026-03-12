// Test Electron app object
const { app, BrowserWindow } = require('electron');

console.log('App type:', typeof app);
console.log('App has on:', typeof app?.on);

if (app) {
  app.whenReady().then(() => {
    console.log('App is ready!');
    app.quit();
  });
} else {
  console.error('App is undefined!');
  process.exit(1);
}
