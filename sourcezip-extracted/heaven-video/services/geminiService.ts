
import { GoogleGenAI, Type, Modality } from "@google/genai";
import { StoryboardScene, Character, AgentAnalysisResult, ContinuityReport, Setting } from '../types';

if (!process.env.API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const baseSchema = {
    type: Type.ARRAY,
    description: "An array of storyboard scenes. A single lyric can be broken down into multiple scenes for more dynamic storytelling.",
    items: {
      type: Type.OBJECT,
      properties: {
        lyric: {
          type: Type.STRING,
          description: "The original lyric line or segment this scene is based on."
        },
        imagePrompt: {
          type: Type.STRING,
          description: "A detailed prompt for generating the **starting frame** of the scene. It must focus on the static composition: characters' appearance and pose, detailed background, objects, and lighting."
        },
        videoPrompt: {
          type: Type.STRING,
          description: "A concise prompt describing the **action and movement** within the scene. It should focus only on what changes or moves."
        },
        charactersInScene: {
          type: Type.ARRAY,
          description: "An array of names of the characters present in this scene. Use names from the provided character list.",
          items: {
            type: Type.STRING
          }
        }
      },
      required: ["lyric", "imagePrompt", "videoPrompt", "charactersInScene"]
    }
};

const mainSchema = {
  type: Type.OBJECT,
  properties: {
    scenes: baseSchema
  },
  required: ["scenes"]
};

const characterSchema = {
    type: Type.OBJECT,
    properties: {
        characters: {
            type: Type.ARRAY,
            description: "An array of characters found in the lyrics.",
            items: {
                type: Type.OBJECT,
                properties: {
                    name: { type: Type.STRING, description: "The character's name. Be creative if a name isn't specified." },
                    description: { 
                        type: Type.STRING, 
                        description: "A detailed description of the character's physical appearance, including facial features, hair, clothing, and body type, based purely on the lyrical context. The description MUST NOT include abstract personality traits, feelings, motivations, or personal situations." 
                    },
                    isMainCharacter: { type: Type.BOOLEAN, description: "True if this is a main character central to the story, false if they are a minor or background character." }
                },
                required: ["name", "description", "isMainCharacter"]
            }
        }
    },
    required: ["characters"]
};

const lyricsSystemInstruction = `You are a master storyteller and songwriter, an expert in crafting dramatic, emotionally charged narratives for pop and rock anthems, similar to a K-drama or music industry storyline. Your task is to write song lyrics that tell a powerful story of betrayal and empowerment in a continuous, narrative-driven format.

**Storytelling Format:**
Instead of a traditional verse-chorus structure, the lyrics should flow like a story, with a climactic chorus appearing only in the middle and at the end to mark major emotional turning points.

**Story Structure to Follow:**
You will be given a central theme/idea and a list of characters. Use them to create a song with a clear narrative arc that follows this structure:
1.  **[Verse 1 - The Promise]:** Introduce the main character and their close relationship with another character (a collaborator, a lover, a friend). Describe a moment of shared success or a promise for the future. Hint at a subtle, underlying tension.
2.  **[Verse 2 - The Betrayal]:** Introduce a third character or a situation that creates conflict. The partner starts to pull away, becoming cold and distant. The betrayal occurs, either witnessed or discovered. Build the tension leading to the emotional peak.
3.  **[Chorus - The Breaking Point]:** This is the emotional climax of the first half of the story. The lyrics should capture the raw pain of being betrayed, lied to, or replaced. Use strong, emotional imagery related to the initial promise being broken. This chorus is powerful and explosive.
4.  **[Verse 3 - The Aftermath]:** The main character hits their lowest point. They are alone, surrounded by reminders of the betrayal (e.g., seeing the other two succeed together). This verse should be filled with imagery of rain, darkness, or a shattered stage.
5.  **[Verse 4 - The Rebirth]:** This is the turning point. In their solitude and pain, the main character finds a new strength. They decide to channel their heartbreak into their art. It's a moment of transformation from sorrow to fierce determination.
6.  **[Final Chorus - The Triumph]:** The main character re-emerges, stronger and more powerful than before. They are now the star. This final chorus is re-contextualized—it's no longer just about pain, but about the fire that came from it. It's a declaration of power and self-worth.
7.  **[Outro - The Ascension]:** A final, triumphant declaration of independence and success, leaving the betrayers in the past as the main character's star rises.

**CRITICAL RULES:**
*   The drama MUST be driven by intense feelings of **betrayal, jealousy, and rivalry.** The story is about one character's journey through this heartbreak.
*   The ending MUST NOT be about reconciliation or forgiveness for everyone. The ending is about the **protagonist's personal triumph and empowerment.** They turn their pain into success and leave the others behind.
*   You MUST label the different parts of the song using the specified notation (e.g., [Verse 1 - The Promise], [Chorus - The Breaking Point]). This is mandatory. The output should only contain these labels and the lyrics.`;


const identifyCharactersSystemInstruction = `You are a script analyst AI. Your task is to read through song lyrics and identify all the distinct characters mentioned or implied. For each character, you must provide a unique name and a detailed **physical description**. This description must focus ONLY on concrete, visual details like facial features, hair style and color, body type, and potential clothing style as implied by the lyrics. **DO NOT include abstract information** such as personality traits, emotions, motivations, or their background. The goal is to create a visual blueprint for an artist. You must also determine if they are a main character. Return the response as a single JSON object that strictly adheres to the provided schema. **CRITICAL RULE: The 'description' for each character MUST be written in Vietnamese.**`;

const baseSystemInstruction = `You are an expert music video director and storyboard artist named 'Director AI'. Your task is to transform lyrics into cinematic storyboard prompts.

**CRITICAL RULE: PROMPT PURITY**
*   **DO NOT** include technical negative constraints in your output (e.g., do not write "stable background", "no distortion", "no extra characters", "high quality").
*   The system will automatically append these technical fixes.
*   Your job is strictly **CREATIVE CONTENT** description.

**PROVIDED CHARACTERS:**
Use the provided names and descriptions.

**CINEMATIC RULES:**
*   Vary shot types (WS, MCU, CU).
*   Break down complex lyrics into 2-3 scenes.
*   Max 3 characters per scene.

**1. Image Prompt:**
*   Describe character pose, expression, and environment clearly.

**2. Video Motion Prompt:**
*   Describe only the movement (e.g., "Camera pans left," "Character A smiles.").

Return a single JSON object.`;

export const mapSceneDefaults = (scene: Partial<StoryboardScene>): StoryboardScene => ({
    id: crypto.randomUUID(),
    lyric: scene.lyric || '',
    imagePrompt: scene.imagePrompt || '',
    videoPrompt: scene.videoPrompt || '',
    charactersInScene: scene.charactersInScene || [],
    extraCharacters: [],
    imageUrls: [],
    thumbnails: [],
    isGeneratingImage: false,
    imageGenerationError: null,
    selectedImageForVideo: undefined,
    videoUrl: undefined,
    playableVideoUrl: undefined,
    isGeneratingVideo: false,
    videoGenerationError: null,
    shouldUpscaleVideo: false,
    mediaGenerationId: undefined,
    seed: undefined,
    upscaledVideoUrl: undefined,
    playableUpscaledVideoUrl: undefined,
    isUpscaling: false,
    backgroundUrl: undefined,
    shots: [],
    isExpanded: true,
    isBreakingDown: false,
    shotType: scene.shotType || 'Medium Shot',
    directorialReasoning: scene.directorialReasoning || '',
    estimatedDuration: scene.estimatedDuration || 5,
    continuityIssues: [],
    cameraMovement: scene.cameraMovement || '',
    screenDirection: scene.screenDirection || '',
    transition: scene.transition || 'Cut'
});

export const generateLyrics = async (idea: string, characterNames: string, outputLanguage: string): Promise<string> => {
    try {
        const finalSystemInstruction = lyricsSystemInstruction + `\n\n**Output Language:** You MUST write the final lyrics strictly in **${outputLanguage}**, even if the input idea or character names are in another language.`;
        
        const response = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: `Theme/Idea: ${idea}\nCharacters: ${characterNames}`,
          config: {
            systemInstruction: finalSystemInstruction,
            temperature: 0.9,
          },
        });
        return response.text.trim();
    } catch (error) {
        console.error("Error generating lyrics:", error);
        throw new Error("Failed to generate lyrics from the AI. Please try a different idea.");
    }
};

