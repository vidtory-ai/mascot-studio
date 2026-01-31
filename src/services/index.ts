/**
 * IP World Builder - Services Index
 * 
 * Central export of all services for easy importing.
 */

// AI Services
export * from './ai/geminiService';

// Media Services - Legacy (renamed to avoid conflicts)
export {
    generateImage as generateImageLegacy,
    generateSceneImage,
    generateVideo,
    upscaleVideo,
    base64ToBlobUrl,
    extractBase64 as extractBase64Legacy,
    isDataUrl
} from './media/mediaService';

// Image Service - New Gemini 2.5 based (primary)
export {
    generateImage,
    generateImageWithFallback,
    generateCharacterVariation as generateCharacterVariationImage,
    generateTurnaroundSheet,
    generateSceneWithCharacter as generateSceneWithCharacterImage,
    setImageProvider,
    getActiveProvider,
    extractBase64,
    isConfigured as isImageServiceConfigured,
    setApiKey as setImageApiKey,
    type ImageGenerationOptions,
    type ImageGenerationResult,
    type ImageProviderConfig
} from './media/imageService';

// Storage Services
export * from './storage/storageService';
