export interface ElectronAPI {
  executePowerShell: (script: string, args?: string[]) => Promise<{ success: boolean; output: string; error: string | null }>;
  executePowerShellCommand: (command: string) => Promise<{ success: boolean; output: string; error: string | null }>;
  getOrgsList: () => Promise<any[]>;
  checkSoftwareInstalled: (software: string) => Promise<{ installed: boolean; version: string | null }>;
  getScriptsDirectory: () => Promise<string>;
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