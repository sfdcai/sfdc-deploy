import React, { useState, useEffect } from 'react';
import { Dashboard } from './components/Dashboard';
import { OrgInfoModal } from './components/OrgInfoModal';
import { ManifestModal } from './components/ManifestModal';
import { CompareModal } from './components/CompareModal';
import { DeployModal } from './components/DeployModal';
import { SetupModal } from './components/SetupModal';
import { SystemCheckModal } from './components/SystemCheckModal';
import { ShellModal } from './components/ShellModal';
import { SettingsModal } from './components/SettingsModal';
import { AboutModal } from './components/AboutModal';
import { LogsModal } from './components/LogsModal';
import { Toaster } from './components/Toaster';
import { ToastProvider } from './hooks/useToast';
import { logger } from './utils/logger';

export type ModalType = 'org-info' | 'manifest' | 'compare' | 'deploy' | 'setup' | 'system-check' | 'shell' | 'settings' | 'about' | 'logs' | null;

function App() {
  const [activeModal, setActiveModal] = useState<ModalType>(null);
  const [orgs, setOrgs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [projectDirectory, setProjectDirectory] = useState<string>('');

  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    logger.info('APP', 'Application starting up');
    
    // Check if electronAPI is available
    if (!window.electronAPI) {
      logger.error('APP', 'Electron API not available - running in browser mode');
      setLoading(false);
      return;
    }

    await loadOrgs();
    await loadSettings();
    logger.info('APP', 'Application initialization complete');
  };

  const loadOrgs = async () => {
    try {
      setLoading(true);
      logger.info('APP', 'Loading authenticated orgs');
      
      if (!window.electronAPI) {
        logger.warn('APP', 'Electron API not available, using empty orgs list');
        setOrgs([]);
        return;
      }

      const result = await window.electronAPI.executeSfCommand('org', ['list', '--json']);
      
      // Handle different response formats
      let orgsList = [];
      if (result && result.result) {
        orgsList = Array.isArray(result.result) ? result.result : 
                   result.result.nonScratchOrgs ? result.result.nonScratchOrgs : 
                   result.result.scratchOrgs ? result.result.scratchOrgs : [];
      } else if (result && Array.isArray(result)) {
        orgsList = result;
      }

      setOrgs(orgsList);
      logger.info('APP', `Successfully loaded ${orgsList.length} orgs`, { orgsCount: orgsList.length });
    } catch (error: any) {
      logger.error('APP', 'Failed to load orgs', error);
      // Don't show error if SF CLI is not installed or no orgs are authenticated
      if (error.message && error.message.includes('No authenticated orgs found')) {
        logger.info('APP', 'No authenticated orgs found - this is normal for new installations');
      }
      setOrgs([]);
    } finally {
      setLoading(false);
    }
  };

  const loadSettings = async () => {
    try {
      logger.debug('APP', 'Loading application settings');
      
      if (!window.electronAPI) {
        logger.warn('APP', 'Electron API not available, skipping settings load');
        return;
      }

      const savedDirectory = await window.electronAPI.getSetting('projectDirectory');
      if (savedDirectory) {
        setProjectDirectory(savedDirectory);
        logger.info('APP', 'Project directory loaded from settings', { projectDirectory: savedDirectory });
      }
    } catch (error: any) {
      logger.error('APP', 'Failed to load settings', error);
    }
  };

  const handleOpenModal = (modal: ModalType) => {
    logger.auditAction('OPEN_MODAL', undefined, undefined, { modalType: modal });
    setActiveModal(modal);
  };

  const closeModal = () => {
    if (activeModal) {
      logger.auditAction('CLOSE_MODAL', undefined, undefined, { modalType: activeModal });
    }
    setActiveModal(null);
  };

  return (
    <ToastProvider>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <Dashboard 
          onOpenModal={handleOpenModal} 
          orgsCount={orgs.length} 
          loading={loading}
          projectDirectory={projectDirectory}
        />
        
        {activeModal === 'org-info' && (
          <OrgInfoModal orgs={orgs} onClose={closeModal} />
        )}
        
        {activeModal === 'manifest' && (
          <ManifestModal orgs={orgs} onClose={closeModal} projectDirectory={projectDirectory} />
        )}
        
        {activeModal === 'compare' && (
          <CompareModal orgs={orgs} onClose={closeModal} />
        )}
        
        {activeModal === 'deploy' && (
          <DeployModal orgs={orgs} onClose={closeModal} projectDirectory={projectDirectory} />
        )}
        
        {activeModal === 'setup' && (
          <SetupModal onClose={closeModal} />
        )}
        
        {activeModal === 'system-check' && (
          <SystemCheckModal onClose={closeModal} />
        )}
        
        {activeModal === 'shell' && (
          <ShellModal onClose={closeModal} />
        )}
        
        {activeModal === 'settings' && (
          <SettingsModal 
            onClose={closeModal} 
            projectDirectory={projectDirectory}
            setProjectDirectory={setProjectDirectory}
          />
        )}
        
        {activeModal === 'about' && (
          <AboutModal onClose={closeModal} />
        )}
        
        {activeModal === 'logs' && (
          <LogsModal onClose={closeModal} />
        )}
        
        <Toaster />
      </div>
    </ToastProvider>
  );
}

export default App;