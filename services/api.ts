/**
 * IP World Builder - Legacy API Service (Upgraded)
 * 
 * Maintains backward compatibility with existing components while
 * integrating the new PromptRegistry system under the hood.
 * 
 * UPGRADED from original api.ts:
 * - Uses custom OpenAI-compatible endpoint instead of direct Google SDK
 * - Integrates with PromptRegistry for centralized prompt management
 * - Adds new features learned from reference projects
 */

import { VideoGenerationParams, ImageGenerationParams } from '../types';

// =====================================
// PROMPT REGISTRY (Inline for compatibility)
// Will be replaced with proper import when src/ structure is fully migrated
// =====================================

// Prompt configuration types
interface PromptConfig {
  id: string;
  version: string;
  category: string;
  name: string;
  description: string;
  systemInstruction: string;
  temperature?: number;
  maxTokens?: number;
  preferredModel?: string;
  outputSchema?: Record<string, any>;
}

// Simple prompt registry
class PromptRegistryClass {
  private prompts: Map<string, PromptConfig> = new Map();

  register(config: PromptConfig): void {
    this.prompts.set(config.id, config);
  }

  registerAll(configs: PromptConfig[]): void {
    configs.forEach(c => this.register(c));
  }

  get(id: string, params?: Record<string, any>): PromptConfig {
    const config = this.prompts.get(id);
    if (!config) {
      throw new Error(`Prompt not found: ${id}`);
    }

    if (params) {
      let instruction = config.systemInstruction;
      for (const [key, value] of Object.entries(params)) {
        instruction = instruction.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), String(value));
      }
      return { ...config, systemInstruction: instruction };
    }

    return config;
  }

  has(id: string): boolean {
    return this.prompts.has(id);
  }
}

const PromptRegistry = new PromptRegistryClass();

// Prompt IDs
const PROMPT_IDS = {
  CHARACTER_ANALYZE: 'universe.character.analyze',
  CHARACTER_VARIATION: 'universe.character.variation',
  CHARACTER_TURNAROUND: 'universe.character.turnaround',
  SCRIPT_ANALYZE: 'storyboard.script.analyze',
  IMAGE_COMPOSE: 'production.image.compose',
} as const;

// Initialize prompts
function initializePromptRegistry(): void {
  PromptRegistry.registerAll([
    {
      id: 'universe.character.analyze',
      version: '1.0.0',
      category: 'universe',
      name: 'Character Image Analysis',
      description: 'Analyzes a character image',
      temperature: 0.3,
      systemInstruction: `You are an expert character designer and visual analyst.

## TASK
Analyze the provided character image and extract a comprehensive visual description.

## OUTPUT REQUIREMENTS (JSON)
{
  "physicalFeatures": "...",
  "bodyType": "...",
  "clothing": "...",
  "artStyle": "...",
  "colorPalette": ["..."],
  "distinctiveTraits": ["..."],
  "fullDescription": "...",
  "suggested_name": "...",
  "description": "...",
  "visual_traits": "..."
}

## RULES
- Be objective and descriptive
- Focus on VISUAL information only
- Use precise color names
- Output language: {{language}}`
    },
    {
      id: 'universe.character.variation',
      version: '1.0.0',
      category: 'universe',
      name: 'Character Variation',
      description: 'Generates character variation',
      temperature: 0.7,
      systemInstruction: `Using the reference image, generate a new image based on this instruction: "{{variationPrompt}}".

## RULES
- Maintain strict consistency with the reference image's subject details
- Keep the same art style and color palette unless explicitly told to change
- Ensure the character is recognizable as the same person
- CRITICAL: Generate EXACTLY ONE character`
    },
    {
      id: 'universe.character.turnaround',
      version: '1.0.0',
      category: 'universe',
      name: 'Character Turnaround Sheet',
      description: 'Generates 3-view turnaround sheet',
      temperature: 0.5,
      systemInstruction: `Generate a character turnaround sheet showing three views of the character from the reference image.

## REQUIREMENTS  
- Background: solid, 100% white
- Maintain perfect consistency with reference image

## THREE VIEWS (all in strict T-pose):
1. Front View: facing forward, T-pose
2. Side View: profile view, same T-pose
3. Back View: facing away, same T-pose

## RULES
- T-pose MUST be maintained across all views
- No hands in pockets, no bent arms, no holding objects
- Equal spacing between views`
    },
    {
      id: 'storyboard.script.analyze',
      version: '1.0.0',
      category: 'storyboard',
      name: 'Script Analysis',
      description: 'Analyzes script into scenes',
      temperature: 0.5,
      systemInstruction: `You are an expert Animation Pre-production Agent.

## TASK
Analyze the provided script and break it down into structured scenes with shots.

## INPUT CONTEXT
- Available Characters: {{characterList}}
- Visual Style: {{visualStyle}}
- Genre: {{genre}}
- Target Language: {{language}}

## RULES
1. Each SCENE represents a distinct location or time period
2. Each SHOT within a scene must be ≤8 seconds
3. For NEW LOCATIONS, add an ESTABLISHING SHOT first

## OUTPUT (JSON)
{
  "scenes": [...],
  "detectedCharacters": [...],
  "detectedLocations": [...]
}`
    },
    {
      id: 'production.image.compose',
      version: '1.0.0',
      category: 'production',
      name: 'Image Composition',
      description: 'Creates production image prompt',
      temperature: 0.7,
      systemInstruction: `You are an elite Director generating production-ready image prompts.

## ART STYLE: {{artStyle}}
## CHARACTER REFERENCES: {{characterDescriptions}}
## LOCATION: {{locationDescription}}

## SHOT REQUIREMENTS
- Shot Type: {{shotType}}
- Composition: {{composition}}
- Mood: {{mood}}
- Action: {{action}}

## PROMPT PURITY RULES
- DO NOT write "stable background", "no distortion"
- Focus ONLY on creative description

## OUTPUT
Generate a single, detailed production prompt.`
    }
  ]);
}

