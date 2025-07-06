import React, { useState, useEffect } from 'react';
import { Modal } from './Modal';
import { CheckCircle, XCircle, Download, Loader2, ExternalLink, AlertTriangle, RefreshCw } from 'lucide-react';
import { useToast } from '../hooks/useToast';
import { logger } from '../utils/logger';

interface SystemCheckModalProps {
  onClose: () => void;
}

interface SoftwareStatus {
  Name: string;
  Command: string;
  Installed: boolean;
  Version: string | null;
  Required: boolean;
  DownloadUrl: string;
  checking?: boolean;
}

export const SystemCheckModal: React.FC<SystemCheckModalProps> = ({ onClose }) => {
  const [checking, setChecking] = useState(true);
  const [software, setSoftware] = useState<SoftwareStatus[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    checkAllSoftware();
  }, []);

  const checkAllSoftware = async () => {
    setChecking(true);
    logger.info('SYSTEM_CHECK', 'Starting system software check via PowerShell');
    
    if (!window.electronAPI) {
      logger.error('SYSTEM_CHECK', 'Electron API not available');
      toast({
        title: 'Error',
        description: 'System check not available in browser mode',
        variant: 'destructive'
      });
      setChecking(false);
      return;
    }

    try {
      const scriptsDir = await window.electronAPI.getScriptsDirectory();
      const scriptPath = `${scriptsDir}\\system-check.ps1`;
      
      const result = await window.electronAPI.executePowerShell(scriptPath, ['-OutputFormat', 'json']);
      
      if (result.success) {
        const softwareList = JSON.parse(result.output);
        setSoftware(softwareList);
        
        logger.info('SYSTEM_CHECK', 'System software check complete via PowerShell', { 
          totalChecked: softwareList.length,
          installed: softwareList.filter((s: SoftwareStatus) => s.Installed).length
        });
      } else {
        throw new Error(result.error || 'Failed to run system check script');
      }
    } catch (error: any) {
      logger.error('SYSTEM_CHECK', 'Failed to run system check', error);
      toast({
        title: 'Error',
        description: `Failed to run system check: ${error.message}`,
        variant: 'destructive'
      });
      
      // Fallback to individual checks
      await checkSoftwareIndividually();
    } finally {
      setChecking(false);
    }
  };

  const checkSoftwareIndividually = async () => {
    const softwareList = [
      { Name: 'Salesforce CLI', Command: 'sf', Required: true, DownloadUrl: 'https://developer.salesforce.com/tools/sfdxcli' },
      { Name: 'Node.js', Command: 'node', Required: true, DownloadUrl: 'https://nodejs.org/' },
      { Name: 'NPM', Command: 'npm', Required: true, DownloadUrl: 'https://nodejs.org/' },
      { Name: 'Git', Command: 'git', Required: false, DownloadUrl: 'https://git-scm.com/downloads' },
      { Name: 'VS Code', Command: 'code', Required: false, DownloadUrl: 'https://code.visualstudio.com/' }
    ];

    const results: SoftwareStatus[] = [];

    for (const sw of softwareList) {
      try {
        const result = await window.electronAPI.checkSoftwareInstalled(sw.Command);
        results.push({
          Name: sw.Name,
          Command: sw.Command,
          Installed: result.installed,
          Version: result.version,
          Required: sw.Required,
          DownloadUrl: sw.DownloadUrl
        });
      } catch (error) {
        results.push({
          Name: sw.Name,
          Command: sw.Command,
          Installed: false,
          Version: null,
          Required: sw.Required,
          DownloadUrl: sw.DownloadUrl
        });
      }
    }

    setSoftware(results);
  };

  const checkSingleSoftware = async (command: string) => {
    setSoftware(prev => prev.map(s => 
      s.Command === command ? { ...s, checking: true } : s
    ));

    try {
      const result = await window.electronAPI.checkSoftwareInstalled(command);
      
      setSoftware(prev => prev.map(s => 
        s.Command === command ? { 
          ...s, 
          Installed: result.installed, 
          Version: result.version,
          checking: false 
        } : s
      ));

      if (result.installed) {
        toast({
          title: 'Success',
          description: `${command.toUpperCase()} is now detected as installed`,
          variant: 'default'
        });
      }

    } catch (error: any) {
      setSoftware(prev => prev.map(s => 
        s.Command === command ? { 
          ...s, 
          Installed: false, 
          Version: null,
          checking: false 
        } : s
      ));

      toast({
        title: 'Error',
        description: `Failed to check ${command.toUpperCase()}`,
        variant: 'destructive'
      });
    }
  };

  const installSoftware = (url: string, name: string) => {
    if (window.electronAPI) {
      window.electronAPI.openExternal(url);
      logger.auditAction('OPEN_DOWNLOAD_LINK', undefined, undefined, { software: name, url });
    }
    
    toast({
      title: 'Download Started',
      description: 'Please follow the installation instructions on the website',
      variant: 'default'
    });
  };

  const requiredSoftware = software.filter(sw => sw.Required);
  const optionalSoftware = software.filter(sw => !sw.Required);
  const allRequiredInstalled = requiredSoftware.every(sw => sw.Installed);

  return (
    <Modal isOpen={true} onClose={onClose} title="System Check & Software Management" size="lg">
      <div className="p-6">
        {checking ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            <span className="ml-2 text-slate-600">Checking system requirements via PowerShell...</span>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Overall Status */}
            <div className={`p-4 rounded-lg border ${
              allRequiredInstalled 
                ? 'bg-green-50 border-green-200' 
                : 'bg-red-50 border-red-200'
            }`}>
              <div className="flex items-center gap-3">
                {allRequiredInstalled ? (
                  <CheckCircle className="w-5 h-5 text-green-500" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-red-500" />
                )}
                <div>
                  <h3 className={`font-medium ${
                    allRequiredInstalled ? 'text-green-900' : 'text-red-900'
                  }`}>
                    {allRequiredInstalled ? 'System Ready' : 'Missing Required Software'}
                  </h3>
                  <p className={`text-sm ${
                    allRequiredInstalled ? 'text-green-700' : 'text-red-700'
                  }`}>
                    {allRequiredInstalled 
                      ? 'All required software is installed and ready to use'
                      : 'Please install the missing required software to use all features'
                    }
                  </p>
                </div>
              </div>
            </div>

            {/* Required Software */}
            <div>
              <h4 className="font-medium text-slate-900 mb-3">Required Software</h4>
              <div className="space-y-3">
                {requiredSoftware.map((sw) => (
                  <div key={sw.Command} className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-lg">
                    <div className="flex items-center gap-3">
                      {sw.checking ? (
                        <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
                      ) : sw.Installed ? (
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-500" />
                      )}
                      <div>
                        <p className="font-medium text-slate-900">{sw.Name}</p>
                        <p className="text-sm text-slate-600">Command: {sw.Command}</p>
                        {sw.Installed && sw.Version && (
                          <p className="text-xs text-green-600">Version: {sw.Version}</p>
                        )}
                        {sw.checking && (
                          <p className="text-xs text-blue-600">Checking...</p>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {!sw.Installed && !sw.checking && (
                        <button
                          onClick={() => installSoftware(sw.DownloadUrl, sw.Name)}
                          className="flex items-center gap-2 px-3 py-1.5 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600 transition-colors duration-200"
                        >
                          <Download className="w-4 h-4" />
                          Install
                        </button>
                      )}
                      <button
                        onClick={() => checkSingleSoftware(sw.Command)}
                        disabled={sw.checking}
                        className="flex items-center gap-2 px-3 py-1.5 bg-slate-500 text-white text-sm rounded-lg hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                      >
                        <RefreshCw className={`w-4 h-4 ${sw.checking ? 'animate-spin' : ''}`} />
                        Check
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Optional Software */}
            <div>
              <h4 className="font-medium text-slate-900 mb-3">Optional Software</h4>
              <div className="space-y-3">
                {optionalSoftware.map((sw) => (
                  <div key={sw.Command} className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-lg">
                    <div className="flex items-center gap-3">
                      {sw.checking ? (
                        <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
                      ) : sw.Installed ? (
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      ) : (
                        <XCircle className="w-5 h-5 text-slate-400" />
                      )}
                      <div>
                        <p className="font-medium text-slate-900">{sw.Name}</p>
                        <p className="text-sm text-slate-600">Command: {sw.Command}</p>
                        {sw.Installed && sw.Version && (
                          <p className="text-xs text-green-600">Version: {sw.Version}</p>
                        )}
                        {sw.checking && (
                          <p className="text-xs text-blue-600">Checking...</p>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {!sw.Installed && !sw.checking && (
                        <button
                          onClick={() => installSoftware(sw.DownloadUrl, sw.Name)}
                          className="flex items-center gap-2 px-3 py-1.5 bg-slate-500 text-white text-sm rounded-lg hover:bg-slate-600 transition-colors duration-200"
                        >
                          <Download className="w-4 h-4" />
                          Install
                        </button>
                      )}
                      <button
                        onClick={() => checkSingleSoftware(sw.Command)}
                        disabled={sw.checking}
                        className="flex items-center gap-2 px-3 py-1.5 bg-slate-500 text-white text-sm rounded-lg hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                      >
                        <RefreshCw className={`w-4 h-4 ${sw.checking ? 'animate-spin' : ''}`} />
                        Check
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Refresh All Button */}
            <div className="flex justify-center pt-4">
              <button
                onClick={checkAllSoftware}
                disabled={checking}
                className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
              >
                <RefreshCw className={`w-4 h-4 ${checking ? 'animate-spin' : ''}`} />
                Refresh All Checks
              </button>
            </div>

            {/* PowerShell Integration Note */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 mb-2">PowerShell Integration</h4>
              <p className="text-sm text-blue-700 mb-2">
                This system check now uses PowerShell scripts for enhanced reliability and performance. 
                All operations are executed through optimized PowerShell commands.
              </p>
              <p className="text-xs text-blue-600">
                Created by Amit Bhardwaj - Salesforce Technical Architect
              </p>
            </div>

            {/* Installation Notes */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h4 className="font-medium text-yellow-900 mb-2">Installation Notes</h4>
              <ul className="text-sm text-yellow-700 space-y-1">
                <li>• After installing software, use the "Check" button to verify detection</li>
                <li>• Ensure installed software is added to your system PATH environment variable</li>
                <li>• For Salesforce CLI, authenticate with your orgs using: <code className="bg-yellow-100 px-1 rounded">sf org login web</code></li>
                <li>• VS Code installation enables enhanced diff functionality for org comparisons</li>
                <li>• If software shows as not installed but you know it is, try restarting your terminal or this application</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};