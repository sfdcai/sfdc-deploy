import React, { useState, useEffect } from 'react';
import { Modal } from './Modal';
import { FileText, Download, Trash2, Filter, Search, RefreshCw } from 'lucide-react';
import { logger, LogEntry } from '../utils/logger';
import { useToast } from '../hooks/useToast';

interface LogsModalProps {
  onClose: () => void;
}

export const LogsModal: React.FC<LogsModalProps> = ({ onClose }) => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<LogEntry[]>([]);
  const [levelFilter, setLevelFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const { toast } = useToast();

  useEffect(() => {
    loadLogs();
  }, []);

  useEffect(() => {
    filterLogs();
  }, [logs, levelFilter, categoryFilter, searchTerm]);

  const loadLogs = () => {
    const allLogs = logger.getLogs();
    setLogs(allLogs);
  };

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

  const clearLogs = () => {
    logger.clearLogs();
    loadLogs();
    toast({
      title: 'Success',
      description: 'All logs have been cleared',
      variant: 'default'
    });
  };

  const exportLogs = async () => {
    try {
      const logsData = logger.exportLogs();
      const filename = `salesforce-toolkit-logs-${new Date().toISOString().split('T')[0]}.json`;
      
      const filePath = await window.electronAPI.saveFile(logsData, filename);
      
      if (filePath) {
        toast({
          title: 'Success',
          description: `Logs exported successfully to ${filePath}`,
          variant: 'default'
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to export logs',
        variant: 'destructive'
      });
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

  const formatTimestamp = (timestamp: Date) => {
    return new Date(timestamp).toLocaleString();
  };

  return (
    <Modal isOpen={true} onClose={onClose} title="Application Logs & Audit Trail" size="xl">
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
            {filteredLogs.length === 0 ? (
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