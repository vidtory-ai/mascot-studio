/**
 * Storyboard Prompts - Script Analysis & Scene Breakdown
 * 
 * All prompts related to analyzing scripts and creating storyboards
 */

import { PromptRegistry, PromptCategory, createPromptConfig } from '../registry';

// =====================================
// SCRIPT ANALYSIS PROMPT
// =====================================

const SCRIPT_ANALYZE = createPromptConfig({
    id: 'storyboard.script.analyze',
    category: PromptCategory.STORYBOARD,
    name: 'Script Analysis',
    description: 'Analyzes raw script and breaks it into structured scenes',
    preferredModel: 'gemini-2.5-flash',
    temperature: 0.5,
    systemInstruction: `You are an expert Animation Pre-production Agent.

## TASK
Analyze the provided script and break it down into structured scenes with shots.

## INPUT CONTEXT
- Available Characters: {{characterList}}
- Visual Style: {{visualStyle}}
- Genre: {{genre}}
- Target Language: {{language}}

## PROCESSING RULES
1. Each SCENE represents a distinct location or time period
2. Each SHOT within a scene must be ≤8 seconds
3. For NEW LOCATIONS, ALWAYS add an ESTABLISHING SHOT first (2-4 seconds)
4. Use varied shot types: Wide, Medium, Close-up, POV, OTS

## SHOT BREAKDOWN LOGIC
- **Dialogue Scenes**: Triangle System (Master → OTS → OTS → CU reaction)
- **Action Scenes**: Impact Editing (Setup → Action → Result)
- **Montage**: Quick cuts, varied angles

## OUTPUT
Return strictly formatted JSON following the provided schema.`,
    outputSchema: {
        type: 'object',
        properties: {
            scenes: {
                type: 'array',
                items: {
                    type: 'object',
                    properties: {
                        sceneNumber: { type: 'number' },
                        location: { type: 'string' },
                        mood: { type: 'string' },
                        sceneType: { type: 'string', enum: ['Dialogue', 'Action', 'Montage', 'Static'] },
                        pacing: { type: 'string' },
                        conflict: { type: 'string' },
                        actionSummary: { type: 'string' },
                        charactersInvolved: { type: 'array', items: { type: 'string' } },
                        estimatedDuration: { type: 'number' },
                        shots: {
                            type: 'array',
                            items: {
                                type: 'object',
                                properties: {
                                    shotNumber: { type: 'number' },
                                    duration: { type: 'number' },
                                    shotType: { type: 'string' },
                                    visualDescription: { type: 'string' },
                                    audioDescription: { type: 'string' },
                                    charactersPresent: { type: 'array', items: { type: 'string' } }
                                }
                            }
                        }
                    }
                }
            },
            detectedCharacters: {
                type: 'array',
                items: {
                    type: 'object',
                    properties: {
                        name: { type: 'string' },
                        suggestedDescription: { type: 'string' }
                    }
                }
            },
            detectedLocations: {
                type: 'array',
                items: {
                    type: 'object',
                    properties: {
                        name: { type: 'string' },
                        suggestedDescription: { type: 'string' }
                    }
                }
            }
        },
        required: ['scenes', 'detectedCharacters', 'detectedLocations']
    }
});

// =====================================
// SCENE BREAKDOWN PROMPT
// =====================================

const SCENE_BREAKDOWN = createPromptConfig({
    id: 'storyboard.scene.breakdown',
    category: PromptCategory.STORYBOARD,
    name: 'Scene to Shots Breakdown',
    description: 'Breaks down a single scene into detailed shots',
    temperature: 0.7,
    systemInstruction: `You are a professional Film Director and Director of Photography.

## TASK
Break down the provided SCENE into individual SHOTS (keyframes).

## INPUT
- Scene Summary: {{sceneSummary}}
- Scene Type: {{sceneType}}
- Characters: {{characters}}
- Target Shots: {{targetShotCount}}

## RULES
- Each shot must be ≤8 seconds
- Vary shot types for visual interest
- Assign appropriate camera framing for dramatic need
- Include shot type, visual description, and audio/dialogue

## SHOT TYPES TO USE
Wide Shot, Medium Shot, Close Up, Extreme Close Up, Over the Shoulder, POV, Insert, Two Shot, Dutch Angle

## OUTPUT
Return a JSON array of shots.`,
    outputSchema: {
        type: 'array',
        items: {
            type: 'object',
            properties: {
                shotNumber: { type: 'number' },
                duration: { type: 'number' },
                shotType: { type: 'string' },
                cameraAngle: { type: 'string' },
                visualDescription: { type: 'string' },
                audioDescription: { type: 'string' },
                charactersPresent: { type: 'array', items: { type: 'string' } },
                transition: { type: 'string' }
            },
            required: ['shotNumber', 'shotType', 'visualDescription']
        }
    }
});

// =====================================
// CHARACTER IDENTIFICATION PROMPT
// =====================================

const CHARACTER_IDENTIFY = createPromptConfig({
    id: 'storyboard.character.identify',
    category: PromptCategory.STORYBOARD,
    name: 'Character Identification',
    description: 'Identifies characters from script/lyrics text',
    temperature: 0.2,
    systemInstruction: `You are a script analyst AI.

## TASK
Read through the provided text and identify all distinct characters mentioned or implied.

## OUTPUT FOR EACH CHARACTER
1. **Name**: Unique name (be creative if not specified)
2. **Description**: PHYSICAL appearance ONLY
   - Facial features, hair style/color, body type
   - Potential clothing style as implied
   - DO NOT include personality, emotions, or motivations
3. **isMainCharacter**: Boolean for central vs minor characters

## CRITICAL RULES
- Focus ONLY on visual/physical details
- Description must be usable as image generation prompt
- Output language: {{language}}`,
    outputSchema: {
        type: 'object',
        properties: {
            characters: {
                type: 'array',
                items: {
                    type: 'object',
                    properties: {
                        name: { type: 'string' },
                        description: { type: 'string' },
                        isMainCharacter: { type: 'boolean' }
                    },
                    required: ['name', 'description', 'isMainCharacter']
                }
            }
        },
        required: ['characters']
    }
});

// =====================================
// SHOT COMPOSITION PROMPT
// =====================================

const SHOT_COMPOSE = createPromptConfig({
    id: 'storyboard.shot.compose',
    category: PromptCategory.STORYBOARD,
    name: 'Shot Composition',
    description: 'Creates image prompt for a specific shot',
    temperature: 0.7,
    systemInstruction: `You are an expert Director generating visual prompts for shots.

## CHARACTER REFERENCES
{{characterDescriptions}}

## LOCATION REFERENCE
{{locationDescription}}

## SHOT DETAILS
- Shot Type: {{shotType}}
- Action: {{action}}
- Characters: {{characters}}
- Mood: {{mood}}

## PROMPT RULES
- **DO NOT** include technical constraints (e.g., "stable background", "no distortion")
- Focus ONLY on creative visual description
- Describe character poses, expressions, and positions
- Include lighting and atmosphere

## OUTPUT
A single, detailed image generation prompt.`
});

// =====================================
// REGISTER ALL PROMPTS
// =====================================

export function registerStoryboardPrompts(): void {
    PromptRegistry.registerAll([
        SCRIPT_ANALYZE,
        SCENE_BREAKDOWN,
        CHARACTER_IDENTIFY,
        SHOT_COMPOSE
    ]);
}

export {
    SCRIPT_ANALYZE,
    SCENE_BREAKDOWN,
    CHARACTER_IDENTIFY,
    SHOT_COMPOSE
};
