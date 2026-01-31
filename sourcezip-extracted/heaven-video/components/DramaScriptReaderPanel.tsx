
import React, { useState } from 'react';
import JSZip from 'jszip';
import saveAs from 'file-saver';
import { ScriptReaderState } from '../types';
import * as dramaScriptService from '../services/dramaScriptService';

interface ScriptDisplayCardProps {
  title: string;
  script: string | null;
}

const ScriptDisplayCard: React.FC<ScriptDisplayCardProps> = ({ title, script }) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        if (!script) return;
        navigator.clipboard.writeText(script);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="bg-slate-800 p-4 border border-slate-700 flex flex-col h-full rounded-lg">
            <div className="flex justify-between items-center mb-2">
                <h3 className="font-bold text-cyan-400">{title}</h3>
                <button
                    onClick={handleCopy}
                    disabled={!script}
                    className="bg-slate-600 hover:bg-slate-500 text-white px-3 py-1 text-xs font-semibold flex items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed rounded-md"
                >
                    {copied ? <><i className="fas fa-check"></i>Copied!</> : <><i className="fas fa-copy"></i>Copy</>}
                </button>
            </div>
            <pre className="bg-slate-900/50 p-3 whitespace-pre-wrap font-mono text-sm text-gray-300 flex-grow overflow-y-auto rounded-md max-h-[500px]">
                {script || "No script generated."}
            </pre>
        </div>
    );
};

const AVAILABLE_CHARACTERS = [
  "Rumi", "Mira", "Zoey", 
  "Jinu", "Abby", "Mystery", "Baby", "Romance",
  "Celine", "Gwi-Ma", "Derpy & Sussie", "Bobby"
];

interface DramaScriptReaderPanelProps {
  appState: ScriptReaderState;
  setAppState: React.Dispatch<React.SetStateAction<ScriptReaderState>>;
}

