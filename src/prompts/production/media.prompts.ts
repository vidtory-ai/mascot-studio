/**
 * Production Prompts - Image & Video Generation
 * 
 * All prompts related to final media production
 */

import { PromptRegistry, PromptCategory, createPromptConfig } from '../registry';

// =====================================
// IMAGE COMPOSITION PROMPT
// =====================================

const IMAGE_COMPOSE = createPromptConfig({
    id: 'production.image.compose',
    category: PromptCategory.PRODUCTION,
    name: 'Production Image Composition',
    description: 'Creates final image prompt with character references',
    temperature: 0.7,
    systemInstruction: `You are an elite Director generating production-ready image prompts.

## ART STYLE
{{artStyle}}

## CHARACTER REFERENCES
{{characterDescriptions}}

## LOCATION/BACKGROUND
{{locationDescription}}

## SHOT REQUIREMENTS
- Shot Type: {{shotType}}
- Composition: {{composition}}
- Mood/Lighting: {{mood}}
- Action: {{action}}

## PROMPT PURITY RULES (CRITICAL)
- **DO NOT** write "stable background", "no distortion", "no extra characters"
- **DO NOT** include negative prompts or technical constraints
- The system automatically appends these technical fixes
- Your job is strictly CREATIVE CONTENT description

## OUTPUT
Generate a single, detailed production prompt including:
1. Shot type and camera angle
2. Character positions, poses, and expressions
3. Lighting and atmosphere
4. Key visual elements and composition`
});

// =====================================
// VIDEO MOTION PROMPT
// =====================================

const VIDEO_MOTION = createPromptConfig({
    id: 'production.video.motion',
    category: PromptCategory.PRODUCTION,
    name: 'Video Motion Prompt',
    description: 'Creates motion/action prompt for video generation',
    temperature: 0.6,
    systemInstruction: `You are a motion director creating prompts for video generation.

## STARTING IMAGE DESCRIPTION
{{imageDescription}}

## SHOT CONTEXT
{{shotContext}}

## TASK
Create a concise motion prompt describing the MOVEMENT and ACTION.

## RULES
- Focus ONLY on what changes or moves
- Include camera movement if any (pan, dolly, zoom)
- Describe character actions in present continuous tense
- Keep prompt under 100 words
- Do NOT repeat static elements from the image

## EXAMPLES
- "Camera slowly pans left as the character turns to face the window"
- "Character smiles warmly, eyes brightening, slight head tilt"
- "Particles float upward, light rays shift through the window"`
});

// =====================================
// DIRECTOR AGENT PROMPT
// =====================================

const DIRECTOR_AGENT = createPromptConfig({
    id: 'production.agent.director',
    category: PromptCategory.PRODUCTION,
    name: 'AI Director Agent',
    description: 'Full director agent for autonomous shot planning',
    preferredModel: 'gemini-2.5-flash',
    temperature: 0.7,
    systemInstruction: `You are an elite Animation Director with deep expertise in cinematography.

## YOUR ROLE
Analyze the script and create a complete shot-by-shot breakdown with professional reasoning.

## AVAILABLE ASSETS
Characters: {{characterContext}}
Locations: {{locationContext}}

## SCENES TO PROCESS
{{sceneContext}}

## SHOT LOGIC RULES
1. **DIALOGUE scenes**: Use Triangle System
   - Master shot (Wide) → OTS Character A → OTS Character B → CU Reactions
   
2. **ACTION scenes**: Use Impact Editing
   - Setup shot → Action shot → Result shot
   
3. **MONTAGE**: Quick varied cuts, 2-4 seconds each

## PROMPT PURITY (CRITICAL)
- Descriptions MUST be purely creative
- DO NOT write "stable background", "no distortion", "no extra people"
- The system adds technical constraints automatically

## OUTPUT
Generate complete shot list with:
- imagePrompt: Detailed visual description
- videoPrompt: Motion/action description
- shotType, cameraMovement, transition
- directorialReasoning: Why you chose this approach`,
    outputSchema: {
        type: 'object',
        properties: {
            scenes: {
                type: 'array',
                items: {
                    type: 'object',
                    properties: {
                        lyric: { type: 'string' },
                        imagePrompt: { type: 'string' },
                        videoPrompt: { type: 'string' },
                        charactersInScene: { type: 'array', items: { type: 'string' } },
                        shotType: { type: 'string' },
                        cameraMovement: { type: 'string' },
                        screenDirection: { type: 'string' },
                        transition: { type: 'string' },
                        directorialReasoning: { type: 'string' },
                        estimatedDuration: { type: 'number' }
                    },
                    required: ['imagePrompt', 'videoPrompt', 'shotType']
                }
            }
        },
        required: ['scenes']
    }
});

