console.log('=== Electron Environment Test ===');
console.log('process.type:', process.type);
console.log('process.versions.electron:', process.versions.electron);
console.log('process.versions.chrome:', process.versions.chrome);

// 尝试不同的方式获取 electron
console.log('\n=== Testing require methods ===');

// 方法1: 标准 require
try {
  const electron1 = require('electron');
  console.log('Method 1 (require): type =', typeof electron1);
  if (typeof electron1 === 'object') {
    console.log('  Keys:', Object.keys(electron1).slice(0, 5));
  }
} catch (e) {
  console.log('Method 1 failed:', e.message);
}

// 方法2: 通过 remote (已废弃但可能存在)
try {
  const { remote } = require('@electron/remote');
  console.log('Method 2 (@electron/remote): available');
} catch (e) {
  console.log('Method 2 failed:', e.message);
}

// 方法3: 检查全局对象
console.log('\n=== Global objects ===');
console.log('global.require:', typeof global.require);
console.log('window:', typeof window);

process.exit(0);
