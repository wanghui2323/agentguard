// 在主进程中打印（不是在 CLI 脚本中）
setTimeout(() => {
  console.log('[IN MAIN PROCESS]');
  console.log('process.type:', process.type);
  
  try {
    const electron = require('electron');
    console.log('electron type:', typeof electron);
    console.log('electron keys:', Object.keys(electron || {}).slice(0, 10).join(', '));
    
    if (electron.app) {
      console.log('[SUCCESS] electron.app exists!');
      electron.app.quit();
    } else {
      console.log('[ERROR] electron.app is undefined');
      process.exit(1);
    }
  } catch (e) {
    console.error('[ERROR]', e.message);
    process.exit(1);
  }
}, 100);