export const identifyCharacters = async (lyrics: string): Promise<Omit<Character, 'id'>[]> => {
    try {
        const response = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: `Here are the lyrics:\n---\n${lyrics}\n---`,
          config: {
            systemInstruction: identifyCharactersSystemInstruction,
            responseMimeType: "application/json",
            responseSchema: characterSchema,
            temperature: 0.2,
          },
        });

        const jsonText = response.text.trim();
        const result = JSON.parse(jsonText);

        if (result && Array.isArray(result.characters)) {
            return result.characters;
        } else {
            console.warn("Character identification returned invalid format", result);
            return []; // Return empty array if no characters found or format is wrong
        }

    } catch (error) {
        console.error("Error identifying characters:", error);
        throw new Error("Failed to identify characters from lyrics.");
    }
};

export const generateStoryboard = async (
    lyrics: string, 
    style: string, 
    theme: string,
    language: string,
    characters: Character[]
): Promise<StoryboardScene[]> => {
  try {
    const textPrompt = `Lyrics:\n---\n${lyrics}\n---\n\nStyle: ${style}\n\nTheme/Core Idea: ${theme}`;
    let finalSystemInstruction = baseSystemInstruction;
    
    // Add character details to the system instruction
    if (characters.length > 0) {
      let characterInstructions = `\n\n**CHARACTER LIST FOR THIS STORY:**\n`;
      characters.forEach(c => {
          const role = c.isMainCharacter ? 'Main Character' : 'Minor Character';
          const visual = c.assetUrl ? `A visual reference for this character HAS been provided and MUST be followed.` : 'No visual reference provided; adhere to the description.';
          characterInstructions += `- **Name:** ${c.name} (${role})\n  **Description:** ${c.description}\n  **Visuals:** ${visual}\n`;
      });
      finalSystemInstruction += characterInstructions;
    }
    
    finalSystemInstruction += `\n\n**Output Language:** You MUST generate all prompts strictly in **${language}**.`;
    
    const textPart = { text: textPrompt };
    
    const imageParts = characters
        .filter(c => c.assetUrl)
        .map(c => {
            const mimeTypeMatch = c.assetUrl!.match(/data:(image\/[^;]+);base64,/);
            return {
                inlineData: {
                    mimeType: mimeTypeMatch ? mimeTypeMatch[1] : 'image/png',
                    data: c.assetUrl!.split(',')[1],
                },
            };
        });

    const contents = { parts: [textPart, ...imageParts] };

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: contents,
      config: {
        systemInstruction: finalSystemInstruction,
        responseMimeType: "application/json",
        responseSchema: mainSchema,
        temperature: 0.8,
        topP: 0.95,
      },
    });

    const jsonText = response.text.trim();
    const result = JSON.parse(jsonText);
    
    if (result && Array.isArray(result.scenes)) {
        return result.scenes.map(mapSceneDefaults);
    } else {
        throw new Error("Invalid response format from API.");
    }
  } catch (error) {
    console.error("Error generating storyboard:", error);
    throw new Error("Failed to generate storyboard. Please check your input or API key and try again.");
  }
};

