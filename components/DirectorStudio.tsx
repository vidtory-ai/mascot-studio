import React, { useState, useEffect } from 'react';
import { Asset, AssetType, SceneRender } from '../types';
import { Camera, ChevronDown, Layers, Maximize, Image as ImageIcon } from 'lucide-react';

interface DirectorStudioProps {
  assets: Asset[];
  onSceneGenerated?: (render: SceneRender) => void;
}

export const DirectorStudio: React.FC<DirectorStudioProps> = ({ assets, onSceneGenerated }) => {
  const characters = assets.filter(a => a.type === AssetType.CHARACTER);
  const locations = assets.filter(a => a.type === AssetType.LOCATION);

  // ID selection
  const [selectedCharId, setSelectedCharId] = useState<string>('');
  const [selectedLocId, setSelectedLocId] = useState<string>('');

  // Specific Image URL selection (Master or Variation)
  const [selectedCharImage, setSelectedCharImage] = useState<string>('');
  const [selectedLocImage, setSelectedLocImage] = useState<string>('');

  const [actionPrompt, setActionPrompt] = useState('');
  const [isRendering, setIsRendering] = useState(false);
  const [resultImage, setResultImage] = useState<string | null>(null);

  const selectedCharAsset = characters.find(c => c.id === selectedCharId);
  const selectedLocAsset = locations.find(l => l.id === selectedLocId);

  // Auto-select master image when asset ID changes
  useEffect(() => {
    if (selectedCharAsset) setSelectedCharImage(selectedCharAsset.thumbnailUrl);
    else setSelectedCharImage('');
  }, [selectedCharId, selectedCharAsset]);

  useEffect(() => {
    if (selectedLocAsset) setSelectedLocImage(selectedLocAsset.thumbnailUrl);
    else setSelectedLocImage('');
  }, [selectedLocId, selectedLocAsset]);

  const handleRender = () => {
    setIsRendering(true);
    // Simulate generation delay using the specific selected images as context
    setTimeout(() => {
        const fakeUrl = `https://picsum.photos/seed/${selectedCharId}-${selectedLocId}-${Date.now()}/800/450`;
        setResultImage(fakeUrl);
        setIsRendering(false);

        // Add to global history
        if (onSceneGenerated) {
            onSceneGenerated({
                id: Date.now().toString(),
                imageUrl: fakeUrl,
                timestamp: new Date().toLocaleTimeString(),
                prompt: actionPrompt || 'Composed Scene',
                sourceCharId: selectedCharId,
                sourceLocId: selectedLocId
            });
        }
    }, 2500);
  };

  return (
    <div className="flex h-full bg-nexus-900 text-white">
      {/* Left Control Panel */}
      <div className="w-96 border-r border-nexus-700 bg-nexus-800 p-6 flex flex-col gap-6 overflow-y-auto">
        <h2 className="text-xl font-bold flex items-center gap-2">
            <Camera className="text-nexus-accent" /> Scene Studio
        </h2>

        {/* Character Selector */}
        <div className="space-y-3">
            <label className="text-xs font-semibold uppercase tracking-wider text-nexus-500">Actor</label>
            <div className="relative">
                <select 
                    className="w-full appearance-none bg-nexus-900 border border-nexus-600 rounded-lg p-3 text-sm focus:border-nexus-accent outline-none"
                    value={selectedCharId}
                    onChange={(e) => setSelectedCharId(e.target.value)}
                >
                    <option value="">Select Character...</option>
                    {characters.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                <ChevronDown className="absolute right-3 top-3 text-nexus-500 pointer-events-none" size={16} />
            </div>
            
            {/* Variation/Pose Selector */}
            {selectedCharAsset && (
              <div className="bg-nexus-900 rounded-lg p-3 border border-nexus-700">
                  <p className="text-[10px] text-nexus-400 mb-2 font-bold uppercase">Select Pose / Variation</p>
                  <div className="grid grid-cols-4 gap-2">
                      {/* Master */}
                      <div 
                        onClick={() => setSelectedCharImage(selectedCharAsset.thumbnailUrl)}
                        className={`aspect-square rounded overflow-hidden cursor-pointer border-2 relative ${selectedCharImage === selectedCharAsset.thumbnailUrl ? 'border-nexus-accent' : 'border-transparent opacity-60 hover:opacity-100'}`}
                      >
                         <img src={selectedCharAsset.thumbnailUrl} className="w-full h-full object-cover" />
                         <span className="absolute bottom-0 left-0 right-0 bg-black/60 text-[8px] text-center text-white">Master</span>
                      </div>
                      
                      {/* Variations */}
                      {(selectedCharAsset.gallery || []).map((img, idx) => (
                          <div 
                            key={idx}
                            onClick={() => setSelectedCharImage(img)}
                            className={`aspect-square rounded overflow-hidden cursor-pointer border-2 relative ${selectedCharImage === img ? 'border-nexus-accent' : 'border-transparent opacity-60 hover:opacity-100'}`}
                          >
                             <img src={img} className="w-full h-full object-cover" />
                             <span className="absolute bottom-0 left-0 right-0 bg-black/60 text-[8px] text-center text-white">Var {idx + 1}</span>
                          </div>
                      ))}
                  </div>
              </div>
            )}
        </div>

        <div className="h-px bg-nexus-700/50"></div>

        {/* Location Selector */}
        <div className="space-y-3">
            <label className="text-xs font-semibold uppercase tracking-wider text-nexus-500">Location</label>
            <div className="relative">
                <select 
                    className="w-full appearance-none bg-nexus-900 border border-nexus-600 rounded-lg p-3 text-sm focus:border-nexus-accent outline-none"
                    value={selectedLocId}
                    onChange={(e) => setSelectedLocId(e.target.value)}
                >
                    <option value="">Select Location...</option>
                    {locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                </select>
                <ChevronDown className="absolute right-3 top-3 text-nexus-500 pointer-events-none" size={16} />
            </div>

            {/* Variation/Angle Selector */}
            {selectedLocAsset && (
              <div className="bg-nexus-900 rounded-lg p-3 border border-nexus-700">
                  <p className="text-[10px] text-nexus-400 mb-2 font-bold uppercase">Select Angle / Time</p>
                  <div className="grid grid-cols-4 gap-2">
                      {/* Master */}
                      <div 
                        onClick={() => setSelectedLocImage(selectedLocAsset.thumbnailUrl)}
                        className={`aspect-square rounded overflow-hidden cursor-pointer border-2 relative ${selectedLocImage === selectedLocAsset.thumbnailUrl ? 'border-nexus-accent' : 'border-transparent opacity-60 hover:opacity-100'}`}
                      >
                         <img src={selectedLocAsset.thumbnailUrl} className="w-full h-full object-cover" />
                         <span className="absolute bottom-0 left-0 right-0 bg-black/60 text-[8px] text-center text-white">Master</span>
                      </div>
                      
                      {/* Variations */}
                      {(selectedLocAsset.gallery || []).map((img, idx) => (
                          <div 
                            key={idx}
                            onClick={() => setSelectedLocImage(img)}
                            className={`aspect-square rounded overflow-hidden cursor-pointer border-2 relative ${selectedLocImage === img ? 'border-nexus-accent' : 'border-transparent opacity-60 hover:opacity-100'}`}
                          >
                             <img src={img} className="w-full h-full object-cover" />
                             <span className="absolute bottom-0 left-0 right-0 bg-black/60 text-[8px] text-center text-white">Var {idx + 1}</span>
                          </div>
                      ))}
                  </div>
              </div>
            )}
        </div>

        {/* Action Prompt */}
        <div className="space-y-2 mt-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-nexus-500">Composition Prompt</label>
            <textarea 
                className="w-full bg-nexus-900 border border-nexus-600 rounded-lg p-3 text-sm focus:border-nexus-accent outline-none h-24 resize-none"
                placeholder="e.g. Character jumping over the obstacle, rim lighting..."
                value={actionPrompt}
                onChange={(e) => setActionPrompt(e.target.value)}
            />
        </div>

        <button 
            disabled={isRendering || !selectedCharImage || !selectedLocImage}
            onClick={handleRender}
            className="mt-auto w-full py-4 bg-gradient-to-r from-nexus-accent to-purple-600 hover:from-nexus-accentHover hover:to-purple-700 text-white font-bold rounded-xl shadow-lg shadow-purple-900/20 disabled:opacity-50 transition-all"
        >
            {isRendering ? 'Composing Scene...' : 'Render Scene'}
        </button>
      </div>

      {/* Main Viewport */}
      <div className="flex-1 p-8 flex flex-col items-center justify-center bg-dots-pattern relative">
        <div className="absolute top-4 right-4 flex gap-2">
             <button className="p-2 bg-nexus-800 rounded border border-nexus-700 hover:text-white text-nexus-400">
                 <Layers size={20} />
             </button>
             <button className="p-2 bg-nexus-800 rounded border border-nexus-700 hover:text-white text-nexus-400">
                 <Maximize size={20} />
             </button>
        </div>

        {/* Live Composition Preview (Mockup of layers) */}
        {!resultImage && (selectedCharImage || selectedLocImage) && (
            <div className="absolute top-8 left-8 p-4 bg-nexus-900/90 border border-nexus-700 rounded-lg shadow-xl backdrop-blur max-w-xs">
                <h4 className="text-xs font-bold text-nexus-300 uppercase mb-3 flex items-center gap-2">
                    <Layers size={12} /> Active Composition Layers
                </h4>
                <div className="space-y-2">
                    {selectedCharImage && (
                        <div className="flex items-center gap-2 p-2 bg-nexus-800 rounded border border-nexus-700">
                            <img src={selectedCharImage} className="w-8 h-8 rounded object-cover" />
                            <div className="flex-1 min-w-0">
                                <p className="text-xs font-bold text-white truncate">Actor Layer</p>
                                <p className="text-[10px] text-nexus-400">Source: {selectedCharAsset?.name}</p>
                            </div>
                        </div>
                    )}
                    {selectedLocImage && (
                        <div className="flex items-center gap-2 p-2 bg-nexus-800 rounded border border-nexus-700">
                            <img src={selectedLocImage} className="w-8 h-8 rounded object-cover" />
                            <div className="flex-1 min-w-0">
                                <p className="text-xs font-bold text-white truncate">Bg Layer</p>
                                <p className="text-[10px] text-nexus-400">Source: {selectedLocAsset?.name}</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        )}

        {resultImage ? (
            <div className="w-full max-w-4xl aspect-video bg-black rounded-lg shadow-2xl overflow-hidden border border-nexus-700 relative group">
                <img src={resultImage} alt="Rendered Scene" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                     <button className="px-6 py-2 bg-white text-black font-bold rounded-lg hover:bg-gray-200">Upscale 4K</button>
                     <button className="px-6 py-2 bg-nexus-accent text-white font-bold rounded-lg hover:bg-nexus-accentHover">Save to Library</button>
                </div>
            </div>
        ) : (
            <div className="w-full max-w-4xl aspect-video bg-nexus-800/30 border-2 border-dashed border-nexus-700 rounded-lg flex flex-col items-center justify-center text-nexus-500">
                <Camera size={48} className="mb-4 opacity-50" />
                <p>Select specific character poses and location angles to compose scene</p>
            </div>
        )}
      </div>
    </div>
  );
};