
import React, { useState } from 'react';
import { GeneratedImage, GenerationTarget } from '../types';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { PhotoIcon, CubeTransparentIcon, UserGroupIcon, GlobeAltIcon, CameraIcon, XMarkIcon, VideoCameraIcon, Squares2X2Icon, ViewColumnsIcon, ChevronDownIcon, PencilSquareIcon, SparklesIcon, ArrowDownTrayIcon, TrophyIcon } from '@heroicons/react/24/solid';

interface ImageGalleryProps {
    images: GeneratedImage[];
    isLoading: boolean;
    onUpdateImageName: (id: string, name: string) => void;
    onDeleteImage: (id: string) => void;
    onSetReference: (asset: GeneratedImage) => void;
    onEditImage: (asset: GeneratedImage) => void;
    onGenerateCharacterSheet: (asset: GeneratedImage) => void;
    onPromoteToMaster: (asset: GeneratedImage) => void;
    referenceAssetId?: string;
}

type ViewMode = 'detailed' | 'compact';

const typeMapping: Record<GenerationTarget, { label: string; icon: React.ElementType; color: string }> = {
    new_shot: { label: 'New Shots', icon: CameraIcon, color: 'bg-sky-500' },
    secondary_character: { label: 'New Friends', icon: UserGroupIcon, color: 'bg-teal-500' },
    world_scene: { label: 'New Places', icon: GlobeAltIcon, color: 'bg-amber-500' },
    edit_image: { label: 'Edited Images', icon: PencilSquareIcon, color: 'bg-indigo-500' },
};