export const analyzeImageComposition = async (imageDataUrl: string): Promise<string> => {
    const systemInstruction = `You are a world-class scene composition analyst. Describe layout and poses precisely.`;
    
    const mimeTypeMatch = imageDataUrl.match(/data:(image\/[^;]+);base64,/);
    const mimeType = mimeTypeMatch ? mimeTypeMatch[1] : 'image/jpeg';
    const base64Data = imageDataUrl.split(',')[1];
    
    const imagePart = {
        inlineData: {
            mimeType: mimeType,
            data: base64Data,
        },
    };

    try {
        const response = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: { parts: [{ text: "Analyze the following image composition based on your instructions." }, imagePart] },
          config: {
            systemInstruction,
            temperature: 0.1, // Low temperature for objective description
          },
        });
        return response.text.trim();
    } catch (error) {
        console.error("Error analyzing image composition:", error);
        throw new Error("Failed to analyze the sample image with AI.");
    }
};

export const breakdownSceneIntoShots = async (scene: StoryboardScene): Promise<StoryboardScene[]> => {
    const systemInstruction = `You are a cinematic director. Break down the scene into 3-4 shots.
    **PROMPT PURITY:** Do not include technical constraints (stable background, no distortion).
    Maintain consistency.`;

    const contents = `
    Original Lyric: ${scene.lyric}
    Image Prompt: ${scene.imagePrompt}
    Video Prompt: ${scene.videoPrompt}
    Characters: ${scene.charactersInScene?.join(', ')}
    `;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: contents,
            config: {
                systemInstruction,
                responseMimeType: "application/json",
                responseSchema: mainSchema, 
                temperature: 0.7
            }
        });
        
        const jsonText = response.text.trim();
        const result = JSON.parse(jsonText);
        
        if (result && Array.isArray(result.scenes)) {
             return result.scenes.map((s: any) => ({
                 ...mapSceneDefaults(s),
                 charactersInScene: scene.charactersInScene, 
                 backgroundUrl: scene.backgroundUrl,
                 lyric: `${scene.lyric} (Shot)`,
             }));
        }
        return [];
    } catch (error) {
        console.error("Error breaking down scene:", error);
        throw new Error("Failed to breakdown scene.");
    }
};

