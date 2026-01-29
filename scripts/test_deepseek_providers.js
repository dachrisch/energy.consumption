
const fs = require('fs');
const path = require('path');
const https = require('https');

// --- Configuration ---
const IMAGE_PATH = '/home/cda/.gemini/antigravity/brain/e192a1f2-437b-492d-ab04-ba51d6dd3a4b/uploaded_media_1769630597949.jpg';
const PROMPT = "Read the value on the meter display. Return only the number.";

async function main() {
    console.log('=== DeepSeek Janus-Pro API Tester ===');
    console.log(`Image: ${IMAGE_PATH}`);

    if (!fs.existsSync(IMAGE_PATH)) {
        console.error(`Error: Image not found at ${IMAGE_PATH}`);
        process.exit(1);
    }

    // Read image as base64
    const imageBuffer = fs.readFileSync(IMAGE_PATH);
    const base64Image = imageBuffer.toString('base64');
    const dataUrl = `data:image/jpeg;base64,${base64Image}`;

    // Check for keys
    const deepInfraKey = process.env.DEEPINFRA_TOKEN;
    const replicateKey = process.env.REPLICATE_API_TOKEN;

    if (!deepInfraKey && !replicateKey) {
        console.error('Error: No API keys found. Please set DEEPINFRA_TOKEN or REPLICATE_API_TOKEN.');
        process.exit(1);
    }

    if (deepInfraKey) {
        await testDeepInfra(deepInfraKey, dataUrl);
    } else {
        console.log('Skipping DeepInfra (DEEPINFRA_TOKEN not set)');
    }

    if (replicateKey) {
        await testReplicate(replicateKey, dataUrl);
    } else {
        console.log('Skipping Replicate (REPLICATE_API_TOKEN not set)');
    }
}

async function testDeepInfra(token, image) {
    console.log('\n--- Testing DeepInfra ---');
    try {
        const response = await fetch('https://api.deepinfra.com/v1/inference/deepseek-ai/Janus-Pro-7B', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                input: {
                    image: image,
                    prompt: PROMPT
                }
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${await response.text()}`);
        }

        const data = await response.json();
        console.log('Result:', JSON.stringify(data, null, 2));
    } catch (error) {
        console.error('DeepInfra Failed:', error.message);
    }
}

async function testReplicate(token, image) {
    console.log('\n--- Testing Replicate ---');
    try {
        // Replicate usually typically uses a specific version hash or model name
        // Using the official replicate HTTP API directly to avoid installing the SDK
        const response = await fetch('https://api.replicate.com/v1/predictions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                // This is a common public version for Janus-Pro 7B
                version: "4976fa835de38531eb44d85834863337aa4350567f13df7576579075775871f3",
                input: {
                    image: image,
                    prompt: PROMPT
                }
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${await response.text()}`);
        }

        let prediction = await response.json();
        console.log(`Prediction started: ${prediction.id}`);

        // Poll for completion
        while (prediction.status !== 'succeeded' && prediction.status !== 'failed') {
            process.stdout.write('.');
            await new Promise(r => setTimeout(r, 1000));
            const pollRes = await fetch(prediction.urls.get, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            prediction = await pollRes.json();
        }
        console.log('\n');

        if (prediction.status === 'succeeded') {
            console.log('Result:', prediction.output);
        } else {
            console.error('Replicate Failed:', prediction.error);
        }

    } catch (error) {
        console.error('Replicate Failed:', error.message);
    }
}

main().catch(console.error);
