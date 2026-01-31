/**
 * IP World Builder - Prompts Index
 * 
 * Central entry point for all system prompt registration and access.
 * Import this file once at app startup to register all prompts.
 */

// Core Registry
export {
    PromptRegistry,
    PromptCategory,
    createPromptConfig,
    combinePrompts,
    type PromptConfig,
    type PromptParams
} from './registry';

// Universe Prompts
import { registerCharacterPrompts } from './universe/character.prompts';
import { registerWorldPrompts } from './universe/world.prompts';

// Storyboard Prompts  
import { registerStoryboardPrompts } from './storyboard/script.prompts';

// Production Prompts
import { registerProductionPrompts } from './production/media.prompts';

// Re-export individual prompt collections for direct access
export * from './universe/character.prompts';
export * from './universe/world.prompts';
export * from './storyboard/script.prompts';
export * from './production/media.prompts';

/**
 * Initialize all prompts in the registry.
 * Call this once at application startup.
 */
export function initializePromptRegistry(): void {
    // Universe prompts
    registerCharacterPrompts();
    registerWorldPrompts();

    // Storyboard prompts
    registerStoryboardPrompts();

    // Production prompts
    registerProductionPrompts();

    console.log('[PromptRegistry] All prompts initialized');
}

/**
 * Prompt ID Constants for type-safe access
 */
export const PROMPT_IDS = {
    // Universe
    CHARACTER_ANALYZE: 'universe.character.analyze',
    CHARACTER_VARIATION: 'universe.character.variation',
    CHARACTER_TURNAROUND: 'universe.character.turnaround',
    CHARACTER_NEWSHOT: 'universe.character.newshot',
    CHARACTER_SECONDARY: 'universe.character.secondary',
    LOCATION_GENERATE: 'universe.location.generate',
    LOCATION_VARIATION: 'universe.location.variation',
    LOCATION_CAMERA: 'universe.location.camera',
    WORLD_ANALYZE: 'universe.world.analyze',
    ASSET_DESCRIBE: 'universe.asset.describe',

    // Storyboard
    SCRIPT_ANALYZE: 'storyboard.script.analyze',
    SCENE_BREAKDOWN: 'storyboard.scene.breakdown',
    CHARACTER_IDENTIFY: 'storyboard.character.identify',
    SHOT_COMPOSE: 'storyboard.shot.compose',

    // Production
    IMAGE_COMPOSE: 'production.image.compose',
    VIDEO_MOTION: 'production.video.motion',
    DIRECTOR_AGENT: 'production.agent.director',
    CONTINUITY_CHECK: 'production.continuity.check',
    VISUAL_ENRICH: 'production.enrichment.visual',
} as const;

export type PromptId = typeof PROMPT_IDS[keyof typeof PROMPT_IDS];
