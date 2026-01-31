/**
 * IP World Builder - Type Definitions
 * Universe Types - Characters, Locations, World Bible, Assets
 */

// =====================================
// CHARACTER TYPES
// =====================================

export interface Character {
  id: string;
  name: string;
  description: string;
  blueprint: CharacterBlueprint;
  mainAsset: CharacterAsset;
  variations: CharacterAsset[];
  voiceProfile?: VoiceProfile;
  tags: string[];
  groupId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CharacterBlueprint {
  age?: string;
  bodyType?: string;
  silhouette?: string;
  dominantExpression?: string;
  dominantColor?: string;
  signatureProps?: string[];
  occupation?: string;
  archetype?: string;
  motivation?: string;
  flaw?: string;
  customFields?: Record<string, string>;
}

export interface CharacterAsset {
  id: string;
  imageUrl: string;        // base64 data URL
  thumbnailUrl?: string;   // compressed thumbnail
  prompt: string;          // generation prompt used
  assetType: CharacterAssetType;
  createdAt: string;
}

export type CharacterAssetType = 
  | 'main' 
  | 'variation' 
  | 'turnaround' 
  | 'expression' 
  | 'outfit'
  | 'pose';

export interface VoiceProfile {
  voiceId?: string;
  voiceProvider?: string;
  sampleUrl?: string;
  description?: string;
}

// =====================================
// LOCATION TYPES
// =====================================

export interface Location {
  id: string;
  name: string;
  description: string;
  style: string;
  atmosphere: string;
  mainAsset: LocationAsset;
  cameraAngles: LocationAsset[];
  tags: string[];
  groupId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface LocationAsset {
  id: string;
  imageUrl: string;
  cameraAngle: CameraAngle;
  lighting: LightingType;
  prompt: string;
  createdAt: string;
}

export interface CameraAngle {
  id: string;
  label: string;
  promptFragment: string;
}

export type LightingType = 
  | 'day' 
  | 'night' 
  | 'golden_hour' 
  | 'blue_hour'
  | 'overcast'
  | 'dramatic'
  | 'custom';

// Predefined camera angles for locations
export const CAMERA_ANGLES: CameraAngle[] = [
  { id: 'ESTABLISH_WIDE', label: 'Wide Establish', promptFragment: 'Wide establishing shot from a high angle (approx 4m elevation). 24mm lens. Composition focused on leading lines and rule of thirds.' },
  { id: 'BIRDS_EYE', label: 'Bird\'s Eye', promptFragment: 'Bird\'s eye view from very high up (approx 12m), top-down. 35mm lens. Calm overview.' },
  { id: 'EYELEVEL', label: 'Eye-Level', promptFragment: 'Wide eye-level shot. 28mm lens. Natural perspective.' },
  { id: 'OTS', label: 'Over-The-Shoulder', promptFragment: 'Medium over-the-shoulder shot. 50mm lens with shallow depth of field.' },
  { id: 'POV', label: 'POV', promptFragment: 'POV shot, slightly tilted angle. 35mm lens. Immersive perspective.' },
  { id: 'LOW_ANGLE', label: 'Low Hero Angle', promptFragment: 'Low angle hero shot (approx 0.3m height), looking upwards. 24mm lens. Awe-inspiring.' },
  { id: 'DETAIL', label: 'Detail Insert', promptFragment: 'Extreme close-up insert shot. 70mm lens, shallow bokeh.' },
  { id: 'SYMMETRY', label: 'Symmetry Center', promptFragment: 'Medium-wide symmetrical shot with centered subject matter. 28mm lens, deep depth of field.' },
  { id: 'LATERAL', label: 'Lateral Glide', promptFragment: 'Medium-wide side view. 35mm lens. Flowing lateral perspective.' },
];

// =====================================
// PROP TYPES
// =====================================

export interface Prop {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  category: PropCategory;
  tags: string[];
  createdAt: string;
}

export type PropCategory = 
  | 'weapon'
  | 'vehicle'
  | 'furniture'
  | 'clothing'
  | 'accessory'
  | 'food'
  | 'technology'
  | 'nature'
  | 'other';

// =====================================
// WORLD BIBLE TYPES
// =====================================

export interface WorldBible {
  id: string;
  name: string;
  description?: string;
  visualStyle: VisualStyle;
  worldLore?: WorldLore;
  createdAt: string;
  updatedAt: string;
}

export interface VisualStyle {
  artStyle: string;
  colorPalette: string[];
  lightingPreference: string;
  moodKeywords: string[];
  referenceImages?: string[];
  negativeStyleHints?: string[];
  aspectRatio: AspectRatio;
}

export type AspectRatio = '16:9' | '1:1' | '9:16' | '4:3' | '3:4';

export interface WorldLore {
  era?: string;
  setting?: string;
  rules?: string[];
  factions?: Faction[];
  timeline?: TimelineEvent[];
}

export interface Faction {
  id: string;
  name: string;
  description: string;
  alignment?: string;
  colors?: string[];
}

export interface TimelineEvent {
  id: string;
  name: string;
  description: string;
  date?: string;
  order: number;
}

// =====================================
// ASSET GROUP TYPES
// =====================================

export interface AssetGroup {
  id: string;
  name: string;
  type: 'character' | 'location' | 'prop' | 'mixed';
  description?: string;
}

// =====================================
// UNIVERSE PROJECT TYPE
// =====================================

export interface UniverseProject {
  id: string;
  name: string;
  worldBible: WorldBible;
  characters: Character[];
  locations: Location[];
  props: Prop[];
  groups: AssetGroup[];
  createdAt: string;
  updatedAt: string;
}
