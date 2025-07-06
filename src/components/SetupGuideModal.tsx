import React from 'react';
import { Modal } from './Modal'; // Assuming a generic Modal component exists
import { BookOpen } from 'lucide-react';

interface SetupGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SetupGuideModal: React.FC<SetupGuideModalProps> = ({ isOpen, onClose }) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Setup Guide">
      <div className="p-6 space-y-6 text-slate-700">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <BookOpen className="w-6 h-6 text-blue-500" />
            <div>
              <h3 className="text-lg font-semibold text-blue-900 mb-1">Welcome to Salesforce Toolkit!</h3>
              <p className="text-sm text-blue-700">
                Follow these steps to set up and start using the toolkit.
              </p>
            </div>
          </div>
        </div>

        <div>
          <h4 className="text-md font-semibold text-slate-900 mb-3">Prerequisites</h4>
          <ul className="list-disc list-inside space-y-2 text-sm">
            <li>
              <strong>Salesforce CLI:</strong> Install the latest version from the official Salesforce documentation.
            </li>
            <li>
              <strong>Node.js and npm:</strong> Ensure you have a recent version installed.
            </li>
            <li>
              <strong>Git:</strong> Required for cloning the repository.
            </li>
            <li>
              <strong>PowerShell (Windows):</strong> The toolkit utilizes PowerShell scripts for core functionalities.
            </li>
          </ul>
        </div>

        <div>
          <h4 className="text-md font-semibold text-slate-900 mb-3">Installation Steps</h4>
          <ol className="list-decimal list-inside space-y-2 text-sm">
            <li>
              <strong>Clone the repository:</strong>
              <pre className="bg-slate-100 p-2 rounded-md text-xs mt-1 overflow-x-auto">
                <code>git clone [repository_url]</code>
              </pre>
            </li>
            <li>
              <strong>Navigate to the project directory:</strong>
              <pre className="bg-slate-100 p-2 rounded-md text-xs mt-1 overflow-x-auto">
                <code>cd salesforce-toolkit</code>
              </pre>
            </li>
            <li>
              <strong>Install dependencies:</strong>
              <pre className="bg-slate-100 p-2 rounded-md text-xs mt-1">
                <code>npm install</code>
              </pre>
            </li>
            <li>
              <strong>Build the Electron application:</strong>
              <pre className="bg-slate-100 p-2 rounded-md text-xs mt-1">
                <code>npm run electron:build</code>
              </pre>
            </li>
            <li>
              <strong>Start the application:</strong>
              <pre className="bg-slate-100 p-2 rounded-md text-xs mt-1">
                <code>npm run electron:start</code>
              </pre>
              <p className="text-xs text-slate-500 mt-1">
                (Or run the executable from the `dist` folder after building)
              </p>
            </li>
          </ol>
        </div>

        <div>
          <h4 className="text-md font-semibold text-slate-900 mb-3">Initial Configuration</h4>
          <ul className="list-disc list-inside space-y-2 text-sm">
            <li>
              <strong>Select or Create a Project:</strong> When the application starts, you will be prompted to select an existing project or create a new one.
            </li>
            <li>
              <strong>Authorize Salesforce Orgs:</strong> Use the "Add New Org" feature to authenticate with your Salesforce organizations using the web login flow.
            </li>
            <li>
              <strong>Run System Check:</strong> It's recommended to run the System Check to ensure all required dependencies are correctly installed and configured.
            </li>
          </ul>
        </div>

        <div className="text-sm text-center text-slate-500">
          For detailed documentation, please refer to the project's README.
        </div>

      </div>
    </Modal>
  );
};