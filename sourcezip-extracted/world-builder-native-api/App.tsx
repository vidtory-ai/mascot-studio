
import React, { useState, useRef, useEffect } from 'react';
import { GenerationData, GeneratedImage, MasterAsset } from './types';
import Workspace from './components/Workspace';
import MasterWorld from './components/MasterWorld';
import { SparklesIcon, GlobeAltIcon, ArrowDownTrayIcon, ArrowUpTrayIcon, Cog6ToothIcon, ArrowRightOnRectangleIcon } from '@heroicons/react/24/solid';
import { Card } from './components/ui/Card';
import { Input } from './components/ui/Input';
import { Button } from './components/ui/Button';

// Base64 for the default main character image
const defaultCharacterBase64 = "";

type ViewMode = 'brainstorm' | 'master_world';

const App: React.FC = () => {
    // Authentication State
    const [isLoggedIn, setIsLoggedIn] = useState(() => localStorage.getItem('bs_auth') === 'true');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [loginError, setLoginError] = useState('');

    const [viewMode, setViewMode] = useState<ViewMode>('master_world');
    const [showBrainstorm, setShowBrainstorm] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const [generationData, setGenerationData] = useState<GenerationData>({
        mainCharacterDescription: 'An anthropomorphic orange tabby cat detective named Kilo. He has large green eyes, a friendly expression, and wears a brown detective\'s deerstalker hat and a matching trench coat with a tie.',
        characterBodyType: 'default',
        mainCharacterImage: {
                src: `data:image/jpeg;base64,${defaultCharacterBase64}`,
                base64: defaultCharacterBase64,
                mimeType: 'image/jpeg',
            },
        styleDescription: '3D digital art, Pixar-style rendering, cinematic lighting. The style is warm, humorous, and family-friendly, suitable for young children. Uses soft, vibrant colors and detailed but clean textures.',
        worldDescription: 'Harmony Harbor, a charming European-American coastal town featuring pastel-colored wooden houses, a bustling harbor, a green park, a cozy library, and a lively weekend market. The atmosphere is warm and gentle.',
        images: [],
        masterAssets: [],
        masterAssetGroups: [],
    });
    
    const fileInputRef = useRef<HTMLInputElement>(null);
    const settingsRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!showBrainstorm && viewMode === 'brainstorm') {
            setViewMode('master_world');
        }
    }, [showBrainstorm, viewMode]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (settingsRef.current && !settingsRef.current.contains(event.target as Node)) {
                setShowSettings(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        if (username.toLowerCase() === 'lehuyducanh' && password === 'kiloandbruno2025') {
            setIsLoggedIn(true);
            localStorage.setItem('bs_auth', 'true');
            setLoginError('');
        } else {
            setLoginError('Invalid credentials');
        }
    };

    const handleLogout = () => {
        setIsLoggedIn(false);
        localStorage.removeItem('bs_auth');
        setUsername('');
        setPassword('');
        setShowSettings(false);
    };

    const handleSaveProject = () => {
        const jsonString = JSON.stringify(generationData, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const href = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = href;
        link.download = `ip-design-studio-project.kilo`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(href);
    };

    const handleImportProject = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const text = e.target?.result;
                if (typeof text === 'string') {
                    const data = JSON.parse(text) as GenerationData;
                    
                    // --- Backward Compatibility Migrations ---
                    
                    // 1. Ensure masterAssets exists
                    if (!data.masterAssets) {
                        data.masterAssets = [];
                    }

                    // 2. Ensure masterAssetGroups exists
                    if (!data.masterAssetGroups) {
                        data.masterAssetGroups = [];
                    }

                    // 3. Sanitize older images that might miss new fields
                    if (Array.isArray(data.images)) {
                         data.images = data.images.map(img => ({
                             ...img,
                             // Ensure these fields exist if missing from old saves
                             generationTarget: img.generationTarget || 'new_shot',
                             parentId: img.parentId || undefined,
                             isEdited: img.isEdited || false
                         }));
                    }

                    // Basic validation to ensure it's a valid project file
                    if (data.mainCharacterDescription !== undefined && Array.isArray(data.images)) {
                        setGenerationData({ 
                            ...data, 
                            // Ensure mainCharacterImage handles potentially null/missing values safely
                            mainCharacterImage: data.mainCharacterImage || null,
                            characterBodyType: data.characterBodyType || 'default'
                        });
                        alert("Project loaded successfully!");
                    } else {
                        alert('Invalid project file format.');
                    }
                }
            } catch (error) {
                console.error("Failed to parse project file:", error);
                alert('Error reading project file. Make sure it is a valid JSON file.');
            }
        };
        reader.readAsText(file);
        event.target.value = '';
    };

    if (!isLoggedIn) {
        return (
            <div className="flex items-center justify-center h-screen bg-sky-100">
                <Card className="w-full max-w-md p-8 shadow-2xl">
                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-extrabold text-slate-800">Brian's Studio</h1>
                        <p className="text-slate-500 mt-2">Please log in to continue</p>
                    </div>
                    <form onSubmit={handleLogin} className="space-y-6">
                        <Input 
                            label="Username" 
                            id="username" 
                            value={username} 
                            onChange={e => setUsername(e.target.value)}
                            autoFocus
                        />
                        <Input 
                            label="Password" 
                            id="password" 
                            type="password" 
                            value={password} 
                            onChange={e => setPassword(e.target.value)} 
                        />
                        {loginError && (
                            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm font-medium">
                                {loginError}
                            </div>
                        )}
                        <Button type="submit" className="w-full !py-3 !text-base">
                            Enter Studio
                        </Button>
                    </form>
                </Card>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-screen overflow-hidden">
            {/* Top Navigation Bar */}
            <header className="bg-slate-800 text-white flex items-center justify-between px-6 py-3 shadow-md shrink-0 z-10 relative">
                <div className="flex items-center gap-2">
                     <h1 className="text-xl font-extrabold tracking-tight">Brian's Studio</h1>
                </div>
                <nav className="flex bg-slate-700 rounded-lg p-1">
                    {showBrainstorm && (
                        <button
                            onClick={() => setViewMode('brainstorm')}
                            className={`flex items-center px-4 py-2 rounded-md transition-all ${viewMode === 'brainstorm' ? 'bg-sky-500 text-white shadow-sm font-bold' : 'text-slate-300 hover:text-white hover:bg-slate-600'}`}
                        >
                            <SparklesIcon className="w-5 h-5 mr-2" />
                            Step 1: Brainstorm
                        </button>
                    )}
                    <button
                        onClick={() => setViewMode('master_world')}
                        className={`flex items-center px-4 py-2 rounded-md transition-all ${viewMode === 'master_world' ? 'bg-indigo-500 text-white shadow-sm font-bold' : 'text-slate-300 hover:text-white hover:bg-slate-600'}`}
                    >
                        <GlobeAltIcon className="w-5 h-5 mr-2" />
                        Master World
                    </button>
                </nav>
                <div className="flex items-center gap-2">
                    <button 
                        onClick={handleSaveProject} 
                        className="text-slate-300 hover:text-white flex items-center gap-1 px-3 py-2 rounded-md hover:bg-slate-700 transition-all" 
                        title="Save Project"
                    >
                        <ArrowDownTrayIcon className="w-5 h-5" />
                        <span className="text-sm font-semibold hidden md:inline">Save</span>
                    </button>
                    <button 
                        onClick={handleImportProject} 
                        className="text-slate-300 hover:text-white flex items-center gap-1 px-3 py-2 rounded-md hover:bg-slate-700 transition-all" 
                        title="Import Project"
                    >
                         <ArrowUpTrayIcon className="w-5 h-5" />
                         <span className="text-sm font-semibold hidden md:inline">Load</span>
                    </button>
                    <div className="relative" ref={settingsRef}>
                        <button
                            onClick={() => setShowSettings(!showSettings)}
                            className={`text-slate-300 hover:text-white p-2 rounded-md hover:bg-slate-700 transition-all ${showSettings ? 'bg-slate-700 text-white' : ''}`}
                            title="Settings"
                        >
                            <Cog6ToothIcon className="w-6 h-6" />
                        </button>
                        {showSettings && (
                            <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-xl border border-slate-200 py-2 z-50 text-slate-800">
                                <h3 className="px-4 py-2 text-xs font-extrabold text-slate-500 uppercase tracking-wider border-b border-slate-100 mb-2">
                                    Studio Settings
                                </h3>
                                <div className="px-4 py-2 flex items-center justify-between hover:bg-slate-50 cursor-pointer" onClick={() => setShowBrainstorm(!showBrainstorm)}>
                                    <span className="text-sm font-medium">Show "Brainstorm" Tab</span>
                                    <div className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors ${showBrainstorm ? 'bg-sky-500' : 'bg-slate-300'}`}>
                                        <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${showBrainstorm ? 'translate-x-5' : ''}`}></div>
                                    </div>
                                </div>
                                <div className="border-t border-slate-100 my-1"></div>
                                <button
                                    onClick={handleLogout}
                                    className="w-full text-left px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors flex items-center"
                                >
                                    <ArrowRightOnRectangleIcon className="w-4 h-4 mr-2" />
                                    Log Out
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </header>

            {/* Main Content Area */}
            <div className="flex-1 overflow-hidden">
                {viewMode === 'brainstorm' && showBrainstorm ? (
                    <Workspace 
                        generationData={generationData}
                        setGenerationData={setGenerationData}
                        onImportProject={handleImportProject}
                        onSaveProject={handleSaveProject}
                    />
                ) : (
                    <MasterWorld
                         generationData={generationData}
                         setGenerationData={setGenerationData}
                    />
                )}
            </div>

            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="application/json,.kilo"
                className="hidden"
            />
        </div>
    );
};

export default App;
