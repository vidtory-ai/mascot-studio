/**
 * Universe Prompts - Character Analysis & Generation
 * 
 * All prompts related to analyzing and generating character assets
 */

import { PromptRegistry, PromptCategory, createPromptConfig } from '../registry';

// =====================================
// CHARACTER ANALYSIS PROMPT
// =====================================

const CHARACTER_ANALYZE = createPromptConfig({
    id: 'universe.character.analyze',
    category: PromptCategory.UNIVERSE,
    name: 'Character Image Analysis',
    description: 'Analyzes a character image to extract visual description for prompts',
    temperature: 0.3,
    systemInstruction: `You are an expert character designer and visual analyst.

## TASK
Analyze the provided character image and extract a comprehensive visual description.

## OUTPUT REQUIREMENTS
Describe the character's:
1. **Physical Features**: Face shape, skin tone, eye color, hair style/color
2. **Body Type**: Height impression, build, proportions
3. **Clothing & Accessories**: Detailed outfit description, distinctive items
4. **Art Style**: The visual style (anime, realistic, cartoon, etc.)
5. **Color Palette**: Dominant colors in the design
6. **Distinctive Traits**: Unique features that identify this character

## RULES
- Be objective and descriptive, not interpretive
- Focus on VISUAL information only
- Use precise color names (e.g., "cobalt blue" not just "blue")
- Output should be usable as an AI image generation prompt
- Output language: {{language}}`,
    outputSchema: {
        type: 'object',
        properties: {
            physicalFeatures: { type: 'string' },
            bodyType: { type: 'string' },
            clothing: { type: 'string' },
            artStyle: { type: 'string' },
            colorPalette: { type: 'array', items: { type: 'string' } },
            distinctiveTraits: { type: 'array', items: { type: 'string' } },
            fullDescription: { type: 'string' }
        },
        required: ['fullDescription']
    }
});

// =====================================
// CHARACTER VARIATION PROMPT
// =====================================

const CHARACTER_VARIATION = createPromptConfig({
    id: 'universe.character.variation',
    category: PromptCategory.UNIVERSE,
    name: 'Character Variation Generation',
    description: 'Generates a new variation of an existing character',
    temperature: 0.7,
    systemInstruction: `Using the reference image, generate a new image based on this instruction: "{{variationPrompt}}".

## RULES
- Maintain strict consistency with the reference image's subject details
- Keep the same art style and color palette unless explicitly told to change
- Ensure the character is recognizable as the same person
- CRITICAL: Generate EXACTLY ONE character. Do NOT include any other characters.`
});

// =====================================
// CHARACTER TURNAROUND PROMPT
// =====================================

const CHARACTER_TURNAROUND = createPromptConfig({
    id: 'universe.character.turnaround',
    category: PromptCategory.UNIVERSE,
    name: 'Character Turnaround Sheet',
    description: 'Generates a 3-view turnaround sheet from a character reference',
    temperature: 0.5,
    systemInstruction: `Generate a character turnaround sheet showing three views of the character from the reference image, arranged side-by-side in a single image.

## REQUIREMENTS  
- Background: solid, 100% white
- Maintain perfect consistency with reference image (appearance, clothing, colors, art style)
- CRITICAL: REMOVE any objects, items, or props the character is holding. Hands must be empty.

## THREE VIEWS (all in strict T-pose):
1. **Front View**: Character facing forward, T-pose with arms outstretched horizontally, palms down
2. **Side View**: Character in profile (left or right), same T-pose maintained
3. **Back View**: Character facing away, same T-pose maintained

## STRICT RULES
- T-pose MUST be maintained across all three views
- No hands in pockets, no bent arms, no holding objects
- Equal spacing between views
- Consistent scale across all views`
});

// =====================================
// CHARACTER NEW SHOT PROMPT
// =====================================

const CHARACTER_NEW_SHOT = createPromptConfig({
    id: 'universe.character.newshot',
    category: PromptCategory.UNIVERSE,
    name: 'Character New Shot',
    description: 'Creates a new shot of an existing character',
    temperature: 0.7,
    systemInstruction: `Art Style: {{artStyle}}.

Create a new shot of the subject from the reference image.
- Subject description: "{{subjectDescription}}"
- Specific shot: "{{shotPrompt}}"

## RULES
- Ensure the subject's appearance, clothing, and details are consistent with the reference
- The character should be depicted full-body unless specified otherwise
- CRITICAL: Generate EXACTLY ONE character. Do NOT include any other characters.`
});

// =====================================
// CHARACTER SECONDARY PROMPT
// =====================================

const CHARACTER_SECONDARY = createPromptConfig({
    id: 'universe.character.secondary',
    category: PromptCategory.UNIVERSE,
    name: 'Secondary Character Generation',
    description: 'Generates a new secondary character based on main character style',
    temperature: 0.8,
    systemInstruction: `Art Style: {{artStyle}}.
World context: "{{worldContext}}".

Using the provided reference image as a style and world guide, generate EXACTLY ONE NEW, unique secondary character based on the following idea: "{{characterIdea}}".

## REQUIREMENTS
- Ensure visual consistency with the main subject's art style and world
- Depict full-body in a natural pose
- Include expression and accessories that match their personality
- CRITICAL: Background must be solid, 100% white
- CRITICAL: Generate EXACTLY ONE character only`
});

// =====================================
// REGISTER ALL PROMPTS
// =====================================

export function registerCharacterPrompts(): void {
    PromptRegistry.registerAll([
        CHARACTER_ANALYZE,
        CHARACTER_VARIATION,
        CHARACTER_TURNAROUND,
        CHARACTER_NEW_SHOT,
        CHARACTER_SECONDARY
    ]);
}

// Export individual prompts for direct access if needed
export {
    CHARACTER_ANALYZE,
    CHARACTER_VARIATION,
    CHARACTER_TURNAROUND,
    CHARACTER_NEW_SHOT,
    CHARACTER_SECONDARY
};
