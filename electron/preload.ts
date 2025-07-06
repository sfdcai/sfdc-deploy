import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron';

declare global {
  interface Window {
    electronAPI: {
      getProjects: () => Promise<string[]>;
      executeToolkitCommand: (
        command: string, 
        projectName: string, 
        options: any,
        onData: (data: string) => void
      ) => Promise<void>;
    };
  }
}

contextBridge.exposeInMainWorld('electronAPI', {
  getProjects: () => ipcRenderer.invoke('get-projects'),
  
  executeToolkitCommand: (
    command: string, 
    projectName: string, 
    options: any, 
    onData: (data: string) => void
  ) => {
    const listener = (event: IpcRendererEvent, data: string) => {
      onData(data);
    };
    ipcRenderer.on('toolkit-output', listener);
    
    return ipcRenderer.invoke('execute-toolkit-command', command, projectName, options)
      .finally(() => {
        ipcRenderer.removeListener('toolkit-output', listener);
      });
  }
});
