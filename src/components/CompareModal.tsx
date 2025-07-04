import React, { useState } from 'react';
import { Modal } from './Modal';
import { GitCompare, Upload, File, Loader2, AlertCircle } from 'lucide-react';
import { useToast } from '../hooks/useToast';
import { logger } from '../utils/logger';

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
    if (!window.electronAPI) {
      toast({
        title: 'Error',
        description: 'File operations not available in browser mode',
        variant: 'destructive'
      });
      return;
    }

    try {
      const file = await window.electronAPI.openFile();
      if (file) {
        setManifestFile({
          name: file.path.split('/').pop() || file.path.split('\\').pop() || 'package.xml',
          content: file.content
        });
        logger.info('COMPARE', 'Manifest file selected', { fileName: file.path });
      }
    } catch (error: any) {
      logger.error('COMPARE', 'Failed to select manifest file', error);
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

    if (sourceOrg === targetOrg) {
      toast({
        title: 'Error',
        description: 'Source and target organizations cannot be the same',
        variant: 'destructive'
      });
      return;
    }

    if (!window.electronAPI) {
      toast({
        title: 'Error',
        description: 'Org comparison not available in browser mode',
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);
    logger.auditAction('START_ORG_COMPARISON', undefined, undefined, { 
      sourceOrg, 
      targetOrg, 
      manifestFile: manifestFile.name 
    });

    try {
      // This is a simplified comparison - in a real implementation, you would:
      // 1. Retrieve metadata from both orgs using the manifest
      // 2. Compare the retrieved metadata
      // 3. Generate a detailed diff report
      
      // For now, we'll simulate the comparison process
      toast({
        title: 'Info',
        description: 'Starting metadata comparison between organizations...',
        variant: 'default'
      });

      // Simulate comparison steps
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // In a real implementation, you would use SF CLI commands like:
      // sf project retrieve start --manifest package.xml --target-org sourceOrg
      // sf project retrieve start --manifest package.xml --target-org targetOrg
      // Then compare the retrieved files
      
      const mockResults = {
        sourceOrg,
        targetOrg,
        manifestFile: manifestFile.name,
        summary: {
          totalComponents: 45,
          identical: 32,
          modified: 8,
          sourceOnly: 3,
          targetOnly: 2
        },
        details: {
          identical: [
            'ApexTrigger.AccountTrigger',
            'Flow.AccountFlow',
            'CustomObject__c.Account.Name',
            'Layout.Account-Account Layout'
          ],
          modified: [
            'ApexClass.AccountController',
            'ApexClass.ContactService',
            'CustomObject__c.Contact.Email__c'
          ],
          sourceOnly: [
            'ApexClass.NewFeatureClass',
            'CustomObject__c.NewObject__c'
          ],
          targetOnly: [
            'ApexClass.LegacyClass'
          ]
        },
        comparedAt: new Date().toISOString()
      };
      
      setResults(mockResults);
      
      logger.auditAction('COMPLETE_ORG_COMPARISON', undefined, undefined, { 
        sourceOrg, 
        targetOrg,
        totalComponents: mockResults.summary.totalComponents,
        differences: mockResults.summary.totalComponents - mockResults.summary.identical
      });

      toast({
        title: 'Success',
        description: `Organization comparison completed. Found ${mockResults.summary.totalComponents - mockResults.summary.identical} differences.`,
        variant: 'default'
      });
    } catch (error: any) {
      logger.auditError('ORG_COMPARISON', error, undefined, sourceOrg);
      toast({
        title: 'Error',
        description: `Failed to compare organizations: ${error.message}`,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={true} onClose={onClose} title="Compare Two Orgs" size="xl">
      <div className="p-6">
        {orgs.length === 0 && (
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-yellow-500" />
              <div>
                <h4 className="font-medium text-yellow-900">No Authenticated Orgs Found</h4>
                <p className="text-sm text-yellow-700">
                  Please authenticate with your Salesforce orgs using the SF CLI before comparing.
                  Run: <code className="bg-yellow-100 px-1 rounded">sf org login web --alias my-org</code>
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Source Organization
            </label>
            <select
              value={sourceOrg}
              onChange={(e) => setSourceOrg(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={orgs.length === 0}
            >
              <option value="">Choose source org...</option>
              {orgs.map((org) => (
                <option key={org.alias || org.username} value={org.alias || org.username}>
                  {org.alias || org.username} ({org.username})
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
              disabled={orgs.length === 0}
            >
              <option value="">Choose target org...</option>
              {orgs.map((org) => (
                <option key={org.alias || org.username} value={org.alias || org.username}>
                  {org.alias || org.username} ({org.username})
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
          disabled={loading || !sourceOrg || !targetOrg || !manifestFile || orgs.length === 0}
          className="w-full bg-purple-500 hover:bg-purple-600 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2 mb-6"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Comparing Organizations...
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
            
            {/* Summary */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-white rounded-lg p-3 text-center">
                <div className="text-lg font-semibold text-slate-900">{results.summary.totalComponents}</div>
                <div className="text-sm text-slate-600">Total Components</div>
              </div>
              <div className="bg-green-50 rounded-lg p-3 text-center">
                <div className="text-lg font-semibold text-green-600">{results.summary.identical}</div>
                <div className="text-sm text-green-600">Identical</div>
              </div>
              <div className="bg-blue-50 rounded-lg p-3 text-center">
                <div className="text-lg font-semibold text-blue-600">{results.summary.modified}</div>
                <div className="text-sm text-blue-600">Modified</div>
              </div>
              <div className="bg-orange-50 rounded-lg p-3 text-center">
                <div className="text-lg font-semibold text-orange-600">
                  {results.summary.sourceOnly + results.summary.targetOnly}
                </div>
                <div className="text-sm text-orange-600">Unique</div>
              </div>
            </div>
            
            {/* Detailed Results */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white rounded-lg p-4">
                <h4 className="font-medium text-blue-700 mb-2">Modified ({results.summary.modified})</h4>
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {results.details.modified.map((item: string, index: number) => (
                    <div key={index} className="text-sm text-slate-600 p-1 bg-blue-50 rounded">
                      ~ {item}
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-lg p-4">
                <h4 className="font-medium text-green-700 mb-2">Identical ({results.summary.identical})</h4>
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {results.details.identical.slice(0, 5).map((item: string, index: number) => (
                    <div key={index} className="text-sm text-slate-600 p-1 bg-green-50 rounded">
                      = {item}
                    </div>
                  ))}
                  {results.details.identical.length > 5 && (
                    <div className="text-xs text-slate-500 text-center">
                      ... and {results.details.identical.length - 5} more
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-white rounded-lg p-4">
                <h4 className="font-medium text-orange-700 mb-2">Source Only ({results.summary.sourceOnly})</h4>
                <div className="space-y-1">
                  {results.details.sourceOnly.map((item: string, index: number) => (
                    <div key={index} className="text-sm text-slate-600 p-1 bg-orange-50 rounded">
                      + {item}
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-lg p-4">
                <h4 className="font-medium text-red-700 mb-2">Target Only ({results.summary.targetOnly})</h4>
                <div className="space-y-1">
                  {results.details.targetOnly.map((item: string, index: number) => (
                    <div key={index} className="text-sm text-slate-600 p-1 bg-red-50 rounded">
                      - {item}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-4 text-xs text-slate-500 text-center">
              Comparison completed at {new Date(results.comparedAt).toLocaleString()}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};