import React, { useState, useRef } from 'react';
import { AssetType, Asset } from '../types';
import { Wand2, Save, Upload, Sparkles, ScanFace, User } from 'lucide-react';
import { GeminiService } from '../services/api';

export const CharacterCreator: React.FC<{ onSave: (asset: Asset) => void; notify: (msg: string, type: 'success' | 'error') => void }> = ({ onSave, notify }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [traits, setTraits] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleGenerateBio = async () => {
    if (!name) return;
    setIsProcessing(true);
    const prompt = `Create a detailed character concept for a character named "${name}". Include visual details (scars, hairstyle) and default outfit.`;
    const result = await GeminiService.generateDescription(prompt);
    setDescription(result);
    setIsProcessing(false);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = reader.result as string;
        setUploadedImage(base64);

        setIsProcessing(true);
        try {
          const result = await GeminiService.analyzeCharacterImage(base64);
          if (result.name && !name) setName(result.name);
          if (result.description) setDescription(result.description);
          if (result.traits) setTraits(result.traits);
          notify("Character traits analyzed successfully", "success");
        } catch (err) {
          console.error("Analysis failed", err);
          notify("Could not analyze image. Check API Settings.", "error");
        } finally {
          setIsProcessing(false);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    if (!name) {
      notify("Character Name is required", "error");
      return;
    }
    const newAsset: Asset = {
      id: Date.now().toString(),
      name: name || 'Untitled Character',
      type: AssetType.CHARACTER,
      thumbnailUrl: uploadedImage || `https://picsum.photos/seed/${name || 'random'}/300/300`,
      description,
      metadata: { traits },
      createdAt: new Date().toLocaleDateString(),
    };
    onSave(newAsset);
  };

  return (
    <div className="flex-1 bg-slate-950 p-8 h-full overflow-y-auto">
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <header className="mb-8 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-white mb-1">Character Creator</h2>
            <p className="text-slate-400 text-sm">Define your IP's core characters with consistent traits, outfits, and FaceID.</p>
          </div>
          <button
            onClick={handleSave}
            className="px-6 py-2.5 bg-primary hover:bg-primary-hover text-white font-semibold rounded-lg shadow-md flex items-center gap-2 transition-all glow-primary"
          >
            <Save size={18} /> Save Character
          </button>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

          {/* Left: Image Upload - White Card */}
          <div className="lg:col-span-4">
            <div className="bg-white rounded-xl p-5 shadow-lg">
              <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-200">
                <div className="w-6 h-6 bg-primary rounded-lg flex items-center justify-center text-white text-xs font-bold">1</div>
                <h3 className="font-bold text-slate-800">Character Visual ID</h3>
              </div>

              <div
                onClick={() => fileInputRef.current?.click()}
                className={`aspect-[3/4] rounded-xl border-2 border-dashed ${uploadedImage ? 'border-primary' : 'border-slate-300'} flex flex-col items-center justify-center cursor-pointer hover:bg-slate-50 transition-all relative overflow-hidden group`}
              >
                {uploadedImage ? (
                  <>
                    <img src={uploadedImage} alt="Character" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <span className="text-white font-medium flex items-center gap-2"><Upload size={16} /> Change Image</span>
                    </div>
                  </>
                ) : (
                  <div className="text-center p-4">
                    <div className="w-14 h-14 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
                      <Upload size={24} />
                    </div>
                    <p className="text-sm text-slate-600 font-medium">Upload Reference</p>
                    <p className="text-xs text-slate-400 mt-2">AI will analyze traits automatically</p>
                  </div>
                )}
              </div>
              <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />

              {isProcessing && (
                <div className="mt-4 flex items-center gap-2 text-xs text-primary animate-pulse justify-center">
                  <Sparkles size={14} /> AI is analyzing traits...
                </div>
              )}
            </div>
          </div>

          {/* Right: Forms - White Cards */}
          <div className="lg:col-span-8 space-y-6">

            {/* Name */}
            <div className="bg-white rounded-xl p-5 shadow-lg">
              <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-200">
                <div className="w-6 h-6 bg-primary rounded-lg flex items-center justify-center text-white text-xs font-bold">2</div>
                <label className="font-bold text-slate-800">Character Name</label>
              </div>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg p-3 text-slate-800 focus:ring-2 focus:ring-primary/20 focus:border-primary focus:outline-none transition-all placeholder-slate-400"
                placeholder="e.g. Kael the Shadowblade"
              />
            </div>

            {/* Visual Traits */}
            <div className="bg-white rounded-xl p-5 shadow-lg">
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-200">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-primary rounded-lg flex items-center justify-center text-white text-xs font-bold">3</div>
                  <label className="font-bold text-slate-800">Consistent Visual Traits</label>
                </div>
                <span className="text-xs text-slate-400">Auto-filled by AI</span>
              </div>
              <textarea
                value={traits}
                onChange={(e) => setTraits(e.target.value)}
                rows={3}
                className="w-full bg-white border border-slate-300 rounded-lg p-3 text-slate-800 focus:ring-2 focus:ring-primary/20 focus:border-primary focus:outline-none text-sm font-mono placeholder-slate-400"
                placeholder="Detected traits will appear here (e.g. Scar over left eye, cyberpunk jacket...)..."
              />
            </div>

            {/* Bio */}
            <div className="bg-white rounded-xl p-5 shadow-lg">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-200">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-primary rounded-lg flex items-center justify-center text-white text-xs font-bold">4</div>
                  <label className="font-bold text-slate-800">Core Concept & Bio</label>
                </div>
                <button
                  onClick={handleGenerateBio}
                  disabled={isProcessing || !name}
                  className="text-xs flex items-center gap-1 px-3 py-1.5 bg-slate-100 border border-slate-200 rounded-lg text-slate-600 hover:border-primary hover:text-primary disabled:opacity-50 transition-colors"
                >
                  <Wand2 size={12} /> {isProcessing ? 'Generating...' : 'Enhance with AI'}
                </button>
              </div>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={6}
                className="w-full bg-white border border-slate-300 rounded-lg p-3 text-slate-800 focus:ring-2 focus:ring-primary/20 focus:border-primary focus:outline-none text-sm leading-relaxed placeholder-slate-400"
                placeholder="Describe personality, backstory, and role..."
              />
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};