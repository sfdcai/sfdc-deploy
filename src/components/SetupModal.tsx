import React from 'react';
import { Modal } from './Modal';
import { Terminal, CheckCircle, ExternalLink, Download, Code } from 'lucide-react';

interface SetupModalProps {
  onClose: () => void;
}

export const SetupModal: React.FC<SetupModalProps> = ({ onClose }) => {
  const openExternal = (url: string) => {
    window.electronAPI.openExternal(url);
  };

  return (
    <Modal isOpen={true} onClose={onClose} title="Setup Guide" size="lg">
      <div className="p-6">
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Prerequisites</h3>
          <p className="text-slate-600 mb-4">
            Before using the Salesforce Toolkit, ensure you have the following prerequisites installed and configured:
          </p>
        </div>

        <div className="space-y-6">
          {/* Salesforce CLI */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Terminal className="w-5 h-5 text-blue-500 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-medium text-blue-900 mb-2">1. Salesforce CLI (sf)</h4>
                <p className="text-sm text-blue-700 mb-3">
                  The Salesforce CLI is required for all operations. Install the latest version and authenticate with your orgs.
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => openExternal('https://developer.salesforce.com/tools/sfdxcli')}
                    className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600 transition-colors duration-200"
                  >
                    <Download className="w-4 h-4" />
                    Download CLI
                  </button>
                  <button
                    onClick={() => openExternal('https://developer.salesforce.com/docs/atlas.en-us.sfdx_setup.meta/sfdx_setup/sfdx_setup_auth.htm')}
                    className="inline-flex items-center gap-2 px-3 py-1.5 bg-white border border-blue-300 text-blue-700 text-sm rounded-lg hover:bg-blue-50 transition-colors duration-200"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Auth Guide
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Authentication */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-medium text-green-900 mb-2">2. Org Authentication</h4>
                <p className="text-sm text-green-700 mb-3">
                  Authenticate with your Salesforce orgs using the following commands:
                </p>
                <div className="bg-white border border-green-200 rounded p-2 mb-3">
                  <code className="text-sm text-slate-700">
                    sf org login web --alias my-org
                  </code>
                </div>
                <p className="text-sm text-green-700">
                  Repeat for each org you want to use with the toolkit.
                </p>
              </div>
            </div>
          </div>

          {/* VS Code (Optional) */}
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Code className="w-5 h-5 text-purple-500 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-medium text-purple-900 mb-2">3. VS Code (Optional)</h4>
                <p className="text-sm text-purple-700 mb-3">
                  For enhanced org comparison features, install VS Code and ensure the <code>code</code> command is available in your system PATH.
                </p>
                <button
                  onClick={() => openExternal('https://code.visualstudio.com/download')}
                  className="inline-flex items-center gap-2 px-3 py-1.5 bg-purple-500 text-white text-sm rounded-lg hover:bg-purple-600 transition-colors duration-200"
                >
                  <Download className="w-4 h-4" />
                  Download VS Code
                </button>
              </div>
            </div>
          </div>

          {/* Verification */}
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
            <h4 className="font-medium text-slate-900 mb-3">Verification</h4>
            <p className="text-sm text-slate-600 mb-3">
              Run these commands to verify your setup:
            </p>
            <div className="space-y-2">
              <div className="bg-white border border-slate-200 rounded p-2">
                <code className="text-sm text-slate-700">sf --version</code>
              </div>
              <div className="bg-white border border-slate-200 rounded p-2">
                <code className="text-sm text-slate-700">sf org list</code>
              </div>
              <div className="bg-white border border-slate-200 rounded p-2">
                <code className="text-sm text-slate-700">code --version</code>
                <span className="text-xs text-slate-500 ml-2">(optional)</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-slate-200">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h4 className="font-medium text-yellow-900 mb-2">Important Notes</h4>
            <ul className="text-sm text-yellow-700 space-y-1">
              <li>• Always test deployments in a sandbox environment first</li>
              <li>• Keep your Salesforce CLI updated to the latest version</li>
              <li>• Ensure proper permissions for metadata operations</li>
              <li>• Back up your data before major deployments</li>
            </ul>
          </div>
        </div>
      </div>
    </Modal>
  );
};