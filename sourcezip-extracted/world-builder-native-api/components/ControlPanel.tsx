
import React from 'react';
import { GenerationData, GenerationTarget, AspectRatio, ReferenceAsset, ApiProvider, CharacterBodyType } from '../types';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { Textarea } from './ui/Textarea';
import { Select } from './ui/Select';
import { 
    ArrowDownTrayIcon, ArrowUpTrayIcon, SparklesIcon, PhotoIcon, PaintBrushIcon, XMarkIcon, CameraIcon, UserGroupIcon, GlobeAltIcon, VideoCameraIcon, PencilSquareIcon, FilmIcon, PlusIcon, FolderArrowDownIcon
} from '@heroicons/react/24/solid';

interface ControlPanelProps {
    generationData: GenerationData;
    onGenerationDataChange: React.Dispatch<React.SetStateAction<GenerationData>>;
    
    generationTarget: GenerationTarget;
    setGenerationTarget: (target: GenerationTarget) => void;
    
    specificPrompt: string;
    onSpecificPromptChange: (value: string) => void;
    
    aspectRatio: AspectRatio;
    onAspectRatioChange: (value: AspectRatio) => void;
    
    selectedShot: string;
    onSelectedShotChange: (value: string) => void;
    shotOptions: string[];

    selectedScene: string;
    onSelectedSceneChange: (value: string) => void;
    sceneOptions: string[];

    isGenerating: boolean;
    onGenerate: () => void;
    onGenerateSceneVariations: () => void;
    onImportProject: () => void;
    onSaveProject: () => void;
    onDownloadAllImages: () => void;

    onAnalyzeCharacter: () => void;
    onAnalyzeStyle: () => void;
    onRemoveCharacterImage: () => void;
    isAnalyzing: 'character' | 'style' | null;

    referenceAsset: ReferenceAsset | null;
    onClearReferenceAsset: () => void;
    onUploadReference: () => void;

    editReferenceAsset?: ReferenceAsset | null;
    onUploadEditReference?: () => void;
    onClearEditReference?: () => void;

    apiProvider: ApiProvider;
    onApiProviderChange: (provider: ApiProvider) => void;
}

const generationTargets: { id: GenerationTarget; label: string; icon: React.ElementType; placeholder: string; promptLabel: string; hidden?: boolean }[] = [
    { id: 'new_shot', label: 'New Shot', icon: CameraIcon, placeholder: 'e.g., Close-up shot, smiling. Action pose, jumping.', promptLabel: 'Custom Shot & Angle Idea' },
    { id: 'secondary_character', label: 'New Friend', icon: UserGroupIcon, placeholder: 'e.g., A grumpy old blacksmith. A mischievous young rogue.', promptLabel: 'New Friend Idea (Edit or Create Custom)' },
    { id: 'world_scene', label: 'New Place', icon: GlobeAltIcon, placeholder: 'e.g., An ancient, magical library. A bustling cyberpunk street market.', promptLabel: 'Custom World Scene Idea' },
    { id: 'edit_image', label: 'Edit Image', icon: PencilSquareIcon, placeholder: 'e.g., Make the hat red. Add a scarf. Change background to night.', promptLabel: 'Edit Instruction' },
];

