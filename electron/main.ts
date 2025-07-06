import { app, BrowserWindow, ipcMain, dialog, shell } from 'electron';
import path from 'path';
import { spawn, exec } from 'child_process';
import fs from 'fs/promises';
import Store from 'electron-store';

const store = new Store();

const createWindow = () => {
    const mainWindow = new BrowserWindow({
        width: 1400, 
        height: 900,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false
        },
        icon: path.join(__dirname, '..', 'assets', 'icon.png'),
        titleBarStyle: 'default',
        show: false
    });

    mainWindow.once('ready-to-show', () => {
        mainWindow.show();
    });

    if (app.isPackaged) {
        mainWindow.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));
    } else {
        mainWindow.loadURL('http://localhost:5173');
        mainWindow.webContents.openDevTools();
    }
};

const getScriptPath = (scriptName: string) => {
    if (app.isPackaged) {
        return path.join(process.resourcesPath, scriptName);
    }
    return path.resolve(app.getAppPath(), '..', scriptName);
};

const getScriptsDirectory = () => {
    if (app.isPackaged) {
        return path.join(process.resourcesPath, 'scripts');
    }
    return path.resolve(app.getAppPath(), '..', 'scripts');
};

// Project Management
ipcMain.handle('get-projects', async () => {
    try {
        const configDir = path.join(app.getPath('userData'), 'configs');
        await fs.mkdir(configDir, { recursive: true });
        const files = await fs.readdir(configDir);
        return files.filter(f => f.endsWith('.json')).map(f => f.replace('.json', ''));
    } catch (error) {
        console.error('Failed to get projects:', error);
        return [];
    }
});

// PowerShell Integration
ipcMain.handle('execute-powershell', async (event, scriptPath, args = []) => {
    return new Promise((resolve) => {
        const psArgs = ['-ExecutionPolicy', 'Bypass', '-NoProfile', '-File', scriptPath, ...args];
        const ps = spawn('powershell.exe', psArgs);
        
        let output = '';
        let error = '';
        
        ps.stdout.on('data', (data) => {
            output += data.toString();
        });
        
        ps.stderr.on('data', (data) => {
            error += data.toString();
        });
        
        ps.on('close', (code) => {
            resolve({
                success: code === 0,
                output: output.trim(),
                error: error.trim() || null
            });
        });
        
        ps.on('error', (err) => {
            resolve({
                success: false,
                output: '',
                error: err.message
            });
        });
    });
});

ipcMain.handle('execute-powershell-command', async (event, command) => {
    return new Promise((resolve) => {
        const ps = spawn('powershell.exe', ['-ExecutionPolicy', 'Bypass', '-NoProfile', '-Command', command]);
        
        let output = '';
        let error = '';
        
        ps.stdout.on('data', (data) => {
            output += data.toString();
        });
        
        ps.stderr.on('data', (data) => {
            error += data.toString();
        });
        
        ps.on('close', (code) => {
            resolve({
                success: code === 0,
                output: output.trim(),
                error: error.trim() || null
            });
        });
        
        ps.on('error', (err) => {
            resolve({
                success: false,
                output: '',
                error: err.message
            });
        });
    });
});

// Salesforce CLI Integration
ipcMain.handle('execute-sf-command', async (event, command, args) => {
    return new Promise((resolve, reject) => {
        const sfArgs = [command, ...args, '--json'];
        const sf = spawn('sf', sfArgs);
        
        let output = '';
        let error = '';
        
        sf.stdout.on('data', (data) => {
            output += data.toString();
        });
        
        sf.stderr.on('data', (data) => {
            error += data.toString();
        });
        
        sf.on('close', (code) => {
            if (code === 0) {
                try {
                    const result = JSON.parse(output);
                    resolve(result);
                } catch (parseError) {
                    resolve({ output, error });
                }
            } else {
                reject(new Error(error || `Command failed with code ${code}`));
            }
        });
        
        sf.on('error', (err) => {
            reject(err);
        });
    });
});

