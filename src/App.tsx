import React, { useState, useEffect } from 'react';
import { Dashboard } from './components/Dashboard';
import { SystemCheckModal } from './components/SystemCheckModal';
import { OrgInfoModal } from './components/OrgInfoModal';
import { ManifestModal } from './components/ManifestModal';
import { CompareModal } from './components/CompareModal';
import { DeployModal } from './components/DeployModal';
import { ShellModal } from './components/ShellModal';
import { LogsModal } from './components/LogsModal';
import { SettingsModal } from './components/SettingsModal';
import { SetupModal } from './components/SetupModal';
import { AboutModal } from './components/AboutModal';
import { AdvancedToolsModal } from './components/AdvancedToolsModal';
import { ProjectSelector } from './components/ProjectSelector';
import { Toaster } from './components/Toaster';
import { ToastProvider } from './hooks/useToast';
import { logger } from './utils/logger';
import { AlertTriangle } from 'lucide-react';

export type ModalType = 
  | 'system-check' 
  | 'org-info' 
  | 'manifest' 
  | 'compare' 
  | 'deploy' 
  | 'shell' 
  | 'logs' 
  | 'settings' 
  | 'setup' 
  | 'about'
  | 'advanced-tools'
  | null;

function AppContent({ project }: { project: string }) {
  const [currentModal, setCurrentModal] = useState<ModalType>(null);
  const [orgs, setOrgs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [projectDirectory, setProjectDirectory] = useState<string>('');

  useEffect(() => {
    loadInitialData();
  }, [project]);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      // Load project settings
      if (window.electronAPI) {
        const savedDirectory = await window.electronAPI.getSetting('projectDirectory');
        if (savedDirectory) {
          setProjectDirectory(savedDirectory);
        }
      }

      // Load orgs
      await loadOrgs();
      
      logger.info('APP', 'Application initialized successfully', { project });
    } catch (error) {
      logger.error('APP', 'Failed to initialize application', error);
    } finally {
      setLoading(false);
    }
  };

  const loadOrgs = async () => {
    if (!window.electronAPI) return;
    
    try {
      const orgsList = await window.electronAPI.getOrgsList();
      setOrgs(orgsList || []);
      logger.info('APP', `Loaded ${orgsList?.length || 0} organizations`);
    } catch (error) {
      logger.error('APP', 'Failed to load organizations', error);
      setOrgs([]);
    }
  };

  const openModal = (modal: ModalType) => {
    setCurrentModal(modal);
    logger.auditAction('OPEN_MODAL', undefined, undefined, { modal });
  };

  const closeModal = () => {
    const previousModal = currentModal;
    setCurrentModal(null);
    logger.auditAction('CLOSE_MODAL', undefined, undefined, { modal: previousModal });
  };

  const renderModal = () => {
    switch (currentModal) {
      case 'system-check':
        return <SystemCheckModal onClose={closeModal} />;
      case 'org-info':
        return <OrgInfoModal orgs={orgs} onClose={closeModal} />;
      case 'manifest':
        return <ManifestModal orgs={orgs} onClose={closeModal} projectDirectory={projectDirectory} />;
      case 'compare':
        return <CompareModal orgs={orgs} onClose={closeModal} />;
      case 'deploy':
        return <DeployModal orgs={orgs} onClose={closeModal} projectDirectory={projectDirectory} />;
      case 'shell':
        return <ShellModal onClose={closeModal} />;
      case 'logs':
        return <LogsModal onClose={closeModal} />;
      case 'settings':
        return (
          <SettingsModal 
            onClose={closeModal} 
            projectDirectory={projectDirectory}
            setProjectDirectory={setProjectDirectory}
          />
        );
      case 'setup':
        return <SetupModal onClose={closeModal} />;
      case 'about':
        return <AboutModal onClose={closeModal} />;
      case 'advanced-tools':
        return <AdvancedToolsModal orgs={orgs} onClose={closeModal} projectDirectory={projectDirectory} />;
      default:
        return null;
    }
  };

  return (
    <ToastProvider>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
        <Dashboard 
          onOpenModal={openModal}
          orgsCount={orgs.length}
          loading={loading}
          projectDirectory={projectDirectory}
          project={project}
          onRefreshOrgs={loadOrgs}
        />
        {renderModal()}
        <Toaster />
      </div>
    </ToastProvider>
  );
}

export default function App() {
  const [selectedProject, setSelectedProject] = useState<string | null>(null);

  if (!window.electronAPI) {
    return (
      <div className="flex items-center justify-center h-screen bg-red-50 text-red-900 p-8 font-sans">
        <div className="text-center max-w-2xl">
          <AlertTriangle className="mx-auto h-12 w-12 text-red-500" />
          <h1 className="mt-4 text-2xl font-bold">Application Error</h1>
          <p className="mt-2 text-base">
            This UI is designed to run inside the Electron desktop app and cannot connect to its backend.
          </p>
          <p className="mt-2 text-sm text-red-700">
            Please run this application through the Electron desktop version.
          </p>
        </div>
      </div>
    );
  }

  if (!selectedProject) {
    return <ProjectSelector onProjectSelect={setSelectedProject} />;
  }

  return <AppContent project={selectedProject} />;
}