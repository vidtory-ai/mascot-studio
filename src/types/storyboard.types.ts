/**
 * IP World Builder - Type Definitions
 * Storyboard Types - Scenes, Shots, Storyboard structures
 */

// =====================================
// STORYBOARD TYPES
// =====================================

export interface Storyboard {
    id: string;
    projectId: string;
    title: string;
    sourceScript: string;
    scenes: Scene[];
    characterMapping: Record<string, string>;  // scriptCharacterName -> characterId
    locationMapping: Record<string, string>;   // scriptLocationName -> locationId
    settings: StoryboardSettings;
    status: StoryboardStatus;
    createdAt: string;
    updatedAt: string;
}

export type StoryboardStatus =
    | 'draft'
    | 'analyzing'
    | 'mapping'
    | 'ready'
    | 'in_production'
    | 'completed';

export interface StoryboardSettings {
    language: string;
    genre: string;
    style: string;
    defaultGridSize: GridSize;
    colorType: ColorType;
}

export type GridSize = '2x2' | '3x3' | '4x4';
export type ColorType = 'full_color' | 'black_white' | 'monochrome';

// =====================================
// SCENE TYPES
// =====================================

export interface Scene {
    id: string;
    storyboardId: string;
    sceneNumber: number;

    // Content
    location: string;
    mood: string;
    summary: string;

    // Classification
    sceneType: SceneType;
    pacing: string;
    conflict?: string;

    // Shots within scene
    shots: Shot[];

    // Timing
    estimatedDuration: number;  // total seconds

    // UI State
    isExpanded: boolean;
    isBreakingDown: boolean;
}

export type SceneType =
    | 'Dialogue'
    | 'Action'
    | 'Montage'
    | 'Static'
    | 'Transition';

// =====================================
// SHOT TYPES
// =====================================

export interface Shot {
    id: string;
    parentSceneId: string;
    shotNumber: number;

    // Content
    lyric?: string;              // Source text/dialogue
    visualDescription: string;   // What we see
    audioDescription?: string;   // Dialogue/SFX

    // Cinematography
    shotType: ShotType;
    cameraAngle: string;
    cameraMovement?: CameraMovement;
    screenDirection?: ScreenDirection;
    transition: TransitionType;

    // Characters & Location
    charactersInShot: string[];  // Character names from script
    locationName?: string;       // Location name from script

    // Mapped references (filled after asset mapping)
    mappedCharacterIds?: string[];
    mappedLocationId?: string;

    // Timing
    estimatedDuration: number;  // seconds (max 8)

    // Generation Prompts
    imagePrompt: string;
    videoPrompt: string;

    // Generated Assets
    generatedImages: GeneratedImage[];
    selectedImageIndex?: number;
    generatedVideo?: GeneratedVideo;

    // Status
    status: ShotStatus;
    error?: string;

    // Director Notes
    directorialReasoning?: string;
    continuityNotes?: string[];
}

export type ShotType =
    | 'Extreme Wide Shot'
    | 'Wide Shot'
    | 'Medium Wide Shot'
    | 'Medium Shot'
    | 'Medium Close Up'
    | 'Close Up'
    | 'Extreme Close Up'
    | 'Over The Shoulder'
    | 'POV'
    | 'Insert'
    | 'Two Shot'
    | 'Establishing Shot';

export type CameraMovement =
    | 'Static'
    | 'Pan Left'
    | 'Pan Right'
    | 'Tilt Up'
    | 'Tilt Down'
    | 'Dolly In'
    | 'Dolly Out'
    | 'Truck Left'
    | 'Truck Right'
    | 'Crane Up'
    | 'Crane Down'
    | 'Zoom In'
    | 'Zoom Out'
    | 'Handheld';

export type ScreenDirection =
    | 'Left to Right'
    | 'Right to Left'
    | 'Toward Camera'
    | 'Away from Camera'
    | 'Static';

export type TransitionType =
    | 'Cut'
    | 'Dissolve'
    | 'Fade In'
    | 'Fade Out'
    | 'Wipe'
    | 'Match Cut';

export type ShotStatus =
    | 'pending'
    | 'generating_image'
    | 'image_ready'
    | 'generating_video'
    | 'video_ready'
    | 'error';

// =====================================
// GENERATED ASSET TYPES
// =====================================

export interface GeneratedImage {
    id: string;
    url: string;              // base64 data URL or remote URL
    thumbnailUrl?: string;
    prompt: string;
    seed?: number;
    model?: string;
    createdAt: string;
}

export interface GeneratedVideo {
    id: string;
    url: string;
    playableUrl?: string;     // Local blob URL for playback
    mediaGenerationId: string;
    seed: number;
    duration: number;
    isUpscaled: boolean;
    upscaledUrl?: string;
    playableUpscaledUrl?: string;
    createdAt: string;
}

// =====================================
// SCRIPT ANALYSIS TYPES
// =====================================

export interface ScriptAnalysisResult {
    scenes: AnalyzedScene[];
    detectedCharacters: DetectedEntity[];
    detectedLocations: DetectedEntity[];
}

export interface AnalyzedScene {
    sceneNumber: number;
    location: string;
    mood: string;
    sceneType: SceneType;
    pacing: string;
    conflict: string;
    actionSummary: string;
    charactersInvolved: string[];
    estimatedDuration: number;
    suggestedShots: SuggestedShot[];
}

export interface SuggestedShot {
    shotNumber: number;
    duration: number;
    shotType: ShotType;
    visualDescription: string;
    audioDescription: string;
    charactersPresent: string[];
}

export interface DetectedEntity {
    name: string;
    suggestedDescription: string;
    occurrenceCount?: number;
}

// =====================================
// CHARACTER PROFILE FOR STORYBOARD
// =====================================

export interface StoryboardCharacterProfile {
    id: string;
    name: string;
    description: string;
    imageBase64?: string;      // Optional visual reference
    linkedCharacterId?: string; // Link to Universe character
}

// =====================================
// PANEL LAYOUT TYPES
// =====================================

export interface PanelLayout {
    gridSize: GridSize;
    panels: Panel[];
}

export interface Panel {
    id: string;
    position: number;  // 0-indexed position in grid
    shotId?: string;   // Reference to shot
    imageUrl?: string;
    label?: string;
}
