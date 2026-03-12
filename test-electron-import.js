// Test different import methods
console.log('=== Test 1: Direct require ===');
const electron = require('electron');
console.log('electron type:', typeof electron);
console.log('electron.app:', typeof electron.app);

console.log('\n=== Test 2: Destructure ===');
try {
  const { app } = require('electron');
  console.log('app via destructure:', typeof app);
} catch (e) {
  console.log('Error:', e.message);
}

console.log('\n=== Test 3: Dynamic import ===');
(async () => {
  try {
    const mod = await import('electron');
    console.log('dynamic import type:', typeof mod);
    console.log('mod.default:', typeof mod.default);
    console.log('mod.app:', typeof mod.app);
  } catch (e) {
    console.log('Error:', e.message);
  }
})();
