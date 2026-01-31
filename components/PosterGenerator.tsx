import React, { useState, useEffect } from 'react';
import { Asset, AssetType } from '../types';
import { GeminiService } from '../services/api';
import { Image as ImageIcon, Sparkles, Save, Loader2, Type, LayoutTemplate, ChevronDown } from 'lucide-react';

interface PosterGeneratorProps {
  assets: Asset[];
  onSave: (asset: Asset) => void;
}

const POSTER_TEMPLATES = [
    { id: 'MOVIE_VERTICAL', label: 'Movie Poster (Vertical)', ratio: 'aspect-[2/3]' },
    { id: 'SOCIAL_LANDSCAPE', label: 'Social Media Cover (Landscape)', ratio: 'aspect-video' },
    { id: 'STORY_VERTICAL', label: 'Social Story (9:16)', ratio: 'aspect-[9/16]' },
    { id: 'SQUARE', label: 'Instagram Square', ratio: 'aspect-square' },
];

const POSTER_STYLES = [
    'Epic Cinematic', 'Minimalist', 'Retro Synthwave', 'Horror/Thriller', 'Animated/Cartoon', 'Corporate'
];

export const PosterGenerator: React.FC<PosterGeneratorProps> = ({ assets, onSave }) => {
  const characters = assets.filter(a => a.type === AssetType.CHARACTER);
  const locations = assets.filter(a => a.type === AssetType.LOCATION);

  const [title, setTitle] = useState('THE LAST CYBERPUNK');
  const [subtitle, setSubtitle] = useState('Coming this Summer');
  const [description, setDescription] = useState('');
  
  // Selection State
  const [selectedCharId, setSelectedCharId] = useState('');
  const [selectedLocId, setSelectedLocId] = useState('');
  const [selectedCharImage, setSelectedCharImage] = useState('');
  const [selectedLocImage, setSelectedLocImage] = useState('');

  const [selectedTemplate, setSelectedTemplate] = useState(POSTER_TEMPLATES[0]);
  const [selectedStyle, setSelectedStyle] = useState(POSTER_STYLES[0]);
  const [customStyle, setCustomStyle] = useState('');
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);

  const selectedCharAsset = characters.find(c => c.id === selectedCharId);
  const selectedLocAsset = locations.find(l => l.id === selectedLocId);

  // Update specific image default when ID changes
  useEffect(() => {
    if (selectedCharAsset) setSelectedCharImage(selectedCharAsset.thumbnailUrl);
    else setSelectedCharImage('');
  }, [selectedCharId, selectedCharAsset]);

  useEffect(() => {
    if (selectedLocAsset) setSelectedLocImage(selectedLocAsset.thumbnailUrl);
    else setSelectedLocImage('');
  }, [selectedLocId, selectedLocAsset]);


  const handleGenerate = async () => {
    setIsGenerating(true);
    setGeneratedImage(null);

    const charName = selectedCharAsset?.name || "a hero";
    const locName = selectedLocAsset?.name || "an epic background";
    const finalStyle = selectedStyle === 'Custom' ? customStyle : selectedStyle;

    // We pass the prompt, but in a real implementation we might also pass 
    // `selectedCharImage` and `selectedLocImage` as image inputs (initImages) to the AI
    const prompt = `A professional movie poster key art. 
    Subject: ${charName} standing in a dynamic pose.
    Background: ${locName}.
    ${description ? `Scene Description: ${description}.` : ''}
    Style: ${finalStyle}. 
    Composition: Leave empty negative space at the ${selectedTemplate.id === 'MOVIE_VERTICAL' ? 'bottom' : 'center'} for title text.
    Lighting: Dramatic, high contrast, 8k resolution.`;

    try {
        const imageBase64 = await GeminiService.generateImage({ prompt });
        setGeneratedImage(imageBase64);
    } catch (error) {
        console.error(error);
        alert("Generation failed");
    } finally {
        setIsGenerating(false);
    }
  };

  const handleSaveToLibrary = () => {
      if (!generatedImage) return;
      const finalStyle = selectedStyle === 'Custom' ? customStyle : selectedStyle;
      onSave({
          id: Date.now().toString(),
          name: `Poster - ${title}`,
          type: AssetType.IMAGE,
          thumbnailUrl: generatedImage,
          createdAt: new Date().toLocaleDateString(),
          description: `Template: ${selectedTemplate.label}. Title: ${title}. Desc: ${description}. Style: ${finalStyle}`
      });
      alert("Poster saved to Library");
  };

  return (
    <div className="flex-1 bg-nexus-900 p-6 h-full overflow-hidden flex flex-col">
       <header className="mb-6 flex-shrink-0">
            <h2 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
               <ImageIcon className="text-nexus-accent" /> Dynamic Poster Generator
            </h2>
            <p className="text-nexus-400">Create marketing assets, banners, and movie posters with AI-generated key art and dynamic text layouts.</p>
       </header>

       <div className="flex gap-8 flex-1 min-h-0">
          {/* Left: Controls */}
          <div className="w-80 bg-nexus-800 p-6 rounded-xl border border-nexus-700 flex flex-col gap-6 overflow-y-auto custom-scrollbar">
             
             {/* Text Inputs */}
             <div className="space-y-4">
                 <h3 className="text-xs font-bold text-nexus-500 uppercase tracking-wider flex items-center gap-2">
                     <Type size={14} /> Content & Typography
                 </h3>
                 <div>
                     <label className="block text-xs text-nexus-400 mb-1">Main Title</label>
                     <input type="text" value={title} onChange={e => setTitle(e.target.value)} className="w-full bg-nexus-900 border border-nexus-600 rounded p-2 text-white font-bold" />
                 </div>
                 <div>
                     <label className="block text-xs text-nexus-400 mb-1">Subtitle / Tagline</label>
                     <input type="text" value={subtitle} onChange={e => setSubtitle(e.target.value)} className="w-full bg-nexus-900 border border-nexus-600 rounded p-2 text-white" />
                 </div>
             </div>

             <div className="h-px bg-nexus-700 my-2"></div>

             {/* Asset Selection with Variation Support */}
             <div className="space-y-4">
                 <h3 className="text-xs font-bold text-nexus-500 uppercase tracking-wider">Composition Assets</h3>
                 
                 {/* Character */}
                 <div>
                     <label className="block text-xs text-nexus-400 mb-1">Main Character</label>
                     <select 
                        className="w-full bg-nexus-900 border border-nexus-600 rounded p-2 text-white text-sm mb-2"
                        value={selectedCharId}
                        onChange={(e) => setSelectedCharId(e.target.value)}
                     >
                        <option value="">(Optional) Auto-generate</option>
                        {characters.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                     </select>
                     
                     {/* Char Variations */}
                     {selectedCharAsset && (
                        <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
                            <img 
                                src={selectedCharAsset.thumbnailUrl} 
                                className={`w-10 h-10 rounded object-cover cursor-pointer border-2 ${selectedCharImage === selectedCharAsset.thumbnailUrl ? 'border-nexus-accent' : 'border-transparent opacity-50 hover:opacity-100'}`}
                                onClick={() => setSelectedCharImage(selectedCharAsset.thumbnailUrl)}
                                title="Master"
                            />
                            {(selectedCharAsset.gallery || []).map((img, i) => (
                                <img 
                                    key={i}
                                    src={img} 
                                    className={`w-10 h-10 rounded object-cover cursor-pointer border-2 ${selectedCharImage === img ? 'border-nexus-accent' : 'border-transparent opacity-50 hover:opacity-100'}`}
                                    onClick={() => setSelectedCharImage(img)}
                                    title={`Var ${i+1}`}
                                />
                            ))}
                        </div>
                     )}
                 </div>

                 {/* Location */}
                 <div>
                     <label className="block text-xs text-nexus-400 mb-1">Background Location</label>
                     <select 
                        className="w-full bg-nexus-900 border border-nexus-600 rounded p-2 text-white text-sm mb-2"
                        value={selectedLocId}
                        onChange={(e) => setSelectedLocId(e.target.value)}
                     >
                        <option value="">(Optional) Auto-generate</option>
                        {locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                     </select>

                      {/* Loc Variations */}
                      {selectedLocAsset && (
                        <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
                            <img 
                                src={selectedLocAsset.thumbnailUrl} 
                                className={`w-10 h-10 rounded object-cover cursor-pointer border-2 ${selectedLocImage === selectedLocAsset.thumbnailUrl ? 'border-nexus-accent' : 'border-transparent opacity-50 hover:opacity-100'}`}
                                onClick={() => setSelectedLocImage(selectedLocAsset.thumbnailUrl)}
                                title="Master"
                            />
                            {(selectedLocAsset.gallery || []).map((img, i) => (
                                <img 
                                    key={i}
                                    src={img} 
                                    className={`w-10 h-10 rounded object-cover cursor-pointer border-2 ${selectedLocImage === img ? 'border-nexus-accent' : 'border-transparent opacity-50 hover:opacity-100'}`}
                                    onClick={() => setSelectedLocImage(img)}
                                    title={`Var ${i+1}`}
                                />
                            ))}
                        </div>
                     )}
                 </div>
             </div>

             <div className="h-px bg-nexus-700 my-2"></div>

             {/* Template & Style */}
             <div className="space-y-4">
                <h3 className="text-xs font-bold text-nexus-500 uppercase tracking-wider flex items-center gap-2">
                     <LayoutTemplate size={14} /> Layout & Style
                 </h3>
                <div>
                   <label className="block text-xs text-nexus-400 mb-1">Template</label>
                   <select 
                     className="w-full bg-nexus-900 border border-nexus-600 rounded p-2 text-white text-sm"
                     value={selectedTemplate.id}
                     onChange={(e) => setSelectedTemplate(POSTER_TEMPLATES.find(t => t.id === e.target.value) || POSTER_TEMPLATES[0])}
                   >
                       {POSTER_TEMPLATES.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
                   </select>
                </div>
                <div>
                   <label className="block text-xs text-nexus-400 mb-1">Art Style</label>
                   <select 
                     className="w-full bg-nexus-900 border border-nexus-600 rounded p-2 text-white text-sm"
                     value={selectedStyle}
                     onChange={(e) => setSelectedStyle(e.target.value)}
                   >
                       {POSTER_STYLES.map(s => <option key={s} value={s}>{s}</option>)}
                       <option value="Custom">✨ Custom Style...</option>
                   </select>
                   
                   {selectedStyle === 'Custom' && (
                       <input 
                           type="text"
                           value={customStyle}
                           onChange={(e) => setCustomStyle(e.target.value)}
                           placeholder="Enter custom poster style..."
                           className="mt-2 w-full bg-nexus-900 border border-nexus-600 rounded p-2 text-white text-sm focus:border-nexus-accent outline-none animate-in fade-in"
                       />
                   )}
                </div>
                <div>
                     <label className="block text-xs text-nexus-400 mb-1">Visual Description</label>
                     <textarea 
                        value={description} 
                        onChange={e => setDescription(e.target.value)} 
                        className="w-full bg-nexus-900 border border-nexus-600 rounded p-2 text-white text-sm h-20 focus:border-nexus-accent outline-none resize-none"
                        placeholder="Additional details..."
                     />
                 </div>
             </div>

             <button 
                 onClick={handleGenerate}
                 disabled={isGenerating}
                 className="mt-auto py-3 bg-gradient-to-r from-nexus-accent to-purple-600 text-white font-bold rounded-lg shadow-lg flex items-center justify-center gap-2 hover:brightness-110 transition-all"
             >
                 {isGenerating ? <Loader2 className="animate-spin" /> : <Sparkles size={18} />}
                 Generate Poster
             </button>
          </div>

          {/* Right: Preview Area */}
          <div className="flex-1 bg-black/40 rounded-xl border border-nexus-700 overflow-hidden flex items-center justify-center relative p-8 bg-dots-pattern">
              
              {/* This container simulates the canvas/poster area */}
              <div className={`relative shadow-2xl transition-all duration-500 bg-nexus-950 flex-shrink-0 ${selectedTemplate.ratio}`} style={{ height: '90%' }}>
                  {generatedImage ? (
                      <img src={generatedImage} alt="Poster Art" className="w-full h-full object-cover" />
                  ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-nexus-600 border-2 border-dashed border-nexus-800">
                          <ImageIcon size={64} className="opacity-20 mb-4" />
                          <p>Art Preview</p>
                          {(selectedCharImage || selectedLocImage) && (
                              <div className="mt-4 flex gap-2">
                                  {selectedCharImage && <img src={selectedCharImage} className="w-12 h-12 rounded border border-nexus-600 object-cover" title="Active Char Ref" />}
                                  {selectedLocImage && <img src={selectedLocImage} className="w-12 h-12 rounded border border-nexus-600 object-cover" title="Active Loc Ref" />}
                              </div>
                          )}
                      </div>
                  )}

                  {/* Dynamic Text Overlay */}
                  <div className={`absolute inset-0 flex flex-col p-8 pointer-events-none 
                      ${selectedTemplate.id === 'MOVIE_VERTICAL' ? 'justify-end items-center text-center pb-16' : ''}
                      ${selectedTemplate.id === 'SOCIAL_LANDSCAPE' ? 'justify-center items-start pl-16 bg-gradient-to-r from-black/60 to-transparent' : ''}
                      ${selectedTemplate.id === 'STORY_VERTICAL' ? 'justify-center items-center text-center' : ''}
                      ${selectedTemplate.id === 'SQUARE' ? 'justify-end items-start p-6 bg-gradient-to-t from-black/80 to-transparent' : ''}
                  `}>
                      <h1 className={`font-black uppercase tracking-tighter leading-none drop-shadow-lg 
                          ${selectedTemplate.id === 'MOVIE_VERTICAL' ? 'text-6xl text-nexus-accent' : 'text-5xl text-white'}
                      `}>
                          {title}
                      </h1>
                      <h2 className="text-xl font-medium tracking-widest text-white/90 uppercase mt-2 drop-shadow-md">
                          {subtitle}
                      </h2>
                      
                      {selectedTemplate.id === 'MOVIE_VERTICAL' && (
                          <div className="absolute bottom-4 text-[8px] text-white/50 w-full text-center px-8">
                              PRODUCED BY NEXUS STUDIO • DIRECTED BY AI • STARRING {selectedCharAsset?.name || 'GENERIC HERO'} • MUSIC BY SYNTHWAVE ORCHESTRA
                          </div>
                      )}
                  </div>
              </div>

              {generatedImage && (
                   <div className="absolute top-4 right-4 flex gap-2">
                      <button 
                        onClick={handleSaveToLibrary}
                        className="px-4 py-2 bg-nexus-800 border border-nexus-600 text-white font-bold rounded-lg hover:bg-nexus-700 flex items-center gap-2 shadow-lg"
                      >
                         <Save size={18} /> Save
                      </button>
                   </div>
              )}
          </div>
       </div>
    </div>
  );
};