/**
 * AgentGuard Desktop - Preload Script
 * Safely expose Electron APIs to renderer process
 */
import { contextBridge, ipcRenderer } from 'electron';

// Expose protected methods to renderer
contextBridge.exposeInMainWorld('electronAPI', {
  // Scan operations
  scanAgents: () => ipcRenderer.invoke('scan-agents'),

  // Fix operations
  fixIssues: (agentId: string) => ipcRenderer.invoke('fix-issues', agentId),

  // Control operations
  stopAgent: (agentId: string) => ipcRenderer.invoke('stop-agent', agentId),
  restartAgent: (agentId: string) => ipcRenderer.invoke('restart-agent', agentId),

  // Window operations
  toggleFloatingWindow: () => ipcRenderer.invoke('toggle-floating-window'),

  // Event listeners
  onScanResults: (callback: (data: any) => void) => {
    ipcRenderer.on('scan-results', (_event, data) => callback(data));
  },

  onScanSummary: (callback: (data: any) => void) => {
    ipcRenderer.on('scan-summary', (_event, data) => callback(data));
  },

  // Clean up listeners
  removeAllListeners: (channel: string) => {
    ipcRenderer.removeAllListeners(channel);
  },
});

// Type declarations for TypeScript
declare global {
  interface Window {
    electronAPI: {
      scanAgents: () => Promise<void>;
      fixIssues: (agentId: string) => Promise<{ success: boolean }>;
      stopAgent: (agentId: string) => Promise<{ success: boolean; error?: string }>;
      restartAgent: (agentId: string) => Promise<{ success: boolean; error?: string }>;
      toggleFloatingWindow: () => Promise<void>;
      onScanResults: (callback: (data: any) => void) => void;
      onScanSummary: (callback: (data: any) => void) => void;
      removeAllListeners: (channel: string) => void;
    };
  }
}