export const CAMERA_ANGLES = [
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

const kidFriendTemplates = [
    {
        name: 'Tessa the Tabby (7)',
        description: 'Curious, loves chasing bubbles.',
        prompt: 'A cute anthropomorphic 7-year-old tabby cat. Wears colorful overalls and mismatched socks. Has big, curious green eyes and a playful smile.'
    },
    {
        name: 'Rex the Raccoon (6)',
        description: 'Energetic, loves superhero pretend play.',
        prompt: 'An adorable anthropomorphic 6-year-old raccoon. Wears a bright red superhero cape and rain boots. Has a mischievous, excited grin and messy fur.'
    },
    {
        name: 'Ruby the Robin (5)',
        description: 'Sweet, loves shiny things.',
        prompt: 'A sweet, tiny anthropomorphic 5-year-old robin. Wears a knitted oversized scarf that drags a little on the ground. Has a cheerful, bright expression.'
    },
    {
        name: 'Greta the Goat (8)',
        description: 'Cheerful, loves picking flowers.',
        prompt: 'An anthropomorphic 8-year-old goat. Wears a cute floral dress and a straw sun hat. Has a gentle, happy smile and holds a small daisy.'
    },
    {
        name: 'Sunny the Squirrel (7)',
        description: 'Super energetic, always running.',
        prompt: 'A high-energy anthropomorphic 7-year-old squirrel. Wears a bright yellow hoodie with patches on the elbows. Has a wide, super excited expression and a very bushy tail.'
    },
    {
        name: 'Finn the Fox (9)',
        description: 'Quiet, likes reading comics.',
        prompt: 'A smart-looking anthropomorphic 9-year-old fox. Wears big round glasses and a cozy sweater that is slightly too big. Has a thoughtful, gentle smile.'
    },
    {
        name: 'Chloe the Chipmunk (6)',
        description: 'Small, loves sharing snacks.',
        prompt: 'A very small, cute anthropomorphic 6-year-old chipmunk. Wears an adorable little denim jumper with big pockets full of acorns. Has a shy, sweet smile.'
    },
    {
        name: 'Theo the Tortoise (8)',
        description: 'Relaxed, loves finger painting.',
        prompt: 'A calm anthropomorphic 8-year-old tortoise. Wears a messy artist smock covered in colorful paint spots. Has a relaxed, happy, and patient expression.'
    }
];

const adultFriendTemplates = [
    {
        name: 'Ms. Mabel the Mouse',
        description: 'Librarian & SEL mentor.',
        prompt: 'An anthropomorphic adult mouse, Ms. Mabel, the town librarian. Wears simple glasses and a plain, cozy cardigan. Has a gentle and wise expression.'
    },
    {
        name: 'Officer Dash the Dog',
        description: 'Neighborhood police officer.',
        prompt: 'An anthropomorphic adult dog, Officer Dash, a friendly neighborhood police officer. Wears a simple police uniform. Has a kind, reassuring smile.'
    },
    {
        name: 'Casey the Collie',
        description: 'Transit Chief / Station Master.',
        prompt: 'An anthropomorphic adult collie, Casey, the transit chief. Wears a simple conductor\'s hat and a plain vest, looking organized and efficient.'
    },
    {
        name: 'Baxter the Badger',
        description: 'Civil Engineer ("Mr. Rivet").',
        prompt: 'An anthropomorphic adult badger, Baxter, a civil engineer. Wears a simple hard hat and a plain safety vest. Looks sturdy and reliable.'
    },
    {
        name: 'Basil the Bear',
        description: 'Market Chef (nutrition & safety).',
        prompt: 'An anthropomorphic adult bear, Basil, the market chef. Wears a simple white chef\'s hat and apron. Has a warm and jolly expression.'
    },
    {
        name: 'Doc Remy the Rabbit',
        description: 'Medic / First-Aid expert.',
        prompt: 'An anthropomorphic adult rabbit, Doc Remy, the town medic. Wears a simple doctor\'s coat. Has a calm and caring demeanor.'
    },
    {
        name: 'Coach Harper the Hare',
        description: 'Playground coach (fair-play).',
        prompt: 'An anthropomorphic adult hare, Coach Harper, the playground coach. Wears a simple, plain tracksuit. Looks energetic and encouraging.'
    },
    {
        name: 'Principal Ellie the Elephant',
        description: 'School principal (community rules).',
        prompt: 'An anthropomorphic adult elephant, Principal Ellie, the school principal. Wears simple professional attire, like a plain blouse and skirt. Has a commanding yet kind presence.'
    }
];

const groupedPlaceTemplates = [
    {
        groupName: "Coastal & Harbor",
        templates: [
            {
                name: 'Harmony Lighthouse',
                description: 'Misty morning, warm safety light.',
                prompt: 'Harmony Lighthouse at dusk, casting a gentle warm light. Situated on a rocky coastal point in the Old Harbor district near Seaglass Pier. The atmosphere is safe and guiding. Colors: teal, warm yellow, grey stone.'
            },
            {
                name: 'Seafood Market Weekend',
                description: 'Bustling, colorful stalls, friendly.',
                prompt: 'Bustling weekend seafood market at Old Harbor. Colorful stalls with striped awnings, warm hanging lights, and a friendly, safe community atmosphere. Fresh fish on ice, happy vendor signs.'
            },
            {
                name: 'Tidelane Beach & Lifeguard',
                description: 'Sunny, safe swimming, tidepools.',
                prompt: 'Sunny Tidelane Beach featuring a bright red and white Lifeguard Station with safety flags. Gentle waves, golden sand, and safe, clear tidepools nearby. Colors: light blue, coral, sand.'
            }
        ]
    },
    {
        groupName: "Nature & Outskirts",
        templates: [
            {
                name: 'Aria Bridge (Riverbend)',
                description: 'Stone bridge, calm river, sunny.',
                prompt: 'Aria Bridge crossing over a calm, sparkling river in Riverbend Meadows. A charming stone bridge with flower boxes, surrounded by green grassy banks and walking paths. Colors: soft green, light grey, blue water.'
            },
            {
                name: 'Misty Cliffs Lookout',
                description: 'Pine forest, fog, panoramic view.',
                prompt: 'Misty Cliffs Lookout in Evergreen Hills. A safe wooden viewing platform surrounded by tall pine trees and soft morning fog, overlooking the town below. Colors: deep green, silver fog, brown wood.'
            },
            {
                name: 'Evergreen Ranger Station',
                description: 'Log cabin, trail maps, first aid.',
                prompt: 'Evergreen Ranger Station nestled in the pine forest. A welcoming log cabin with a visible "Trail Map" board and a green cross "First Aid" sign on the porch. Safe atmosphere.'
            }
        ]
    },
    {
        groupName: "Town Center",
        templates: [
            {
                name: 'Clock Tower Square',
                description: 'Central hub, cobblestones, pastel shops.',
                prompt: 'Clock Tower Square in the Town Core. A bustling central hub with cobblestone ground, a large ornate clock tower, surrounded by cute pastel-colored shops and cafes. Colors: multi-color pastels, warm stone.'
            },
            {
                name: 'Harmony Public Library',
                description: 'Grand, inviting, pastel brickwork.',
                prompt: 'Exterior of the Harmony Public Library. A charming, grand building with warm pastel brickwork, large inviting windows, and a welcoming entrance near the town square. Intellectual and cozy atmosphere.'
            },
            {
                name: 'Museum of Wonder',
                description: 'Whimsical, safe experiments corner.',
                prompt: 'The "Safe Experiments" corner inside the Museum of Wonder. Colorful, rounded interactive science displays for children, bright pastel colors, fostering curiosity. No sharp edges.'
            }
        ]
    },
    {
        groupName: "Team Bases & Workshops",
        templates: [
            {
                name: 'Detective Nook (Attic)',
                description: 'Cozy attic, round window view.',
                prompt: 'Kilo\'s Detective Nook. A cozy, warm attic space with a large round window looking out over the town clock. Cluttered but organized with a corkboard of clues, "Lost & Found" shelf, and comfortable reading spots.'
            },
            {
                name: 'The "Purrsuit" Garage',
                description: 'Tram station, low ramp, cozy.',
                prompt: 'Exterior of "The Purrsuit" Garage next to the tram station. Features a low, accessible ramp, large gentle-curved doors, and warm lighting. A safe hub for detective vehicles.'
            },
            {
                name: 'Driverforge Workshop',
                description: 'Makerspace, colorful tools, bright.',
                prompt: 'Inside the Driverforge Workshop. A vibrant makerspace filled with colorful tools on pegboards, safe gears, and blueprints on walls. Brightly lit, encouraging creativity and teamwork.'
            }
        ]
    }
];

const ControlPanel: React.FC<ControlPanelProps> = (props) => {
    const currentTarget = generationTargets.find(t => t.id === props.generationTarget) || generationTargets[0];

    const renderPromptInput = () => {
        if (props.generationTarget === 'new_shot') {
            return (
                <div className="space-y-4">
                    <Select
                        label="Choose a Shot"
                        id="shot-type"
                        value={props.selectedShot}
                        onChange={(e) => props.onSelectedShotChange(e.target.value)}
                    >
                        {props.shotOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                    </Select>
                    {props.selectedShot === 'Custom...' && (
                        <Textarea
                            label={currentTarget.promptLabel}
                            id="specific-prompt"
                            value={props.specificPrompt}
                            onChange={(e) => props.onSpecificPromptChange(e.target.value)}
                            rows={3}
                            placeholder={currentTarget.placeholder}
                        />
                    )}
                </div>
            );
        }
        if (props.generationTarget === 'world_scene') {
            return (
                <div className="space-y-4">
                     <div>
                        <label className="block text-sm font-bold text-slate-600 mb-2">
                            Quick-Start a Location
                        </label>
                        <div className="max-h-[400px] overflow-y-auto pr-2 space-y-4 custom-scrollbar">
                            {groupedPlaceTemplates.map((group, groupIdx) => (
                                <div key={groupIdx}>
                                    <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider mb-2 sticky top-0 bg-slate-50 py-1 z-10">
                                        {group.groupName}
                                    </h3>
                                    <div className="grid grid-cols-2 gap-2">
                                        {group.templates.map(place => (
                                            <button
                                                key={place.name}
                                                onClick={() => {
                                                    props.onSelectedSceneChange('Custom...');
                                                    props.onSpecificPromptChange(place.prompt);
                                                }}
                                                className="text-left p-2 border-2 border-slate-200 rounded-lg hover:bg-sky-100 hover:border-sky-300 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white"
                                            >
                                                <p className="font-bold text-sm text-slate-800 truncate">{place.name}</p>
                                                <p className="text-xs text-slate-500 truncate">{place.description}</p>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                    <Select
                        label="Or Choose a Generic Scene"
                        id="scene-type"
                        value={props.selectedScene}
                        onChange={(e) => props.onSelectedSceneChange(e.target.value)}
                    >
                        {props.sceneOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                    </Select>
                    {props.selectedScene === 'Custom...' && (
                        <Textarea
                            label={currentTarget.promptLabel}
                            id="specific-prompt"
                            value={props.specificPrompt}
                            onChange={(e) => props.onSpecificPromptChange(e.target.value)}
                            rows={3}
                            placeholder={currentTarget.placeholder}
                        />
                    )}
                </div>
            );
        }
        if (props.generationTarget === 'secondary_character') {
            return (
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-bold text-slate-600 mb-2">
                            Quick-Start a Kid Friend
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                            {kidFriendTemplates.map(friend => (
                                <button
                                    key={friend.name}
                                    onClick={() => props.onSpecificPromptChange(friend.prompt)}
                                    className="text-left p-2 border-2 border-slate-200 rounded-lg hover:bg-sky-100 hover:border-sky-300 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400"
                                >
                                    <p className="font-bold text-sm text-slate-800">{friend.name}</p>
                                    <p className="text-xs text-slate-500 truncate">{friend.description}</p>
                                </button>
                            ))}
                        </div>
                    </div>
                     <div className="mt-4">
                        <label className="block text-sm font-bold text-slate-600 mb-2">
                            Quick-Start an Adult Friend
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                            {adultFriendTemplates.map(friend => (
                                <button
                                    key={friend.name}
                                    onClick={() => props.onSpecificPromptChange(friend.prompt)}
                                    className="text-left p-2 border-2 border-slate-200 rounded-lg hover:bg-sky-100 hover:border-sky-300 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400"
                                >
                                    <p className="font-bold text-sm text-slate-800">{friend.name}</p>
                                    <p className="text-xs text-slate-500 truncate">{friend.description}</p>
                                </button>
                            ))}
                        </div>
                    </div>
                    <Textarea
                        label={currentTarget.promptLabel}
                        id="specific-prompt"
                        value={props.specificPrompt}
                        onChange={(e) => props.onSpecificPromptChange(e.target.value)}
                        rows={4}
                        placeholder={currentTarget.placeholder}
                    />
                </div>
            );
        }
        if (props.generationTarget === 'edit_image') {
            return (
                <div className="space-y-4">
                     <div className="p-3 border-2 border-dashed border-slate-300 rounded-lg bg-slate-50">
                        <div className="flex items-center justify-between">
                             {props.referenceAsset ? (
                                <div className="flex items-center gap-3 overflow-hidden">
                                    <img src={props.referenceAsset.src} alt="To edit" className="w-16 h-16 rounded-md object-cover border border-slate-200" />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Editing Target</p>
                                        <p className="text-sm text-slate-700 truncate font-semibold">{props.referenceAsset.name || 'Uploaded Image'}</p>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex items-center text-slate-500">
                                     <PhotoIcon className="w-8 h-8 mr-3 text-slate-400"/>
                                     <p className="text-sm font-semibold">Select an image to begin editing</p>
                                </div>
                            )}
                            <Button onClick={props.onUploadReference} variant="secondary" className="!py-2 !px-4 ml-4 shrink-0">
                                {props.referenceAsset ? 'Change' : 'Upload'}
                            </Button>
                        </div>
                    </div>

                    {/* Edit Reference Upload */}
                    <div className="p-3 border-2 border-dashed border-slate-300 rounded-lg bg-slate-50">
                        <div className="flex items-center justify-between">
                             {props.editReferenceAsset ? (
                                <div className="flex items-center gap-3 overflow-hidden">
                                    <img src={props.editReferenceAsset.src} alt="Style Reference" className="w-16 h-16 rounded-md object-cover border border-slate-200" />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Visual Reference (Optional)</p>
                                        <p className="text-sm text-slate-700 truncate font-semibold">{props.editReferenceAsset.name || 'Uploaded Ref'}</p>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex items-center text-slate-500">
                                     <SparklesIcon className="w-8 h-8 mr-3 text-slate-400"/>
                                     <p className="text-sm font-semibold">Add reference image (Optional)</p>
                                </div>
                            )}
                            <div className="flex gap-2 ml-4 shrink-0">
                                {props.editReferenceAsset && (
                                    <Button onClick={props.onClearEditReference} variant="secondary" className="!p-2 !h-9 !w-9">
                                        <XMarkIcon className="w-5 h-5"/>
                                    </Button>
                                )}
                                <Button onClick={props.onUploadEditReference} variant="secondary" className="!py-2 !px-4">
                                    {props.editReferenceAsset ? 'Change' : <PlusIcon className="w-5 h-5" />}
                                </Button>
                            </div>
                        </div>
                    </div>

                    <Textarea
                        label={currentTarget.promptLabel}
                        id="specific-prompt"
                        value={props.specificPrompt}
                        onChange={(e) => props.onSpecificPromptChange(e.target.value)}
                        rows={4}
                        placeholder={currentTarget.placeholder}
                    />
                </div>
            );
        }
        // Fallback for others
        return (
            <Textarea
                label={currentTarget.promptLabel}
                id="specific-prompt"
                value={props.specificPrompt}
                onChange={(e) => props.onSpecificPromptChange(e.target.value)}
                rows={4}
                placeholder={currentTarget.placeholder}
            />
        );
    };

    const visibleTargets = generationTargets.filter(t => !t.hidden || t.id === props.generationTarget);
    const isGenerateDisabled = props.isGenerating || !!props.isAnalyzing || (props.generationTarget === 'edit_image' && !props.referenceAsset);

    return (
        <aside className="w-[400px] bg-white flex flex-col h-screen border-r-2 border-slate-200">
            <div className="px-4 py-3 border-b-2 border-slate-200 flex items-center gap-3">
                 <SparklesIcon className="w-8 h-8 text-yellow-400" />
                 <h1 className="text-xl font-extrabold text-slate-800">Brian's World Builder Studio</h1>
            </div>

            <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-slate-50">
                <Card>
                    <h2 className="text-lg font-bold text-slate-800 mb-3">Generation Engine</h2>
                    <Select
                        label="API Provider"
                        id="api-provider"
                        value={props.apiProvider}
                        onChange={(e) => props.onApiProviderChange(e.target.value as ApiProvider)}
                    >
                        <option value="gemini">Gemini API</option>
                        <option value="custom">Le Huy Duc Anh API</option>
                    </Select>
                    <p className="text-xs text-slate-400 mt-1">
                        Switch between different image generation models.
                    </p>
                </Card>

                {props.referenceAsset && props.generationTarget !== 'edit_image' && (
                     <Card>
                        <div className="flex justify-between items-center mb-2">
                            <h2 className="text-lg font-bold text-slate-800">
                                Making New Shots!
                            </h2>
                             <Button onClick={props.onClearReferenceAsset} variant="secondary" className="!p-1 !h-7 !w-7">
                                <XMarkIcon className="w-5 h-5"/>
                            </Button>
                        </div>
                        <div className="flex items-center gap-3">
                            <img src={props.referenceAsset.src} alt="Reference" className="w-16 h-16 rounded-lg object-cover bg-slate-200"/>
                            <p className="text-sm text-slate-600 flex-1 line-clamp-3">
                                <span className="font-bold text-slate-800">{props.referenceAsset.name || props.referenceAsset.prompt}</span>
                            </p>
                        </div>
                        {/* New Feature: Pro Angles Trigger */}
                        {props.referenceAsset.generationTarget === 'world_scene' && (
                            <Button 
                                onClick={props.onGenerateSceneVariations} 
                                disabled={props.isGenerating}
                                className="w-full mt-3 !bg-gradient-to-r from-amber-500 to-orange-500 !border-none text-white"
                            >
                                <FilmIcon className="w-5 h-5 mr-2" />
                                Generate Pro Angles
                            </Button>
                        )}
                    </Card>
                )}

                <div className={props.referenceAsset ? 'opacity-40 pointer-events-none' : ''}>
                    <div className="space-y-4">
                        <Card>
                            <h2 className="text-lg font-bold text-slate-800 mb-3">Main Character</h2>
                            {props.generationData.mainCharacterImage ? (
                                <div className="mb-2 relative">
                                    <img src={props.generationData.mainCharacterImage.src} alt="Main Character Reference" className="w-full rounded-lg object-cover aspect-square" />
                                    <button onClick={props.onRemoveCharacterImage} className="absolute top-2 right-2 bg-black bg-opacity-40 rounded-full p-1 text-white hover:bg-opacity-60 transition-all">
                                        <XMarkIcon className="w-5 h-5" />
                                    </button>
                                </div>
                            ) : (
                                <div className="mb-2 p-4 border-2 border-dashed border-slate-300 rounded-lg text-center text-slate-500">
                                    <PhotoIcon className="w-12 h-12 mx-auto text-slate-400" />
                                    <p className="text-sm mt-1 font-semibold">Upload an image of your character!</p>
                                </div>
                            )}
                            <div className="space-y-2">
                                <Textarea 
                                    label="Character Description"
                                    id="main-char-desc"
                                    value={props.generationData.mainCharacterDescription}
                                    onChange={(e) => props.onGenerationDataChange(p => ({ ...p, mainCharacterDescription: e.target.value }))}
                                    rows={5}
                                    placeholder="e.g., A wise old wizard with a long white beard, wearing star-patterned blue robes..."
                                />
                                <Select
                                    label="Body Shape"
                                    id="body-type"
                                    value={props.generationData.characterBodyType}
                                    onChange={(e) => props.onGenerationDataChange(p => ({ ...p, characterBodyType: e.target.value as CharacterBodyType }))}
                                >
                                    <option value="default">Default</option>
                                    <option value="thin">Thin</option>
                                    <option value="fat">Fat</option>
                                    <option value="athletic">Athletic</option>
                                    <option value="muscular">Muscular</option>
                                    <option value="stocky">Stocky</option>
                                </Select>
                                <Button onClick={props.onAnalyzeCharacter} disabled={!!props.isAnalyzing} variant="secondary" className="w-full text-xs">
                                    <PhotoIcon className="w-4 h-4 mr-2" />
                                    {props.isAnalyzing === 'character' ? 'Thinking...' : 'Upload & Describe Image'}
                                </Button>
                            </div>
                        </Card>
                        
                        <Card>
                             <h2 className="text-lg font-bold text-slate-800 mb-3">Creative Direction</h2>
                             <div className="space-y-4">
                                <div>
                                    <Textarea
                                        label="Art Style"
                                        id="style-desc"
                                        value={props.generationData.styleDescription}
                                        onChange={(e) => props.onGenerationDataChange(p => ({ ...p, styleDescription: e.target.value }))}
                                        rows={3}
                                        placeholder="e.g., Studio Ghibli inspired, watercolor, soft lighting..."
                                    />
                                    <Button onClick={props.onAnalyzeStyle} disabled={!!props.isAnalyzing} variant="secondary" className="w-full mt-2 text-xs">
                                        <PaintBrushIcon className="w-4 h-4 mr-2" />
                                        {props.isAnalyzing === 'style' ? 'Thinking...' : 'Describe Style Image'}
                                    </Button>
                                </div>
                                <Textarea
                                    label="World Setting"
                                    id="world-desc"
                                    value={props.generationData.worldDescription}
                                    onChange={(e) => props.onGenerationDataChange(p => ({ ...p, worldDescription: e.target.value }))}
                                    rows={4}
                                    placeholder="e.g., High-fantasy world with floating islands and crystal-powered tech..."
                                />
                             </div>
                        </Card>
                    </div>
                </div>
                
                <Card>
                    <h2 className="text-lg font-bold text-slate-800 mb-3">What to Create?</h2>
                    <div className={`grid ${visibleTargets.length > 3 ? 'grid-cols-2' : 'grid-cols-3'} gap-2`}>
                        {visibleTargets.map(target => (
                             <Button 
                                key={target.id}
                                variant={props.generationTarget === target.id ? 'primary' : 'secondary'} 
                                onClick={() => props.setGenerationTarget(target.id)}
                                className="flex-col h-20 !text-xs"
                                disabled={!!props.referenceAsset && !(
                                    target.id === 'new_shot' ||
                                    target.id === 'edit_image' ||
                                    (target.id === 'world_scene' && props.referenceAsset.generationTarget === 'world_scene')
                                )}
                            >
                               <target.icon className="w-6 h-6 mb-1" /> 
                               <span>{target.label}</span>
                            </Button>
                        ))}
                    </div>
                </Card>

                <Card>
                    {renderPromptInput()}
                     <div className="mt-4">
                        <Select
                            label="Canvas Shape"
                            id="aspect-ratio"
                            value={props.aspectRatio}
                            onChange={(e) => props.onAspectRatioChange(e.target.value as AspectRatio)}
                        >
                            <option value="9:16">9:16 (Tall)</option>
                            <option value="1:1">1:1 (Square)</option>
                            <option value="16:9">16:9 (Wide)</option>
                        </Select>
                    </div>
                </Card>
            </div>
            
            <div className="p-4 space-y-2 border-t-2 border-slate-200 bg-white">
                <Button onClick={props.onGenerate} disabled={isGenerateDisabled} className="w-full text-lg !py-3">
                    <SparklesIcon className="w-6 h-6 mr-2" />
                    {props.isGenerating ? 'Drawing...' : (props.generationTarget === 'edit_image' ? 'Apply Edits!' : `Create ${currentTarget.label}!`)}
                </Button>
                 <div className="grid grid-cols-3 gap-2">
                     <Button onClick={props.onSaveProject} variant="secondary" className="!px-2" title="Save Project File">
                        <ArrowDownTrayIcon className="w-5 h-5 mr-1" /> Save
                    </Button>
                    <Button onClick={props.onImportProject} variant="secondary" className="!px-2" title="Import Project File">
                        <ArrowUpTrayIcon className="w-5 h-5 mr-1" /> Import
                    </Button>
                    <Button onClick={props.onDownloadAllImages} variant="secondary" className="!px-2" title="Download All Images as ZIP">
                         <FolderArrowDownIcon className="w-5 h-5 mr-1" /> Images
                    </Button>
                 </div>
            </div>
        </aside>
    );
};

export default ControlPanel;