// =====================================
// CONFIGURATION
// =====================================

// Custom endpoint configuration (no API key needed in localStorage)
const API_KEY = 'sk-antigravity-client-key';
const BASE_URL = 'http://127.0.0.1:8317/v1';

// Legacy key getters for backward compatibility
const getGeminiKey = () => (typeof process !== 'undefined' && process.env.GEMINI_API_KEY) || (typeof localStorage !== 'undefined' && localStorage.getItem('NEXUS_GEMINI_KEY')) || API_KEY;
const getVideoKey = () => localStorage.getItem('NEXUS_VIDEO_KEY') || "ak_c1b12201fb92b8f90593d4ce8cd54e1acee1831c5d7b7ee09a83911715b9888e";
const VIDEO_API_URL = "https://api2.lehuyducanh.com/api/video/generate";

// Initialize prompts on first import
let promptsInitialized = false;
function ensurePromptsInitialized() {
  if (!promptsInitialized) {
    initializePromptRegistry();
    promptsInitialized = true;
  }
}

// =====================================
// CORE API HELPER
// =====================================

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string | Array<{ type: string; text?: string; image_url?: { url: string } }>;
}

async function callLLM(
  messages: ChatMessage[],
  options: {
    model?: string;
    temperature?: number;
    maxTokens?: number;
    responseFormat?: { type: string };
  } = {}
): Promise<string> {
  const apiKey = getGeminiKey();

  // Dynamic Base URL: Use Google OpenAI-compatible endpoint if using Google Key (AIza...)
  let baseUrl = BASE_URL;
  if (apiKey && apiKey.startsWith('AIza')) {
    baseUrl = 'https://generativelanguage.googleapis.com/v1beta/openai';
  }

  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: options.model || 'gemini-2.5-flash',
      messages,
      temperature: options.temperature || 0.7,
      max_tokens: options.maxTokens || 2000,
      ...(options.responseFormat && { response_format: options.responseFormat })
    })
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(`API Error: ${response.status} - ${error.error?.message || 'Unknown'}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || '';
}

// =====================================
// VIDEO SERVICE
// =====================================

export const VideoService = {
  generateVideo: async (params: VideoGenerationParams): Promise<any> => {
    try {
      const response = await fetch(VIDEO_API_URL, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-api-key': getVideoKey()
        },
        body: JSON.stringify({
          prompt: params.prompt,
          startImage: { path: params.startImage },
          aspectRatio: params.aspectRatio,
          cleanup: params.cleanup
        })
      });

      if (!response.ok) {
        throw new Error(`Video API Error: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Video generation failed", error);
      throw error;
    }
  }
};

// =====================================
// GEMINI SERVICE (UPGRADED)
// =====================================

