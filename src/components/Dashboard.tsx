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
  FileSearch,
  Wrench,
  RefreshCw,
  Linkedin,
  ExternalLink
} from 'lucide-react';
import { ModalType } from '../App';

interface DashboardProps {
  onOpenModal: (modal: ModalType) => void;
  orgsCount: number;
  loading: boolean;
  projectDirectory: string;
  project: string;
  onRefreshOrgs: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ 
  onOpenModal, 
  orgsCount, 
  loading, 
  projectDirectory,
  project,
  onRefreshOrgs
}) => {
  const features = [
    {
      id: 'system-check',
      title: 'System Check',
      description: 'Verify and install required software dependencies',
      icon: Shield,
      color: 'bg-red-500',
      hoverColor: 'hover:bg-red-600',
      category: 'System'
    },
    {
      id: 'org-info',
      title: 'Org Information',
      description: 'View detailed information about connected Salesforce orgs',
      icon: Building2,
      color: 'bg-blue-500',
      hoverColor: 'hover:bg-blue-600',
      category: 'Orgs'
    },
    {
      id: 'manifest',
      title: 'Generate Manifest',
      description: 'Create package.xml files from your org metadata',
      icon: FileText,
      color: 'bg-green-500',
      hoverColor: 'hover:bg-green-600',
      category: 'Metadata'
    },
    {
      id: 'compare',
      title: 'Compare Two Orgs',
      description: 'Visual diff of metadata between different orgs',
      icon: GitCompare,
      color: 'bg-purple-500',
      hoverColor: 'hover:bg-purple-600',
      category: 'Metadata'
    },
    {
      id: 'deploy',
      title: 'Deploy Metadata',
      description: 'Safely deploy changes between orgs with validation',
      icon: Upload,
      color: 'bg-orange-500',
      hoverColor: 'hover:bg-orange-600',
      category: 'Deployment'
    },
    {
      id: 'shell',
      title: 'SF Command Shell',
      description: 'Execute Salesforce CLI commands interactively',
      icon: Terminal,
      color: 'bg-indigo-500',
      hoverColor: 'hover:bg-indigo-600',
      category: 'Tools'
    },
    {
      id: 'advanced-tools',
      title: 'Advanced Tools',
      description: 'Dependency analysis, permission analyzer, and more',
      icon: Wrench,
      color: 'bg-cyan-500',
      hoverColor: 'hover:bg-cyan-600',
      category: 'Tools'
    },
    {
      id: 'logs',
      title: 'Logs & Audit',
      description: 'View application logs and audit trail',
      icon: FileSearch,
      color: 'bg-teal-500',
      hoverColor: 'hover:bg-teal-600',
      category: 'System'
    },
    {
      id: 'setup',
      title: 'Setup Guide',
      description: 'Prerequisites and installation instructions',
      icon: BookOpen,
      color: 'bg-slate-500',
      hoverColor: 'hover:bg-slate-600',
      category: 'Help'
    }
  ];

  const categories = ['System', 'Orgs', 'Metadata', 'Deployment', 'Tools', 'Help'];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-slate-200">
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 mb-2">
                Salesforce Toolkit
              </h1>
              <p className="text-slate-600">
                Professional-grade DevOps toolkit for Salesforce development
              </p>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={onRefreshOrgs}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 transition-colors duration-200"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                Refresh Orgs
              </button>
              <button
                onClick={() => onOpenModal('settings')}
                className="flex items-center gap-2 px-4 py-2 bg-slate-500 text-white rounded-lg hover:bg-slate-600 transition-colors duration-200"
              >
                <Settings className="w-4 h-4" />
                Settings
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Project Status Bar */}
      <div className="bg-blue-600 text-white">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                <span className="font-medium">Project: {project}</span>
              </div>
              {loading ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Loading orgs...</span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4" />
                  <span>{orgsCount} org{orgsCount !== 1 ? 's' : ''} connected</span>
                </div>
              )}
              {projectDirectory && (
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  <span>Directory: {projectDirectory.split('/').pop() || projectDirectory.split('\\').pop()}</span>
                </div>
              )}
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span>Created by</span>
              <button
                onClick={() => window.electronAPI?.openExternal('https://www.linkedin.com/in/salesforce-technical-architect/')}
                className="flex items-center gap-1 text-blue-200 hover:text-white transition-colors"
              >
                Amit Bhardwaj
                <ExternalLink className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-8">
        {categories.map((category) => {
          const categoryFeatures = features.filter(f => f.category === category);
          if (categoryFeatures.length === 0) return null;

          return (
            <div key={category} className="mb-12">
              <h2 className="text-2xl font-bold text-slate-900 mb-6">{category}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {categoryFeatures.map((feature) => {
                  const Icon = feature.icon;
                  return (
                    <div
                      key={feature.id}
                      onClick={() => onOpenModal(feature.id as ModalType)}
                      className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-200 cursor-pointer group border border-slate-200 hover:border-slate-300 overflow-hidden"
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
                      <div className="px-6 pb-4">
                        <div className="text-xs text-slate-500 uppercase tracking-wide font-medium">
                          {feature.category}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}

        {/* Quick Actions */}
        <div className="mt-12 bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Quick Actions</h3>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => onOpenModal('about')}
              className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors duration-200"
            >
              <Info className="w-4 h-4" />
              About
            </button>
            <button
              onClick={() => window.electronAPI?.openExternal('https://www.linkedin.com/in/salesforce-technical-architect/')}
              className="flex items-center gap-2 px-4 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg transition-colors duration-200"
            >
              <Linkedin className="w-4 h-4" />
              LinkedIn
            </button>
            <button
              onClick={() => onOpenModal('setup')}
              className="flex items-center gap-2 px-4 py-2 bg-green-100 hover:bg-green-200 text-green-700 rounded-lg transition-colors duration-200"
            >
              <BookOpen className="w-4 h-4" />
              Setup Guide
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};