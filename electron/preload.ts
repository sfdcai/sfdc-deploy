import { contextBridge, ipcRenderer } from 'electron';

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // Salesforce CLI commands
  executeSfCommand: (command: string, args: string[]) => 
    ipcRenderer.invoke('execute-sf-command', command, args),
  
  // Shell commands
  executeShellCommand: (command: string) => 
    ipcRenderer.invoke('execute-shell-command', command),
  
  // Software checks
  checkSoftwareInstalled: (software: string) => 
    ipcRenderer.invoke('check-software-installed', software),
  
  // File operations
  saveFile: (content: string, filename: string) => 
    ipcRenderer.invoke('save-file', content, filename),
  
  openFile: () => 
    ipcRenderer.invoke('open-file'),
  
  selectDirectory: () => 
    ipcRenderer.invoke('select-directory'),
  
  // External links
  openExternal: (url: string) => 
    ipcRenderer.invoke('open-external', url),
  
  // Settings
  getSetting: (key: string) => 
    ipcRenderer.invoke('get-setting', key),
  
  setSetting: (key: string, value: any) => 
    ipcRenderer.invoke('set-setting', key, value),
  
  // App info
  getAppInfo: () => 
    ipcRenderer.invoke('get-app-info'),
  
  // Logging methods
  logInfo: (category: string, message: string, details?: any) =>
    ipcRenderer.invoke('log-info', category, message, details),
  
  logWarn: (category: string, message: string, details?: any) =>
    ipcRenderer.invoke('log-warn', category, message, details),
  
  logError: (category: string, message: string, details?: any) =>
    ipcRenderer.invoke('log-error', category, message, details),
  
  logDebug: (category: string, message: string, details?: any) =>
    ipcRenderer.invoke('log-debug', category, message, details)
});

// Type definitions for the exposed API
export interface ElectronAPI {
  executeSfCommand: (command: string, args: string[]) => Promise<any>;
  executeShellCommand: (command: string) => Promise<{ stdout: string; stderr: string }>;
  checkSoftwareInstalled: (software: string) => Promise<{ installed: boolean; version: string | null }>;
  saveFile: (content: string, filename: string) => Promise<string | null>;
  openFile: () => Promise<{ path: string; content: string } | null>;
  selectDirectory: () => Promise<string | null>;
  openExternal: (url: string) => Promise<void>;
  getSetting: (key: string) => Promise<any>;
  setSetting: (key: string, value: any) => Promise<void>;
  getAppInfo: () => Promise<{ name: string; version: string; author: string; linkedin: string }>;
  logInfo: (category: string, message: string, details?: any) => Promise<void>;
  logWarn: (category: string, message: string, details?: any) => Promise<void>;
  logError: (category: string, message: string, details?: any) => Promise<void>;
  logDebug: (category: string, message: string, details?: any) => Promise<void>;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}