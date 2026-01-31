

const API_BASE_URL = 'https://api.lehuyducanh.com/api/generate/';
const HARDCODED_API_KEY = '9f3a6c71-1ce2-4af2-9dc4-8d40b7f7c67d';

interface GenerateImageParams {
  prompt: string;
  subjectUrls?: string[];
  styleUrl?: string;
  sceneUrl?: string;
}

interface ApiRequestBody {
    prompt: string;
    subjects?: { url: string, caption: string }[];
    style?: { url: string };
    scene?: { url: string };
    cleanup: boolean;
}

interface ApiResponse {
    urls: string[];
}


export const generateSceneImage = async ({
  prompt,
  subjectUrls,
  styleUrl,
  sceneUrl,
}: GenerateImageParams): Promise<string[]> => {
  const API_ENDPOINT = `${API_BASE_URL}${HARDCODED_API_KEY}`;
  const LOGGING_ENDPOINT = `${API_BASE_URL}[REDACTED_API_KEY]`;

  const requestBody: ApiRequestBody = {
    prompt,
    cleanup: true,
  };

  if (subjectUrls && subjectUrls.length > 0) {
    // Add a default caption to each subject, as per the requested API structure
    requestBody.subjects = subjectUrls.map(url => ({ url, caption: "subject" }));
  }
  if (styleUrl) {
    requestBody.style = { url: styleUrl };
  }
  if (sceneUrl) {
    requestBody.scene = { url: sceneUrl };
  }

  try {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    console.log(`[Image Service] Sending POST request to: ${LOGGING_ENDPOINT}`);
    console.log('[Image Service] Request Body:', JSON.stringify(requestBody, null, 2));

    const response = await fetch(API_ENDPOINT, {
      method: 'POST',
      mode: 'cors', // Explicitly set mode to 'cors' for cross-origin requests
      headers,
      body: JSON.stringify(requestBody),
    });

    // Clone the response to log its text content without consuming the body
    const responseForLogging = response.clone();
    const rawText = await responseForLogging.text();
    console.log(`[Image Service] Received response with status: ${response.status}`);
    console.log('[Image Service] Raw Response Body:', rawText);

    if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}: ${rawText || response.statusText}`);
    }

    // CRITICAL CHECK: Handle cases where the server returns 200 OK but the body is empty.
    // This points to a server-side streaming or proxy issue.
    if (!rawText.trim()) {
        console.error("[Image Service] Critical Error: Server responded with 200 OK but the response body was empty. This is often caused by a server-side error during response streaming or a misconfigured proxy (nginx).");
        throw new Error('Server returned a successful response, but the body was empty. Please check server and proxy (nginx) logs for errors.');
    }

    const result: ApiResponse = await response.json();

    if (!result || !Array.isArray(result.urls)) {
        throw new Error('Invalid response format from image generation API. Expected a "urls" array.');
    }
    
    // This warning is now less likely to be needed due to the check above, but it's good practice.
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
        // We re-throw the specific error message we created above.
        throw new Error(error.message);
    }
    throw new Error('An unknown error occurred during image generation.');
  }
};