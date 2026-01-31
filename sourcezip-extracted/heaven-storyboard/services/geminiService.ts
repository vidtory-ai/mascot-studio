
import { GoogleGenAI, Type } from "@google/genai";
import { StoryboardInputs, GridSize } from "../types";

// Initialize Gemini Client
const getAiClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key is missing. Check your environment variables.");
  }
  return new GoogleGenAI({ apiKey });
};

export interface RawShotData {
  panelNumber: number;
  shotType: string;
  description: string;
}

export interface RawSceneData {
  sceneNumber: number;
  summary: string;
  shots: RawShotData[];
  suggestedCharacterNames: string[]; 
}

/**
 * Analyzes the raw script and breaks it down into Scenes with structured Shots.
 */
export const analyzeScriptToStoryboard = async (
  scriptText: string, 
  inputs: StoryboardInputs
): Promise<RawSceneData[]> => {
  const ai = getAiClient();
  
  const characterList = inputs.characters.map(c => c.name).join(', ');
  const shotsPerScene = inputs.gridSize === GridSize.GRID_3x3 ? 9 : 4;

  const systemInstruction = `
    You are a professional Film Director and Director of Photography.
    
    TASK:
    Break down the provided VIDEO SCRIPT into individual SCENES.
    For EACH Scene, create a detailed SHOT LIST containing exactly ${shotsPerScene} keyframes (shots).
    
    INPUT CONTEXT:
    - Available Characters: ${characterList}
    - Genre: ${inputs.genre}
    - Style: ${inputs.style}
    
    OUTPUT REQUIREMENTS:
    - Return a JSON array of Scenes.
    - Each Scene must have an array of "shots".
    - Assign a "shotType" (e.g., Wide Shot, Close Up, Dutch Angle, Over the Shoulder) that best fits the dramatic need of that specific keyframe.
    - "description": The visual action of that specific shot.
    - "suggestedCharacterNames": List characters appearing in this scene.
  `;

  const prompt = `
    SCRIPT:
    ${scriptText}
    
    Break this into approximately ${inputs.sceneCount} scenes.
    Grid Layout: ${inputs.gridSize} (Create exactly ${shotsPerScene} shots per scene).
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              sceneNumber: { type: Type.INTEGER },
              summary: { type: Type.STRING },
              shots: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    panelNumber: { type: Type.INTEGER },
                    shotType: { type: Type.STRING },
                    description: { type: Type.STRING }
                  },
                  required: ["panelNumber", "shotType", "description"]
                }
              },
              suggestedCharacterNames: { 
                type: Type.ARRAY,
                items: { type: Type.STRING }
              }
            },
            required: ["sceneNumber", "summary", "shots"]
          }
        }
      }
    });

    if (response.text) {
      return JSON.parse(response.text) as RawSceneData[];
    }
    throw new Error("Failed to analyze script.");
  } catch (error) {
    console.error("Storyboard Analysis Error:", error);
    throw error;
  }
};

/**
 * Analyzes an uploaded character image to get a description.
 */
export const analyzeCharacterReference = async (base64Image: string, language: string): Promise<string> => {
  const ai = getAiClient();
  const prompt = `Describe this character's appearance in detail for a prompt (Hair, clothes, face, accessories). Language: ${language}`;
  
  try {
     const cleanBase64 = base64Image.includes('base64,') ? base64Image.split('base64,')[1] : base64Image;
     const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: {
           parts: [
              { inlineData: { mimeType: 'image/png', data: cleanBase64 } },
              { text: prompt }
           ]
        }
     });
     return response.text || "";
  } catch (e) {
     return "";
  }
}
