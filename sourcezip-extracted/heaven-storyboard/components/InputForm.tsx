
import React, { useState } from 'react';
import { StoryboardInputs, CharacterProfile, PageType, ColorType, GridSize, StoryboardShot } from '../types';
import { LANGUAGES, STORYBOARD_STYLES, VIDEO_GENRES, ASPECT_RATIOS, GRID_SIZES, COLOR_TYPES } from '../constants';
import { analyzeCharacterReference } from '../services/geminiService';

interface InputFormProps {
  inputs: StoryboardInputs;
  setInputs: React.Dispatch<React.SetStateAction<StoryboardInputs>>;
  onAnalyzeScript: (script: string) => void;
  onAddManualPage: (config: { type: PageType; content: string; selectedCharIds: string[]; layout: string; gridSize: GridSize; shots: StoryboardShot[] }) => void;
  isLoading: boolean;
}

const Section: React.FC<{ title: string; children: React.ReactNode; defaultOpen?: boolean }> = ({ title, children, defaultOpen = false }) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);
    return (
        <div className="border-b border-zinc-800 last:border-0 bg-zinc-900/30">
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between py-3 px-4 text-left hover:bg-zinc-800/50 transition-colors"
            >
                <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">{title}</span>
                <svg className={`w-4 h-4 text-zinc-600 transform transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
            </button>
            {isOpen && <div className="px-4 pb-4 animate-fade-in">{children}</div>}
        </div>
    );
};

export const InputForm: React.FC<InputFormProps> = ({ inputs, setInputs, onAnalyzeScript, onAddManualPage, isLoading }) => {
  const [mode, setMode] = useState<'story' | 'manual'>('story');
  const [analyzingCharIds, setAnalyzingCharIds] = useState<Set<string>>(new Set());
  
  // Manual Mode State
  const [manualType, setManualType] = useState<PageType>(PageType.SCENE);
  const [manualPrompt, setManualPrompt] = useState(''); // Fallback / Summary
  const [manualLayout, setManualLayout] = useState('Standard Grid');
  const [manualGridSize, setManualGridSize] = useState<GridSize>(GridSize.GRID_2x2);
  const [manualSelectedChars, setManualSelectedChars] = useState<string[]>([]);
  
  // Script Input State
  const [rawScript, setRawScript] = useState(inputs.prompt);

  const handleChange = (field: keyof StoryboardInputs, value: any) => {
    setInputs(prev => ({ ...prev, [field]: value }));
  };

  // Character Logic
  const handleAddCharacter = () => {
    if (inputs.characters.length >= 10) return;
    const newChar: CharacterProfile = {
      id: Math.random().toString(36).substr(2, 9),
      name: `Cast ${inputs.characters.length + 1}`,
      description: '',
    };
    handleChange('characters', [...inputs.characters, newChar]);
  };

  const handleRemoveCharacter = (id: string) => {
    handleChange('characters', inputs.characters.filter(c => c.id !== id));
  };

  const handleCharacterChange = (id: string, field: keyof CharacterProfile, value: string) => {
    const updatedChars = inputs.characters.map(c => 
      c.id === id ? { ...c, [field]: value } : c
    );
    handleChange('characters', updatedChars);
  };

  const handleImageUpload = (id: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        handleCharacterChange(id, 'imageBase64', reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAnalyzeCharacter = async (charId: string, base64Image: string) => {
    if (!base64Image) return;
    setAnalyzingCharIds(prev => new Set(prev).add(charId));
    try {
      const description = await analyzeCharacterReference(base64Image, inputs.language);
      handleCharacterChange(charId, 'description', description);
    } catch (error) {
      alert("Failed to analyze image.");
    } finally {
      setAnalyzingCharIds(prev => { const n = new Set(prev); n.delete(charId); return n; });
    }
  };

  const toggleManualChar = (id: string) => {
    setManualSelectedChars(prev => 
        prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleManualAdd = () => {
      // Create empty shots based on grid size
      const count = manualGridSize === GridSize.GRID_3x3 ? 9 : 4;
      const emptyShots: StoryboardShot[] = Array.from({ length: count }, (_, i) => ({
          id: Math.random().toString(36).substr(2, 5),
          panelNumber: i + 1,
          shotType: 'Medium Shot',
          description: i === 0 ? manualPrompt : '' 
      }));

      onAddManualPage({ 
        type: manualType, 
        content: manualPrompt, 
        selectedCharIds: manualSelectedChars, 
        layout: manualLayout,
        gridSize: manualGridSize,
        shots: emptyShots
      });
  };

  const handleGlobalBackgroundUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          const reader = new FileReader();
          reader.onloadend = () => {
              handleChange('globalBackgroundImage', reader.result as string);
          };
          reader.readAsDataURL(file);
      }
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
        {/* --- SCROLLABLE INPUT AREA --- */}
        <div className="flex-1 overflow-y-auto custom-scrollbar relative">
            
            {/* MODE TABS (Sticky Top) */}
            <div className="grid grid-cols-2 p-2 gap-2 border-b border-zinc-800 sticky top-0 bg-zinc-950/95 backdrop-blur z-10">
                <button 
                    onClick={() => setMode('story')}
                    className={`py-2 text-xs font-bold rounded transition-colors ${mode === 'story' ? 'bg-purple-600 text-white' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'}`}
                >
                    AUTO SCRIPT
                </button>
                <button 
                    onClick={() => setMode('manual')}
                    className={`py-2 text-xs font-bold rounded transition-colors ${mode === 'manual' ? 'bg-blue-600 text-white' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'}`}
                >
                    MANUAL SCENE
                </button>
            </div>

            {/* --- GLOBAL CHARACTER POOL --- */}
            <Section title={`Cast / Characters (${inputs.characters.length}/10)`} defaultOpen={true}>
                <div className="space-y-3">
                    {inputs.characters.map((char) => (
                        <div key={char.id} className="bg-zinc-900 rounded border border-zinc-800 p-2">
                            <div className="flex items-center gap-3 mb-2">
                                <label className="w-12 h-12 flex-shrink-0 bg-black rounded border border-dashed border-zinc-700 cursor-pointer hover:border-purple-500 relative overflow-hidden group">
                                    {char.imageBase64 ? (
                                        <img src={char.imageBase64} className="w-full h-full object-cover" />
                                    ) : (
                                        <span className="absolute inset-0 flex items-center justify-center text-zinc-600 text-xs">+</span>
                                    )}
                                    <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(char.id, e)} />
                                </label>
                                <div className="flex-1 min-w-0">
                                    <input
                                        type="text"
                                        value={char.name}
                                        onChange={(e) => handleCharacterChange(char.id, 'name', e.target.value)}
                                        className="w-full bg-transparent border-0 border-b border-zinc-700 px-0 py-1 text-sm text-white focus:ring-0 focus:border-purple-500"
                                        placeholder="Name"
                                    />
                                </div>
                                <button onClick={() => handleRemoveCharacter(char.id)} className="text-zinc-600 hover:text-red-400">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                                </button>
                            </div>
                            <textarea
                                value={char.description}
                                onChange={(e) => handleCharacterChange(char.id, 'description', e.target.value)}
                                placeholder="Appearance..."
                                className="w-full bg-zinc-950/50 text-xs text-zinc-300 p-2 rounded border border-zinc-800 h-16 resize-none focus:border-zinc-600"
                            />
                            {char.imageBase64 && (
                                <button 
                                    onClick={() => handleAnalyzeCharacter(char.id, char.imageBase64!)}
                                    disabled={analyzingCharIds.has(char.id)}
                                    className="mt-1 text-[10px] text-purple-400 hover:text-purple-300 w-full text-right"
                                >
                                    {analyzingCharIds.has(char.id) ? 'Analyzing...' : '✨ Auto Describe'}
                                </button>
                            )}
                        </div>
                    ))}
                    {inputs.characters.length < 10 && (
                        <button 
                            onClick={handleAddCharacter}
                            className="w-full py-2 border border-dashed border-zinc-700 rounded text-xs text-zinc-500 hover:text-white hover:border-zinc-500 transition-colors"
                        >
                            + Add Character
                        </button>
                    )}
                </div>
            </Section>
            
            {/* --- GLOBAL LOCATION / BACKGROUND --- */}
            <Section title="Global Setting / Location">
                <div className="space-y-2">
                    <p className="text-[10px] text-zinc-500">Upload a main location or background style that applies to the entire storyboard (unless specific scenes override it).</p>
                    {inputs.globalBackgroundImage ? (
                        <div className="relative w-full h-32 rounded border border-zinc-700 overflow-hidden group">
                            <img src={inputs.globalBackgroundImage} className="w-full h-full object-cover" />
                            <button 
                                onClick={() => handleChange('globalBackgroundImage', undefined)}
                                className="absolute top-2 right-2 bg-black/70 text-white w-6 h-6 rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                            >
                                ✕
                            </button>
                            <div className="absolute bottom-0 left-0 right-0 bg-black/60 p-1 text-[10px] text-white text-center">Global Background Set</div>
                        </div>
                    ) : (
                        <label className="flex flex-col items-center justify-center w-full h-24 border border-dashed border-zinc-700 rounded hover:border-purple-500 hover:bg-zinc-900 transition-colors cursor-pointer">
                            <span className="text-xl text-zinc-600">+</span>
                            <span className="text-xs text-zinc-500 mt-1">Upload Main Location</span>
                            <input type="file" accept="image/*" className="hidden" onChange={handleGlobalBackgroundUpload} />
                        </label>
                    )}
                </div>
            </Section>

            {/* --- GLOBAL SETTINGS --- */}
            <Section title="Production Settings">
                <div className="space-y-3">
                    {/* Row 1: Language & Grid Size */}
                    <div className="grid grid-cols-2 gap-2">
                        <div>
                            <label className="block text-[10px] text-zinc-500 mb-1">Language</label>
                            <select value={inputs.language} onChange={(e) => handleChange('language', e.target.value)} className="w-full bg-zinc-900 border border-zinc-700 rounded text-xs p-2 text-zinc-300">
                                {LANGUAGES.map(l => <option key={l} value={l}>{l}</option>)}
                            </select>
                        </div>
                        <div>
                             <label className="block text-[10px] text-zinc-500 mb-1">Grid Layout</label>
                             <select value={inputs.gridSize} onChange={(e) => handleChange('gridSize', e.target.value)} className="w-full bg-zinc-900 border border-zinc-700 rounded text-xs p-2 text-zinc-300">
                                {GRID_SIZES.map(g => <option key={g} value={g}>{g}</option>)}
                             </select>
                        </div>
                    </div>

                    {/* Row 2: Genre & Visual Style */}
                    <div className="grid grid-cols-2 gap-2">
                        <div>
                             <label className="block text-[10px] text-zinc-500 mb-1">Genre</label>
                             <select value={inputs.genre} onChange={(e) => handleChange('genre', e.target.value)} className="w-full bg-zinc-900 border border-zinc-700 rounded text-xs p-2 text-zinc-300">
                                {VIDEO_GENRES.map(s => <option key={s} value={s}>{s}</option>)}
                             </select>
                        </div>
                         <div>
                             <label className="block text-[10px] text-zinc-500 mb-1">Visual Style</label>
                             <select value={inputs.style} onChange={(e) => handleChange('style', e.target.value)} className="w-full bg-zinc-900 border border-zinc-700 rounded text-xs p-2 text-zinc-300">
                                {STORYBOARD_STYLES.map(s => <option key={s} value={s}>{s}</option>)}
                             </select>
                         </div>
                    </div>
                    
                    {/* Row 3: Aspect Ratio & Color Mode */}
                    <div className="grid grid-cols-2 gap-2">
                        <div>
                             <label className="block text-[10px] text-zinc-500 mb-1">Aspect Ratio</label>
                             <select value={inputs.aspectRatio} onChange={(e) => handleChange('aspectRatio', e.target.value)} className="w-full bg-zinc-900 border border-zinc-700 rounded text-xs p-2 text-zinc-300">
                                {ASPECT_RATIOS.map(r => <option key={r} value={r}>{r}</option>)}
                            </select>
                        </div>
                        <div>
                             <label className="block text-[10px] text-zinc-500 mb-1">Color Mode</label>
                             <select value={inputs.colorType} onChange={(e) => handleChange('colorType', e.target.value)} className="w-full bg-zinc-900 border border-zinc-700 rounded text-xs p-2 text-zinc-300">
                                {COLOR_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                        </div>
                    </div>
                </div>
            </Section>

            {/* --- SPECIFIC INPUTS --- */}
            {mode === 'story' ? (
                /* STORY INPUTS */
                <Section title="Video Script Input" defaultOpen={true}>
                    <div className="space-y-4">
                        <textarea
                            value={rawScript}
                            onChange={(e) => {
                                setRawScript(e.target.value);
                                handleChange('prompt', e.target.value);
                            }}
                            className="w-full bg-zinc-900 border border-zinc-700 rounded-md p-2 text-sm text-zinc-200 h-64 resize-none focus:border-purple-500 focus:ring-0 font-mono leading-relaxed"
                            placeholder="Paste your video script here... (EXT. STREET - DAY...)"
                        />
                        <div className="flex items-center justify-between text-xs text-zinc-500">
                            <span>Target Scenes: {inputs.sceneCount}</span>
                            <input 
                                type="number" 
                                min="1" max="50" 
                                value={inputs.sceneCount} 
                                onChange={(e) => handleChange('sceneCount', parseInt(e.target.value))}
                                className="w-16 bg-zinc-900 border border-zinc-800 rounded px-1 text-right"
                            />
                        </div>
                    </div>
                </Section>
            ) : (
                /* MANUAL INPUTS */
                <Section title="Manual Scene Config" defaultOpen={true}>
                    <div className="space-y-4">
                        {/* Type */}
                        <div>
                            <label className="block text-[10px] text-zinc-500 mb-1">Type</label>
                            <div className="flex bg-zinc-900 p-1 rounded border border-zinc-800">
                                <button onClick={() => setManualType(PageType.SCENE)} className={`flex-1 py-1 text-xs rounded ${manualType === PageType.SCENE ? 'bg-zinc-700 text-white' : 'text-zinc-500'}`}>Scene</button>
                                <button onClick={() => setManualType(PageType.TITLE_CARD)} className={`flex-1 py-1 text-xs rounded ${manualType === PageType.TITLE_CARD ? 'bg-zinc-700 text-white' : 'text-zinc-500'}`}>Title Card</button>
                            </div>
                        </div>

                         {/* Grid Size */}
                         <div>
                             <label className="block text-[10px] text-zinc-500 mb-1">Grid Size (Shots)</label>
                             <select value={manualGridSize} onChange={(e) => setManualGridSize(e.target.value as GridSize)} className="w-full bg-zinc-900 border border-zinc-700 rounded text-xs p-2 text-zinc-300">
                                {GRID_SIZES.map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                        </div>
                        
                         {/* Characters in this Page */}
                        <div>
                            <label className="block text-[10px] text-zinc-500 mb-2">Cast in this Scene</label>
                            <div className="flex flex-wrap gap-2">
                                {inputs.characters.map(char => (
                                    <button
                                        key={char.id}
                                        onClick={() => toggleManualChar(char.id)}
                                        className={`
                                            flex items-center gap-2 px-2 py-1 rounded-full border text-xs transition-colors
                                            ${manualSelectedChars.includes(char.id) 
                                                ? 'bg-blue-600/20 border-blue-500 text-blue-200' 
                                                : 'bg-zinc-900 border-zinc-700 text-zinc-500 hover:border-zinc-500'}
                                        `}
                                    >
                                        <div className="w-4 h-4 rounded-full bg-zinc-800 overflow-hidden">
                                            {char.imageBase64 && <img src={char.imageBase64} className="w-full h-full object-cover" /> }
                                        </div>
                                        {char.name}
                                    </button>
                                ))}
                            </div>
                        </div>
                        
                         {/* Prompt */}
                        <div>
                            <label className="block text-[10px] text-zinc-500 mb-1">Scene Description</label>
                            <textarea
                                value={manualPrompt}
                                onChange={(e) => setManualPrompt(e.target.value)}
                                className="w-full bg-zinc-900 border border-zinc-700 rounded-md p-2 text-xs text-zinc-300 h-20 resize-none font-mono focus:border-blue-500 focus:ring-0"
                                placeholder="Brief overview of the scene (Shot list will be generated blank for you to fill)..."
                            />
                        </div>
                    </div>
                </Section>
            )}
            
            <div className="h-4"></div>
        </div>

        {/* --- FIXED FOOTER ACTIONS --- */}
        <div className="p-4 bg-zinc-950 border-t border-zinc-800 z-20 shadow-[0_-10px_20px_-5px_rgba(0,0,0,0.5)]">
            {mode === 'story' ? (
                <button
                    onClick={() => onAnalyzeScript(rawScript)}
                    disabled={isLoading || !rawScript.trim()}
                    className="w-full py-3 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-lg shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all hover:scale-[1.02]"
                >
                    {isLoading ? <span className="animate-spin">⟳</span> : <span>Analyze & Breakdown Scenes</span>}
                </button>
            ) : (
                <button
                    onClick={handleManualAdd}
                    className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:scale-[1.02]"
                >
                    + Add Scene (Initialize Shots)
                </button>
            )}
        </div>
    </div>
  );
};
