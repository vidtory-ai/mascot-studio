import React, { useContext, useState } from 'react';
import { ProjectContext } from '../../contexts/ProjectContext';
import { generateVisual } from '../../services/geminiService';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Textarea } from '../ui/Textarea';
import { 
    PhotoIcon, SparklesIcon, CubeTransparentIcon, UserIcon, SunIcon, CameraIcon, LockClosedIcon, LockOpenIcon 
} from '@heroicons/react/24/outline';
// Fix: Add CharacterBodyType to imports
import { CharacterBodyType } from '../../types';

type LockedLayer = 'pose' | 'expression' | 'background' | 'lighting';

const VisualGenerator: React.FC = () => {
    // Fix: Add world to context destructuring.
    const { character, style, world, project } = useContext(ProjectContext);
    const [prompt, setPrompt] = useState('standing in a majestic city, golden hour lighting, cinematic');
    const [imageUrl, setImageUrl] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [variationStrength, setVariationStrength] = useState(0.5);
    const [lockedLayers, setLockedLayers] = useState<Set<LockedLayer>>(new Set());
    const [seed, setSeed] = useState<string>('');
    const [isSeedLocked, setIsSeedLocked] = useState(false);

    // Fix: Check for world in the guard clause.
    if (!character || !style || !world || !project) return <div>Please define a Character, Style, and World first.</div>;
    
    // Fix: Update handleGenerate to align with the new geminiService.generateVisual signature.
    const handleGenerate = async () => {
        setIsLoading(true);
        setImageUrl(null);
        
        // Fix: Extract bodyType from blueprint and construct description without it to avoid duplication.
        const { bodyType, ...otherBlueprintProps } = character.blueprint;
        const characterDescription = `Character: ${character.name}. ${Object.entries(otherBlueprintProps).filter(([, val]) => val).map(([key, val]) => `${key} is ${val}`).join('. ')}.`;
        const styleDescription = style.description;
        const worldDescription = world.lore;
        
        // Attempt to parse free-text body type from blueprint into a valid CharacterBodyType
        const bodyTypeString = (bodyType || 'default').toLowerCase().split(',')[0].trim();
        const validBodyTypes: CharacterBodyType[] = ['default', 'thin', 'fat', 'athletic', 'muscular', 'stocky'];
        const characterBodyType = validBodyTypes.find(v => v === bodyTypeString) || 'default';

        // Fix: Call generateVisual with a single options object instead of multiple arguments.
        const newImageUrl = await generateVisual({
            mainCharacterDescription: characterDescription,
            // Fix: Add missing characterBodyType property.
            characterBodyType: characterBodyType,
            styleDescription: styleDescription,
            worldDescription: worldDescription,
            specificPrompt: prompt,
            generationTarget: 'new_shot',
            aspectRatio: project.defaultAspectRatio,
            mainCharacterImage: null,
            referenceAsset: null,
        });

        setImageUrl(newImageUrl);
        if (!isSeedLocked) {
           setSeed(Math.floor(Math.random() * 1000000).toString());
        }
        setIsLoading(false);
    };

    const toggleLock = (layer: LockedLayer) => {
        setLockedLayers(prev => {
            const newSet = new Set(prev);
            if (newSet.has(layer)) {
                newSet.delete(layer);
            } else {
                newSet.add(layer);
            }
            return newSet;
        });
    };

    const RegenerationButton: React.FC<{ layer: LockedLayer, icon: React.ElementType, label: string }> = ({ layer, icon: Icon, label }) => (
        <div className="flex flex-col items-center gap-2">
            {/* Fix: Call handleGenerate without arguments as the layer-specific regeneration is no longer supported by the new service. */}
            <Button variant="secondary" onClick={handleGenerate} className="w-full">
                <Icon className="w-5 h-5 mr-2" />Re-roll {label}
            </Button>
            <button onClick={() => toggleLock(layer)} className="flex items-center gap-1 text-xs text-gray-400 hover:text-white">
                {lockedLayers.has(layer) ? <LockClosedIcon className="w-4 h-4 text-indigo-400" /> : <LockOpenIcon className="w-4 h-4" />}
                <span>{lockedLayers.has(layer) ? 'Locked' : 'Lock'}</span>
            </button>
        </div>
    );

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
            <div className="lg:col-span-1 flex flex-col gap-6">
                <Card>
                    <h3 className="text-xl font-bold mb-4">Prompt Composer</h3>
                    <Textarea
                        label="Describe the scene"
                        id="prompt-main"
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        rows={6}
                    />
                    {/* Fix: Call handleGenerate without arguments. */}
                    <Button onClick={handleGenerate} disabled={isLoading} className="w-full mt-4">
                        <SparklesIcon className="w-5 h-5 mr-2" />
                        {isLoading ? 'Generating...' : 'Generate Visual'}
                    </Button>
                </Card>
                <Card>
                    <h3 className="text-xl font-bold mb-4">Regenerate & Control</h3>
                    <div className="space-y-4">
                         <div className="grid grid-cols-2 gap-4">
                            <RegenerationButton layer="pose" icon={UserIcon} label="Pose" />
                            <RegenerationButton layer="expression" icon={UserIcon} label="Expression" />
                            <RegenerationButton layer="background" icon={CameraIcon} label="Background" />
                            <RegenerationButton layer="lighting" icon={SunIcon} label="Lighting" />
                        </div>
                        <div>
                             <label htmlFor="variation-strength" className="block text-sm font-medium text-gray-300">Variation Strength</label>
                             <input id="variation-strength" type="range" min="0.1" max="1" step="0.05" value={variationStrength} onChange={e => setVariationStrength(parseFloat(e.target.value))} className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer" />
                        </div>
                         <div className="flex items-center gap-2">
                            <input value={seed} onChange={e => setSeed(e.target.value)} placeholder="Random Seed" className="w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded-md shadow-sm sm:text-sm text-white" />
                            <Button variant="secondary" onClick={() => setIsSeedLocked(!isSeedLocked)}>
                                {isSeedLocked ? <LockClosedIcon className="w-5 h-5"/> : <LockOpenIcon className="w-5 h-5" />}
                            </Button>
                        </div>
                    </div>
                </Card>
            </div>
            <div className="lg:col-span-2">
                <Card className="h-full">
                    <div className="aspect-w-1 aspect-h-1 w-full h-full bg-gray-900 rounded-lg flex items-center justify-center">
                        {isLoading && (
                            <div className="text-center">
                                <CubeTransparentIcon className="w-16 h-16 text-indigo-500 animate-spin mx-auto" />
                                <p className="mt-4 text-gray-400">Generating masterpiece...</p>
                            </div>
                        )}
                        {!isLoading && imageUrl && (
                            <img src={imageUrl} alt="Generated visual" className="object-contain w-full h-full rounded-lg" />
                        )}
                        {!isLoading && !imageUrl && (
                            <div className="text-center text-gray-500">
                                <PhotoIcon className="w-24 h-24 mx-auto" />
                                <p>Your generated visual will appear here.</p>
                            </div>
                        )}
                    </div>
                </Card>
            </div>
        </div>
    );
};

export default VisualGenerator;