
import React, { useState, useEffect, useCallback, useRef } from 'react';
import JSZip from 'jszip';
import saveAs from 'file-saver';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { Login } from './components/Login';
import { CharacterDesignPanel } from './components/CharacterDesignPanel';
import { OutputPanel } from './components/OutputPanel';
import { StoryboardActionHeader } from './components/StoryboardActionHeader';
import { ImageModal } from './components/ImageModal';
import { StoryboardViewer } from './components/StoryboardViewer';
import { DirectorAgentPanel } from './components/DirectorAgentPanel';
import { ThumbnailCopyPanel } from './components/ThumbnailCopyPanel';
import { LandscapeViewPanel } from './components/LandscapeViewPanel';
import { SaveProjectModal } from './components/SaveProjectModal';
import { AppConfig } from './config';
import { authService } from './services/authService';
import { usageService, USAGE_LIMITS } from './services/usageService';
import * as geminiService from './services/geminiService';
import { enrichScene, type EnrichedSceneData } from './services/enrichmentService';
import * as lehuyducanhService from './services/media/lehuyducanhService';
import * as vidtoryServices from './services/vidtoryServices';
import { Character, StoryboardScene, Setting } from './types';

export type AppModule = 'assets' | 'script-processor' | 'storyboard' | 'thumbnails' | 'landscape';
type UsageData = ReturnType<typeof usageService.getUsage>;

// Helper to convert file to data url
const fileToDataUrl = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
        let result = reader.result as string;
        if (result.startsWith('data:application/octet-stream')) {
            if (file.type) {
                result = result.replace('application/octet-stream', file.type);
            } else if (file.name.match(/\.(jpg|jpeg)$/i)) {
                result = result.replace('application/octet-stream', 'image/jpeg');
            } else if (file.name.match(/\.png$/i)) {
                result = result.replace('application/octet-stream', 'image/png');
            } else if (file.name.match(/\.mp4$/i)) {
                result = result.replace('application/octet-stream', 'video/mp4');
            }
        }
        resolve(result);
    };
    reader.onerror = error => reject(error);
  });

const blobToDataUrl = (blob: Blob): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });

interface ProjectData {
  characters: Character[];
  savedCharacters: Character[];
  settings: Setting[];
  storyboardStyle: string; 
  storyboardTheme: string;
  storyboardPromptLanguage: string;
  storyboardScenes: StoryboardScene[];
}

