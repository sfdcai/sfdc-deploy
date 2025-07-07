import React, { useState, useEffect } from 'react';
import { Modal } from './Modal';
import { FileText, Download, Trash2, Filter, Search, RefreshCw, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface LogsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface LogEntry { 
  id: string; 
  timestamp: string; 
  level: string; 
  category: string; 
  message: string; 
  details?: any; 
  userId?: string; 
  orgId?: string; 
}

export const LogsModal: React.FC<LogsModalProps> = ({ isOpen, onClose }) => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<LogEntry[]>([]);
  const [levelFilter, setLevelFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadLogs();
    }
  }, [isOpen]);
  
  useEffect(() => {
    filterLogs();
  }, [logs, levelFilter, categoryFilter, searchTerm]);

  const filterLogs = () => {
    let filtered = logs;

    if (levelFilter !== 'all') {
      filtered = filtered.filter(log => log.level === levelFilter);
    }

    if (categoryFilter !== 'all') {
      filtered = filtered.filter(log => log.category === categoryFilter);
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(log => 
        log.message.toLowerCase().includes(term) ||
        log.category.toLowerCase().includes(term) ||
        (log.details && JSON.stringify(log.details).toLowerCase().includes(term))
      );
    }

    setFilteredLogs(filtered);
  };

  const loadLogs = async () => {
    if (!window.electronAPI) return;
    setIsLoading(true);
    setError(null);
    try {
      // For now, we'll create some mock logs since the backend logging isn't fully implemented
      const mockLogs: LogEntry[] = [
        {
          id: '1',
          timestamp: new Date().toISOString(),
          level: 'info',
          category: 'SYSTEM',
          message: 'Application started successfully',
          details: { version: '1.0.0' }
        },
        {
          id: '2',
          timestamp: new Date(Date.now() - 60000).toISOString(),
          level: 'info',
          category: 'ORG',
          message: 'Org list refreshed',
          details: { orgCount: 3 }
        },
        {
          id: '3',
          timestamp: new Date(Date.now() - 120000).toISOString(),
          level: 'warn',
          category: 'COMMAND',
          message: 'PowerShell command took longer than expected',
          details: { command: 'sf org list', duration: '5.2s' }
        },
        {
          id: '4',
          timestamp: new Date(Date.now() - 180000).toISOString(),
          level: 'error',
          category: 'DEPLOY',
          message: 'Deployment validation failed',
          details: { org: 'sandbox', errors: ['Missing required field'] }
        }
      ];
      setLogs(mockLogs);
    } catch (err: any) {
      console.error('Failed to load logs:', err);
      setError('Failed to load logs. Ensure the application has permission to access log files.');
      setLogs([]);
    } finally {
      setIsLoading(false);
    }
  };

  const clearLogs = () => {
    setLogs([]);
    toast.success("Logs cleared successfully");
  };

  const exportLogs = async () => {
    try {
      const logsData = JSON.stringify(logs, null, 2);
      const filename = `salesforce-toolkit-logs-${new Date().toISOString().split('T')[0]}.json`;
      
      const filePath = await window.electronAPI?.saveFile(logsData, filename);
      
      if (filePath) {
        toast.success(`Logs exported successfully to ${filePath}`);
      }
    } catch (error) {
      toast.error('Failed to export logs');
    }
  };

  const getUniqueCategories = () => {
    const categories = [...new Set(logs.map(log => log.category))];
    return categories.sort();
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'error': return 'text-red-600 bg-red-50';
      case 'warn': return 'text-yellow-600 bg-yellow-50';
      case 'info': return 'text-blue-600 bg-blue-50';
      case 'debug': return 'text-slate-600 bg-slate-50';
      default: return 'text-slate-600 bg-slate-50';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Application Logs & Audit Trail" size="xl">
      <div className="p-6">
        {/* Controls */}
        <div className="flex flex-wrap gap-4 mb-6">
          <div className="flex items-center gap-2">
            <Search className="w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search logs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <select
            value={levelFilter}
            onChange={(e) => setLevelFilter(e.target.value)}
            className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Levels</option>
            <option value="error">Error</option>
            <option value="warn">Warning</option>
            <option value="info">Info</option>
            <option value="debug">Debug</option>
          </select>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Categories</option>
            {getUniqueCategories().map(category => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>

          <div className="flex gap-2 ml-auto">
            <button
              onClick={loadLogs}
              className="flex items-center gap-2 px-3 py-1.5 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600 transition-colors duration-200"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
            <button
              onClick={exportLogs}
              className="flex items-center gap-2 px-3 py-1.5 bg-green-500 text-white text-sm rounded-lg hover:bg-green-600 transition-colors duration-200"
            >
              <Download className="w-4 h-4" />
              Export
            </button>
            <button
              onClick={clearLogs}
              className="flex items-center gap-2 px-3 py-1.5 bg-red-500 text-white text-sm rounded-lg hover:bg-red-600 transition-colors duration-200"
            >
              <Trash2 className="w-4 h-4" />
              Clear
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-slate-50 rounded-lg p-3 text-center">
            <div className="text-lg font-semibold text-slate-900">{logs.length}</div>
            <div className="text-sm text-slate-600">Total Logs</div>
          </div>
          <div className="bg-red-50 rounded-lg p-3 text-center">
            <div className="text-lg font-semibold text-red-600">
              {logs.filter(log => log.level === 'error').length}
            </div>
            <div className="text-sm text-red-600">Errors</div>
          </div>
          <div className="bg-yellow-50 rounded-lg p-3 text-center">
            <div className="text-lg font-semibold text-yellow-600">
              {logs.filter(log => log.level === 'warn').length}
            </div>
            <div className="text-sm text-yellow-600">Warnings</div>
          </div>
          <div className="bg-blue-50 rounded-lg p-3 text-center">
            <div className="text-lg font-semibold text-blue-600">
              {logs.filter(log => log.category === 'AUDIT').length}
            </div>
            <div className="text-sm text-blue-600">Audit Events</div>
          </div>
        </div>

        {/* Logs List */}
        <div className="bg-slate-50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-medium text-slate-900">
              Log Entries ({filteredLogs.length} of {logs.length})
            </h3>
            <Filter className="w-4 h-4 text-slate-500" />
          </div>

          <div className="max-h-96 overflow-y-auto space-y-2">
            {isLoading ? (
              <div className="flex justify-center items-center py-8">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                <span className="ml-3 text-slate-600">Loading logs...</span>
              </div>
            ) : error ? (
              <div className="text-center py-8 text-red-600">
                <FileText className="w-8 h-8 mx-auto mb-2 opacity-50 text-red-500" />
                <p>{error}</p>
              </div>
            ) : filteredLogs.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No logs found matching your criteria</p>
              </div>
            ) : (
              filteredLogs.map((log) => (
                <div key={log.id} className="bg-white rounded-lg p-3 border border-slate-200">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${getLevelColor(log.level)}`}>
                          {log.level.toUpperCase()}
                        </span>
                        <span className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                          {log.category}
                        </span>
                        <span className="text-xs text-slate-500">
                          {formatTimestamp(log.timestamp)}
                        </span>
                      </div>
                      <p className="text-sm text-slate-900 mb-1">{log.message}</p>
                      {log.details && (
                        <details className="text-xs text-slate-600">
                          <summary className="cursor-pointer hover:text-slate-800">Details</summary>
                          <pre className="mt-1 p-2 bg-slate-50 rounded text-xs overflow-x-auto">
                            {JSON.stringify(log.details, null, 2)}
                          </pre>
                        </details>
                      )}
                      {(log.userId || log.orgId) && (
                        <div className="flex gap-4 mt-1 text-xs text-slate-500">
                          {log.userId && <span>User: {log.userId}</span>}
                          {log.orgId && <span>Org: {log.orgId}</span>}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-slate-200 text-center text-xs text-slate-500">
          Salesforce Toolkit Logging System - Created by Amit Bhardwaj
        </div>
      </div>
    </Modal>
  );
};