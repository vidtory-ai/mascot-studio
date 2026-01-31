import fs from 'fs';
import path from 'path';

const envPath = path.resolve(process.cwd(), '.env');
if (fs.existsSync(envPath)) {
    const envConfig = fs.readFileSync(envPath, 'utf8');
    envConfig.split('\n').forEach(line => {
        const [key, value] = line.split('=');
        if (key && value) {
            process.env[key.trim()] = value.trim();
        }
    });
}

async function list() {
    const key = process.env.GEMINI_API_KEY;
    if (!key) { console.log('No key found in .env'); return; }

    console.log('Querying Google Gemini API for models...');
    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${key}`;
    try {
        const r = await fetch(url);
        const d = await r.json();

        if (d.error) {
            console.error('API Error:', d.error);
        } else {
            console.log('\n✅ Available Models with generateContent support:');
            d.models?.forEach((m: any) => {
                if (m.supportedGenerationMethods?.includes('generateContent')) {
                    console.log(`- ${m.name.replace('models/', '')}`);
                }
            });

            console.log('\nChecking for "gemini-2.5" or similar:');
            const matches = d.models?.filter((m: any) => m.name.includes('gemini-2') || m.name.includes('flash'));
            matches?.forEach((m: any) => console.log(`  * ${m.name}`));
        }
    } catch (e) {
        console.error('Fetch error:', e);
    }
}

list();