export const GeminiService = {
  /**
   * Text Generation - Uses PromptRegistry when available
   */
  generateDescription: async (prompt: string): Promise<string> => {
    try {
      const result = await callLLM([
        { role: 'user', content: prompt }
      ]);
      return result || "No description generated.";
    } catch (error) {
      console.error("Text Gen Error", error);
      return "Failed to generate text. Check API connection.";
    }
  },

  /**
   * Character Image Analysis - UPGRADED with PromptRegistry
   */
  analyzeCharacterImage: async (base64Image: string): Promise<{ name: string, description: string, traits: string }> => {
    ensurePromptsInitialized();

    // Get structured prompt from registry
    const promptConfig = PromptRegistry.get(PROMPT_IDS.CHARACTER_ANALYZE, { language: 'English' });

    // Clean base64 if needed
    const cleanBase64 = base64Image.includes(',') ? base64Image.split(',')[1] : base64Image;
    const mimeType = base64Image.includes('png') ? 'image/png' : 'image/jpeg';

    try {
      const result = await callLLM([
        { role: 'system', content: promptConfig.systemInstruction },
        {
          role: 'user',
          content: [
            { type: 'text', text: 'Analyze this character image.' },
            { type: 'image_url', image_url: { url: `data:${mimeType};base64,${cleanBase64}` } }
          ]
        }
      ], {
        model: 'gemini-2.5-flash',
        temperature: promptConfig.temperature,
        responseFormat: { type: 'json_object' }
      });

      const json = JSON.parse(result);
      return {
        name: json.suggested_name || json.name || '',
        description: json.description || json.fullDescription || '',
        traits: json.visual_traits || json.distinctiveTraits?.join(', ') || ''
      };
    } catch (error) {
      console.error("Vision Analysis Error", error);
      throw new Error("Failed to analyze image");
    }
  },

  /**
   * Image Generation - UPGRADED to use Gemini 2.5 Flash native API (curl-style)
   * 
   * Uses gemini-2.5-flash-preview-image-generation model
   * Easy to switch providers by changing GEMINI_IMAGE_MODEL
   */
  generateImage: async (params: ImageGenerationParams): Promise<string> => {
    // Build prompt
    let fullPrompt = params.style
      ? `High quality art. Style: ${params.style}. Description: ${params.prompt}. Cinematic lighting, highly detailed, 8k resolution, professional composition.`
      : params.prompt;

    if (params.negativePrompt) {
      fullPrompt += `\n\nNegative prompt (avoid): ${params.negativePrompt}`;
    }

    // Gemini 2.5 Flash native API call (curl-style)
    const GEMINI_IMAGE_MODEL = 'gemini-2.5-flash-image';
    const apiKey = getGeminiKey();
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_IMAGE_MODEL}:generateContent?key=${apiKey}`;

    const payload = {
      contents: [{
        parts: [{ text: fullPrompt }]
      }],
      generationConfig: {
        responseModalities: ['TEXT', 'IMAGE']
      }
    };

    console.log(`[GeminiService] Generating image with ${GEMINI_IMAGE_MODEL}...`);
    console.log(`[GeminiService] Prompt: ${fullPrompt.substring(0, 100)}...`);

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Gemini API Error ${response.status}: ${errorData.error?.message || response.statusText}`);
      }

      const data = await response.json();

      // Extract image from response
      const candidates = data.candidates || [];
      for (const candidate of candidates) {
        const parts = candidate.content?.parts || [];
        for (const part of parts) {
          if (part.inlineData) {
            const dataUrl = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
            console.log(`[GeminiService] Image generated successfully`);
            return dataUrl;
          }
        }
      }

      // No image in response
      console.warn('[GeminiService] No image in response, using fallback');
      return `https://picsum.photos/seed/${encodeURIComponent(params.prompt.substring(0, 20))}/1024/1024`;

    } catch (error) {
      console.error('[GeminiService] Image generation error:', error);
      return `https://picsum.photos/seed/${encodeURIComponent(params.prompt.substring(0, 20) + (params.seed || ''))}/1024/1024`;
    }
  },

  /**
   * World Location Generation - wrapper for consistency
   */
  generateWorldLocation: async (prompt: string, style: string): Promise<string> => {
    return GeminiService.generateImage({ prompt, style });
  },

  // =====================================
  // NEW METHODS (From Reference Projects)
  // =====================================

  /**
   * Generate character variation (NEW)
   */
  generateCharacterVariation: async (
    sourceImage: string,
    variationPrompt: string
  ): Promise<string> => {
    ensurePromptsInitialized();

    const promptConfig = PromptRegistry.get(PROMPT_IDS.CHARACTER_VARIATION, { variationPrompt });
    const cleanBase64 = sourceImage.includes(',') ? sourceImage.split(',')[1] : sourceImage;
    const mimeType = sourceImage.includes('png') ? 'image/png' : 'image/jpeg';

    try {
      const result = await callLLM([
        { role: 'system', content: promptConfig.systemInstruction },
        {
          role: 'user',
          content: [
            { type: 'text', text: variationPrompt },
            { type: 'image_url', image_url: { url: `data:${mimeType};base64,${cleanBase64}` } }
          ]
        }
      ], {
        model: 'gemini-3-pro-image-preview',
        temperature: promptConfig.temperature
      });

      return result.startsWith('data:image') ? result : sourceImage;
    } catch (error) {
      console.error("Variation generation failed", error);
      throw error;
    }
  },

  /**
   * Generate turnaround sheet (NEW)
   */
  generateTurnaroundSheet: async (characterImage: string): Promise<string> => {
    ensurePromptsInitialized();

    const promptConfig = PromptRegistry.get(PROMPT_IDS.CHARACTER_TURNAROUND);
    const cleanBase64 = characterImage.includes(',') ? characterImage.split(',')[1] : characterImage;
    const mimeType = characterImage.includes('png') ? 'image/png' : 'image/jpeg';

    try {
      const result = await callLLM([
        { role: 'system', content: promptConfig.systemInstruction },
        {
          role: 'user',
          content: [
            { type: 'text', text: 'Generate turnaround sheet for this character.' },
            { type: 'image_url', image_url: { url: `data:${mimeType};base64,${cleanBase64}` } }
          ]
        }
      ], {
        model: 'gemini-3-pro-image-preview',
        temperature: promptConfig.temperature
      });

      return result.startsWith('data:image') ? result : characterImage;
    } catch (error) {
      console.error("Turnaround generation failed", error);
      throw error;
    }
  },

  /**
   * Analyze script for storyboard (NEW)
   */
  analyzeScriptToStoryboard: async (
    scriptText: string,
    options: {
      characterList?: string;
      visualStyle?: string;
      genre?: string;
      language?: string;
    } = {}
  ): Promise<{
    scenes: Array<{
      sceneNumber: number;
      location: string;
      mood: string;
      sceneType: string;
      shots: Array<{
        shotNumber: number;
        duration: number;
        shotType: string;
        visualDescription: string;
        audioDescription: string;
        charactersPresent: string[];
      }>;
    }>;
    detectedCharacters: Array<{ name: string; suggestedDescription: string }>;
    detectedLocations: Array<{ name: string; suggestedDescription: string }>;
  }> => {
    ensurePromptsInitialized();

    const promptConfig = PromptRegistry.get(PROMPT_IDS.SCRIPT_ANALYZE, {
      characterList: options.characterList || 'Unknown - detect from script',
      visualStyle: options.visualStyle || 'Cinematic',
      genre: options.genre || 'Drama',
      language: options.language || 'Vietnamese'
    });

    try {
      const result = await callLLM([
        { role: 'system', content: promptConfig.systemInstruction },
        { role: 'user', content: scriptText }
      ], {
        model: 'gemini-2.5-flash',
        temperature: promptConfig.temperature,
        responseFormat: { type: 'json_object' }
      });

      return JSON.parse(result);
    } catch (error) {
      console.error("Script analysis failed", error);
      throw error;
    }
  },

  /**
   * Generate image with character reference (NEW)
   */
  generateSceneWithCharacter: async (
    scenePrompt: string,
    characterImage: string,
    locationImage?: string
  ): Promise<string> => {
    ensurePromptsInitialized();

    const promptConfig = PromptRegistry.get(PROMPT_IDS.IMAGE_COMPOSE, {
      artStyle: 'Cinematic anime style',
      characterDescriptions: 'Character from reference image',
      locationDescription: locationImage ? 'Location from reference image' : 'Generate appropriate background',
      shotType: 'Medium Shot',
      composition: 'Centered subject',
      mood: 'Neutral',
      action: scenePrompt
    });

    const cleanCharBase64 = characterImage.includes(',') ? characterImage.split(',')[1] : characterImage;
    const mimeType = characterImage.includes('png') ? 'image/png' : 'image/jpeg';

    const content: Array<{ type: string; text?: string; image_url?: { url: string } }> = [
      { type: 'text', text: scenePrompt },
      { type: 'image_url', image_url: { url: `data:${mimeType};base64,${cleanCharBase64}` } }
    ];

    if (locationImage) {
      const cleanLocBase64 = locationImage.includes(',') ? locationImage.split(',')[1] : locationImage;
      content.push({
        type: 'image_url',
        image_url: { url: `data:image/jpeg;base64,${cleanLocBase64}` }
      });
    }

    try {
      const result = await callLLM([
        { role: 'system', content: promptConfig.systemInstruction },
        { role: 'user', content }
      ], {
        model: 'gemini-3-pro-image-preview',
        temperature: promptConfig.temperature
      });

      return result.startsWith('data:image') ? result : characterImage;
    } catch (error) {
      console.error("Scene generation failed", error);
      throw error;
    }
  }
};

// =====================================
// UTILITY EXPORTS
// =====================================

export { initializePromptRegistry, PromptRegistry, PROMPT_IDS };