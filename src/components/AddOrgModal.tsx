import React, { useState } from 'react';
import { Modal } from './Modal';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';

interface AddOrgModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOrgAdded: () => void; // Callback to refresh org list after adding
}

export const AddOrgModal: React.FC<AddOrgModalProps> = ({ isOpen, onClose, onOrgAdded }) => {
  const [alias, setAlias] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleAddOrg = async () => {
    if (!alias.trim()) {
      setResult({ success: false, message: 'Alias cannot be empty.' });
      return;
    }

    setLoading(true);
    setResult(null);
    try {
      // Execute the sf org login command
      const command = `sf org login web --alias "${alias}"`;
      const response = await window.electronAPI.executePowerShellCommand(command);
      
      if (response.success) {
        setResult({ success: true, message: `Successfully authorized org with alias: ${alias}` });
        setAlias(''); // Clear input on success
        onOrgAdded(); // Refresh org list
      } else {
        setResult({ success: false, message: `Failed to authorize org: ${response.error || response.output}` });
      }
    } catch (error: any) {
      setResult({ success: false, message: `An error occurred: ${error.message}` });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setAlias('');
      setResult(null);
      onClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Add New Authorized Org"
    >
      <div className="p-4">
        <p className="text-slate-600 mb-4">
          Authorize a new Salesforce org using the web login flow.
        </p>
        <div className="mb-4">
          <label htmlFor="orgAlias" className="block text-sm font-medium text-slate-700 mb-2">
            Org Alias
          </label>
          <input
            type="text"
            id="orgAlias"
            value={alias}
            onChange={(e) => setAlias(e.target.value)}
            placeholder="e.g., dev-sandbox, production"
            className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            disabled={loading}
          />
        </div>

        {result && (
          <div className={`p-3 mb-4 rounded-md ${result.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'} flex items-center gap-2`}>
            {result.success ? <CheckCircle className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
            <span className="text-sm">{result.message}</span>
          </div>
        )}

        <div className="flex justify-end gap-3">
          <button
            onClick={handleClose}
            disabled={loading}
            className="px-4 py-2 bg-slate-200 text-slate-700 rounded-md hover:bg-slate-300 disabled:opacity-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleAddOrg}
            disabled={loading || !alias.trim()}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center gap-2"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            Add Org
          </button>
        </div>
      </div>
    </Modal>
  );
};