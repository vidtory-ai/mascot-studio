/**
 * IP World Builder - Project Storage Service
 * 
 * Handles persistence of projects, characters, and assets using localStorage/IndexedDB.
 */

import type { UniverseProject, Character, Location, Prop } from '../../types/universe.types';
import type { Storyboard } from '../../types/storyboard.types';
import type { ProductionProject } from '../../types/production.types';

// =====================================
// STORAGE KEYS
// =====================================

const STORAGE_KEYS = {
    UNIVERSE_PROJECTS: 'ipwb_universe_projects',
    STORYBOARDS: 'ipwb_storyboards',
    PRODUCTION_PROJECTS: 'ipwb_production_projects',
    SETTINGS: 'ipwb_settings',
    LAST_PROJECT: 'ipwb_last_project'
} as const;

// =====================================
// TYPES
// =====================================

export interface ProjectSummary {
    id: string;
    name: string;
    type: 'universe' | 'storyboard' | 'production';
    updatedAt: string;
    characterCount?: number;
    sceneCount?: number;
}

export interface AppSettings {
    theme: 'dark' | 'light';
    language: string;
    defaultAspectRatio: string;
    autoSave: boolean;
    autoSaveInterval: number; // minutes
}

// =====================================
// STORAGE HELPERS
// =====================================

function safeGetItem<T>(key: string, defaultValue: T): T {
    try {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
        console.warn(`[Storage] Failed to read ${key}:`, error);
        return defaultValue;
    }
}

function safeSetItem(key: string, value: any): boolean {
    try {
        localStorage.setItem(key, JSON.stringify(value));
        return true;
    } catch (error) {
        console.error(`[Storage] Failed to write ${key}:`, error);
        return false;
    }
}

function generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// =====================================
// UNIVERSE PROJECT OPERATIONS
// =====================================

export function getUniverseProjects(): UniverseProject[] {
    return safeGetItem<UniverseProject[]>(STORAGE_KEYS.UNIVERSE_PROJECTS, []);
}

export function getUniverseProject(id: string): UniverseProject | null {
    const projects = getUniverseProjects();
    return projects.find(p => p.id === id) || null;
}

export function saveUniverseProject(project: UniverseProject): boolean {
    const projects = getUniverseProjects();
    const index = projects.findIndex(p => p.id === project.id);

    const updatedProject = {
        ...project,
        updatedAt: new Date().toISOString()
    };

    if (index >= 0) {
        projects[index] = updatedProject;
    } else {
        projects.push(updatedProject);
    }

    return safeSetItem(STORAGE_KEYS.UNIVERSE_PROJECTS, projects);
}

export function deleteUniverseProject(id: string): boolean {
    const projects = getUniverseProjects().filter(p => p.id !== id);
    return safeSetItem(STORAGE_KEYS.UNIVERSE_PROJECTS, projects);
}

export function createUniverseProject(name: string): UniverseProject {
    const now = new Date().toISOString();
    const project: UniverseProject = {
        id: generateId(),
        name,
        worldBible: {
            id: generateId(),
            name: `${name} World Bible`,
            visualStyle: {
                artStyle: 'Cinematic',
                colorPalette: [],
                lightingPreference: 'Natural',
                moodKeywords: [],
                aspectRatio: '16:9'
            },
            createdAt: now,
            updatedAt: now
        },
        characters: [],
        locations: [],
        props: [],
        groups: [],
        createdAt: now,
        updatedAt: now
    };

    saveUniverseProject(project);
    return project;
}

// =====================================
// CHARACTER OPERATIONS
// =====================================

export function addCharacterToProject(projectId: string, character: Character): boolean {
    const project = getUniverseProject(projectId);
    if (!project) return false;

    project.characters.push(character);
    return saveUniverseProject(project);
}

export function updateCharacterInProject(projectId: string, character: Character): boolean {
    const project = getUniverseProject(projectId);
    if (!project) return false;

    const index = project.characters.findIndex(c => c.id === character.id);
    if (index < 0) return false;

    project.characters[index] = character;
    return saveUniverseProject(project);
}

export function deleteCharacterFromProject(projectId: string, characterId: string): boolean {
    const project = getUniverseProject(projectId);
    if (!project) return false;

    project.characters = project.characters.filter(c => c.id !== characterId);
    return saveUniverseProject(project);
}

// =====================================
// LOCATION OPERATIONS
// =====================================

export function addLocationToProject(projectId: string, location: Location): boolean {
    const project = getUniverseProject(projectId);
    if (!project) return false;

    project.locations.push(location);
    return saveUniverseProject(project);
}

export function updateLocationInProject(projectId: string, location: Location): boolean {
    const project = getUniverseProject(projectId);
    if (!project) return false;

    const index = project.locations.findIndex(l => l.id === location.id);
    if (index < 0) return false;

    project.locations[index] = location;
    return saveUniverseProject(project);
}

export function deleteLocationFromProject(projectId: string, locationId: string): boolean {
    const project = getUniverseProject(projectId);
    if (!project) return false;

    project.locations = project.locations.filter(l => l.id !== locationId);
    return saveUniverseProject(project);
}

// =====================================
// STORYBOARD OPERATIONS
// =====================================

