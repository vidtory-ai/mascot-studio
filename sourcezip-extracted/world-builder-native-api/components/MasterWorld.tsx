
import React, { useState, useRef } from 'react';
import { GenerationData, MasterAsset, GeneratedImage, MasterGroup, MasterAssetType } from '../types';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { Textarea } from './ui/Textarea';
import { Input } from './ui/Input';
import { Select } from './ui/Select';
import { generateAssetVariation } from '../services/geminiService';
import { 
    GlobeAltIcon, UserCircleIcon, CubeTransparentIcon, XMarkIcon, 
    SparklesIcon, ArrowDownTrayIcon, FolderPlusIcon, ChevronDownIcon, 
    ChevronRightIcon, ArrowUpOnSquareIcon, PencilSquareIcon, TrashIcon,
    FilmIcon
} from '@heroicons/react/24/solid';

const CAMERA_ANGLES = [
    { id: 'ESTABLISH_WIDE', label: 'Wide Establish', prompt: 'ESTABLISH_WIDE: Wide establishing shot from a high angle (approx 4m elevation). 24mm lens. Composition focused on leading lines and rule of thirds. Mood: welcoming, daytime.' },
    { id: 'BIRDS_EYE_CALM', label: 'Bird\'s Eye', prompt: 'BIRDS_EYE_CALM: Bird\'s eye view from very high up (approx 12m), top-down. 35mm lens. Calm overview, daytime.' },
    { id: 'EYELEVEL_APPROACH', label: 'Eye-Level Approach', prompt: 'EYELEVEL_APPROACH: Wide eye-level shot on an approaching path. 28mm lens. Leading lines composition. Curious mood.' },
    { id: 'OTS_COMPANION', label: 'Over-The-Shoulder', prompt: 'OTS_COMPANION: Medium over-the-shoulder shot. 50mm lens with shallow depth of field. Friendly daytime conversation feel.' },
    { id: 'POV_LOOK_DOWN', label: 'POV Look Down', prompt: 'POV_LOOK_DOWN: POV shot looking down at details (like water or ground), slightly tilted angle. 35mm lens. Curious mood.' },
    { id: 'LOW_HERO', label: 'Low Hero Angle', prompt: 'LOW_HERO: Low angle hero shot (approx 0.3m height), looking upwards at the environment. 24mm lens. Awe-inspiring, soft daylight.' },
    { id: 'DETAIL_FLOWERS', label: 'Detail Insert', prompt: 'DETAIL_FLOWERS: Extreme close-up insert shot (e.g., of flowers or small textures). 70mm lens, shallow bokeh. Delightful mood.' },
    { id: 'FEET_STEPS', label: 'Close-up Steps', prompt: 'FEET_STEPS: Close-up low angle shot of feet walking or ground texture. Dynamic, cute mood.' },
    { id: 'SYMMETRY_CENTER', label: 'Symmetry Center', prompt: 'SYMMETRY_CENTER: Medium-wide symmetrical shot with centered subject matter. 28mm lens, deep depth of field. "Wow" moment.' },
    { id: 'LATERAL_PATH_GLIDE', label: 'Lateral Glide', prompt: 'LATERAL_PATH_GLIDE: Medium-wide side view tracking shot (lateral glide). 35mm lens. Flowing mood.' },
    { id: 'SIGN_LAMP_CUTAWAY', label: 'Object Cutaway', prompt: 'SIGN_LAMP_CUTAWAY: Close-up cutaway shot of a specific object (like a sign or lamp). 50mm lens, rule of thirds composition. Informative.' },
];

interface MasterWorldProps {
    generationData: GenerationData;
    setGenerationData: React.Dispatch<React.SetStateAction<GenerationData>>;
}

