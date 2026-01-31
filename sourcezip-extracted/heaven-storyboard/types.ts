
export enum ColorType {
  COLOR = 'Full Color',
  BW = 'Black & White Sketch',
  MONOCHROME = 'Monochrome / Noir'
}

export enum GridSize {
  GRID_2x2 = '2x2 (4 Shots)',
  GRID_3x3 = '3x3 (9 Shots)'
}

export enum PageType {
  SCENE = 'Scene',
  TITLE_CARD = 'Title Card'
}

export interface CharacterProfile {
  id: string;
  name: string;
  description: string; // Job, personality, appearance
  imageBase64?: string; // Optional visual reference
}

export interface StoryboardInputs {
  prompt: string; // Raw Video Script
  genre: string;
  sceneCount: number;
  language: string;
  colorType: ColorType;
  style: string;
  gridSize: GridSize; // Kept as default/fallback
  aspectRatio: string;
  characters: CharacterProfile[];
  globalBackgroundImage?: string; // New field for Global Setting
}

export interface StoryboardShot {
  id: string;
  panelNumber: number;
  shotType: string; // e.g. "Wide Shot", "Close Up"
  description: string; // Action description
}

export interface GeneratedScene {
  id: string;
  sceneNumber: number;
  type: PageType;
  
  // Refined Data Structure
  content: string; // Legacy / Summary content
  shots: StoryboardShot[]; // Structured Shot List
  
  selectedCharacterIds: string[]; 
  gridSize: GridSize;   
  
  imageUrl?: string;
  isGenerating: boolean;
  
  // Edit Mode state
  imageError?: string;
  manualReferenceImage?: string; 
  sceneMaterialImages?: string[]; 
}

export enum StoryStep {
  INPUT = 'INPUT',           
  STORYBOARD = 'STORYBOARD', 
  GENERATED = 'GENERATED'    
}
