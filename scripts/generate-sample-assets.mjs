/**
 * Generate Sample Asset Images via Gemini Native API
 * Uses gemini-2.0-flash-exp for image generation
 * Run: node scripts/generate-sample-assets.mjs
 */

const GEMINI_API_KEY = 'AIzaSyClGkL1Og7Bukd_l-shHT6FUAkmzJQPo4A';
// Try multiple model names
const IMAGE_MODELS = [
    'gemini-2.0-flash-exp',
    'gemini-2.0-flash-exp-image-generation',
    'gemini-exp-1206'
];

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outputPath = path.resolve(__dirname, '..', 'public', 'assets', 'samples');

// Ensure output directory exists
if (!fs.existsSync(outputPath)) {
    fs.mkdirSync(outputPath, { recursive: true });
}

// Sample assets to generate
const SAMPLE_ASSETS = [
    {
        id: 'char_01',
        name: 'Cyberpunk Protagonist',
        type: 'CHARACTER',
        prompt: 'Full body character design sheet, young cyberpunk hero with neon blue hair, wearing a sleek black jacket with glowing circuit patterns, confident pose, anime style, vibrant colors, dark cityscape background, highly detailed, professional concept art',
    },
    {
        id: 'char_02',
        name: 'Ancient Wizard',
        type: 'CHARACTER',
        prompt: 'Full body character design sheet, wise elderly wizard with long silver beard, wearing deep purple robes with golden star patterns, holding a glowing crystal staff, mystical aura, fantasy art style, warm magical lighting, detailed fabric textures',
    },
    {
        id: 'loc_01',
        name: 'Neo Tokyo Street',
        type: 'LOCATION',
        prompt: 'Wide shot environment concept art, futuristic cyberpunk street at night, neon signs in Japanese, holographic advertisements, rain-slicked streets reflecting colorful lights, food stalls with steam rising, dense urban atmosphere, cinematic composition, highly detailed',
    },
    {
        id: 'loc_02',
        name: 'Floating Castle',
        type: 'LOCATION',
        prompt: 'Fantasy environment concept art, majestic medieval castle floating on magical clouds, golden sunset sky, waterfalls cascading from the floating island, birds circling the towers, epic scale, dreamlike atmosphere, highly detailed architecture, studio ghibli inspired',
    },
    {
        id: 'loc_03',
        name: 'Desert Outpost',
        type: 'LOCATION',
        prompt: 'Sci-fi environment concept art, lone trading outpost in vast desert, worn metal structures partially buried in sand, twin suns setting on horizon, salvaged spacecraft parts, dust storm approaching in distance, post-apocalyptic atmosphere, warm orange tones',
    },
    {
        id: 'prop_01',
        name: 'Plasma Rifle',
        type: 'PROP',
        prompt: 'Detailed weapon design sheet, futuristic plasma rifle with glowing blue energy core, sleek black and chrome design, holographic sight, multiple view angles, sci-fi game asset style, clean background, high detail rendering',
    },
    {
        id: 'prop_02',
        name: 'Mech Suit MK-II',
        type: 'PROP',
        prompt: 'Mecha design sheet, heavy combat exosuit with thick armor plating, glowing reactor core in chest, multiple weapons mounted on arms, weathered battle damage, industrial military aesthetic, front and side view, detailed mechanical components',
    },
];

async function generateImage(prompt, modelName) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${GEMINI_API_KEY}`;

    const payload = {
        contents: [{
            parts: [{ text: prompt }]
        }],
        generationConfig: {
            responseModalities: ['TEXT', 'IMAGE']
        }
    };

    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`API Error ${response.status}: ${errorData.error?.message || response.statusText}`);
    }

    const data = await response.json();

    // Extract image from response
    const candidates = data.candidates || [];
    for (const candidate of candidates) {
        const parts = candidate.content?.parts || [];
        for (const part of parts) {
            if (part.inlineData) {
                return {
                    base64: part.inlineData.data,
                    mimeType: part.inlineData.mimeType
                };
            }
        }
    }

    throw new Error('No image in response');
}

function saveImage(base64, mimeType, filename) {
    const extension = mimeType.split('/')[1] || 'png';
    const fullFilename = `${filename}.${extension}`;
    const filepath = path.join(outputPath, fullFilename);

    const buffer = Buffer.from(base64, 'base64');
    fs.writeFileSync(filepath, buffer);

    console.log(`  ✅ Saved: ${fullFilename}`);
    return `/assets/samples/${fullFilename}`;
}

async function findWorkingModel() {
    console.log('🔍 Testing available image generation models...\n');

    for (const model of IMAGE_MODELS) {
        console.log(`  Testing ${model}...`);
        try {
            const result = await generateImage('A simple red circle on white background, minimalist', model);
            console.log(`  ✅ ${model} works!\n`);
            return model;
        } catch (error) {
            console.log(`  ❌ ${model}: ${error.message.substring(0, 80)}`);
        }
    }

    return null;
}

async function generateAllAssets() {
    console.log('🎨 Generating sample assets via Gemini API...\n');

    // First find a working model
    const workingModel = await findWorkingModel();

    if (!workingModel) {
        console.log('\n❌ No working image generation model found.');
        console.log('💡 Will use generate_image tool instead for manual generation.');
        return;
    }

    console.log(`🤖 Using model: ${workingModel}\n`);

    const results = [];

    for (const asset of SAMPLE_ASSETS) {
        console.log(`📸 [${asset.type}] ${asset.name}`);

        try {
            const image = await generateImage(asset.prompt, workingModel);
            const relativePath = saveImage(image.base64, image.mimeType, asset.id);

            results.push({
                ...asset,
                thumbnailUrl: relativePath,
                success: true
            });

            // Delay to avoid rate limiting
            await new Promise(r => setTimeout(r, 3000));

        } catch (error) {
            console.log(`  ❌ Failed: ${error.message}`);
            results.push({
                ...asset,
                thumbnailUrl: null,
                success: false,
                error: error.message
            });
        }
    }

    // Generate manifest
    const manifest = {
        generated: new Date().toISOString(),
        model: workingModel,
        assets: results.filter(r => r.success).map(r => ({
            id: r.id,
            name: r.name,
            type: r.type,
            thumbnailUrl: r.thumbnailUrl
        }))
    };

    fs.writeFileSync(
        path.join(outputPath, 'manifest.json'),
        JSON.stringify(manifest, null, 2)
    );

    console.log('\n📋 Summary:');
    console.log(`   ✅ Success: ${results.filter(r => r.success).length}`);
    console.log(`   ❌ Failed: ${results.filter(r => !r.success).length}`);
    console.log(`\n📁 Output: ${outputPath}`);

    // Output TypeScript constant
    if (results.some(r => r.success)) {
        console.log('\n📝 Copy this to App.tsx INITIAL_ASSETS:\n');
        console.log('const INITIAL_ASSETS: Asset[] = [');
        for (const r of results.filter(r => r.success)) {
            console.log(`  { id: '${r.id}', name: '${r.name}', type: AssetType.${r.type}, thumbnailUrl: '${r.thumbnailUrl}', createdAt: '${new Date().toLocaleDateString()}' },`);
        }
        console.log('];');
    }
}

generateAllAssets();
