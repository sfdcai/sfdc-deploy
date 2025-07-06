import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';
import { spawn } from 'child_process';

const createWindow = () => {
    const mainWindow = new BrowserWindow({
        width: 1200, height: 800,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false
        }
    });

    if (app.isPackaged) {
        mainWindow.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));
    } else {
        mainWindow.loadURL('http://localhost:5173');
        mainWindow.webContents.openDevTools();
    }
};

const getScriptPath = () => app.isPackaged
    ? path.join(process.resourcesPath, 'toolkit.ps1')
    : path.resolve(app.getAppPath(), '..', 'toolkit.ps1');

ipcMain.handle('get-projects', () => {
    return new Promise((resolve, reject) => {
        const ps = spawn('powershell.exe', ['-ExecutionPolicy', 'Bypass', '-NoProfile', '-File', getScriptPath(), '-CommandToRun', 'Get-ProjectList']);
        let output = '';
        ps.stdout.on('data', (data) => output += data.toString());
        ps.stderr.on('data', (data) => console.error(`[PS Error - get-projects]: ${data}`));
        ps.on('close', () => resolve(output.trim().split(/[\r\n]+/).filter(p => p)));
        ps.on('error', reject);
    });
});

ipcMain.handle('execute-toolkit-command', (event, command, projectName, options) => {
    const psArgs = [
        '-ExecutionPolicy', 'Bypass', '-NoProfile', '-File', getScriptPath(),
        '-CommandToRun', command,
        '-ProjectName', projectName
    ];

    if (options?.Alias) psArgs.push('-Alias', options.Alias);
    // Add other future parameters here as needed

    const ps = spawn('powershell.exe', psArgs);

    ps.stdout.on('data', (data) => event.sender.send('toolkit-output', data.toString()));
    ps.stderr.on('data', (data) => event.sender.send('toolkit-output', `ERROR: ${data.toString()}`));

    return new Promise((resolve, reject) => {
        ps.on('close', (code) => code === 0 ? resolve(true) : reject(new Error(`Script exited with code ${code}`)));
        ps.on('error', reject);
    });
});

app.whenReady().then(createWindow);
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