ipcMain.handle('get-orgs-list', async () => {
    try {
        const result = await new Promise((resolve, reject) => {
            const sf = spawn('sf', ['org', 'list', '--json']);
            let output = '';
            let error = '';
            
            sf.stdout.on('data', (data) => {
                output += data.toString();
            });
            
            sf.stderr.on('data', (data) => {
                error += data.toString();
            });
            
            sf.on('close', (code) => {
                if (code === 0) {
                    try {
                        const result = JSON.parse(output);
                        resolve(result);
                    } catch (parseError) {
                        resolve({ result: [] });
                    }
                } else {
                    resolve({ result: [] });
                }
            });
            
            sf.on('error', () => {
                resolve({ result: [] });
            });
        }) as any;
        
        return result.result || [];
    } catch (error) {
        console.error('Failed to get orgs list:', error);
        return [];
    }
});

ipcMain.handle('retrieve-metadata', async (event, { manifestPath, targetOrg }) => {
    try {
        const scriptPath = getScriptPath('toolkit.ps1'); // Assuming toolkit.ps1 is available at the resourcesPath or parent dir

        let commandArgs = ['sf project retrieve start'];
        if (manifestPath) {
            commandArgs.push(`--manifest "${manifestPath}"`);
        }
        if (targetOrg) {
            commandArgs.push(`--target-org "${targetOrg}"`);
        }

        const command = commandArgs.join(' ');
        // Assuming toolkit.ps1 handles the -CommandToRun parameter
        return await ipcMain.handlers['execute-powershell'](event, scriptPath, ['-CommandToRun', command]);
    } catch (error: any) {
        return { success: false, output: '', error: error.message };
    }
});

ipcMain.handle('deploy-metadata', async (event, { manifestPath, sourcePath, targetOrg, testLevel, testsToRun }) => {
    try {
        const scriptPath = getScriptPath('toolkit.ps1'); // Assuming toolkit.ps1 is available at the resourcesPath or parent dir
        
        let commandArgs = ['sf project deploy start'];
        if (manifestPath) {
            commandArgs.push(`--manifest "${manifestPath}"`);
        } else if (sourcePath) {
            commandArgs.push(`--source-path "${sourcePath}"`);
        }
        if (targetOrg) {
            commandArgs.push(`--target-org "${targetOrg}"`);
        }
        if (testLevel) {
            commandArgs.push(`--test-level "${testLevel}"`);
        }
        if (testLevel === 'RunSpecifiedTests' && testsToRun) {
            commandArgs.push(`--tests-to-run "${testsToRun}"`);
        }
        
        const command = commandArgs.join(' ');
        return await ipcMain.handlers['execute-powershell'](event, scriptPath, ['-CommandToRun', command]);
    } catch (error: any) {
        return { success: false, output: '', error: error.message };
    }
});

// Cache Management
ipcMain.handle('clear-project-cache', async (event, projectName) => {
 try {
 if (!projectName) {
 throw new Error('Project name is required to clear cache.');
 }
 const configDir = path.join(app.getPath('userData'), 'configs');
 const configFile = path.join(configDir, `${projectName}.json`);
 const logDir = path.join(app.getPath('userData'), 'logs');
 const logFile = path.join(logDir, `toolkit-${new Date().toISOString().split('T')[0]}-${projectName}.log`); // Assuming project-specific logs

 try {
 await fs.unlink(configFile);
 } catch (e: any) {
 if (e.code !== 'ENOENT') throw e; // Ignore if file doesn't exist
 }
 // Note: Clearing project-specific logs would require a different logging structure
 // or deleting all logs if logs are not project-specific.
 // For simplicity, we'll just clear the config file for now.
 return { success: true };
 } catch (error: any) {
 return { success: false, error: error.message };
 }
});
// System Checks
ipcMain.handle('check-software-installed', async (event, software) => {
    return new Promise((resolve) => {
        exec(`${software} --version`, (error, stdout) => {
            if (error) {
                resolve({ installed: false, version: null });
            } else {
                resolve({ installed: true, version: stdout.trim() });
            }
        });
    });
});

ipcMain.handle('get-scripts-directory', async () => {
    return getScriptsDirectory();
});

// File Operations
ipcMain.handle('save-file', async (event, content, defaultFilename) => {
    try {
        const result = await dialog.showSaveDialog({
            defaultPath: defaultFilename,
            filters: [
                { name: 'XML Files', extensions: ['xml'] },
                { name: 'All Files', extensions: ['*'] }
            ]
        });
        
        if (!result.canceled && result.filePath) {
            await fs.writeFile(result.filePath, content, 'utf8');
            return result.filePath;
        }
        return null;
    } catch (error) {
        console.error('Failed to save file:', error);
        throw error;
    }
});

