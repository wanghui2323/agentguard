// Simple Electron entry point that requires the compiled TypeScript
// This avoids any module resolution issues with TypeScript imports

const path = require('path');

// Check if we're in Electron environment
if (!process.versions.electron) {
  console.error('This script must be run with Electron!');
  process.exit(1);
}

console.log('Electron entry point started');
console.log('Electron version:', process.versions.electron);
console.log('Node version:', process.versions.node);

// Debug: Test electron module
const electronModule = require('electron');
console.log('=== Electron module debug ===');
console.log('electronModule type:', typeof electronModule);
console.log('electronModule keys:', Object.keys(electronModule).join(', '));
console.log('electronModule.app type:', typeof electronModule.app);

// Require the compiled main process code
try {
  console.log('Loading compiled main process...');
  require('./dist/desktop/desktop/main/index.js');
  console.log('Main process loaded successfully');
} catch (error) {
  console.error('Failed to load main process:', error);
  process.exit(1);
}
