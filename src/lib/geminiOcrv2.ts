
export async function scanImageWithGemini(image: Blob, apiKey: string): Promise<string> {
    const arrayBuffer = await image.arrayBuffer();
    const base64Image = Buffer.from(arrayBuffer).toString('base64');

    // Use the 2.5 flash model which worked in our external test
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent`;

    const payload = {
        contents: [{
            parts: [
                { text: "Read the exact numeric value on the meter display AND the meter serial number. Identify if it is a power meter (usually has 'kWh', 'CL', or a digital LCD) or a gas meter (usually has 'm³', 'cubic feet', or analog dials). Return your response in JSON format: { \"value\": number, \"meter_number\": \"string\", \"type\": \"power\"|\"gas\", \"unit\": \"kWh\"|\"m³\" }" },
                {
                    inline_data: {
                        mime_type: "image/jpeg",
                        data: base64Image
                    }
                }
            ]
        }]
    };

    const response = await fetch(url, {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json',
            'x-goog-api-key': apiKey
        },
        body: JSON.stringify(payload)
    });

    if (!response.ok) {
        let errorMsg = response.statusText;
        try {
            const errorJson = await response.json();
            if (errorJson?.error?.message) {
                errorMsg = errorJson.error.message;
            }
        } catch { /* ignore */ }
        throw new Error(`Gemini OCR failed (${response.status}): ${errorMsg}`);
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
        throw new Error('Gemini returned an empty response');
    }

    return text;
}
