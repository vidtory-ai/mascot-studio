/**
 * Generate Business Mascot Pre-data via Gemini API
 * Theme: 3D Mascot Storytelling for Business Brands
 * Run: node scripts/generate-mascot-assets.mjs
 */

const GEMINI_API_KEY = 'AIzaSyClGkL1Og7Bukd_l-shHT6FUAkmzJQPo4A';
const IMAGE_MODEL = 'gemini-2.0-flash-exp-image-generation';

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outputPath = path.resolve(__dirname, '..', 'public', 'assets', 'samples');

// Ensure output directory exists
if (!fs.existsSync(outputPath)) {
    fs.mkdirSync(outputPath, { recursive: true });
}

// Clear old files
const existingFiles = fs.readdirSync(outputPath);
for (const file of existingFiles) {
    if (file.endsWith('.png') || file === 'manifest.json') {
        fs.unlinkSync(path.join(outputPath, file));
    }
}

// Business Mascot Theme Assets
const SAMPLE_ASSETS = [
    // MASCOT CHARACTERS (3D Cartoon Style)
    {
        id: 'mascot_01',
        name: 'Happy Brand Mascot',
        type: 'CHARACTER',
        prompt: '3D cartoon mascot character design, friendly orange fox character wearing business casual outfit with blue vest and white shirt, standing confidently with thumbs up gesture, bright cheerful expression, big expressive eyes, soft rounded features, Pixar Disney style, clean white studio background, professional character turnaround, vibrant saturated colors, high quality render',
    },
    {
        id: 'mascot_02',
        name: 'Tech Buddy Robot',
        type: 'CHARACTER',
        prompt: '3D cartoon robot mascot character, cute friendly AI assistant robot with rounded white body and teal accents, glowing LED eyes showing happy expression, small antenna on head, floating pose with welcoming gesture, futuristic but approachable design, Pixar style rendering, soft lighting, clean studio background, tech company mascot aesthetic',
    },

    // BUSINESS SCENES / BACKGROUNDS
    {
        id: 'scene_01',
        name: 'Modern Office Lobby',
        type: 'LOCATION',
        prompt: '3D rendered modern office lobby environment, minimalist corporate reception area with curved white desk, green plants, large windows with city skyline view, warm natural lighting, soft shadows, clean contemporary design, Pixar movie quality background, suitable for mascot placement, professional business atmosphere',
    },
    {
        id: 'scene_02',
        name: 'Product Launch Stage',
        type: 'LOCATION',
        prompt: '3D rendered product launch event stage, sleek presentation platform with gradient blue-to-purple backdrop, dramatic spotlights, large LED screens on sides, modern podium, corporate event atmosphere, Apple keynote style staging, cinematic lighting, Pixar quality render, empty stage ready for character',
    },
    {
        id: 'scene_03',
        name: 'Coffee Shop Meeting',
        type: 'LOCATION',
        prompt: '3D rendered cozy coffee shop interior, warm wooden furniture, comfortable seating area with soft cushions, large windows with natural light, plants and warm lighting, modern cafe aesthetic, inviting business meeting spot, soft colors, Pixar movie background quality, lifestyle brand atmosphere',
    },
    {
        id: 'scene_04',
        name: 'Social Media Studio',
        type: 'LOCATION',
        prompt: '3D rendered content creator studio, bright colorful backdrop with neon ring lights, modern desk setup with camera and microphone, trendy decoration with plants and LED strips, influencer aesthetic, Youtube/TikTok creator space, vibrant energetic atmosphere, Pixar quality rendering',
    },
    {
        id: 'scene_05',
        name: 'E-commerce Warehouse',
        type: 'LOCATION',
        prompt: '3D rendered modern fulfillment warehouse, organized shelving with colorful product boxes, clean bright lighting, delivery robots in background, logistics and shipping theme, professional business operations, efficient workspace aesthetic, Pixar movie quality, suitable for mascot placement',
    },
    {
        id: 'scene_06',
        name: 'Digital Marketing Dashboard',
        type: 'LOCATION',
        prompt: '3D rendered abstract digital workspace, floating holographic charts and graphs, analytics dashboard with colorful data visualizations, futuristic UI elements, glowing metrics and KPIs, digital marketing theme, tech-forward aesthetic, Pixar quality, vibrant blues and greens',
    },

    // ADVERTISING PROPS
    {
        id: 'prop_01',
        name: 'Gift Box Package',
        type: 'PROP',
        prompt: '3D rendered gift box product packaging, premium white box with colorful ribbon bow, floating presentation angle, soft studio lighting, clean minimalist design, e-commerce product shot, high quality render, celebratory promotion theme, Pixar quality',
    },
    {
        id: 'prop_02',
        name: 'Megaphone Announcement',
        type: 'PROP',
        prompt: '3D rendered cartoon megaphone, bright red and white colors, stylized rounded design with sound waves emanating, marketing announcement theme, call to action visual, Pixar style prop design, clean studio background, vibrant saturated colors',
    },
    {
        id: 'prop_03',
        name: 'Shopping Cart',
        type: 'PROP',
        prompt: '3D rendered stylized shopping cart, chrome and orange design, filled with colorful product boxes and shopping bags, e-commerce theme, retail promotion visual, Pixar style rendering, floating presentation angle, soft shadows, clean background',
    },
    {
        id: 'prop_04',
        name: 'Star Rating Badge',
        type: 'PROP',
        prompt: '3D rendered 5-star rating badge, golden stars with glowing effect, premium quality seal design, customer review theme, trust badge visual, shiny metallic render, floating angle with soft shadow, Pixar quality, testimonial marketing asset',
    },
    {
        id: 'prop_05',
        name: 'Sale Tag Banner',
        type: 'PROP',
        prompt: '3D rendered sale price tag, red and yellow gradient colors, SALE text with percentage discount, ribbon banner style, promotional retail theme, eye-catching design, Pixar style rendering, floating with dynamic angle, marketing visual asset',
    },
];

async function generateImage(prompt) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${IMAGE_MODEL}:generateContent?key=${GEMINI_API_KEY}`;

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

async function generateAllAssets() {
    console.log('🎨 Generating Business Mascot Pre-data...\n');
    console.log(`🤖 Model: ${IMAGE_MODEL}`);
    console.log(`📁 Output: ${outputPath}\n`);

    const results = [];

    for (let i = 0; i < SAMPLE_ASSETS.length; i++) {
        const asset = SAMPLE_ASSETS[i];
        console.log(`📸 [${i + 1}/${SAMPLE_ASSETS.length}] [${asset.type}] ${asset.name}`);

        try {
            const image = await generateImage(asset.prompt);
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
        theme: 'Business Mascot Storytelling',
        model: IMAGE_MODEL,
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
