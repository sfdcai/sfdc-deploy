import React, { useState, useEffect } from 'react';
import { Modal } from './Modal';
import { CheckCircle, XCircle, Download, Loader2, ExternalLink, AlertTriangle, RefreshCw } from 'lucide-react';
import { useToast } from '../hooks/useToast';
import { logger } from '../utils/logger';

interface SystemCheckModalProps {
  onClose: () => void;
}

interface SoftwareStatus {
  name: string;
  installed: boolean;
  version: string | null;
  downloadUrl: string;
  description: string;
  required: boolean;
  checking?: boolean;
}

export const SystemCheckModal: React.FC<SystemCheckModalProps> = ({ onClose }) => {
  const [checking, setChecking] = useState(true);
  const [software, setSoftware] = useState<SoftwareStatus[]>([]);
  const { toast } = useToast();

  const softwareList = [
    {
      name: 'sf',
      downloadUrl: 'https://developer.salesforce.com/tools/sfdxcli',
      description: 'Salesforce CLI - Required for all org operations',
      required: true
    },
    {
      name: 'node',
      downloadUrl: 'https://nodejs.org/',
      description: 'Node.js - JavaScript runtime environment',
      required: true
    },
    {
      name: 'npm',
      downloadUrl: 'https://nodejs.org/',
      description: 'npm - Node package manager (comes with Node.js)',
      required: true
    },
    {
      name: 'git',
      downloadUrl: 'https://git-scm.com/downloads',
      description: 'Git - Version control system (recommended)',
      required: false
    },
    {
      name: 'code',
      downloadUrl: 'https://code.visualstudio.com/',
      description: 'VS Code - For enhanced diff functionality (optional)',
      required: false
    }
  ];

  useEffect(() => {
    checkAllSoftware();
  }, []);

  const checkAllSoftware = async () => {
    setChecking(true);
    logger.info('SYSTEM_CHECK', 'Starting system software check');
    
    // Initialize software list with checking state
    const initialResults: SoftwareStatus[] = softwareList.map(sw => ({
      ...sw,
      installed: false,
      version: null,
      checking: true
    }));
    setSoftware(initialResults);

    // Check if electronAPI is available
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

    const results: SoftwareStatus[] = [];

    for (const sw of softwareList) {
      try {
        logger.debug('SYSTEM_CHECK', `Checking ${sw.name}`);
        
        // Update individual software checking state
        setSoftware(prev => prev.map(s => 
          s.name === sw.name ? { ...s, checking: true } : s
        ));

        const result = await window.electronAPI.checkSoftwareInstalled(sw.name);
        
        const softwareResult = {
          ...sw,
          installed: result.installed,
          version: result.version,
          checking: false
        };

        results.push(softwareResult);
        
        // Update individual software result immediately
        setSoftware(prev => prev.map(s => 
          s.name === sw.name ? softwareResult : s
        ));

        logger.info('SYSTEM_CHECK', `${sw.name} check complete`, { 
          installed: result.installed, 
          version: result.version 
        });

      } catch (error: any) {
        logger.error('SYSTEM_CHECK', `Failed to check ${sw.name}`, error);
        
        const errorResult = {
          ...sw,
          installed: false,
          version: null,
          checking: false
        };

        results.push(errorResult);
        
        // Update individual software result immediately
        setSoftware(prev => prev.map(s => 
          s.name === sw.name ? errorResult : s
        ));
      }
    }

    setChecking(false);
    logger.info('SYSTEM_CHECK', 'System software check complete', { 
      totalChecked: results.length,
      installed: results.filter(r => r.installed).length
    });
  };

  const checkSingleSoftware = async (softwareName: string) => {
    if (!window.electronAPI) {
      toast({
        title: 'Error',
        description: 'System check not available in browser mode',
        variant: 'destructive'
      });
      return;
    }

    // Set checking state for this software
    setSoftware(prev => prev.map(s => 
      s.name === softwareName ? { ...s, checking: true } : s
    ));

    try {
      logger.debug('SYSTEM_CHECK', `Re-checking ${softwareName}`);
      const result = await window.electronAPI.checkSoftwareInstalled(softwareName);
      
      setSoftware(prev => prev.map(s => 
        s.name === softwareName ? { 
          ...s, 
          installed: result.installed, 
          version: result.version,
          checking: false 
        } : s
      ));

      logger.info('SYSTEM_CHECK', `${softwareName} re-check complete`, { 
        installed: result.installed, 
        version: result.version 
      });

      if (result.installed) {
        toast({
          title: 'Success',
          description: `${softwareName.toUpperCase()} is now detected as installed`,
          variant: 'default'
        });
      }

    } catch (error: any) {
      logger.error('SYSTEM_CHECK', `Failed to re-check ${softwareName}`, error);
      
      setSoftware(prev => prev.map(s => 
        s.name === softwareName ? { 
          ...s, 
          installed: false, 
          version: null,
          checking: false 
        } : s
      ));

      toast({
        title: 'Error',
        description: `Failed to check ${softwareName.toUpperCase()}`,
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

  const requiredSoftware = software.filter(sw => sw.required);
  const optionalSoftware = software.filter(sw => !sw.required);
  const allRequiredInstalled = requiredSoftware.every(sw => sw.installed);

  return (
    <Modal isOpen={true} onClose={onClose} title="System Check & Software Management" size="lg">
      <div className="p-6">
        {checking ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            <span className="ml-2 text-slate-600">Checking system requirements...</span>
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
                  <div key={sw.name} className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-lg">
                    <div className="flex items-center gap-3">
                      {sw.checking ? (
                        <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
                      ) : sw.installed ? (
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-500" />
                      )}
                      <div>
                        <p className="font-medium text-slate-900">{sw.name.toUpperCase()}</p>
                        <p className="text-sm text-slate-600">{sw.description}</p>
                        {sw.installed && sw.version && (
                          <p className="text-xs text-green-600">Version: {sw.version}</p>
                        )}
                        {sw.checking && (
                          <p className="text-xs text-blue-600">Checking...</p>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {!sw.installed && !sw.checking && (
                        <button
                          onClick={() => installSoftware(sw.downloadUrl, sw.name)}
                          className="flex items-center gap-2 px-3 py-1.5 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600 transition-colors duration-200"
                        >
                          <Download className="w-4 h-4" />
                          Install
                        </button>
                      )}
                      <button
                        onClick={() => checkSingleSoftware(sw.name)}
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
                  <div key={sw.name} className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-lg">
                    <div className="flex items-center gap-3">
                      {sw.checking ? (
                        <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
                      ) : sw.installed ? (
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      ) : (
                        <XCircle className="w-5 h-5 text-slate-400" />
                      )}
                      <div>
                        <p className="font-medium text-slate-900">{sw.name.toUpperCase()}</p>
                        <p className="text-sm text-slate-600">{sw.description}</p>
                        {sw.installed && sw.version && (
                          <p className="text-xs text-green-600">Version: {sw.version}</p>
                        )}
                        {sw.checking && (
                          <p className="text-xs text-blue-600">Checking...</p>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {!sw.installed && !sw.checking && (
                        <button
                          onClick={() => installSoftware(sw.downloadUrl, sw.name)}
                          className="flex items-center gap-2 px-3 py-1.5 bg-slate-500 text-white text-sm rounded-lg hover:bg-slate-600 transition-colors duration-200"
                        >
                          <Download className="w-4 h-4" />
                          Install
                        </button>
                      )}
                      <button
                        onClick={() => checkSingleSoftware(sw.name)}
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

            {/* Troubleshooting */}
            {!allRequiredInstalled && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 mb-2">Troubleshooting</h4>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• If npm shows as not installed but Node.js is installed, restart this application</li>
                  <li>• For SF CLI issues, try running <code className="bg-blue-100 px-1 rounded">sf --version</code> in your terminal</li>
                  <li>• Make sure you're running this application as an administrator if needed</li>
                  <li>• Check that your PATH environment variable includes the software installation directories</li>
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
};