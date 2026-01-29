
const fs = require('fs');
const path = require('path');
const https = require('https');

// --- Configuration ---
const IMAGE_PATH = '/home/cda/.gemini/antigravity/brain/e192a1f2-437b-492d-ab04-ba51d6dd3a4b/uploaded_media_1769630597949.jpg';
const API_KEY = process.env.GOOGLE_API_KEY;

async function main() {
    console.log('=== Google Gemini 1.5 Flash (Free Tier) OCR Tester ===');
    console.log(`Image: ${IMAGE_PATH}`);

    if (!API_KEY) {
        console.error('Error: GOOGLE_API_KEY is not set.');
        console.error('Get one for free at: https://aistudio.google.com/app/apikey');
        process.exit(1);
    }

    if (!fs.existsSync(IMAGE_PATH)) {
        console.error(`Error: Image not found at ${IMAGE_PATH}`);
        process.exit(1);
    }

    // Read image as base64
    const imageBuffer = fs.readFileSync(IMAGE_PATH);
    const base64Image = imageBuffer.toString('base64');

    await testGemini(API_KEY, base64Image);
}

async function testGemini(apiKey, base64Image) {
    console.log('\n--- Sending request to Gemini 1.5 Flash ---');

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

    const payload = {
        contents: [{
            parts: [
                { text: "Read the exact numeric value on the meter display AND the meter serial number. Return your response in JSON format: { \"value\": number, \"meter_number\": \"string\" }" },
                {
                    inline_data: {
                        mime_type: "image/jpeg",
                        data: base64Image
                    }
                }
            ]
        }]
    };

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${await response.text()}`);
        }

        const data = await response.json();

        // Parse response
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) {
            console.log('\n✅ OCR Result:', text.trim());
        } else {
            console.log('\n❌ No text found in response:', JSON.stringify(data, null, 2));
        }

    } catch (error) {
        console.error('\n❌ Request Failed:', error.message);
    }
}

main().catch(console.error);
