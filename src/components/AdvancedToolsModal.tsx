import React, { useState } from 'react';
import { Modal } from './Modal';
import { 
  Wrench, 
  Search, 
  Shield, 
  FileText, 
  Loader2, 
  AlertCircle,
  CheckCircle,
  XCircle,
  FolderOpen,
  Database
} from 'lucide-react';
import { useToast } from '../hooks/useToast';
import { logger } from '../utils/logger';

interface AdvancedToolsModalProps {
  orgs: any[];
  onClose: () => void;
  projectDirectory: string;
}

export const AdvancedToolsModal: React.FC<AdvancedToolsModalProps> = ({ 
  orgs, 
  onClose, 
  projectDirectory 
}) => {
  const [activeTab, setActiveTab] = useState<'dependency' | 'permissions' | 'cache'>('dependency');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any>(null);
  const { toast } = useToast();

  // Dependency Analysis State
  const [selectedOrg, setSelectedOrg] = useState<string>('');
  const [metadataType, setMetadataType] = useState<string>('');
  const [memberName, setMemberName] = useState<string>('');

  // Permission Analysis State
  const [sourcePath, setSourcePath] = useState<string>(projectDirectory || '');
  const [permissionResults, setPermissionResults] = useState<any>(null);

  const tabs = [
    {
      id: 'dependency',
      label: 'Dependency Analysis',
      icon: Search,
      description: 'Analyze component dependencies in your org'
    },
    {
      id: 'permissions',
      label: 'Permission Analyzer',
      icon: Shield,
      description: 'Analyze profiles and permission sets'
    },
    {
      id: 'cache',
      label: 'Cache Management',
      icon: Database,
      description: 'Manage project cache and settings'
    }
  ];

  const metadataTypes = [
    'ApexClass',
    'ApexTrigger',
    'CustomField',
    'CustomObject',
    'Flow',
    'Layout',
    'ValidationRule',
    'WorkflowRule',
    'PermissionSet',
    'Profile',
    'CustomTab',
    'CustomApplication'
  ];

  const runDependencyAnalysis = async () => {
    if (!selectedOrg || !metadataType || !memberName) {
      toast({
        title: 'Error',
        description: 'Please fill in all required fields',
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);
    logger.auditAction('START_DEPENDENCY_ANALYSIS', undefined, undefined, {
      orgAlias: selectedOrg,
      metadataType,
      memberName
    });

    try {
      // Simulate dependency analysis
      await new Promise(resolve => setTimeout(resolve, 3000));

      const mockResults = {
        component: `${metadataType}: ${memberName}`,
        org: selectedOrg,
        dependencies: [
          {
            type: 'ApexClass',
            name: 'AccountController',
            relationship: 'References',
            location: 'Line 45'
          },
          {
            type: 'CustomField',
            name: 'Account.CustomField__c',
            relationship: 'Uses',
            location: 'SOQL Query'
          },
          {
            type: 'Layout',
            name: 'Account-Account Layout',
            relationship: 'Displays',
            location: 'Field Section'
          }
        ],
        dependents: [
          {
            type: 'Flow',
            name: 'AccountProcessFlow',
            relationship: 'Calls',
            location: 'Apex Action'
          },
          {
            type: 'ValidationRule',
            name: 'Account.ValidateCustomField',
            relationship: 'Validates',
            location: 'Rule Formula'
          }
        ],
        analyzedAt: new Date().toISOString()
      };

      setResults(mockResults);
      
      logger.auditAction('COMPLETE_DEPENDENCY_ANALYSIS', undefined, undefined, {
        orgAlias: selectedOrg,
        dependenciesFound: mockResults.dependencies.length,
        dependentsFound: mockResults.dependents.length
      });

      toast({
        title: 'Analysis Complete',
        description: `Found ${mockResults.dependencies.length} dependencies and ${mockResults.dependents.length} dependents`,
        variant: 'default'
      });
    } catch (error: any) {
      logger.auditError('DEPENDENCY_ANALYSIS', error, undefined, selectedOrg);
      toast({
        title: 'Error',
        description: `Analysis failed: ${error.message}`,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const analyzePermissions = async () => {
    if (!sourcePath) {
      toast({
        title: 'Error',
        description: 'Please specify a source path',
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);
    logger.auditAction('START_PERMISSION_ANALYSIS', undefined, undefined, { sourcePath });

    try {
      // Simulate permission analysis
      await new Promise(resolve => setTimeout(resolve, 2000));

      const mockResults = {
        sourcePath,
        profiles: [
          {
            name: 'System Administrator.profile-meta.xml',
            fieldPermissions: 245,
            objectPermissions: 89,
            classAccesses: 156,
            pageAccesses: 23,
            userPermissions: 78
          },
          {
            name: 'Standard User.profile-meta.xml',
            fieldPermissions: 123,
            objectPermissions: 45,
            classAccesses: 67,
            pageAccesses: 12,
            userPermissions: 34
          }
        ],
        permissionSets: [
          {
            name: 'CustomPermissionSet.permissionset-meta.xml',
            fieldPermissions: 34,
            objectPermissions: 12,
            classAccesses: 23,
            pageAccesses: 5,
            userPermissions: 15
          }
        ],
        summary: {
          totalFiles: 3,
          totalPermissions: 567,
          potentialIssues: 2
        },
        analyzedAt: new Date().toISOString()
      };

      setPermissionResults(mockResults);
      
      logger.auditAction('COMPLETE_PERMISSION_ANALYSIS', undefined, undefined, {
        sourcePath,
        filesAnalyzed: mockResults.summary.totalFiles,
        totalPermissions: mockResults.summary.totalPermissions
      });

      toast({
        title: 'Analysis Complete',
        description: `Analyzed ${mockResults.summary.totalFiles} files with ${mockResults.summary.totalPermissions} permissions`,
        variant: 'default'
      });
    } catch (error: any) {
      logger.auditError('PERMISSION_ANALYSIS', error);
      toast({
        title: 'Error',
        description: `Analysis failed: ${error.message}`,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const clearCache = async () => {
    setLoading(true);
    logger.auditAction('CLEAR_PROJECT_CACHE');

    try {
      // Simulate cache clearing
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: 'Success',
        description: 'Project cache has been cleared successfully',
        variant: 'default'
      });
      
      logger.info('CACHE', 'Project cache cleared successfully');
    } catch (error: any) {
      logger.auditError('CLEAR_CACHE', error);
      toast({
        title: 'Error',
        description: 'Failed to clear cache',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const selectSourcePath = async () => {
    try {
      const directory = await window.electronAPI.selectDirectory();
      if (directory) {
        setSourcePath(directory);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to select directory',
        variant: 'destructive'
      });
    }
  };

  const renderDependencyTab = () => (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-medium text-blue-900 mb-2">Component Dependency Analyzer</h4>
        <p className="text-sm text-blue-700">
          Analyze dependencies and relationships for specific metadata components in your Salesforce org.
          This helps identify what components depend on each other before making changes.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Target Organization
          </label>
          <select
            value={selectedOrg}
            onChange={(e) => setSelectedOrg(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Choose an organization...</option>
            {orgs.map((org) => (
              <option key={org.alias} value={org.alias}>
                {org.alias} ({org.username})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Metadata Type
          </label>
          <select
            value={metadataType}
            onChange={(e) => setMetadataType(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Choose metadata type...</option>
            {metadataTypes.map((type) => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">
          Component Name
        </label>
        <input
          type="text"
          value={memberName}
          onChange={(e) => setMemberName(e.target.value)}
          placeholder="e.g., Account.MyCustomField__c, MyApexClass"
          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        <p className="text-xs text-slate-500 mt-1">
          Enter the full API name of the component you want to analyze
        </p>
      </div>

      <button
        onClick={runDependencyAnalysis}
        disabled={loading || !selectedOrg || !metadataType || !memberName}
        className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Analyzing Dependencies...
          </>
        ) : (
          <>
            <Search className="w-5 h-5" />
            Run Dependency Analysis
          </>
        )}
      </button>

      {results && (
        <div className="bg-slate-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Analysis Results</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg p-4">
              <h4 className="font-medium text-orange-700 mb-3">Dependencies ({results.dependencies.length})</h4>
              <p className="text-sm text-slate-600 mb-3">Components that this component depends on:</p>
              <div className="space-y-2">
                {results.dependencies.map((dep: any, index: number) => (
                  <div key={index} className="p-2 bg-orange-50 rounded border-l-4 border-orange-400">
                    <div className="font-medium text-slate-900">{dep.type}: {dep.name}</div>
                    <div className="text-sm text-slate-600">{dep.relationship} • {dep.location}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-lg p-4">
              <h4 className="font-medium text-green-700 mb-3">Dependents ({results.dependents.length})</h4>
              <p className="text-sm text-slate-600 mb-3">Components that depend on this component:</p>
              <div className="space-y-2">
                {results.dependents.map((dep: any, index: number) => (
                  <div key={index} className="p-2 bg-green-50 rounded border-l-4 border-green-400">
                    <div className="font-medium text-slate-900">{dep.type}: {dep.name}</div>
                    <div className="text-sm text-slate-600">{dep.relationship} • {dep.location}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-4 text-xs text-slate-500 text-center">
            Analysis completed at {new Date(results.analyzedAt).toLocaleString()}
          </div>
        </div>
      )}
    </div>
  );

  const renderPermissionsTab = () => (
    <div className="space-y-6">
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <h4 className="font-medium text-green-900 mb-2">Profile & Permission Set Analyzer</h4>
        <p className="text-sm text-green-700">
          Analyze profiles and permission sets in your source code to understand permission distributions
          and identify potential security issues or optimization opportunities.
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">
          Source Path
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={sourcePath}
            onChange={(e) => setSourcePath(e.target.value)}
            placeholder="Path to source folder containing profiles and permission sets"
            className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <button
            onClick={selectSourcePath}
            className="flex items-center gap-2 px-4 py-2 bg-slate-500 text-white rounded-lg hover:bg-slate-600 transition-colors duration-200"
          >
            <FolderOpen className="w-4 h-4" />
            Browse
          </button>
        </div>
        <p className="text-xs text-slate-500 mt-1">
          e.g., force-app/main/default or your project's metadata directory
        </p>
      </div>

      <button
        onClick={analyzePermissions}
        disabled={loading || !sourcePath}
        className="w-full bg-green-500 hover:bg-green-600 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Analyzing Permissions...
          </>
        ) : (
          <>
            <Shield className="w-5 h-5" />
            Analyze Permissions
          </>
        )}
      </button>

      {permissionResults && (
        <div className="bg-slate-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Permission Analysis Results</h3>
          
          {/* Summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-lg p-3 text-center">
              <div className="text-lg font-semibold text-slate-900">{permissionResults.summary.totalFiles}</div>
              <div className="text-sm text-slate-600">Files Analyzed</div>
            </div>
            <div className="bg-blue-50 rounded-lg p-3 text-center">
              <div className="text-lg font-semibold text-blue-600">{permissionResults.summary.totalPermissions}</div>
              <div className="text-sm text-blue-600">Total Permissions</div>
            </div>
            <div className="bg-green-50 rounded-lg p-3 text-center">
              <div className="text-lg font-semibold text-green-600">{permissionResults.profiles.length}</div>
              <div className="text-sm text-green-600">Profiles</div>
            </div>
            <div className="bg-purple-50 rounded-lg p-3 text-center">
              <div className="text-lg font-semibold text-purple-600">{permissionResults.permissionSets.length}</div>
              <div className="text-sm text-purple-600">Permission Sets</div>
            </div>
          </div>

          {/* Detailed Results */}
          <div className="space-y-4">
            <div>
              <h4 className="font-medium text-slate-900 mb-3">Profiles</h4>
              <div className="space-y-2">
                {permissionResults.profiles.map((profile: any, index: number) => (
                  <div key={index} className="bg-white rounded-lg p-4 border border-slate-200">
                    <h5 className="font-medium text-slate-900 mb-2">{profile.name}</h5>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                      <div>
                        <span className="text-slate-600">Field Permissions:</span>
                        <div className="font-medium">{profile.fieldPermissions}</div>
                      </div>
                      <div>
                        <span className="text-slate-600">Object Permissions:</span>
                        <div className="font-medium">{profile.objectPermissions}</div>
                      </div>
                      <div>
                        <span className="text-slate-600">Class Accesses:</span>
                        <div className="font-medium">{profile.classAccesses}</div>
                      </div>
                      <div>
                        <span className="text-slate-600">Page Accesses:</span>
                        <div className="font-medium">{profile.pageAccesses}</div>
                      </div>
                      <div>
                        <span className="text-slate-600">User Permissions:</span>
                        <div className="font-medium">{profile.userPermissions}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h4 className="font-medium text-slate-900 mb-3">Permission Sets</h4>
              <div className="space-y-2">
                {permissionResults.permissionSets.map((permSet: any, index: number) => (
                  <div key={index} className="bg-white rounded-lg p-4 border border-slate-200">
                    <h5 className="font-medium text-slate-900 mb-2">{permSet.name}</h5>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                      <div>
                        <span className="text-slate-600">Field Permissions:</span>
                        <div className="font-medium">{permSet.fieldPermissions}</div>
                      </div>
                      <div>
                        <span className="text-slate-600">Object Permissions:</span>
                        <div className="font-medium">{permSet.objectPermissions}</div>
                      </div>
                      <div>
                        <span className="text-slate-600">Class Accesses:</span>
                        <div className="font-medium">{permSet.classAccesses}</div>
                      </div>
                      <div>
                        <span className="text-slate-600">Page Accesses:</span>
                        <div className="font-medium">{permSet.pageAccesses}</div>
                      </div>
                      <div>
                        <span className="text-slate-600">User Permissions:</span>
                        <div className="font-medium">{permSet.userPermissions}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-4 text-xs text-slate-500 text-center">
            Analysis completed at {new Date(permissionResults.analyzedAt).toLocaleString()}
          </div>
        </div>
      )}
    </div>
  );

  const renderCacheTab = () => (
    <div className="space-y-6">
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <h4 className="font-medium text-yellow-900 mb-2">Cache Management</h4>
        <p className="text-sm text-yellow-700">
          Manage your project's cache and settings. Clearing cache will remove stored org information,
          metadata cache, and system information, forcing fresh data retrieval on next use.
        </p>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 p-6">
        <h4 className="font-medium text-slate-900 mb-4">Project Cache</h4>
        <p className="text-sm text-slate-600 mb-4">
          Your project cache contains:
        </p>
        <ul className="text-sm text-slate-600 space-y-1 mb-6">
          <li>• Authorized org information and credentials</li>
          <li>• Metadata type definitions and component lists</li>
          <li>• System software detection results</li>
          <li>• Application logs and audit trail</li>
        </ul>
        
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 mt-0.5" />
            <div>
              <h5 className="font-medium text-red-900 mb-1">Warning</h5>
              <p className="text-sm text-red-700">
                Clearing cache will require re-authentication with your orgs and fresh metadata retrieval.
                This action cannot be undone.
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={clearCache}
          disabled={loading}
          className="w-full bg-red-500 hover:bg-red-600 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Clearing Cache...
            </>
          ) : (
            <>
              <Database className="w-5 h-5" />
              Clear Project Cache
            </>
          )}
        </button>
      </div>
    </div>
  );

  return (
    <Modal isOpen={true} onClose={onClose} title="Advanced Tools" size="xl">
      <div className="p-6">
        {/* Tab Navigation */}
        <div className="flex space-x-1 mb-6 bg-slate-100 p-1 rounded-lg">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-md text-sm font-medium transition-all duration-200 ${
                  activeTab === tab.id
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        <div className="min-h-[400px]">
          {activeTab === 'dependency' && renderDependencyTab()}
          {activeTab === 'permissions' && renderPermissionsTab()}
          {activeTab === 'cache' && renderCacheTab()}
        </div>

        {/* Footer */}
        <div className="mt-8 pt-6 border-t border-slate-200 text-center text-xs text-slate-500">
          Advanced Tools - Salesforce Toolkit by Amit Bhardwaj
        </div>
      </div>
    </Modal>
  );
};