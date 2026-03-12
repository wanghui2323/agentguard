const electronModule = require('electron');
console.log('electron module type:', typeof electronModule);

// Electron 40+ may have changed to ES modules
const electron = electronModule.default || electronModule;
console.log('electron type:', typeof electron);

const { app } = electron;
console.log('app type:', typeof app);

if (app) {
  app.whenReady().then(() => {
    console.log('App ready!');
    app.quit();
  });
} else {
  console.error('App still undefined!');
  process.exit(1);
}
