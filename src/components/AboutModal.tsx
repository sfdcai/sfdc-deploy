import React, { useState, useEffect } from 'react';
import { Modal } from './Modal';
import { ExternalLink, Heart, Code, Zap, Shield, Users } from 'lucide-react';

interface AboutModalProps {
  onClose: () => void;
}

export const AboutModal: React.FC<AboutModalProps> = ({ onClose }) => {
  const [appInfo, setAppInfo] = useState<any>(null);

  useEffect(() => {
    loadAppInfo();
  }, []);

  const loadAppInfo = async () => {
    try {
      const info = await window.electronAPI.getAppInfo();
      setAppInfo(info);
    } catch (error) {
      console.error('Failed to load app info:', error);
    }
  };

  const recommendations = [
    {
      icon: Code,
      title: 'Enhanced Metadata Comparison',
      description: 'Implement side-by-side diff viewer with syntax highlighting for better metadata comparison'
    },
    {
      icon: Zap,
      title: 'Automated Testing Integration',
      description: 'Add support for running Apex tests before deployments with detailed test results'
    },
    {
      icon: Shield,
      title: 'Backup & Rollback',
      description: 'Implement automatic backup creation before deployments with one-click rollback functionality'
    },
    {
      icon: Users,
      title: 'Team Collaboration',
      description: 'Add features for sharing deployment packages and collaboration workflows'
    }
  ];

  const improvements = [
    'Add comprehensive error handling with detailed error messages and suggested solutions',
    'Implement retry mechanisms for failed operations with exponential backoff',
    'Add progress indicators for long-running operations with cancellation support',
    'Include validation checks before operations to prevent common mistakes',
    'Add logging functionality to track all operations for debugging purposes',
    'Implement configuration profiles for different environments (dev, staging, prod)',
    'Add support for bulk operations and batch processing',
    'Include metadata dependency analysis to prevent deployment conflicts'
  ];

  return (
    <Modal isOpen={true} onClose={onClose} title="About Salesforce Toolkit" size="lg">
      <div className="p-6">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <Code className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">
            {appInfo?.name || 'Salesforce Toolkit'}
          </h2>
          <p className="text-slate-600 mb-2">Version {appInfo?.version || '1.0.0'}</p>
          <div className="flex items-center justify-center gap-2 text-sm">
            <span>Created with</span>
            <Heart className="w-4 h-4 text-red-500" />
            <span>by</span>
            <button
              onClick={() => window.electronAPI.openExternal(appInfo?.linkedin || 'https://www.linkedin.com/in/salesforce-technical-architect/')}
              className="text-blue-600 hover:text-blue-700 font-medium hover:underline flex items-center gap-1"
            >
              {appInfo?.author || 'Amit Bhardwaj'}
              <ExternalLink className="w-3 h-3" />
            </button>
          </div>
        </div>

        <div className="space-y-6">
          {/* Features */}
          <div>
            <h3 className="text-lg font-semibold text-slate-900 mb-3">Current Features</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {[
                'Org Information Display',
                'Manifest Generation',
                'Org Comparison',
                'Metadata Deployment',
                'System Requirements Check',
                'Interactive SF CLI Shell',
                'Project Directory Management',
                'Software Installation Helper'
              ].map((feature, index) => (
                <div key={index} className="flex items-center gap-2 text-sm text-slate-600">
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                  {feature}
                </div>
              ))}
            </div>
          </div>

          {/* Recommendations */}
          <div>
            <h3 className="text-lg font-semibold text-slate-900 mb-3">Recommended Enhancements</h3>
            <div className="space-y-3">
              {recommendations.map((rec, index) => {
                const Icon = rec.icon;
                return (
                  <div key={index} className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                    <Icon className="w-5 h-5 text-blue-500 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-blue-900">{rec.title}</h4>
                      <p className="text-sm text-blue-700">{rec.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Error Handling Improvements */}
          <div>
            <h3 className="text-lg font-semibold text-slate-900 mb-3">Error Handling & Improvements</h3>
            <div className="bg-slate-50 rounded-lg p-4">
              <ul className="text-sm text-slate-600 space-y-2">
                {improvements.map((improvement, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-slate-400 mt-1">•</span>
                    <span>{improvement}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Technology Stack */}
          <div>
            <h3 className="text-lg font-semibold text-slate-900 mb-3">Technology Stack</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                'Electron',
                'React',
                'TypeScript',
                'Tailwind CSS',
                'Node.js',
                'Salesforce CLI',
                'Lucide Icons',
                'Vite'
              ].map((tech, index) => (
                <div key={index} className="text-center p-2 bg-white border border-slate-200 rounded-lg">
                  <span className="text-sm font-medium text-slate-700">{tech}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Contact */}
          <div className="text-center pt-4 border-t border-slate-200">
            <p className="text-sm text-slate-600 mb-2">
              For questions, suggestions, or collaboration opportunities:
            </p>
            <button
              onClick={() => window.electronAPI.openExternal('https://www.linkedin.com/in/salesforce-technical-architect/')}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors duration-200"
            >
              Connect on LinkedIn
              <ExternalLink className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
};