
// services/media/lehuyducanhService.ts
import { settingsService } from '../settingsService';

// --- CONSTANTS ---
const IMAGE_API_ENDPOINT_NANO = 'https://oldapi84.vidtory.net/api/image/nano';
const IMAGE_API_ENDPOINT_NANO2 = 'https://oldapi84.vidtory.net/api/image/nano2';
const VIDEO_API_ENDPOINT = 'https://oldapi84.vidtory.net/api/video/generate';

// --- FIXED CRITICAL PROMPTS (Middleware) ---
const FIXED_IMAGE_PROMPT_SUFFIX = " . Focus strictly on the main subject. No extra characters. Clean composition.";
const FIXED_VIDEO_PROMPT_SUFFIX = " . Keep background stable. No distortion. Smooth motion.";

// --- HELPER FUNCTIONS ---

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// --- INTERFACES ---

export interface GenerateImageParams {
    prompt: string;
    subjectUrls?: string[];
    styleUrl?: string;
    sceneUrl?: string;
    model?: 'nano' | 'nano2';
    signal?: AbortSignal;
}

// --- API SERVICES ---

export const generateSceneImage = async ({
    prompt,
    subjectUrls = [],
    styleUrl,
    sceneUrl,
    model = 'nano',
    signal
}: GenerateImageParams): Promise<string[]> => {
    const apiKey = settingsService.getApiKey();

    if (!apiKey) {
        throw new Error("API Key chưa được cấu hình. Vui lòng vào Cài đặt và nhập thông tin.");
    }

    const endpoint = model === 'nano2' ? IMAGE_API_ENDPOINT_NANO2 : IMAGE_API_ENDPOINT_NANO;
    
    // MIDDLEWARE: Append constraint
    const finalPrompt = prompt + FIXED_IMAGE_PROMPT_SUFFIX;

    const parts: any[] = [{ text: finalPrompt }];

    const referenceImages = [...subjectUrls];
    if (styleUrl) referenceImages.push(styleUrl);
    if (sceneUrl) referenceImages.push(sceneUrl);

    for (const dataUrl of referenceImages) {
        if (typeof dataUrl === 'string' && dataUrl.startsWith('data:')) {
            const [meta, data] = dataUrl.split(',');
            const mimeTypeMatch = meta.match(/:(.*?);/);
            const mimeType = mimeTypeMatch ? mimeTypeMatch[1] : 'image/jpeg';
            
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
        const response = await fetch(endpoint, {
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

        const pollUrl = `${endpoint}/jobs/${jobId}`;
        const maxRetries = 20;
        let attempt = 0;

        while (attempt < maxRetries) {
            if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');
            attempt++;
            await delay(pollInterval);
            if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');

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
        if (error instanceof DOMException && error.name === 'AbortError') throw error;
        console.error("Lỗi khi tạo ảnh cảnh:", error);
        throw error instanceof Error ? error : new Error('Unknown error');
    }
};

export const generateSceneVideo = async (prompt: string, imageUrl: string, signal?: AbortSignal): Promise<string> => {
    const apiKey = settingsService.getApiKey();
    if (!apiKey) throw new Error("API Key chưa được cấu hình.");

    // MIDDLEWARE: Append constraint
    const finalPrompt = prompt + FIXED_VIDEO_PROMPT_SUFFIX;

    // --- Step 1: Submit ---
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
            throw new Error(`Gửi yêu cầu video thất bại (${response.status}): ${responseData.message}`);
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
                 throw new Error("Video generation failed.");
            }
        } catch (error) {
            if (error instanceof DOMException && error.name === 'AbortError') throw error;
            if (error instanceof Error && error.message.includes("FAILED")) throw error;
        }
    }
    throw new Error("Timeout.");
};
