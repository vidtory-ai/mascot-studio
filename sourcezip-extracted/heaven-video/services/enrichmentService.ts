import { GoogleGenAI, Type } from "@google/genai";
import { StoryboardScene, Character } from '../types';

if (!process.env.API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// --- TypeScript Interfaces for the new JSON structure ---

export interface Subject {
  id: string;
  role: string;
  desc: string;
}

export interface TimelineDialogue {
  char: string;
  lang: string;
  line: string;
  delivery: string;
}

export interface ActionItem {
    char_id: string;
    action: string;
}

export interface TimelineEvent {
  t: number;
  acting: ActionItem[];
  camera: string;
  dialogue: TimelineDialogue[];
}

export interface EnrichedSceneData {
  subjects: Subject[];
  actions: ActionItem[];
  background: {
    motion: string;
    note: string;
  };
  camera: {
    angle: string;
    framing: string;
    movement: string;
    speed: string;
  };
  dialogue_language: {
    register: string;
    style: string;
    pauses: string;
  };
  timeline: TimelineEvent[];
}


// --- Gemini API Schema Definition ---

const enrichedSceneSchema = {
    type: Type.OBJECT,
    properties: {
        subjects: {
            type: Type.ARRAY,
            description: "An array of characters in the scene.",
            items: {
                type: Type.OBJECT,
                properties: {
                    id: { type: Type.STRING, description: "A short, unique identifier for the character in this scene (e.g., 'A', 'B')." },
                    role: { type: Type.STRING, description: "The character's position or role in the frame (e.g., 'protagonist_left')." },
                    desc: { type: Type.STRING, description: "A concise physical description of the character for this scene." }
                },
                required: ["id", "role", "desc"]
            }
        },
        actions: {
            type: Type.ARRAY,
            description: "An array of objects summarizing the main action for each subject.",
            items: {
                type: Type.OBJECT,
                properties: {
                    char_id: { type: Type.STRING, description: "The 'id' of the character performing the action (e.g., 'A')." },
                    action: { type: Type.STRING, description: "A string describing the character's overall action." }
                },
                required: ["char_id", "action"]
            }
        },
        background: {
            type: Type.OBJECT,
            properties: {
                motion: { type: Type.STRING, description: "Type of background motion (e.g., 'subtle_parallax')." },
                note: { type: Type.STRING, description: "Notes on background elements and their behavior." }
            },
            required: ["motion", "note"]
        },
        camera: {
            type: Type.OBJECT,
            properties: {
                angle: { type: Type.STRING, description: "Camera angle (e.g., 'eye_level')." },
                framing: { type: Type.STRING, description: "Shot framing, can show transitions (e.g., 'MS→CU')." },
                movement: { type: Type.STRING, description: "Camera movement type (e.g., 'dolly_in')." },
                speed: { type: Type.STRING, description: "Speed of camera movement (e.g., 'slow')." }
            },
            required: ["angle", "framing", "movement", "speed"]
        },
        dialogue_language: {
            type: Type.OBJECT,
            properties: {
                register: { type: Type.STRING, description: "The style of speech (e.g., 'tự nhiên, thân mật bạn bè')." },
                style: { type: Type.STRING, description: "Sentence structure and slang usage." },
                pauses: { type: Type.STRING, description: "Notes on conversational pauses." }
            },
            required: ["register", "style", "pauses"]
        },
        timeline: {
            type: Type.ARRAY,
            description: "A sequence of timed events that build the scene.",
            items: {
                type: Type.OBJECT,
                properties: {
                    t: { type: Type.NUMBER, description: "Timestamp in seconds, starting from 0.0." },
                    acting: {
                        type: Type.ARRAY,
                        description: "An array of objects describing character actions at this timestamp.",
                        items: {
                             type: Type.OBJECT,
                             properties: {
                                char_id: { type: Type.STRING, description: "The 'id' of the character performing the action (e.g., 'A')." },
                                action: { type: Type.STRING, description: "The character's specific action at this moment." }
                             },
                             required: ["char_id", "action"]
                        }
                    },
                    camera: { type: Type.STRING, description: "Description of the camera state/action at this timestamp." },
                    dialogue: {
                        type: Type.ARRAY,
                        description: "An array of dialogues spoken at this time.",
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                char: { type: Type.STRING, description: "The 'id' of the character speaking." },
                                lang: { type: Type.STRING, description: "The language of the dialogue (e.g., 'vietnamese')." },
                                line: { type: Type.STRING, description: "The dialogue content." },
                                delivery: { type: Type.STRING, description: "Notes on how the line is delivered." }
                            },
                            required: ["char", "lang", "line", "delivery"]
                        }
                    }
                },
                required: ["t", "acting", "camera", "dialogue"]
            }
        }
    },
    required: ["subjects", "actions", "background", "camera", "dialogue_language", "timeline"]
};


