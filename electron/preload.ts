import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron';

declare global {
  interface Window {
    electronAPI: {
      // Project Management
      getProjects: () => Promise<string[]>;
      
      // PowerShell Integration
      executePowerShell: (script: string, args?: string[]) => Promise<{ success: boolean; output: string; error: string | null }>;
      executePowerShellCommand: (command: string) => Promise<{ success: boolean; output: string; error: string | null }>;
      
      // Salesforce CLI Integration
      executeSfCommand: (command: string, args: string[]) => Promise<any>;
      getOrgsList: () => Promise<any[]>;
      
      // System Checks
      checkSoftwareInstalled: (software: string) => Promise<{ installed: boolean; version: string | null }>;
      getScriptsDirectory: () => Promise<string>;
      
      // File Operations
      saveFile: (content: string, filename: string) => Promise<string | null>;
      openFile: () => Promise<{ path: string; content: string } | null>;
      selectDirectory: () => Promise<string | null>;
      
      // External Operations
      openExternal: (url: string) => Promise<void>;
      
      // Settings Management
      getSetting: (key: string) => Promise<any>;
      setSetting: (key: string, value: any) => Promise<void>;
      
      // Application Info
      getAppInfo: () => Promise<{ name: string; version: string; author: string; linkedin: string }>;
      
      // Logging
      logInfo: (category: string, message: string, details?: any) => Promise<void>;
      logWarn: (category: string, message: string, details?: any) => Promise<void>;
      logError: (category: string, message: string, details?: any) => Promise<void>;
      logDebug: (category: string, message: string, details?: any) => Promise<void>;
      
      // Advanced Features
      installSoftware: (wingetId: string) => Promise<{ success: boolean; output: string }>;
      runSystemCheck: (forceRefresh?: boolean) => Promise<any>;
      clearProjectCache: () => Promise<void>;
      backupMetadata: (orgAlias: string, manifestPath: string) => Promise<string>;
      validateDeployment: (manifestPath: string, targetOrg: string, testLevel: string) => Promise<any>;
      deployMetadata: (manifestPath: string, targetOrg: string, testLevel: string) => Promise<any>;
      compareOrgs: (sourceOrg: string, targetOrg: string, manifestPath: string) => Promise<void>;
      analyzeDependencies: (orgAlias: string, metadataType: string, memberName: string) => Promise<any>;
      analyzePermissions: (sourcePath: string) => Promise<any>;
    };
  }
}

contextBridge.exposeInMainWorld('electronAPI', {
  // Project Management
  getProjects: () => ipcRenderer.invoke('get-projects'),
  
  // PowerShell Integration
  executePowerShell: (script: string, args?: string[]) => 
    ipcRenderer.invoke('execute-powershell', script, args),
  executePowerShellCommand: (command: string) => 
    ipcRenderer.invoke('execute-powershell-command', command),
  
  // Salesforce CLI Integration
  executeSfCommand: (command: string, args: string[]) => 
    ipcRenderer.invoke('execute-sf-command', command, args),
  getOrgsList: () => ipcRenderer.invoke('get-orgs-list'),
  
  // System Checks
  checkSoftwareInstalled: (software: string) => 
    ipcRenderer.invoke('check-software-installed', software),
  getScriptsDirectory: () => ipcRenderer.invoke('get-scripts-directory'),
  
  // File Operations
  saveFile: (content: string, filename: string) => 
    ipcRenderer.invoke('save-file', content, filename),
  openFile: () => ipcRenderer.invoke('open-file'),
  selectDirectory: () => ipcRenderer.invoke('select-directory'),
  
  // External Operations
  openExternal: (url: string) => ipcRenderer.invoke('open-external', url),
  
  // Settings Management
  getSetting: (key: string) => ipcRenderer.invoke('get-setting', key),
  setSetting: (key: string, value: any) => ipcRenderer.invoke('set-setting', key, value),
  
  // Application Info
  getAppInfo: () => ipcRenderer.invoke('get-app-info'),
  
  // Logging
  logInfo: (category: string, message: string, details?: any) => 
    ipcRenderer.invoke('log-info', category, message, details),
  logWarn: (category: string, message: string, details?: any) => 
    ipcRenderer.invoke('log-warn', category, message, details),
  logError: (category: string, message: string, details?: any) => 
    ipcRenderer.invoke('log-error', category, message, details),
  logDebug: (category: string, message: string, details?: any) => 
    ipcRenderer.invoke('log-debug', category, message, details),
  
  // Advanced Features
  installSoftware: (wingetId: string) => 
    ipcRenderer.invoke('install-software', wingetId),
  runSystemCheck: (forceRefresh?: boolean) => 
    ipcRenderer.invoke('run-system-check', forceRefresh),
  clearProjectCache: () => ipcRenderer.invoke('clear-project-cache'),
  backupMetadata: (orgAlias: string, manifestPath: string) => 
    ipcRenderer.invoke('backup-metadata', orgAlias, manifestPath),
  validateDeployment: (manifestPath: string, targetOrg: string, testLevel: string) => 
    ipcRenderer.invoke('validate-deployment', manifestPath, targetOrg, testLevel),
  deployMetadata: (manifestPath: string, targetOrg: string, testLevel: string) => 
    ipcRenderer.invoke('deploy-metadata', manifestPath, targetOrg, testLevel),
  compareOrgs: (sourceOrg: string, targetOrg: string, manifestPath: string) => 
    ipcRenderer.invoke('compare-orgs', sourceOrg, targetOrg, manifestPath),
  analyzeDependencies: (orgAlias: string, metadataType: string, memberName: string) => 
    ipcRenderer.invoke('analyze-dependencies', orgAlias, metadataType, memberName),
  analyzePermissions: (sourcePath: string) => 
    ipcRenderer.invoke('analyze-permissions', sourcePath)
});