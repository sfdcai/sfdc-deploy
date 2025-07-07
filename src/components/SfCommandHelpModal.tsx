import React from 'react';
import { Modal } from './Modal';
import { Terminal, Copy } from 'lucide-react';

interface SfCommandHelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SfCommandHelpModal: React.FC<SfCommandHelpModalProps> = ({ isOpen, onClose }) => {
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
    }
  ];

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Salesforce CLI Command Reference" size="lg">
      <div className="p-6">
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Terminal className="w-5 h-5 text-blue-500" />
            <h3 className="text-lg font-semibold text-slate-900">Common SF Commands</h3>
          </div>
          <p className="text-slate-600">
            Here are the most commonly used Salesforce CLI commands. Click the copy button to copy a command to your clipboard.
          </p>
        </div>

        <div className="space-y-3">
          {commonCommands.map((cmd, index) => (
            <div key={index} className="p-4 bg-slate-50 rounded-lg border border-slate-200">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <code className="text-sm font-mono text-slate-800 bg-white px-2 py-1 rounded border">
                    {cmd.command}
                  </code>
                  <p className="text-sm text-slate-600 mt-2">{cmd.description}</p>
                </div>
                <button
                  onClick={() => copyToClipboard(cmd.command)}
                  className="p-2 hover:bg-slate-200 rounded transition-colors duration-200"
                  title="Copy command"
                >
                  <Copy className="w-4 h-4 text-slate-500" />
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h4 className="font-medium text-blue-900 mb-2">Tips</h4>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• Replace <code>&lt;alias&gt;</code> with your actual org alias</li>
            <li>• Use <code>sf --help</code> to see all available commands</li>
            <li>• Add <code>--json</code> flag to get JSON output</li>
            <li>• Use <code>--target-org</code> or <code>-o</code> to specify the target org</li>
          </ul>
        </div>
      </div>
    </Modal>
  );
};