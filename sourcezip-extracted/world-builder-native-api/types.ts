
export type ApiProvider = 'gemini' | 'custom';
export type GenerationTarget = 'new_shot' | 'secondary_character' | 'world_scene' | 'edit_image';

export type AspectRatio = '16:9' | '1:1' | '9:16';
export type CharacterBodyType = 'default' | 'thin' | 'fat' | 'athletic' | 'muscular' | 'stocky';


export interface GeneratedImage {
    id: string;
    src: string;
    prompt: string;
    generationTarget: GenerationTarget;
    name?: string;
    parentId?: string; // New field to link variations to a parent image
    isEdited?: boolean;
}

export type ReferenceAsset = GeneratedImage;

export type MasterAssetType = 'character' | 'scene';

export interface MasterGroup {
    id: string;
    name: string;
}

export interface MasterAsset {
    id: string;
    type: MasterAssetType;
    name: string;
    description: string;
    mainImage: GeneratedImage;
    variations: GeneratedImage[];
    groupId?: string;
}

export interface GenerationData {
    mainCharacterDescription: string;
    characterBodyType: CharacterBodyType;
    mainCharacterImage: {
        src: string; // base64 data URL
        base64: string; // raw base64 for API
        mimeType: string;
    } | null;
    styleDescription: string;
    worldDescription: string;
    images: GeneratedImage[];
    masterAssets: MasterAsset[];
    masterAssetGroups: MasterGroup[];
}

// Fix: Add missing type definitions.
export type ModuleType = 'CHARACTER' | 'STYLE' | 'WORLD' | 'STORY' | 'VISUALS' | 'STORYBOARD';

export interface Project {
    name: string;
    targetAudience: string;
    tone: string;
    defaultAspectRatio: AspectRatio;
}

export interface Style {
    name: string;
    description: string;
    palette: string[];
    modelProfile: {
        styleWeight: number;
    };
}

export interface Character {
    name: string;
    blueprint: { [key: string]: string };
}

export interface World {
    name: string;
    lore: string;
    locations: string[];
    factions: string[];
}

export interface Story {
    template: string;
    logline: string;
    synopsis: string;
}