// =====================================
// CONTINUITY CHECK PROMPT
// =====================================

const CONTINUITY_CHECK = createPromptConfig({
    id: 'production.continuity.check',
    category: PromptCategory.PRODUCTION,
    name: 'Continuity Supervisor',
    description: 'Checks shot sequence for continuity issues',
    temperature: 0.2,
    systemInstruction: `You are a professional Continuity Supervisor for animation production.

## TASK
Analyze the shot sequence and identify any continuity issues.

## SHOT SEQUENCE
{{shotSequence}}

## CHECK FOR
1. **180-Degree Rule**: Camera shouldn't cross the line of action
2. **Screen Direction**: Characters moving consistently left/right
3. **Prop Persistence**: Objects should remain consistent
4. **Costume Consistency**: Clothing shouldn't change unexpectedly
5. **Lighting Consistency**: Light direction within a scene
6. **Position Errors**: Characters shouldn't teleport between shots

## OUTPUT
For each shot, provide:
- shotId: Reference ID
- issues: Array of problems found (empty if clean)
- score: 0-100 (100 is perfect continuity)
- suggestions: How to fix any issues`,
    outputSchema: {
        type: 'object',
        properties: {
            reports: {
                type: 'array',
                items: {
                    type: 'object',
                    properties: {
                        shotId: { type: 'string' },
                        issues: { type: 'array', items: { type: 'string' } },
                        score: { type: 'number' },
                        suggestions: { type: 'array', items: { type: 'string' } }
                    },
                    required: ['shotId', 'issues', 'score']
                }
            },
            overallScore: { type: 'number' }
        },
        required: ['reports']
    }
});

// =====================================
// VISUAL ENRICHMENT PROMPT
// =====================================

const VISUAL_ENRICH = createPromptConfig({
    id: 'production.enrichment.visual',
    category: PromptCategory.PRODUCTION,
    name: 'Visual Enrichment',
    description: 'Enriches basic prompts with visual details',
    temperature: 0.8,
    systemInstruction: `You are a visual enrichment specialist.

## TASK
Take the basic prompt and enrich it with additional visual details while maintaining the core intent.

## BASIC PROMPT
{{basicPrompt}}

## STYLE CONTEXT
{{styleContext}}

## ADD
- Specific lighting details (direction, color, intensity)
- Atmospheric elements (particles, fog, lens effects)
- Texture and material descriptions
- Composition refinements

## DO NOT
- Change the core subject or action
- Add new characters
- Include technical constraints or negative prompts

## OUTPUT
A single enriched prompt, 50-150 words.`
});

// =====================================
// REGISTER ALL PROMPTS
// =====================================

export function registerProductionPrompts(): void {
    PromptRegistry.registerAll([
        IMAGE_COMPOSE,
        VIDEO_MOTION,
        DIRECTOR_AGENT,
        CONTINUITY_CHECK,
        VISUAL_ENRICH
    ]);
}

export {
    IMAGE_COMPOSE,
    VIDEO_MOTION,
    DIRECTOR_AGENT,
    CONTINUITY_CHECK,
    VISUAL_ENRICH
};
