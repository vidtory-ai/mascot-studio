import React, { useState, useMemo } from 'react';
import { Asset, AssetType } from '../types';
import { GeminiService } from '../services/api';
import { Search, Grid, List, MoreVertical, Folder, FileImage, Film, Box, User, MapPin, X, Calendar, Sparkles, Plus, Trash2, Loader2, Image as ImageIcon, Wand2, Layers, Check } from 'lucide-react';

interface AssetLibraryProps {
    assets: Asset[];
    onUpdateAsset?: (asset: Asset) => void;
}

export const AssetLibrary: React.FC<AssetLibraryProps> = ({ assets, onUpdateAsset }) => {
    const [viewMode, setViewMode] = useState<'GRID' | 'LIST'>('GRID');
    const [searchQuery, setSearchQuery] = useState('');
    const [activeCategory, setActiveCategory] = useState<AssetType | 'ALL'>('ALL');
    const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);

    const filteredAssets = useMemo(() => {
        return assets.filter(asset => {
            const matchesSearch = asset.name.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesCategory = activeCategory === 'ALL' || asset.type === activeCategory;
            return matchesSearch && matchesCategory;
        });
    }, [assets, searchQuery, activeCategory]);

    const sections = useMemo<Record<string, Asset[]>>(() => {
        if (activeCategory !== 'ALL') {
            return { [activeCategory]: filteredAssets };
        }
        const groups: Record<string, Asset[]> = {};
        [AssetType.CHARACTER, AssetType.LOCATION, AssetType.PROP, AssetType.VIDEO, AssetType.IMAGE].forEach(t => {
            groups[t] = [];
        });
        filteredAssets.forEach(asset => {
            if (!groups[asset.type]) groups[asset.type] = [];
            groups[asset.type].push(asset);
        });
        Object.keys(groups).forEach(key => {
            if (groups[key].length === 0) delete groups[key];
        });
        return groups;
    }, [filteredAssets, activeCategory]);

    const getIconForType = (type: string) => {
        switch (type) {
            case AssetType.CHARACTER: return <User size={16} />;
            case AssetType.LOCATION: return <MapPin size={16} />;
            case AssetType.VIDEO: return <Film size={16} />;
            case AssetType.PROP: return <Box size={16} />;
            default: return <FileImage size={16} />;
        }
    };

    const getLabelForType = (type: string) => {
        switch (type) {
            case AssetType.CHARACTER: return "Characters";
            case AssetType.LOCATION: return "Locations";
            case AssetType.PROP: return "Props & Items";
            case AssetType.VIDEO: return "Videos";
            default: return "Other Assets";
        }
    };

    return (
        <div className="flex-1 bg-slate-950 text-white h-full overflow-hidden flex flex-col relative">
            {/* Toolbar */}
            <div className="h-16 border-b border-slate-700/50 bg-slate-900 flex items-center px-6 justify-between shrink-0">
                <div className="flex items-center gap-4 flex-1">
                    <h2 className="font-bold text-lg mr-4 hidden md:block">Asset Library</h2>
                    <div className="relative max-w-md w-full">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
                        <input
                            type="text"
                            placeholder="Filter assets..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-slate-800 border border-slate-600/50 rounded-lg pl-9 pr-4 py-2 text-sm focus:border-primary focus:outline-none transition-all placeholder-slate-500"
                        />
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="flex bg-slate-800 p-1 rounded-lg border border-slate-600/30">
                        <button
                            onClick={() => setActiveCategory('ALL')}
                            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${activeCategory === 'ALL' ? 'bg-primary text-white' : 'text-slate-400 hover:text-white'}`}
                        >
                            All
                        </button>
                        {[AssetType.CHARACTER, AssetType.LOCATION, AssetType.VIDEO].map(type => (
                            <button
                                key={type}
                                onClick={() => setActiveCategory(type)}
                                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${activeCategory === type ? 'bg-primary text-white' : 'text-slate-400 hover:text-white'}`}
                            >
                                {type === AssetType.CHARACTER ? 'Chars' : type === AssetType.LOCATION ? 'Locs' : 'Videos'}
                            </button>
                        ))}
                    </div>
                    <div className="h-6 w-px bg-slate-700"></div>
                    <div className="flex bg-slate-800 p-1 rounded-lg border border-slate-600/30">
                        <button
                            onClick={() => setViewMode('GRID')}
                            className={`p-1.5 rounded-md transition-all ${viewMode === 'GRID' ? 'bg-slate-700 text-white' : 'text-slate-500 hover:text-white'}`}
                        >
                            <Grid size={16} />
                        </button>
                        <button
                            onClick={() => setViewMode('LIST')}
                            className={`p-1.5 rounded-md transition-all ${viewMode === 'LIST' ? 'bg-slate-700 text-white' : 'text-slate-500 hover:text-white'}`}
                        >
                            <List size={16} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-8">
                {(Object.entries(sections) as [string, Asset[]][]).map(([type, groupAssets]) => (
                    <div key={type}>
                        <div className="flex items-center gap-2 mb-4 pb-2 border-b border-slate-700/30">
                            <span className="text-primary">{getIconForType(type)}</span>
                            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                                {getLabelForType(type)}
                            </h3>
                            <span className="bg-slate-800 text-slate-400 text-[10px] px-2 py-0.5 rounded-full">
                                {groupAssets.length}
                            </span>
                        </div>

                        {viewMode === 'GRID' ? (
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8 gap-4">
                                {groupAssets.map(asset => (
                                    <AssetCardCompact key={asset.id} asset={asset} onClick={() => setSelectedAsset(asset)} />
                                ))}
                                <button className="flex flex-col items-center justify-center border-2 border-dashed border-slate-600/50 rounded-xl aspect-square hover:bg-slate-800/30 hover:border-primary/50 transition-all group min-h-[140px]">
                                    <span className="text-slate-500 group-hover:text-primary transition-colors mb-1">
                                        <PlusIcon />
                                    </span>
                                    <span className="text-xs text-slate-500 font-medium group-hover:text-white">Add New</span>
                                </button>
                            </div>
                        ) : (
                            <div className="flex flex-col gap-2">
                                {groupAssets.map(asset => (
                                    <AssetRowCompact key={asset.id} asset={asset} onClick={() => setSelectedAsset(asset)} />
                                ))}
                            </div>
                        )}
                    </div>
                ))}

                {Object.keys(sections).length === 0 && (
                    <div className="flex flex-col items-center justify-center h-64 text-slate-500">
                        <Folder size={48} className="mb-4 opacity-20" />
                        <p>No assets found</p>
                    </div>
                )}
            </div>

            {/* Asset Detail Modal */}
            {selectedAsset && (
                <AssetDetailModal
                    asset={selectedAsset}
                    onClose={() => setSelectedAsset(null)}
                    onSave={(updated) => {
                        if (onUpdateAsset) onUpdateAsset(updated);
                        setSelectedAsset(updated);
                    }}
                />
            )}
        </div>
    );
};

