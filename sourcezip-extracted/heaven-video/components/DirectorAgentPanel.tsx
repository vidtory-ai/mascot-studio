

import React, { useState } from 'react';
import { AgentState, Character, Setting, StoryboardScene } from '../types';
import * as geminiService from '../services/geminiService';

interface DirectorAgentPanelProps {
  savedCharacters: Character[];
  savedSettings: Setting[];
  onAddCharacter: (file: File, name: string) => Promise<string>;
  onAddSetting: (files: File[], name: string) => Promise<string>;
  onCreateStoryboard: (scenes: StoryboardScene[]) => void;
}

export const DirectorAgentPanel: React.FC<DirectorAgentPanelProps> = ({
  savedCharacters,
  savedSettings,
  onAddCharacter,
  onAddSetting,
  onCreateStoryboard
}) => {
  const [state, setState] = useState<AgentState>({
    step: 'input',
    scriptText: '',
    analysisResult: null,
    mapping: { characters: {}, locations: {} },
    generatedScenes: [],
    continuityReports: {},
    isProcessing: false,
    processMessage: ''
  });

  const [continuityResult, setContinuityResult] = useState<{id: string, issues: string[]}[]>([]);

  // --- STEP 1: ANALYZE ---
  const handleAnalyze = async () => {
    if (!state.scriptText.trim()) return;
    setState(s => ({ ...s, isProcessing: true, processMessage: 'Director Agent is analyzing script structure, pacing, and assets...' }));
    
    try {
      const result = await geminiService.agentAnalyzeScript(state.scriptText);
      
      // Auto-map existing assets
      const charMap: Record<string, string> = {};
      const locMap: Record<string, string> = {};

      result.detectedCharacters.forEach(c => {
        const match = savedCharacters.find(sc => sc.name.toLowerCase() === c.name.toLowerCase());
        if (match) charMap[c.name] = match.id;
      });

      result.detectedLocations.forEach(l => {
          const match = savedSettings.find(ss => ss.name.toLowerCase() === l.name.toLowerCase());
          if (match) locMap[l.name] = match.id;
      });

      setState(s => ({
          ...s,
          step: 'mapping',
          analysisResult: result,
          mapping: { characters: charMap, locations: locMap },
          isProcessing: false
      }));

    } catch (e) {
        alert("Analysis failed. Please try again.");
        setState(s => ({ ...s, isProcessing: false }));
    }
  };

  // --- MAPPING HANDLERS ---
  const handleQuickUploadChar = async (charName: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setState(s => ({ ...s, isProcessing: true, processMessage: `Uploading asset for ${charName}...` }));
    try {
        const newId = await onAddCharacter(file, charName);
        setState(s => ({
            ...s,
            mapping: { ...s.mapping, characters: { ...s.mapping.characters, [charName]: newId } },
            isProcessing: false
        }));
    } catch (e) {
        alert("Failed to upload character.");
        setState(s => ({ ...s, isProcessing: false }));
    }
  };

  const handleQuickUploadSetting = async (locName: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    // Ask user for name to track easily
    const customName = window.prompt(`Name this new background asset for "${locName}":`, locName);
    if (customName === null) {
        e.target.value = ''; // Reset input if cancelled
        return;
    }
    const finalName = customName.trim() || locName;

    setState(s => ({ ...s, isProcessing: true, processMessage: `Uploading assets for ${finalName}...` }));
    try {
        const newId = await onAddSetting(Array.from(files), finalName);
        setState(s => ({
            ...s,
            mapping: { ...s.mapping, locations: { ...s.mapping.locations, [locName]: newId } },
            isProcessing: false
        }));
    } catch (e) {
        alert("Failed to upload setting.");
        setState(s => ({ ...s, isProcessing: false }));
    }
  };

  const handleSelectBackgroundForScene = (sceneId: string, url: string) => {
      setState(s => ({
          ...s,
          generatedScenes: s.generatedScenes.map(scene => scene.id === sceneId ? { ...scene, backgroundUrl: url } : scene)
      }));
  };


  // --- STEP 2: GENERATE ---
  const handleGenerate = async () => {
      if (!state.analysisResult) return;
      setState(s => ({ ...s, isProcessing: true, processMessage: 'Director Agent is planning shots, calculating camera moves, and reasoning...' }));

      try {
        // Construct detailed asset list from mappings or suggestions
        const finalChars: Character[] = state.analysisResult.detectedCharacters.map(dc => {
             const mappedId = state.mapping.characters[dc.name];
             const existing = savedCharacters.find(c => c.id === mappedId);
             if (existing) return existing;
             // If no existing asset, use the AI suggested description
             return {
                 id: 'temp-' + dc.name,
                 name: dc.name,
                 description: dc.suggestedDescription,
                 isMainCharacter: false
             };
        });

        const finalLocs: Setting[] = state.analysisResult.detectedLocations.map(dl => {
            const mappedId = state.mapping.locations[dl.name];
            const existing = savedSettings.find(s => s.id === mappedId);
            if (existing) return existing;
            return {
                id: 'temp-' + dl.name,
                name: dl.name,
                imageUrls: [], 
                imageUrl: ''
            };
        });

        // GENERATE SCENES
        let scenes = await geminiService.agentGenerateStoryboard(state.analysisResult, finalChars, finalLocs);
        
        // POST-PROCESS: Assign background URLs from mappings if available
        scenes = scenes.map(scene => {
             // Find which location name from analysis corresponds to this scene
             // Note: geminiService.agentGenerateStoryboard output doesn't explicitly link back to location name cleanly yet without reparsing context
             // But we can infer if the prompt mentions it, or better, we can assume the agent follows the analysis structure order? 
             // Actually, agentGenerateStoryboard output doesn't contain the 'locationName' property directly. 
             // To fix this cleanly, we need to correlate via the analysis result or just simple heuristic.
             
             // Simple heuristic: Find which detected location name appears in the analysis for this scene index (if 1-to-1 mapping generally holds)
             // However, agent generates breakdown, so multiple shots per analysis scene.
             
             // Better approach: We iterate through analysis result scenes to find the "current" scene based on index logic, but that's complex.
             // Simplification: We will let the USER select the background in Review mode based on the mapped locations.
             // Auto-assign: If we can match the location from analysis result.
             
             // Let's try to match based on the agent's context.
             // For now, we'll leave it empty and let the user pick in review, OR if there's only 1 image for the mapped location of the *parent* scene.
             return scene;
        });

        // Let's do a best-effort auto-assign
        // Map AgentAnalyzedScene to the generated shots
        let shotIndex = 0;
        state.analysisResult.scenes.forEach(analyzedScene => {
             const locId = state.mapping.locations[analyzedScene.location];
             const setting = savedSettings.find(s => s.id === locId);
             
             // We don't know exactly how many shots generated for this scene without re-parsing, 
             // but strictly speaking, we can just offer the choice in UI.
             // For auto-assign: if the 'setting' has images, assign the first one to all shots that *seem* to belong to it.
             // Since we can't easily correlate without changing the agent output schema, we rely on UI selection.
        });

        setState(s => ({
            ...s,
            step: 'review',
            generatedScenes: scenes,
            isProcessing: false
        }));
        
        // Auto-push to main storyboard
        onCreateStoryboard(scenes);

      } catch (e) {
        alert("Generation failed.");
        setState(s => ({ ...s, isProcessing: false }));
    }
  };

  // --- STEP 3: CHECK CONTINUITY ---
  const handleCheckContinuity = async () => {
    setState(s => ({ ...s, isProcessing: true, processMessage: 'Director Agent is reviewing footage for screen direction and prop errors...' }));
    try {
        const reports = await geminiService.agentCheckContinuity(state.generatedScenes);
        const reportMap: Record<string, any> = {};
        const displayList: {id: string, issues: string[]}[] = [];

        reports.forEach((r, idx) => {
             // Fallback mapping if IDs don't match exactly (using index)
             const sceneId = state.generatedScenes[idx]?.id || r.shotId;
             reportMap[sceneId] = r;
             if (r.issues && r.issues.length > 0) {
                 displayList.push({ id: sceneId, issues: r.issues });
             }
        });

        setState(s => ({ ...s, continuityReports: reportMap, isProcessing: false }));
        setContinuityResult(displayList);
    } catch(e) {
        alert("Continuity check failed.");
        setState(s => ({ ...s, isProcessing: false }));
    }
  };


  // --- RENDER HELPERS ---
  
  const renderMappingStep = () => {
      if (!state.analysisResult) return null;
      return (
          <div className="space-y-6">
              {/* Scene Analysis Overview */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg border border-blue-200">
                  <h3 className="font-bold text-lg text-blue-900 mb-4"><i className="fas fa-chart-line mr-2"></i>Script Breakdown</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-60 overflow-y-auto pr-2">
                    {state.analysisResult.scenes.map(scene => (
                        <div key={scene.sceneNumber} className="bg-white p-3 rounded shadow-sm border border-blue-100 text-sm">
                            <div className="flex justify-between font-bold text-gray-800 mb-1">
                                <span>Scene {scene.sceneNumber}</span>
                                <span className="text-blue-600">{scene.estimatedDuration}s</span>
                            </div>
                            <div className="flex gap-2 mb-2 flex-wrap">
                                <span className={`text-xs px-2 py-0.5 rounded-full border ${scene.sceneType === 'Action' ? 'bg-red-100 text-red-800 border-red-200' : scene.sceneType === 'Dialogue' ? 'bg-green-100 text-green-800 border-green-200' : 'bg-gray-100 text-gray-800 border-gray-200'}`}>
                                    {scene.sceneType}
                                </span>
                                <span className="bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded-full">{scene.pacing} Pacing</span>
                            </div>
                            <p className="text-gray-600 text-xs line-clamp-2 mb-1"><strong>Action:</strong> {scene.actionSummary}</p>
                            <p className="text-red-500 text-xs line-clamp-1"><strong>Conflict:</strong> {scene.conflict}</p>
                        </div>
                    ))}
                  </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* CHARACTERS */}
                  <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
                      <h4 className="font-bold text-blue-800 mb-4 flex items-center gap-2"><i className="fas fa-users"></i> Cast List</h4>
                      <div className="space-y-4">
                          {state.analysisResult.detectedCharacters.map(c => (
                              <div key={c.name} className="border-b border-gray-100 pb-3 last:border-0">
                                  <div className="flex justify-between items-start mb-1">
                                      <span className="font-bold text-gray-800">{c.name}</span>
                                      {state.mapping.characters[c.name] ? 
                                        <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-bold">Mapped</span> : 
                                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-bold">AI Design</span>
                                      }
                                  </div>
                                  <p className="text-xs text-gray-500 italic mb-2 line-clamp-2">{c.suggestedDescription}</p>
                                  <div className="flex gap-2">
                                      <select 
                                        className="flex-1 text-sm border-gray-300 rounded"
                                        value={state.mapping.characters[c.name] || ''}
                                        onChange={(e) => setState(s => ({...s, mapping: {...s.mapping, characters: {...s.mapping.characters, [c.name]: e.target.value}}}))}
                                      >
                                          <option value="">Use AI Generated Design</option>
                                          {savedCharacters.map(sc => <option key={sc.id} value={sc.id}>Use Asset: {sc.name}</option>)}
                                      </select>
                                      <label className="cursor-pointer bg-blue-100 hover:bg-blue-200 text-blue-700 rounded px-3 flex items-center justify-center transition-colors" title="Upload Image">
                                            <i className="fas fa-upload"></i>
                                            <input type="file" accept="image/*" className="hidden" onChange={(e) => handleQuickUploadChar(c.name, e)} />
                                      </label>
                                  </div>
                              </div>
                          ))}
                      </div>
                  </div>

                  {/* LOCATIONS */}
                   <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
                      <h4 className="font-bold text-green-800 mb-4 flex items-center gap-2"><i className="fas fa-map-marker-alt"></i> Location Scout</h4>
                      <div className="space-y-4">
                          {state.analysisResult.detectedLocations.map(l => (
                              <div key={l.name} className="border-b border-gray-100 pb-3 last:border-0">
                                  <div className="flex justify-between items-start mb-1">
                                      <span className="font-bold text-gray-800">{l.name}</span>
                                      {state.mapping.locations[l.name] ? 
                                        <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-bold">Mapped</span> : 
                                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-bold">AI Design</span>
                                      }
                                  </div>
                                  <p className="text-xs text-gray-500 italic mb-2 line-clamp-2">{l.suggestedDescription}</p>
                                  <div className="flex gap-2">
                                    <select 
                                        className="flex-1 text-sm border-gray-300 rounded"
                                        value={state.mapping.locations[l.name] || ''}
                                        onChange={(e) => setState(s => ({...s, mapping: {...s.mapping, locations: {...s.mapping.locations, [l.name]: e.target.value}}}))}
                                    >
                                        <option value="">Use AI Generated Design</option>
                                        {savedSettings.map(ss => <option key={ss.id} value={ss.id}>Use Asset: {ss.name}</option>)}
                                    </select>
                                    <label className="cursor-pointer bg-green-100 hover:bg-green-200 text-green-700 rounded px-3 flex items-center justify-center transition-colors" title="Upload Images">
                                        <i className="fas fa-images"></i>
                                        <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => handleQuickUploadSetting(l.name, e)} />
                                    </label>
                                  </div>
                              </div>
                          ))}
                      </div>
                  </div>
              </div>
              
              <div className="flex gap-4">
                 <button 
                    onClick={() => setState(s => ({...s, step: 'input'}))}
                    className="flex-1 py-3 bg-gray-200 text-gray-700 font-bold rounded-lg hover:bg-gray-300 transition-colors"
                >
                    Back to Script
                </button>
                 <button 
                    onClick={handleGenerate}
                    className="flex-2 w-full py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 shadow-lg transform hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2"
                >
                    <i className="fas fa-magic"></i> Generate Intelligent Storyboard
                </button>
              </div>
          </div>
      );
  };

  const renderReviewStep = () => {
      return (
          <div className="space-y-6">
              <div className="flex justify-between items-center bg-green-50 p-4 rounded-lg border border-green-200">
                  <div>
                    <h3 className="font-bold text-green-800"><i className="fas fa-check-circle mr-2"></i>Generation Complete</h3>
                    <p className="text-sm text-green-700">{state.generatedScenes.length} shots generated and added to storyboard.</p>
                  </div>
                  <button 
                    onClick={handleCheckContinuity}
                    className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-6 rounded-lg shadow transition-all flex items-center gap-2"
                  >
                      <i className="fas fa-glasses"></i> Check Continuity
                  </button>
              </div>

              {continuityResult.length > 0 && (
                  <div className="bg-red-50 p-6 rounded-lg border-2 border-red-200 animate-fade-in">
                      <h4 className="font-bold text-red-800 mb-4 flex items-center gap-2"><i className="fas fa-exclamation-triangle"></i> Continuity Issues Detected</h4>
                      <div className="space-y-3">
                          {continuityResult.map((item, idx) => {
                              // Find scene info for context
                              const scene = state.generatedScenes.find(s => s.id === item.id);
                              return (
                                  <div key={idx} className="bg-white p-3 rounded border border-red-100 shadow-sm">
                                      <div className="font-bold text-gray-800 text-sm mb-1">
                                          Shot {idx + 1} ({scene?.shotType || 'Unknown Shot'})
                                      </div>
                                      <ul className="list-disc list-inside text-sm text-red-600">
                                          {item.issues.map((issue, i) => <li key={i}>{issue}</li>)}
                                      </ul>
                                  </div>
                              );
                          })}
                      </div>
                  </div>
              )}

              {/* Preview List */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {state.generatedScenes.map((scene, i) => {
                      // Attempt to find relevant settings images for this scene based on fuzzy matching logic or user manual override
                      // Since we don't have a direct link from Scene -> Location ID (yet), we show ALL settings for manual selection if needed,
                      // OR we try to match keywords in the prompt.
                      // Optimization: We will show a "Select Background" section.
                      
                      return (
                      <div key={scene.id} className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm relative overflow-hidden flex flex-col gap-2">
                          <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>
                          <div className="flex justify-between items-start pl-2">
                              <span className="bg-blue-100 text-blue-800 text-xs font-bold px-2 py-1 rounded">Shot {i+1}</span>
                              <div className="flex flex-col items-end">
                                  <span className="text-xs text-gray-500 font-mono">{scene.estimatedDuration}s</span>
                                  <span className="text-[10px] bg-gray-100 px-1 rounded text-gray-500">{scene.transition}</span>
                              </div>
                          </div>
                          
                          <div className="pl-2 space-y-2">
                              <div>
                                  <h5 className="font-bold text-gray-800 text-sm">{scene.shotType}</h5>
                                  <div className="text-xs text-purple-600 flex items-center gap-1 font-semibold">
                                      <i className="fas fa-video"></i> {scene.cameraMovement || "Static"}
                                  </div>
                              </div>
                              
                              <p className="text-xs text-gray-600 line-clamp-3 border-t pt-2 mt-1">{scene.imagePrompt}</p>

                              {/* Background Selection UI */}
                              <div className="mt-2 pt-2 border-t border-gray-100">
                                  <span className="text-xs font-bold text-green-700 block mb-1">Set Background Reference:</span>
                                  <div className="flex gap-1 overflow-x-auto pb-1">
                                      {/* Show currently selected if exists */}
                                      {scene.backgroundUrl && (
                                         <div className="flex-shrink-0 relative border-2 border-blue-500 rounded">
                                            <img src={scene.backgroundUrl} className="h-10 w-16 object-cover" />
                                            <div className="absolute top-0 right-0 bg-blue-500 text-white text-[8px] px-1">Active</div>
                                         </div>
                                      )}
                                      
                                      {/* List available location images from savedSettings */}
                                      {savedSettings.map(setting => (
                                          setting.imageUrls?.map((url, idx) => (
                                              <img 
                                                key={`${setting.id}-${idx}`}
                                                src={url} 
                                                title={`${setting.name} (${idx+1})`}
                                                className={`h-10 w-16 object-cover rounded cursor-pointer border hover:border-blue-300 ${scene.backgroundUrl === url ? 'hidden' : 'border-gray-200'}`}
                                                onClick={() => handleSelectBackgroundForScene(scene.id, url)}
                                              />
                                          ))
                                      ))}
                                  </div>
                              </div>
                          </div>
                      </div>
                  )})}
              </div>
              
              <button 
                 onClick={() => setState(s => ({...s, step: 'input', generatedScenes: [], continuityReports: {}, analysisResult: null, scriptText: ''}))}
                 className="w-full py-3 bg-gray-200 text-gray-600 font-bold rounded-lg hover:bg-gray-300 transition-colors"
              >
                  Start New Project
              </button>
          </div>
      );
  };

  return (
    <div className="bg-white p-6 rounded-2xl border-4 border-blue-400 shadow-lg w-full max-w-7xl mx-auto text-gray-800 space-y-6">
      <div className="text-center border-b border-gray-100 pb-4">
        <h2 className="text-3xl font-bold text-blue-800"><i className="fas fa-robot mr-3"></i>Director Agent</h2>
        <p className="text-gray-600 mt-2">Autonomous Storyboard Generation, Asset Management, and Continuity Checking.</p>
      </div>

      {state.isProcessing && (
         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-8 rounded-xl shadow-2xl text-center max-w-md mx-4 animate-pulse">
                <i className="fas fa-circle-notch fa-spin text-5xl text-blue-500 mb-4"></i>
                <h3 className="text-xl font-bold text-gray-800 mb-2">Agent Working</h3>
                <p className="text-gray-600">{state.processMessage}</p>
            </div>
        </div>
      )}

      {/* STATE MACHINE */}
      {state.step === 'input' && (
          <div className="space-y-4">
              <label className="block text-lg font-bold text-gray-700">Paste your raw script or story outline:</label>
              <textarea
                  className="w-full h-64 p-4 border-2 border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 bg-gray-50 font-mono text-sm"
                  placeholder="EXT. PARK - DAY&#10;A lonely robot sits on a bench, watching birds fly by..."
                  value={state.scriptText}
                  onChange={(e) => setState(s => ({...s, scriptText: e.target.value}))}
              />
              <button
                  onClick={handleAnalyze}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl shadow-lg transform hover:-translate-y-0.5 transition-all text-xl flex items-center justify-center gap-3"
              >
                  <i className="fas fa-brain"></i> Analyze Script
              </button>
          </div>
      )}

      {state.step === 'mapping' && renderMappingStep()}
      {state.step === 'review' && renderReviewStep()}

    </div>
  );
};