
import React, { useState, useRef } from 'react';
import { GenerationData, GeneratedImage, GenerationTarget, AspectRatio, ReferenceAsset, ApiProvider, MasterAsset } from '../types';
import ControlPanel, { CAMERA_ANGLES } from './ControlPanel';
import ImageGallery from './ImageGallery';
import { generateVisual, describeImage, generateCharacterSheet, generateVisualWithCustomApi } from '../services/geminiService';
import JSZip from 'jszip';

interface WorkspaceProps {
    generationData: GenerationData;
    setGenerationData: React.Dispatch<React.SetStateAction<GenerationData>>;
    onImportProject: () => void;
    onSaveProject: () => void;
}

const shotOptions = [
    'Full body portrait, standing, happy!',
    'Close-up portrait, funny face',
    'Action pose, jumping for joy',
    'Side profile, looking curious',
    'Waving hello',
    'Sitting on a giant mushroom',
    'Custom...',
];

const sceneShotOptions = [
    'Wide-angle shot from a distance',
    'Close-up on a key architectural detail',
    'View from a different time of day (e.g., dawn, night)',
    'A bird\'s-eye view',
    'Ground-level perspective',
    'Shot during a different season (e.g., winter, summer)',
    'Custom...',
];

const sceneOptions = [
    'Magical Library',
    'Bustling Town Square',
    'Cozy Tavern',
    'Candy Castle Throne Room',
    'Enchanted Forest Clearing',
    'Sparkling Mountain Pass',
    'Custom...',
];