// --- Asset Detail Modal - White Card Style ---
const AssetDetailModal: React.FC<{ asset: Asset; onClose: () => void; onSave: (a: Asset) => void }> = ({ asset, onClose, onSave }) => {
    const [name, setName] = useState(asset.name);
    const [desc, setDesc] = useState(asset.description || '');
    const [posePrompt, setPosePrompt] = useState('');
    const [isGeneratingVar, setIsGeneratingVar] = useState(false);
    const [newVariation, setNewVariation] = useState<string | null>(null);

    const posePresets = asset.type === AssetType.CHARACTER
        ? ['Standing', 'Running', 'Sitting', 'Fighting', 'Happy', 'Sad', 'Back View', 'Side Profile']
        : ['Day Time', 'Night Time', 'Rainy', 'Aerial View', 'Close-up', 'Wide Shot'];

    const gallery = asset.gallery || [];

    const handleGenerateVariation = async () => {
        if (!posePrompt) return;
        setIsGeneratingVar(true);
        setNewVariation(null);
        const traits = asset.metadata?.traits || '';
        const baseDesc = asset.description || asset.name;
        const fullPrompt = `Character/Location Design Sheet. Subject: ${baseDesc}. Visual Traits (MUST KEEP CONSISTENT): ${traits}. New Action/View/Pose: ${posePrompt}. Style: Keep consistent with source material, high quality, detailed.`;
        try {
            const img = await GeminiService.generateImage({ prompt: fullPrompt });
            setNewVariation(img);
        } catch (e) {
            console.error(e);
            alert("Failed to generate variation");
        } finally {
            setIsGeneratingVar(false);
        }
    };

    const handleSaveVariation = () => {
        if (!newVariation) return;
        const updatedGallery = [...gallery, newVariation];
        onSave({ ...asset, gallery: updatedGallery });
        setNewVariation(null);
        setPosePrompt('');
    };

    const handleDeleteVariation = (index: number) => {
        const updatedGallery = gallery.filter((_, i) => i !== index);
        onSave({ ...asset, gallery: updatedGallery });
    };

    return (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 sm:p-8">
            <div className="bg-white rounded-2xl w-full max-w-5xl h-[85vh] flex flex-col md:flex-row overflow-hidden shadow-2xl relative">
                <button onClick={onClose} className="absolute top-4 right-4 p-2 bg-slate-100 hover:bg-primary hover:text-white rounded-full text-slate-600 z-20 transition-colors">
                    <X size={18} />
                </button>

                {/* Left: Master Visual */}
                <div className="w-full md:w-[38%] bg-slate-100 flex flex-col items-center justify-center p-4 relative">
                    <div className="absolute top-4 left-4 bg-primary text-white text-[10px] font-bold px-3 py-1 rounded-full shadow uppercase flex items-center gap-1">
                        <Sparkles size={10} /> Master
                    </div>
                    <img src={asset.thumbnailUrl} alt={asset.name} className="max-w-full max-h-full object-contain rounded-xl shadow-md" />
                </div>

                {/* Right: Data & Variations */}
                <div className="w-full md:w-[62%] flex flex-col h-full bg-white">
                    {/* Header */}
                    <div className="p-5 border-b border-slate-200 shrink-0">
                        <div className="flex items-center gap-2 mb-2">
                            <span className="px-2 py-1 bg-slate-100 text-slate-600 text-[10px] font-bold uppercase rounded">{asset.type}</span>
                            <div className="flex items-center gap-1 text-slate-400 text-xs">
                                <Calendar size={12} /> {asset.createdAt}
                            </div>
                        </div>
                        <input
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full bg-transparent text-xl font-bold text-slate-800 border-none focus:ring-0 p-0 mb-2 placeholder-slate-400"
                        />
                        <textarea
                            value={desc}
                            onChange={(e) => setDesc(e.target.value)}
                            className="w-full h-14 bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-700 text-sm focus:border-primary outline-none resize-none"
                            placeholder="Asset description..."
                        />
                    </div>

                    {/* Variations Section */}
                    <div className="flex-1 overflow-y-auto p-5">
                        <div className="flex items-center gap-2 mb-4">
                            <div className="w-6 h-6 bg-primary rounded-lg flex items-center justify-center text-white text-xs font-bold">1</div>
                            <h3 className="font-bold text-slate-800">Pose & Variation Generator</h3>
                            <span className="bg-slate-100 text-xs px-2 py-0.5 rounded-full text-slate-500">{gallery.length}</span>
                        </div>

                        {/* Generator Box */}
                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 mb-6">
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Quick Presets</label>
                            <div className="flex flex-wrap gap-2 mb-3">
                                {posePresets.map(preset => (
                                    <button
                                        key={preset}
                                        onClick={() => setPosePrompt(preset)}
                                        className={`px-2.5 py-1 text-xs rounded-lg border transition-all ${posePrompt === preset ? 'bg-primary text-white border-primary' : 'bg-white text-slate-600 border-slate-200 hover:border-primary'}`}
                                    >
                                        {preset}
                                    </button>
                                ))}
                            </div>
                            <div className="flex gap-2">
                                <input
                                    value={posePrompt}
                                    onChange={(e) => setPosePrompt(e.target.value)}
                                    placeholder="Or type custom: e.g., Jumping with joy..."
                                    className="flex-1 bg-white border border-slate-200 rounded-lg p-2.5 text-sm text-slate-800 focus:border-primary outline-none placeholder-slate-400"
                                />
                                <button
                                    onClick={handleGenerateVariation}
                                    disabled={isGeneratingVar || !posePrompt}
                                    className="px-5 bg-primary hover:bg-primary-hover disabled:opacity-50 text-white rounded-lg flex items-center gap-2 text-sm font-semibold transition-all"
                                >
                                    {isGeneratingVar ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                                    Generate
                                </button>
                            </div>

                            {newVariation && (
                                <div className="mt-4 p-4 bg-white rounded-lg border border-primary/30 flex items-start gap-4">
                                    <img src={newVariation} alt="New Var" className="w-20 h-20 object-cover rounded-lg border border-slate-200" />
                                    <div className="flex-1">
                                        <p className="text-sm text-slate-800 font-medium mb-1">✨ Variation Generated!</p>
                                        <p className="text-xs text-slate-500 mb-3">Does this match the character consistency?</p>
                                        <div className="flex gap-2">
                                            <button onClick={handleSaveVariation} className="px-3 py-1.5 bg-primary hover:bg-primary-hover text-white text-xs font-semibold rounded-lg flex items-center gap-1 transition-colors">
                                                <Plus size={12} /> Add to Gallery
                                            </button>
                                            <button onClick={() => setNewVariation(null)} className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-medium rounded-lg transition-colors">
                                                Discard
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Gallery */}
                        <div className="flex items-center gap-2 mb-3">
                            <div className="w-6 h-6 bg-primary rounded-lg flex items-center justify-center text-white text-xs font-bold">2</div>
                            <h4 className="font-bold text-slate-800">Saved Variations</h4>
                        </div>
                        <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                            <div className="aspect-square rounded-lg border border-slate-200 bg-slate-50 opacity-60 relative">
                                <img src={asset.thumbnailUrl} className="w-full h-full object-cover rounded-lg" />
                                <span className="absolute bottom-1 left-1 bg-white/90 text-[10px] px-1.5 py-0.5 rounded text-slate-500">MASTER</span>
                            </div>

                            {gallery.map((img, idx) => (
                                <div key={idx} className="aspect-square rounded-lg border border-slate-200 bg-white relative group overflow-hidden hover:border-primary transition-colors">
                                    <img src={img} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                        <button onClick={() => handleDeleteVariation(idx)} className="p-2 bg-red-500 hover:bg-red-600 text-white rounded-full transition-colors">
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </div>
                            ))}

                            {gallery.length === 0 && (
                                <div className="col-span-full text-center py-6 text-slate-400 text-sm">
                                    No variations yet. Use the generator above!
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-end gap-3 shrink-0">
                        <button onClick={onClose} className="px-4 py-2 text-sm text-slate-500 hover:text-slate-700">Close</button>
                        <button
                            onClick={() => onSave({ ...asset, name, description: desc })}
                            className="px-6 py-2 bg-primary hover:bg-primary-hover text-white text-sm font-semibold rounded-lg transition-all"
                        >
                            Save Updates
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- Sub-components ---
const AssetCardCompact: React.FC<{ asset: Asset; onClick: () => void }> = ({ asset, onClick }) => (
    <div onClick={onClick} className="group bg-slate-900 rounded-xl border border-slate-700/50 overflow-hidden hover:border-primary/50 hover:shadow-lg transition-all cursor-pointer relative">
        <div className="aspect-square bg-slate-800 relative">
            <img src={asset.thumbnailUrl} alt={asset.name} className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity" />
            {(asset.gallery && asset.gallery.length > 0) && (
                <div className="absolute bottom-2 right-2 bg-black/70 text-white text-[10px] px-1.5 py-0.5 rounded-md flex items-center gap-1">
                    <ImageIcon size={10} /> +{asset.gallery.length}
                </div>
            )}
        </div>
        <div className="p-2.5">
            <h4 className="text-xs font-semibold text-white truncate mb-1" title={asset.name}>{asset.name}</h4>
            <div className="flex justify-between items-center text-[10px] text-slate-500">
                <span className="uppercase">{asset.type}</span>
                <span>{asset.createdAt}</span>
            </div>
        </div>
    </div>
);

const AssetRowCompact: React.FC<{ asset: Asset; onClick: () => void }> = ({ asset, onClick }) => (
    <div onClick={onClick} className="flex items-center gap-4 p-2.5 rounded-lg hover:bg-slate-800/50 border border-transparent hover:border-slate-700/50 transition-colors cursor-pointer group">
        <div className="w-10 h-10 rounded-lg overflow-hidden bg-slate-800 shrink-0">
            <img src={asset.thumbnailUrl} alt={asset.name} className="w-full h-full object-cover" />
        </div>
        <div className="flex-1 min-w-0">
            <h4 className="text-sm font-medium text-white truncate">{asset.name}</h4>
        </div>
        <div className="text-xs text-slate-500 w-24">{asset.createdAt}</div>
        <div className="text-xs text-slate-500 w-16 flex items-center gap-1">
            {(asset.gallery && asset.gallery.length > 0) ? <><ImageIcon size={12} /> {asset.gallery.length}</> : '-'}
        </div>
        <button className="p-1.5 text-slate-500 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity">
            <MoreVertical size={16} />
        </button>
    </div>
);

const PlusIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
);