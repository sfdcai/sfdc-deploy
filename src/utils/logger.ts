export interface LogEntry {
  id: string;
  timestamp: Date;
  level: 'info' | 'warn' | 'error' | 'debug';
  category: string;
  message: string;
  details?: any;
  userId?: string;
  orgId?: string;
}

class Logger {
  private logs: LogEntry[] = [];
  private maxLogs = 1000;

  private createLogEntry(
    level: LogEntry['level'],
    category: string,
    message: string,
    details?: any,
    userId?: string,
    orgId?: string
  ): LogEntry {
    return {
      id: Math.random().toString(36).substring(2, 9),
      timestamp: new Date(),
      level,
      category,
      message,
      details,
      userId,
      orgId
    };
  }

  private addToMemory(entry: LogEntry) {
    this.logs.unshift(entry);
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(0, this.maxLogs);
    }
  }

  info(category: string, message: string, details?: any, userId?: string, orgId?: string) {
    const entry = this.createLogEntry('info', category, message, details, userId, orgId);
    this.addToMemory(entry);
    
    // Use Electron API for logging if available
    if (window.electronAPI?.logInfo) {
      window.electronAPI.logInfo(category, message, details);
    } else {
      console.info(`[${category}] ${message}`, details || '');
    }
  }

  warn(category: string, message: string, details?: any, userId?: string, orgId?: string) {
    const entry = this.createLogEntry('warn', category, message, details, userId, orgId);
    this.addToMemory(entry);
    
    // Use Electron API for logging if available
    if (window.electronAPI?.logWarn) {
      window.electronAPI.logWarn(category, message, details);
    } else {
      console.warn(`[${category}] ${message}`, details || '');
    }
  }

  error(category: string, message: string, details?: any, userId?: string, orgId?: string) {
    const entry = this.createLogEntry('error', category, message, details, userId, orgId);
    this.addToMemory(entry);
    
    // Use Electron API for logging if available
    if (window.electronAPI?.logError) {
      window.electronAPI.logError(category, message, details);
    } else {
      console.error(`[${category}] ${message}`, details || '');
    }
  }

  debug(category: string, message: string, details?: any, userId?: string, orgId?: string) {
    const entry = this.createLogEntry('debug', category, message, details, userId, orgId);
    this.addToMemory(entry);
    
    // Use Electron API for logging if available
    if (window.electronAPI?.logDebug) {
      window.electronAPI.logDebug(category, message, details);
    } else {
      console.debug(`[${category}] ${message}`, details || '');
    }
  }

  // Audit specific methods
  auditAction(action: string, userId?: string, orgId?: string, details?: any) {
    this.info('AUDIT', `User action: ${action}`, { ...details, action }, userId, orgId);
  }

  auditError(action: string, error: any, userId?: string, orgId?: string) {
    this.error('AUDIT', `Failed action: ${action}`, { action, error: error.message || error }, userId, orgId);
  }

  auditSfCommand(command: string, args: string[], result: any, userId?: string, orgId?: string) {
    this.info('SF_COMMAND', `Executed: sf ${command} ${args.join(' ')}`, { command, args, result }, userId, orgId);
  }

  auditSfCommandError(command: string, args: string[], error: any, userId?: string, orgId?: string) {
    this.error('SF_COMMAND', `Failed: sf ${command} ${args.join(' ')}`, { command, args, error: error.message || error }, userId, orgId);
  }

  // Get logs for display
  getLogs(limit?: number, level?: LogEntry['level'], category?: string): LogEntry[] {
    let filteredLogs = this.logs;

    if (level) {
      filteredLogs = filteredLogs.filter(log => log.level === level);
    }

    if (category) {
      filteredLogs = filteredLogs.filter(log => log.category === category);
    }

    return limit ? filteredLogs.slice(0, limit) : filteredLogs;
  }

  // Clear logs
  clearLogs() {
    this.logs = [];
    this.info('SYSTEM', 'Logs cleared by user');
  }

  // Export logs
  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }
}

export const logger = new Logger();