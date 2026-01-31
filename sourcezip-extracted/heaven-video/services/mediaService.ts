// services/mediaService.ts

// This service communicates with a custom backend API for media generation.

// --- CONFIGURATION ---
// Endpoints for the custom backend API.
const VIDEO_API_ENDPOINT = 'https://api.lehuyducanh.com/api/generate-video/d7a53315-74b0-4d92-b7bc-0cebc51412e2';
const UPSCALE_API_ENDPOINT = 'https://api.lehuyducanh.com/api/upscale-video/3a5983d5-9a61-4f2c-9f6f-7915c15ecf3b';
// Updated Image API configuration based on the working example
const IMAGE_API_BASE_URL = 'https://api.lehuyducanh.com/api/generate/';
const IMAGE_API_KEY = '9f3a6c71-1ce2-4af2-9dc4-8d40b7f7c67d';

// --- HELPER FUNCTIONS ---

/**
 * Parses a Data URL string into its base64 content and mimeType.
 * @param dataUrl The Data URL (e.g., "data:image/jpeg;base64,...")
 * @returns An object with base64 and mimeType.
 */
const dataUrlToImageInfo = (dataUrl: string): { base64: string; mimeType: string } => {
    const [meta, base64Data] = dataUrl.split(',');
    if (!meta || !base64Data) {
        throw new Error('Invalid Data URL format');
    }
    const mimeType = meta.split(':')[1]?.split(';')[0];
    if (!mimeType) {
        throw new Error('Could not determine MIME type from Data URL');
    }
    return {
        base64: base64Data,
        mimeType
    };
};

// --- INTERFACES ---

interface GenerateImageParams {
    prompt: string;
    subjectUrls?: string[];
    styleUrl?: string;
    sceneUrl?: string;
}

// --- API SERVICES ---

/**
 * Generates an image by calling the custom image generation API.
 * The logic has been updated to match a known working implementation from another application.
 */
export const generateSceneImage = async ({
    prompt,
    subjectUrls = [],
    styleUrl,
    sceneUrl,
}: GenerateImageParams): Promise<string[]> => {
    const API_ENDPOINT = `${IMAGE_API_BASE_URL}${IMAGE_API_KEY}`;

    // This payload structure is based on the working API example.
    // It sends full data URLs directly.
    const payload: any = {
        prompt,
        cleanup: true,
    };

    if (subjectUrls.length > 0) {
        // The working API expects a caption. "subject" is a safe default.
        payload.subjects = subjectUrls.map(url => ({ url, caption: "subject" }));
    }
    if (styleUrl) {
        payload.style = { url: styleUrl };
    }
    if (sceneUrl) {
        payload.scene = { url: sceneUrl };
    }

    try {
        console.log(`[Image Service] Sending POST request to: ${API_ENDPOINT}`);
        console.log('[Image Service] Request Body:', JSON.stringify(payload, null, 2));

        const response = await fetch(API_ENDPOINT, {
            method: 'POST',
            mode: 'cors', // Explicitly set for cross-origin requests
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        });

        const responseForLogging = response.clone();
        const rawText = await responseForLogging.text();
        console.log(`[Image Service] Received response with status: ${response.status}`);
        console.log('[Image Service] Raw Response Body:', rawText);
        
        if (!response.ok) {
            throw new Error(`API request failed with status ${response.status}: ${rawText || response.statusText}`);
        }
        
        // CRITICAL CHECK: Handle cases where the server returns 200 OK but the body is empty.
        if (!rawText.trim()) {
            console.error("[Image Service] Critical Error: Server responded with 200 OK but the response body was empty.");
            throw new Error('Server returned a successful response, but the body was empty. Please check server logs.');
        }

        const result = await response.json();

        if (!result || !Array.isArray(result.urls)) {
            throw new Error('Invalid response format from image generation API. Expected a "urls" array.');
        }
        
        if (result.urls.length === 0) {
            console.warn('[Image Service] API returned a success status but the "urls" array is empty.');
            throw new Error('Server processed the request successfully, but returned no images. Please check server logs for details.');
        }
        
        return result.urls;

    } catch (error) {
        console.error("Error generating scene image:", error);
        if (error instanceof TypeError && error.message === 'Failed to fetch') {
          throw new Error('Failed to fetch. This is likely a CORS issue or network problem. Please ensure the server is running and configured correctly.');
        }
        if (error instanceof Error) {
            // Re-throw the specific error message to be displayed in the UI.
            throw new Error(error.message);
        }
        throw new Error('An unknown error occurred during image generation.');
    }
};

/**
 * Generates a base video (without upscaling) and returns the necessary data for a potential upscale operation.
 */
export const generateSceneVideo = async (prompt: string, imageUrl: string): Promise<{ videoUrl: string; mediaGenerationId: string; seed: number; }> => {
    try {
        const { base64, mimeType } = dataUrlToImageInfo(imageUrl);

        const payload = {
            prompt,
            projectId: "d6e423d4-bcb4-4e03-a3fb-8133be31d304", // from provided test script
            cleanup: true,
            upscale: false, // Always generate the base video first
            aspectRatio: 'VIDEO_ASPECT_RATIO_LANDSCAPE', // 16:9
            image: {
                base64,
                mimeType,
                fileName: "start-image.jpg"
            }
        };

        const response = await fetch(VIDEO_API_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Request-Id': `chunchin-app-${crypto.randomUUID()}`,
                'Origin': 'https://labs.google',
            },
            body: JSON.stringify(payload),
        });

        const responseData = await response.json();

        if (!response.ok) {
            const errorMessage = responseData?.error?.message || responseData.message || JSON.stringify(responseData);
            throw new Error(`API Error (${response.status}): ${errorMessage}`);
        }

        const { videoUrl, mediaGenerationId, seed } = responseData;

        if (!videoUrl || !mediaGenerationId) {
            console.warn("Initial video generation response missing required fields.", responseData);
            throw new Error("Initial video generation failed to return a required videoUrl or mediaGenerationId.");
        }

        return { videoUrl, mediaGenerationId, seed };

    } catch (error) {
        console.error("Error generating base video:", error);
        const message = error instanceof Error ? error.message : "An unknown error occurred.";
        throw new Error(`Failed to generate video: ${message}. This is a lengthy process and may fail intermittently. Please try again.`);
    }
};

/**
 * Upscales an existing video using its mediaGenerationId.
 */
export const upscaleSceneVideo = async (mediaGenerationId: string, seed?: number): Promise<string> => {
    try {
        const payload = {
            mediaGenerationId,
            seed,
            aspectRatio: 'VIDEO_ASPECT_RATIO_LANDSCAPE',
        };

        const response = await fetch(UPSCALE_API_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Request-Id': `chunchin-app-upscale-${crypto.randomUUID()}`,
                'Origin': 'https://labs.google',
            },
            body: JSON.stringify(payload),
        });
        
        const responseData = await response.json();

        if (!response.ok) {
            const errorMessage = responseData?.error?.message || responseData.message || JSON.stringify(responseData);
            throw new Error(`API Error (${response.status}): ${errorMessage}`);
        }

        const upscaledVideoUrl = responseData.videoUrl;

        if (!upscaledVideoUrl) {
            console.warn("Upscale response did not contain a videoUrl.", responseData);
            throw new Error("Upscale call succeeded, but the API did not return a video URL.");
        }

        return upscaledVideoUrl;

    } catch (error) {
        console.error("Error upscaling video:", error);
        const message = error instanceof Error ? error.message : "An unknown error occurred.";
        throw new Error(`Failed to upscale video: ${message}. Please try again.`);
    }
};