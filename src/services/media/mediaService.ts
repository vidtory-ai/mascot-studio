/**
 * IP World Builder - Media Generation Service
 * 
 * Handles image and video generation using custom backend APIs.
 * Integrated from heaven-video/services/mediaService.ts patterns.
 */

import type {
    ImageGenerationRequest,
    ImageGenerationResult,
    VideoGenerationRequest,
    VideoGenerationResult,
    UpscaleRequest,
    UpscaleResult
} from '../../types/production.types';

// =====================================
// CONFIGURATION
// =====================================

const IMAGE_API_URL = 'https://api.lehuyducanh.com/api/generate/';
const VIDEO_API_URL = 'https://api.lehuyducanh.com/api/generate-video/';
const UPSCALE_API_URL = 'https://api.lehuyducanh.com/api/upscale-video/';
const API_KEY = 'sk-antigravity-video-key';

// Retry configuration
const MAX_RETRIES = 3;
const RETRY_DELAY = 2000;

// =====================================
// HELPER FUNCTIONS
// =====================================

async function delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchWithRetry(
    url: string,
    options: RequestInit,
    retries: number = MAX_RETRIES
): Promise<Response> {
    for (let i = 0; i < retries; i++) {
        try {
            const response = await fetch(url, options);
            if (response.ok) return response;

            // Don't retry on client errors (4xx)
            if (response.status >= 400 && response.status < 500) {
                throw new Error(`Client error: ${response.status}`);
            }

            console.warn(`[MediaService] Retry ${i + 1}/${retries} for ${url}`);
            await delay(RETRY_DELAY * (i + 1));
        } catch (error) {
            if (i === retries - 1) throw error;
            await delay(RETRY_DELAY * (i + 1));
        }
    }
    throw new Error(`Failed after ${retries} retries`);
}

// =====================================
// IMAGE GENERATION
// =====================================

/**
 * Generate images using custom image API
 */
export async function generateImage(
    request: ImageGenerationRequest
): Promise<ImageGenerationResult> {
    console.log('[MediaService] Generating image with prompt:', request.prompt.substring(0, 100) + '...');

    try {
        // Build payload based on known working structure
        const payload: Record<string, any> = {
            prompt: request.prompt,
            aspectRatio: request.aspectRatio || '16:9',
            cleanup: request.cleanup ?? true
        };

        // Add subject references (character references)
        if (request.subjects?.length) {
            payload.subjects = request.subjects.map(s => ({
                referenceUrl: s.url,
                caption: s.caption
            }));
        }

        // Add scene references (location references)
        if (request.scenes?.length) {
            payload.scenes = request.scenes.map(s => ({
                referenceUrl: s.url,
                caption: s.caption
            }));
        }

        // Add style references
        if (request.styles?.length) {
            payload.styles = request.styles.map(s => ({
                referenceUrl: s.url,
                caption: s.caption
            }));
        }

        const response = await fetchWithRetry(IMAGE_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${API_KEY}`
            },
            body: JSON.stringify(payload)
        });

        const data = await response.json();

        // Handle different response formats
        if (data.images && Array.isArray(data.images)) {
            return {
                success: true,
                urls: data.images,
                seeds: data.seeds,
                model: data.model,
                generationTime: data.generationTime
            };
        }

        if (data.imageUrl) {
            return {
                success: true,
                urls: [data.imageUrl],
                seeds: data.seed ? [data.seed] : undefined
            };
        }

        // Fallback for base64 response
        if (data.base64) {
            return {
                success: true,
                urls: [`data:image/png;base64,${data.base64}`]
            };
        }

        throw new Error('Unexpected response format from image API');

    } catch (error) {
        console.error('[MediaService] Image generation failed:', error);
        return {
            success: false,
            urls: [],
            error: error instanceof Error ? error.message : 'Unknown error'
        };
    }
}

/**
 * Generate image with character and location references
 */
export async function generateSceneImage(
    prompt: string,
    characterRefs?: Array<{ url: string; name: string }>,
    locationRef?: { url: string; name: string },
    aspectRatio: string = '16:9'
): Promise<ImageGenerationResult> {
    const request: ImageGenerationRequest = {
        prompt,
        aspectRatio: aspectRatio as any,
        cleanup: true
    };

    // Add character subjects
    if (characterRefs?.length) {
        request.subjects = characterRefs.map(c => ({
            url: c.url,
            caption: c.name
        }));
    }

    // Add location as scene reference
    if (locationRef) {
        request.scenes = [{
            url: locationRef.url,
            caption: locationRef.name
        }];
    }

    return generateImage(request);
}

// =====================================
// VIDEO GENERATION
// =====================================

/**
 * Generate video from a starting image
 */
export async function generateVideo(
    request: VideoGenerationRequest
): Promise<VideoGenerationResult> {
    console.log('[MediaService] Generating video with prompt:', request.prompt.substring(0, 100) + '...');

    try {
        const payload = {
            prompt: request.prompt,
            startImage: request.startImage,
            aspectRatio: request.aspectRatio || 'LANDSCAPE',
            duration: request.duration || 5,
            motionStrength: request.motionStrength || 0.7,
            seed: request.seed
        };

        const response = await fetchWithRetry(VIDEO_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${API_KEY}`
            },
            body: JSON.stringify(payload)
        });

        const data = await response.json();

        if (!data.videoUrl || !data.mediaGenerationId) {
            throw new Error('Invalid response: missing videoUrl or mediaGenerationId');
        }

        return {
            success: true,
            videoUrl: data.videoUrl,
            mediaGenerationId: data.mediaGenerationId,
            seed: data.seed || 0,
            duration: data.duration || request.duration || 5
        };

    } catch (error) {
        console.error('[MediaService] Video generation failed:', error);
        return {
            success: false,
            videoUrl: '',
            mediaGenerationId: '',
            seed: 0,
            duration: 0,
            error: error instanceof Error ? error.message : 'Unknown error'
        };
    }
}

// =====================================
// VIDEO UPSCALING
// =====================================

/**
 * Upscale an existing video
 */
export async function upscaleVideo(
    request: UpscaleRequest
): Promise<UpscaleResult> {
    console.log('[MediaService] Upscaling video:', request.mediaGenerationId);

    try {
        const payload = {
            mediaGenerationId: request.mediaGenerationId,
            seed: request.seed,
            aspectRatio: request.aspectRatio || 'LANDSCAPE'
        };

        const response = await fetchWithRetry(UPSCALE_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${API_KEY}`
            },
            body: JSON.stringify(payload)
        });

        const data = await response.json();

        if (!data.upscaledUrl && !data.videoUrl) {
            throw new Error('Invalid response: missing upscaled video URL');
        }

        return {
            success: true,
            upscaledUrl: data.upscaledUrl || data.videoUrl
        };

    } catch (error) {
        console.error('[MediaService] Video upscale failed:', error);
        return {
            success: false,
            upscaledUrl: '',
            error: error instanceof Error ? error.message : 'Unknown error'
        };
    }
}

// =====================================
// UTILITY FUNCTIONS  
// =====================================

/**
 * Convert base64 image to blob URL for display
 */
export function base64ToBlobUrl(base64: string, mimeType: string = 'image/png'): string {
    try {
        const byteCharacters = atob(base64);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: mimeType });
        return URL.createObjectURL(blob);
    } catch {
        return '';
    }
}

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
 * Check if URL is a data URL (base64)
 */
export function isDataUrl(url: string): boolean {
    return url.startsWith('data:');
}
