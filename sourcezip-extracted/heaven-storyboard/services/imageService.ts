
import { StoryboardInputs, GeneratedScene, PageType } from "../types";

// --- Helper Functions ---

const mapAspectRatio = (ratio: string): string => {
    switch (ratio) {
        case "1:1": return "IMAGE_ASPECT_RATIO_SQUARE";
        case "16:9": return "IMAGE_ASPECT_RATIO_LANDSCAPE";
        case "9:16": return "IMAGE_ASPECT_RATIO_PORTRAIT";
        case "2.39:1": return "IMAGE_ASPECT_RATIO_LANDSCAPE"; 
        default: return "IMAGE_ASPECT_RATIO_LANDSCAPE";
    }
};

/**
 * Core API Call wrapper with Polling for Async API
 */
async function callCustomApi(parts: any[], scene: GeneratedScene, globalInputs: StoryboardInputs, signal?: AbortSignal): Promise<string> {
    const CUSTOM_API_URL = "https://oldapi84.vidtory.net/api/image/nano2";
    const CUSTOM_API_KEY = "ak_2aa916d74566b4cf611c23e2a71fc35ef99abac6cb7c29c308f94e1f18b51707";
    
    try {
        const mappedAspectRatio = mapAspectRatio(globalInputs.aspectRatio);

        const response = await fetch(CUSTOM_API_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': CUSTOM_API_KEY
          },
          body: JSON.stringify({
            contents: [{ parts: parts }],
            generationConfig: {
              imageConfig: { aspectRatio: mappedAspectRatio }
            },
            cleanup: true
          }),
          signal: signal
        });
    
        if (response.status === 401) throw new Error("API Key Verification Error.");
        if (!response.ok) throw new Error(`API Error ${response.status}`);
    
        const initialData = await response.json();
        let finalOutputUrl = '';

        if (initialData.status === 'done' && initialData.outputs?.[0]?.url) {
            finalOutputUrl = initialData.outputs[0].url;
        } else if (initialData.status === 'pending' || initialData.jobId) {
            const jobId = initialData.jobId;
            const pollUrl = initialData.statusUrl || `${CUSTOM_API_URL}/jobs/${jobId}`;
            const pollInterval = initialData.pollIntervalMs || 3000;

            while (true) {
                if (signal?.aborted) throw new Error("Generation aborted.");
                await new Promise(r => setTimeout(r, pollInterval));
                
                const pollRes = await fetch(pollUrl, {
                    method: 'GET',
                    headers: { 'x-api-key': CUSTOM_API_KEY },
                    signal: signal
                });

                if (!pollRes.ok) throw new Error(`Polling Error ${pollRes.status}`);
                const pollData = await pollRes.json();

                if (pollData.status === 'done') {
                    if (pollData.outputs?.[0]?.url) {
                        finalOutputUrl = pollData.outputs[0].url;
                        break;
                    } else if (pollData.result?.outputs?.[0]?.url) {
                        finalOutputUrl = pollData.result.outputs[0].url;
                        break;
                    } else {
                        throw new Error("Job marked done but no output URL found.");
                    }
                } else if (pollData.status === 'failed' || pollData.status === 'error') {
                     throw new Error(`Job Failed: ${pollData.message}`);
                }
            }
        } else {
             throw new Error("Unexpected API response format.");
        }
        
        const imageFetch = await fetch(finalOutputUrl);
        const imageBlob = await imageFetch.blob();
        return await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(imageBlob);
        });
    
      } catch (error: any) {
        if (error.name === 'AbortError' || signal?.aborted) throw new Error("Cancelled");
        throw error;
      }
}

