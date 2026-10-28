export const translateContent = async (text: string, targetLanguage?: string) => {
  const content = targetLanguage 
    ? `Translate the following text to ${targetLanguage}: "${text}". Adapt to African phrasing and cultural context where applicable.`
    : text;
    
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);

  try {
    const response = await fetch("/api/translate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        inputs: [
          { role: "user", content }
        ]
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errData = await response.json().catch(() => null) || await response.text();
      console.error("Translation API error:", errData);
      throw new Error(`Failed to communicate with translation API: ${JSON.stringify(errData)}`);
    }

    const data = await response.json();
    
    if (data.choices && data.choices[0] && data.choices[0].message) {
      return data.choices[0].message.content;
    }
    
    return JSON.stringify(data, null, 2);
  } catch (error: any) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error("Translation request timed out after 10 seconds.");
    }
    throw error;
  }
};

export const translateApp = async (dictionary: Record<string, string>, targetLanguage: string): Promise<Record<string, string>> => {
  const entries = Object.entries(dictionary);
  // Split into chunks to speed up the translation so we stay under 10 seconds
  const chunkSize = Math.ceil(entries.length / 4);
  const chunks: Record<string, string>[] = [];
  for (let i = 0; i < entries.length; i += chunkSize) {
    chunks.push(Object.fromEntries(entries.slice(i, i + chunkSize)));
  }

  const translateChunk = async (chunk: Record<string, string>) => {
    const content = `You are a translation AI. Translate the following JSON dictionary of app UI strings to ${targetLanguage}. Maintain the exact JSON keys. Return ONLY valid JSON, no markdown formatting or extra text.\n\n${JSON.stringify(chunk)}`;
      
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    try {
      const response = await fetch("/api/translate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          inputs: [
            { role: "user", content }
          ]
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errData = await response.json().catch(() => null) || await response.text();
        console.error("Translation API error:", errData);
        throw new Error(`Failed to communicate with Translation API: ${JSON.stringify(errData)}`);
      }

      const data = await response.json();
      
      let translatedText = "";
      if (data.choices && data.choices[0] && data.choices[0].message) {
        translatedText = data.choices[0].message.content;
      } else {
        translatedText = JSON.stringify(data, null, 2);
      }

      let cleaned = translatedText;
      const match = translatedText.match(/\{[\s\S]*\}/);
      if (match) {
        cleaned = match[0];
      }
      return JSON.parse(cleaned);
    } catch (error: any) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        throw new Error("Translation request timed out after 10 seconds.");
      }
      throw error;
    }
  };

  try {
    const results = await Promise.all(chunks.map(chunk => translateChunk(chunk)));
    return Object.assign({}, ...results);
  } catch (error) {
    throw error;
  }
};
