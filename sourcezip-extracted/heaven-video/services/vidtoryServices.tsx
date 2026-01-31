
// services/vidtoryServices.tsx
import { settingsService } from './settingsService';

// --- CONSTANTS ---
const IMAGE_API_ENDPOINT = 'https://oldapi84.vidtory.net/api/image/nano2';
const VIDEO_API_ENDPOINT = 'https://oldapi84.vidtory.net/api/video/generate';

// --- FIXED CRITICAL PROMPTS (Middleware) ---
// These are appended programmatically to save AI tokens and enforce strict rules.
const FIXED_IMAGE_PROMPT_SUFFIX = " . Focus strictly on the main subject. No extra characters in background. High quality, clean composition.";
const FIXED_VIDEO_PROMPT_SUFFIX = " . Keep background stable. No warping. No distortion. Smooth motion.";

// --- HELPER FUNCTIONS ---

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// --- INTERFACES ---

interface GenerateImageParams {
    prompt: string;
    subjectUrls?: string[];
    styleUrl?: string;
    sceneUrl?: string;
    signal?: AbortSignal;
}

// --- API SERVICES ---

/**
 * Generates an image by calling the new Nano2 asynchronous API.
 * Uses a Submit -> Poll pattern.
 */
export const generateSceneImage = async ({
    prompt,
    subjectUrls = [],
    styleUrl,
    sceneUrl,
    signal
}: GenerateImageParams): Promise<string[]> => {
    const apiKey = settingsService.getApiKey();

    if (!apiKey) {
        throw new Error("API Key chưa được cấu hình. Vui lòng vào Cài đặt và nhập thông tin.");
    }
    
    // MIDDLEWARE: Append fixed constraints
    const finalPrompt = prompt + FIXED_IMAGE_PROMPT_SUFFIX;

    // Construct parts for the payload
    const parts: any[] = [{ text: finalPrompt }];

    // Combine all reference images (subjects, style, scene) into inline_data parts
    const referenceImages = [...subjectUrls];
    if (styleUrl) referenceImages.push(styleUrl);
    if (sceneUrl) referenceImages.push(sceneUrl);

    for (const dataUrl of referenceImages) {
        if (typeof dataUrl === 'string' && dataUrl.startsWith('data:')) {
            const [meta, data] = dataUrl.split(',');
            const mimeType = meta.split(':')[1].split(';')[0];
            parts.push({
                inline_data: {
                    mime_type: mimeType,
                    data: data
                }
            });
        }
    }

    const payload = {
        contents: [{ parts: parts }],
        generationConfig: {
            imageConfig: { aspectRatio: 'IMAGE_ASPECT_RATIO_LANDSCAPE' }
        },
        cleanup: true
    };

    try {
        console.log(`[Image Service] Sending POST request to: ${IMAGE_API_ENDPOINT}`);

        // --- Step 1: Submit Job ---
        const response = await fetch(IMAGE_API_ENDPOINT, {
            method: 'POST',
            mode: 'cors',
            headers: {
                'Content-Type': 'application/json',
                'X-API-Key': apiKey,
            },
            body: JSON.stringify(payload),
            signal
        });

        const initialResponse = await response.json();

        if (!response.ok && response.status !== 202) {
             throw new Error(`API Error (${response.status}): ${JSON.stringify(initialResponse)}`);
        }

        const initialOutputs = initialResponse.outputs || initialResponse.result?.outputs;
        if (initialResponse.status === 'done' && initialOutputs) {
             return initialOutputs.map((o: any) => o.url);
        }

        const jobId = initialResponse.jobId;
        const pollInterval = initialResponse.pollIntervalMs || 5000;

        if (!jobId) throw new Error("API did not return a Job ID.");

        // --- Step 2: Poll for Results ---
        const pollUrl = `${IMAGE_API_ENDPOINT}/jobs/${jobId}`;
        const maxRetries = 20;
        let attempt = 0;

        while (attempt < maxRetries) {
            if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');

            attempt++;
            await delay(pollInterval);
            
            if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');

            console.log(`[Image Service] Polling image job ${jobId}... Attempt ${attempt}`);
            
            const pollResponse = await fetch(pollUrl, {
                method: 'GET',
                headers: { 'X-API-Key': apiKey },
                signal
            });

            if (pollResponse.status === 404) throw new Error("Job not found (404) during polling.");

            const pollData = await pollResponse.json();

            if (pollData.status === 'done') {
                const outputs = pollData.outputs || pollData.result?.outputs;
                if (outputs && outputs.length > 0) {
                    return outputs.map((o: any) => o.url);
                } else {
                    throw new Error("Job completed but returned no output URLs.");
                }
            } else if (pollData.status === 'failed' || pollData.status === 'error') {
                throw new Error(`Image generation failed: ${JSON.stringify(pollData)}`);
            }
        }

        throw new Error("Image generation timed out.");

    } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') {
            console.log("Image generation cancelled by user.");
            throw error;
        }
        console.error("Lỗi khi tạo ảnh cảnh:", error);
        throw error instanceof Error ? error : new Error('Unknown error');
    }
};

/**
 * Generates a video using the new asynchronous, polling-based API.
 */
