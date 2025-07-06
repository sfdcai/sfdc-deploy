import React, { useState, useEffect } from 'react';
import { Modal } from './Modal';
import { Folder, Save, RotateCcw, Loader2 } from 'lucide-react';
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
  const [settings, setSettings] = useState({
    defaultOrgAlias: '',
    autoRefreshOrgs: true, // Defaulting to true
  });
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchSettings = async () => {
      if (window.electronAPI) {
        try {
          const fetchedDefaultOrgAlias = await window.electronAPI.getSetting('defaultOrgAlias');
          const fetchedAutoRefreshOrgs = await window.electronAPI.getSetting('autoRefreshOrgs');
          setSettings({
            defaultOrgAlias: fetchedDefaultOrgAlias || '', // Use empty string if setting is null
            autoRefreshOrgs: fetchedAutoRefreshOrgs !== undefined ? fetchedAutoRefreshOrgs : true, // Use default if setting is null/undefined
          });
        } catch (error) {
          console.error('Failed to fetch settings:', error);
          toast({
            title: 'Error',
            description: 'Failed to load settings',
            variant: 'destructive'
          });
        } finally {
          setLoading(false);
        }
      }
    };
    fetchSettings();
  }, [toast]);

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
    setLoading(true);
    try {
      await window.electronAPI.setSetting('projectDirectory', tempDirectory);
      setProjectDirectory(tempDirectory);

      // Save additional settings
      await window.electronAPI.setSetting('defaultOrgAlias', settings.defaultOrgAlias);
      await window.electronAPI.setSetting('autoRefreshOrgs', settings.autoRefreshOrgs);

      toast({
        title: 'Settings Saved',
        description: 'Application settings have been updated.',
        variant: 'default'
      });
        title: 'Success',
        description: 'Settings saved successfully',
        variant: 'default'
      });
      onClose();
    } catch (error) {
      console.error('Failed to save settings:', error);
      toast({
        title: 'Error Saving Settings',
        description: `Failed to save settings: ${error.message}`,
        variant: 'destructive'
      });
      toast({
        title: 'Error',
        description: 'Failed to save settings',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSettingChange = (key: keyof typeof settings, value: any) => {
  };

  const resetSettings = () => {
    setTempDirectory('');
  };

  return (
    <Modal isOpen={true} onClose={onClose} title="Settings" size="md">
      <div className="p-6">
        {loading ? (
           <div className="flex justify-center items-center h-32">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          </div>
        ) : (
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

            {/* General Settings */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-slate-900">General Settings</h3>
               {/* Default Org Alias */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Default Org Alias
                </label>
                <input
                  type="text"
                  value={settings.defaultOrgAlias}
                  onChange={(e) => handleSettingChange('defaultOrgAlias', e.target.value)}
                  placeholder="Enter default org alias"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="text-xs text-slate-500 mt-1">
                  The alias of the org to be pre-selected in org picklists.
                </p>
              </div>
               {/* Auto Refresh Orgs */}
              <div className="flex items-center">
                 <input
                  type="checkbox"
                  checked={settings.autoRefreshOrgs}
                  onChange={(e) => handleSettingChange('autoRefreshOrgs', e.target.checked)}
                  id="autoRefreshOrgs"
                  className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="autoRefreshOrgs" className="ml-2 block text-sm text-slate-900">
                  Automatically refresh org list on startup
                </label>
              </div>
            </div>

           {/* Additional Info/Tips about Project Directory */}
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
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors duration-200"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Save Settings
              </button>
            </div>
          </div>
        )} {/* End loading check */}
          </div>
        </div>
      </div>
    </Modal>
  );
};