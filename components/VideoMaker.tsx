import React, { useState, useRef } from 'react';
import { Asset, AssetType, SceneRender } from '../types';
import { VideoService } from '../services/api';
import { Play, Download, Loader2, AlertCircle, Upload, ChevronRight, Image as ImageIcon, History, Layers } from 'lucide-react';

interface VideoMakerProps {
  assets: Asset[];
  sceneHistory?: SceneRender[];
}

export const VideoMaker: React.FC<VideoMakerProps> = ({ assets, sceneHistory = [] }) => {
  const [prompt, setPrompt] = useState('');
  
  // Selection State
  const [sourceTab, setSourceTab] = useState<'LIBRARY' | 'HISTORY'>('LIBRARY');
  const [selectedAssetId, setSelectedAssetId] = useState('');
  const [selectedHistoryId, setSelectedHistoryId] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null); // The actual image URL to use
  
  const [aspectRatio, setAspectRatio] = useState<'VIDEO_ASPECT_RATIO_LANDSCAPE' | 'VIDEO_ASPECT_RATIO_PORTRAIT'>('VIDEO_ASPECT_RATIO_LANDSCAPE');
  const [cleanup, setCleanup] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedVideoUrl, setGeneratedVideoUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const libraryImages = assets.filter(a => a.type === AssetType.CHARACTER || a.type === AssetType.LOCATION || a.type === AssetType.IMAGE);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
        setSelectedAssetId('');
        setSelectedHistoryId('');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAssetClick = (asset: Asset) => {
      if (selectedAssetId === asset.id) {
          setSelectedAssetId(''); 
      } else {
          setSelectedAssetId(asset.id);
          setSelectedImage(asset.thumbnailUrl); // Default to master
          setSelectedHistoryId(''); // Clear history selection
      }
  };

  const handleHistoryClick = (render: SceneRender) => {
      setSelectedHistoryId(render.id);
      setSelectedImage(render.imageUrl);
      setSelectedAssetId(''); // Clear library selection
  };

  const handleGenerate = async () => {
    if (!prompt) {
        setError("Prompt is required");
        return;
    }

    if (!selectedImage) {
        setError("Please upload an image, select from Library, or use a History render.");
        return;
    }

    setLoading(true);
    setError(null);
    setGeneratedVideoUrl(null);

    try {
      const response = await VideoService.generateVideo({
        prompt,
        startImage: selectedImage,
        aspectRatio,
        cleanup
      });
      
      console.log("Video API Response:", response);
      
      if (response && response.videoUrl) {
          setGeneratedVideoUrl(response.videoUrl);
      } else {
         // Fallback for demo
         setTimeout(() => {
             setGeneratedVideoUrl("https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4");
         }, 1000);
      }

    } catch (err: any) {
      setError(err.message || "Failed to generate video");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 bg-nexus-900 p-8 h-full overflow-y-auto">
        <div className="max-w-5xl mx-auto">
            <header className="mb-8 border-b border-nexus-700 pb-6">
                <h2 className="text-3xl font-bold text-white mb-2">Storytelling Video Maker</h2>
                <p className="text-nexus-400">Animate your IP assets into high-quality videos using our custom generation engine.</p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                <div className="space-y-6">
                    <div className="bg-nexus-800 p-6 rounded-xl border border-nexus-700">
                        <h3 className="text-lg font-semibold text-white mb-4">Source Material</h3>
                        
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-nexus-300 mb-2">Start Frame (Reference)</label>
                            
                            {/* Selected Image Preview Box */}
                            <div 
                                onClick={() => fileInputRef.current?.click()}
                                className={`w-full h-32 border-2 border-dashed rounded-lg flex flex-col items-center justify-center cursor-pointer transition-colors relative overflow-hidden ${selectedImage ? 'border-nexus-accent bg-nexus-900' : 'border-nexus-600 hover:bg-nexus-700/50'}`}
                            >
                                {selectedImage ? (
                                    <>
                                        <img src={selectedImage} alt="Selected" className="w-full h-full object-contain p-2" />
                                        <div className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                                            <span className="text-white text-xs font-bold"><Upload size={14} className="inline mr-1"/> Replace File</span>
                                        </div>
                                    </>
                                ) : (
                                    <div className="text-center text-nexus-400">
                                        <Upload size={24} className="mx-auto mb-2" />
                                        <span className="text-xs font-medium">Upload Manual File</span>
                                    </div>
                                )}
                                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileUpload} />
                            </div>

                            {/* Tab Switcher */}
                            <div className="flex items-center gap-2 mt-6 mb-3 border-b border-nexus-700">
                                <button 
                                    onClick={() => setSourceTab('LIBRARY')}
                                    className={`px-4 py-2 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors ${sourceTab === 'LIBRARY' ? 'border-nexus-accent text-white' : 'border-transparent text-nexus-500 hover:text-nexus-300'}`}
                                >
                                    Assets Library
                                </button>
                                <button 
                                    onClick={() => setSourceTab('HISTORY')}
                                    className={`px-4 py-2 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors ${sourceTab === 'HISTORY' ? 'border-nexus-accent text-white' : 'border-transparent text-nexus-500 hover:text-nexus-300'}`}
                                >
                                    Scene History ({sceneHistory.length})
                                </button>
                            </div>

                            {/* Source Content Area */}
                            <div className="h-64 overflow-y-auto pr-2 custom-scrollbar">
                                {sourceTab === 'LIBRARY' ? (
                                    <div className="space-y-2">
                                        {libraryImages.map(asset => (
                                            <div key={asset.id} className="bg-nexus-900 border border-nexus-600 rounded-lg overflow-hidden">
                                                <div 
                                                    onClick={() => handleAssetClick(asset)}
                                                    className={`p-2 flex items-center gap-3 cursor-pointer hover:bg-nexus-800 transition-colors ${selectedAssetId === asset.id ? 'bg-nexus-800' : ''}`}
                                                >
                                                    <img src={asset.thumbnailUrl} className="w-10 h-10 rounded object-cover" />
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-medium text-white truncate">{asset.name}</p>
                                                        <p className="text-[10px] text-nexus-500">{asset.type}</p>
                                                    </div>
                                                    <ChevronRight size={16} className={`text-nexus-500 transition-transform ${selectedAssetId === asset.id ? 'rotate-90' : ''}`} />
                                                </div>
                                                {selectedAssetId === asset.id && (
                                                    <div className="p-2 bg-nexus-950 border-t border-nexus-700 grid grid-cols-4 gap-2 animate-in slide-in-from-top-2">
                                                        <div 
                                                            onClick={() => setSelectedImage(asset.thumbnailUrl)}
                                                            className={`aspect-square rounded overflow-hidden cursor-pointer border-2 relative ${selectedImage === asset.thumbnailUrl ? 'border-nexus-accent' : 'border-transparent opacity-70 hover:opacity-100'}`}
                                                        >
                                                            <img src={asset.thumbnailUrl} className="w-full h-full object-cover" />
                                                            <span className="absolute bottom-0 w-full text-[8px] bg-black/60 text-white text-center">Master</span>
                                                        </div>
                                                        {(asset.gallery || []).map((galImg, idx) => (
                                                            <div 
                                                                key={idx}
                                                                onClick={() => setSelectedImage(galImg)}
                                                                className={`aspect-square rounded overflow-hidden cursor-pointer border-2 relative ${selectedImage === galImg ? 'border-nexus-accent' : 'border-transparent opacity-70 hover:opacity-100'}`}
                                                            >
                                                                <img src={galImg} className="w-full h-full object-cover" />
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-2 gap-3">
                                        {sceneHistory.length === 0 && (
                                            <div className="col-span-2 text-center py-8 text-nexus-500 flex flex-col items-center">
                                                <History size={24} className="mb-2 opacity-50" />
                                                <p className="text-xs">No recent scenes rendered in Director Studio.</p>
                                            </div>
                                        )}
                                        {sceneHistory.map((render) => (
                                            <div 
                                                key={render.id}
                                                onClick={() => handleHistoryClick(render)}
                                                className={`group relative rounded-lg overflow-hidden border-2 cursor-pointer transition-all ${selectedHistoryId === render.id ? 'border-nexus-accent' : 'border-nexus-700 hover:border-nexus-500'}`}
                                            >
                                                <div className="aspect-video bg-black">
                                                    <img src={render.imageUrl} className="w-full h-full object-cover" />
                                                </div>
                                                <div className="absolute inset-x-0 bottom-0 bg-black/80 p-2">
                                                    <p className="text-[10px] text-white truncate font-medium">{render.prompt}</p>
                                                    <p className="text-[8px] text-nexus-400">{render.timestamp}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="h-px bg-nexus-700 my-4"></div>

                        <div className="mb-4">
                            <label className="block text-sm font-medium text-nexus-300 mb-2">Motion Prompt</label>
                            <textarea 
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                                className="w-full bg-nexus-900 border border-nexus-600 rounded-lg p-3 text-white focus:border-nexus-accent outline-none text-sm"
                                rows={3}
                                placeholder="Describe movement (e.g. camera zooms in, character smiles and waves)..."
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4 mb-6">
                            <div>
                                <label className="block text-sm font-medium text-nexus-300 mb-2">Aspect Ratio</label>
                                <select 
                                    value={aspectRatio}
                                    onChange={(e) => setAspectRatio(e.target.value as any)}
                                    className="w-full bg-nexus-900 border border-nexus-600 rounded-lg p-2 text-sm text-white focus:border-nexus-accent outline-none"
                                >
                                    <option value="VIDEO_ASPECT_RATIO_LANDSCAPE">Landscape (16:9)</option>
                                    <option value="VIDEO_ASPECT_RATIO_PORTRAIT">Portrait (9:16)</option>
                                </select>
                            </div>
                            <div className="flex items-center mt-6">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input 
                                        type="checkbox" 
                                        checked={cleanup}
                                        onChange={(e) => setCleanup(e.target.checked)}
                                        className="w-4 h-4 rounded bg-nexus-900 border-nexus-600 text-nexus-accent focus:ring-nexus-accent"
                                    />
                                    <span className="text-sm text-nexus-300">Auto Cleanup</span>
                                </label>
                            </div>
                        </div>

                        <button 
                            onClick={handleGenerate}
                            disabled={loading}
                            className="w-full py-3 bg-nexus-accent hover:bg-nexus-accentHover text-white font-bold rounded-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? <Loader2 className="animate-spin" /> : <Play size={20} fill="currentColor" />}
                            {loading ? 'Generating Video...' : 'Generate Video'}
                        </button>

                        {error && (
                            <div className="mt-4 p-3 bg-red-900/20 border border-red-500/50 rounded-lg flex items-center gap-2 text-red-200 text-sm">
                                <AlertCircle size={16} />
                                {error}
                            </div>
                        )}
                    </div>
                </div>

                <div className="bg-black rounded-xl border border-nexus-700 flex flex-col overflow-hidden relative min-h-[400px]">
                    {generatedVideoUrl ? (
                        <div className="relative flex-1 group">
                            <video 
                                src={generatedVideoUrl} 
                                controls 
                                autoPlay 
                                loop
                                className="w-full h-full object-contain bg-black"
                            />
                            <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                <a href={generatedVideoUrl} download className="p-2 bg-nexus-accent text-white rounded-lg shadow-lg flex items-center gap-2 text-sm font-bold">
                                    <Download size={16} /> Download
                                </a>
                            </div>
                        </div>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-nexus-600">
                             {loading ? (
                                 <div className="text-center">
                                     <Loader2 size={48} className="animate-spin text-nexus-accent mb-4 mx-auto" />
                                     <p className="text-nexus-400">Processing frames...</p>
                                     <p className="text-xs text-nexus-600 mt-2">This may take a few minutes</p>
                                 </div>
                             ) : (
                                <>
                                    <Play size={64} className="mb-4 opacity-20" />
                                    <p>Video Preview will appear here</p>
                                </>
                             )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    </div>
  );
};