export function getStoryboards(): Storyboard[] {
    return safeGetItem<Storyboard[]>(STORAGE_KEYS.STORYBOARDS, []);
}

export function getStoryboard(id: string): Storyboard | null {
    return getStoryboards().find(s => s.id === id) || null;
}

export function saveStoryboard(storyboard: Storyboard): boolean {
    const storyboards = getStoryboards();
    const index = storyboards.findIndex(s => s.id === storyboard.id);

    const updated = {
        ...storyboard,
        updatedAt: new Date().toISOString()
    };

    if (index >= 0) {
        storyboards[index] = updated;
    } else {
        storyboards.push(updated);
    }

    return safeSetItem(STORAGE_KEYS.STORYBOARDS, storyboards);
}

export function deleteStoryboard(id: string): boolean {
    const storyboards = getStoryboards().filter(s => s.id !== id);
    return safeSetItem(STORAGE_KEYS.STORYBOARDS, storyboards);
}

// =====================================
// PRODUCTION PROJECT OPERATIONS
// =====================================

export function getProductionProjects(): ProductionProject[] {
    return safeGetItem<ProductionProject[]>(STORAGE_KEYS.PRODUCTION_PROJECTS, []);
}

export function getProductionProject(id: string): ProductionProject | null {
    return getProductionProjects().find(p => p.id === id) || null;
}

export function saveProductionProject(project: ProductionProject): boolean {
    const projects = getProductionProjects();
    const index = projects.findIndex(p => p.id === project.id);

    const updated = {
        ...project,
        updatedAt: new Date().toISOString()
    };

    if (index >= 0) {
        projects[index] = updated;
    } else {
        projects.push(updated);
    }

    return safeSetItem(STORAGE_KEYS.PRODUCTION_PROJECTS, projects);
}

// =====================================
// SETTINGS OPERATIONS
// =====================================

const DEFAULT_SETTINGS: AppSettings = {
    theme: 'dark',
    language: 'vi',
    defaultAspectRatio: '16:9',
    autoSave: true,
    autoSaveInterval: 5
};

export function getSettings(): AppSettings {
    return safeGetItem<AppSettings>(STORAGE_KEYS.SETTINGS, DEFAULT_SETTINGS);
}

export function saveSettings(settings: Partial<AppSettings>): boolean {
    const current = getSettings();
    return safeSetItem(STORAGE_KEYS.SETTINGS, { ...current, ...settings });
}

// =====================================
// PROJECT SUMMARIES
// =====================================

export function getAllProjectSummaries(): ProjectSummary[] {
    const summaries: ProjectSummary[] = [];

    // Universe projects
    for (const p of getUniverseProjects()) {
        summaries.push({
            id: p.id,
            name: p.name,
            type: 'universe',
            updatedAt: p.updatedAt,
            characterCount: p.characters.length
        });
    }

    // Storyboards
    for (const s of getStoryboards()) {
        summaries.push({
            id: s.id,
            name: s.title,
            type: 'storyboard',
            updatedAt: s.updatedAt,
            sceneCount: s.scenes.length
        });
    }

    // Production projects
    for (const p of getProductionProjects()) {
        summaries.push({
            id: p.id,
            name: p.name,
            type: 'production',
            updatedAt: p.updatedAt
        });
    }

    // Sort by most recent
    return summaries.sort((a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
}

// =====================================
// EXPORT / IMPORT
// =====================================

export function exportProjectAsJson(projectId: string, type: 'universe' | 'storyboard' | 'production'): string | null {
    let data: any = null;

    switch (type) {
        case 'universe':
            data = getUniverseProject(projectId);
            break;
        case 'storyboard':
            data = getStoryboard(projectId);
            break;
        case 'production':
            data = getProductionProject(projectId);
            break;
    }

    if (!data) return null;

    return JSON.stringify({
        type,
        version: '1.0',
        exportedAt: new Date().toISOString(),
        data
    }, null, 2);
}

export function downloadProjectAsFile(projectId: string, type: 'universe' | 'storyboard' | 'production'): void {
    const json = exportProjectAsJson(projectId, type);
    if (!json) return;

    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ipwb_${type}_${projectId}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

export async function importProjectFromFile(file: File): Promise<{ success: boolean; error?: string }> {
    try {
        const text = await file.text();
        const data = JSON.parse(text);

        if (!data.type || !data.data) {
            return { success: false, error: 'Invalid project file format' };
        }

        // Generate new ID to avoid conflicts
        data.data.id = generateId();
        data.data.createdAt = new Date().toISOString();
        data.data.updatedAt = new Date().toISOString();

        switch (data.type) {
            case 'universe':
                saveUniverseProject(data.data);
                break;
            case 'storyboard':
                saveStoryboard(data.data);
                break;
            case 'production':
                saveProductionProject(data.data);
                break;
            default:
                return { success: false, error: `Unknown project type: ${data.type}` };
        }

        return { success: true };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to import project'
        };
    }
}

// =====================================
// LAST OPENED PROJECT
// =====================================

export function getLastOpenedProject(): { id: string; type: string } | null {
    return safeGetItem<{ id: string; type: string } | null>(STORAGE_KEYS.LAST_PROJECT, null);
}

export function setLastOpenedProject(id: string, type: string): void {
    safeSetItem(STORAGE_KEYS.LAST_PROJECT, { id, type });
}
