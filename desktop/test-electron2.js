// Test with different import approaches
console.log('Test 1: Direct properties');
const { app } = require('electron');
console.log('app type:', typeof app);
console.log('app:', app);

if (app && app.whenReady) {
  console.log('SUCCESS!');
  app.whenReady().then(() => {
    console.log('Electron ready!');
    app.quit();
  });
} else {
  console.log('FAIL - app is undefined or missing whenReady');
  process.exit(1);
}
