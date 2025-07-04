import { app, BrowserWindow, ipcMain, dialog, shell } from 'electron';
import { spawn, exec } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import Store from 'electron-store';
import log from 'electron-log';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Configure electron-log early in the process
log.transports.file.level = 'debug';
log.transports.console.level = 'debug';
log.transports.file.maxSize = 5 * 1024 * 1024; // 5MB

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
    log.info('Electron reload not available in production');
  }
}

let mainWindow: BrowserWindow | null = null;

const createWindow = () => {
  log.info('Creating main window');
  
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
    log.info('Main window ready to show');
    mainWindow?.show();
  });

  mainWindow.on('closed', () => {
    log.info('Main window closed');
    mainWindow = null;
  });
};

app.whenReady().then(() => {
  log.info('App ready, creating window');
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  log.info('All windows closed');
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Enhanced IPC Handlers with logging
ipcMain.handle('execute-sf-command', async (event, command: string, args: string[]) => {
  const commandString = `sf ${command} ${args.join(' ')}`;
  log.info(`Executing SF command: ${commandString}`);
  
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
          log.info(`SF command successful: ${commandString}`, { result });
          resolve(result);
        } catch (e) {
          log.info(`SF command successful (raw output): ${commandString}`, { stdout });
          resolve({ output: stdout, raw: true });
        }
      } else {
        const error = new Error(stderr || stdout);
        log.error(`SF command failed: ${commandString}`, { error: error.message, code });
        reject(error);
      }
    });

    process.on('error', (error) => {
      log.error(`SF command error: ${commandString}`, { error: error.message });
      reject(error);
    });
  });
});

ipcMain.handle('execute-shell-command', async (event, command: string) => {
  log.info(`Executing shell command: ${command}`);
  
  return new Promise((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
      if (error) {
        log.error(`Shell command failed: ${command}`, { error: error.message, stderr });
        reject({ error: error.message, stderr });
      } else {
        log.info(`Shell command successful: ${command}`, { stdout });
        resolve({ stdout, stderr });
      }
    });
  });
});

ipcMain.handle('check-software-installed', async (event, software: string) => {
  log.debug(`Checking if ${software} is installed`);
  
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
      log.warn(`Unknown software check requested: ${software}`);
      resolve({ installed: false, version: null });
      return;
    }

    exec(command, (error, stdout) => {
      if (error) {
        log.debug(`${software} not installed or not in PATH`);
        resolve({ installed: false, version: null });
      } else {
        const version = stdout.trim();
        log.debug(`${software} is installed`, { version });
        resolve({ installed: true, version });
      }
    });
  });
});

ipcMain.handle('save-file', async (event, content: string, filename: string) => {
  log.info(`Saving file: ${filename}`);
  
  const result = await dialog.showSaveDialog(mainWindow!, {
    defaultPath: filename,
    filters: [
      { name: 'XML Files', extensions: ['xml'] },
      { name: 'JSON Files', extensions: ['json'] },
      { name: 'All Files', extensions: ['*'] }
    ]
  });

  if (!result.canceled && result.filePath) {
    try {
      const fs = await import('fs/promises');
      await fs.writeFile(result.filePath, content, 'utf8');
      log.info(`File saved successfully: ${result.filePath}`);
      return result.filePath;
    } catch (error) {
      log.error(`Failed to save file: ${result.filePath}`, { error });
      throw error;
    }
  }
  return null;
});

ipcMain.handle('open-file', async () => {
  log.info('Opening file dialog');
  
  const result = await dialog.showOpenDialog(mainWindow!, {
    properties: ['openFile'],
    filters: [
      { name: 'XML Files', extensions: ['xml'] },
      { name: 'JSON Files', extensions: ['json'] },
      { name: 'All Files', extensions: ['*'] }
    ]
  });

  if (!result.canceled && result.filePaths.length > 0) {
    try {
      const fs = await import('fs/promises');
      const content = await fs.readFile(result.filePaths[0], 'utf8');
      log.info(`File opened successfully: ${result.filePaths[0]}`);
      return { path: result.filePaths[0], content };
    } catch (error) {
      log.error(`Failed to open file: ${result.filePaths[0]}`, { error });
      throw error;
    }
  }
  return null;
});

ipcMain.handle('select-directory', async () => {
  log.info('Opening directory selection dialog');
  
  const result = await dialog.showOpenDialog(mainWindow!, {
    properties: ['openDirectory']
  });

  if (!result.canceled && result.filePaths.length > 0) {
    log.info(`Directory selected: ${result.filePaths[0]}`);
    return result.filePaths[0];
  }
  return null;
});

ipcMain.handle('open-external', async (event, url: string) => {
  log.info(`Opening external URL: ${url}`);
  await shell.openExternal(url);
});

// Settings management with logging
ipcMain.handle('get-setting', async (event, key: string) => {
  const value = store.get(key);
  log.debug(`Retrieved setting: ${key}`, { value });
  return value;
});

ipcMain.handle('set-setting', async (event, key: string, value: any) => {
  log.info(`Setting saved: ${key}`, { value });
  store.set(key, value);
});

ipcMain.handle('get-app-info', async () => {
  const appInfo = {
    name: app.getName(),
    version: app.getVersion(),
    author: 'Amit Bhardwaj',
    linkedin: 'https://www.linkedin.com/in/salesforce-technical-architect/'
  };
  log.debug('App info requested', appInfo);
  return appInfo;
});

// Error handling
process.on('uncaughtException', (error) => {
  log.error('Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  log.error('Unhandled Rejection at:', promise, 'reason:', reason);
});