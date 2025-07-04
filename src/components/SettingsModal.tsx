import React, { useState } from 'react';
import { Modal } from './Modal';
import { Folder, Save, RotateCcw } from 'lucide-react';
import { useToast } from '../hooks/useToast';

interface SettingsModalProps {
  onClose: () => void;
  projectDirectory: string;
  setProjectDirectory: (dir: string) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ 
  onClose, 
  projectDirectory, 
  setProjectDirectory 
}) => {
  const [tempDirectory, setTempDirectory] = useState(projectDirectory);
  const { toast } = useToast();

  const selectDirectory = async () => {
    try {
      const directory = await window.electronAPI.selectDirectory();
      if (directory) {
        setTempDirectory(directory);
      }
    } catch (error) {
      console.error('Failed to select directory:', error);
      toast({
        title: 'Error',
        description: 'Failed to select directory',
        variant: 'destructive'
      });
    }
  };

  const saveSettings = async () => {
    try {
      await window.electronAPI.setSetting('projectDirectory', tempDirectory);
      setProjectDirectory(tempDirectory);
      toast({
        title: 'Success',
        description: 'Settings saved successfully',
        variant: 'default'
      });
      onClose();
    } catch (error) {
      console.error('Failed to save settings:', error);
      toast({
        title: 'Error',
        description: 'Failed to save settings',
        variant: 'destructive'
      });
    }
  };

  const resetSettings = () => {
    setTempDirectory('');
  };

  return (
    <Modal isOpen={true} onClose={onClose} title="Settings" size="md">
      <div className="p-6">
        <div className="space-y-6">
          {/* Project Directory */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Project Directory
            </label>
            <p className="text-sm text-slate-600 mb-3">
              Select the directory where metadata files will be stored and managed.
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                value={tempDirectory}
                onChange={(e) => setTempDirectory(e.target.value)}
                placeholder="No directory selected"
                className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                readOnly
              />
              <button
                onClick={selectDirectory}
                className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors duration-200"
              >
                <Folder className="w-4 h-4" />
                Browse
              </button>
            </div>
          </div>

          {/* Additional Settings */}
          <div className="bg-slate-50 rounded-lg p-4">
            <h3 className="font-medium text-slate-900 mb-2">About Project Directory</h3>
            <ul className="text-sm text-slate-600 space-y-1">
              <li>• This directory will be used for storing retrieved metadata</li>
              <li>• Generated manifest files will be saved here by default</li>
              <li>• Deployment operations will reference this location</li>
              <li>• You can change this setting at any time</li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-between">
            <button
              onClick={resetSettings}
              className="flex items-center gap-2 px-4 py-2 bg-slate-500 text-white rounded-lg hover:bg-slate-600 transition-colors duration-200"
            >
              <RotateCcw className="w-4 h-4" />
              Reset
            </button>
            <div className="flex gap-2">
              <button
                onClick={onClose}
                className="px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors duration-200"
              >
                Cancel
              </button>
              <button
                onClick={saveSettings}
                className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors duration-200"
              >
                <Save className="w-4 h-4" />
                Save Settings
              </button>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
};