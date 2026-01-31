
import React, { useState } from 'react';
import { KiloBrunoState, Character, StoryboardScene, ParsedShot, Setting } from '../types';
import * as kiloAndBrunoScriptService from '../services/kiloAndBrunoScriptService';
import { mapSceneDefaults } from '../services/geminiService';

interface KiloAndBrunoScriptReaderPanelProps {
  appState: KiloBrunoState;
  setAppState: React.Dispatch<React.SetStateAction<KiloBrunoState>>;
  savedCharacters: Character[];
  savedSettings: Setting[];
  onAddCharacter: (file: File, name: string) => Promise<string>;
  onAddSetting: (file: File, name: string) => Promise<string>;
  onCreateStoryboard: (scenes: StoryboardScene[]) => void;
}

const DEFAULT_INPUT_PLACEHOLDER = `Thời gian,Tên Phân cảnh,Mô tả Hình ảnh (Visual),Lời thoại & Âm thanh (Audio)
00:00 - 00:10,Intro,"Bối cảnh ban đêm...","[Nhạc nền]: Tiếng bass dập mạnh..."
...`;

export const KiloAndBrunoScriptReaderPanel: React.FC<KiloAndBrunoScriptReaderPanelProps> = ({ 
  appState, 
  setAppState, 
  savedCharacters,
  savedSettings,
  onAddCharacter,
  onAddSetting,
  onCreateStoryboard 
}) => {
  // Mapping state: Key = Script Name, Value = App Asset ID
  const [charMapping, setCharMapping] = useState<Record<string, string>>({});
  const [settingMapping, setSettingMapping] = useState<Record<string, string>>({});
  const [isProcessing, setIsProcessing] = useState(false);

  const handleAnalyze = async () => {
    if (!appState.rawScript.trim()) return;

    setAppState(s => ({ ...s, status: 'loading', loadingMessage: 'Analyzing script structure and identifying assets...' }));

    try {
      const result = await kiloAndBrunoScriptService.analyzeAndBreakdownScript(appState.rawScript);
      
      // Auto-map characters if names match exactly
      const initialCharMapping: Record<string, string> = {};
      result.requirements.characters.forEach(scriptChar => {
        const match = savedCharacters.find(c => c.name.toLowerCase() === scriptChar.toLowerCase());
        if (match) {
          initialCharMapping[scriptChar] = match.id;
        }
      });

      // Auto-map settings if names match exactly
      const initialSettingMapping: Record<string, string> = {};
      result.requirements.settings.forEach(scriptSetting => {
          const match = savedSettings.find(s => s.name.toLowerCase() === scriptSetting.toLowerCase());
          if (match) {
              initialSettingMapping[scriptSetting] = match.id;
          }
      });

      setCharMapping(initialCharMapping);
      setSettingMapping(initialSettingMapping);
      setAppState(s => ({ 
        ...s, 
        status: 'mapping', 
        parsedShots: result.shots,
        requirements: result.requirements
      }));
    } catch (e: any) {
      setAppState(s => ({ ...s, status: 'error', error: e.message }));
    }
  };

  const handleQuickUploadChar = async (scriptCharName: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    try {
      const newId = await onAddCharacter(file, scriptCharName);
      if (newId) {
          setCharMapping(prev => ({ ...prev, [scriptCharName]: newId }));
      }
    } catch (err) {
      console.error(err);
      setAppState(s => ({ ...s, error: "Failed to upload character image." }));
    } finally {
      setIsProcessing(false);
    }
  };

  const handleQuickUploadSetting = async (scriptSettingName: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    try {
      const newId = await onAddSetting(file, scriptSettingName);
      if (newId) {
          setSettingMapping(prev => ({ ...prev, [scriptSettingName]: newId }));
      }
    } catch (err) {
      console.error(err);
      setAppState(s => ({ ...s, error: "Failed to upload setting image." }));
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePushToStoryboard = () => {
    // Convert ParsedShots to StoryboardScenes
    const newScenes: StoryboardScene[] = appState.parsedShots.map(shot => {
      // Resolve character names for the scene based on mapping
      const appCharNames = shot.charactersPresent
        .map(scriptName => {
            const mappedId = charMapping[scriptName];
            const char = savedCharacters.find(c => c.id === mappedId);
            return char ? char.name : null;
        })
        .filter((n): n is string => n !== null);

      // Resolve background URL from setting mapping
      const mappedSettingId = settingMapping[shot.setting];
      const setting = savedSettings.find(s => s.id === mappedSettingId);
      const backgroundUrl = setting ? setting.imageUrl : undefined;

      // Construct prompts
      const fullImagePrompt = `[${shot.shotType}] ${shot.visualDescription}. Setting: ${shot.setting}.`;
      const fullVideoPrompt = `${shot.visualDescription}. ${shot.audioDescription}`;

      return mapSceneDefaults({
        lyric: `${shot.audioDescription} (${shot.duration}s)`,
        imagePrompt: fullImagePrompt,
        videoPrompt: fullVideoPrompt,
        charactersInScene: appCharNames,
        backgroundUrl: backgroundUrl
      });
    });

    onCreateStoryboard(newScenes);
  };

  return (
    <div className="bg-white p-6 rounded-2xl border-4 border-blue-400 shadow-lg w-full max-w-7xl mx-auto text-gray-800 space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-blue-800"><i className="fas fa-paw mr-3"></i>Kilo & Bruno Script Processor</h2>
        <p className="text-gray-600 mt-2">Transform raw scripts into ready-to-generate storyboards.</p>
      </div>

      {/* STEP 1: INPUT */}
      {appState.status === 'idle' || appState.status === 'error' ? (
        <div className="bg-blue-50 p-6 border-2 border-blue-200 rounded-lg space-y-4">
           <h3 className="text-xl font-bold text-blue-800">Step 1: Input Script</h3>
           <textarea
                value={appState.rawScript}
                onChange={(e) => setAppState(s => ({...s, rawScript: e.target.value}))}
                placeholder={DEFAULT_INPUT_PLACEHOLDER}
                className="w-full h-64 p-4 rounded-lg border-2 border-blue-300 bg-white text-gray-900 font-mono text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <button
                onClick={handleAnalyze}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-full transition-colors"
            >
                Analyze & Breakdown
            </button>
            {appState.status === 'error' && (
                <p className="text-red-600 font-bold bg-red-100 p-3 rounded border border-red-200">{appState.error}</p>
            )}
        </div>
      ) : null}

      {/* LOADING */}
      {appState.status === 'loading' && (
         <div className="text-center p-10">
            <i className="fas fa-spinner fa-spin text-4xl text-blue-500 mb-4"></i>
            <p className="text-xl font-bold text-gray-700">{appState.loadingMessage}</p>
         </div>
      )}

      {/* STEP 2: ASSET MAPPING */}
      {appState.status === 'mapping' && (
        <div className="space-y-6">
             <div className="bg-yellow-50 p-6 border-2 border-yellow-300 rounded-lg">
                <h3 className="text-xl font-bold text-yellow-900 mb-4">Step 2: Map Required Assets</h3>
                <p className="text-sm text-gray-700 mb-4 font-medium">The script requires the following characters and locations. Map them to your existing assets or upload new ones.</p>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Character Mapping */}
                    <div className="space-y-4">
                        <h4 className="font-bold text-blue-800 border-b border-blue-200 pb-2"><i className="fas fa-user mr-2"></i>Characters</h4>
                        {appState.requirements.characters.map((scriptChar, idx) => (
                            <div key={idx} className="bg-white p-4 rounded shadow-sm border border-yellow-200 flex flex-col gap-2">
                                <div className="font-bold text-lg text-gray-900">{scriptChar}</div>
                                <div className="flex gap-2 items-center">
                                    <select
                                        value={charMapping[scriptChar] || ""}
                                        onChange={(e) => setCharMapping(prev => ({ ...prev, [scriptChar]: e.target.value }))}
                                        className="flex-1 border border-gray-300 rounded p-2 text-sm bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    >
                                        <option value="">-- Select Existing --</option>
                                        {savedCharacters.map(c => (
                                            <option key={c.id} value={c.id}>{c.name}</option>
                                        ))}
                                    </select>
                                </div>
                                {!charMapping[scriptChar] && (
                                    <div className="text-center border-t border-gray-100 pt-2 mt-1">
                                        <label className="cursor-pointer text-xs font-bold text-blue-700 hover:text-blue-900 bg-blue-100 border border-blue-200 px-3 py-1.5 rounded-full transition-colors inline-flex items-center gap-1">
                                            <i className="fas fa-plus"></i> Upload "{scriptChar}"
                                            <input 
                                                type="file" 
                                                accept="image/*" 
                                                className="hidden"
                                                onChange={(e) => handleQuickUploadChar(scriptChar, e)}
                                                disabled={isProcessing}
                                            />
                                        </label>
                                    </div>
                                )}
                                {charMapping[scriptChar] && (
                                    <div className="text-xs text-green-700 font-bold flex items-center gap-1 mt-1">
                                        <i className="fas fa-check-circle"></i> Mapped
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Setting Mapping */}
                     <div className="space-y-4">
                        <h4 className="font-bold text-green-800 border-b border-green-200 pb-2"><i className="fas fa-image mr-2"></i>Settings / Locations</h4>
                        {appState.requirements.settings.map((scriptSetting, idx) => (
                            <div key={idx} className="bg-white p-4 rounded shadow-sm border border-yellow-200 flex flex-col gap-2">
                                <div className="font-bold text-lg text-gray-900">{scriptSetting}</div>
                                <div className="flex gap-2 items-center">
                                    <select
                                        value={settingMapping[scriptSetting] || ""}
                                        onChange={(e) => setSettingMapping(prev => ({ ...prev, [scriptSetting]: e.target.value }))}
                                        className="flex-1 border border-gray-300 rounded p-2 text-sm bg-white text-gray-900 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                                    >
                                        <option value="">-- Select Existing --</option>
                                        {savedSettings.map(s => (
                                            <option key={s.id} value={s.id}>{s.name}</option>
                                        ))}
                                    </select>
                                </div>
                                {!settingMapping[scriptSetting] && (
                                    <div className="text-center border-t border-gray-100 pt-2 mt-1">
                                        <label className="cursor-pointer text-xs font-bold text-green-700 hover:text-green-900 bg-green-100 border border-green-200 px-3 py-1.5 rounded-full transition-colors inline-flex items-center gap-1">
                                            <i className="fas fa-plus"></i> Upload "{scriptSetting}"
                                            <input 
                                                type="file" 
                                                accept="image/*" 
                                                className="hidden"
                                                onChange={(e) => handleQuickUploadSetting(scriptSetting, e)}
                                                disabled={isProcessing}
                                            />
                                        </label>
                                    </div>
                                )}
                                {settingMapping[scriptSetting] && (
                                    <div className="text-xs text-green-700 font-bold flex items-center gap-1 mt-1">
                                        <i className="fas fa-check-circle"></i> Mapped
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
             </div>

             <div className="bg-gray-100 p-6 border-2 border-gray-300 rounded-lg">
                <h3 className="text-xl font-bold text-gray-800 mb-2">Step 3: Review Breakdown</h3>
                <div className="max-h-60 overflow-y-auto space-y-2 mb-4 pr-2">
                    {appState.parsedShots.map((shot, i) => (
                        <div key={i} className="bg-white p-3 rounded border border-gray-300 text-sm grid grid-cols-12 gap-2 shadow-sm">
                            <div className="col-span-1 font-bold text-gray-500">#{i+1}</div>
                            <div className="col-span-2 text-blue-700 font-bold">{shot.duration}s</div>
                            <div className="col-span-9 text-gray-900">
                                <span className="font-bold text-purple-800">[{shot.setting}]</span> {shot.visualDescription} <span className="italic text-gray-600 block mt-1 border-l-2 border-gray-300 pl-2">"{shot.audioDescription}"</span>
                            </div>
                        </div>
                    ))}
                </div>
                <button
                    onClick={handlePushToStoryboard}
                    className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-4 rounded-xl shadow-lg transform hover:-translate-y-1 transition-all flex items-center justify-center gap-3 text-xl"
                >
                    <i className="fas fa-film"></i>
                    Generate Storyboard ({appState.parsedShots.length} Scenes)
                </button>
             </div>
             
             <button 
                onClick={() => setAppState(s => ({ ...s, status: 'idle' }))}
                className="text-gray-600 hover:text-red-600 underline text-sm w-full text-center font-semibold"
            >
                Cancel and Restart
             </button>
        </div>
      )}
    </div>
  );
};