const ImageCard: React.FC<{ 
    image: GeneratedImage; 
    onUpdateImageName: (id: string, name: string) => void; 
    onDeleteImage: (id: string) => void; 
    onSetReference: (asset: GeneratedImage) => void;
    onEditImage: (asset: GeneratedImage) => void;
    onGenerateCharacterSheet: (asset: GeneratedImage) => void;
    onPromoteToMaster: (asset: GeneratedImage) => void;
    onImageClick: (image: GeneratedImage) => void;
    isReference: boolean;
    viewMode: ViewMode;
    className?: string;
    hideTypeBadge?: boolean;
}> = ({ image, onUpdateImageName, onDeleteImage, onSetReference, onEditImage, onGenerateCharacterSheet, onPromoteToMaster, onImageClick, isReference, viewMode, className = '', hideTypeBadge = false }) => {
    const typeInfo = typeMapping[image.generationTarget] || typeMapping.new_shot;
    
    const handleDownload = (e: React.MouseEvent) => {
        e.stopPropagation();
        const link = document.createElement('a');
        link.href = image.src;
        // Guess extension from mime type header if possible, default to png
        let extension = 'png';
        const mimeMatch = image.src.match(/data:image\/(.*?);/);
        if (mimeMatch) {
            extension = mimeMatch[1] === 'jpeg' ? 'jpg' : mimeMatch[1];
        }
        
        let safeName = (image.name || image.prompt || 'image')
            .replace(/[^a-z0-9]/gi, '_')
            .substring(0, 50);
        
        link.download = `${safeName}-${image.id.slice(-4)}.${extension}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <Card className={`p-2 flex flex-col transition-all duration-300 ${isReference ? 'ring-4 ring-offset-2 ring-blue-500' : 'ring-0'} ${className}`}>
            <div className="relative aspect-w-1 aspect-h-1 w-full bg-slate-200 rounded-lg overflow-hidden group">
                <img 
                    src={image.src} 
                    alt={image.prompt} 
                    className="w-full h-full object-cover cursor-zoom-in" 
                    onClick={() => onImageClick(image)}
                />
                {!hideTypeBadge && (
                    <div className={`absolute top-2 left-2 flex items-center text-white text-xs font-bold px-2 py-1 rounded-full ${typeInfo.color} pointer-events-none`}>
                       <typeInfo.icon className="w-4 h-4 mr-1.5" />
                       {typeMapping[image.generationTarget].label.replace('Images', '').replace('s', '')}
                    </div>
                )}
                {image.isEdited && (
                     <div className={`absolute top-2 ${hideTypeBadge ? 'left-2' : 'left-auto right-2 top-auto bottom-2'} flex items-center text-white text-xs font-bold px-2 py-1 rounded-full bg-indigo-500 pointer-events-none shadow-sm z-10`}>
                       <SparklesIcon className="w-3 h-3 mr-1" />
                       Edited
                    </div>
                )}

                <div className="absolute top-2 right-2 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-20">
                    <button
                        onClick={() => onDeleteImage(image.id)}
                        className="bg-black bg-opacity-40 rounded-full p-1.5 text-white hover:bg-red-500 transition-all"
                        aria-label="Delete asset"
                        title="Delete"
                    >
                        <XMarkIcon className="w-5 h-5" />
                    </button>
                    <button
                        onClick={() => onPromoteToMaster(image)}
                        className="bg-black bg-opacity-40 rounded-full p-1.5 text-white hover:bg-amber-500 transition-all"
                        aria-label="Promote to Master World"
                        title="Promote to Master World"
                    >
                        <TrophyIcon className="w-5 h-5" />
                    </button>
                    <button
                        onClick={handleDownload}
                        className="bg-black bg-opacity-40 rounded-full p-1.5 text-white hover:bg-slate-500 transition-all"
                        aria-label="Download image"
                        title="Download"
                    >
                        <ArrowDownTrayIcon className="w-5 h-5" />
                    </button>
                    <button
                        onClick={() => onSetReference(image)}
                        className="bg-black bg-opacity-40 rounded-full p-1.5 text-white hover:bg-blue-500 transition-all"
                        aria-label="Set as reference to generate more shots"
                        title="Use as Reference for New Shots"
                    >
                        <VideoCameraIcon className="w-5 h-5" />
                    </button>
                    <button
                        onClick={() => onEditImage(image)}
                        className="bg-black bg-opacity-40 rounded-full p-1.5 text-white hover:bg-indigo-500 transition-all"
                        aria-label="Edit this image"
                        title="Edit this Image"
                    >
                        <PencilSquareIcon className="w-5 h-5" />
                    </button>
                    {image.generationTarget !== 'world_scene' && (
                        <button
                            onClick={() => onGenerateCharacterSheet(image)}
                            className="bg-black bg-opacity-40 rounded-full p-1.5 text-white hover:bg-green-500 transition-all"
                            aria-label="Generate Character Sheet"
                            title="Generate Character Turnaround Sheet"
                        >
                            <Squares2X2Icon className="w-5 h-5" />
                        </button>
                    )}
                </div>
            </div>
            <div className="p-2 mt-auto space-y-2">
                 {viewMode === 'detailed' && (
                    <p className="text-xs text-slate-500 bg-slate-100 p-2 rounded-md line-clamp-2" title={image.prompt}>
                        <span className="font-bold text-slate-600">Idea:</span> {image.prompt}
                    </p>
                 )}
                <input
                    type="text"
                    value={image.name || ''}
                    onChange={(e) => onUpdateImageName(image.id, e.target.value)}
                    placeholder="Name this creation..."
                    className="w-full px-2 py-1 bg-white border-2 border-slate-200 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-xs text-slate-800"
                />
            </div>
        </Card>
    );
};

// New component for grouped scenes
const SceneGroup: React.FC<{
    parent: GeneratedImage;
    childrenImages: GeneratedImage[];
    allProps: any; // Pass down all props needed for ImageCard
}> = ({ parent, childrenImages, allProps }) => {
    const [isExpanded, setIsExpanded] = useState(true);

    return (
        <div className="col-span-full bg-slate-50 p-4 rounded-2xl border-2 border-slate-200">
            <div className="flex flex-col md:flex-row gap-6">
                {/* Parent Image - Larger */}
                <div className="md:w-1/3 lg:w-1/4 flex-shrink-0">
                    <h3 className="text-sm font-extrabold text-slate-500 uppercase tracking-wider mb-2">Master Scene</h3>
                     <ImageCard image={parent} {...allProps} className="h-full" hideTypeBadge />
                </div>

                {/* Children Images - Grid */}
                <div className="flex-1">
                     <div 
                        className="flex items-center justify-between mb-2 cursor-pointer"
                        onClick={() => setIsExpanded(!isExpanded)}
                     >
                        <h3 className="text-sm font-extrabold text-slate-500 uppercase tracking-wider">
                            Variations & Angles ({childrenImages.length})
                        </h3>
                         <ChevronDownIcon className={`w-5 h-5 text-slate-400 transform transition-transform ${isExpanded ? 'rotate-0' : '-rotate-90'}`} />
                    </div>
                    
                    {isExpanded && (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            {childrenImages.map(child => (
                                <ImageCard key={child.id} image={child} {...allProps} viewMode="compact" hideTypeBadge />
                            ))}
                            {childrenImages.length === 0 && (
                                <div className="col-span-full text-center p-4 text-slate-400 text-sm border-2 border-dashed border-slate-200 rounded-lg">
                                    No variations yet. Select the master scene and click "Generate 12 Pro Angles"!
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const LoadingCard: React.FC = () => (
    <div className="col-span-1 md:col-span-2 xl:col-span-3">
        <Card className="p-2">
            <div className="aspect-w-16 aspect-h-9 w-full flex items-center justify-center bg-slate-100 rounded-lg min-h-[300px]">
                <div className="text-center">
                    <CubeTransparentIcon className="w-16 h-16 text-blue-500 animate-spin mx-auto" />
                    <p className="mt-4 text-slate-500 font-semibold">Drawing a masterpiece...</p>
                </div>
            </div>
        </Card>
    </div>
);

const Placeholder: React.FC = () => (
     <div className="col-span-1 md:col-span-2 xl:col-span-3 flex items-center justify-center h-full min-h-[60vh]">
        <div className="text-center text-slate-500">
            <PhotoIcon className="w-24 h-24 mx-auto text-slate-400" />
            <p className="mt-4 text-lg font-bold">Your creations will appear here!</p>
            <p className="text-sm">Use the panel on the left to start building your world.</p>
        </div>
    </div>
);


const ImageGallery: React.FC<ImageGalleryProps> = ({ images, isLoading, onUpdateImageName, onDeleteImage, onSetReference, onEditImage, onGenerateCharacterSheet, onPromoteToMaster, referenceAssetId }) => {
    const [viewMode, setViewMode] = useState<ViewMode>('detailed');
    const [collapsedSections, setCollapsedSections] = useState<Set<GenerationTarget>>(new Set());
    const [selectedImage, setSelectedImage] = useState<GeneratedImage | null>(null);

    const toggleSection = (target: GenerationTarget) => {
        setCollapsedSections(prev => {
            const newSet = new Set(prev);
            if (newSet.has(target)) {
                newSet.delete(target);
            } else {
                newSet.add(target);
            }
            return newSet;
        });
    };

    const groupedImages = images.reduce((acc, image) => {
        const target = image.generationTarget;
        if (!acc[target]) {
            acc[target] = [];
        }
        acc[target].push(image);
        return acc;
    }, {} as Record<GenerationTarget, GeneratedImage[]>);

    // Removed 'edit_image' from standard order as they should now merge into other categories.
    // Kept it as a fallback just in case pure uploads use it.
    const order: GenerationTarget[] = ['secondary_character', 'world_scene', 'new_shot', 'edit_image'];
    
    const gridClasses: Record<ViewMode, string> = {
        detailed: 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3',
        compact: 'grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5',
    }

    const cardProps = {
        onUpdateImageName,
        onDeleteImage,
        onSetReference,
        onEditImage,
        onGenerateCharacterSheet,
        onPromoteToMaster,
        onImageClick: setSelectedImage,
        referenceAssetId,
        viewMode
    };

    // Special handling for grouping World Scenes
    const renderWorldScenes = (sceneImages: GeneratedImage[]) => {
        const parents = sceneImages.filter(img => !img.parentId);
        const children = sceneImages.filter(img => img.parentId);
        
        // Find orphans (children whose parents were deleted)
        const orphans = children.filter(child => !parents.find(p => p.id === child.parentId));

        return (
            <div className="grid grid-cols-1 gap-6">
                {parents.map(parent => (
                     <SceneGroup 
                        key={parent.id}
                        parent={parent}
                        childrenImages={children.filter(c => c.parentId === parent.id)}
                        allProps={{...cardProps, isReference: referenceAssetId === parent.id}}
                     />
                ))}
                {orphans.length > 0 && (
                    <div className={`col-span-full grid ${gridClasses[viewMode]} gap-6 p-4 bg-slate-100 rounded-2xl`}>
                        <h3 className="col-span-full text-sm font-extrabold text-slate-500 uppercase tracking-wider">Orphaned Scenes</h3>
                        {orphans.map(orphan => (
                             <ImageCard 
                                key={orphan.id} 
                                image={orphan} 
                                {...cardProps} 
                                isReference={referenceAssetId === orphan.id}
                            />
                        ))}
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="p-4 sm:p-6 lg:p-8 space-y-8 relative">
            <div className="flex justify-between items-center">
                <h2 className="text-4xl font-extrabold text-slate-800">World Bible (Brainstorming)</h2>
                <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-slate-600 mr-2">View:</span>
                    <Button 
                        variant={viewMode === 'detailed' ? 'primary' : 'secondary'}
                        onClick={() => setViewMode('detailed')}
                        aria-label="Detailed View"
                        className="!p-2"
                    >
                       <ViewColumnsIcon className="w-5 h-5" />
                    </Button>
                     <Button 
                        variant={viewMode === 'compact' ? 'primary' : 'secondary'}
                        onClick={() => setViewMode('compact')}
                        aria-label="Compact View"
                        className="!p-2"
                    >
                       <Squares2X2Icon className="w-5 h-5" />
                    </Button>
                </div>
            </div>
            
            {isLoading && images.length === 0 && <LoadingCard />}
            {images.length === 0 && !isLoading && <Placeholder />}
            
            {images.length > 0 && order.map(target => {
                const group = groupedImages[target as GenerationTarget];
                if (!group || group.length === 0) return null;
                const typeInfo = typeMapping[target as GenerationTarget];
                const isCollapsed = collapsedSections.has(target);

                return (
                    <div key={target}>
                        <div 
                            className="flex items-center justify-between mb-4 cursor-pointer select-none"
                            onClick={() => toggleSection(target)}
                        >
                            <div className="flex items-center">
                                <span className={`flex items-center justify-center w-10 h-10 rounded-full mr-3 ${typeInfo.color}`}>
                                    <typeInfo.icon className="w-6 h-6 text-white" />
                                </span>
                                <h2 className="text-3xl font-bold text-slate-800">{typeInfo.label}</h2>
                            </div>
                            <div className="flex items-center">
                                <span className="text-sm font-semibold text-slate-500 mr-3 bg-slate-200 px-2.5 py-1 rounded-full">{group.length} items</span>
                                <ChevronDownIcon className={`w-6 h-6 text-slate-600 transform transition-transform ${isCollapsed ? '-rotate-90' : 'rotate-0'}`} />
                            </div>
                        </div>
                        {!isCollapsed && (
                             target === 'world_scene' ? renderWorldScenes(group) : (
                                <div className={`grid ${gridClasses[viewMode]} gap-6`}>
                                    {/* Only show loading card at the top of the list if it's the currently active target, strictly speaking this might need refinement but works for now */}
                                    {isLoading && images.length > 0 && target === images[0].generationTarget && <LoadingCard />}
                                    {group.map(image => (
                                        <ImageCard 
                                            key={image.id} 
                                            image={image} 
                                            {...cardProps}
                                            isReference={referenceAssetId === image.id}
                                        />
                                    ))}
                                </div>
                             )
                        )}
                    </div>
                );
            })}

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
                        <div className="mt-4 bg-black/50 backdrop-blur-md text-white px-6 py-3 rounded-full max-w-2xl text-center">
                            <p className="text-sm sm:text-base font-medium">
                                {selectedImage.name || selectedImage.prompt}
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ImageGallery;