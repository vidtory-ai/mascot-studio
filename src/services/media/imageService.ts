/**
 * IP World Builder - Image Generation Service
 * 
 * Uses Gemini 2.5 Flash (native API) with curl-style fetch calls
 * for easy provider switching.
 * 
 * Model: gemini-2.5-flash-preview-image-generation (nano banana)
 */

// =====================================
// CONFIGURATION - Easy to switch providers
// =====================================

export interface ImageProviderConfig {
    name: string;
    baseUrl: string;
    apiKey: string;
    model: string;
    headers: Record<string, string>;
}

// Gemini Native API Configuration
const GEMINI_CONFIG: ImageProviderConfig = {
    name: 'gemini',
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta/models',
    apiKey: process.env.GEMINI_API_KEY || process.env.API_KEY || (typeof localStorage !== 'undefined' ? localStorage.getItem('NEXUS_GEMINI_KEY') : '') || '',
    model: 'gemini-2.5-flash-image',
    headers: {
        'Content-Type': 'application/json'
    }
};

// Custom Endpoint Configuration (fallback)
const CUSTOM_ENDPOINT_CONFIG: ImageProviderConfig = {
    name: 'custom',
    baseUrl: 'http://127.0.0.1:8317/v1',
    apiKey: 'sk-antigravity-client-key',
    model: 'gemini-2.5-flash',
    headers: {
        'Content-Type': 'application/json'
    }
};

// Active provider - change this to switch
let activeProvider: ImageProviderConfig = GEMINI_CONFIG;

export function setImageProvider(provider: 'gemini' | 'custom'): void {
    activeProvider = provider === 'gemini' ? GEMINI_CONFIG : CUSTOM_ENDPOINT_CONFIG;
    console.log(`[ImageService] Switched to provider: ${activeProvider.name}`);
}

export function getActiveProvider(): ImageProviderConfig {
    return activeProvider;
}

// =====================================
// TYPES
// =====================================

export interface ImageGenerationOptions {
    prompt: string;
    negativePrompt?: string;
    aspectRatio?: '1:1' | '16:9' | '9:16' | '4:3' | '3:4';
    numberOfImages?: number;
    referenceImages?: Array<{
        base64: string;
        mimeType: string;
    }>;
}

export interface ImageGenerationResult {
    success: boolean;
    images: string[];  // base64 data URLs
    error?: string;
    provider: string;
    model: string;
}

// =====================================
// GEMINI NATIVE API - curl style
// =====================================

/**
 * Generate image using Gemini 2.5 Flash native API
 * 
 * Equivalent curl:
 * ```bash
 * curl -X POST \
 *   "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-image-generation:generateContent?key=${API_KEY}" \
 *   -H "Content-Type: application/json" \
 *   -d '{
 *     "contents": [{"parts": [{"text": "prompt here"}]}],
 *     "generationConfig": {"responseModalities": ["TEXT", "IMAGE"]}
 *   }'
 * ```
 */
