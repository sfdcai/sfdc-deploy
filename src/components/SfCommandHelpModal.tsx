import React, { useEffect, useState } from 'react';
import { Modal } from './Modal'; // Assuming a generic Modal component exists
import { Loader2, AlertTriangle } from 'lucide-react';

interface SfCommandHelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SfCommandHelpModal: React.FC<SfCommandHelpModalProps> = ({ isOpen, onClose }) => {
  const [helpText, setHelpText] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      const fetchHelp = async () => {
        setLoading(true);
        setError(null);
        setHelpText(null);
        try {
          if (window.electronAPI) {
            const result = await window.electronAPI.showSfCommandHelp();
            if (result?.success) {
              setHelpText(result.output);
            } else {
              setError(result?.error || 'Failed to fetch SF command help.');
            }
          } else {
            setError('Electron API not available.');
          }
        } catch (err: any) {
          setError(err.message || 'An unexpected error occurred.');
        } finally {
          setLoading(false);
        }
      };
      fetchHelp();
    }
  }, [isOpen]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="SF Command Help">
      <div className="p-4">
        {loading && (
          <div className="flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            <span className="ml-2 text-slate-600">Loading help text...</span>
          </div>
        )}

        {error && (
          <div className="text-red-600 flex items-center">
            <AlertTriangle className="w-5 h-5 mr-2" />
            <span>Error: {error}</span>
          </div>
        )}

        {helpText && (
          <pre className="bg-slate-100 p-4 rounded-md overflow-auto text-sm text-slate-800" style={{ maxHeight: '60vh' }}>
            {helpText}
          </pre>
        )}
      </div>
    </Modal>
  );
};