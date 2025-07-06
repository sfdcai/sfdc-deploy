import React, { useState, useRef, useEffect } from 'react';
import { Modal } from './Modal';
import { Terminal, Play, Copy, BookOpen, Loader2 } from 'lucide-react';
import { useToast } from '../hooks/useToast';
import { logger } from '../utils/logger';

interface ShellModalProps {
  onClose: () => void;
}

interface CommandHistory {
  command: string;
  output: string;
  timestamp: Date;
  success: boolean;
}

export const ShellModal: React.FC<ShellModalProps> = ({ onClose }) => {
  const [command, setCommand] = useState('');
  const [history, setHistory] = useState<CommandHistory[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCommands, setShowCommands] = useState(false);
  const terminalRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const commonCommands = [
    {
      command: 'sf org list',
      description: 'List all authenticated orgs'
    },
    {
      command: 'sf org display --target-org <alias>',
      description: 'Display org information'
    },
    {
      command: 'sf project generate manifest --source-dir force-app',
      description: 'Generate package.xml from source'
    },
    {
      command: 'sf project retrieve start --manifest package.xml',
      description: 'Retrieve metadata using manifest'
    },
    {
      command: 'sf project deploy start --manifest package.xml --target-org <alias>',
      description: 'Deploy metadata using manifest'
    },
    {
      command: 'sf project deploy validate --manifest package.xml --target-org <alias>',
      description: 'Validate deployment without deploying'
    },
    {
      command: 'sf data query --query "SELECT Id, Name FROM Account LIMIT 10" --target-org <alias>',
      description: 'Execute SOQL query'
    },
    {
      command: 'sf apex run --file script.apex --target-org <alias>',
      description: 'Execute Apex code'
    },
    {
      command: 'sf org create scratch --definition-file config/project-scratch-def.json',
      description: 'Create scratch org'
    },
    {
      command: 'sf org delete scratch --target-org <alias>',
      description: 'Delete scratch org'
    },
    {
      command: 'sf package create --name "My Package" --package-type Unlocked',
      description: 'Create unlocked package'
    },
    {
      command: 'sf package version create --package "My Package" --wait 10',
      description: 'Create package version'
    }
  ];

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [history]);

  const executeCommand = async () => {
    if (!command.trim()) return;

    setLoading(true);
    const timestamp = new Date();
    
    logger.auditAction('EXECUTE_POWERSHELL_COMMAND', undefined, undefined, { command });
    
    try {
      if (!window.electronAPI) {
        throw new Error('PowerShell integration not available');
      }

      const result = await window.electronAPI.executePowerShellCommand(command);
      
      setHistory(prev => [...prev, {
        command,
        output: result.output || result.error || 'Command completed',
        timestamp,
        success: result.success
      }]);

      logger.info('SHELL', 'PowerShell command executed', { 
        command, 
        success: result.success,
        outputLength: result.output?.length || 0 
      });

      if (!result.success && result.error) {
        toast({
          title: 'Command Failed',
          description: 'Check the terminal output for details',
          variant: 'destructive'
        });
      }
    } catch (error: any) {
      const errorOutput = error.message || 'Command failed';
      
      setHistory(prev => [...prev, {
        command,
        output: errorOutput,
        timestamp,
        success: false
      }]);

      logger.error('SHELL', 'PowerShell command failed', { command, error: error.message });
      
      toast({
        title: 'Error',
        description: 'Failed to execute command',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
      setCommand('');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: 'Copied',
      description: 'Command copied to clipboard',
      variant: 'default'
    });
  };

  const insertCommand = (cmd: string) => {
    setCommand(cmd);
    setShowCommands(false);
  };

  const clearHistory = () => {
    setHistory([]);
    logger.auditAction('CLEAR_SHELL_HISTORY');
  };

  return (
    <Modal isOpen={true} onClose={onClose} title="PowerShell Command Shell" size="xl">
      <div className="flex h-[600px]">
        {/* Command Reference Sidebar */}
        <div className={`${showCommands ? 'w-1/3' : 'w-0'} transition-all duration-300 overflow-hidden border-r border-slate-200`}>
          <div className="p-4 h-full overflow-y-auto">
            <h3 className="font-medium text-slate-900 mb-3">Common SF Commands</h3>
            <div className="space-y-2">
              {commonCommands.map((cmd, index) => (
                <div key={index} className="p-2 bg-slate-50 rounded-lg hover:bg-slate-100 cursor-pointer transition-colors duration-200">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <code className="text-xs text-slate-700 block truncate">{cmd.command}</code>
                      <p className="text-xs text-slate-500 mt-1">{cmd.description}</p>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => copyToClipboard(cmd.command)}
                        className="p-1 hover:bg-slate-200 rounded"
                      >
                        <Copy className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => insertCommand(cmd.command)}
                        className="p-1 hover:bg-slate-200 rounded"
                      >
                        <Play className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Terminal Area */}
        <div className="flex-1 flex flex-col">
          {/* Terminal Header */}
          <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-slate-50">
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4" />
              <span className="text-sm font-medium">PowerShell Terminal</span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowCommands(!showCommands)}
                className="flex items-center gap-2 px-3 py-1.5 text-sm bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors duration-200"
              >
                <BookOpen className="w-4 h-4" />
                {showCommands ? 'Hide' : 'Show'} Commands
              </button>
              <button
                onClick={clearHistory}
                className="px-3 py-1.5 text-sm bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors duration-200"
              >
                Clear
              </button>
            </div>
          </div>

          {/* Terminal Output */}
          <div 
            ref={terminalRef}
            className="flex-1 p-4 bg-slate-900 text-green-400 font-mono text-sm overflow-y-auto"
          >
            {history.length === 0 ? (
              <div className="text-slate-500">
                <p>PowerShell Command Shell - Ready for commands</p>
                <p>Execute any PowerShell command including Salesforce CLI operations</p>
                <p>Type 'sf --help' to get started or use the command reference panel</p>
                <p className="text-xs mt-2 text-slate-600">Enhanced with PowerShell integration by Amit Bhardwaj</p>
              </div>
            ) : (
              history.map((entry, index) => (
                <div key={index} className="mb-4">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-blue-400">PS&gt;</span>
                    <span className="text-white">{entry.command}</span>
                    <span className="text-slate-500 text-xs">
                      {entry.timestamp.toLocaleTimeString()}
                    </span>
                  </div>
                  <pre className={`whitespace-pre-wrap ${entry.success ? 'text-green-400' : 'text-red-400'}`}>
                    {entry.output}
                  </pre>
                </div>
              ))
            )}
            {loading && (
              <div className="flex items-center gap-2 text-yellow-400">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Executing PowerShell command...</span>
              </div>
            )}
          </div>

          {/* Command Input */}
          <div className="p-4 border-t border-slate-200 bg-white">
            <div className="flex gap-2">
              <div className="flex-1 flex items-center gap-2 px-3 py-2 border border-slate-300 rounded-lg focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent">
                <span className="text-slate-500">PS&gt;</span>
                <input
                  type="text"
                  value={command}
                  onChange={(e) => setCommand(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && executeCommand()}
                  placeholder="Enter PowerShell command (e.g., sf org list)"
                  className="flex-1 outline-none"
                  disabled={loading}
                />
              </div>
              <button
                onClick={executeCommand}
                disabled={loading || !command.trim()}
                className="px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-lg transition-colors duration-200 flex items-center gap-2"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Play className="w-4 h-4" />
                )}
                Execute
              </button>
            </div>
            <div className="mt-2 text-xs text-slate-500 text-center">
              PowerShell Integration - Salesforce Toolkit by Amit Bhardwaj
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
};