import React, { useState, useEffect } from 'react';
import { Folder, Loader2, Plus, FolderOpen } from 'lucide-react';

interface ProjectSelectorProps {
  onProjectSelect: (project: string) => void;
}

export const ProjectSelector: React.FC<ProjectSelectorProps> = ({ onProjectSelect }) => {
  const [projects, setProjects] = useState<string[] | null>(null);
  const [newProjectName, setNewProjectName] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    setLoading(true);
    try {
      if (window.electronAPI) {
        const projectList = await window.electronAPI.getProjectList();
        setProjects(projectList || []);
      } else {
        setProjects([]);
      }
    } catch (error) {
      console.error("Failed to get projects:", error);
      setProjects([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProject = () => {
    if (newProjectName.trim()) {
      onProjectSelect(newProjectName.trim());
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleCreateProject();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-slate-900 to-blue-900">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-400 mx-auto mb-4" />
          <p className="text-white text-lg">Loading projects...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center h-screen bg-gradient-to-br from-slate-900 to-blue-900 text-white font-sans">
      <div className="w-full max-w-2xl p-8">
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl p-8 border border-white/20">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <Folder className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold mb-2">Salesforce Toolkit</h1>
            <p className="text-blue-200">Select or create a project to get started</p>
            <div className="mt-4 text-sm text-slate-300">
              Created by{' '}
              <button
                onClick={() => window.electronAPI?.openExternal('https://www.linkedin.com/in/salesforce-technical-architect/')}
                className="text-blue-400 hover:text-blue-300 underline"
              >
                Amit Bhardwaj
              </button>
              {' '}• Salesforce Technical Architect
            </div>
          </div>

          {/* Existing Projects */}
          {projects && projects.length > 0 && (
            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <FolderOpen className="w-5 h-5" />
                Existing Projects
              </h2>
              <div className="grid gap-3">
                {projects.map((project) => (
                  <button
                    key={project}
                    onClick={() => onProjectSelect(project)}
                    className="w-full text-left p-4 bg-white/10 hover:bg-white/20 rounded-xl transition-all duration-200 border border-white/10 hover:border-white/30 group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center group-hover:bg-blue-500/30 transition-colors">
                        <Folder className="w-5 h-5 text-blue-400" />
                      </div>
                      <div>
                        <h3 className="font-medium text-white group-hover:text-blue-200 transition-colors">
                          {project}
                        </h3>
                        <p className="text-sm text-slate-400">Click to open project</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Create New Project */}
          <div className="border-t border-white/20 pt-8">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Plus className="w-5 h-5" />
              Create New Project
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Project Name
                </label>
                <input
                  type="text"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="e.g., Project-X-Sandbox, Production-Deployment"
                  className="w-full p-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>
              <button
                onClick={handleCreateProject}
                disabled={!newProjectName.trim()}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 flex items-center justify-center gap-2"
              >
                <Plus className="w-5 h-5" />
                Create Project
              </button>
            </div>
          </div>

          {/* Help Text */}
          <div className="mt-8 p-4 bg-blue-500/10 rounded-xl border border-blue-500/20">
            <h3 className="font-medium text-blue-200 mb-2">About Projects</h3>
            <ul className="text-sm text-slate-300 space-y-1">
              <li>• Projects help organize your Salesforce development work</li>
              <li>• Each project maintains its own settings, cache, and logs</li>
              <li>• Use descriptive names like "Production-Deployment" or "Sandbox-Testing"</li>
              <li>• You can switch between projects anytime from the settings</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};