import React from 'react';
import { 
  Building2, 
  FileText, 
  GitCompare, 
  Upload, 
  BookOpen,
  Loader2,
  Shield,
  Terminal,
  Settings,
  Info,
  FileSearch
} from 'lucide-react';
import { ModalType } from '../App';

interface DashboardProps {
  onOpenModal: (modal: ModalType) => void;
  orgsCount: number;
  loading: boolean;
  projectDirectory: string;
}

export const Dashboard: React.FC<DashboardProps> = ({ 
  onOpenModal, 
  orgsCount, 
  loading, 
  projectDirectory 
}) => {
  const features = [
    {
      id: 'org-info',
      title: 'Get Org Information',
      description: 'View details about your connected Salesforce orgs',
      icon: Building2,
      color: 'bg-blue-500',
      hoverColor: 'hover:bg-blue-600'
    },
    {
      id: 'manifest',
      title: 'Generate Manifest',
      description: 'Create package.xml files from your org metadata',
      icon: FileText,
      color: 'bg-green-500',
      hoverColor: 'hover:bg-green-600'
    },
    {
      id: 'compare',
      title: 'Compare Two Orgs',
      description: 'Diff metadata between different orgs',
      icon: GitCompare,
      color: 'bg-purple-500',
      hoverColor: 'hover:bg-purple-600'
    },
    {
      id: 'deploy',
      title: 'Deploy Metadata',
      description: 'Safely deploy changes between orgs',
      icon: Upload,
      color: 'bg-orange-500',
      hoverColor: 'hover:bg-orange-600'
    },
    {
      id: 'system-check',
      title: 'System Check',
      description: 'Check and install required software',
      icon: Shield,
      color: 'bg-red-500',
      hoverColor: 'hover:bg-red-600'
    },
    {
      id: 'shell',
      title: 'SF Command Shell',
      description: 'Execute Salesforce CLI commands interactively',
      icon: Terminal,
      color: 'bg-indigo-500',
      hoverColor: 'hover:bg-indigo-600'
    },
    {
      id: 'logs',
      title: 'Logs & Audit',
      description: 'View application logs and audit trail',
      icon: FileSearch,
      color: 'bg-teal-500',
      hoverColor: 'hover:bg-teal-600'
    },
    {
      id: 'setup',
      title: 'Setup Guide',
      description: 'Prerequisites and installation instructions',
      icon: BookOpen,
      color: 'bg-slate-500',
      hoverColor: 'hover:bg-slate-600'
    }
  ];

  return (
    <div className="container mx-auto px-6 py-8">
      {/* Header with Credits */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-slate-900 mb-2">
          Salesforce Toolkit
        </h1>
        <p className="text-lg text-slate-600 mb-2">
          A comprehensive desktop application for Salesforce developers and administrators
        </p>
        <div className="flex items-center justify-center gap-2 text-sm text-slate-500 mb-4">
          <span>Created by</span>
          <button
            onClick={() => window.electronAPI.openExternal('https://www.linkedin.com/in/salesforce-technical-architect/')}
            className="text-blue-600 hover:text-blue-700 font-medium hover:underline"
          >
            Amit Bhardwaj
          </button>
          <span>•</span>
          <span>Salesforce Technical Architect</span>
        </div>
        
        {/* Status Bar */}
        <div className="flex items-center justify-center gap-6 text-sm">
          {loading ? (
            <div className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Loading orgs...</span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>{orgsCount} org{orgsCount !== 1 ? 's' : ''} connected</span>
            </div>
          )}
          
          {projectDirectory && (
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span>Project: {projectDirectory.split('/').pop() || projectDirectory.split('\\').pop()}</span>
            </div>
          )}
        </div>
      </div>

      {/* Feature Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 max-w-7xl mx-auto mb-8">
        {features.map((feature) => {
          const Icon = feature.icon;
          return (
            <div
              key={feature.id}
              onClick={() => onOpenModal(feature.id as ModalType)}
              className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer group border border-slate-200 hover:border-slate-300"
            >
              <div className="p-6">
                <div className={`w-12 h-12 rounded-lg ${feature.color} ${feature.hoverColor} flex items-center justify-center mb-4 transition-colors duration-200`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-slate-900 mb-2 group-hover:text-slate-700 transition-colors duration-200">
                  {feature.title}
                </h3>
                <p className="text-slate-600 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div className="flex justify-center gap-4">
        <button
          onClick={() => onOpenModal('settings')}
          className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg shadow-sm border border-slate-200 hover:border-slate-300 transition-colors duration-200"
        >
          <Settings className="w-4 h-4" />
          Settings
        </button>
        <button
          onClick={() => onOpenModal('about')}
          className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg shadow-sm border border-slate-200 hover:border-slate-300 transition-colors duration-200"
        >
          <Info className="w-4 h-4" />
          About
        </button>
      </div>
    </div>
  );
};