import { GoogleGenAI, Type, ThinkingLevel, Modality, FunctionDeclaration } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Helper for exponential backoff to handle Rate Limits (429)
// Increased retries to handle longer wait times (e.g. 60s)
const callWithRetry = async <T>(fn: () => Promise<T>, retries = 5, delay = 2000): Promise<T> => {
  try {
    return await fn();
  } catch (error: any) {
    const isRetryable = error.status === 429 || error.status === 503 || (error.message && error.message.includes('Quota exceeded')) || (error.message && error.message.includes('429'));
    
    if (retries > 0 && isRetryable) {
      console.warn(`API Rate Limit hit. Retrying in ${delay}ms... (Retries left: ${retries})`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return callWithRetry(fn, retries - 1, delay * 2);
    }
    throw error;
  }
};

/**
 * 1. SEARCH GROUNDING
 * Model: gemini-3.1-flash-preview
 * Use case: Market intelligence, regulatory updates, trends.
 */
export const searchMarketIntel = async (query: string) => {
  return callWithRetry(async () => {
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3.1-flash-preview",
        contents: query,
        config: {
          tools: [{ googleSearch: {} }],
        },
      });

      const text = response.text;
      const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
      
      // Extract search URLs
      const sources = groundingChunks
        .filter((c: any) => c.web)
        .map((c: any) => ({
          url: c.web.uri,
          title: c.web.title
        }));

      return { text, sources };
    } catch (error) {
      console.error("Search Grounding Error:", error);
      throw error;
    }
  });
};

/**
 * 2. MAPS GROUNDING
 * Model: gemini-2.5-flash
 * Use case: Finding suppliers, logistics partners.
 */
export const findLocalSuppliers = async (query: string, lat: number, lng: number) => {
  return callWithRetry(async () => {
    try {
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: query,
        config: {
          tools: [{ googleMaps: {} }],
          toolConfig: {
            retrievalConfig: {
              latLng: {
                latitude: lat,
                longitude: lng
              }
            }
          }
          // NOTE: responseMimeType is NOT allowed with googleMaps
        },
      });

      const text = response.text;
      const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
      
      // Extract map links
      const places = groundingChunks
        .filter((c: any) => c.maps)
        .map((c: any) => ({
          url: c.maps.uri,
          title: c.maps.title || "Map Location"
        }));

      return { text, places };
    } catch (error) {
      console.error("Maps Grounding Error:", error);
      throw error;
    }
  });
};

/**
 * 3. AI CHATBOT
 * Model: gemini-3.1-flash-preview
 * Use case: General assistance, bookkeeping help.
 */
export const chatWithAssistant = async (history: {role: string, parts: {text: string}[]}[], message: string) => {
  return callWithRetry(async () => {
    try {
      const chat = ai.chats.create({
        model: "gemini-3.1-flash-preview",
        history: history,
        config: {
          systemInstruction: `You are the IBOS Intelligent Agent. You are not just a chatbot; you are a proactive business partner for African SMEs. 
          
          Core Behaviors:
          1. **Contextual:** Use local currency (Rand/Naira) and local trade context.
          2. **Agentic:** Don't just answer; suggest the next step (e.g., "Shall I add that to your ledger?").
          3. **Simple:** Explain financial terms in plain language.
          4. **Encouraging:** Frame compliance and formalization as opportunities, not chores.

          If the user mentions a sale (e.g., "I sold bread"), format it as a transaction confirmation.
          If the user asks about loans, refer to their "Alternative Credit Score".`,
        }
      });
      
      const result = await chat.sendMessage({ message });
      return result.text;
    } catch (error) {
      console.error("Chat Error:", error);
      throw error;
    }
  });
};

/**
 * 4. FAST RESPONSE
 * Model: gemini-3.1-flash-lite
 * Use case: Quick calculations, translations, simple definitions.
 */
export const quickAssist = async (prompt: string) => {
  return callWithRetry(async () => {
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3.1-flash-lite",
        contents: prompt,
      });
      return response.text;
    } catch (error) {
      console.error("Fast Assist Error:", error);
      throw error;
    }
  });
};

/**
 * 5. VIDEO UNDERSTANDING
 * Model: gemini-3.1-flash-preview
 * Use case: Analyzing inventory videos to count stock.
 */
export const analyzeInventoryVideo = async (videoFile: File, prompt: string) => {
  return callWithRetry(async () => {
    try {
      // Helper to extract frames from Video
      const frames = await new Promise<string[]>((resolve, reject) => {
        const video = document.createElement("video");
        const url = URL.createObjectURL(videoFile);
        video.src = url;
        video.muted = true;
        video.playsInline = true;

        video.onloadeddata = async () => {
          const extracted: string[] = [];
          const canvas = document.createElement("canvas");
          
          // Downscale to 720p equivalent to save payload size
          const scale = Math.min(1, 720 / Math.max(video.videoWidth, video.videoHeight));
          canvas.width = video.videoWidth * scale;
          canvas.height = video.videoHeight * scale;
          
          const ctx = canvas.getContext("2d");
          
          const duration = video.duration || 2; // Default if not found
          const maxFrames = 5;
          const interval = duration / (maxFrames + 1);
          
          for (let i = 1; i <= maxFrames; i++) {
            video.currentTime = interval * i;
            await new Promise((r) => { video.onseeked = r; });
            if (ctx) {
              ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
              extracted.push(canvas.toDataURL("image/jpeg", 0.6).split(',')[1]);
            }
          }
          URL.revokeObjectURL(url);
          resolve(extracted);
        };
        video.onerror = () => reject(new Error("Failed to load video"));
        video.load();
      });

      const parts: any[] = frames.map(base64 => ({
        inlineData: { mimeType: "image/jpeg", data: base64 }
      }));
      parts.push({ text: prompt });

      const response = await ai.models.generateContent({
        model: "gemini-3.1-flash-preview",
        contents: { parts }
      });

      return response.text;
    } catch (error) {
      console.error("Video Analysis Error:", error);
      throw error;
    }
  });
};

