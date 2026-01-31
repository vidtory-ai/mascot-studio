/**
 * IP World Builder - Gemini/AI Service
 * 
 * Core AI service using custom OpenAI-compatible endpoint.
 * Integrates with PromptRegistry for centralized prompt management.
 */

import { PromptRegistry, PROMPT_IDS, PromptParams } from '../../prompts';

// =====================================
// CONFIGURATION
// =====================================

const API_KEY = 'sk-antigravity-client-key';
const BASE_URL = 'http://127.0.0.1:8317/v1';

// Default models
const DEFAULT_TEXT_MODEL = 'gemini-2.5-flash';
const DEFAULT_IMAGE_MODEL = 'gemini-3-pro-image-preview';
const DEFAULT_THINKING_MODEL = 'gemini-claude-sonnet-4-5';

// =====================================
// TYPES
// =====================================

export interface ChatMessage {
    role: 'system' | 'user' | 'assistant';
    content: string | ContentPart[];
}

export interface ContentPart {
    type: 'text' | 'image_url';
    text?: string;
    image_url?: {
        url: string;  // base64 data URL or http URL
        detail?: 'low' | 'high' | 'auto';
    };
}

export interface GenerationOptions {
    model?: string;
    temperature?: number;
    maxTokens?: number;
    stream?: boolean;
    responseFormat?: { type: 'json_object'; schema?: object };
}

export interface ImageGenerationOptions {
    aspectRatio?: string;
    subjects?: Array<{ url: string; caption: string }>;
    scenes?: Array<{ url: string; caption: string }>;
    styles?: Array<{ url: string; caption: string }>;
    cleanup?: boolean;
}

// =====================================
// CORE API FUNCTIONS
// =====================================

/**
 * Make a chat completion request
 */
