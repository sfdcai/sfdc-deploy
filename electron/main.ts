import { app, BrowserWindow, ipcMain, dialog, shell } from 'electron';
import { spawn, exec } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import Store from 'electron-store';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Initialize electron store for settings
const store = new Store();

// Enable live reload for development
if (process.env.NODE_ENV === 'development') {
  try {
    require('electron-reload')(__dirname, {
      electron: path.join(__dirname, '..', 'node_modules', '.bin', 'electron'),
      hardResetMethod: 'exit'
    });
  } catch (err) {
    console.log('Electron reload not available in production');
  }
}

let mainWindow: BrowserWindow | null = null;

const createWindow = () => {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1000,
    minHeight: 700,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    titleBarStyle: 'default',
    icon: path.join(__dirname, '../assets/icon.png'),
    show: false
  });

  // Load the app
  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
};

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// IPC Handlers
ipcMain.handle('execute-sf-command', async (event, command: string, args: string[]) => {
  return new Promise((resolve, reject) => {
    const process = spawn('sf', [command, ...args], { shell: true });
    let stdout = '';
    let stderr = '';

    process.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    process.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    process.on('close', (code) => {
      if (code === 0) {
        try {
          const result = JSON.parse(stdout);
          resolve(result);
        } catch (e) {
          resolve({ output: stdout, raw: true });
        }
      } else {
        reject(new Error(stderr || stdout));
      }
    });

    process.on('error', (error) => {
      reject(error);
    });
  });
});

ipcMain.handle('execute-shell-command', async (event, command: string) => {
  return new Promise((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
      if (error) {
        reject({ error: error.message, stderr });
      } else {
        resolve({ stdout, stderr });
      }
    });
  });
});

ipcMain.handle('check-software-installed', async (event, software: string) => {
  return new Promise((resolve) => {
    const commands: { [key: string]: string } = {
      'sf': 'sf --version',
      'node': 'node --version',
      'npm': 'npm --version',
      'git': 'git --version',
      'code': 'code --version'
    };

    const command = commands[software];
    if (!command) {
      resolve({ installed: false, version: null });
      return;
    }

    exec(command, (error, stdout) => {
      if (error) {
        resolve({ installed: false, version: null });
      } else {
        resolve({ installed: true, version: stdout.trim() });
      }
    });
  });
});

ipcMain.handle('save-file', async (event, content: string, filename: string) => {
  const result = await dialog.showSaveDialog(mainWindow!, {
    defaultPath: filename,
    filters: [
      { name: 'XML Files', extensions: ['xml'] },
      { name: 'All Files', extensions: ['*'] }
    ]
  });

  if (!result.canceled && result.filePath) {
    const fs = await import('fs/promises');
    await fs.writeFile(result.filePath, content, 'utf8');
    return result.filePath;
  }
  return null;
});

ipcMain.handle('open-file', async () => {
  const result = await dialog.showOpenDialog(mainWindow!, {
    properties: ['openFile'],
    filters: [
      { name: 'XML Files', extensions: ['xml'] },
      { name: 'All Files', extensions: ['*'] }
    ]
  });

  if (!result.canceled && result.filePaths.length > 0) {
    const fs = await import('fs/promises');
    const content = await fs.readFile(result.filePaths[0], 'utf8');
    return { path: result.filePaths[0], content };
  }
  return null;
});

ipcMain.handle('select-directory', async () => {
  const result = await dialog.showOpenDialog(mainWindow!, {
    properties: ['openDirectory']
  });

  if (!result.canceled && result.filePaths.length > 0) {
    return result.filePaths[0];
  }
  return null;
});

ipcMain.handle('open-external', async (event, url: string) => {
  await shell.openExternal(url);
});

// Settings management
ipcMain.handle('get-setting', async (event, key: string) => {
  return store.get(key);
});

ipcMain.handle('set-setting', async (event, key: string, value: any) => {
  store.set(key, value);
});

ipcMain.handle('get-app-info', async () => {
  return {
    name: app.getName(),
    version: app.getVersion(),
    author: 'Amit Bhardwaj',
    linkedin: 'https://www.linkedin.com/in/salesforce-technical-architect/'
  };
});