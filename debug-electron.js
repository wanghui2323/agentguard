console.log('=== Debugging Electron Require ===');

try {
  const electron = require('electron');
  console.log('✓ require("electron") succeeded');
  console.log('Type:', typeof electron);
  console.log('Keys:', Object.keys(electron).slice(0, 10));
  console.log('app exists:', !!electron.app);
  console.log('BrowserWindow exists:', !!electron.BrowserWindow);

  if (electron.app) {
    electron.app.whenReady().then(() => {
      console.log('✓ App is ready!');
      electron.app.quit();
    });
  } else {
    console.error('✗ electron.app is undefined!');
    process.exit(1);
  }
} catch (error) {
  console.error('✗ Error requiring electron:', error.message);
  process.exit(1);
}
