// Simple test to check electron module loading
console.log('Testing electron module...');
const electron = require('electron');
console.log('Type:', typeof electron);
console.log('Is object?', typeof electron === 'object');
console.log('Has app?', electron.app !== undefined);

if (electron.app) {
  console.log('SUCCESS: Electron API loaded correctly!');
  electron.app.whenReady().then(() => {
    console.log('Electron is ready!');
    electron.app.quit();
  });
} else {
  console.log('FAIL: electron is:', electron);
  process.exit(1);
}
