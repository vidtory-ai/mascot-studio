
import { GoogleGenAI, Type } from "@google/genai";
import { ParsedShot, ScriptAssetRequirements } from "../types";

if (!process.env.API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

interface AnalysisResult {
  shots: ParsedShot[];
  requirements: ScriptAssetRequirements;
}

/**
 * Analyzes the raw structured script, breaks it down into shots (<8s),
 * and identifies required assets (characters and settings).
 */
export const analyzeAndBreakdownScript = async (rawInput: string): Promise<AnalysisResult> => {
  const systemInstruction = `You are an expert Animation Director. Your task is to process a raw script into a structured storyboard breakdown and identify all necessary assets.

**INPUT:**
A CSV-like or structured text describing scenes with Time Range, Visuals, and Audio.

**TASK 1: BREAKDOWN (Shots)**
*   Break the script into individual shots.
*   **CRITICAL:** Each shot MUST be **8 seconds or less**. Split longer scenes using Shot-Reverse-Shot, Reaction Shots, or Detail Shots.
*   **ESTABLISHING SHOTS:** When the script moves to a new location (setting), you MUST proactively insert an **Establishing Shot** (Wide Shot / Extreme Wide Shot) of that location lasting 2-4 seconds BEFORE the characters start acting. This ensures the audience understands where the scene is taking place.
*   For each shot, provide:
    *   \`duration\`: Estimated duration in seconds.
    *   \`shotType\`: e.g., "Wide Shot", "Close Up", "Medium Shot", "Establishing Shot".
    *   \`visualDescription\`: Detailed visual description for an image prompt.
    *   \`audioDescription\`: Dialogue or SFX.
    *   \`charactersPresent\`: List of character names in this shot (empty if it is purely an environmental establishing shot).
    *   \`setting\`: The location/background name.

**TASK 2: ASSET EXTRACTION**
*   Identify all unique **Characters** mentioned.
*   Identify all unique **Settings** (locations) mentioned.
*   **CRITICAL:** The names of the Settings (Locations) MUST be in **Vietnamese** (e.g., "Phòng ngủ", "Công viên", "Sân thượng", "Vũ trụ"). Character names should be kept as is.

**OUTPUT:**
Return a strictly formatted JSON object.`;

  const schema = {
    type: Type.OBJECT,
    properties: {
      shots: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            id: { type: Type.STRING, description: "Unique ID like 'shot-1'" },
            duration: { type: Type.NUMBER, description: "Duration in seconds (max 8)" },
            shotType: { type: Type.STRING, description: "Camera framing" },
            visualDescription: { type: Type.STRING, description: "Visual prompt content" },
            audioDescription: { type: Type.STRING, description: "Audio/Dialogue content" },
            charactersPresent: { 
              type: Type.ARRAY, 
              items: { type: Type.STRING } 
            },
            setting: { type: Type.STRING, description: "Location name in Vietnamese" }
          },
          required: ["id", "duration", "shotType", "visualDescription", "audioDescription", "charactersPresent", "setting"]
        }
      },
      requirements: {
        type: Type.OBJECT,
        properties: {
          characters: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "List of unique character names found in the script"
          },
          settings: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "List of unique settings/locations found (in Vietnamese)"
          }
        },
        required: ["characters", "settings"]
      }
    },
    required: ["shots", "requirements"]
  };

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Raw Script:\n\n${rawInput}`,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: schema,
        temperature: 0.5,
      },
    });

    const jsonText = response.text.trim();
    return JSON.parse(jsonText) as AnalysisResult;
  } catch (e) {
    console.error("Script analysis failed", e);
    throw new Error("Failed to analyze script. Please ensure the input format is correct.");
  }
};