export const generatePageImage = async (
  scene: GeneratedScene, 
  globalInputs: StoryboardInputs,
  signal?: AbortSignal
): Promise<string> => {
  
  const payloadParts: any[] = [];
  
  const selectedChars = globalInputs.characters.filter(c => scene.selectedCharacterIds.includes(c.id));
  const validRefChars = selectedChars.filter(c => c.imageBase64 && c.imageBase64.includes('base64,'));

  let charContext = "";
  if (selectedChars.length > 0) {
      charContext = "CAST IN SCENE:\n" + selectedChars.map((c, i) => 
          `Cast ${i+1} (${c.name}): ${c.description}`
      ).join('\n') + "\n\n";
  }

  // BUILD SHOT LIST TEXT
  let shotListText = "";
  if (scene.shots && scene.shots.length > 0) {
      // Create detailed breakdown for the prompt
      shotListText = scene.shots.map(s => 
          `Panel ${s.panelNumber} [CAMERA: ${s.shotType}]: ${s.description}`
      ).join('\n');
  } else {
      // Fallback for legacy/manual content
      shotListText = scene.content;
  }

  let globalBgInstruction = "";
  if (globalInputs.globalBackgroundImage) {
      globalBgInstruction = "[GLOBAL LOCATION REFERENCE PROVIDED]: Use the attached global background image as the main setting/location for the scene, unless specific shots demand otherwise.\n";
  }

  // FORCE STORYBOARD SHEET LAYOUT
  const imagePrompt = `
    PROFESSIONAL STORYBOARD SHEET GENERATION.
    
    TYPE: ${scene.gridSize || '2x2 (4 Shots)'} Grid Layout (Split screen).
    STYLE: ${globalInputs.style}
    COLOR: ${globalInputs.colorType}
    
    ${globalBgInstruction}
    ${charContext}
    
    ${validRefChars.length > 0 ? `[REFERENCE IMAGES PROVIDED FOR CAST] - Maintain facial consistency.` : ''}
    
    SCENE BREAKDOWN (SHOT LIST):
    ${shotListText}
    
    INSTRUCTIONS:
    - Create a single image containing distinct panels arranged in a grid.
    - Each panel must show a different shot strictly following the [CAMERA] instruction.
    - Cinematic composition.
    - (Language: ${globalInputs.language})
  `;

  payloadParts.push({ text: imagePrompt });

  // Add Global Background
  if (globalInputs.globalBackgroundImage && globalInputs.globalBackgroundImage.includes('base64,')) {
      const cleanBase64 = globalInputs.globalBackgroundImage.split('base64,')[1];
      const mimeType = globalInputs.globalBackgroundImage.split(';')[0].split(':')[1] || 'image/jpeg';
      payloadParts.push({ inline_data: { mime_type: mimeType, data: cleanBase64 } });
  }

  // Add Manual Ref for this specific scene
  if (scene.manualReferenceImage && scene.manualReferenceImage.includes('base64,')) {
     const cleanBase64 = scene.manualReferenceImage.split('base64,')[1];
     const mimeType = scene.manualReferenceImage.split(';')[0].split(':')[1];
     payloadParts.push({ inline_data: { mime_type: mimeType, data: cleanBase64 } });
  }

  // Add Scene Specific Materials
  if (scene.sceneMaterialImages && scene.sceneMaterialImages.length > 0) {
    scene.sceneMaterialImages.forEach(img => {
      if (img.includes('base64,')) {
        const cleanBase64 = img.split('base64,')[1];
        const mimeType = img.split(';')[0].split(':')[1] || 'image/png';
        payloadParts.push({ inline_data: { mime_type: mimeType, data: cleanBase64 } });
      }
    });
  }

  // Add Character Refs
  validRefChars.forEach((char) => {
    const cleanBase64 = char.imageBase64!.split('base64,')[1];
    const mimeType = char.imageBase64!.split(';')[0].split(':')[1];
    payloadParts.push({ inline_data: { mime_type: mimeType, data: cleanBase64 } });
  });

  return await callCustomApi(payloadParts, scene, globalInputs, signal);
};

export const editPageImage = async (
  scene: GeneratedScene,
  originalImage: string,
  materialImages: string[],
  editInstruction: string,
  globalInputs: StoryboardInputs,
  signal?: AbortSignal
): Promise<string> => {
    
    const payloadParts: any[] = [];
    const selectedChars = globalInputs.characters.filter(c => scene.selectedCharacterIds.includes(c.id));
    const validRefChars = selectedChars.filter(c => c.imageBase64 && c.imageBase64.includes('base64,'));

    let charContext = "";
    if (selectedChars.length > 0) {
        charContext = "CAST IN SCENE (Maintain Consistency):\n" + selectedChars.map((c, i) => 
            `Cast ${i+1} (${c.name}): ${c.description}`
        ).join('\n') + "\n\n";
    }

    let globalBgInstruction = "";
    if (globalInputs.globalBackgroundImage) {
        globalBgInstruction = "Use the provided Global Background image as the environment style reference.\n";
    }

    const fullPrompt = `
    EDITING STORYBOARD SHEET:
    Modify the provided storyboard sheet based on instructions. Maintain the grid layout.
    
    STYLE: ${globalInputs.style}
    
    ${globalBgInstruction}
    ${charContext}

    INSTRUCTION: ${editInstruction}
    `;
    payloadParts.push({ text: fullPrompt });

    if (originalImage.includes('base64,')) {
        const clean = originalImage.split('base64,')[1];
        const mime = originalImage.split(';')[0].split(':')[1] || 'image/jpeg';
        payloadParts.push({ inline_data: { mime_type: mime, data: clean } });
    }

    // Add Global Background for Edit context
    if (globalInputs.globalBackgroundImage && globalInputs.globalBackgroundImage.includes('base64,')) {
        const cleanBase64 = globalInputs.globalBackgroundImage.split('base64,')[1];
        const mimeType = globalInputs.globalBackgroundImage.split(';')[0].split(':')[1] || 'image/jpeg';
        payloadParts.push({ inline_data: { mime_type: mimeType, data: cleanBase64 } });
    }

    materialImages.forEach(img => {
        if (img.includes('base64,')) {
            const clean = img.split('base64,')[1];
            const mime = img.split(';')[0].split(':')[1] || 'image/png';
            payloadParts.push({ inline_data: { mime_type: mime, data: clean } });
        }
    });

    validRefChars.forEach((char) => {
      const cleanBase64 = char.imageBase64!.split('base64,')[1];
      const mimeType = char.imageBase64!.split(';')[0].split(':')[1];
      payloadParts.push({ inline_data: { mime_type: mimeType, data: cleanBase64 } });
    });

    return await callCustomApi(payloadParts, scene, globalInputs, signal);
};
