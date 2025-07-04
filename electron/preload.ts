import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  executeSfCommand: (command: string, args: string[]) => 
    ipcRenderer.invoke('execute-sf-command', command, args),
  executeShellCommand: (command: string) => 
    ipcRenderer.invoke('execute-shell-command', command),
  checkSoftwareInstalled: (software: string) => 
    ipcRenderer.invoke('check-software-installed', software),
  saveFile: (content: string, filename: string) => 
    ipcRenderer.invoke('save-file', content, filename),
  openFile: () => 
    ipcRenderer.invoke('open-file'),
  selectDirectory: () => 
    ipcRenderer.invoke('select-directory'),
  openExternal: (url: string) => 
    ipcRenderer.invoke('open-external', url),
  getSetting: (key: string) => 
    ipcRenderer.invoke('get-setting', key),
  setSetting: (key: string, value: any) => 
    ipcRenderer.invoke('set-setting', key, value),
  getAppInfo: () => 
    ipcRenderer.invoke('get-app-info')
});