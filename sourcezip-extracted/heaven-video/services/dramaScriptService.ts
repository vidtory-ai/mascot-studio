
import { GoogleGenAI } from "@google/genai";

if (!process.env.API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Extracts a specified number of frames from a video file as base64 strings.
 * This function runs entirely in the browser.
 * @param videoFile The video file to process.
 * @param fps The number of frames per second to extract.
 * @returns A promise that resolves to an array of base64 encoded image data (without the data URL prefix).
 */
export const extractFrames = (videoFile: File, fps: number = 0.5): Promise<string[]> => {
  return new Promise((resolve, reject) => {
    const videoElement = document.createElement('video');
    videoElement.muted = true;
    videoElement.crossOrigin = 'anonymous';
    const canvasElement = document.createElement('canvas');
    const context = canvasElement.getContext('2d');
    const framesWithTime: { time: number, data: string }[] = [];
    const objectUrl = URL.createObjectURL(videoFile);

    videoElement.onloadedmetadata = async () => {
      canvasElement.width = videoElement.videoWidth;
      canvasElement.height = videoElement.videoHeight;
      const duration = videoElement.duration;

      // Handle videos that are too short or have no duration
      if (!duration || duration <= 0) {
        URL.revokeObjectURL(objectUrl);
        reject(new Error("Video has no duration or is invalid."));
        return;
      }
      
      // Calculate frameCount based on FPS and duration.
      // Cap at 60 frames for performance and cost reasons. Min 1 frame.
      const frameCount = Math.max(1, Math.min(60, Math.round(duration * fps)));
      console.log(`Analyzing video with duration: ${duration.toFixed(2)}s at ${fps} FPS. Total frames to extract: ${frameCount}`);
      
      const interval = duration / frameCount;

      const captureFrame = (time: number): Promise<void> => {
        return new Promise((resolveCapture, rejectCapture) => {
          const seekTimeout = setTimeout(() => {
            rejectCapture(new Error(`Seek timed out at ${time}s. The video may be corrupted.`));
          }, 5000); // 5 second timeout for seeking

          videoElement.onseeked = () => {
            clearTimeout(seekTimeout);
            if (!context) {
              rejectCapture(new Error("Canvas context is not available."));
              return;
            }
            context.drawImage(videoElement, 0, 0, canvasElement.width, canvasElement.height);
            const frameData = canvasElement.toDataURL('image/jpeg').split(',')[1];
            if (!frameData) {
              rejectCapture(new Error("Failed to get frame data from canvas."));
              return;
            }
            framesWithTime.push({ time, data: frameData });
            // Detach listener to prevent multiple triggers
            videoElement.onseeked = null; 
            resolveCapture();
          };
          videoElement.currentTime = time;
        });
      };

      try {
        for (let i = 0; i < frameCount; i++) {
          const timeToCapture = Math.min(i * interval, duration); // Ensure we don't seek past the end
          await captureFrame(timeToCapture);
        }
        
        // Sort frames by timestamp to guarantee correct chronological order, fixing browser seeking inconsistencies.
        framesWithTime.sort((a, b) => a.time - b.time);
        const sortedFrames = framesWithTime.map(f => f.data);

        URL.revokeObjectURL(objectUrl);
        resolve(sortedFrames);
      } catch (error) {
        URL.revokeObjectURL(objectUrl);
        reject(error);
      }
    };

    videoElement.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Failed to load video file. It might be in an unsupported format or corrupted."));
    };

    videoElement.src = objectUrl;
    videoElement.load(); // Start loading the video
  });
};

/**
 * Sends video frames to Gemini to generate an initial, objective script.
 * @param frames An array of base64 encoded frame data.
 * @returns A promise that resolves to the generated script as a string.
 */
export const generateScriptFromVideoFrames = async (frames: string[]): Promise<string> => {
  const systemInstruction = "You are a professional video analyst. Based on the following sequence of frames from a video, write a detailed script describing the scene. Identify the characters, the setting, their actions, and any potential dialogue or emotional context. Be precise and objective.";
  
  const imageParts = frames.map(frameData => ({
    inlineData: {
      mimeType: 'image/jpeg',
      data: frameData,
    },
  }));

  const response = await ai.models.generateContent({
    model: "gemini-2.5-pro",
    contents: { parts: [{ text: "Analyze these frames and provide a script." }, ...imageParts] },
    config: {
      systemInstruction,
    },
  });

  return response.text.trim();
};

interface RewriteContext {
  selectedCharacterNames: string[];
  setting: string;
}

/**
 * Rewrites a script into an educational children's story.
 * @param originalScript The original script to be rewritten.
 * @param context Context including selected characters and setting.
 * @returns A promise that resolves to the rewritten story as a string.
 */
