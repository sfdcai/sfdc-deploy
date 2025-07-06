import React, { useState, useEffect } from 'react';
import { Modal } from './Modal'; // Assuming a generic Modal component exists
import { Loader2, FolderOpen } from 'lucide-react';

interface RetrieveModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RetrieveModal: React.FC<RetrieveModalProps> = ({ isOpen, onClose }) => {
  const [manifestPath, setManifestPath] = useState('');
  const [targetOrg, setTargetOrg] = useState('');
  const [authorizedOrgs, setAuthorizedOrgs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchAuthorizedOrgs();
      // Reset state when modal opens
      setManifestPath('');
      setTargetOrg('');
      setResult(null);
      setError(null);
    }
  }, [isOpen]);

  const fetchAuthorizedOrgs = async () => {
    if (!window.electronAPI) return;
    try {
      const orgsList = await window.electronAPI.getOrgsList();
      setAuthorizedOrgs(orgsList || []);
      if (orgsList && orgsList.length > 0) {
        setTargetOrg(orgsList[0].alias || orgsList[0].username);
      }
    } catch (err: any) {
      console.error('Failed to fetch authorized orgs:', err);
      // Handle error fetching orgs, maybe display a message
    }
  };

  const handleSelectManifest = async () => {
    if (!window.electronAPI) return;
    try {
      const file = await window.electronAPI.openFile();
      if (file && file.path) {
        setManifestPath(file.path);
      }
    } catch (err: any) {
      console.error('Failed to open file dialog:', err);
      setError('Failed to select manifest file.');
    }
  };

  const handleRetrieve = async () => {
    if (!targetOrg || !manifestPath) {
      setError('Please select a target org and manifest file.');
      return;
    }

    setIsLoading(true);
    setResult(null);
    setError(null);

    try {
      if (window.electronAPI) {
        const retrievalResult = await window.electronAPI.retrieveMetadata({
          manifestPath,
          targetOrg,
        });

        if (retrievalResult.success) {
          setResult(retrievalResult.output || 'Retrieval successful.');
        } else {
          setError(retrievalResult.error || 'Retrieval failed.');
        }
      }
    } catch (err: any) {
      console.error('Retrieval error:', err);
      setError(err.message || 'An unexpected error occurred during retrieval.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Retrieve Metadata">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Manifest Path</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={manifestPath}
              readOnly
              placeholder="Select a package.xml file"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
            <button
              onClick={handleSelectManifest}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <FolderOpen className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Target Org</label>
          <select
            value={targetOrg}
            onChange={(e) => setTargetOrg(e.target.value)}
            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
          >
            {authorizedOrgs.map(org => (
              <option key={org.alias || org.username} value={org.alias || org.username}>
                {org.alias} ({org.username})
              </option>
            ))}
             {authorizedOrgs.length === 0 && <option value="">No orgs available</option>}
          </select>
        </div>

        {isLoading && (
          <div className="flex items-center justify-center text-blue-500">
            <Loader2 className="w-5 h-5 animate-spin mr-2" />
            Retrieving metadata...
          </div>
        )}

        {result && (
          <div className="mt-4 p-3 bg-green-100 text-green-800 rounded-md overflow-auto max-h-40">
            <h4 className="font-semibold mb-2">Retrieval Output:</h4>
            <pre className="text-xs whitespace-pre-wrap break-words">{result}</pre>
          </div>
        )}

        {error && (
          <div className="mt-4 p-3 bg-red-100 text-red-800 rounded-md overflow-auto max-h-40">
            <h4 className="font-semibold mb-2">Error:</h4>
            <pre className="text-xs whitespace-pre-wrap break-words">{error}</pre>
          </div>
        )}

        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Cancel
          </button>
          <button
            onClick={handleRetrieve}
            disabled={isLoading || !targetOrg || !manifestPath}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Retrieve
          </button>
        </div>
      </div>
    </Modal>
  );
};