export const generateSceneVideo = async (prompt: string, imageUrl: string, signal?: AbortSignal): Promise<string> => {
    const apiKey = settingsService.getApiKey();
    
    if (!apiKey) {
        throw new Error("API Key chưa được cấu hình. Vui lòng vào Cài đặt và nhập thông tin.");
    }

    // MIDDLEWARE: Append fixed constraints
    const finalPrompt = prompt + FIXED_VIDEO_PROMPT_SUFFIX;

    // --- Step 1: Submit generation job ---
    let jobId = '';
    let pollInterval = 10000;

    try {
        const payload = {
            prompt: finalPrompt,
            generationMode: "START_ONLY",
            aspectRatio: "VIDEO_ASPECT_RATIO_LANDSCAPE",
            startImage: { url: imageUrl }
        };

        const response = await fetch(VIDEO_API_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-API-Key': apiKey,
            },
            body: JSON.stringify(payload),
            signal
        });
        
        const responseData = await response.json();
        
        if (!response.ok && response.status !== 202) {
            const errorMessage = responseData?.message || JSON.stringify(responseData);
            throw new Error(`Gửi yêu cầu video thất bại (${response.status}): ${errorMessage}`);
        }

        jobId = responseData.jobId;
        if (!jobId) throw new Error("API không trả về 'jobId'.");
        
        if (responseData.pollIntervalMs) pollInterval = responseData.pollIntervalMs;

        console.log(`[Video Service] Job submitted. Job ID: ${jobId}`);

    } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') throw error;
        console.error("Lỗi khi gửi yêu cầu tạo video:", error);
        throw new Error(`Không thể bắt đầu tạo video: ${error instanceof Error ? error.message : "Lỗi không xác định"}`);
    }

    // --- Step 2: Poll for job status ---
    const pollingUrl = `${VIDEO_API_ENDPOINT.replace('/generate', '')}/jobs/${jobId}`;
    const maxRetries = 60;
    let attempt = 0;

    while (attempt < maxRetries) {
        if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');

        attempt++;
        await delay(pollInterval);
        
        if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');
        
        console.log(`[Video Service] Polling job status... Attempt ${attempt}/${maxRetries}`);
        try {
            const pollResponse = await fetch(pollingUrl, {
                headers: { 'X-API-Key': apiKey },
                signal
            });
            
            if (!pollResponse.ok) continue;

            const statusData = await pollResponse.json();

            if (statusData.status === 'COMPLETE') {
                if (statusData.payload?.video?.url) {
                    return statusData.payload.video.url;
                } else {
                    throw new Error("Trạng thái COMPLETE nhưng thiếu URL video.");
                }
            } else if (statusData.status === 'FAILED') {
                let errorMessage = "Video generation failed";
                if (statusData.error?.details?.operation?.error?.message) {
                     errorMessage = `Lỗi hệ thống: ${statusData.error.details.operation.error.message}`;
                } else if (statusData.payload?.error) {
                     errorMessage = `Lỗi: ${statusData.payload.error}`;
                } else if (statusData.error?.message) {
                     errorMessage = `Lỗi: ${statusData.error.message}`;
                }
                throw new Error(`${errorMessage}`);
            }

        } catch (error) {
             if (error instanceof DOMException && error.name === 'AbortError') throw error;
             // Retry unless it's a hard error
             if (error instanceof Error && (error.message.includes("Lỗi") || error.message.includes("thất bại"))) {
                 throw error;
            }
        }
    }

    throw new Error("Tạo video mất quá nhiều thời gian.");
};

/**
 * Generates a landscape transition video between two images using START_AND_END mode.
 */
export const generateTransitionVideo = async (
    startImageUrl: string, 
    endImageUrl: string, 
    prompt: string, 
    signal?: AbortSignal
): Promise<string> => {
    const apiKey = settingsService.getApiKey();
    if (!apiKey) throw new Error("API Key chưa được cấu hình.");

    const finalPrompt = prompt + FIXED_VIDEO_PROMPT_SUFFIX;

    // --- Step 1: Submit ---
    let jobId = '';
    let pollInterval = 10000;

    try {
        const payload = {
            prompt: finalPrompt,
            generationMode: "START_AND_END",
            aspectRatio: "VIDEO_ASPECT_RATIO_LANDSCAPE",
            startImage: { url: startImageUrl },
            endImage: { url: endImageUrl }
        };

        const response = await fetch(VIDEO_API_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-API-Key': apiKey,
            },
            body: JSON.stringify(payload),
            signal
        });
        
        const responseData = await response.json();
        
        if (!response.ok && response.status !== 202) {
            throw new Error(`Lỗi gửi yêu cầu transition: ${responseData.message || response.statusText}`);
        }

        jobId = responseData.jobId;
        if (!jobId) throw new Error("API không trả về 'jobId'.");
        if (responseData.pollIntervalMs) pollInterval = responseData.pollIntervalMs;

    } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') throw error;
        console.error("Lỗi khi gửi yêu cầu:", error);
        throw error;
    }

    // --- Step 2: Poll ---
    const pollingUrl = `${VIDEO_API_ENDPOINT.replace('/generate', '')}/jobs/${jobId}`;
    const maxRetries = 60;
    let attempt = 0;

    while (attempt < maxRetries) {
        if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');
        attempt++;
        await delay(pollInterval);
        if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');
        
        try {
            const pollResponse = await fetch(pollingUrl, {
                headers: { 'X-API-Key': apiKey },
                signal
            });
            
            if (!pollResponse.ok) continue;

            const statusData = await pollResponse.json();

            if (statusData.status === 'COMPLETE') {
                if (statusData.payload?.video?.url) {
                    return statusData.payload.video.url;
                } else {
                    throw new Error("Trạng thái COMPLETE nhưng không tìm thấy URL video.");
                }
            } else if (statusData.status === 'FAILED') {
                 throw new Error("Video generation failed: " + (statusData.error?.message || "Unknown Error"));
            }
        } catch (error) {
            if (error instanceof DOMException && error.name === 'AbortError') throw error;
            if (error instanceof Error && error.message.includes("failed")) throw error;
        }
    }
    throw new Error("Timeout generating transition.");
};
