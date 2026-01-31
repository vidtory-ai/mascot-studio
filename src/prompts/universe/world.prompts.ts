/**
 * Universe Prompts - World & Location Generation
 * 
 * All prompts related to world building and location/scene generation
 */

import { PromptRegistry, PromptCategory, createPromptConfig } from '../registry';

// =====================================
// LOCATION GENERATION PROMPT
// =====================================

const LOCATION_GENERATE = createPromptConfig({
    id: 'universe.location.generate',
    category: PromptCategory.UNIVERSE,
    name: 'Location Scene Generation',
    description: 'Generates a new location/scene image',
    temperature: 0.7,
    systemInstruction: `Art Style: {{artStyle}}.
World context: "{{worldContext}}".

Generate a scene of the following specific location: "{{locationPrompt}}".

## REQUIREMENTS
- This location exists within the described world
- It should feel like a place characters could inhabit
- IMPORTANT: Do not include any characters or people
- Focus only on the environment and architecture
- Match the overall art style and mood of the world`
});

// =====================================
// LOCATION VARIATION PROMPT
// =====================================

const LOCATION_VARIATION = createPromptConfig({
    id: 'universe.location.variation',
    category: PromptCategory.UNIVERSE,
    name: 'Location Angle Variation',
    description: 'Generates a new angle/view of an existing location',
    temperature: 0.6,
    systemInstruction: `Art Style: {{artStyle}}.

The reference image shows a location. Generate a new view or angle of this location.
- Location description: "{{locationDescription}}"
- Specific view: "{{viewPrompt}}"

## REQUIREMENTS
- Maintain the key architectural elements and objects from the reference
- Keep the overall atmosphere consistent
- This must be recognizably the same place
- Do not include any characters or people
- Focus only on the environment and architecture`
});

// =====================================
// LOCATION CAMERA ANGLE PROMPT
// =====================================

const LOCATION_CAMERA_ANGLE = createPromptConfig({
    id: 'universe.location.camera',
    category: PromptCategory.UNIVERSE,
    name: 'Location Camera Angle',
    description: 'Generates a specific camera angle of a location',
    temperature: 0.5,
    systemInstruction: `Based on the reference location image, generate a new shot with this specific camera setup:

{{cameraAnglePrompt}}

## REQUIREMENTS
- Maintain all key elements from the reference location
- Apply the specified camera angle and lens characteristics
- Keep the same art style and lighting mood
- Do not include any characters or people`
});

// =====================================
// WORLD STYLE GUIDE PROMPT
// =====================================

const WORLD_STYLE_ANALYZE = createPromptConfig({
    id: 'universe.world.analyze',
    category: PromptCategory.UNIVERSE,
    name: 'World Style Analysis',
    description: 'Analyzes reference images to extract world visual style',
    temperature: 0.3,
    systemInstruction: `You are an expert art director analyzing visual style for world-building.

## TASK
Analyze the provided reference image(s) and extract the core visual style characteristics.

## OUTPUT REQUIREMENTS
Extract and describe:
1. **Art Style**: The overall artistic approach (anime, realistic, stylized, etc.)
2. **Color Palette**: Primary, secondary, and accent colors
3. **Lighting Style**: Typical lighting conditions and mood
4. **Texture Quality**: How textures are rendered (smooth, detailed, painterly)
5. **Atmosphere Keywords**: 3-5 mood/atmosphere descriptors
6. **Style Prompt Fragment**: A reusable prompt fragment for consistent generation

## RULES
- Be specific and technical
- Focus on reproducible visual elements
- Output should help maintain consistency across multiple generations`,
    outputSchema: {
        type: 'object',
        properties: {
            artStyle: { type: 'string' },
            colorPalette: {
                type: 'object',
                properties: {
                    primary: { type: 'array', items: { type: 'string' } },
                    secondary: { type: 'array', items: { type: 'string' } },
                    accent: { type: 'array', items: { type: 'string' } }
                }
            },
            lightingStyle: { type: 'string' },
            textureQuality: { type: 'string' },
            atmosphereKeywords: { type: 'array', items: { type: 'string' } },
            stylePromptFragment: { type: 'string' }
        },
        required: ['artStyle', 'stylePromptFragment']
    }
});

// =====================================
// ASSET DESCRIPTION PROMPT
// =====================================

const ASSET_DESCRIBE = createPromptConfig({
    id: 'universe.asset.describe',
    category: PromptCategory.UNIVERSE,
    name: 'Asset Description',
    description: 'Describes any asset image for use in prompts',
    temperature: 0.3,
    systemInstruction: `Describe this image for use as a prompt for an AI image generator.

## FOCUS ON:
- Main subject and its key features
- Artistic style and rendering approach
- Colors and composition
- Important details and distinguishing elements

## OUTPUT
A detailed, descriptive paragraph suitable for image generation prompts.
Language: {{language}}`
});

// =====================================
// REGISTER ALL PROMPTS
// =====================================

export function registerWorldPrompts(): void {
    PromptRegistry.registerAll([
        LOCATION_GENERATE,
        LOCATION_VARIATION,
        LOCATION_CAMERA_ANGLE,
        WORLD_STYLE_ANALYZE,
        ASSET_DESCRIBE
    ]);
}

export {
    LOCATION_GENERATE,
    LOCATION_VARIATION,
    LOCATION_CAMERA_ANGLE,
    WORLD_STYLE_ANALYZE,
    ASSET_DESCRIBE
};