function App() {
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const [activeModule, setActiveModule] = useState<AppModule>('assets');
  const [usage, setUsage] = useState<UsageData>(usageService.getUsage('guest'));
  const [characters, setCharacters] = useState<Character[]>([]);
  const [savedCharacters, setSavedCharacters] = useState<Character[]>([]);
  const [settings, setSettings] = useState<Setting[]>([]);
  const [characterError, setCharacterError] = useState<string | null>(null);
  const [storyboardStyle, setStoryboardStyle] = useState('3D Animation, Pixar Style, Vibrant Colors');
  const [storyboardTheme, setStoryboardTheme] = useState('Animation Story');
  const [storyboardPromptLanguage, setStoryboardPromptLanguage] = useState('English');
  const [projectStyleFile, setProjectStyleFile] = useState<File | null>(null);
  const [scenes, setScenes] = useState<StoryboardScene[]>([]);
  const [storyboardLoading, setStoryboardLoading] = useState(false);
  const [storyboardError, setStoryboardError] = useState<string | null>(null);
  const [isBatchGeneratingImages, setIsBatchGeneratingImages] = useState(false);
  const [isBatchGeneratingVideos, setIsBatchGeneratingVideos] = useState(false);
  const [isBatchUpscaling, setIsBatchUpscaling] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [viewingImage, setViewingImage] = useState<string | null>(null);
  const [isStoryboardViewerVisible, setIsStoryboardViewerVisible] = useState(false);
  const [isSaveModalVisible, setIsSaveModalVisible] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [thumbnailIngredientFiles, setThumbnailIngredientFiles] = useState<File[]>([]);
  const [thumbnailSampleFile, setThumbnailSampleFile] = useState<File | null>(null);
  const [thumbnailUserPrompt, setThumbnailUserPrompt] = useState('Create a vibrant and eye-catching thumbnail.');
  const [generatedThumbnail, setGeneratedThumbnail] = useState<string | null>(null);
  const [isGeneratingThumbnail, setIsGeneratingThumbnail] = useState(false);
  const [thumbnailError, setThumbnailError] = useState<string | null>(null);

  // --- CANCELLATION REFS ---
  const imageAbortControllers = useRef(new Map<string, AbortController>());
  const videoAbortControllers = useRef(new Map<string, AbortController>());
  const isBatchJobCancelled = useRef(false);

  const updateUsage = useCallback(() => {
    if (currentUser) {
      setUsage(usageService.getUsage(currentUser));
    }
  }, [currentUser]);

  useEffect(() => {
    if (AppConfig.LOGIN_REQUIRED) {
      const user = authService.getCurrentUser();
      if (user) {
        setCurrentUser(user);
        updateUsage();
      }
    } else {
      setCurrentUser('guest');
      updateUsage();
    }
  }, [updateUsage]);

  const handleLoginSuccess = (username: string) => {
    setCurrentUser(username);
    updateUsage();
  };

  const handleLogout = () => {
    authService.logout();
    setCurrentUser(null);
  };

  const handleCharacterUpdate = (id: string, field: keyof Character, value: any) => {
    setCharacters(chars => chars.map(c => c.id === id ? { ...c, [field]: value } : c));
  };

  const handleSettingUpdate = (id: string, field: keyof Setting, value: any) => {
    setSettings(prev => prev.map(s => s.id === id ? { ...s, [field]: value } : s));
  };

  const handleAddNewCharacter = () => {
      const newChar: Character = {
          id: crypto.randomUUID(),
          name: "New Character",
          description: "A detailed physical description.",
          isMainCharacter: false,
      };
      setCharacters(chars => [...chars, newChar]);
  };

  const handleAddNewCharacterWithAsset = async (file: File, charNameOverride?: string): Promise<string> => {
    try {
        const assetUrl = await fileToDataUrl(file);
        const newId = crypto.randomUUID();
        const newChar: Character = {
            id: newId,
            name: charNameOverride || "New Character",
            description: "Uploaded character.",
            isMainCharacter: false,
            assetUrl: assetUrl,
        };
        setCharacters(chars => [...chars, newChar]);
        setSavedCharacters(chars => [...chars, newChar]);
        return newId;
    } catch(e: any) {
        const msg = `Failed to load image: ${e.message}`;
        setCharacterError(msg);
        throw new Error(msg);
    }
  };
  
  const handleAddNewSettingWithAsset = async (files: File | File[], settingNameOverride?: string): Promise<string> => {
    try {
        const fileArray = Array.isArray(files) ? files : [files];
        if (fileArray.length === 0) throw new Error("No files provided");

        const imageUrls = await Promise.all(fileArray.map(f => fileToDataUrl(f)));
        const newId = crypto.randomUUID();
        const newSetting: Setting = {
            id: newId,
            name: settingNameOverride || "New Setting",
            imageUrl: imageUrls[0], 
            imageUrls: imageUrls
        };
        setSettings(prev => [...prev, newSetting]);
        return newId;
    } catch(e: any) {
        const msg = `Failed to load setting image: ${e.message}`;
        setCharacterError(msg); 
        throw new Error(msg);
    }
  };
  
  const handleAddImagesToSetting = async (settingId: string, files: File[]) => {
      try {
          const newUrls = await Promise.all(files.map(f => fileToDataUrl(f)));
          setSettings(prev => prev.map(s => {
              if (s.id === settingId) {
                  return {
                      ...s,
                      imageUrls: [...s.imageUrls, ...newUrls]
                  };
              }
              return s;
          }));
      } catch (e: any) {
          console.error("Failed to add images to setting", e);
      }
  };

  const handleDeleteSetting = (id: string) => {
      setSettings(prev => prev.filter(s => s.id !== id));
  };

  const handleSaveCharacters = () => {
    setSavedCharacters(characters);
    alert('Assets saved successfully!');
  };

  const handleDeleteCharacter = (id: string) => {
      setCharacters(chars => chars.filter(c => c.id !== id));
      setSavedCharacters(chars => chars.filter(c => c.id !== id));
  };

  const handleCreateStoryboardFromScript = (newScenes: StoryboardScene[]) => {
      setScenes(prev => [...prev, ...newScenes]);
      setActiveModule('storyboard');
      alert(`Director Agent created ${newScenes.length} shots based on your script.`);
  };

  const updateSceneOrShot = (scenesToUpdate: StoryboardScene[], targetId: string, updateFn: (s: StoryboardScene) => StoryboardScene): StoryboardScene[] => {
    return scenesToUpdate.map(scene => {
        if (scene.id === targetId) {
            return updateFn(scene);
        }
        if (scene.shots && scene.shots.length > 0) {
            const updatedShots = updateSceneOrShot(scene.shots, targetId, updateFn);
            if (updatedShots !== scene.shots) {
                return { ...scene, shots: updatedShots };
            }
        }
        return scene;
    });
  };
  
  const findSceneOrShot = (scenesToSearch: StoryboardScene[], targetId: string): StoryboardScene | undefined => {
      for (const scene of scenesToSearch) {
          if (scene.id === targetId) return scene;
          if (scene.shots) {
              const found = findSceneOrShot(scene.shots, targetId);
              if (found) return found;
          }
      }
      return undefined;
  };

  const handleAddScene = (index: number) => {
    const newScene = geminiService.mapSceneDefaults({ lyric: 'New Scene' });
    const newScenes = [...scenes];
    newScenes.splice(index, 0, newScene);
    setScenes(newScenes);
  };

  const handleDeleteScene = (sceneId: string) => {
    if (confirm("Are you sure you want to delete this scene?")) {
        setScenes(prev => prev.filter(s => s.id !== sceneId));
    }
  };

  const handleSceneDataChange = (sceneId: string, field: keyof StoryboardScene, value: any) => {
    setScenes(prev => updateSceneOrShot(prev, sceneId, (s) => ({ ...s, [field]: value })));
  };
  
  const handleUpdateSceneCharacters = (sceneId: string, newCharacterNames: string[]) => {
     setScenes(prev => updateSceneOrShot(prev, sceneId, (s) => ({ ...s, charactersInScene: newCharacterNames })));
  };

  const handleUploadCustomImage = async (sceneId: string, file: File) => {
    try {
      const base64 = await fileToDataUrl(file);
      setScenes(prev => updateSceneOrShot(prev, sceneId, (s) => ({
           ...s,
           imageUrls: [base64, ...s.imageUrls],
           selectedImageForVideo: base64
      })));
    } catch (e) {
      console.error("Failed to upload custom image", e);
      alert("Failed to upload image.");
    }
  };

  // --- IMAGE GENERATION WITH CANCEL ---

  const handleGenerateImage = async (sceneId: string, model: 'nano' | 'nano2' = 'nano') => {
    const scene = findSceneOrShot(scenes, sceneId);
    if (!scene) return;

    if (!usageService.canPerformAction(currentUser || 'guest', 'generateImage')) {
        alert("Daily image generation limit reached.");
        return;
    }

    // 1. Setup AbortController
    const controller = new AbortController();
    imageAbortControllers.current.set(sceneId, controller);

    setScenes(prev => updateSceneOrShot(prev, sceneId, s => ({ ...s, isGeneratingImage: true, imageGenerationError: null })));

    try {
        let augmentedPrompt = scene.imagePrompt;
        if (scene.charactersInScene && scene.charactersInScene.length > 0) {
            const charDescriptions = savedCharacters
                .filter(c => scene.charactersInScene!.includes(c.name))
                .map(c => `${c.name}: ${c.description}`)
                .join('. ');
            augmentedPrompt += ` [Characters: ${charDescriptions}]`;
        }
        if (storyboardStyle) {
            augmentedPrompt += ` [Style: ${storyboardStyle}]`;
        }

        const subjectUrls = (scene.charactersInScene || [])
            .map(name => savedCharacters.find(c => c.name === name)?.assetUrl)
            .filter((url): url is string => !!url);
        
        const extraUrls = (scene.extraCharacters || []).map(e => e.assetUrl);
        const allSubjectUrls = [...subjectUrls, ...extraUrls];
        const sceneUrl = scene.backgroundUrl; 
        
        let styleUrl: string | undefined = undefined;
        if (projectStyleFile) {
             styleUrl = await fileToDataUrl(projectStyleFile);
        }

        // 2. Pass signal to service
        const newImageUrls = await vidtoryServices.generateSceneImage({
            prompt: augmentedPrompt,
            subjectUrls: allSubjectUrls,
            styleUrl,
            sceneUrl,
            signal: controller.signal 
        });

        setScenes(prev => updateSceneOrShot(prev, sceneId, s => ({
             ...s,
            isGeneratingImage: false,
            imageUrls: [...s.imageUrls, ...newImageUrls],
            selectedImageForVideo: !s.selectedImageForVideo ? newImageUrls[0] : s.selectedImageForVideo
        })));
        
        usageService.logAction(currentUser || 'guest', 'generateImage');
        updateUsage();

    } catch (error: any) {
        if (error.name === 'AbortError' || error.message === 'Operation cancelled by user.') {
             setScenes(prev => updateSceneOrShot(prev, sceneId, s => ({ ...s, isGeneratingImage: false })));
        } else {
             setScenes(prev => updateSceneOrShot(prev, sceneId, s => ({ ...s, isGeneratingImage: false, imageGenerationError: error.message })));
        }
    } finally {
        imageAbortControllers.current.delete(sceneId);
    }
  };

  const handleCancelImage = (sceneId: string) => {
    const controller = imageAbortControllers.current.get(sceneId);
    if (controller) {
        controller.abort();
        imageAbortControllers.current.delete(sceneId);
    }
  };

  // --- VIDEO GENERATION WITH CANCEL ---

  const handleGenerateVideo = async (sceneId: string) => {
    const scene = findSceneOrShot(scenes, sceneId);
    if (!scene || !scene.selectedImageForVideo) return;

    if (!usageService.canPerformAction(currentUser || 'guest', 'generateVideo')) {
        alert("Daily video generation limit reached.");
        return;
    }

    // 1. Setup AbortController
    const controller = new AbortController();
    videoAbortControllers.current.set(sceneId, controller);

    setScenes(prev => updateSceneOrShot(prev, sceneId, s => ({ ...s, isGeneratingVideo: true, videoGenerationError: null, isCancelling: false })));

    try {
        let augmentedVideoPrompt = scene.videoPrompt;
        if (scene.charactersInScene && scene.charactersInScene.length > 0) {
             const charDescriptions = savedCharacters
                .filter(c => scene.charactersInScene!.includes(c.name))
                .map(c => `${c.name}: ${c.description}`)
                .join('. ');
             augmentedVideoPrompt = `[Characters: ${charDescriptions}] Action: ${augmentedVideoPrompt}`;
        }

        // 2. Pass signal to service
        const videoUrl = await vidtoryServices.generateSceneVideo(
            augmentedVideoPrompt,
            scene.selectedImageForVideo,
            controller.signal
        );

        setScenes(prev => updateSceneOrShot(prev, sceneId, s => ({
            ...s,
            isGeneratingVideo: false,
            videoUrl: videoUrl,
            playableVideoUrl: videoUrl,
            mediaGenerationId: undefined,
            seed: undefined
        })));
        
        usageService.logAction(currentUser || 'guest', 'generateVideo');
        updateUsage();

    } catch (error: any) {
        if (error.name === 'AbortError' || error.message === 'Operation cancelled by user.') {
            setScenes(prev => updateSceneOrShot(prev, sceneId, s => ({ ...s, isGeneratingVideo: false, isCancelling: false })));
        } else {
            setScenes(prev => updateSceneOrShot(prev, sceneId, s => ({ ...s, isGeneratingVideo: false, videoGenerationError: error.message })));
        }
    } finally {
        videoAbortControllers.current.delete(sceneId);
    }
  };

  const handleCancelVideo = (sceneId: string) => {
      const controller = videoAbortControllers.current.get(sceneId);
      if (controller) {
          controller.abort();
          videoAbortControllers.current.delete(sceneId);
      }
      setScenes(prev => updateSceneOrShot(prev, sceneId, s => ({ ...s, isCancelling: true, isGeneratingVideo: false })));
  };

  const handleUpscaleVideo = async (sceneId: string) => {
     alert("Upscaling is not supported in the current API version.");
  };

  const handleEnrichScene = async (sceneId: string) => {
      const scene = findSceneOrShot(scenes, sceneId);
      if (!scene) return;

      setScenes(prev => updateSceneOrShot(prev, sceneId, s => ({ ...s, isEnriching: true })));

      try {
          const relevantChars = savedCharacters.filter(c => scene.charactersInScene?.includes(c.name));
          
          const enrichedData = await enrichScene({
              scene,
              characters: relevantChars,
              style: storyboardStyle,
              theme: storyboardTheme,
              language: storyboardPromptLanguage
          });

          let newImagePrompt = `[Visual] ${enrichedData.camera.framing} ${enrichedData.camera.angle}. `;
          enrichedData.subjects.forEach(sub => {
              newImagePrompt += `${sub.id} (${sub.role}): ${sub.desc}. `;
          });
          newImagePrompt += `Background: ${enrichedData.background.note}.`;
          
          let newVideoPrompt = `Camera: ${enrichedData.camera.movement} (${enrichedData.camera.speed}). `;
          enrichedData.actions.forEach(act => {
             newVideoPrompt += `${act.char_id} ${act.action}. `;
          });
          enrichedData.timeline.forEach(t => {
              if(t.dialogue.length > 0) {
                   t.dialogue.forEach(d => newVideoPrompt += `[${d.char} speaks: "${d.line}"]. `);
              }
          });

          setScenes(prev => updateSceneOrShot(prev, sceneId, s => ({ 
              ...s, 
              isEnriching: false, 
              imagePrompt: newImagePrompt,
              videoPrompt: newVideoPrompt
          })));

      } catch (e: any) {
          console.error(e);
          alert("Failed to enrich scene: " + e.message);
          setScenes(prev => updateSceneOrShot(prev, sceneId, s => ({ ...s, isEnriching: false })));
      }
  };

  const handleBreakdownScene = async (sceneId: string) => {
      const scene = findSceneOrShot(scenes, sceneId);
      if (!scene) return;
      setScenes(prev => updateSceneOrShot(prev, sceneId, s => ({ ...s, isBreakingDown: true })));
      try {
          const generatedShots = await geminiService.breakdownSceneIntoShots(scene);
          setScenes(prev => updateSceneOrShot(prev, sceneId, s => ({
              ...s,
              isBreakingDown: false,
              shots: generatedShots,
              isExpanded: true
          })));
      } catch (error: any) {
          alert("Failed to break down scene: " + error.message);
          setScenes(prev => updateSceneOrShot(prev, sceneId, s => ({ ...s, isBreakingDown: false })));
      }
  };

  const handleToggleSceneExpansion = (sceneId: string) => {
      setScenes(prev => updateSceneOrShot(prev, sceneId, s => ({ ...s, isExpanded: !s.isExpanded })));
  };

  const handleAddShot = (sceneId: string) => {
      const newShot = geminiService.mapSceneDefaults({ lyric: 'New Shot' });
      setScenes(prev => updateSceneOrShot(prev, sceneId, s => ({
          ...s,
          shots: [...(s.shots || []), newShot],
          isExpanded: true
      })));
  };

  const handleDeleteShot = (sceneId: string, shotId: string) => {
      setScenes(prev => updateSceneOrShot(prev, sceneId, s => ({
          ...s,
          shots: s.shots?.filter(shot => shot.id !== shotId)
      })));
  };

  const handleBatchGenerateImages = async () => {
      if (isBatchGeneratingImages) return;
      setIsBatchGeneratingImages(true);
      isBatchJobCancelled.current = false;

      const allScenesAndShots: StoryboardScene[] = [];
      const traverse = (list: StoryboardScene[]) => {
          list.forEach(s => {
              allScenesAndShots.push(s);
              if (s.shots) traverse(s.shots);
          });
      };
      traverse(scenes);

      const scenesToProcess = allScenesAndShots.filter(s => s.imageUrls.length === 0 && !s.isGeneratingImage);
      
      for (const scene of scenesToProcess) {
          if (isBatchJobCancelled.current) break;
          await handleGenerateImage(scene.id, 'nano');
      }
      setIsBatchGeneratingImages(false);
  };

  const handleBatchGenerateVideos = async () => {
      if (isBatchGeneratingVideos) return;
      setIsBatchGeneratingVideos(true);
      isBatchJobCancelled.current = false;

      const allScenesAndShots: StoryboardScene[] = [];
      const traverse = (list: StoryboardScene[]) => {
          list.forEach(s => {
              allScenesAndShots.push(s);
              if (s.shots) traverse(s.shots);
          });
      };
      traverse(scenes);

      const scenesToProcess = allScenesAndShots.filter(s => !!s.selectedImageForVideo && !s.videoUrl && !s.isGeneratingVideo);

      for (const scene of scenesToProcess) {
          if (isBatchJobCancelled.current) break;
          try {
              await handleGenerateVideo(scene.id);
          } catch (e) {
              console.error(`Error generating video for scene ${scene.id} during batch:`, e);
          }
      }
      setIsBatchGeneratingVideos(false);
  };

  const handleBatchUpscaleVideos = async () => {
      alert("Batch Upscaling is not supported in the current API version.");
  };

  const handleStopAll = () => {
      isBatchJobCancelled.current = true;
      imageAbortControllers.current.forEach(c => c.abort());
      videoAbortControllers.current.forEach(c => c.abort());
      imageAbortControllers.current.clear();
      videoAbortControllers.current.clear();
      
      const resetRecursive = (list: StoryboardScene[]): StoryboardScene[] => {
          return list.map(s => ({
              ...s,
              isGeneratingImage: false,
              isGeneratingVideo: false,
              isUpscaling: false,
              isCancelling: false,
              shots: s.shots ? resetRecursive(s.shots) : []
          }));
      };
      setScenes(prev => resetRecursive(prev));
      setIsBatchGeneratingImages(false);
      setIsBatchGeneratingVideos(false);
      setIsBatchUpscaling(false);
  };

  const handleDownloadAllImages = async () => {
    setIsDownloading(true);
    const zip = new JSZip();
    let count = 0;
    const traverse = (list: StoryboardScene[], prefix: string) => {
        list.forEach((scene, i) => {
            if (scene.imageUrls.length > 0) {
                const imgUrl = scene.selectedImageForVideo || scene.imageUrls[0];
                const data = imgUrl.split(',')[1];
                zip.file(`${prefix}_${i+1}_${scene.id.substring(0,4)}.png`, data, { base64: true });
                count++;
            }
            if (scene.shots) traverse(scene.shots, `${prefix}_${i+1}_shot`);
        });
    };
    traverse(scenes, "scene");
    if (count > 0) {
        const content = await zip.generateAsync({ type: "blob" });
        saveAs(content, "storyboard_images.zip");
    } else {
        alert("No images to download.");
    }
    setIsDownloading(false);
  };

  const handleDownloadAllVideos = async () => {
    setIsDownloading(true);
    const zip = new JSZip();
    let count = 0;
    const traverse = async (list: StoryboardScene[], prefix: string) => {
        for(let i=0; i<list.length; i++) {
            const scene = list[i];
            const videoUrl = scene.upscaledVideoUrl || scene.videoUrl;
            if (videoUrl) {
                try {
                    let data: string;
                    if (videoUrl.startsWith('http')) {
                        const blob = await fetch(videoUrl).then(r => r.blob());
                        const base64 = await blobToDataUrl(blob);
                        data = base64.split(',')[1];
                    } else {
                        data = videoUrl.split(',')[1];
                    }
                    zip.file(`${prefix}_${i+1}_video.mp4`, data, { base64: true });
                    count++;
                } catch (e) {
                    console.error(`Failed to download video for ${prefix} ${i+1}`, e);
                }
            }
            if (scene.shots) await traverse(scene.shots, `${prefix}_${i+1}_shot`);
        }
    };
    await traverse(scenes, "scene");
    if (count > 0) {
        const content = await zip.generateAsync({ type: "blob" });
        saveAs(content, "storyboard_videos.zip");
    } else {
        alert("No videos to download.");
    }
    setIsDownloading(false);
  };

  const handleSaveProject = async (filename: string, compactMode: boolean) => {
    setIsSaveModalVisible(false);
    setIsSaving(true);
    try {
        const zip = new JSZip();
        const assetsFolder = zip.folder("assets");
        
        const processAsset = async (dataUrl: string | undefined, filenamePrefix: string): Promise<string | undefined> => {
            if (!dataUrl) return undefined;
            if (dataUrl.startsWith('data:')) {
                const [meta, base64] = dataUrl.split(',');
                const ext = meta.includes('image') ? 'png' : 'mp4'; 
                const fname = `${filenamePrefix}_${crypto.randomUUID().slice(0,8)}.${ext}`;
                assetsFolder?.file(fname, base64, { base64: true });
                return `assets/${fname}`;
            }
            if (compactMode) {
                return dataUrl;
            } else {
                try {
                    const response = await fetch(dataUrl);
                    if (!response.ok) throw new Error("Fetch failed");
                    const blob = await response.blob();
                    const ext = blob.type.includes('video') ? 'mp4' : 'png';
                    const fname = `${filenamePrefix}_${crypto.randomUUID().slice(0,8)}.${ext}`;
                    assetsFolder?.file(fname, blob);
                    return `assets/${fname}`;
                } catch (e) {
                    console.warn(`Failed to download asset for full backup: ${dataUrl}. Falling back to URL link.`);
                    return dataUrl;
                }
            }
        };

        const processedCharacters = await Promise.all(characters.map(async (char) => ({
            ...char,
            assetUrl: await processAsset(char.assetUrl, `char_${char.id}`)
        })));

        const processedSavedCharacters = await Promise.all(savedCharacters.map(async (char) => ({
             ...char,
             assetUrl: await processAsset(char.assetUrl, `saved_char_${char.id}`)
        })));

        const processedSettings = await Promise.all(settings.map(async (setting) => {
             const newImageUrls = await Promise.all(setting.imageUrls.map((url, idx) => 
                processAsset(url, `setting_${setting.id}_${idx}`)
             ));
             const validUrls = newImageUrls.filter((u): u is string => !!u);
             return {
                 ...setting,
                 imageUrls: validUrls,
                 imageUrl: validUrls[0] || ''
             };
        }));

        const processScenesRecursive = async (list: StoryboardScene[]): Promise<StoryboardScene[]> => {
            return Promise.all(list.map(async (scene) => {
                const s = { ...scene };
                if (s.imageUrls && s.imageUrls.length > 0) {
                     s.imageUrls = (await Promise.all(s.imageUrls.map((url, idx) => 
                        processAsset(url, `scene_${s.id}_img_${idx}`)
                     ))).filter((u): u is string => !!u);
                }
                s.selectedImageForVideo = await processAsset(s.selectedImageForVideo, `scene_${s.id}_selected`);
                s.backgroundUrl = await processAsset(s.backgroundUrl, `scene_${s.id}_bg`);
                if (s.shots && s.shots.length > 0) s.shots = await processScenesRecursive(s.shots);
                if (s.extraCharacters) {
                    s.extraCharacters = await Promise.all(s.extraCharacters.map(async (ec) => ({
                        ...ec,
                        assetUrl: (await processAsset(ec.assetUrl, `scene_${s.id}_extra_${ec.id}`)) || ''
                    })));
                }
                if (s.videoUrl) {
                    s.videoUrl = await processAsset(s.videoUrl, `scene_${s.id}_vid`);
                    s.playableVideoUrl = s.videoUrl; 
                }
                return s;
            }));
        };

        const scenesToSave = await processScenesRecursive(scenes);

        const projectData: ProjectData = {
          characters: processedCharacters,
          savedCharacters: processedSavedCharacters,
          settings: processedSettings,
          storyboardStyle,
          storyboardTheme,
          storyboardPromptLanguage,
          storyboardScenes: scenesToSave,
        };

        zip.file("project.json", JSON.stringify(projectData));
        const content = await zip.generateAsync({ type: "blob" });
        saveAs(content, `${filename}.heaven`);

    } catch (err) {
        console.error("Failed to save project", err);
        alert("Failed to save project due to an error.");
    } finally {
        setIsSaving(false);
    }
  };

  const handleImportProject = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
        let data: ProjectData;
        const header = await new Promise<ArrayBuffer>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as ArrayBuffer);
            reader.onerror = reject;
            reader.readAsArrayBuffer(file.slice(0, 4));
        });
        const headerView = new Uint8Array(header);
        const isZip = headerView[0] === 0x50 && headerView[1] === 0x4B && headerView[2] === 0x03 && headerView[3] === 0x04;

        if (isZip) {
            const zip = await JSZip.loadAsync(file);
            const projectFile = zip.file("project.json");
            
            if (projectFile) {
                const jsonContent = await projectFile.async("string");
                data = JSON.parse(jsonContent) as ProjectData;
                
                const rehydrateAsset = async (path: string | undefined): Promise<string | undefined> => {
                    if (!path) return undefined;
                    if (!path.startsWith('assets/')) return path;
                    
                    const assetFile = zip.file(path);
                    if (assetFile) {
                        let mimeType = 'application/octet-stream';
                        const lowerPath = path.toLowerCase();
                        if (lowerPath.endsWith('.png')) mimeType = 'image/png';
                        else if (lowerPath.endsWith('.jpg') || lowerPath.endsWith('.jpeg')) mimeType = 'image/jpeg';
                        else if (lowerPath.endsWith('.webp')) mimeType = 'image/webp';
                        else if (lowerPath.endsWith('.mp4')) mimeType = 'video/mp4';
                        else if (lowerPath.endsWith('.mov')) mimeType = 'video/quicktime';

                        const buffer = await assetFile.async("arraybuffer");
                        const blob = new Blob([buffer], { type: mimeType });
                        return await blobToDataUrl(blob);
                    }
                    return path; 
                };

                data.characters = await Promise.all(data.characters.map(async c => ({ ...c, assetUrl: await rehydrateAsset(c.assetUrl) })));
                data.savedCharacters = await Promise.all(data.savedCharacters.map(async c => ({ ...c, assetUrl: await rehydrateAsset(c.assetUrl) })));
                
                data.settings = await Promise.all(data.settings.map(async s => {
                    const urls = s.imageUrls || (s.imageUrl ? [s.imageUrl] : []);
                    const rehydratedUrls = await Promise.all(urls.map(rehydrateAsset));
                    const validUrls = rehydratedUrls.filter((u): u is string => !!u);
                    return { ...s, imageUrls: validUrls, imageUrl: validUrls[0] || '' };
                }));

                 const rehydrateScenesRecursive = async (list: StoryboardScene[]): Promise<StoryboardScene[]> => {
                    return Promise.all(list.map(async (scene) => {
                        const hydratedScene = {
                            ...geminiService.mapSceneDefaults(scene),
                            id: scene.id,
                            imageUrls: scene.imageUrls || [],
                            shots: scene.shots || []
                        };

                        hydratedScene.selectedImageForVideo = await rehydrateAsset(scene.selectedImageForVideo);
                        hydratedScene.backgroundUrl = await rehydrateAsset(scene.backgroundUrl);
                        hydratedScene.videoUrl = await rehydrateAsset(scene.videoUrl);
                        if (hydratedScene.videoUrl) hydratedScene.playableVideoUrl = hydratedScene.videoUrl;

                        if (scene.imageUrls) {
                            hydratedScene.imageUrls = (await Promise.all(scene.imageUrls.map(rehydrateAsset))).filter((u): u is string => !!u);
                        }
                        if (scene.extraCharacters) {
                            hydratedScene.extraCharacters = await Promise.all(scene.extraCharacters.map(async ec => ({
                                ...ec,
                                assetUrl: (await rehydrateAsset(ec.assetUrl)) || ''
                            })));
                        }
                        if (scene.shots) {
                            hydratedScene.shots = await rehydrateScenesRecursive(scene.shots);
                        }
                        return hydratedScene;
                    }));
                };
                data.storyboardScenes = await rehydrateScenesRecursive(data.storyboardScenes);
            } else {
                throw new Error("Not a valid Heaven Studios Project (missing project.json)");
            }

        } else {
             const text = await file.text();
             data = JSON.parse(text) as ProjectData;
             if(data.settings) {
                 data.settings = data.settings.map(s => ({...s, imageUrls: s.imageUrls || [s.imageUrl]}));
             }
             data.storyboardScenes = data.storyboardScenes.map(s => ({
                 ...geminiService.mapSceneDefaults(s),
                 id: s.id,
                 imageUrls: s.imageUrls || [],
                 shots: s.shots || []
             }));
        }

        setCharacters(data.characters || []);
        setSavedCharacters(data.savedCharacters || []);
        setSettings(data.settings || []);
        setStoryboardStyle(data.storyboardStyle || '');
        setStoryboardTheme(data.storyboardTheme || '');
        setStoryboardPromptLanguage(data.storyboardPromptLanguage || 'English');
        setScenes(data.storyboardScenes || []);
        alert("Project loaded successfully!");

    } catch (err) {
        console.error("Failed to load project", err);
        alert("Failed to load project file.");
    }
  };

  const handleGenerateThumbnail = async () => {
      setIsGeneratingThumbnail(true);
      setTimeout(() => {
          setIsGeneratingThumbnail(false);
          setThumbnailError("Feature temporarily unavailable in this version.");
      }, 1000);
  };


  return (
    <div className="flex h-screen overflow-hidden bg-gray-100 font-sans text-gray-900">
       {AppConfig.LOGIN_REQUIRED && !currentUser && <Login onLoginSuccess={handleLoginSuccess} />}
       <Sidebar activeModule={activeModule} onNavigate={setActiveModule} />
       <div className="flex-1 flex flex-col min-w-0">
          <Header 
            currentUser={currentUser || 'Guest'} 
            activeModule={activeModule}
            onLogout={handleLogout}
            onSaveProject={() => setIsSaveModalVisible(true)}
            onImportProject={() => document.getElementById('project-import-input')?.click()}
            onViewStoryboard={() => setIsStoryboardViewerVisible(true)}
            usage={usage}
          />
          <input type="file" id="project-import-input" accept=".heaven,.json" className="hidden" onChange={handleImportProject} />
          <main className="flex-1 overflow-y-auto p-6">
             <div style={{ display: activeModule === 'assets' ? 'block' : 'none' }}>
                 <CharacterDesignPanel
                    characters={characters}
                    settings={settings}
                    onAddNewCharacter={handleAddNewCharacter}
                    onAddNewCharacterWithAsset={handleAddNewCharacterWithAsset}
                    onAddNewSettingWithAsset={handleAddNewSettingWithAsset}
                    onAddImagesToSetting={handleAddImagesToSetting}
                    onDeleteCharacter={handleDeleteCharacter}
                    onDeleteSetting={handleDeleteSetting}
                    onCharacterNameChange={(id, val) => handleCharacterUpdate(id, 'name', val)}
                    onCharacterDescriptionChange={(id, val) => handleCharacterUpdate(id, 'description', val)}
                    onCharacterIsMainChange={(id, val) => handleCharacterUpdate(id, 'isMainCharacter', val)}
                    onCharacterAssetChange={(id, val) => handleCharacterUpdate(id, 'assetUrl', val)}
                    onCharacterAgeChange={(id, val) => handleCharacterUpdate(id, 'age', val)}
                    onSettingNameChange={(id, val) => handleSettingUpdate(id, 'name', val)}
                    onSaveAssets={handleSaveCharacters}
                    onViewImage={setViewingImage}
                    error={characterError}
                 />
             </div>
             <div style={{ display: activeModule === 'script-processor' ? 'block' : 'none' }}>
                 <DirectorAgentPanel
                    savedCharacters={savedCharacters}
                    savedSettings={settings}
                    onAddCharacter={handleAddNewCharacterWithAsset}
                    onAddSetting={handleAddNewSettingWithAsset}
                    onCreateStoryboard={handleCreateStoryboardFromScript}
                 />
             </div>
             <div style={{ display: activeModule === 'storyboard' ? 'block' : 'none' }}>
                 <div className="space-y-6 max-w-6xl mx-auto">
                     <StoryboardActionHeader
                        styleFile={projectStyleFile}
                        onStyleFileChange={setProjectStyleFile}
                        styleText={storyboardStyle}
                        onStyleTextChange={setStoryboardStyle}
                        onGenerateAllImages={handleBatchGenerateImages}
                        onPickAllImages={() => setScenes(s => s.map(x => (!x.selectedImageForVideo && x.imageUrls.length > 0) ? {...x, selectedImageForVideo: x.imageUrls[0]} : x))}
                        onGenerateAllVideos={handleBatchGenerateVideos}
                        onUpscaleAllVideos={handleBatchUpscaleVideos}
                        onDownloadAllImages={handleDownloadAllImages}
                        onDownloadAllVideos={handleDownloadAllVideos}
                        onStopAll={handleStopAll}
                        isGeneratingImages={isBatchGeneratingImages}
                        isGeneratingVideos={isBatchGeneratingVideos}
                        isUpscaling={isBatchUpscaling}
                        isDownloading={isDownloading}
                        onViewStoryboard={() => setIsStoryboardViewerVisible(true)}
                        isViewDisabled={scenes.length === 0}
                     />
                     <OutputPanel
                        scenes={scenes}
                        isLoading={storyboardLoading}
                        error={storyboardError}
                        savedCharacters={savedCharacters}
                        onAddScene={handleAddScene}
                        onGenerateImage={handleGenerateImage}
                        onCancelImage={handleCancelImage}
                        onUploadCustomImage={handleUploadCustomImage}
                        onSceneDataChange={handleSceneDataChange}
                        onUpdateSceneCharacters={handleUpdateSceneCharacters}
                        onDeleteImage={(sid, url) => setScenes(prev => updateSceneOrShot(prev, sid, s => ({...s, imageUrls: s.imageUrls.filter(u => u !== url)})))}
                        onViewImage={setViewingImage}
                        onEnrichScene={handleEnrichScene}
                        onSelectImageForVideo={(sid, url) => handleSceneDataChange(sid, 'selectedImageForVideo', url)}
                        onGenerateVideo={handleGenerateVideo}
                        onCancelVideo={handleCancelVideo}
                        onToggleVideoUpscale={(sid) => handleSceneDataChange(sid, 'shouldUpscaleVideo', !findSceneOrShot(scenes, sid)?.shouldUpscaleVideo)}
                        onUpscaleVideo={handleUpscaleVideo}
                        onBreakdownScene={handleBreakdownScene}
                        onToggleExpansion={handleToggleSceneExpansion}
                        onAddShot={handleAddShot}
                        onDeleteShot={handleDeleteShot}
                        onDeleteScene={handleDeleteScene}
                     />
                 </div>
             </div>
             <div style={{ display: activeModule === 'thumbnails' ? 'block' : 'none' }}>
                 <ThumbnailCopyPanel
                    ingredientFiles={thumbnailIngredientFiles}
                    setIngredientFiles={setThumbnailIngredientFiles}
                    sampleFile={thumbnailSampleFile}
                    setSampleFile={setThumbnailSampleFile}
                    userPrompt={thumbnailUserPrompt}
                    setUserPrompt={setThumbnailUserPrompt}
                    onGenerate={handleGenerateThumbnail}
                    generatedThumbnail={generatedThumbnail}
                    isLoading={isGeneratingThumbnail}
                    error={thumbnailError}
                 />
             </div>
             <div style={{ display: activeModule === 'landscape' ? 'block' : 'none' }}>
                 <LandscapeViewPanel />
             </div>
          </main>
       </div>
       {isSaving && (
          <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
             <div className="text-center text-white">
                <i className="fas fa-spinner fa-spin text-4xl mb-2"></i>
                <p className="font-bold text-xl">Compressing & Saving Project...</p>
             </div>
          </div>
       )}
       {viewingImage && <ImageModal imageUrl={viewingImage} onClose={() => setViewingImage(null)} />}
       {isStoryboardViewerVisible && <StoryboardViewer scenes={scenes} onClose={() => setIsStoryboardViewerVisible(false)} />}
       {isSaveModalVisible && <SaveProjectModal onSave={handleSaveProject} onClose={() => setIsSaveModalVisible(false)} />}
    </div>
  );
}

export default App;
