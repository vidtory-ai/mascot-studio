
import React, { useState, useRef } from 'react';
import { ImageUpload } from './ImageUpload';
import * as vidtoryServices from '../services/vidtoryServices';

interface LandscapeViewPanelProps {}

const fileToDataUrl = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
        let result = reader.result as string;
        // Fix for generic octet-stream MIME types if needed
        if (result.startsWith('data:application/octet-stream')) {
            if (file.type) {
                result = result.replace('application/octet-stream', file.type);
            } else if (file.name.match(/\.(jpg|jpeg)$/i)) {
                result = result.replace('application/octet-stream', 'image/jpeg');
            } else if (file.name.match(/\.png$/i)) {
                result = result.replace('application/octet-stream', 'image/png');
            }
        }
        resolve(result);
    };
    reader.onerror = error => reject(error);
  });

export const LandscapeViewPanel: React.FC<LandscapeViewPanelProps> = () => {
  const [startFile, setStartFile] = useState<File | null>(null);
  const [endFile, setEndFile] = useState<File | null>(null);
  const [prompt, setPrompt] = useState("Camera slowly pans right, creating a smooth transition.");
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const abortController = useRef<AbortController | null>(null);

  const handleGenerate = async () => {
     if (!startFile || !endFile) {
         setError("Please upload both start and end images.");
         return;
     }

     setIsGenerating(true);
     setError(null);
     setVideoUrl(null);
     
     abortController.current = new AbortController();

     try {
         const startUrl = await fileToDataUrl(startFile);
         const endUrl = await fileToDataUrl(endFile);
         
         const url = await vidtoryServices.generateTransitionVideo(
             startUrl,
             endUrl,
             prompt,
             abortController.current.signal
         );
         
         // Add timestamp to bust cache
         setVideoUrl(`${url}?t=${Date.now()}`);

     } catch (e: any) {
         if (e.name !== 'AbortError') {
             console.error(e);
             setError(e.message || "Failed to generate transition.");
         }
     } finally {
         setIsGenerating(false);
         abortController.current = null;
     }
  };

  const handleCancel = () => {
      if (abortController.current) {
          abortController.current.abort();
      }
      setIsGenerating(false);
  };

  return (
    <div className="bg-white p-6 rounded-2xl border-4 border-blue-400 shadow-lg w-full max-w-7xl mx-auto text-gray-800 space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-blue-800"><i className="fas fa-image mr-3"></i>Landscape View</h2>
        <p className="text-gray-600 mt-2">Create artistic video transitions between two images.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
         {/* Inputs */}
         <div className="space-y-6 bg-blue-50 p-6 rounded-lg border border-blue-200">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <ImageUpload 
                    id="landscape-start"
                    label="1. Start Image"
                    file={startFile}
                    onFileChange={setStartFile}
                />
                <ImageUpload 
                    id="landscape-end"
                    label="2. End Image"
                    file={endFile}
                    onFileChange={setEndFile}
                />
            </div>

            <div>
                <label className="block text-sm font-bold text-blue-800 mb-2">3. Transition Prompt</label>
                <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Describe the camera movement (e.g., 'Pan right', 'Zoom in')..."
                    className="w-full p-3 rounded border border-blue-300 focus:ring-2 focus:ring-blue-500 min-h-[100px]"
                />
            </div>

            <div className="flex gap-4">
                <button
                    onClick={handleGenerate}
                    disabled={isGenerating || !startFile || !endFile} 
                    className="flex-1 bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-4 rounded-xl shadow-md flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                     {isGenerating ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-video"></i>}
                     Generate Transition
                </button>
                
                {isGenerating && (
                    <button
                        onClick={handleCancel}
                        className="bg-red-500 hover:bg-red-600 text-white font-bold py-3 px-4 rounded-xl shadow-md transition-all"
                    >
                        Cancel
                    </button>
                )}
            </div>
            
            {error && (
                <div className="bg-red-100 p-3 rounded border border-red-400 text-red-700 text-sm">
                    {error}
                </div>
            )}
         </div>

         {/* Output */}
         <div className="bg-gray-900 rounded-lg flex items-center justify-center border-4 border-gray-800 min-h-[300px] overflow-hidden relative">
            {videoUrl ? (
                <video 
                    src={videoUrl} 
                    controls 
                    autoPlay 
                    loop 
                    className="w-full h-full object-contain"
                />
            ) : (
                <div className="text-center text-gray-500">
                    {isGenerating ? (
                         <div className="animate-pulse text-blue-400">
                            <i className="fas fa-film text-6xl mb-4"></i>
                            <p>Rendering Transition...</p>
                         </div>
                    ) : (
                        <>
                            <i className="fas fa-mountain text-6xl mb-4 opacity-30"></i>
                            <p>Result will appear here</p>
                        </>
                    )}
                </div>
            )}
         </div>
      </div>
    </div>
  );
};
