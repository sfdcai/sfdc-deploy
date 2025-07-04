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
import { Toaster } from './components/Toaster';
import { ToastProvider } from './hooks/useToast';

export type ModalType = 'org-info' | 'manifest' | 'compare' | 'deploy' | 'setup' | 'system-check' | 'shell' | 'settings' | 'about' | null;

function App() {
  const [activeModal, setActiveModal] = useState<ModalType>(null);
  const [orgs, setOrgs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [projectDirectory, setProjectDirectory] = useState<string>('');

  useEffect(() => {
    loadOrgs();
    loadSettings();
  }, []);

  const loadOrgs = async () => {
    try {
      setLoading(true);
      const result = await window.electronAPI.executeSfCommand('org', ['list', '--json']);
      setOrgs(result.result || []);
    } catch (error) {
      console.error('Failed to load orgs:', error);
      setOrgs([]);
    } finally {
      setLoading(false);
    }
  };

  const loadSettings = async () => {
    try {
      const savedDirectory = await window.electronAPI.getSetting('projectDirectory');
      if (savedDirectory) {
        setProjectDirectory(savedDirectory);
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  };

  const closeModal = () => setActiveModal(null);

  return (
    <ToastProvider>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <Dashboard 
          onOpenModal={setActiveModal} 
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
        
        <Toaster />
      </div>
    </ToastProvider>
  );
}

export default App;