async function generateWithGeminiNative(options: ImageGenerationOptions): Promise<ImageGenerationResult> {
    const { prompt, negativePrompt, aspectRatio, referenceImages } = options;

    // Build prompt with negative if provided
    let fullPrompt = prompt;
    if (negativePrompt) {
        fullPrompt += `\n\nNegative prompt (avoid): ${negativePrompt}`;
    }
    if (aspectRatio) {
        fullPrompt += `\n\nAspect ratio: ${aspectRatio}`;
    }

    // Build content parts
    const parts: Array<{ text?: string; inlineData?: { mimeType: string; data: string } }> = [];

    // Add reference images first if provided
    if (referenceImages?.length) {
        for (const img of referenceImages) {
            parts.push({
                inlineData: {
                    mimeType: img.mimeType,
                    data: img.base64
                }
            });
        }
    }

    // Add text prompt
    parts.push({ text: fullPrompt });

    // API URL
    const url = `${GEMINI_CONFIG.baseUrl}/${GEMINI_CONFIG.model}:generateContent?key=${GEMINI_CONFIG.apiKey}`;

    // Request payload
    const payload = {
        contents: [{ parts }],
        generationConfig: {
            responseModalities: ['TEXT', 'IMAGE']
        }
    };

    console.log(`[ImageService] Calling Gemini native API...`);
    console.log(`[ImageService] Model: ${GEMINI_CONFIG.model}`);
    console.log(`[ImageService] Prompt: ${prompt.substring(0, 100)}...`);

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: GEMINI_CONFIG.headers,
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(`Gemini API Error ${response.status}: ${errorData.error?.message || response.statusText}`);
        }

        const data = await response.json();

        // Extract images from response
        const images: string[] = [];
        const candidates = data.candidates || [];

        for (const candidate of candidates) {
            const contentParts = candidate.content?.parts || [];
            for (const part of contentParts) {
                if (part.inlineData) {
                    const dataUrl = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
                    images.push(dataUrl);
                }
            }
        }

        if (images.length === 0) {
            // Check if there's text response (model might have declined)
            const textResponse = candidates[0]?.content?.parts?.find((p: any) => p.text)?.text;
            if (textResponse) {
                console.warn(`[ImageService] Model returned text instead of image: ${textResponse.substring(0, 200)}`);
            }
            throw new Error('No images returned from Gemini API');
        }

        console.log(`[ImageService] Successfully generated ${images.length} image(s)`);

        return {
            success: true,
            images,
            provider: 'gemini',
            model: GEMINI_CONFIG.model
        };

    } catch (error) {
        console.error('[ImageService] Gemini native API error:', error);
        return {
            success: false,
            images: [],
            error: error instanceof Error ? error.message : 'Unknown error',
            provider: 'gemini',
            model: GEMINI_CONFIG.model
        };
    }
}

// =====================================
// CUSTOM ENDPOINT API - curl style
// =====================================

/**
 * Generate image using custom OpenAI-compatible endpoint
 * 
 * Equivalent curl:
 * ```bash
 * curl -X POST \
 *   "http://127.0.0.1:8317/v1/chat/completions" \
 *   -H "Content-Type: application/json" \
 *   -H "Authorization: Bearer sk-antigravity-client-key" \
 *   -d '{
 *     "model": "gemini-2.5-flash",
 *     "messages": [{"role": "user", "content": "prompt here"}]
 *   }'
 * ```
 */
async function generateWithCustomEndpoint(options: ImageGenerationOptions): Promise<ImageGenerationResult> {
    const { prompt, negativePrompt, aspectRatio, referenceImages } = options;

    let fullPrompt = prompt;
    if (negativePrompt) {
        fullPrompt += `\n\nNegative prompt (avoid): ${negativePrompt}`;
    }
    if (aspectRatio) {
        fullPrompt += `\n\nAspect ratio: ${aspectRatio}`;
    }

    // Build content for multimodal
    type ContentPart = { type: 'text'; text: string } | { type: 'image_url'; image_url: { url: string } };
    const content: ContentPart[] = [];

    // Add reference images
    if (referenceImages?.length) {
        for (const img of referenceImages) {
            content.push({
                type: 'image_url',
                image_url: { url: `data:${img.mimeType};base64,${img.base64}` }
            });
        }
    }

    content.push({ type: 'text', text: fullPrompt });

    const url = `${CUSTOM_ENDPOINT_CONFIG.baseUrl}/chat/completions`;

    const payload = {
        model: CUSTOM_ENDPOINT_CONFIG.model,
        messages: [
            {
                role: 'user',
                content: referenceImages?.length ? content : fullPrompt
            }
        ]
    };

    console.log(`[ImageService] Calling custom endpoint...`);
    console.log(`[ImageService] URL: ${url}`);

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                ...CUSTOM_ENDPOINT_CONFIG.headers,
                'Authorization': `Bearer ${CUSTOM_ENDPOINT_CONFIG.apiKey}`
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(`Custom API Error ${response.status}: ${errorData.error?.message || response.statusText}`);
        }

        const data = await response.json();
        const responseContent = data.choices?.[0]?.message?.content || '';

        // Check if response is a data URL
        if (responseContent.startsWith('data:image')) {
            return {
                success: true,
                images: [responseContent],
                provider: 'custom',
                model: CUSTOM_ENDPOINT_CONFIG.model
            };
        }

        // If text response, generation might have failed
        throw new Error('Response was text, not image');

    } catch (error) {
        console.error('[ImageService] Custom endpoint error:', error);
        return {
            success: false,
            images: [],
            error: error instanceof Error ? error.message : 'Unknown error',
            provider: 'custom',
            model: CUSTOM_ENDPOINT_CONFIG.model
        };
    }
}

