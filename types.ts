export enum AssetType {
  CHARACTER = 'CHARACTER',
  LOCATION = 'LOCATION',
  PROP = 'PROP',
  IMAGE = 'IMAGE',
  VIDEO = 'VIDEO'
}

export interface Asset {
  id: string;
  name: string;
  type: AssetType;
  thumbnailUrl: string;
  description?: string;
  tags?: string[];
  createdAt: string;
  metadata?: Record<string, any>;
  // New: For characters/locations having multiple variations
  gallery?: string[];
}

export interface SceneRender {
  id: string;
  imageUrl: string;
  timestamp: string;
  prompt: string;
  sourceCharId?: string;
  sourceLocId?: string;
}

export interface CharacterProfile extends Asset {
  type: AssetType.CHARACTER;
  traits: {
    visual: string[];
    personality: string[];
    defaultOutfit: string;
  };
}

export interface LocationProfile extends Asset {
  type: AssetType.LOCATION;
  style: string;
  atmosphere: string;
}

export enum ViewMode {
  DASHBOARD = 'dashboard',
  ASSETS = 'assets',
  CHARACTER_CREATOR = 'character_creator',
  WORLD_BUILDER = 'world_builder',
  DIRECTOR_STUDIO = 'director_studio',
  COMIC_GEN = 'comic_gen',
  VIDEO_MAKER = 'video_maker',
  POSTER_GEN = 'poster_gen',
  SETTINGS = 'settings',
  BRAND_GUIDELINES = 'brand_guidelines'
}

// Brand Guidelines - Manages consistent visual style across all assets
export interface BrandGuidelines {
  id: string;
  name: string;
  style: {
    artStyle: string;      // "Anime", "Pixar 3D", "Watercolor", "Photorealistic"
    colorPalette: string;  // "Vibrant", "Pastel", "Earth Tones", "Neon"
    lighting: string;      // "Soft Studio", "Cinematic", "Natural", "Dramatic"
    mood: string;          // "Cheerful", "Mysterious", "Action-packed", "Calm"
    era: string;           // "Modern", "Fantasy Medieval", "Sci-Fi Future"
  };
  promptPrefix: string;    // Injected at start of all prompts
  isActive: boolean;
  createdAt: string;
}

export interface VideoGenerationParams {
  prompt: string;
  startImage: string; // URL or Base64
  aspectRatio: 'VIDEO_ASPECT_RATIO_LANDSCAPE' | 'VIDEO_ASPECT_RATIO_PORTRAIT';
  cleanup: boolean;
}

export interface ImageGenerationParams {
  prompt: string;
  negativePrompt?: string;
  style?: string;
  aspectRatio?: string;
  seed?: number;
}

export const WorldStyles = [
  'Cinematic Cyberpunk',
  'High Fantasy',
  'Dark Sci-Fi',
  'Solarpunk',
  'Anime Style',
  'Hyper Realistic',
  'Watercolor Concept',
  'Unreal Engine 5 Render'
];

export const ArtStyles = [
  'Anime/Manga', 'Pixar 3D', 'Disney 2D', 'Watercolor',
  'Photorealistic', 'Comic Book', 'Chibi', 'Ghibli Style'
];

export const ColorPalettes = [
  'Vibrant & Bold', 'Soft Pastel', 'Warm Earth Tones',
  'Cool Ocean', 'Neon Cyberpunk', 'Muted Vintage'
];

export const Lightings = [
  'Soft Studio', 'Golden Hour', 'Dramatic Rim Light',
  'Flat Anime', 'Cinematic Moody', 'Natural Daylight'
];

export const Moods = [
  'Cheerful & Fun', 'Mysterious', 'Action-packed',
  'Calm & Peaceful', 'Dark & Edgy', 'Romantic'
];

export type ToastType = 'success' | 'error' | 'info';

export interface ToastMessage {
  id: string;
  type: ToastType;
  message: string;
}