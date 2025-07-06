export interface ElectronAPI {
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
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}