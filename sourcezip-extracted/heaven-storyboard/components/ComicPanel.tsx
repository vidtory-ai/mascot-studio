
import React, { useState } from 'react';
import { GeneratedScene, StoryboardInputs, StoryStep, PageType, GridSize, StoryboardShot } from '../types';
import { GRID_SIZES, CINEMATIC_SHOT_TYPES } from '../constants';

interface ComicPanelProps {
  page: GeneratedScene;
  globalInputs: StoryboardInputs;
  storyStep: StoryStep;
  onUpdatePage: (id: string, updates: Partial<GeneratedScene>) => void;
  onImageClick: (imageUrl: string) => void;
  onGenerateSingle: (pageId: string) => void;
  onEditPage: (pageId: string, instruction: string, materials: string[]) => void;
  onStop: (pageId: string) => void;
}

export const ComicPanel: React.FC<ComicPanelProps> = ({ 
    page, globalInputs, storyStep, onUpdatePage, onImageClick, onGenerateSingle, onEditPage, onStop 
}) => {
  const [activeTab, setActiveTab] = useState<'view' | 'edit'>('view');
  
  // Edit Mode Inputs
  const [editInstruction, setEditInstruction] = useState('');
  const [materialImages, setMaterialImages] = useState<string[]>([]);

  const toggleCharSelection = (charId: string) => {
    const currentIds = page.selectedCharacterIds || [];
    const newIds = currentIds.includes(charId) 
        ? currentIds.filter(id => id !== charId)
        : [...currentIds, charId];
    onUpdatePage(page.id, { selectedCharacterIds: newIds });
  };

  const updateShot = (shotId: string, field: keyof StoryboardShot, value: any) => {
      if (!page.shots) return;
      const updatedShots = page.shots.map(s => 
          s.id === shotId ? { ...s, [field]: value } : s
      );
      onUpdatePage(page.id, { shots: updatedShots });
  };

  const handleEditRender = () => {
    if (!page.imageUrl || !editInstruction) return;
    setActiveTab('view');
    onEditPage(page.id, editInstruction, materialImages);
    setEditInstruction('');
    setMaterialImages([]);
  };

  const handleMaterialUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
        const reader = new FileReader();
        reader.onloadend = () => {
            setMaterialImages(prev => [...prev, reader.result as string]);
        };
        reader.readAsDataURL(e.target.files[0]);
    }
  };

  const handlePageMaterialUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
          const reader = new FileReader();
          reader.onloadend = () => {
              const currentMaterials = page.sceneMaterialImages || [];
              onUpdatePage(page.id, { sceneMaterialImages: [...currentMaterials, reader.result as string] });
          };
          reader.readAsDataURL(e.target.files[0]);
      }
  };

  const removePageMaterial = (idx: number) => {
      const currentMaterials = page.sceneMaterialImages || [];
      onUpdatePage(page.id, { sceneMaterialImages: currentMaterials.filter((_, i) => i !== idx) });
  };

  const handleDownload = () => {
    if (!page.imageUrl) return;
    const link = document.createElement('a');
    link.href = page.imageUrl;
    const fileName = `Scene_${page.sceneNumber}_Storyboard.png`;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Determine Title
  let displayTitle = page.type === PageType.TITLE_CARD ? "TITLE CARD" : `SCENE ${page.sceneNumber}`;

  return (
    <div className="bg-zinc-900 rounded-xl border border-zinc-800 shadow-xl overflow-hidden flex flex-col h-fit transition-all hover:border-zinc-600 group">
      
      {/* HEADER */}
      <div className="px-4 py-3 border-b border-zinc-800 flex items-center justify-between bg-zinc-950/50">
         <span className={`text-xs font-bold uppercase tracking-wider ${page.type === PageType.TITLE_CARD ? 'text-yellow-500' : 'text-zinc-400'}`}>{displayTitle}</span>
         <div className="flex gap-2 items-center">
            {!page.imageUrl && !page.isGenerating && (
                <button 
                    onClick={() => onGenerateSingle(page.id)}
                    className="text-xs px-2 py-1 bg-green-600 hover:bg-green-500 text-white rounded flex items-center gap-1"
                >
                    <span>Generate Scene</span>
                </button>
            )}
            {page.imageUrl && !page.isGenerating && (
                <>
                <button 
                    onClick={handleDownload}
                    className="text-zinc-400 hover:text-white p-1 mr-1"
                    title="Download Image"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M12 3v13.5m0 0 3.75-3.75M12 16.5 8.25 12.75" />
                    </svg>
                </button>
                <button 
                    onClick={() => {
                        if(confirm('Regenerate this scene? Current image will be lost.')) {
                            onGenerateSingle(page.id);
                        }
                    }}
                    className="text-xs px-2 py-1 text-zinc-400 hover:text-white bg-zinc-800 rounded mr-1"
                >
                    Regenerate
                </button>
                <button 
                    onClick={() => setActiveTab(activeTab === 'view' ? 'edit' : 'view')}
                    className={`text-xs px-2 py-1 rounded ${activeTab === 'edit' ? 'bg-purple-600 text-white' : 'text-zinc-400 hover:text-white bg-zinc-800'}`}
                >
                    {activeTab === 'edit' ? 'Close Edit' : 'Edit'}
                </button>
                </>
            )}
            {page.isGenerating && (
                <span className="text-xs px-2 py-1 text-purple-400 animate-pulse">Running...</span>
            )}
         </div>
      </div>

      {/* --- EDIT MODE UI --- */}
      {activeTab === 'edit' ? (
          <div className="p-4 bg-zinc-950 space-y-4 animate-fade-in">
              <div className="text-xs text-zinc-500 font-bold uppercase">Update Scene Details</div>
              
              <div>
                  <label className="block text-[10px] text-zinc-500 mb-1">Instruction</label>
                  <textarea 
                      value={editInstruction}
                      onChange={(e) => setEditInstruction(e.target.value)}
                      placeholder="e.g. Change the camera angle in shot 3 to a close-up..."
                      className="w-full bg-zinc-900 border border-zinc-700 rounded p-2 text-xs text-zinc-300 h-20 resize-none"
                  />
              </div>

              <div>
                  <label className="block text-[10px] text-zinc-500 mb-1">Visual References</label>
                  <div className="flex flex-wrap gap-2 mb-2">
                      {materialImages.map((img, idx) => (
                          <div key={idx} className="w-12 h-12 rounded overflow-hidden border border-zinc-700 relative group">
                              <img src={img} className="w-full h-full object-cover" />
                              <button 
                                onClick={() => setMaterialImages(prev => prev.filter((_, i) => i !== idx))}
                                className="absolute inset-0 bg-black/50 text-white opacity-0 group-hover:opacity-100 flex items-center justify-center text-xs"
                              >✕</button>
                          </div>
                      ))}
                      <label className="w-12 h-12 border border-dashed border-zinc-700 rounded flex items-center justify-center cursor-pointer hover:border-purple-500 text-zinc-600 hover:text-purple-500">
                          +
                          <input type="file" accept="image/*" className="hidden" onChange={handleMaterialUpload} />
                      </label>
                  </div>
              </div>

              <button 
                onClick={handleEditRender}
                disabled={page.isGenerating || !editInstruction}
                className="w-full py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded disabled:opacity-50"
              >
                  {page.isGenerating ? 'Wait...' : 'Apply Changes'}
              </button>
          </div>
      ) : (
        /* --- VIEW MODE --- */
        <>
        {/* IMAGE AREA */}
        <div className="relative w-full aspect-video bg-black group-image border-b border-zinc-800">
            {page.imageUrl ? (
                <img 
                src={page.imageUrl} 
                className={`w-full h-full object-contain cursor-zoom-in ${page.isGenerating ? 'opacity-50 blur-sm' : ''}`}
                onClick={() => onImageClick(page.imageUrl!)}
                />
            ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-zinc-700 p-6 text-center">
                    {page.isGenerating ? (
                        <div className="flex flex-col items-center">
                            <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mb-3"></div>
                            <span className="text-xs text-purple-400 animate-pulse">Generating Storyboard Sheet...</span>
                        </div>
                    ) : (
                        <div className="opacity-40">
                            <p className="text-xs font-mono mb-2">Waiting for Scene Generation</p>
                            <p className="text-[10px]">{page.gridSize || 'Default'} Grid Layout</p>
                        </div>
                    )}
                </div>
            )}
            
            {page.isGenerating && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 z-10">
                    {!page.imageUrl && <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mb-3"></div>}
                    <button 
                        onClick={() => onStop(page.id)}
                        className="mt-4 px-3 py-1 bg-red-600/90 hover:bg-red-500 text-white text-[10px] font-bold rounded shadow-lg uppercase tracking-wider flex items-center gap-1 backdrop-blur-sm"
                    >
                        <span>■ Stop</span>
                    </button>
                </div>
            )}

             {page.imageError && (
                <div className="absolute inset-0 bg-black/80 flex items-center justify-center text-red-400 text-xs px-4 text-center">
                    {page.imageError}
                    <button onClick={() => onGenerateSingle(page.id)} className="mt-2 text-white bg-red-800 px-2 py-1 rounded text-[10px] uppercase">Retry</button>
                </div>
             )}
        </div>

        {/* STORYBOARD CONTROLS */}
        <div className="p-3 bg-zinc-900">
            {/* Grid & Settings Row */}
            <div className="flex justify-between items-center mb-3">
                 <div className="flex items-center gap-2">
                     <span className="text-[10px] font-bold text-zinc-500 uppercase">Grid Layout:</span>
                     <select 
                        value={page.gridSize} 
                        onChange={(e) => onUpdatePage(page.id, { gridSize: e.target.value as GridSize })}
                        className="bg-zinc-950 border border-zinc-800 rounded text-[10px] text-zinc-300 p-1 focus:border-purple-500"
                     >
                         {GRID_SIZES.map(g => <option key={g} value={g}>{g}</option>)}
                     </select>
                 </div>
                 <div className="flex items-center gap-1 text-[10px] text-zinc-600">
                     <span>{page.selectedCharacterIds.length} Cast</span>
                 </div>
            </div>

            {/* Character Selection */}
            <div className="mb-3">
                <div className="flex flex-wrap gap-1.5">
                    {globalInputs.characters.map(char => {
                        const isSelected = page.selectedCharacterIds.includes(char.id);
                        return (
                            <button
                                key={char.id}
                                onClick={() => toggleCharSelection(char.id)}
                                title={char.name}
                                className={`
                                    w-8 h-8 rounded-full border transition-all relative overflow-hidden
                                    ${isSelected ? 'border-purple-500 ring-1 ring-purple-500 opacity-100' : 'border-zinc-700 opacity-40 hover:opacity-80'}
                                `}
                            >
                                {char.imageBase64 ? (
                                    <img src={char.imageBase64} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full bg-zinc-800 flex items-center justify-center text-[8px]">{char.name[0]}</div>
                                )}
                            </button>
                        )
                    })}
                </div>
            </div>

            {/* Page Materials */}
            <div className="mb-3">
                 <div className="flex justify-between items-center mb-1">
                     <span className="text-[10px] font-bold text-zinc-500 uppercase">Scene Refs (Locations/Props)</span>
                 </div>
                 <div className="flex flex-wrap gap-1.5">
                    {page.sceneMaterialImages?.map((img, idx) => (
                        <div key={idx} className="w-8 h-8 rounded border border-zinc-600 relative overflow-hidden group">
                            <img src={img} className="w-full h-full object-cover" />
                            <button 
                                onClick={() => removePageMaterial(idx)} 
                                className="absolute inset-0 bg-black/60 hidden group-hover:flex items-center justify-center text-[10px] text-white"
                            >✕</button>
                        </div>
                    ))}
                    <label className="w-8 h-8 border border-dashed border-zinc-700 rounded flex items-center justify-center cursor-pointer hover:border-blue-500 text-zinc-600 hover:text-blue-500">
                        +
                        <input type="file" accept="image/*" className="hidden" onChange={handlePageMaterialUpload} />
                    </label>
                 </div>
            </div>

            {/* SHOT EDITOR (Granular Control) */}
            <div>
                 <span className="text-[10px] font-bold text-zinc-500 uppercase block mb-2">Director's Shot List</span>
                 {page.shots && page.shots.length > 0 ? (
                     <div className="space-y-2">
                        {page.shots.map((shot) => (
                            <div key={shot.id} className="flex gap-2 bg-zinc-950 p-2 rounded border border-zinc-800">
                                <div className="w-6 flex-shrink-0 flex items-center justify-center text-[10px] text-zinc-600 font-bold border-r border-zinc-800 pr-1">
                                    #{shot.panelNumber}
                                </div>
                                <div className="flex-1 space-y-1">
                                    <select 
                                        value={shot.shotType}
                                        onChange={(e) => updateShot(shot.id, 'shotType', e.target.value)}
                                        className="w-full bg-zinc-900 border border-zinc-800 rounded text-[10px] text-purple-400 p-1 font-bold mb-1"
                                    >
                                        {CINEMATIC_SHOT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                                        <option value={shot.shotType}>Custom: {shot.shotType}</option>
                                    </select>
                                    <textarea
                                        value={shot.description}
                                        onChange={(e) => updateShot(shot.id, 'description', e.target.value)}
                                        className="w-full bg-transparent border-0 p-0 text-[11px] text-zinc-300 resize-none focus:ring-0 leading-tight"
                                        rows={2}
                                    />
                                </div>
                            </div>
                        ))}
                     </div>
                 ) : (
                     /* Fallback for legacy pages without structured shots */
                     <textarea 
                        value={page.content}
                        onChange={(e) => onUpdatePage(page.id, { content: e.target.value })}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-xs text-zinc-300 font-mono h-24 resize-none focus:border-zinc-600"
                        placeholder="Legacy content..."
                     />
                 )}
            </div>
        </div>
        </>
      )}
    </div>
  );
};