// --- NEW AGENT FUNCTIONS ---

export const agentAnalyzeScript = async (script: string): Promise<AgentAnalysisResult> => {
    const systemInstruction = `You are an expert Animation Pre-production Agent. 
    Analyze script, segment into scenes, extract assets.
    Return strictly formatted JSON.`;

    const schema = {
        type: Type.OBJECT,
        properties: {
            scenes: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        sceneNumber: { type: Type.NUMBER },
                        location: { type: Type.STRING },
                        mood: { type: Type.STRING },
                        sceneType: { type: Type.STRING, enum: ["Dialogue", "Action", "Montage", "Static"] },
                        pacing: { type: Type.STRING },
                        conflict: { type: Type.STRING },
                        actionSummary: { type: Type.STRING },
                        charactersInvolved: { type: Type.ARRAY, items: { type: Type.STRING } },
                        estimatedDuration: { type: Type.NUMBER }
                    },
                    required: ["sceneNumber", "location", "mood", "sceneType", "pacing", "conflict", "actionSummary", "charactersInvolved", "estimatedDuration"]
                }
            },
            detectedCharacters: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        name: { type: Type.STRING },
                        suggestedDescription: { type: Type.STRING }
                    },
                    required: ["name", "suggestedDescription"]
                }
            },
            detectedLocations: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        name: { type: Type.STRING },
                        suggestedDescription: { type: Type.STRING }
                    },
                    required: ["name", "suggestedDescription"]
                }
            }
        },
        required: ["scenes", "detectedCharacters", "detectedLocations"]
    };

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-pro",
            contents: `Script:\n${script}`,
            config: {
                systemInstruction,
                responseMimeType: "application/json",
                responseSchema: schema,
                temperature: 0.5
            }
        });

        const jsonText = response.text.trim();
        return JSON.parse(jsonText) as AgentAnalysisResult;
    } catch (e) {
        console.error("Agent script analysis failed", e);
        throw new Error("Failed to analyze script. Please try again.");
    }
};

