// Electron Main Process Wrapper
// 解决 require('electron') 返回字符串路径的问题

// 在 Electron 环境中,应该可以通过 process.electronBinding 访问原生模块
if (typeof process.electronBinding === 'function') {
  console.log('[Wrapper] Running in Electron environment');

  // 直接加载编译后的主进程代码
  require('./dist/desktop/desktop/main/index.js');
} else {
  console.error('[Wrapper] Not running in Electron environment!');
  console.error('[Wrapper] process.versions:', process.versions);
  process.exit(1);
}
