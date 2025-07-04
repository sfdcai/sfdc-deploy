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