export const DramaScriptReaderPanel: React.FC<DramaScriptReaderPanelProps> = ({ appState, setAppState }) => {
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [fps, setFps] = useState<number>(0.5);
  const [isDownloading, setIsDownloading] = useState(false);
  
  // Step 2 Config State
  const [selectedCharacters, setSelectedCharacters] = useState<string[]>([]);
  const [customSetting, setCustomSetting] = useState('');

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type.startsWith('video/')) {
        setVideoFile(file);
        setAppState({ status: 'idle', step: 'upload', loadingMessage: '', originalScript: null, rewrittenScript: null, translatedScript: null, error: null });
      } else {
        setAppState(s => ({...s, status: 'error', error: 'Please upload a valid video file.'}));
        setVideoFile(null);
      }
    }
  };

  const handleToggleCharacter = (char: string) => {
    setSelectedCharacters(prev => 
      prev.includes(char) ? prev.filter(c => c !== char) : [...prev, char]
    );
  };

  // STEP 1: Extract Original Script
  const handleExtractScript = async () => {
    if (!videoFile) {
      setAppState(s => ({ ...s, status: 'error', error: 'Please upload a video file.' }));
      return;
    }

    setAppState(s => ({ ...s, status: 'loading', loadingMessage: 'Analyzing video & extracting script...' }));

    try {
      const frames = await dramaScriptService.extractFrames(videoFile, fps);
      if (frames.length === 0) {
        throw new Error("Could not extract frames. The file may be corrupt.");
      }
      const originalScript = await dramaScriptService.generateScriptFromVideoFrames(frames);
      
      setAppState(s => ({ 
        ...s, 
        status: 'idle', 
        step: 'configure', 
        originalScript, 
        loadingMessage: '' 
      }));
      
      // Default selection if empty
      if (selectedCharacters.length === 0) {
          setSelectedCharacters(["Rumi", "Mira", "Zoey"]);
      }
    } catch (err) {
      console.error(err);
      setAppState(s => ({ 
        ...s, 
        status: 'error', 
        error: `Extraction failed: ${err instanceof Error ? err.message : String(err)}` 
      }));
    }
  };

  // STEP 2: Generate Drama Scripts
  const handleGenerateDrama = async () => {
    if (!appState.originalScript) return;

    setAppState(s => ({ ...s, status: 'loading', loadingMessage: 'Writing drama script & translating...' }));

    try {
      const newScript = await dramaScriptService.rewriteScript(appState.originalScript, {
        selectedCharacterNames: selectedCharacters,
        setting: customSetting
      });
      
      const translated = await dramaScriptService.translateScriptToVietnamese(newScript);
      
      setAppState(s => ({ 
        ...s, 
        status: 'success', 
        step: 'complete',
        rewrittenScript: newScript, 
        translatedScript: translated, 
        loadingMessage: '', 
        error: null 
      }));

    } catch (err) {
      console.error(err);
      setAppState(s => ({ 
        ...s, 
        status: 'error', 
        error: `Generation failed: ${err instanceof Error ? err.message : String(err)}` 
      }));
    }
  };
  
  const handleDownload = async () => {
    if (appState.status !== 'success') return;
    setIsDownloading(true);
    try {
        const zip = new JSZip();
        if (appState.originalScript) zip.file("1_original_script.txt", appState.originalScript);
        if (appState.rewrittenScript) zip.file("2_rewritten_story.txt", appState.rewrittenScript);
        if (appState.translatedScript) zip.file("3_translated_script_vi.txt", appState.translatedScript);
        const content = await zip.generateAsync({ type: "blob" });
        saveAs(content, "drama-scripts.zip");
    } catch (e) {
        console.error("Failed to create zip file", e);
        setAppState(s => ({ ...s, status: 'error', error: 'Failed to create zip file.' }));
    } finally {
        setIsDownloading(false);
    }
  };

  const handleReset = () => {
      setVideoFile(null);
      setAppState({ status: 'idle', step: 'upload', loadingMessage: '', originalScript: null, rewrittenScript: null, translatedScript: null, error: null });
      setSelectedCharacters([]);
      setCustomSetting('');
  };

  return (
    <div className="bg-white p-6 rounded-2xl border-4 border-blue-400 shadow-lg w-full max-w-7xl mx-auto text-gray-800 space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-blue-800"><i className="fas fa-scroll mr-3"></i>Drama Script Reader</h2>
        <p className="text-gray-600 mt-2 max-w-3xl mx-auto">Upload a video to analyze it, then choose your cast and setting to generate a dramatic script.</p>
      </div>

      {/* STEP 1: UPLOAD */}
      {appState.step === 'upload' && (
        <div className="bg-blue-50 p-6 border-2 border-blue-200 rounded-lg flex flex-col md:flex-row items-center gap-6 animate-fade-in">
            <div className="flex-grow w-full space-y-4">
                <div>
                    <label htmlFor="video-upload-drama" className="block text-lg font-bold text-blue-700 mb-2">
                        <i className="fas fa-video mr-2"></i>Step 1: Upload Video File
                    </label>
                    <div className="relative border-2 border-dashed border-blue-300 rounded-lg p-8 bg-white hover:bg-blue-50 transition-colors">
                        <input 
                            type="file" 
                            id="video-upload-drama" 
                            accept="video/*" 
                            onChange={handleFileChange}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        />
                        <div className="text-center text-blue-800">
                            <i className="fas fa-upload text-4xl mb-3"></i>
                            {videoFile ? (
                                <>
                                    <p className="font-bold text-lg">{videoFile.name}</p>
                                    <p className="text-sm text-gray-500">({(videoFile.size / 1024 / 1024).toFixed(2)} MB)</p>
                                </>
                            ) : (
                                <p className="font-bold text-lg">Click or drag a video file here</p>
                            )}
                        </div>
                    </div>
                </div>
                <div>
                    <label htmlFor="fps-slider-drama" className="block text-sm font-bold text-blue-700 mb-1">
                        Analysis Density (Frames per Second): <span className="bg-blue-200 text-blue-800 px-2 rounded ml-2">{fps.toFixed(1)}</span>
                    </label>
                    <input
                        type="range"
                        id="fps-slider-drama"
                        min="0.1"
                        max="1"
                        step="0.1"
                        value={fps}
                        onChange={(e) => setFps(parseFloat(e.target.value))}
                        className="w-full h-2 bg-blue-200 rounded-lg appearance-none cursor-pointer"
                    />
                </div>
            </div>
            <div className="flex-shrink-0 w-full md:w-auto">
                <button
                    onClick={handleExtractScript}
                    disabled={appState.status === 'loading' || !videoFile}
                    className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-4 px-8 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 flex items-center justify-center gap-3 text-lg shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                >
                    {appState.status === 'loading' ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-file-import"></i>}
                    Analyze & Extract Script
                </button>
            </div>
        </div>
      )}

      {/* STEP 2: CONFIGURE */}
      {appState.step === 'configure' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fade-in">
            {/* Left: Original Script Review */}
            <div className="bg-gray-100 p-4 rounded-lg border border-gray-300 flex flex-col h-[600px]">
                <h3 className="font-bold text-gray-700 mb-2"><i className="fas fa-file-alt mr-2"></i>Original Extracted Script</h3>
                <textarea 
                    readOnly 
                    value={appState.originalScript || ''} 
                    className="flex-grow w-full p-3 bg-white border border-gray-300 rounded-md font-mono text-sm text-gray-600 resize-none focus:outline-none"
                />
            </div>

            {/* Right: Configuration Form */}
            <div className="bg-blue-50 p-6 rounded-lg border-2 border-blue-200 flex flex-col gap-6 h-fit">
                <h3 className="text-xl font-bold text-blue-800"><i className="fas fa-cogs mr-2"></i>Step 2: Configure Adaptation</h3>
                
                <div>
                    <label className="block text-sm font-bold text-blue-700 mb-2">Cast Selection (Who is in this scene?)</label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 bg-white p-3 rounded-lg border border-blue-100 max-h-48 overflow-y-auto">
                        {AVAILABLE_CHARACTERS.map(char => (
                            <label key={char} className={`flex items-center gap-2 p-2 rounded cursor-pointer transition-colors ${selectedCharacters.includes(char) ? 'bg-blue-100 border border-blue-300' : 'hover:bg-gray-50'}`}>
                                <input 
                                    type="checkbox" 
                                    checked={selectedCharacters.includes(char)}
                                    onChange={() => handleToggleCharacter(char)}
                                    className="rounded text-blue-600 focus:ring-blue-500"
                                />
                                <span className="text-sm font-semibold text-gray-700">{char}</span>
                            </label>
                        ))}
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-bold text-blue-700 mb-2">Scene Setting / Context</label>
                    <textarea
                        value={customSetting}
                        onChange={(e) => setCustomSetting(e.target.value)}
                        placeholder="e.g., A dark, neon-lit alleyway behind the stadium..."
                        className="w-full p-3 rounded-lg border border-blue-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[100px]"
                    />
                </div>

                <div className="flex gap-3 mt-auto pt-4">
                    <button
                         onClick={handleReset}
                         className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-3 rounded-lg transition-colors"
                    >
                        Start Over
                    </button>
                    <button
                        onClick={handleGenerateDrama}
                        disabled={appState.status === 'loading'}
                        className="flex-[2] bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 rounded-lg shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5 flex justify-center items-center gap-2"
                    >
                        {appState.status === 'loading' ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-wand-magic-sparkles"></i>}
                        Generate Drama Script
                    </button>
                </div>
            </div>
        </div>
      )}

      {/* STEP 3: RESULT */}
      {appState.step === 'complete' && (
          <div className="space-y-6 animate-fade-in">
            <div className="flex justify-center gap-4">
              <button
                onClick={handleReset}
                className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold py-2 px-6 rounded-full transition-colors"
              >
                <i className="fas fa-redo mr-2"></i>New Video
              </button>
              <button
                onClick={() => setAppState(s => ({ ...s, step: 'configure' }))}
                className="bg-blue-100 hover:bg-blue-200 text-blue-800 font-bold py-2 px-6 rounded-full transition-colors"
              >
                <i className="fas fa-arrow-left mr-2"></i>Edit Configuration
              </button>
              <button
                onClick={handleDownload}
                disabled={isDownloading}
                className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-8 rounded-full shadow-md transition-transform transform hover:scale-105 flex items-center gap-2"
              >
                {isDownloading ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-download"></i>}
                Download All
              </button>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 min-h-[500px]">
                <ScriptDisplayCard title="1. Original Script" script={appState.originalScript} />
                <ScriptDisplayCard title="2. Educational Story" script={appState.rewrittenScript} />
                <ScriptDisplayCard title="3. Vietnamese Translation" script={appState.translatedScript} />
            </div>
          </div>
      )}

      {/* Loading Overlay/Message for long processes */}
      {appState.status === 'loading' && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-8 rounded-xl shadow-2xl text-center max-w-md mx-4">
                <div className="inline-block text-blue-500 mb-4">
                    <i className="fas fa-circle-notch fa-spin text-5xl"></i>
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">Processing...</h3>
                <p className="text-gray-600">{appState.loadingMessage}</p>
            </div>
        </div>
      )}

      {appState.status === 'error' && (
        <div className="bg-red-100 p-4 rounded-lg border border-red-400 text-red-700 flex items-center justify-between">
          <div><strong>Error:</strong> {appState.error}</div>
          <button onClick={() => setAppState(s => ({...s, status: 'idle', error: null}))} className="text-red-800 hover:text-red-900 font-bold">&times;</button>
        </div>
      )}
    </div>
  );
};
