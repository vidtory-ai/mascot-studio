import React, { useState, useRef, useEffect } from 'react';
import { StoryboardInputs, ColorType, GeneratedScene, GridSize, StoryStep, PageType, StoryboardShot } from './types';
import { analyzeScriptToStoryboard } from './services/geminiService';
import { generatePageImage, editPageImage } from './services/imageService';
import { InputForm } from './components/InputForm';
import { ComicPanel } from './components/ComicPanel';
import { VIDEO_GENRES, STORYBOARD_STYLES } from './constants';
import JSZip from 'jszip';

const App: React.FC = () => {
  // --- App State ---
  const [inputs, setInputs] = useState<StoryboardInputs>({
    prompt: '',
    genre: VIDEO_GENRES[0],
    sceneCount: 5,
    language: 'Vietnamese',
    colorType: ColorType.COLOR,
    style: STORYBOARD_STYLES[0],
    gridSize: GridSize.GRID_2x2,
    aspectRatio: '16:9',
    characters: [],
    globalBackgroundImage: undefined
  });

  const [storyStep, setStoryStep] = useState<StoryStep>(StoryStep.INPUT);
  const [scenes, setScenes] = useState<GeneratedScene[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isGeneratingAll, setIsGeneratingAll] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [lastSaved, setLastSaved] = useState<number | null>(null);
  
  // Mobile Menu
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // Lightbox
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const resultsRef = useRef<HTMLDivElement>(null);
  const abortControllersRef = useRef<Map<string, AbortController>>(new Map());

  // --- Auto-Save & Load Logic ---
  useEffect(() => {
    const savedData = localStorage.getItem('storyboard_autosave');
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        if (parsed.inputs) setInputs(parsed.inputs);
        if (parsed.scenes) setScenes(parsed.scenes);
        if (parsed.storyStep) setStoryStep(parsed.storyStep);
        console.log("Auto-loaded project from local storage.");
      } catch (e) {
        console.error("Failed to load autosave", e);
      }
    }
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => {
      const dataToSave = {
        inputs,
        scenes,
        storyStep,
        timestamp: Date.now()
      };
      localStorage.setItem('storyboard_autosave', JSON.stringify(dataToSave));
      setLastSaved(Date.now());
    }, 2000); // Debounce 2s

    return () => clearTimeout(timeout);
  }, [inputs, scenes, storyStep]);


  // --- Handlers ---
  
  const handleAnalyzeScript = async (scriptText: string) => {
    setIsProcessing(true);
    setErrorMsg(null);
    setScenes([]);
    
    try {
        // 1. Analyze script to breakdown scenes
        const storyboardData = await analyzeScriptToStoryboard(scriptText, inputs);
        
        // 2. Convert to GeneratedScene objects with Structured Shots
        const newScenes: GeneratedScene[] = storyboardData.map(p => {
            // Find IDs for suggested characters
            const matchedCharIds = inputs.characters
                .filter(c => p.suggestedCharacterNames.some(name => c.name.toLowerCase().includes(name.toLowerCase()) || name.toLowerCase().includes(c.name.toLowerCase())))
                .map(c => c.id);

            // Map raw shots to internal type
            const structuredShots: StoryboardShot[] = p.shots.map(s => ({
                id: Math.random().toString(36).substr(2, 5),
                panelNumber: s.panelNumber,
                shotType: s.shotType,
                description: s.description
            }));

            return {
                id: Math.random().toString(36).substr(2, 9),
                sceneNumber: p.sceneNumber,
                type: PageType.SCENE,
                content: p.summary,
                shots: structuredShots,
                selectedCharacterIds: matchedCharIds, 
                gridSize: inputs.gridSize, 
                isGenerating: false,
            };
        });

        setScenes(newScenes);
        setStoryStep(StoryStep.STORYBOARD);
        
        // Close menu on mobile
        setMobileMenuOpen(false);
        if (window.innerWidth < 1024) {
            setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
        }

    } catch (error: any) {
        setErrorMsg("Failed to analyze script: " + error.message);
    } finally {
        setIsProcessing(false);
    }
  };

  const handleAddManualPage = (config: { type: PageType; content: string; selectedCharIds: string[]; layout: string; gridSize: GridSize; shots: StoryboardShot[] }) => {
    // If we are in INPUT mode, switch to STORYBOARD to show the list
    if (storyStep === StoryStep.INPUT) setStoryStep(StoryStep.STORYBOARD);

    const nextNum = scenes.length > 0 ? Math.max(...scenes.map(p => p.sceneNumber)) + 1 : 1;
    
    const newScene: GeneratedScene = {
        id: Math.random().toString(36).substr(2, 9),
        sceneNumber: config.type === PageType.TITLE_CARD ? 0 : nextNum,
        type: config.type,
        content: config.content,
        shots: config.shots,
        selectedCharacterIds: config.selectedCharIds,
        gridSize: config.gridSize,
        isGenerating: false,
    };

    setScenes(prev => [...prev, newScene]);
    
    setTimeout(() => {
        resultsRef.current?.lastElementChild?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleUpdatePage = (id: string, updates: Partial<GeneratedScene>) => {
    setScenes(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
  };

  /**
   * Core Helper: Manages AbortController, Timeout, and State for API Calls
   */
  const processPageGeneration = async (pageId: string, apiCall: (signal: AbortSignal) => Promise<string>) => {
      // 1. Setup AbortController
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
          controller.abort(); 
      }, 900000); // 15 Minutes Timeout
      
      // Store controller
      abortControllersRef.current.set(pageId, controller);
      
      // Set Loading State
      handleUpdatePage(pageId, { isGenerating: true, imageError: undefined });

      try {
          const imageUrl = await apiCall(controller.signal);
          handleUpdatePage(pageId, { imageUrl, isGenerating: false });
      } catch (error: any) {
          if (error.name === 'AbortError' || controller.signal.aborted) {
             handleUpdatePage(pageId, { isGenerating: false, imageError: "Cancelled / Timeout" });
          } else {
             handleUpdatePage(pageId, { isGenerating: false, imageError: error.message || "Failed" });
          }
      } finally {
          clearTimeout(timeoutId);
          abortControllersRef.current.delete(pageId);
      }
  };

  const handleGenerateSinglePage = async (pageId: string) => {
      if (isGeneratingAll) return;
      setStoryStep(StoryStep.GENERATED);
      
      const scene = scenes.find(p => p.id === pageId);
      if (!scene) return;

      await processPageGeneration(pageId, (signal) => generatePageImage(scene, inputs, signal));
  };

  const handleEditPage = async (pageId: string, instruction: string, materials: string[]) => {
      const scene = scenes.find(p => p.id === pageId);
      if (!scene || !scene.imageUrl) return;

      await processPageGeneration(pageId, (signal) => 
          editPageImage(scene, scene.imageUrl!, materials, instruction, inputs, signal)
      );
  };

  const handleStopGeneration = (pageId: string) => {
      const controller = abortControllersRef.current.get(pageId);
      if (controller) {
          controller.abort();
          abortControllersRef.current.delete(pageId);
          handleUpdatePage(pageId, { isGenerating: false, imageError: "Stopped by user" });
      }
  };

  const handleGenerateAllImages = async () => {
    if (isGeneratingAll) return;
    setIsGeneratingAll(true);
    setStoryStep(StoryStep.GENERATED); 
    setErrorMsg(null);
    
    // Find pending pages (no image or previously errored)
    // We create a list of IDs to process
    const pendingPageIds = scenes
        .filter(p => !p.imageUrl)
        .map(p => p.id);

    // Strict Serial Queue Processing
    for (const pageId of pendingPageIds) {
       // Check if cancelled (optional global cancel could go here)
       await processPageGeneration(pageId, (signal) => {
           const currentScene = scenes.find(p => p.id === pageId);
           if (!currentScene) throw new Error("Scene removed");
           return generatePageImage(currentScene, inputs, signal);
       });
    }

    setIsGeneratingAll(false);
  };

  const handleExportProject = () => {
      const projectData = {
          version: 2,
          type: 'storyboard',
          timestamp: Date.now(),
          inputs,
          scenes,
          storyStep
      };
      
      const blob = new Blob([JSON.stringify(projectData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `storyboard_project_${new Date().toISOString().slice(0,10)}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
  };

  const handleImportProject = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
          try {
              const data = JSON.parse(event.target?.result as string);
              if (data && data.inputs && data.scenes) {
                  setInputs(data.inputs);
                  setScenes(data.scenes);
                  setStoryStep(data.storyStep || StoryStep.STORYBOARD);
                  alert("Project loaded successfully!");
              } else {
                  alert("Invalid project file.");
              }
          } catch (err) {
              alert("Error parsing project file.");
          }
      };
      reader.readAsText(file);
      e.target.value = ''; // Reset input
  };

  const handleResetProject = () => {
      if (confirm("Create new project? This will clear all current unsaved progress.")) {
          localStorage.removeItem('storyboard_autosave');
          window.location.reload();
      }
  };

  const handleDownloadZip = async () => {
    const imagesToZip = scenes.filter(p => p.imageUrl);
    if (imagesToZip.length === 0) return;

    const zip = new JSZip();
    imagesToZip.forEach(scene => {
      if (scene.imageUrl) {
        const base64Data = scene.imageUrl.split(',')[1];
        const fileName = `Scene_${scene.sceneNumber}.png`;
        zip.file(fileName, base64Data, { base64: true });
      }
    });

    try {
      const content = await zip.generateAsync({ type: "blob" });
      const url = window.URL.createObjectURL(content);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Storyboard_Set_${Date.now()}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error(error);
    }
  };

  // --- Render ---
  return (
    <div className="flex h-screen w-screen bg-black text-zinc-100 font-sans overflow-hidden selection:bg-purple-500 selection:text-white">
      
      {/* --- SIDEBAR --- */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-full md:w-96 bg-zinc-900 border-r border-zinc-800 transform transition-transform duration-300 ease-in-out flex flex-col
        ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} md:relative md:translate-x-0
      `}>
        {/* Header */}
        <div className="p-5 border-b border-zinc-800 flex items-center justify-between bg-zinc-950">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-gradient-to-tr from-blue-600 to-cyan-400 flex items-center justify-center shadow-lg shadow-blue-500/20">
               <span className="font-bold text-white text-lg">K</span>
            </div>
            <div>
               <h1 className="font-bold text-md leading-none tracking-tight">Kilo and Bruno Storyboard V2</h1>
               <p className="text-[10px] text-zinc-500 mt-1">
                   {lastSaved ? 'Auto-saved' : 'Ready'}
               </p>
            </div>
          </div>
          <button onClick={() => setMobileMenuOpen(false)} className="md:hidden text-zinc-400">✕</button>
        </div>

        {/* Form */}
        <InputForm 
             inputs={inputs}
             setInputs={setInputs}
             onAnalyzeScript={handleAnalyzeScript}
             onAddManualPage={handleAddManualPage}
             isLoading={isProcessing}
        />
      </aside>

      {/* --- MAIN CANVAS --- */}
      <main className="flex-1 flex flex-col h-full relative bg-zinc-950">
        
        {/* Toolbar */}
        <header className="h-14 flex items-center justify-between px-6 border-b border-zinc-800 bg-zinc-950 z-20">
           <div className="flex items-center gap-4">
              <button onClick={() => setMobileMenuOpen(true)} className="md:hidden p-2 text-zinc-400">☰</button>
              
              {/* Project Actions (Moved Here) */}
              <div className="flex items-center bg-zinc-900 rounded-lg p-1 border border-zinc-800">
                  <button onClick={handleResetProject} className="px-3 py-1 hover:bg-zinc-800 rounded text-xs text-zinc-400 hover:text-white transition-colors flex items-center gap-1" title="New Project">
                      <span>New</span>
                  </button>
                  <div className="w-px h-3 bg-zinc-800 mx-1"></div>
                  <button onClick={handleExportProject} className="px-3 py-1 hover:bg-zinc-800 rounded text-xs text-zinc-400 hover:text-white transition-colors flex items-center gap-1" title="Save Project">
                      <span>Save</span>
                  </button>
                  <div className="w-px h-3 bg-zinc-800 mx-1"></div>
                  <label className="px-3 py-1 hover:bg-zinc-800 rounded text-xs text-zinc-400 hover:text-white transition-colors cursor-pointer flex items-center gap-1" title="Load Project">
                      <span>Load</span>
                      <input type="file" accept=".json" onChange={handleImportProject} className="hidden" />
                  </label>
              </div>

              {scenes.length > 0 && (
                 <div className="hidden md:flex items-center gap-2 text-xs font-mono text-zinc-500 border-l border-zinc-800 pl-4">
                    <span className={`w-2 h-2 rounded-full ${isGeneratingAll ? 'bg-yellow-500 animate-pulse' : 'bg-green-500'}`}></span>
                    {scenes.length} Scenes • Step: {storyStep}
                 </div>
              )}
           </div>

           {/* Actions */}
           <div className="flex items-center gap-2">
                {storyStep === StoryStep.STORYBOARD && scenes.length > 0 && (
                    <div className="text-xs text-zinc-400 mr-2 animate-pulse hidden md:block">
                        Review Scenes below, then →
                    </div>
                )}

                {scenes.length > 0 && (
                     <button
                        onClick={handleGenerateAllImages}
                        disabled={isGeneratingAll}
                        className="px-4 py-2 bg-purple-600 hover:bg-purple-500 rounded text-xs font-bold text-white flex items-center gap-2 shadow-lg shadow-purple-900/20 transition-colors"
                      >
                        {isGeneratingAll ? <span className="animate-spin">⟳</span> : <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>}
                        <span>{storyStep === StoryStep.STORYBOARD ? 'GENERATE ALL' : 'GENERATE MISSING'}</span>
                      </button>
                )}
                 
                 {scenes.some(p => p.imageUrl) && (
                   <button onClick={handleDownloadZip} className="p-2 text-zinc-400 hover:text-white" title="Download Zip">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M12 3v13.5m0 0 3.75-3.75M12 16.5 8.25 12.75" />
                      </svg>
                   </button>
                 )}
           </div>
        </header>

        {/* Content Area */}
        <div ref={resultsRef} className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar bg-dot-pattern">
           
           {/* Empty State */}
           {scenes.length === 0 && !isProcessing && (
              <div className="h-full flex flex-col items-center justify-center text-zinc-700">
                 <div className="w-24 h-24 rounded-full bg-zinc-900 flex items-center justify-center mb-6 border border-zinc-800">
                    <span className="text-4xl">🎬</span>
                 </div>
                 <h2 className="text-xl font-bold text-zinc-500">Video Storyboard Mode</h2>
                 <p className="text-sm max-w-xs text-center mt-2 opacity-60">
                     Enter your video script in the sidebar to break it down into scenes and shots.
                 </p>
              </div>
           )}

           {isProcessing && (
              <div className="h-full flex flex-col items-center justify-center">
                 <div className="w-16 h-16 border-4 border-zinc-800 border-t-purple-600 rounded-full animate-spin mb-6"></div>
                 <h3 className="text-zinc-300 font-mono animate-pulse">Analyzing Script & Breaking down Shots...</h3>
              </div>
           )}

           {/* Cards Grid */}
           <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 pb-20">
              {scenes.map((scene) => (
                 <ComicPanel 
                    key={scene.id}
                    page={scene}
                    globalInputs={inputs}
                    storyStep={storyStep}
                    onUpdatePage={handleUpdatePage}
                    onImageClick={setSelectedImage}
                    onGenerateSingle={handleGenerateSinglePage}
                    onEditPage={handleEditPage}
                    onStop={handleStopGeneration}
                 />
              ))}
           </div>

           {errorMsg && (
              <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 bg-red-900/90 text-white px-6 py-3 rounded-full shadow-2xl border border-red-700 flex items-center gap-3 animate-fade-in-up z-50">
                 <span className="text-sm font-medium">{errorMsg}</span>
                 <button onClick={() => setErrorMsg(null)} className="ml-2 opacity-70 hover:opacity-100">✕</button>
              </div>
           )}

        </div>
      </main>

      {/* Lightbox */}
      {selectedImage && (
        <div 
          className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setSelectedImage(null)}
        >
           <img 
             src={selectedImage} 
             alt="Full" 
             className="max-w-full max-h-full object-contain rounded-lg shadow-2xl border border-zinc-800"
           />
           <button className="absolute top-6 right-6 text-white/50 hover:text-white">✕</button>
        </div>
      )}

      <style>{`
         .bg-dot-pattern {
            background-image: radial-gradient(#3f3f46 1px, transparent 1px);
            background-size: 24px 24px;
         }
         .custom-scrollbar::-webkit-scrollbar { width: 6px; }
         .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
         .custom-scrollbar::-webkit-scrollbar-thumb { background: #3f3f46; border-radius: 10px; }
         .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #52525b; }
      `}</style>
    </div>
  );
};

export default App;