export const agentGenerateStoryboard = async (
    analyzedScenes: AgentAnalysisResult,
    mappedCharacters: Character[],
    mappedLocations: Setting[]
): Promise<StoryboardScene[]> => {
    
    const charContext = mappedCharacters.map(c => `${c.name}: ${c.description}`).join('\n');
    const locContext = mappedLocations.map(l => `${l.name}: ${l.imageUrl ? 'Reference available' : 'No ref'}`).join('\n');
    const sceneContext = JSON.stringify(analyzedScenes.scenes);

    const systemInstruction = `You are an elite Director. Break down scenes into shots.
    **PROMPT PURITY:**
    *   Descriptions MUST be creative. 
    *   DO NOT write "stable background", "no distortion", "no extra people". The system adds these.
    
    **SHOT LOGIC:**
    1. 'DIALOGUE': Use Triangle System (Master -> OTS -> OTS -> CU).
    2. 'ACTION': Use Impact Editing (Setup -> Action -> Result).
    
    Output JSON.`;

    const schema = {
        type: Type.OBJECT,
        properties: {
            scenes: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        lyric: { type: Type.STRING },
                        imagePrompt: { type: Type.STRING },
                        videoPrompt: { type: Type.STRING },
                        charactersInScene: { type: Type.ARRAY, items: { type: Type.STRING } },
                        shotType: { type: Type.STRING },
                        cameraMovement: { type: Type.STRING },
                        screenDirection: { type: Type.STRING },
                        transition: { type: Type.STRING },
                        directorialReasoning: { type: Type.STRING },
                        estimatedDuration: { type: Type.NUMBER }
                    },
                    required: ["lyric", "imagePrompt", "videoPrompt", "charactersInScene", "shotType", "cameraMovement", "screenDirection", "transition", "directorialReasoning", "estimatedDuration"]
                }
            }
        },
        required: ["scenes"]
    };

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-pro",
            contents: `
                Characters:\n${charContext}
                Locations:\n${locContext}
                Scenes to Breakdown:\n${sceneContext}
            `,
            config: {
                systemInstruction,
                responseMimeType: "application/json",
                responseSchema: schema,
                temperature: 0.7
            }
        });

        const jsonText = response.text.trim();
        const result = JSON.parse(jsonText);
        return result.scenes.map(mapSceneDefaults);

    } catch (e) {
        console.error("Agent storyboard generation failed", e);
        throw new Error("Failed to generate storyboard.");
    }
};

export const agentCheckContinuity = async (scenes: StoryboardScene[]): Promise<ContinuityReport[]> => {
    const sceneSummary = scenes.map((s, i) => `
        Shot ${i+1} (ID: ${s.id}):
        Action: ${s.lyric}
        Visuals: ${s.imagePrompt}
        Characters: ${s.charactersInScene?.join(', ')}
        Shot Type: ${s.shotType}
        Camera: ${s.cameraMovement}
        Screen Direction: ${s.screenDirection}
    `).join('\n---\n');

    const systemInstruction = `Continuity Supervisor Agent. Check 180-degree rule, prop persistence, consistency.`;

    const schema = {
        type: Type.OBJECT,
        properties: {
            reports: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        shotId: { type: Type.STRING },
                        issues: { type: Type.ARRAY, items: { type: Type.STRING } },
                        score: { type: Type.NUMBER }
                    },
                    required: ["shotId", "issues", "score"]
                }
            }
        },
        required: ["reports"]
    };

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `Verify continuity:\n${sceneSummary}`,
            config: {
                systemInstruction,
                responseMimeType: "application/json",
                responseSchema: schema,
                temperature: 0.2
            }
        });

        const jsonText = response.text.trim();
        const result = JSON.parse(jsonText);
        
        return result.reports;

    } catch (e) {
        console.error("Continuity check failed", e);
        throw new Error("Failed to check continuity.");
    }
};
