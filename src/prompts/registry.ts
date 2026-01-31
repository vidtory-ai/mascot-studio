/**
 * IP World Builder - System Prompt Registry
 * 
 * Centralized management of all AI prompts with versioning,
 * parameter interpolation, and runtime overrides.
 */

// =====================================
// TYPES
// =====================================

export enum PromptCategory {
    UNIVERSE = 'universe',
    STORYBOARD = 'storyboard',
    PRODUCTION = 'production'
}

export interface PromptConfig {
    id: string;
    version: string;
    category: PromptCategory;
    name: string;
    description: string;
    systemInstruction: string;
    userPromptTemplate?: string;
    outputSchema?: Record<string, any>;
    temperature?: number;
    maxTokens?: number;
    preferredModel?: string;
}

export interface PromptParams {
    [key: string]: string | number | boolean | string[] | undefined;
}

// =====================================
// PROMPT REGISTRY CLASS
// =====================================

class PromptRegistryClass {
    private prompts: Map<string, PromptConfig> = new Map();
    private overrides: Map<string, Partial<PromptConfig>> = new Map();

    /**
     * Register a new prompt configuration
     */
    register(config: PromptConfig): void {
        if (this.prompts.has(config.id)) {
            console.warn(`[PromptRegistry] Overwriting existing prompt: ${config.id}`);
        }
        this.prompts.set(config.id, config);
    }

    /**
     * Register multiple prompts at once
     */
    registerAll(configs: PromptConfig[]): void {
        configs.forEach(config => this.register(config));
    }

    /**
     * Get a prompt configuration with optional parameter interpolation
     */
    get(id: string, params?: PromptParams): PromptConfig {
        const baseConfig = this.prompts.get(id);
        if (!baseConfig) {
            throw new Error(`[PromptRegistry] Prompt not found: ${id}`);
        }

        // Apply any runtime overrides
        const override = this.overrides.get(id);
        const config = override ? { ...baseConfig, ...override } : { ...baseConfig };

        // Interpolate parameters in systemInstruction
        if (params) {
            config.systemInstruction = this.interpolate(config.systemInstruction, params);
            if (config.userPromptTemplate) {
                config.userPromptTemplate = this.interpolate(config.userPromptTemplate, params);
            }
        }

        return config;
    }

    /**
     * Set a runtime override for a prompt
     */
    setOverride(id: string, override: Partial<PromptConfig>): void {
        this.overrides.set(id, override);
    }

    /**
     * Clear a runtime override
     */
    clearOverride(id: string): void {
        this.overrides.delete(id);
    }

    /**
     * Clear all runtime overrides
     */
    clearAllOverrides(): void {
        this.overrides.clear();
    }

    /**
     * List all registered prompts
     */
    list(): PromptConfig[] {
        return Array.from(this.prompts.values());
    }

    /**
     * List prompts by category
     */
    listByCategory(category: PromptCategory): PromptConfig[] {
        return this.list().filter(p => p.category === category);
    }

    /**
     * Check if a prompt exists
     */
    has(id: string): boolean {
        return this.prompts.has(id);
    }

    /**
     * Get the system instruction only (for quick access)
     */
    getSystemInstruction(id: string, params?: PromptParams): string {
        return this.get(id, params).systemInstruction;
    }

    /**
     * Interpolate parameters in a template string
     * Supports {{paramName}} syntax
     */
    private interpolate(template: string, params: PromptParams): string {
        return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
            const value = params[key];
            if (value === undefined) {
                console.warn(`[PromptRegistry] Missing parameter: ${key}`);
                return match; // Keep original if not found
            }
            if (Array.isArray(value)) {
                return value.join(', ');
            }
            return String(value);
        });
    }
}

// =====================================
// SINGLETON EXPORT
// =====================================

export const PromptRegistry = new PromptRegistryClass();

// =====================================
// HELPER FUNCTIONS
// =====================================

/**
 * Create a prompt config with default values
 */
export function createPromptConfig(
    partial: Omit<PromptConfig, 'version'> & { version?: string }
): PromptConfig {
    return {
        version: '1.0.0',
        temperature: 0.7,
        maxTokens: 2000,
        preferredModel: 'gemini-2.5-flash',
        ...partial
    };
}

/**
 * Build a composite system instruction from multiple prompts
 */
export function combinePrompts(ids: string[], params?: PromptParams): string {
    return ids
        .map(id => PromptRegistry.getSystemInstruction(id, params))
        .join('\n\n---\n\n');
}
