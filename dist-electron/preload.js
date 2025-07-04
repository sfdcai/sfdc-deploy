import { contextBridge, ipcRenderer } from 'electron';
// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
    // Salesforce CLI commands
    executeSfCommand: (command, args) => ipcRenderer.invoke('execute-sf-command', command, args),
    // Shell commands
    executeShellCommand: (command) => ipcRenderer.invoke('execute-shell-command', command),
    // Software checks
    checkSoftwareInstalled: (software) => ipcRenderer.invoke('check-software-installed', software),
    // File operations
    saveFile: (content, filename) => ipcRenderer.invoke('save-file', content, filename),
    openFile: () => ipcRenderer.invoke('open-file'),
    selectDirectory: () => ipcRenderer.invoke('select-directory'),
    // External links
    openExternal: (url) => ipcRenderer.invoke('open-external', url),
    // Settings
    getSetting: (key) => ipcRenderer.invoke('get-setting', key),
    setSetting: (key, value) => ipcRenderer.invoke('set-setting', key, value),
    // App info
    getAppInfo: () => ipcRenderer.invoke('get-app-info'),
    // Logging methods
    logInfo: (category, message, details) => ipcRenderer.invoke('log-info', category, message, details),
    logWarn: (category, message, details) => ipcRenderer.invoke('log-warn', category, message, details),
    logError: (category, message, details) => ipcRenderer.invoke('log-error', category, message, details),
    logDebug: (category, message, details) => ipcRenderer.invoke('log-debug', category, message, details)
});
