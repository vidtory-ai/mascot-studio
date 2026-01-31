import fs from 'fs';
import path from 'path';

// Load .env manually BEFORE imports logic runs
const envPath = path.resolve(process.cwd(), '.env');
console.log('Loading .env from:', envPath);
if (fs.existsSync(envPath)) {
    const envConfig = fs.readFileSync(envPath, 'utf8');
    envConfig.split('\n').forEach(line => {
        const [key, value] = line.split('=');
        if (key && value) {
            process.env[key.trim()] = value.trim();
        }
    });
    console.log('✅ Loaded .env file');
} else {
    console.log('⚠️ .env file not found');
}

async function runTest() {
    console.log('🚀 Starting Image Generation Test...');
    try {
        // Dynamic import to ensure process.env is ready before module initialization
        const { generateImage } = await import('../src/services/media/imageService');

        if (!process.env.GEMINI_API_KEY) {
            console.error('❌ Missing GEMINI_API_KEY in .env');
            return;
        }

        console.log('Context: Gemini 2.5 Flash Native API');
        const result = await generateImage({
            prompt: "A futuristic cityscape at sunset, cyberpunk style, high detail",
            aspectRatio: "16:9"
        });

        if (result.success) {
            console.log('✅ Image Generated Successfully!');
            console.log(`📸 Image URL: ${result.images[0].substring(0, 50)}...`);
            console.log(`🤖 Model: ${result.model}`);
            console.log(`⚡️ Provider: ${result.provider}`);
        } else {
            console.error('❌ Generation Failed:', result.error);
        }
    } catch (error) {
        console.error('❌ Test Exception:', error);
    }
}

runTest();
