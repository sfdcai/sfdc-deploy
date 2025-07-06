import React, { useState, useEffect, useRef } from 'react';
import { 
  CheckSquare, Terminal, Server, PlusCircle, Info, FileText, GitCompare, 
  Upload, Settings, Linkedin, AlertTriangle, BookOpen, Folder, Loader2,
  Shield, Wrench, FileSearch, RefreshCw, Plus, User, LogOut
} from 'lucide-react';
import { Toaster, toast } from 'sonner';
import { AddOrgModal } from './components/AddOrgModal';
import { SfCommandHelpModal } from './components/SfCommandHelpModal';

// --- Project Selection Component ---
function ProjectSelector({ onProjectSelect }: { onProjectSelect: (project: string) => void }) {
    const [projects, setProjects] = useState<string[] | null>(null);
    const [newProjectName, setNewProjectName] = useState('');

    useEffect(() => {
        if (window.electronAPI) {
            window.electronAPI.getProjects().then(setProjects).catch(err => {
                console.error("Failed to get projects:", err);
                setProjects([]);
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
    const [orgs, setOrgs] = useState<any[]>([]);
    const [command, setCommand] = useState('');
    const terminalRef = useRef<HTMLDivElement>(null);
    const [isAddOrgModalOpen, setIsAddOrgModalOpen] = useState(false);
    const [isSfCommandHelpModalOpen, setIsSfCommandHelpModalOpen] = useState(false);

    useEffect(() => {
        if (terminalRef.current) terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }, [output]);

    useEffect(() => {
        loadOrgs();
    }, []);

    const loadOrgs = async () => {
        if (!window.electronAPI) return;
        try {
            const orgsList = await window.electronAPI.getOrgsList();
            setOrgs(orgsList || []);
        } catch (error) {
            console.error('Failed to load orgs:', error);
            setOrgs([]);
        }
    };

    const executeCommand = async (cmd: string) => {
        setIsLoading(true);
        setOutput(prev => prev + `\n\n> ${cmd}\n`);
        
        try {
            const result = await window.electronAPI.executePowerShellCommand(cmd);
            setOutput(prev => prev + (result.output || result.error || 'Command completed'));
            
            if (cmd.includes('sf org')) {
                await loadOrgs(); // Refresh orgs if org command was run
            }
        } catch (error: any) {
            setOutput(prev => prev + `\nError: ${error.message}`);
            toast.error("Command failed");
        } finally {
            setIsLoading(false);
        }
    };

    const handleExecuteCommand = (command: string, options: any = {}) => {
        executeCommand(command);
    };
    
    const handleAddOrg = () => {
        setIsAddOrgModalOpen(true);
    };

    const handleShowSfCommandHelp = () => {
        setIsSfCommandHelpModalOpen(true);
    };

    const handleManualCommand = () => {
        if (command.trim()) {
            executeCommand(command);
            setCommand('');
        }
    };

    const menuItems = [
        { 
            id: 'system-check', 
            icon: CheckSquare, 
            label: 'System Check', 
            action: () => executeCommand('sf --version && node --version && git --version'),
            category: 'System'
        },
        { 
            id: 'list-orgs', 
            icon: Server, 
            label: 'List Orgs', 
            action: () => executeCommand('sf org list'),
            category: 'Orgs'
        },
        { 
            id: 'add-org', 
            icon: PlusCircle, 
            label: 'Add New Org', 
            action: handleAddOrg,
            category: 'Orgs'
        },
        { 
            id: 'org-info', 
            icon: Info, 
            label: 'Org Info', 
            action: () => {
                if (orgs.length === 0) {
                    toast.error("No orgs available. Please authenticate first.");
                    return;
                }
                const orgAlias = orgs[0]?.alias || orgs[0]?.username;
                if (orgAlias) {
                    executeCommand(`sf org display --target-org ${orgAlias}`);
                }
            },
            category: 'Orgs'
        },
        { 
            id: 'generate-manifest', 
            icon: FileText, 
            label: 'Generate Manifest', 
            action: () => {
                const manifestContent = `<?xml version="1.0" encoding="UTF-8"?>
<Package xmlns="http://soap.sforce.com/2006/04/metadata">
    <types>
        <members>*</members>
        <name>ApexClass</name>
    </types>
    <types>
        <members>*</members>
        <name>ApexTrigger</name>
    </types>
    <types>
        <members>*</members>
        <name>CustomObject</name>
    </types>
    <types>
        <members>*</members>
        <name>Layout</name>
    </types>
    <types>
        <members>*</members>
        <name>Flow</name>
    </types>
    <version>58.0</version>
</Package>`;
                
                // Save manifest file
                window.electronAPI.saveFile(manifestContent, 'package.xml').then(filePath => {
                    if (filePath) {
                        setOutput(prev => prev + `\n\n✅ Manifest generated: ${filePath}`);
                        toast.success("Manifest file generated successfully");
                    }
                }).catch(err => {
                    setOutput(prev => prev + `\n\n❌ Failed to save manifest: ${err.message}`);
                    toast.error("Failed to save manifest file");
                });
            },
            category: 'Metadata'
        },
        { 
            id: 'compare-orgs', 
            icon: GitCompare, 
            label: 'Compare Orgs', 
            action: () => {
                if (orgs.length < 2) {
                    toast.error("Need at least 2 orgs to compare");
                    return;
                }
                setOutput(prev => prev + `\n\nOrg Comparison:\nSource: ${orgs[0]?.alias}\nTarget: ${orgs[1]?.alias}\nUse 'sf project retrieve start --manifest package.xml --target-org <org>' to retrieve metadata for comparison.`);
            },
            category: 'Metadata'
        },
        { 
            id: 'deploy', 
            icon: Upload, 
            label: 'Deploy Metadata', 
            action: () => {
                if (orgs.length === 0) {
                    toast.error("No target org available");
                    return;
                }
                const targetOrg = orgs[0]?.alias || orgs[0]?.username;
                executeCommand(`sf project deploy validate --manifest package.xml --target-org ${targetOrg}`);
            },
            category: 'Deployment'
        },
        { 
            id: 'advanced-tools', 
            icon: Wrench, 
            label: 'Advanced Tools', 
            action: () => {
                setOutput(prev => prev + `\n\nAdvanced Tools Available:\n- Dependency Analysis: sf project list metadata-dependencies\n- Permission Analysis: Analyze profiles and permission sets\n- Cache Management: Clear project cache and settings`);
            },
            category: 'Tools'
        },
        { 
            id: 'logs', 
            icon: FileSearch, 
            label: 'View Logs', 
            action: () => {
                setOutput(prev => prev + `\n\nApplication logs and audit trail available in the logs section.`);
            },
            category: 'System'
        }
    ];

    const categories = ['System', 'Orgs', 'Metadata', 'Deployment', 'Tools'];

    return (
        <>
            <Toaster position="top-right" richColors />
            <div className="flex h-screen bg-slate-100 font-sans">
                {/* Left Sidebar - Compact */}
                <aside className="w-80 bg-white border-r border-slate-200 flex flex-col">
                    {/* Header */}
                    <div className="p-4 border-b border-slate-200">
                        <h1 className="text-lg font-bold text-slate-800">Salesforce Toolkit</h1>
                        <p className="text-xs text-slate-500">Project: <span className="font-semibold text-blue-600">{project}</span></p>
                        <div className="flex items-center gap-2 mt-2 text-xs">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            <span>{orgs.length} org{orgs.length !== 1 ? 's' : ''} connected</span>
                            <button 
                                onClick={loadOrgs}
                                className="ml-auto p-1 hover:bg-slate-100 rounded"
                                title="Refresh orgs"
                            >
                                <RefreshCw className="w-3 h-3" />
                            </button>
                        </div>
                    </div>

                    {/* Org Quick Actions */}
                    <div className="p-3 border-b border-slate-200 bg-slate-50">
                        <h3 className="text-xs font-semibold text-slate-700 mb-2">Quick Org Actions</h3>
                        <div className="flex gap-1">
                            <button
                                onClick={handleAddOrg}
                                className="flex items-center gap-1 px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
                            >
                                <Plus className="w-3 h-3" />
                                Add Org
                            </button>
                            <button
                                onClick={() => executeCommand('sf org list')}
                                className="flex items-center gap-1 px-2 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600"
                            >
                                <Server className="w-3 h-3" />
                                List
                            </button>
                            {orgs.length > 0 && (
                                <button
                                    onClick={() => {
                                        const orgAlias = orgs[0]?.alias || orgs[0]?.username;
                                        executeCommand(`sf org open --target-org ${orgAlias}`);
                                    }}
                                    className="flex items-center gap-1 px-2 py-1 text-xs bg-purple-500 text-white rounded hover:bg-purple-600"
                                >
                                    <User className="w-3 h-3" />
                                    Open
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Connected Orgs */}
                    {orgs.length > 0 && (
                        <div className="p-3 border-b border-slate-200">
                            <h3 className="text-xs font-semibold text-slate-700 mb-2">Connected Orgs</h3>
                            <div className="space-y-1 max-h-24 overflow-y-auto">
                                {orgs.slice(0, 3).map((org, index) => (
                                    <div key={index} className="flex items-center gap-2 text-xs">
                                        <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                                        <span className="font-medium truncate">{org.alias || org.username}</span>
                                        <button
                                            onClick={() => executeCommand(`sf org display --target-org ${org.alias || org.username}`)}
                                            className="ml-auto p-1 hover:bg-slate-100 rounded"
                                            title="View org info"
                                        >
                                            <Info className="w-3 h-3" />
                                        </button>
                                    </div>
                                ))}
                                {orgs.length > 3 && (
                                    <div className="text-xs text-slate-500">+{orgs.length - 3} more orgs</div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Menu Items by Category */}
                    <nav className="flex-1 p-2 space-y-3 overflow-y-auto">
                        {categories.map(category => {
                            const categoryItems = menuItems.filter(item => item.category === category);
                            return (
                                <div key={category}>
                                    <h3 className="text-xs font-semibold text-slate-600 mb-1 px-2">{category}</h3>
                                    <div className="space-y-1">
                                        {categoryItems.map(item => (
                                            <button 
                                                key={item.id} 
                                                onClick={item.action} 
                                                disabled={isLoading}
                                                className="w-full flex items-center gap-2 px-2 py-1.5 text-xs font-medium text-slate-700 rounded hover:bg-slate-100 disabled:opacity-50"
                                            >
                                                <item.icon className="w-4 h-4" />
                                                <span>{item.label}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </nav>

                    {/* Footer */}
                    <div className="p-3 border-t border-slate-200">
                        <button
                            onClick={() => window.electronAPI?.openExternal('https://www.linkedin.com/in/salesforce-technical-architect/')}
                            className="w-full flex items-center gap-2 px-2 py-1.5 text-xs font-medium text-slate-700 rounded hover:bg-slate-100"
                        >
                            <Linkedin className="w-4 h-4" />
                            <span>Created by Amit Bhardwaj</span>
                        </button>
                    </div>
                </aside>

                {/* Right Side - PowerShell Terminal */}
                <main className="flex-1 flex flex-col">
                    {/* Terminal Header */}
                    <div className="flex items-center justify-between p-3 border-b border-slate-200 bg-slate-50">
                        <div className="flex items-center gap-2">
                            <Terminal className="w-4 h-4" />
                            <span className="text-sm font-medium">PowerShell Terminal</span>
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setOutput('')}
                                className="px-2 py-1 text-xs bg-slate-200 hover:bg-slate-300 rounded"
                            >
                                Clear
                            </button>
                            <button
                                onClick={handleShowSfCommandHelp}
                                className="px-2 py-1 text-xs bg-blue-500 text-white hover:bg-blue-600 rounded"
                            >
                                SF Help
                            </button>
                        </div>
                    </div>

                    {/* Terminal Output */}
                    <div 
                        ref={terminalRef}
                        className="flex-1 p-4 bg-slate-900 text-green-400 font-mono text-sm overflow-y-auto"
                    >
                        <pre style={{ whiteSpace: 'pre-wrap', wordWrap: 'break-word' }}>{output}</pre>
                        {isLoading && (
                            <div className="flex items-center gap-2 text-yellow-400 pt-2">
                                <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
                                <span>Executing...</span>
                            </div>
                        )}
                    </div>

                    {/* Command Input */}
                    <div className="p-3 border-t border-slate-200 bg-white">
                        <div className="flex gap-2">
                            <div className="flex-1 flex items-center gap-2 px-3 py-2 border border-slate-300 rounded focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent">
                                <span className="text-slate-500 text-sm">PS</span>
                                <input
                                    type="text"
                                    value={command}
                                    onChange={(e) => setCommand(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && handleManualCommand()}
                                    placeholder="Enter PowerShell or SF CLI command..."
                                    className="flex-1 outline-none text-sm"
                                    disabled={isLoading}
                                />
                            </div>
                            <button
                                onClick={handleManualCommand}
                                disabled={isLoading || !command.trim()}
                                className="px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded transition-colors duration-200 flex items-center gap-2"
                            >
                                {isLoading ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <Terminal className="w-4 h-4" />
                                )}
                                <span className="text-sm">Execute</span>
                            </button>
                        </div>
                        <div className="mt-2 text-xs text-slate-500">
                            Common commands: <code>sf org list</code>, <code>sf org login web --alias myorg</code>, <code>sf project generate manifest</code>
                        </div>
                    </div>
                </main>
            </div>
        </>
    );

    {/* Modals */}
    <AddOrgModal
        isOpen={isAddOrgModalOpen}
        onClose={() => setIsAddOrgModalOpen(false)}
    />
    <SfCommandHelpModal
        isOpen={isSfCommandHelpModalOpen}
        onClose={() => setIsSfCommandHelpModalOpen(false)}
    />
}

// Main App component
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