import React, { useState, useEffect, useRef } from 'react';
import { 
    CheckSquare, Terminal, Server, PlusCircle, Info, FileText, GitCompare, 
    Upload, Settings, Linkedin, AlertTriangle, BookOpen, Folder, Loader2
} from 'lucide-react';
import { Toaster, toast } from 'sonner';

// --- Project Selection Component ---
function ProjectSelector({ onProjectSelect }: { onProjectSelect: (project: string) => void }) {
    const [projects, setProjects] = useState<string[] | null>(null);
    const [newProjectName, setNewProjectName] = useState('');

    useEffect(() => {
        if (window.electronAPI) {
            window.electronAPI.getProjects().then(setProjects).catch(err => {
                console.error("Failed to get projects:", err);
                setProjects([]); // Set to empty array on error
            });
        }
    }, []);

    const handleCreateProject = () => {
        if (newProjectName.trim()) {
            onProjectSelect(newProjectName.trim());
        }
    };

    if (projects === null) {
        return <div className="flex items-center justify-center h-screen bg-slate-100"><Loader2 className="w-8 h-8 animate-spin" /></div>;
    }

    return (
        <div className="flex items-center justify-center h-screen bg-slate-900 text-white font-sans">
            <div className="w-full max-w-md p-8 bg-slate-800 rounded-lg shadow-2xl">
                <Folder className="w-12 h-12 mx-auto text-slate-500" />
                <h1 className="text-2xl font-bold text-center mt-4">Select a Project</h1>
                
                {projects.length > 0 && (
                    <div className="mt-6 space-y-2">
                        {projects.map(p => (
                            <button 
                                key={p} 
                                onClick={() => onProjectSelect(p)}
                                className="w-full text-left p-3 bg-slate-700 rounded-md hover:bg-slate-600 transition-colors"
                            >
                                {p}
                            </button>
                        ))}
                    </div>
                )}

                <div className="mt-8 pt-6 border-t border-slate-700">
                    <h2 className="text-lg font-semibold">Or Create a New One</h2>
                    <div className="flex gap-2 mt-4">
                        <input
                            type="text"
                            value={newProjectName}
                            onChange={(e) => setNewProjectName(e.target.value)}
                            placeholder="e.g., Project-X-Sandbox"
                            className="flex-1 p-2 bg-slate-900 border border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <button onClick={handleCreateProject} className="px-4 py-2 bg-blue-600 rounded-md hover:bg-blue-500 font-semibold">
                            Create
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

// --- Main Application Content ---
function AppContent({ project }: { project: string }) {
    const [output, setOutput] = useState(`Welcome to Project: ${project}!\nSelect an action from the left menu to begin.`);
    const [isLoading, setIsLoading] = useState(false);
    const terminalRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (terminalRef.current) terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }, [output]);

    const handleExecuteCommand = async (command: string, options: any = {}) => {
        setIsLoading(true);
        setOutput(`> Executing: ${command}\n\n`);
        try {
            await window.electronAPI.executeToolkitCommand(command, project, options, (data) => {
                setOutput(prev => prev + data);
            });
        } catch (error: any) {
            setOutput(prev => prev + `\n\n[SCRIPT EXECUTION ERROR]: ${error.message}`);
            toast.error("An error occurred while executing the command.");
        } finally {
            setIsLoading(false);
            toast.success("Command finished.");
        }
    };
    
    const handleAddOrg = () => {
        const alias = prompt("Please enter a unique alias for the new org:");
        if (alias && alias.trim()) {
            handleExecuteCommand('Add-NewOrg', { Alias: alias.trim() });
        }
    };

    const menuItems = [
        { id: 'system-check', icon: CheckSquare, label: 'System Check', action: () => handleExecuteCommand('Show-SystemCheck') },
        { id: 'list-orgs', icon: Server, label: 'List Orgs', action: () => handleExecuteCommand('Show-AuthorizedOrgs') },
        { id: 'add-org', icon: PlusCircle, label: 'Add New Org', action: handleAddOrg },
        { id: 'command-help', icon: BookOpen, label: 'Command Reference', action: () => handleExecuteCommand('Show-SfCommandHelp') },
        // Add other menu items here
    ];

    return (
        <>
            <Toaster position="top-right" richColors />
            <div className="flex h-screen bg-slate-100 font-sans">
                <aside className="w-64 bg-white border-r border-slate-200 flex flex-col">
                    <div className="p-4 border-b border-slate-200">
                        <h1 className="text-xl font-bold text-slate-800">Salesforce Toolkit</h1>
                        <p className="text-xs text-slate-500">Project: <span className="font-semibold text-blue-600">{project}</span></p>
                    </div>
                    <nav className="flex-1 p-2 space-y-1">
                        {menuItems.map(item => (
                            <button key={item.id} onClick={item.action} disabled={isLoading}
                                className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium text-slate-700 rounded-md hover:bg-slate-100 disabled:opacity-50">
                                <item.icon className="w-5 h-5" />
                                <span>{item.label}</span>
                            </button>
                        ))}
                    </nav>
                    <div className="p-4 border-t border-slate-200">
                        <a href="https://www.linkedin.com/in/salesforce-technical-architect/" target="_blank" rel="noopener noreferrer" className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium text-slate-700 rounded-md hover:bg-slate-100">
                            <Linkedin className="w-5 h-5" />
                            <span>LinkedIn</span>
                        </a>
                    </div>
                </aside>
                <main className="flex-1 flex flex-col p-4">
                    <div className="flex-1 flex flex-col bg-slate-900 rounded-lg shadow-inner overflow-hidden">
                        <div className="flex-1 p-4 text-white font-mono text-sm overflow-y-auto" ref={terminalRef}>
                            <pre style={{ whiteSpace: 'pre-wrap', wordWrap: 'break-word' }}>{output}</pre>
                            {isLoading && (
                                <div className="flex items-center gap-2 text-yellow-400 pt-2">
                                    <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
                                    <span>Executing...</span>
                                </div>
                            )}
                        </div>
                    </div>
                </main>
            </div>
        </>
    );
}

// Main App component that decides whether to show the project selector or the main app
export default function App() {
    const [selectedProject, setSelectedProject] = useState<string | null>(null);

    if (!window.electronAPI) {
        return (
             <div className="flex items-center justify-center h-screen bg-red-50 text-red-900 p-8 font-sans">
                <div className="text-center max-w-2xl">
                    <AlertTriangle className="mx-auto h-12 w-12 text-red-500" />
                    <h1 className="mt-4 text-2xl font-bold">Application Error</h1>
                    <p className="mt-2 text-base">This UI is designed to run inside the Electron desktop app and cannot connect to its backend.</p>
                </div>
            </div>
        )
    }

    if (!selectedProject) {
        return <ProjectSelector onProjectSelect={setSelectedProject} />;
    }

    return <AppContent project={selectedProject} />;
}