/**
 * 6. IMAGE ANALYSIS
 * Model: gemini-3.1-flash-preview
 * Use case: Digitizing paper receipts.
 */
export const analyzeReceiptImage = async (imageFile: File) => {
  return callWithRetry(async () => {
    try {
      const base64Data = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const result = reader.result as string;
          const base64 = result.split(',')[1];
          resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(imageFile);
      });

      const response = await ai.models.generateContent({
        model: "gemini-3.1-flash-preview",
        contents: {
          parts: [
            {
              inlineData: {
                mimeType: imageFile.type,
                data: base64Data
              }
            },
            { text: "Analyze this receipt. Extract the vendor name, total amount, date, and list of items. Format as JSON." }
          ]
        },
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              vendor: { type: Type.STRING },
              date: { type: Type.STRING },
              total: { type: Type.NUMBER },
              items: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING },
                    price: { type: Type.NUMBER }
                  }
                }
              }
            }
          }
        }
      });

      return response.text;
    } catch (error) {
      console.error("Image Analysis Error:", error);
      throw error;
    }
  });
};

/**
 * 7. BUSINESS STRATEGY
 * Model: gemini-3.1-flash-preview
 * Use case: Enable high thinking
 */
export const generateBusinessStrategy = async (businessContext: string) => {
  return callWithRetry(async () => {
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3.1-flash-preview",
        contents: `Generate a detailed growth strategy for this business: ${businessContext}. Focus on risks, opportunities, and financial planning.`,
        config: {
          thinkingConfig: { thinkingLevel: ThinkingLevel.HIGH }
        }
      });
      return response.text;
    } catch (error) {
      console.error("Thinking Mode Error:", error);
      throw error;
    }
  });
};

/**
 * 8. TRADE READINESS ASSESSMENT
 * Model: gemini-3.1-flash-preview
 */
export const assessTradeReadiness = async (businessData: string) => {
  return callWithRetry(async () => {
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3.1-flash-preview",
        contents: `Assess the export readiness of this business based on the following data: ${businessData}. 
        Provide a readiness score (0-100), missing compliance items, and AfCFTA opportunities. Return JSON.`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              score: { type: Type.NUMBER },
              summary: { type: Type.STRING },
              missing_items: { type: Type.ARRAY, items: { type: Type.STRING }},
              opportunities: { type: Type.ARRAY, items: { type: Type.STRING }}
            }
          }
        }
      });
      return response.text;
    } catch (error) {
      console.error("Trade Readiness Error:", error);
      throw error;
    }
  });
};

/**
 * 9. SPEECH TO TEXT
 * Model: gemini-3.1-flash-preview
 * Use case: Transcribe audio / voice pitch
 */
export const transcribeAudio = async (audioFile: File) => {
  return callWithRetry(async () => {
    try {
      const base64Data = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const result = reader.result as string;
          resolve(result.split(',')[1]);
        };
        reader.onerror = reject;
        reader.readAsDataURL(audioFile);
      });

      const response = await ai.models.generateContent({
        model: "gemini-3.1-flash-preview",
        contents: {
          parts: [
            {
              inlineData: {
                mimeType: audioFile.type,
                data: base64Data
              }
            },
            { text: "Accurately transcribe this audio. Provide only the transcription text, nothing else." }
          ]
        }
      });

      return response.text;
    } catch (error) {
      console.error("Transcription Error:", error);
      throw error;
    }
  });
};

/**
 * 10. TEXT TO SPEECH
 * Model: gemini-3.1-flash-tts-preview
 * Use case: Voice conversations
 */
export const generateSpeech = async (text: string) => {
  return callWithRetry(async () => {
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3.1-flash-tts-preview",
        contents: [{ parts: [{ text }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: 'Kore' },
            },
          },
        },
      });

      const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (!base64Audio) {
         throw new Error("No audio data returned");
      }
      return base64Audio;
    } catch (error) {
      console.error("Text to Speech Error:", error);
      throw error;
    }
  });
};

/**
 * 11. HIGH-QUALITY IMAGE GENERATION
 * Model: gemini-3.1-flash-image-preview
 * Use case: Generate high quality images with specific aspect ratios
 */
export const generateHighQualityImage = async (prompt: string, aspectRatio: string = "1:1") => {
  return callWithRetry(async () => {
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.1-flash-image-preview',
        contents: {
          parts: [
            {
              text: prompt,
            },
          ],
        },
        config: {
          imageConfig: {
            // @ts-ignore
            aspectRatio: aspectRatio,
            imageSize: "1K"
          }
        },
      });
      
      for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
          return `data:${part.inlineData.mimeType || 'image/png'};base64,${part.inlineData.data}`;
        }
      }
      throw new Error("No image data found in response");
    } catch (error) {
      console.error("Image Generation Error:", error);
      throw error;
    }
  });
};