async function chatCompletion(
    messages: ChatMessage[],
    options: GenerationOptions = {}
): Promise<string> {
    const {
        model = DEFAULT_TEXT_MODEL,
        temperature = 0.7,
        maxTokens = 2000,
        responseFormat
    } = options;

    const response = await fetch(`${BASE_URL}/chat/completions`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${API_KEY}`
        },
        body: JSON.stringify({
            model,
            messages,
            temperature,
            max_tokens: maxTokens,
            ...(responseFormat && { response_format: responseFormat })
        })
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(`AI API Error: ${response.status} - ${error.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    return data.choices[0]?.message?.content || '';
}

/**
 * Make a streaming chat completion request
 */
async function* chatCompletionStream(
    messages: ChatMessage[],
    options: GenerationOptions = {}
): AsyncGenerator<string> {
    const {
        model = DEFAULT_TEXT_MODEL,
        temperature = 0.7,
        maxTokens = 2000
    } = options;

    const response = await fetch(`${BASE_URL}/chat/completions`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${API_KEY}`
        },
        body: JSON.stringify({
            model,
            messages,
            temperature,
            max_tokens: maxTokens,
            stream: true
        })
    });

    if (!response.ok) {
        throw new Error(`AI API Error: ${response.status}`);
    }

    const reader = response.body?.getReader();
    if (!reader) throw new Error('No response body');

    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
            if (line.startsWith('data: ')) {
                const data = line.slice(6);
                if (data === '[DONE]') return;

                try {
                    const json = JSON.parse(data);
                    const content = json.choices?.[0]?.delta?.content;
                    if (content) yield content;
                } catch {
                    // Skip invalid JSON
                }
            }
        }
    }
}

// =====================================
// HIGH-LEVEL API FUNCTIONS
// =====================================

/**
 * Generate text using a registered prompt
 */
export async function generateWithPrompt(
    promptId: string,
    userContent: string,
    promptParams?: PromptParams,
    options?: GenerationOptions
): Promise<string> {
    const promptConfig = PromptRegistry.get(promptId, promptParams);

    const messages: ChatMessage[] = [
        { role: 'system', content: promptConfig.systemInstruction },
        { role: 'user', content: userContent }
    ];

    return chatCompletion(messages, {
        model: promptConfig.preferredModel,
        temperature: promptConfig.temperature,
        maxTokens: promptConfig.maxTokens,
        responseFormat: promptConfig.outputSchema
            ? { type: 'json_object', schema: promptConfig.outputSchema }
            : undefined,
        ...options
    });
}

/**
 * Generate text with image input using a registered prompt
 */
export async function generateWithImage(
    promptId: string,
    userContent: string,
    images: Array<{ base64: string; mimeType: string }>,
    promptParams?: PromptParams,
    options?: GenerationOptions
): Promise<string> {
    const promptConfig = PromptRegistry.get(promptId, promptParams);

    // Build content parts with images
    const contentParts: ContentPart[] = [
        { type: 'text', text: userContent }
    ];

    for (const img of images) {
        contentParts.push({
            type: 'image_url',
            image_url: {
                url: `data:${img.mimeType};base64,${img.base64}`,
                detail: 'high'
            }
        });
    }

    const messages: ChatMessage[] = [
        { role: 'system', content: promptConfig.systemInstruction },
        { role: 'user', content: contentParts }
    ];

    return chatCompletion(messages, {
        model: promptConfig.preferredModel || DEFAULT_IMAGE_MODEL,
        temperature: promptConfig.temperature,
        maxTokens: promptConfig.maxTokens,
        responseFormat: promptConfig.outputSchema
            ? { type: 'json_object', schema: promptConfig.outputSchema }
            : undefined,
        ...options
    });
}

/**
 * Analyze a character image and extract visual description
 */
export async function analyzeCharacterImage(
    imageBase64: string,
    mimeType: string,
    language: string = 'English'
): Promise<{
    physicalFeatures: string;
    bodyType: string;
    clothing: string;
    artStyle: string;
    colorPalette: string[];
    distinctiveTraits: string[];
    fullDescription: string;
}> {
    const result = await generateWithImage(
        PROMPT_IDS.CHARACTER_ANALYZE,
        'Analyze this character image.',
        [{ base64: imageBase64, mimeType }],
        { language }
    );

    return JSON.parse(result);
}

/**
 * Generate a character variation
 */
export async function generateCharacterVariation(
    sourceImage: { base64: string; mimeType: string },
    variationPrompt: string
): Promise<string> {
    const result = await generateWithImage(
        PROMPT_IDS.CHARACTER_VARIATION,
        variationPrompt,
        [sourceImage],
        { variationPrompt }
    );

    return result;
}

/**
 * Analyze script and break into scenes/shots
 */
export async function analyzeScript(
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
}> {
    const result = await generateWithPrompt(
        PROMPT_IDS.SCRIPT_ANALYZE,
        scriptText,
        {
            characterList: options.characterList || 'Unknown - detect from script',
            visualStyle: options.visualStyle || 'Cinematic',
            genre: options.genre || 'Drama',
            language: options.language || 'Vietnamese'
        }
    );

    return JSON.parse(result);
}

/**
 * Generate image composition prompt for a shot
 */
export async function composeImagePrompt(
    shot: {
        shotType: string;
        action: string;
        characters: string[];
        mood: string;
    },
    characterDescriptions: string,
    locationDescription: string
): Promise<string> {
    return generateWithPrompt(
        PROMPT_IDS.IMAGE_COMPOSE,
        `Create an image prompt for this shot.`,
        {
            shotType: shot.shotType,
            action: shot.action,
            characters: shot.characters.join(', '),
            mood: shot.mood,
            characterDescriptions,
            locationDescription,
            artStyle: 'Cinematic anime style'
        }
    );
}

/**
 * Generate video motion prompt
 */
export async function generateVideoMotionPrompt(
    imageDescription: string,
    shotContext: string
): Promise<string> {
    return generateWithPrompt(
        PROMPT_IDS.VIDEO_MOTION,
        'Generate motion prompt.',
        { imageDescription, shotContext }
    );
}

/**
 * Describe any asset image
 */
export async function describeAsset(
    imageBase64: string,
    mimeType: string,
    language: string = 'English'
): Promise<string> {
    return generateWithImage(
        PROMPT_IDS.ASSET_DESCRIBE,
        'Describe this image.',
        [{ base64: imageBase64, mimeType }],
        { language }
    );
}

// =====================================
// UTILITY FUNCTIONS
// =====================================

/**
 * Test connection to the AI API
 */
export async function testConnection(): Promise<boolean> {
    try {
        const response = await fetch(`${BASE_URL}/models`, {
            headers: { 'Authorization': `Bearer ${API_KEY}` }
        });
        return response.ok;
    } catch {
        return false;
    }
}

/**
 * Get available models
 */
export async function getAvailableModels(): Promise<string[]> {
    try {
        const response = await fetch(`${BASE_URL}/models`, {
            headers: { 'Authorization': `Bearer ${API_KEY}` }
        });
        const data = await response.json();
        return data.data?.map((m: { id: string }) => m.id) || [];
    } catch {
        return [];
    }
}

// Export for direct use
export {
    chatCompletion,
    chatCompletionStream,
    DEFAULT_TEXT_MODEL,
    DEFAULT_IMAGE_MODEL,
    DEFAULT_THINKING_MODEL
};
