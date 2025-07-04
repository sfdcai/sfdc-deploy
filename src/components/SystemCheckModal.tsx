import React, { useState, useEffect } from 'react';
import { Modal } from './Modal';
import { CheckCircle, XCircle, Download, Loader2, ExternalLink, AlertTriangle } from 'lucide-react';
import { useToast } from '../hooks/useToast';

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
    const results: SoftwareStatus[] = [];

    for (const sw of softwareList) {
      try {
        const result = await window.electronAPI.checkSoftwareInstalled(sw.name);
        results.push({
          ...sw,
          installed: result.installed,
          version: result.version
        });
      } catch (error) {
        results.push({
          ...sw,
          installed: false,
          version: null
        });
      }
    }

    setSoftware(results);
    setChecking(false);
  };

  const installSoftware = (url: string) => {
    window.electronAPI.openExternal(url);
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
                      {sw.installed ? (
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
                      </div>
                    </div>
                    {!sw.installed && (
                      <button
                        onClick={() => installSoftware(sw.downloadUrl)}
                        className="flex items-center gap-2 px-3 py-1.5 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600 transition-colors duration-200"
                      >
                        <Download className="w-4 h-4" />
                        Install
                      </button>
                    )}
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
                      {sw.installed ? (
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
                      </div>
                    </div>
                    {!sw.installed && (
                      <button
                        onClick={() => installSoftware(sw.downloadUrl)}
                        className="flex items-center gap-2 px-3 py-1.5 bg-slate-500 text-white text-sm rounded-lg hover:bg-slate-600 transition-colors duration-200"
                      >
                        <Download className="w-4 h-4" />
                        Install
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Refresh Button */}
            <div className="flex justify-center pt-4">
              <button
                onClick={checkAllSoftware}
                className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors duration-200"
              >
                <Loader2 className="w-4 h-4" />
                Refresh Check
              </button>
            </div>

            {/* Installation Notes */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h4 className="font-medium text-yellow-900 mb-2">Installation Notes</h4>
              <ul className="text-sm text-yellow-700 space-y-1">
                <li>• After installing software, restart this application to detect changes</li>
                <li>• Ensure installed software is added to your system PATH</li>
                <li>• For Salesforce CLI, authenticate with your orgs using: <code>sf org login web</code></li>
                <li>• VS Code installation enables enhanced diff functionality for org comparisons</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};