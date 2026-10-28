export const openRouterFetch = async (prompt: string, model: string = "openai/gpt-4o-mini", systemPrompt?: string) => {
  const apiKey = "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";
  
  const messages = [];
  if (systemPrompt) {
    messages.push({ role: "system", content: systemPrompt });
  }
  messages.push({ role: "user", content: prompt });

  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "HTTP-Referer": "https://ibos.app", // Optional, for including your app on openrouter.ai rankings.
        "X-Title": "IBOS Application", // Optional. Shows in rankings on openrouter.ai.
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: model,
        messages: messages,
      })
    });

    if (!response.ok) {
      throw new Error(`OpenRouter API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    console.error("OpenRouter Fetch Error:", error);
    throw error;
  }
};