ipcMain.handle('open-file', async () => {
    try {
        const result = await dialog.showOpenDialog({
            properties: ['openFile'],
            filters: [
                { name: 'XML Files', extensions: ['xml'] },
                { name: 'All Files', extensions: ['*'] }
            ]
        });
        
        if (!result.canceled && result.filePaths.length > 0) {
            const filePath = result.filePaths[0];
            const content = await fs.readFile(filePath, 'utf8');
            return { path: filePath, content };
        }
        return null;
    } catch (error) {
        console.error('Failed to open file:', error);
        throw error;
    }
});

ipcMain.handle('select-directory', async () => {
    try {
        const result = await dialog.showOpenDialog({
            properties: ['openDirectory']
        });
        
        if (!result.canceled && result.filePaths.length > 0) {
            return result.filePaths[0];
        }
        return null;
    } catch (error) {
        console.error('Failed to select directory:', error);
        throw error;
    }
});

// External Operations
ipcMain.handle('open-external', async (event, url) => {
    await shell.openExternal(url);
});

// Settings Management
ipcMain.handle('get-setting', async (event, key) => {
    return store.get(key);
});

ipcMain.handle('set-setting', async (event, key, value) => {
    store.set(key, value);
});

// Application Info
ipcMain.handle('get-app-info', async () => {
    try {
        const packageJson = require('../package.json');
        return {
            name: packageJson.name,
            version: packageJson.version,
            author: packageJson.author,
            linkedin: 'https://www.linkedin.com/in/salesforce-technical-architect/'
        };
    } catch (error) {
        return {
            name: 'Salesforce Toolkit',
            version: '1.0.0',
            author: 'Amit Bhardwaj',
            linkedin: 'https://www.linkedin.com/in/salesforce-technical-architect/'
        };
    }
});

// Logging
const logToFile = async (level: string, category: string, message: string, details?: any) => {
    try {
        const logDir = path.join(app.getPath('userData'), 'logs');
        await fs.mkdir(logDir, { recursive: true });
        
        const logFile = path.join(logDir, `toolkit-${new Date().toISOString().split('T')[0]}.log`);
        const logEntry = {
            timestamp: new Date().toISOString(),
            level: level.toUpperCase(),
            category,
            message,
            details
        };
        
        await fs.appendFile(logFile, JSON.stringify(logEntry) + '\n');
    } catch (error) {
        console.error('Failed to write log:', error);
    }
};

// Get application logs
ipcMain.handle('get-application-logs', async () => {
    try {
        const logDir = path.join(app.getPath('userData'), 'logs');
        const logFile = path.join(logDir, `toolkit-${new Date().toISOString().split('T')[0]}.log`);
        const content = await fs.readFile(logFile, 'utf8');
        return content;
    } catch (error: any) {
        // Return empty string if file doesn't exist, throw other errors
        if (error.code === 'ENOENT') return '';
        throw error;
    }
});
ipcMain.handle('log-info', async (event, category, message, details) => {
    await logToFile('info', category, message, details);
});

ipcMain.handle('log-warn', async (event, category, message, details) => {
    await logToFile('warn', category, message, details);
});

ipcMain.handle('log-error', async (event, category, message, details) => {
    await logToFile('error', category, message, details);
});

ipcMain.handle('log-debug', async (event, category, message, details) => {
    await logToFile('debug', category, message, details);
});

// Advanced Features
ipcMain.handle('install-software', async (event, wingetId) => {
    return new Promise((resolve) => {
        const winget = spawn('winget', ['install', '--id', wingetId, '-e', '--accept-package-agreements', '--accept-source-agreements']);
        
        let output = '';
        let error = '';
        
        winget.stdout.on('data', (data) => {
            output += data.toString();
        });
        
        winget.stderr.on('data', (data) => {
            error += data.toString();
        });
        
        winget.on('close', (code) => {
            resolve({
                success: code === 0,
                output: output + error
            });
        });
        
        winget.on('error', (err) => {
            resolve({
                success: false,
                output: err.message
            });
        });
    });
});

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
});