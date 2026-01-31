

export interface Character {
  id: string;
  name: string;
  description: string;
  age?: string;
  isMainCharacter: boolean;
  assetUrl?: string; // final generated/uploaded image data URL (base64)
  referenceAssetUrl?: string; // optional user-uploaded reference for generation (base64)
  isGeneratingAsset?: boolean;
  assetGenerationError?: string | null;
}

export interface Setting {
  id: string;
  name: string;
  imageUrl: string; // Deprecated, kept for compat, prefer imageUrls[0]
  imageUrls: string[]; // New: Support multiple reference images
}

export interface StoryboardScene {
  id: string; // Unique identifier for each scene
  lyric: string;
  imagePrompt: string;
  videoPrompt: string;
  charactersInScene?: string[]; // Array of character names from the main cast
  extraCharacters?: { id: string, assetUrl: string }[]; // Characters uploaded for this scene only
  imageUrls: string[]; // URLs for generated full-resolution images
  thumbnails: string[]; // Base64 data URLs for low-res preview thumbnails
  isGeneratingImage: boolean;
  imageGenerationError: string | null;
  isEnriching?: boolean;
  selectedImageForVideo?: string;
  videoUrl?: string;
  playableVideoUrl?: string; // Local URL for playback
  isGeneratingVideo?: boolean;
  videoGenerationError?: string | null;
  shouldUpscaleVideo: boolean;
  mediaGenerationId?: string;
  seed?: number;
  upscaledVideoUrl?: string;
  playableUpscaledVideoUrl?: string; // Local URL for upscaled playback
  isUpscaling?: boolean;
  isCancelling?: boolean; // Flag to indicate a cancellation is in progress
  backgroundUrl?: string; // The user-uploaded background image for the scene
  
  // New fields for Shot Breakdown
  shots?: StoryboardScene[]; // Nested scenes (shots)
  isExpanded?: boolean; // UI state for collapsing/expanding shots
  isBreakingDown?: boolean; // Loading state for AI breakdown

  // New Agent Fields
  shotType?: string; // e.g., "Close Up", "Wide Shot"
  directorialReasoning?: string; // Why the agent chose this shot
  estimatedDuration?: number; // In seconds
  continuityIssues?: string[]; // List of potential continuity errors found by AI
  
  // Advanced Agent Fields
  cameraMovement?: string; // e.g., "Pan Left", "Dolly In"
  screenDirection?: string; // e.g., "Left to Right"
  transition?: string; // e.g., "Cut", "Dissolve"
}

export interface ScriptReaderState {
  status: 'idle' | 'loading' | 'success' | 'error';
  step: 'upload' | 'configure' | 'complete'; // New field to track the 2-step process
  loadingMessage: string;
  originalScript: string | null;
  rewrittenScript: string | null;
  translatedScript: string | null;
  error: string | null;
}

// New Types for Kilo & Bruno Script Analysis
export interface ParsedShot {
  id: string;
  duration: number; // seconds
  shotType: string; // Wide, Close-up, etc.
  visualDescription: string;
  audioDescription: string;
  charactersPresent: string[]; // Names of characters in this specific shot
  setting: string; // The setting name
}

export interface ScriptAssetRequirements {
  characters: string[]; // List of unique character names detected
  settings: string[]; // List of unique settings detected
}

export interface KiloBrunoState {
  status: 'idle' | 'loading' | 'mapping' | 'success' | 'error';
  loadingMessage: string;
  rawScript: string;
  parsedShots: ParsedShot[];
  requirements: ScriptAssetRequirements;
  error: string | null;
}

// --- NEW AGENT TYPES ---

export interface AgentAnalyzedScene {
  sceneNumber: number;
  location: string;
  mood: string;
  sceneType: 'Dialogue' | 'Action' | 'Montage' | 'Static'; // Critical for shot breakdown logic
  pacing: string; // e.g. "Slow", "Fast", "Intense"
  conflict: string; // The central conflict/beat of the scene
  actionSummary: string;
  charactersInvolved: string[];
  estimatedDuration: number;
}

export interface AgentAnalysisResult {
  scenes: AgentAnalyzedScene[];
  detectedCharacters: { name: string, suggestedDescription: string }[];
  detectedLocations: { name: string, suggestedDescription: string }[];
}

export interface ContinuityReport {
  shotId: string;
  issues: string[]; // Empty if clean
  score: number; // 0-100 (100 is perfect continuity)
}

export interface AgentState {
  step: 'input' | 'analyzing' | 'mapping' | 'generating' | 'review';
  scriptText: string;
  analysisResult: AgentAnalysisResult | null;
  mapping: {
    characters: Record<string, string>; // Script Name -> Asset ID
    locations: Record<string, string>; // Script Location -> Asset ID
  };
  generatedScenes: StoryboardScene[];
  continuityReports: Record<string, ContinuityReport>;
  isProcessing: boolean;
  processMessage: string;
}