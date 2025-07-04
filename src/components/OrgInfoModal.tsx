import React, { useState } from 'react';
import { Modal } from './Modal';
import { Building2, User, Globe, Code, CheckCircle, XCircle, Loader2 } from 'lucide-react';

interface OrgInfoModalProps {
  orgs: any[];
  onClose: () => void;
}

export const OrgInfoModal: React.FC<OrgInfoModalProps> = ({ orgs, onClose }) => {
  const [selectedOrg, setSelectedOrg] = useState<string>('');
  const [orgDetails, setOrgDetails] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleOrgSelect = async (orgAlias: string) => {
    setSelectedOrg(orgAlias);
    setLoading(true);
    
    try {
      const result = await window.electronAPI.executeSfCommand('org', ['display', '--target-org', orgAlias, '--json']);
      setOrgDetails(result.result);
    } catch (error) {
      console.error('Failed to get org details:', error);
      setOrgDetails(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={true} onClose={onClose} title="Org Information" size="lg">
      <div className="p-6">
        <div className="mb-6">
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Select Organization
          </label>
          <select
            value={selectedOrg}
            onChange={(e) => handleOrgSelect(e.target.value)}
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

        {loading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            <span className="ml-2 text-slate-600">Loading org details...</span>
          </div>
        )}

        {orgDetails && !loading && (
          <div className="bg-slate-50 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Organization Details</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-3 p-3 bg-white rounded-lg">
                <Building2 className="w-5 h-5 text-blue-500" />
                <div>
                  <p className="text-sm text-slate-500">Org ID</p>
                  <p className="font-medium text-slate-900">{orgDetails.id}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-3 bg-white rounded-lg">
                <User className="w-5 h-5 text-green-500" />
                <div>
                  <p className="text-sm text-slate-500">Username</p>
                  <p className="font-medium text-slate-900">{orgDetails.username}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-3 bg-white rounded-lg">
                <Globe className="w-5 h-5 text-purple-500" />
                <div>
                  <p className="text-sm text-slate-500">Instance URL</p>
                  <p className="font-medium text-slate-900">{orgDetails.instanceUrl}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-3 bg-white rounded-lg">
                <Code className="w-5 h-5 text-orange-500" />
                <div>
                  <p className="text-sm text-slate-500">API Version</p>
                  <p className="font-medium text-slate-900">{orgDetails.apiVersion}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-3 bg-white rounded-lg md:col-span-2">
                {orgDetails.connectedStatus === 'Connected' ? (
                  <CheckCircle className="w-5 h-5 text-green-500" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-500" />
                )}
                <div>
                  <p className="text-sm text-slate-500">Status</p>
                  <p className="font-medium text-slate-900">{orgDetails.connectedStatus}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};