const MasterWorld: React.FC<MasterWorldProps> = ({ generationData, setGenerationData }) => {
    const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [customPrompt, setCustomPrompt] = useState('');
    const [selectedImage, setSelectedImage] = useState<GeneratedImage | null>(null);
    const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(['ungrouped']));
    const [uploadType, setUploadType] = useState<MasterAssetType>('character');
    
    // Drag and Drop state
    const [dragOverGroupId, setDragOverGroupId] = useState<string | null>(null);

    // Inline Editing State
    const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
    const [tempGroupName, setTempGroupName] = useState('');

    const fileInputRef = useRef<HTMLInputElement>(null);
    const selectedAsset = generationData.masterAssets.find(a => a.id === selectedAssetId);

    const handleUpdateAsset = (id: string, updates: Partial<MasterAsset>) => {
        setGenerationData(prev => ({
            ...prev,
            masterAssets: prev.masterAssets.map(a => a.id === id ? { ...a, ...updates } : a)
        }));
    };

    const handleDeleteAsset = (id: string) => {
        setGenerationData(prev => ({
            ...prev,
            masterAssets: prev.masterAssets.filter(a => a.id !== id)
        }));
        if (selectedAssetId === id) setSelectedAssetId(null);
    };

    const handleDeleteVariation = (assetId: string, variationId: string) => {
        setGenerationData(prev => ({
            ...prev,
            masterAssets: prev.masterAssets.map(asset => {
                if (asset.id === assetId) {
                    return {
                        ...asset,
                        variations: asset.variations.filter(v => v.id !== variationId)
                    };
                }
                return asset;
            })
        }));
    };

    // --- Group Management ---

    const handleCreateGroup = () => {
        const newGroup: MasterGroup = {
            id: `group-${Date.now()}`,
            name: "New Group"
        };
        setGenerationData(prev => ({
            ...prev,
            masterAssetGroups: [...prev.masterAssetGroups, newGroup]
        }));
        setExpandedGroups(prev => new Set(prev).add(newGroup.id));
        
        // Automatically start editing the new group's name
        setEditingGroupId(newGroup.id);
        setTempGroupName(newGroup.name);
    };

    const startRenamingGroup = (e: React.MouseEvent, group: MasterGroup) => {
        e.stopPropagation(); // Prevent toggling accordion
        setEditingGroupId(group.id);
        setTempGroupName(group.name);
    };

    const saveGroupName = () => {
        if (editingGroupId && tempGroupName.trim() !== "") {
             setGenerationData(prev => ({
                ...prev,
                masterAssetGroups: prev.masterAssetGroups.map(g => g.id === editingGroupId ? { ...g, name: tempGroupName.trim() } : g)
            }));
        }
        setEditingGroupId(null);
        setTempGroupName("");
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            saveGroupName();
        } else if (e.key === 'Escape') {
            setEditingGroupId(null);
            setTempGroupName("");
        }
    };

    const handleDeleteGroup = (groupId: string) => {
        setGenerationData(prev => ({
            ...prev,
            masterAssetGroups: prev.masterAssetGroups.filter(g => g.id !== groupId),
            masterAssets: prev.masterAssets.map(a => a.groupId === groupId ? { ...a, groupId: undefined } : a)
        }));
    };

    const toggleGroup = (groupId: string) => {
        // Don't toggle if we are currently editing this group's name
        if (editingGroupId === groupId) return;

        setExpandedGroups(prev => {
            const newSet = new Set(prev);
            if (newSet.has(groupId)) newSet.delete(groupId);
            else newSet.add(groupId);
            return newSet;
        });
    };

    // --- Drag and Drop Handlers ---
    const handleDragStart = (e: React.DragEvent, assetId: string) => {
        e.dataTransfer.setData("text/plain", assetId);
        e.dataTransfer.effectAllowed = "move";
    };

    const handleDragOver = (e: React.DragEvent, groupId: string) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
        if (dragOverGroupId !== groupId) {
            setDragOverGroupId(groupId);
        }
    };

    const handleDrop = (e: React.DragEvent, targetGroupId: string | undefined) => {
        e.preventDefault();
        const draggedAssetId = e.dataTransfer.getData("text/plain");
        setDragOverGroupId(null);

        if (draggedAssetId) {
            setGenerationData(prev => ({
                ...prev,
                masterAssets: prev.masterAssets.map(a => a.id === draggedAssetId ? { ...a, groupId: targetGroupId } : a)
            }));
            if (targetGroupId) {
                 setExpandedGroups(prev => new Set(prev).add(targetGroupId));
            } else {
                 setExpandedGroups(prev => new Set(prev).add('ungrouped'));
            }
        }
    };

    // --- Asset Generation & Upload ---

    const triggerUpload = (type: MasterAssetType) => {
        setUploadType(type);
        fileInputRef.current?.click();
    };

    const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onloadend = () => {
            const dataUrl = reader.result as string;
            const newImage: GeneratedImage = {
                id: `upload-${Date.now()}`,
                src: dataUrl,
                prompt: 'Uploaded Master Asset',
                generationTarget: uploadType === 'character' ? 'new_shot' : 'world_scene',
                name: file.name.split('.')[0]
            };

            const newMasterAsset: MasterAsset = {
                id: `master-${Date.now()}`,
                type: uploadType,
                name: newImage.name || 'New Asset',
                description: 'Uploaded from local file.',
                mainImage: newImage,
                variations: []
            };

            setGenerationData(prev => ({
                ...prev,
                masterAssets: [...prev.masterAssets, newMasterAsset]
            }));
            setSelectedAssetId(newMasterAsset.id);
        };
        reader.readAsDataURL(file);
        event.target.value = '';
    };

    const handleGenerateVariation = async (prompt: string, type: 'turnaround' | 'pose' | 'accessory' | 'angle' | 'custom') => {
        if (!selectedAsset) return;
        setIsLoading(true);
        try {
            const [header, base64] = selectedAsset.mainImage.src.split(',');
            const mimeType = header.match(/:(.*?);/)?.[1] || 'image/jpeg';
            let finalPrompt = type === 'custom' ? customPrompt : prompt;
            const newImageUrl = await generateAssetVariation({ base64, mimeType }, finalPrompt);

            if (!newImageUrl.includes('placeholder.com')) {
                const newVariation: GeneratedImage = {
                    id: `var-${Date.now()}`,
                    src: newImageUrl,
                    prompt: finalPrompt,
                    generationTarget: 'new_shot',
                    name: `${type.charAt(0).toUpperCase() + type.slice(1)} Variation`,
                    parentId: selectedAsset.id
                };
                setGenerationData(prev => ({
                    ...prev,
                    masterAssets: prev.masterAssets.map(a => a.id === selectedAsset.id ? { ...a, variations: [newVariation, ...a.variations] } : a)
                }));
                if (type === 'custom') setCustomPrompt('');
            } else {
                alert("Failed to generate variation.");
            }
        } catch (e) {
            console.error("Variation generation failed:", e);
            alert("Error generating variation.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleGenerateProAngles = async () => {
        if (!selectedAsset || selectedAsset.type !== 'scene') return;
        setIsLoading(true);

        try {
            const [header, base64] = selectedAsset.mainImage.src.split(',');
            const mimeType = header.match(/:(.*?);/)?.[1] || 'image/jpeg';

            // Process sequentially to avoid rate limits and ensure orderly addition
            for (const angle of CAMERA_ANGLES) {
                try {
                    const newImageUrl = await generateAssetVariation({ base64, mimeType }, angle.prompt);
                    if (!newImageUrl.includes('placeholder.com')) {
                        const newVariation: GeneratedImage = {
                            id: `var-${angle.id}-${Date.now()}`,
                            src: newImageUrl,
                            prompt: angle.prompt,
                            generationTarget: 'world_scene',
                            name: angle.label,
                            parentId: selectedAsset.id
                        };

                         setGenerationData(prev => ({
                            ...prev,
                            masterAssets: prev.masterAssets.map(a => a.id === selectedAsset.id ? { ...a, variations: [newVariation, ...a.variations] } : a)
                        }));
                    }
                } catch (e) {
                    console.error(`Failed to generate angle ${angle.id}`, e);
                }
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleDownload = (src: string, name: string) => {
        const link = document.createElement('a');
        link.href = src;
        const safeName = name.replace(/[^a-z0-9_\-]/gi, '_');
        link.download = `${safeName}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const AssetRow: React.FC<{ asset: MasterAsset }> = ({ asset }) => (
        <div 
            draggable
            onDragStart={(e) => handleDragStart(e, asset.id)}
            onClick={() => setSelectedAssetId(asset.id)}
            className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-all group ${selectedAssetId === asset.id ? 'bg-indigo-100 ring-2 ring-indigo-400' : 'bg-white hover:bg-indigo-50 border border-slate-200'} active:opacity-50`}
        >
            <img src={asset.mainImage.src} alt={asset.name} className="w-10 h-10 rounded-md object-cover bg-slate-200 pointer-events-none flex-shrink-0" />
            <div className="flex-1 min-w-0 pointer-events-none">
                <p className="font-semibold text-sm text-slate-800 truncate">{asset.name}</p>
                <div className="flex items-center text-[10px] text-slate-500 uppercase tracking-wider font-bold">
                    {asset.type === 'character' ? <UserCircleIcon className="w-3 h-3 mr-1 text-teal-500" /> : <GlobeAltIcon className="w-3 h-3 mr-1 text-amber-500" />}
                    <span>{asset.type}</span>
                </div>
            </div>
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteAsset(asset.id);
                }}
                className="opacity-0 group-hover:opacity-100 p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-100 rounded-full transition-all flex-shrink-0"
                title="Delete from Master World"
            >
                <TrashIcon className="w-4 h-4" />
            </button>
        </div>
    );

    const renderAssetList = () => {
        const groupedAssets = generationData.masterAssetGroups.map(group => ({
            ...group,
            assets: generationData.masterAssets.filter(a => a.groupId === group.id)
        }));
        const ungroupedAssets = generationData.masterAssets.filter(a => !a.groupId);

        return (
            <div className="w-80 bg-slate-50 border-r border-slate-200 flex flex-col h-full" onDragLeave={() => setDragOverGroupId(null)}>
                <div className="p-4 border-b border-slate-200 flex-shrink-0">
                    <h2 className="text-xl font-extrabold text-slate-800 mb-4">Master Assets</h2>
                    <div className="grid grid-cols-2 gap-2 mb-2">
                        <Button onClick={() => triggerUpload('character')} variant="secondary" className="!text-xs !px-2">
                            <ArrowUpOnSquareIcon className="w-4 h-4 mr-1"/> Char
                        </Button>
                        <Button onClick={() => triggerUpload('scene')} variant="secondary" className="!text-xs !px-2">
                             <ArrowUpOnSquareIcon className="w-4 h-4 mr-1"/> Scene
                        </Button>
                    </div>
                    <Button onClick={handleCreateGroup} className="w-full !text-xs">
                        <FolderPlusIcon className="w-4 h-4 mr-2" /> New Group
                    </Button>
                </div>

                <div className="flex-1 overflow-y-auto p-2 space-y-2 custom-scrollbar">
                    {groupedAssets.map(group => (
                        <div 
                            key={group.id} 
                            className={`rounded-lg overflow-hidden transition-all border-2 ${dragOverGroupId === group.id ? 'border-indigo-500 bg-indigo-50' : 'border-transparent bg-slate-200/50'} group`}
                            onDragOver={(e) => handleDragOver(e, group.id)}
                            onDrop={(e) => handleDrop(e, group.id)}
                        >
                            <div className="flex items-center justify-between p-2 cursor-pointer hover:bg-slate-200 transition-colors" onClick={() => toggleGroup(group.id)}>
                                <div className="flex items-center font-bold text-sm text-slate-700 flex-1 min-w-0 mr-2">
                                    {expandedGroups.has(group.id) ? <ChevronDownIcon className="w-4 h-4 mr-1 flex-shrink-0 text-slate-400"/> : <ChevronRightIcon className="w-4 h-4 mr-1 flex-shrink-0 text-slate-400"/>}
                                    
                                    {editingGroupId === group.id ? (
                                        <input 
                                            type="text"
                                            autoFocus
                                            value={tempGroupName}
                                            onChange={(e) => setTempGroupName(e.target.value)}
                                            onBlur={saveGroupName}
                                            onKeyDown={handleKeyDown}
                                            onClick={(e) => e.stopPropagation()}
                                            className="flex-1 min-w-0 px-1 py-0.5 bg-white border-2 border-blue-400 rounded text-sm focus:outline-none"
                                        />
                                    ) : (
                                        <span className="truncate">{group.name} ({group.assets.length})</span>
                                    )}
                                </div>
                                {editingGroupId !== group.id && (
                                    <div className="flex items-center flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={(e) => startRenamingGroup(e, group)} className="text-slate-400 hover:text-blue-500 p-1" title="Rename Group">
                                            <PencilSquareIcon className="w-4 h-4" />
                                        </button>
                                        <button onClick={(e) => { e.stopPropagation(); handleDeleteGroup(group.id); }} className="text-slate-400 hover:text-red-500 p-1" title="Delete Group">
                                            <XMarkIcon className="w-4 h-4" />
                                        </button>
                                    </div>
                                )}
                            </div>
                            {expandedGroups.has(group.id) && (
                                <div className="p-2 space-y-2 min-h-[10px]">
                                    {group.assets.map(asset => <AssetRow key={asset.id} asset={asset} />)}
                                    {group.assets.length === 0 && <p className="text-xs text-slate-400 italic px-2 pointer-events-none">Drop assets here</p>}
                                </div>
                            )}
                        </div>
                    ))}

                    {/* Ungrouped Section */}
                    <div 
                        className={`rounded-lg overflow-hidden transition-all border-2 ${dragOverGroupId === 'ungrouped' ? 'border-indigo-500 bg-indigo-50' : 'border-transparent bg-slate-200/50'}`}
                        onDragOver={(e) => handleDragOver(e, 'ungrouped')}
                        onDrop={(e) => handleDrop(e, undefined)}
                    >
                         <div className="flex items-center p-2 cursor-pointer hover:bg-slate-200 transition-colors" onClick={() => toggleGroup('ungrouped')}>
                            <div className="flex items-center font-bold text-sm text-slate-700">
                                {expandedGroups.has('ungrouped') ? <ChevronDownIcon className="w-4 h-4 mr-1 text-slate-400"/> : <ChevronRightIcon className="w-4 h-4 mr-1 text-slate-400"/>}
                                Ungrouped ({ungroupedAssets.length})
                            </div>
                        </div>
                        {expandedGroups.has('ungrouped') && (
                            <div className="p-2 space-y-2 min-h-[10px]">
                                {ungroupedAssets.map(asset => <AssetRow key={asset.id} asset={asset} />)}
                                {ungroupedAssets.length === 0 && <p className="text-xs text-slate-400 italic px-2 pointer-events-none">Drop assets here to ungroup</p>}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    const renderDetailView = () => {
        if (!selectedAsset) {
            return (
                <div className="flex-1 flex items-center justify-center text-slate-400 bg-slate-100">
                    <div className="text-center">
                        <CubeTransparentIcon className="w-24 h-24 mx-auto mb-4 opacity-50" />
                        <p className="text-xl font-bold">Select an asset to refine it</p>
                    </div>
                </div>
            );
        }

        const isChar = selectedAsset.type === 'character';

        return (
            <div className="flex-1 overflow-y-auto p-6 bg-slate-100">
                <div className="max-w-5xl mx-auto space-y-6">
                    {/* Header & Main Info */}
                    <Card className="relative">
                        <button 
                            onClick={() => handleDeleteAsset(selectedAsset.id)}
                            className="absolute top-4 right-4 p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-all"
                            title="Remove from Master World"
                        >
                            <TrashIcon className="w-6 h-6" />
                        </button>
                        <div className="flex flex-col md:flex-row gap-6">
                            <div className="w-full md:w-1/3 flex-shrink-0">
                                <img 
                                    src={selectedAsset.mainImage.src} 
                                    alt={selectedAsset.name} 
                                    className="w-full rounded-xl shadow-sm cursor-zoom-in" 
                                    onClick={() => setSelectedImage(selectedAsset.mainImage)}
                                />
                            </div>
                            <div className="flex-1 space-y-4">
                                <div className="flex gap-4">
                                    <div className="flex-1">
                                        <Input 
                                            label="Asset Name" 
                                            id="asset-name" 
                                            value={selectedAsset.name} 
                                            onChange={(e) => handleUpdateAsset(selectedAsset.id, { name: e.target.value })}
                                            className="!text-2xl !font-extrabold"
                                        />
                                    </div>
                                    <div className="w-1/3">
                                         <Select
                                            label="Group"
                                            id="asset-group"
                                            value={selectedAsset.groupId || ''}
                                            onChange={(e) => handleUpdateAsset(selectedAsset.id, { groupId: e.target.value || undefined })}
                                        >
                                            <option value="">Ungrouped</option>
                                            {generationData.masterAssetGroups.map(g => (
                                                <option key={g.id} value={g.id}>{g.name}</option>
                                            ))}
                                        </Select>
                                    </div>
                                </div>
                                <div className="w-1/3">
                                     <Select
                                        label="Asset Type"
                                        id="asset-type"
                                        value={selectedAsset.type}
                                        onChange={(e) => handleUpdateAsset(selectedAsset.id, { type: e.target.value as MasterAssetType })}
                                    >
                                        <option value="character">Character</option>
                                        <option value="scene">Scene</option>
                                    </Select>
                                </div>
                                <Textarea 
                                    label="Core Description" 
                                    id="asset-desc" 
                                    value={selectedAsset.description} 
                                    onChange={(e) => handleUpdateAsset(selectedAsset.id, { description: e.target.value })}
                                    rows={5}
                                />
                            </div>
                        </div>
                    </Card>

                    {/* Action Panel */}
                    <Card>
                        <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center">
                            <SparklesIcon className="w-5 h-5 mr-2 text-indigo-500" />
                            Generate Variations
                        </h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                            {isChar ? (
                                <>
                                    <Button onClick={() => handleGenerateVariation("Generate a character turnaround sheet showing front, side, and back views. T-pose. White background.", 'turnaround')} disabled={isLoading}>
                                        Turnaround Sheet
                                    </Button>
                                    <Button onClick={() => handleGenerateVariation("Generate this character in a dynamic action pose. Maintain all details.", 'pose')} disabled={isLoading} variant="secondary">
                                        New Pose
                                    </Button>
                                    <Button onClick={() => handleGenerateVariation("Isolate the key accessories or items this character is wearing/holding on a white background.", 'accessory')} disabled={isLoading} variant="secondary">
                                        Isolate Accessories
                                    </Button>
                                </>
                            ) : (
                                <>
                                    <Button 
                                        onClick={handleGenerateProAngles} 
                                        disabled={isLoading}
                                        className="!bg-gradient-to-r from-amber-500 to-orange-500 !border-none text-white col-span-2"
                                    >
                                        <FilmIcon className="w-5 h-5 mr-2" />
                                        Generate 11 Pro Angles
                                    </Button>
                                    <Button onClick={() => handleGenerateVariation("Generate a wide establishing shot of this location from a higher angle.", 'angle')} disabled={isLoading} variant="secondary">
                                        Wide Angle View
                                    </Button>
                                    <Button onClick={() => handleGenerateVariation("Show this location at night with warm artificial lighting.", 'angle')} disabled={isLoading} variant="secondary">
                                        Night View
                                    </Button>
                                </>
                            )}
                        </div>
                        <div className="flex gap-2">
                            <div className="flex-1">
                                <Input 
                                    label="" 
                                    id="custom-var" 
                                    placeholder="Custom variation prompt..." 
                                    value={customPrompt} 
                                    onChange={(e) => setCustomPrompt(e.target.value)} 
                                />
                            </div>
                            <Button onClick={() => handleGenerateVariation(customPrompt, 'custom')} disabled={isLoading || !customPrompt.trim()} variant="secondary" className="mt-2">
                                Generate Custom
                            </Button>
                        </div>
                         {isLoading && <p className="text-indigo-500 font-semibold mt-2 animate-pulse">Generating variation...</p>}
                    </Card>

                    {/* Variations Grid */}
                    <div>
                        <h3 className="text-xl font-bold text-slate-800 mb-4">Variations Library ({selectedAsset.variations.length})</h3>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            {selectedAsset.variations.map(v => (
                                <div key={v.id} className="relative group bg-white p-2 rounded-xl shadow-sm border border-slate-200">
                                    <div className="aspect-square w-full bg-slate-100 rounded-lg overflow-hidden">
                                        <img 
                                            src={v.src} 
                                            alt={v.prompt} 
                                            className="w-full h-full object-contain cursor-zoom-in" 
                                            onClick={() => setSelectedImage(v)}
                                        />
                                    </div>
                                     <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button 
                                            onClick={(e) => { 
                                                e.stopPropagation(); 
                                                handleDownload(v.src, `${selectedAsset.name}_${v.name || 'variation'}`); 
                                            }}
                                            className="bg-black/50 hover:bg-black/70 text-white p-1.5 rounded-full"
                                            title="Download"
                                        >
                                            <ArrowDownTrayIcon className="w-4 h-4" />
                                        </button>
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); handleDeleteVariation(selectedAsset.id, v.id); }}
                                            className="bg-black/50 hover:bg-red-600 text-white p-1.5 rounded-full"
                                            title="Delete Variation"
                                        >
                                            <TrashIcon className="w-4 h-4" />
                                        </button>
                                    </div>
                                    <p className="mt-2 text-xs text-slate-500 font-medium truncate">{v.name}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="flex h-full bg-slate-100 overflow-hidden">
            {renderAssetList()}
            {renderDetailView()}

             {/* Lightbox Modal */}
            {selectedImage && (
                <div 
                    className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-8 bg-slate-900/95 backdrop-blur-sm transition-all duration-300"
                    onClick={() => setSelectedImage(null)}
                >
                    <button 
                        className="absolute top-4 right-4 p-2 text-white/70 hover:text-white bg-black/20 hover:bg-black/40 rounded-full transition-all"
                        onClick={() => setSelectedImage(null)}
                    >
                        <XMarkIcon className="w-8 h-8" />
                    </button>
                    <div 
                        className="relative max-w-full max-h-full flex flex-col items-center"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <img 
                            src={selectedImage.src} 
                            alt={selectedImage.prompt} 
                            className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl"
                        />
                         <div className="mt-4 flex gap-4">
                             <Button onClick={() => {
                                 if (selectedAsset) {
                                     const isMain = selectedImage.id === selectedAsset.mainImage.id;
                                     const name = isMain ? selectedAsset.name : `${selectedAsset.name}_${selectedImage.name || 'variation'}`;
                                     handleDownload(selectedImage.src, name);
                                 } else {
                                     handleDownload(selectedImage.src, selectedImage.name || 'image');
                                 }
                             }} variant='primary'>
                                 Download Image
                             </Button>
                        </div>
                    </div>
                </div>
            )}
            <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept="image/*" className="hidden" />
        </div>
    );
};

export default MasterWorld;
