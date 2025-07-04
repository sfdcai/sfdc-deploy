import React, { useState } from 'react';
import { Modal } from './Modal';
import { GitCompare, Upload, File, Loader2 } from 'lucide-react';
import { useToast } from '../hooks/useToast';

interface CompareModalProps {
  orgs: any[];
  onClose: () => void;
}

export const CompareModal: React.FC<CompareModalProps> = ({ orgs, onClose }) => {
  const [sourceOrg, setSourceOrg] = useState<string>('');
  const [targetOrg, setTargetOrg] = useState<string>('');
  const [manifestFile, setManifestFile] = useState<{ name: string; content: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any>(null);
  const { toast } = useToast();

  const selectManifest = async () => {
    try {
      const file = await window.electronAPI.openFile();
      if (file) {
        setManifestFile({
          name: file.path.split('/').pop() || 'package.xml',
          content: file.content
        });
      }
    } catch (error) {
      console.error('Failed to select file:', error);
      toast({
        title: 'Error',
        description: 'Failed to load manifest file',
        variant: 'destructive'
      });
    }
  };

  const compareOrgs = async () => {
    if (!sourceOrg || !targetOrg || !manifestFile) {
      toast({
        title: 'Error',
        description: 'Please select both organizations and a manifest file',
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);
    try {
      // Simulate comparison results
      const mockResults = {
        added: ['CustomObject__c.NewField__c', 'ApexClass.NewClass'],
        modified: ['ApexClass.ExistingClass', 'CustomObject__c.ExistingField__c'],
        deleted: ['ApexClass.OldClass'],
        identical: ['ApexTrigger.AccountTrigger', 'Flow.AccountFlow']
      };
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setResults(mockResults);
      toast({
        title: 'Success',
        description: 'Organization comparison completed',
        variant: 'default'
      });
    } catch (error) {
      console.error('Failed to compare orgs:', error);
      toast({
        title: 'Error',
        description: 'Failed to compare organizations',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={true} onClose={onClose} title="Compare Two Orgs" size="xl">
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Source Organization
            </label>
            <select
              value={sourceOrg}
              onChange={(e) => setSourceOrg(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Choose source org...</option>
              {orgs.map((org) => (
                <option key={org.alias} value={org.alias}>
                  {org.alias} ({org.username})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Target Organization
            </label>
            <select
              value={targetOrg}
              onChange={(e) => setTargetOrg(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Choose target org...</option>
              {orgs.map((org) => (
                <option key={org.alias} value={org.alias}>
                  {org.alias} ({org.username})
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Package.xml Manifest
          </label>
          <div className="border-2 border-dashed border-slate-300 rounded-lg p-4">
            {manifestFile ? (
              <div className="flex items-center gap-3">
                <File className="w-5 h-5 text-green-500" />
                <span className="text-sm text-slate-700">{manifestFile.name}</span>
                <button
                  onClick={selectManifest}
                  className="text-blue-500 hover:text-blue-600 text-sm"
                >
                  Change
                </button>
              </div>
            ) : (
              <button
                onClick={selectManifest}
                className="w-full flex items-center justify-center gap-2 text-slate-600 hover:text-slate-700 transition-colors duration-200"
              >
                <Upload className="w-5 h-5" />
                Select manifest file
              </button>
            )}
          </div>
        </div>

        <button
          onClick={compareOrgs}
          disabled={loading || !sourceOrg || !targetOrg || !manifestFile}
          className="w-full bg-purple-500 hover:bg-purple-600 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2 mb-6"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Comparing...
            </>
          ) : (
            <>
              <GitCompare className="w-5 h-5" />
              Compare Metadata
            </>
          )}
        </button>

        {results && (
          <div className="bg-slate-50 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Comparison Results</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white rounded-lg p-4">
                <h4 className="font-medium text-green-700 mb-2">Added ({results.added.length})</h4>
                <div className="space-y-1">
                  {results.added.map((item: string, index: number) => (
                    <div key={index} className="text-sm text-slate-600 p-1 bg-green-50 rounded">
                      + {item}
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-lg p-4">
                <h4 className="font-medium text-blue-700 mb-2">Modified ({results.modified.length})</h4>
                <div className="space-y-1">
                  {results.modified.map((item: string, index: number) => (
                    <div key={index} className="text-sm text-slate-600 p-1 bg-blue-50 rounded">
                      ~ {item}
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-lg p-4">
                <h4 className="font-medium text-red-700 mb-2">Deleted ({results.deleted.length})</h4>
                <div className="space-y-1">
                  {results.deleted.map((item: string, index: number) => (
                    <div key={index} className="text-sm text-slate-600 p-1 bg-red-50 rounded">
                      - {item}
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-lg p-4">
                <h4 className="font-medium text-slate-700 mb-2">Identical ({results.identical.length})</h4>
                <div className="space-y-1">
                  {results.identical.map((item: string, index: number) => (
                    <div key={index} className="text-sm text-slate-600 p-1 bg-slate-50 rounded">
                      = {item}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};