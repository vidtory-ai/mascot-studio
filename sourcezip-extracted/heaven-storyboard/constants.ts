
import { ColorType, GridSize } from "./types";

export const LANGUAGES = [
  'Vietnamese',
  'English',
  'Japanese',
  'Korean',
  'Chinese',
  'Spanish',
  'French'
];

export const VIDEO_GENRES = [
  'Cinematic / Movie',
  'TV Commercial / Ads',
  'Music Video',
  'Documentary',
  'Animation / Anime',
  'Short Film',
  'Vlog / YouTube',
  'Corporate Presentation'
];

export const STORYBOARD_STYLES = [
  'Rough Pencil Sketch',
  'Ink & Marker (Traditional)',
  'Digital Concept Art',
  'Photorealistic (Unreal Engine)',
  'Anime Production (Ghibli)',
  'Cyberpunk / Sci-Fi',
  'Noir / High Contrast',
  'Watercolor / Artistic',
  '3D Render (Blender)',
  'Retro 80s Movie'
];

export const CINEMATIC_SHOT_TYPES = [
  'Extreme Wide Shot (EWS)',
  'Wide Shot (WS)',
  'Full Shot (FS)',
  'Medium Shot (MS)',
  'Close Up (CU)',
  'Extreme Close Up (ECU)',
  'Over the Shoulder (OTS)',
  'Point of View (POV)',
  'Low Angle',
  'High Angle / Bird\'s Eye',
  'Dutch Angle / Tilted',
  'Tracking / Dolly Shot'
];

export const ASPECT_RATIOS = [
  "16:9",
  "9:16",
  "1:1",
  "2.39:1" // Anamorphic
];

export const COLOR_TYPES = Object.values(ColorType);
export const GRID_SIZES = Object.values(GridSize);
