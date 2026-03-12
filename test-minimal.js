const { app } = require('electron');
console.log('App:', typeof app);

if (app) {
  app.whenReady().then(() => {
    console.log('Ready!');
    app.quit();
  });
}