// =====================================
// PUBLIC API
// =====================================

/**
 * Generate image using active provider
 */
export async function generateImage(options: ImageGenerationOptions): Promise<ImageGenerationResult> {
    if (activeProvider.name === 'gemini') {
        return generateWithGeminiNative(options);
    } else {
        return generateWithCustomEndpoint(options);
    }
}

/**
 * Generate image with automatic fallback
 */
export async function generateImageWithFallback(options: ImageGenerationOptions): Promise<ImageGenerationResult> {
    // Try primary provider first
    let result = await generateImage(options);

    if (!result.success) {
        console.log('[ImageService] Primary provider failed, trying fallback...');

        // Switch to other provider
        const fallbackProvider = activeProvider.name === 'gemini' ? 'custom' : 'gemini';
        const originalProvider = activeProvider;

        setImageProvider(fallbackProvider);
        result = await generateImage(options);

        // Restore original provider
        activeProvider = originalProvider;
    }

    return result;
}

/**
 * Generate character variation image
 */
export async function generateCharacterVariation(
    referenceImage: { base64: string; mimeType: string },
    variationPrompt: string
): Promise<ImageGenerationResult> {
    const prompt = `Using the reference character image, generate a new image: "${variationPrompt}".
  
RULES:
- Maintain strict consistency with the reference character's appearance
- Keep the same art style and color palette
- Ensure the character is recognizable as the same person
- Generate EXACTLY ONE character`;

    return generateImage({
        prompt,
        referenceImages: [referenceImage]
    });
}

/**
 * Generate turnaround sheet
 */
export async function generateTurnaroundSheet(
    referenceImage: { base64: string; mimeType: string }
): Promise<ImageGenerationResult> {
    const prompt = `Generate a character turnaround sheet showing three views of the character from the reference image.

REQUIREMENTS:  
- Background: solid, 100% white
- Maintain perfect consistency with reference image

THREE VIEWS (all in strict T-pose):
1. Front View: facing forward, T-pose
2. Side View: profile view, same T-pose
3. Back View: facing away, same T-pose

RULES:
- T-pose MUST be maintained across all views
- No hands in pockets, no bent arms, no holding objects
- Equal spacing between views`;

    return generateImage({
        prompt,
        referenceImages: [referenceImage],
        aspectRatio: '16:9'
    });
}

/**
 * Generate scene with character reference
 */
export async function generateSceneWithCharacter(
    scenePrompt: string,
    characterRef: { base64: string; mimeType: string },
    locationRef?: { base64: string; mimeType: string }
): Promise<ImageGenerationResult> {
    const prompt = `Create a scene: "${scenePrompt}"

Using the provided character reference image, place the character in the scene.
${locationRef ? 'Use the provided location reference for the background.' : ''}

RULES:
- Maintain the character's appearance exactly as in the reference
- Create cinematic composition
- Professional lighting`;

    const referenceImages = [characterRef];
    if (locationRef) {
        referenceImages.push(locationRef);
    }

    return generateImage({
        prompt,
        referenceImages,
        aspectRatio: '16:9'
    });
}

// =====================================
// UTILITY FUNCTIONS
// =====================================

/**
 * Extract base64 from data URL
 */
export function extractBase64(dataUrl: string): { base64: string; mimeType: string } | null {
    const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
    if (!match) return null;
    return {
        mimeType: match[1],
        base64: match[2]
    };
}

/**
 * Check if API key is configured
 */
export function isConfigured(): boolean {
    return Boolean(GEMINI_CONFIG.apiKey || CUSTOM_ENDPOINT_CONFIG.apiKey);
}

/**
 * Update API key
 */
export function setApiKey(key: string): void {
    GEMINI_CONFIG.apiKey = key;
    localStorage.setItem('NEXUS_GEMINI_KEY', key);
}