const enrichVideoPromptSystemInstruction = `You are a meticulous Animation Director and Scenarist AI. Your task is to transform a scene description into a detailed, structured JSON object for a character animation pipeline. This JSON will define all characters, actions, camera movements, and a precise, timed sequence of events, including dialogue.

**CONTEXT PROVIDED:**
- **Image Prompt:** Describes the static setup of the scene (characters' appearance, setting, mood).
- **Video Prompt:** A simple, high-level idea of the action that needs to happen.
- **Character List:** The names and descriptions of characters present in the scene.
- **Overall Style & Theme:** The guiding artistic and narrative direction.

**YOUR TASK:**
Generate a single, valid JSON object that strictly adheres to the provided schema. You must logically expand upon the provided context to create a rich, dynamic scene.

**JSON STRUCTURE & LOGIC:**
1.  **subjects**:
    *   Identify each character from the provided list who is active in this scene.
    *   Assign a unique, single-letter \`id\` (A, B, C, etc.).
    *   Define their \`role\` or position in the frame (e.g., 'protagonist_left', 'antagonist_background').
    *   Write a concise \`desc\` based on their provided character description, tailored for this specific scene's context.

2.  **actions**:
    *   An array of objects. Each object represents a main action for one character.
    *   Each object must have two properties: \`char_id\` (the character's ID, e.g., 'A') and \`action\` (a string describing their overall action).
    *   Example: \`[ { "char_id": "A", "action": "leans towards B" }, { "char_id": "B", "action": "smiles brightly" } ]\`

3.  **background**:
    *   Describe any subtle background motion or atmospheric effects.

4.  **camera**:
    *   Define the complete camera choreography for the scene.
    *   Use '→' in \`framing\` to indicate a transition (e.g., 'MS→CU' for a move from Medium Shot to Close-Up).

5.  **dialogue_language**:
    *   Set the overall tone and style for any dialogue in the scene.

6.  **timeline**: This is the most critical part.
    *   Break the scene down into a logical sequence of timed events, starting at \`t: 0.0\`.
    *   Each event in the array represents a "beat" or a moment in the scene.
    *   For each event:
        *   **acting**: An array of objects describing the specific actions at this timestamp. Each object must have \`char_id\` and \`action\` properties, similar to the main \`actions\` field but for this specific moment. If a character has no action at this timestamp, do not include them in the array. If no characters act, provide an empty array \`[]\`.
        *   **camera**: Note the camera's state or movement during that beat.
        *   **dialogue**: Critically evaluate if the scene requires dialogue.
            *   **If the scene's context strongly implies a conversation** (e.g., characters are facing each other, the prompt mentions a discussion), generate natural, short, and impactful dialogue that fits their personalities and the mood. Provide clear \`delivery\` instructions.
            *   **If the scene is observational, emotional, or action-focused without speech** (e.g., a character looking out a window, an establishing shot, a chase scene), **DO NOT invent dialogue.** Instead, focus on creating a richer description in the \`acting\` and \`camera\` fields to convey the story visually.
            *   For any timestamp without dialogue, provide an empty array \`[]\`. This is the default for scenes without speech.

**CRITICAL RULES:**
- The final output MUST be a single, valid JSON object and nothing else.
- Adhere strictly to the provided JSON schema structure and data types.
- Ensure the character \`id\`s are used consistently across \`subjects\`, \`actions\`, \`timeline.acting\`, and \`timeline.dialogue\`.
- The timeline must tell a coherent, mini-story for the duration of the scene (typically 6-10 seconds).`;


interface EnrichmentInput {
    scene: Pick<StoryboardScene, 'imagePrompt' | 'videoPrompt'>;
    characters: Character[];
    style: string;
    theme: string;
    language: string;
}

export const enrichScene = async ({
    scene,
    characters,
    style,
    theme,
    language
}: EnrichmentInput): Promise<EnrichedSceneData> => {
    try {
        const characterDescriptions = characters.map(c => `- ${c.name}: ${c.description}`).join('\n');

        const textPrompt = `Please generate the detailed animation JSON for the following scene.
---
**CONTEXT:**

**Image Prompt (Static Scene Setup):**
"${scene.imagePrompt}"

**Simple Video Prompt (Core Action Idea):**
"${scene.videoPrompt}"

**Characters in Scene:**
${characterDescriptions}

**Overall Style:** ${style}
**Overall Theme:** ${theme}
---
`;

        const finalSystemInstruction = enrichVideoPromptSystemInstruction + `\n\n**Output Language:** You MUST generate all descriptive text (like 'desc', 'note', 'line', 'delivery', etc.) strictly in **${language}**.`;

        const response = await ai.models.generateContent({
            model: "gemini-2.5-pro", // Using Pro for this complex structured data task
            contents: textPrompt,
            config: {
                systemInstruction: finalSystemInstruction,
                responseMimeType: "application/json",
                responseSchema: enrichedSceneSchema,
                temperature: 0.7,
            },
        });

        const jsonText = response.text.trim();
        const result = JSON.parse(jsonText);
        
        return result as EnrichedSceneData;

    } catch (error) {
        console.error("Error enriching scene with JSON:", error);
        throw new Error("Failed to generate structured scene data. The AI may have returned an invalid response. Please check the console and try again.");
    }
};