const Workspace: React.FC<WorkspaceProps> = ({ generationData, setGenerationData, onImportProject, onSaveProject }) => {
    const [generationTarget, setGenerationTarget] = useState<GenerationTarget>('new_shot');
    const [specificPrompt, setSpecificPrompt] = useState<string>('');
    const [selectedShot, setSelectedShot] = useState<string>(shotOptions[0]);
    const [selectedScene, setSelectedScene] = useState<string>(sceneOptions[0]);
    const [aspectRatio, setAspectRatio] = useState<AspectRatio>('1:1');
    const [isLoading, setIsLoading] = useState(false);
    const [isAnalyzing, setIsAnalyzing] = useState<'character' | 'style' | null>(null);
    const [referenceAsset, setReferenceAsset] = useState<ReferenceAsset | null>(null);
    const [editReferenceAsset, setEditReferenceAsset] = useState<ReferenceAsset | null>(null);
    const [apiProvider, setApiProvider] = useState<ApiProvider>('gemini');


    const charFileInputRef = useRef<HTMLInputElement>(null);
    const styleFileInputRef = useRef<HTMLInputElement>(null);
    const refFileInputRef = useRef<HTMLInputElement>(null);
    const editRefFileInputRef = useRef<HTMLInputElement>(null);

    const addImage = (image: GeneratedImage) => {
        setGenerationData(prev => ({
            ...prev,
            images: [image, ...prev.images]
        }));
    };

    const handleUpdateImageName = (id: string, name: string) => {
        setGenerationData(prev => ({
            ...prev,
            images: prev.images.map(img => img.id === id ? { ...img, name } : img)
        }));
    };

    const handleDeleteImage = (id: string) => {
        if (referenceAsset?.id === id) {
            setReferenceAsset(null);
        }
        if (editReferenceAsset?.id === id) {
            setEditReferenceAsset(null);
        }
        setGenerationData(prev => ({
            ...prev,
            images: prev.images.filter(img => img.id !== id && img.parentId !== id)
        }));
    };
    
    const handleSetReferenceAsset = (asset: ReferenceAsset) => {
        setReferenceAsset(asset);
        if (asset.generationTarget === 'world_scene') {
             // If it's a scene, we might want to generate variations OF that scene, 
             // so we can stay in world_scene target, or switch to new_shot.
             // For now, let's default to new_shot but allow switching back manually if needed for pro angles.
             // Actually, sticking to world_scene makes the "Pro Angles" button visible immediately.
            setGenerationTarget('world_scene'); 
            setSelectedShot(sceneShotOptions[0]);
        } else {
            setGenerationTarget('new_shot'); // Automatically switch to "New Shot" mode for characters
            setSelectedShot(shotOptions[0]);
        }
    };

    const handleEditImage = (asset: GeneratedImage) => {
        setReferenceAsset(asset);
        setGenerationTarget('edit_image');
        setSpecificPrompt('');
    };

    const handlePromoteToMaster = (asset: GeneratedImage) => {
        const isScene = asset.generationTarget === 'world_scene';
        const masterType = isScene ? 'scene' : 'character';
        
        const newMasterAsset: MasterAsset = {
            id: `master-${Date.now()}`,
            type: masterType,
            name: asset.name || (isScene ? 'New Location' : 'New Character'),
            description: asset.prompt,
            mainImage: asset,
            variations: []
        };

        setGenerationData(prev => ({
            ...prev,
            masterAssets: [...prev.masterAssets, newMasterAsset]
        }));

        alert(`Successfully promoted to Master World as a ${masterType}!`);
    };
    
    const handleClearReferenceAsset = () => {
        setReferenceAsset(null);
        // If we were in world_scene mode forced by reference, reset to a default.
        // We don't reset if it was 'edit_image' because the user might want to upload a new reference immediately.
        if (generationTarget === 'world_scene') {
            setGenerationTarget('new_shot');
        }
        setSelectedShot(shotOptions[0]);
    };

    const handleDownloadAllImages = async () => {
        if (generationData.images.length === 0) {
            alert("No images to download.");
            return;
        }
        setIsLoading(true);
        try {
            const zip = new JSZip();
            const imgFolder = zip.folder("images");
            
            generationData.images.forEach((img, index) => {
                // Extract generic base64 data
                const base64Data = img.src.split(',')[1];
                // Guess extension from mime type header if possible, default to png
                let extension = 'png';
                const mimeMatch = img.src.match(/data:image\/(.*?);/);
                if (mimeMatch) {
                    extension = mimeMatch[1] === 'jpeg' ? 'jpg' : mimeMatch[1];
                }
                
                // Create a safe filename
                let safeName = (img.name || img.prompt || `image_${index}`)
                    .replace(/[^a-z0-9]/gi, '_')
                    .substring(0, 50);
                
                const filename = `${safeName}_${img.id.slice(-4)}.${extension}`;
                imgFolder?.file(filename, base64Data, {base64: true});
            });

            const content = await zip.generateAsync({type: "blob"});
            const href = URL.createObjectURL(content);
            const link = document.createElement('a');
            link.href = href;
            link.download = `Project_Images_${new Date().toISOString().slice(0,10)}.zip`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(href);

        } catch (error) {
            console.error("Failed to zip images:", error);
            alert("Failed to create zip file for images.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>, target: 'character' | 'style' | 'reference' | 'edit_reference') => {
        const file = event.target.files?.[0];
        if (!file || !file.type.startsWith('image/')) {
            alert('Please select a valid image file.');
            return;
        }

        if (target !== 'reference' && target !== 'edit_reference') {
            setIsAnalyzing(target);
        }

        const reader = new FileReader();
        reader.onloadend = async () => {
            try {
                const dataUrl = reader.result as string;
                const base64String = dataUrl.split(',')[1];

                if (target === 'character') {
                    setGenerationData(p => ({
                        ...p,
                        mainCharacterImage: {
                            src: dataUrl,
                            base64: base64String,
                            mimeType: file.type,
                        }
                    }));
                } else if (target === 'reference') {
                    const refImage: GeneratedImage = {
                        id: 'upload-' + Date.now(),
                        src: dataUrl,
                        prompt: 'Uploaded Reference Image',
                        generationTarget: 'new_shot', // Generic, doesn't strictly matter for pure reference
                        name: file.name
                    };
                    setReferenceAsset(refImage);
                    setGenerationTarget('edit_image'); // Ensure we are in edit mode
                    return; // Skip analysis for reference upload
                } else if (target === 'edit_reference') {
                    const refImage: GeneratedImage = {
                        id: 'upload-edit-ref-' + Date.now(),
                        src: dataUrl,
                        prompt: 'Uploaded Edit Style Reference',
                        generationTarget: 'new_shot',
                        name: file.name
                    };
                    setEditReferenceAsset(refImage);
                    return;
                }

                const description = await describeImage(base64String, file.type);
                if (description !== 'Failed to analyze image.') {
                    if (target === 'character') {
                        setGenerationData(p => ({ ...p, mainCharacterDescription: description }));
                    } else if (target === 'style') {
                        setGenerationData(p => ({ ...p, styleDescription: description }));
                    }
                } else {
                    alert('Image analysis failed. Please try another image.');
                }
            } catch (error) {
                alert('An error occurred during image analysis.');
            } finally {
                if (target !== 'reference' && target !== 'edit_reference') {
                    setIsAnalyzing(null);
                }
            }
        };
        reader.readAsDataURL(file);
        event.target.value = '';
    };

    const handleRemoveCharacterImage = () => {
        setGenerationData(p => ({ ...p, mainCharacterImage: null }));
    };

    const handleGenerate = async () => {
        setIsLoading(true);

        let finalPrompt: string;
        if (generationTarget === 'new_shot') {
            const currentShotOptions = referenceAsset?.generationTarget === 'world_scene' ? sceneShotOptions : shotOptions;
            finalPrompt = selectedShot === 'Custom...' ? specificPrompt : selectedShot;
        } else if (generationTarget === 'world_scene') {
             if (referenceAsset) {
                 // If we have a reference asset and we are in world_scene, we are likely doing a variation.
                 // Use the specific prompt if available, or a default variation prompt.
                 finalPrompt = specificPrompt || "A different angle of this location.";
             } else {
                 finalPrompt = selectedScene === 'Custom...' ? specificPrompt : selectedScene;
             }
        } else {
            finalPrompt = specificPrompt;
        }
        
        const generationOptions = {
            ...generationData,
            specificPrompt: finalPrompt,
            generationTarget,
            aspectRatio: aspectRatio,
            referenceAsset,
            editReferenceAsset: generationTarget === 'edit_image' ? editReferenceAsset : null,
        };

        let newImageUrl: string;
        if (apiProvider === 'custom') {
            newImageUrl = await generateVisualWithCustomApi(generationOptions);
        } else {
            newImageUrl = await generateVisual(generationOptions);
        }
        
        if (!newImageUrl.includes('placeholder.com')) {
            // Determine the actual target. If we edited an image, we want it to stay in its original group.
            const isEdited = generationTarget === 'edit_image';
            const actualTarget = (isEdited && referenceAsset) ? referenceAsset.generationTarget : generationTarget;

            // Determine parent ID. 
            // If it's a world scene variation (standard): use ref ID.
            // If it's a world scene EDIT: still probably want to group it with original scene as a variation.
            let parentId: string | undefined;
            if (actualTarget === 'world_scene' && referenceAsset?.generationTarget === 'world_scene') {
                 // If the reference itself has a parent, it's already a child.
                 // Group the new edit/variation under the SAME MASTER parent to avoid deep nesting.
                 parentId = referenceAsset.parentId || referenceAsset.id;
            }

            const newImage: GeneratedImage = {
                id: new Date().toISOString(),
                src: newImageUrl,
                prompt: finalPrompt,
                generationTarget: actualTarget,
                parentId: parentId,
                isEdited: isEdited
            };
            addImage(newImage);
        } else {
            alert("Failed to generate image. Please try again.");
        }

        setIsLoading(false);
    };
    
    const handleGenerateSceneVariations = async () => {
        if (!referenceAsset || referenceAsset.generationTarget !== 'world_scene') return;
        setIsLoading(true);

        // We will generate them one by one to avoid overwhelming the browser/API, 
        // but push them to state as they complete so the user sees progress.
        for (const angle of CAMERA_ANGLES) {
            const generationOptions = {
                ...generationData,
                specificPrompt: angle.prompt,
                generationTarget: 'world_scene' as GenerationTarget, // Keep them grouped under World Scene
                aspectRatio: '16:9' as AspectRatio, // Forced to 16:9 for pro angles
                referenceAsset,
            };

            try {
                let newImageUrl: string;
                if (apiProvider === 'custom') {
                    newImageUrl = await generateVisualWithCustomApi(generationOptions);
                } else {
                    newImageUrl = await generateVisual(generationOptions);
                }

                if (!newImageUrl.includes('placeholder.com')) {
                    // Ensure all variations of a scene are grouped under the MASTER scene.
                    // If referenceAsset is already a child, use ITS parent.
                    const masterId = referenceAsset.parentId || referenceAsset.id;

                    const newImage: GeneratedImage = {
                        id: new Date().toISOString() + Math.random(), // Ensure unique ID even if fast
                        src: newImageUrl,
                        prompt: angle.prompt,
                        generationTarget: 'world_scene',
                        name: `${referenceAsset.name || 'Scene'} - ${angle.label}`,
                        parentId: masterId
                    };
                    addImage(newImage);
                }
            } catch (e) {
                console.error(`Failed to generate angle ${angle.id}`, e);
            }
        }

        setIsLoading(false);
    };
    
    const handleGenerateCharacterSheet = async (sourceImage: GeneratedImage) => {
        setIsLoading(true);
        
        try {
            const [header, base64] = sourceImage.src.split(',');
            if (!header || !base64) {
                throw new Error("Invalid image source format.");
            }
            const mimeType = header.match(/:(.*?);/)?.[1] || 'image/jpeg';
            
            const newImageUrl = await generateCharacterSheet({ base64, mimeType });

            if (!newImageUrl.includes('placeholder.com')) {
                const newImage: GeneratedImage = {
                    id: new Date().toISOString(),
                    src: newImageUrl,
                    prompt: `Character sheet for '${sourceImage.name || sourceImage.prompt}'`,
                    generationTarget: 'new_shot', // Reusing this category for simplicity
                    name: `${sourceImage.name || 'Character'} - Turnaround`,
                };
                addImage(newImage);
            } else {
                alert("Failed to generate character sheet. Please try again.");
            }
        } catch (error) {
            console.error("Error in character sheet generation process:", error);
            alert("An error occurred while generating the character sheet.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleGenerationTargetChange = (target: GenerationTarget) => {
        setGenerationTarget(target);
        // Reset specific prompt when changing target to avoid confusion
        setSpecificPrompt('');
        // If leaving edit mode, might want to clear the edit reference to avoid confusion next time
        if (target !== 'edit_image') {
             setEditReferenceAsset(null);
        }
    };
    
    const currentShotOptions = referenceAsset?.generationTarget === 'world_scene' ? sceneShotOptions : shotOptions;

    return (
        <div className="flex h-full bg-sky-100 text-slate-800">
            <ControlPanel 
                generationData={generationData}
                onGenerationDataChange={setGenerationData}
                
                generationTarget={generationTarget}
                setGenerationTarget={handleGenerationTargetChange}
                
                specificPrompt={specificPrompt}
                onSpecificPromptChange={setSpecificPrompt}
                
                aspectRatio={aspectRatio}
                onAspectRatioChange={setAspectRatio}

                selectedShot={selectedShot}
                onSelectedShotChange={setSelectedShot}
                shotOptions={currentShotOptions}
                
                selectedScene={selectedScene}
                onSelectedSceneChange={setSelectedScene}
                sceneOptions={sceneOptions}

                isGenerating={isLoading}
                onGenerate={handleGenerate}
                onGenerateSceneVariations={handleGenerateSceneVariations}
                onImportProject={onImportProject}
                onSaveProject={onSaveProject}
                onDownloadAllImages={handleDownloadAllImages}

                onAnalyzeCharacter={() => charFileInputRef.current?.click()}
                onAnalyzeStyle={() => styleFileInputRef.current?.click()}
                onRemoveCharacterImage={handleRemoveCharacterImage}
                isAnalyzing={isAnalyzing}

                referenceAsset={referenceAsset}
                onClearReferenceAsset={handleClearReferenceAsset}
                onUploadReference={() => refFileInputRef.current?.click()}

                editReferenceAsset={editReferenceAsset}
                onUploadEditReference={() => editRefFileInputRef.current?.click()}
                onClearEditReference={() => setEditReferenceAsset(null)}

                apiProvider={apiProvider}
                onApiProviderChange={setApiProvider}
            />
            <main className="flex-1 overflow-y-auto">
                <ImageGallery 
                    images={generationData.images}
                    isLoading={isLoading}
                    onUpdateImageName={handleUpdateImageName}
                    onDeleteImage={handleDeleteImage}
                    onSetReference={handleSetReferenceAsset}
                    onEditImage={handleEditImage}
                    onGenerateCharacterSheet={handleGenerateCharacterSheet}
                    onPromoteToMaster={handlePromoteToMaster}
                    referenceAssetId={referenceAsset?.id}
                />
            </main>
            <input type="file" ref={charFileInputRef} onChange={(e) => handleFileChange(e, 'character')} accept="image/*" className="hidden" />
            <input type="file" ref={styleFileInputRef} onChange={(e) => handleFileChange(e, 'style')} accept="image/*" className="hidden" />
            <input type="file" ref={refFileInputRef} onChange={(e) => handleFileChange(e, 'reference')} accept="image/*" className="hidden" />
            <input type="file" ref={editRefFileInputRef} onChange={(e) => handleFileChange(e, 'edit_reference')} accept="image/*" className="hidden" />
        </div>
    );
};

export default Workspace;