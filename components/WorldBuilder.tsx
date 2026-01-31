import React, { useState } from 'react';
import { Asset, AssetType, WorldStyles } from '../types';
import { GeminiService } from '../services/api';
import { Globe, Image as ImageIcon, Sparkles, Save, Loader2, Sliders, RefreshCw } from 'lucide-react';

interface WorldBuilderProps {
  onSave: (asset: Asset) => void;
  notify: (msg: string, type: 'success' | 'error' | 'info') => void;
}

export const WorldBuilder: React.FC<WorldBuilderProps> = ({ onSave, notify }) => {
  const [prompt, setPrompt] = useState('');
  const [negativePrompt, setNegativePrompt] = useState('');
  const [selectedStyle, setSelectedStyle] = useState(WorldStyles[0]);
  const [customStyle, setCustomStyle] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [seed, setSeed] = useState<number | ''>('');
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleGenerate = async () => {
    if (!prompt) return;
    setIsGenerating(true);
    setGeneratedImage(null);

    // If seed is empty, generate one for the user so they can reference it later (mock behavior)
    // In a real app, the API returns the used seed.
    const activeSeed = seed === '' ? Math.floor(Math.random() * 1000000) : seed;
    
    // Determine final style
    const finalStyle = selectedStyle === 'Custom' ? customStyle : selectedStyle;

    try {
      const imageBase64 = await GeminiService.generateImage({
          prompt,
          negativePrompt,
          style: finalStyle,
          seed: Number(activeSeed)
      });
      setGeneratedImage(imageBase64);
      notify("World generation complete", "success");
    } catch (error) {
      notify("Failed to generate image. Check API Settings.", "error");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveToLibrary = () => {
    if (!generatedImage) return;
    
    const finalStyle = selectedStyle === 'Custom' ? customStyle : selectedStyle;

    const newAsset: Asset = {
      id: Date.now().toString(),
      name: prompt.slice(0, 20) + (prompt.length > 20 ? '...' : ''),
      type: AssetType.LOCATION,
      thumbnailUrl: generatedImage,
      description: `Style: ${finalStyle}\nPrompt: ${prompt}\nNeg: ${negativePrompt}`,
      createdAt: new Date().toLocaleDateString(),
    };
    
    onSave(newAsset);
    setPrompt('');
    setNegativePrompt('');
    setGeneratedImage(null);
  };

  return (
    <div className="flex-1 bg-nexus-900 p-8 h-full overflow-y-auto">
       <div className="max-w-6xl mx-auto h-full flex flex-col">
          <header className="mb-8">
             <h2 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
               <Globe className="text-nexus-accent" /> World Builder
             </h2>
             <p className="text-nexus-400">Generate consistent environments and locations using AI.</p>
          </header>

          <div className="flex gap-8 flex-1 min-h-0">
             {/* Left: Controls */}
             <div className="w-1/3 bg-nexus-800 p-6 rounded-xl border border-nexus-700 flex flex-col gap-6 h-fit overflow-y-auto max-h-full">
                
                <div>
                   <label className="block text-sm font-medium text-nexus-300 mb-2">Visual Style</label>
                   <select 
                     value={selectedStyle}
                     onChange={(e) => setSelectedStyle(e.target.value)}
                     className="w-full bg-nexus-900 border border-nexus-600 rounded-lg p-3 text-white focus:border-nexus-accent outline-none"
                   >
                      {WorldStyles.map(style => (
                        <option key={style} value={style}>{style}</option>
                      ))}
                      <option value="Custom">✨ Custom Style...</option>
                   </select>
                   
                   {selectedStyle === 'Custom' && (
                       <input 
                          type="text"
                          value={customStyle}
                          onChange={(e) => setCustomStyle(e.target.value)}
                          placeholder="Enter custom visual style (e.g. 1920s Noir, Pixel Art...)"
                          className="mt-2 w-full bg-nexus-900 border border-nexus-600 rounded-lg p-3 text-white focus:border-nexus-accent outline-none animate-in fade-in slide-in-from-top-1"
                       />
                   )}
                </div>

                <div>
                   <label className="block text-sm font-medium text-nexus-300 mb-2">Environment Description</label>
                   <textarea 
                     value={prompt}
                     onChange={(e) => setPrompt(e.target.value)}
                     placeholder="Describe the location (e.g., A floating market in a cyberpunk city, neon lights reflecting on wet pavement...)"
                     className="w-full h-32 bg-nexus-900 border border-nexus-600 rounded-lg p-3 text-white focus:border-nexus-accent outline-none resize-none"
                   />
                </div>

                {/* Advanced Controls Toggle */}
                <div className="border-t border-nexus-700 pt-4">
                    <button 
                        onClick={() => setShowAdvanced(!showAdvanced)}
                        className="flex items-center gap-2 text-xs font-bold text-nexus-500 hover:text-nexus-300 uppercase tracking-wider mb-3"
                    >
                        <Sliders size={14} /> Advanced Configuration
                    </button>
                    
                    {showAdvanced && (
                        <div className="space-y-4 animate-slide-down">
                            <div>
                                <label className="block text-xs font-medium text-nexus-400 mb-1">Negative Prompt (What to avoid)</label>
                                <input 
                                    type="text"
                                    value={negativePrompt}
                                    onChange={(e) => setNegativePrompt(e.target.value)}
                                    placeholder="blurry, low quality, people, text..."
                                    className="w-full bg-nexus-900 border border-nexus-600 rounded-lg p-2 text-sm text-white focus:border-red-500/50 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-nexus-400 mb-1">Seed (For consistency)</label>
                                <div className="flex gap-2">
                                    <input 
                                        type="number"
                                        value={seed}
                                        onChange={(e) => setSeed(parseInt(e.target.value))}
                                        placeholder="Random"
                                        className="w-full bg-nexus-900 border border-nexus-600 rounded-lg p-2 text-sm text-white focus:border-nexus-accent outline-none"
                                    />
                                    <button 
                                        onClick={() => setSeed(Math.floor(Math.random() * 999999))}
                                        className="p-2 bg-nexus-700 hover:bg-nexus-600 rounded-lg text-nexus-300"
                                        title="Randomize Seed"
                                    >
                                        <RefreshCw size={16} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <button 
                   onClick={handleGenerate}
                   disabled={isGenerating || !prompt}
                   className="w-full py-4 bg-gradient-to-r from-nexus-accent to-purple-600 hover:from-nexus-accentHover hover:to-purple-700 text-white font-bold rounded-xl shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 transition-all"
                >
                   {isGenerating ? <Loader2 className="animate-spin" /> : <Sparkles size={20} />}
                   {isGenerating ? 'Dreaming World...' : 'Generate Location'}
                </button>
             </div>

             {/* Right: Preview */}
             <div className="flex-1 bg-black/40 rounded-xl border border-nexus-700 overflow-hidden relative flex flex-col">
                <div className="flex-1 flex items-center justify-center p-4 bg-dots-pattern relative">
                   {generatedImage ? (
                      <img src={generatedImage} alt="Generated World" className="max-w-full max-h-full rounded-lg shadow-2xl" />
                   ) : (
                      <div className="text-center text-nexus-600">
                         {isGenerating ? (
                            <div className="flex flex-col items-center">
                               <Loader2 size={48} className="animate-spin text-nexus-accent mb-4" />
                               <p>Rendering pixels...</p>
                            </div>
                         ) : (
                            <div className="flex flex-col items-center">
                               <ImageIcon size={64} className="opacity-20 mb-4" />
                               <p>Enter a prompt to visualize your world</p>
                            </div>
                         )}
                      </div>
                   )}
                   {/* Tech Overlay */}
                   {generatedImage && (
                       <div className="absolute top-4 left-4 bg-black/70 backdrop-blur text-white text-[10px] p-2 rounded border border-white/10 font-mono">
                           <p>STYLE: {selectedStyle === 'Custom' ? customStyle.toUpperCase() : selectedStyle.toUpperCase()}</p>
                           <p>SEED: {seed || 'RANDOM'}</p>
                       </div>
                   )}
                </div>

                {generatedImage && (
                   <div className="p-4 bg-nexus-800 border-t border-nexus-700 flex justify-end">
                      <button 
                        onClick={handleSaveToLibrary}
                        className="px-6 py-2 bg-white text-nexus-900 font-bold rounded-lg hover:bg-gray-200 flex items-center gap-2"
                      >
                         <Save size={18} /> Save to Library
                      </button>
                   </div>
                )}
             </div>
          </div>
       </div>
    </div>
  );
};