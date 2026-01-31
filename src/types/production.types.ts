/**
 * IP World Builder - Type Definitions
 * Production Types - Video generation, Continuity, Project management
 */

// =====================================
// PRODUCTION PROJECT TYPES
// =====================================

export interface ProductionProject {
    id: string;
    name: string;
    universeProjectId: string;
    storyboardId: string;
    status: ProductionStatus;
    settings: ProductionSettings;
    productionLog: ProductionLogEntry[];
    createdAt: string;
    updatedAt: string;
}

export type ProductionStatus =
    | 'pre_production'
    | 'in_production'
    | 'post_production'
    | 'completed'
    | 'archived';

export interface ProductionSettings {
    imageAspectRatio: ImageAspectRatio;
    videoAspectRatio: VideoAspectRatio;
    autoUpscale: boolean;
    batchSize: number;
    preferredImageModel: string;
    preferredVideoModel: string;
    qualityPreset: QualityPreset;
}

export type ImageAspectRatio = '16:9' | '1:1' | '9:16' | '4:3' | '3:4';
export type VideoAspectRatio = 'LANDSCAPE' | 'PORTRAIT' | 'SQUARE';
export type QualityPreset = 'draft' | 'standard' | 'high' | 'ultra';

// =====================================
// PRODUCTION LOG TYPES
// =====================================

export interface ProductionLogEntry {
    id: string;
    timestamp: string;
    action: ProductionAction;
    shotId: string;
    sceneId?: string;
    details: Record<string, any>;
    success: boolean;
    error?: string;
}

export type ProductionAction =
    | 'image_generated'
    | 'image_regenerated'
    | 'video_generated'
    | 'video_upscaled'
    | 'batch_started'
    | 'batch_completed'
    | 'continuity_check'
    | 'export_started'
    | 'export_completed'
    | 'error';

// =====================================
// CONTINUITY TYPES
// =====================================

export interface ContinuityReport {
    id: string;
    storyboardId: string;
    checkTimestamp: string;
    overallScore: number;        // 0-100
    shotReports: ShotContinuityReport[];
    globalIssues: ContinuityIssue[];
}

export interface ShotContinuityReport {
    shotId: string;
    shotNumber: number;
    sceneNumber: number;
    score: number;               // 0-100
    issues: ContinuityIssue[];
    suggestions: string[];
}

export interface ContinuityIssue {
    id: string;
    type: ContinuityIssueType;
    severity: IssueSeverity;
    description: string;
    affectedShots: string[];     // Shot IDs
    suggestion?: string;
}

export type ContinuityIssueType =
    | '180_rule_violation'
    | 'prop_mismatch'
    | 'costume_mismatch'
    | 'lighting_inconsistency'
    | 'position_error'
    | 'timeline_error'
    | 'character_missing'
    | 'screen_direction_jump';

export type IssueSeverity = 'info' | 'warning' | 'error' | 'critical';

// =====================================
// MEDIA GENERATION TYPES
// =====================================

export interface ImageGenerationRequest {
    prompt: string;
    aspectRatio: ImageAspectRatio;
    subjects?: SubjectReference[];
    scenes?: SceneReference[];
    styles?: StyleReference[];
    negativePrompt?: string;
    seed?: number;
    cleanup?: boolean;
}

export interface SubjectReference {
    url: string;           // base64 data URL or remote URL
    caption: string;
    weight?: number;       // 0-1, how strongly to apply
}

export interface SceneReference {
    url: string;
    caption: string;
}

export interface StyleReference {
    url: string;
    caption: string;
}

export interface ImageGenerationResult {
    success: boolean;
    urls: string[];
    seeds?: number[];
    error?: string;
    model?: string;
    generationTime?: number;
}

export interface VideoGenerationRequest {
    prompt: string;
    startImage: string;    // base64 data URL
    aspectRatio: VideoAspectRatio;
    duration?: number;     // seconds
    motionStrength?: number;
    seed?: number;
}

export interface VideoGenerationResult {
    success: boolean;
    videoUrl: string;
    mediaGenerationId: string;
    seed: number;
    duration: number;
    error?: string;
}

export interface UpscaleRequest {
    mediaGenerationId: string;
    seed: number;
    aspectRatio: VideoAspectRatio;
}

export interface UpscaleResult {
    success: boolean;
    upscaledUrl: string;
    error?: string;
}

// =====================================
// BATCH PROCESSING TYPES
// =====================================

export interface BatchJob {
    id: string;
    type: 'image' | 'video' | 'upscale';
    status: BatchJobStatus;
    items: BatchJobItem[];
    progress: number;          // 0-100
    startedAt?: string;
    completedAt?: string;
    error?: string;
}

export type BatchJobStatus =
    | 'pending'
    | 'running'
    | 'paused'
    | 'completed'
    | 'failed'
    | 'cancelled';

export interface BatchJobItem {
    id: string;
    shotId: string;
    status: 'pending' | 'processing' | 'completed' | 'failed';
    result?: any;
    error?: string;
}

// =====================================
// EXPORT TYPES
// =====================================

export interface ExportOptions {
    format: ExportFormat;
    includeAudio: boolean;
    resolution: ExportResolution;
    fps: number;
    quality: number;         // 1-100
}

export type ExportFormat =
    | 'mp4'
    | 'webm'
    | 'gif'
    | 'image_sequence'
    | 'pdf_storyboard';

export type ExportResolution =
    | '720p'
    | '1080p'
    | '1440p'
    | '4k';

export interface ExportResult {
    success: boolean;
    url?: string;
    filename?: string;
    fileSize?: number;
    error?: string;
}

// =====================================
// ASSET MAPPING TYPES
// =====================================

export interface AssetMapping {
    storyboardId: string;
    characterMappings: CharacterMappingEntry[];
    locationMappings: LocationMappingEntry[];
    completionPercentage: number;
}

export interface CharacterMappingEntry {
    scriptName: string;           // Name as it appears in script
    universeCharacterId?: string; // Mapped Universe character ID
    isNew: boolean;               // True if needs to be created
    confidence: number;           // AI confidence in mapping (0-1)
}

export interface LocationMappingEntry {
    scriptName: string;
    universeLocationId?: string;
    isNew: boolean;
    confidence: number;
}