export const rewriteScript = async (originalScript: string, context?: RewriteContext): Promise<string> => {
  
  const selectedCharsText = context?.selectedCharacterNames && context.selectedCharacterNames.length > 0 
    ? `**Active Characters for this Scene:** ${context.selectedCharacterNames.join(', ')}.`
    : '**Active Characters:** Decide based on the original script, prioritizing Rumi, Mira, and Zoey.';

  const settingText = context?.setting
    ? `**Forced Setting/Location:** ${context.setting}`
    : '**Setting:** Adapt the setting from the raw script to a suitable HUNTR/X location.';

  const systemInstruction = `You are a professional screenwriter specializing in adapting real-world footage into cinematic scenes for the "HUNTR/X" universe. Your signature style is **high-stakes teen drama**, focusing on the intense emotions of rivalry, jealousy, ambition, and betrayal within the competitive K-pop idol world.

Your task is to take a raw, objective script describing a video and rewrite it as a detailed, dramatic scene script ("kịch bản phân cảnh chi tiết") featuring the characters from HUNTR/X and their rivals, the Saja Boys.

**CONTEXT & CHARACTER BIBLE:**

---
**Nhóm HUNTR/X (3 thành viên — nhân vật chính)**
1. Rumi (Kang Rumi) — leader / main vocalist.
2. Mira — visual / main dancer.
3. Zoey — main rapper / maknae (em út).

**Saja Boys (antagonist — boygroup 5 thành viên; thực chất là quỷ ngụy trang)**
4. Jinu (trưởng nhóm Saja Boys).
5. Abby (Abby Saja) — main dancer của Saja.
6. Mystery, Baby, Romance (thành viên còn lại của Saja).

**Nhân vật phụ & phản diện quan trọng**
7. Celine — cựu thợ săn / mentor của HUNTR/X.
8. Gwi-Ma (demon king / chính phản diện).
9. Derpy & Sussie / Baby Saja / Bobby và các quỷ phụ khác.
---

**SCENE CONFIGURATION:**
${selectedCharsText}
${settingText}

**YOUR INSTRUCTIONS:**
1.  **Tone and Style:** The script must be infused with the tension of a teen drama. Emphasize moments of competition, jealousy, envy, and backhanded compliments or outright criticism between the characters. The dialogue should be sharp and emotionally charged. Even in moments of action, the underlying personal conflicts should be palpable.
2.  **Analyze the Input Script:** Read the provided raw script which describes events from a video. Understand the number of people, their actions, the environment, and the overall mood.
3.  **Cast the Scene:** Map the people and actions from the raw script to the **Active Characters** listed above. Be creative but logical.
4.  **Translate the Setting:** Use the **Forced Setting** provided above.
5.  **Write the Script (Strict Formatting):** Produce a high-quality, detailed scene script following these strict formatting rules to ensure a fast-paced, cinematic feel:
    *   **Scene Headings:** Use standard format (e.g., \`INT. DANCE STUDIO - NIGHT\`) to establish the location once.
    *   **Action Lines - One Action Per Line:** Each action line must be concise and describe a **single, specific action or reaction**. Break down complex movements into a sequence of individual lines. This is critical.
        *   **Example Correct:**
            Rumi crosses the practice room floor, her steps silent.
            Her hand closes around the hilt of her saingeom.
            She lifts her head, eyes locking with Jinu's. A cold glare.
        *   **Example Incorrect:** Rumi walks across the room, picks up her sword, and glares at Jinu.
    *   **Dialogue - Short and Punchy:** All dialogue must be brief and impactful. Avoid long speeches. Use it to build tension and reveal character efficiently.
    *   **Character Cues:** Use standard format (e.g., \`RUMI\`).
    *   **Incorporate Character Bible:** Weave in physical details from the character bible into the action lines (e.g., "The glowing patterns on Rumi's arm flare brighter," "A sly, knowing smile plays on Jinu's lips, his amber eyes glinting.").
6.  **Maintain the Core Narrative:** Do not invent a completely new story. The core sequence of events and the emotional arc from the original video script must be the foundation of your new scene. You are adapting, not creating from scratch.`;
    
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: `Here is the original script to rewrite:\n\n---\n\n${originalScript}`,
    config: {
      systemInstruction,
      temperature: 0.8,
    },
  });

  return response.text.trim();
};


/**
 * Translates a script into Vietnamese.
 * @param script The script to translate.
 * @returns A promise that resolves to the translated script as a string.
 */
export const translateScriptToVietnamese = async (script: string): Promise<string> => {
  const systemInstruction = "Translate the following script into Vietnamese. Maintain the original formatting and narrative style.";
    
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: script,
    config: {
      systemInstruction,
    },
  });

  return response.text.trim();
};
