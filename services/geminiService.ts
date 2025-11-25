import { GoogleGenAI, Modality } from "@google/genai";
import { VoiceConfig } from '../types';

// Initialize Gemini Client
const getClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key not found");
  }
  return new GoogleGenAI({ apiKey });
};

export const extractTextFromPdf = async (base64Pdf: string): Promise<string> => {
  const ai = getClient();
  
  // Use gemini-2.5-flash for fast and efficient text extraction
  const modelId = "gemini-2.5-flash";
  
  try {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: "application/pdf",
              data: base64Pdf
            }
          },
          {
            text: `Extract all readable text from this PDF document. 
            Format the output as clear, natural paragraphs separated by double newlines. 
            Do not include page numbers, headers, footers, or image captions unless they are integral to the narrative.
            Do not provide a summary; provide the full text content.`
          }
        ]
      }
    });

    return response.text || "";
  } catch (error) {
    console.error("Error extracting text:", error);
    throw error;
  }
};

export const synthesizeSpeech = async (text: string, voice: VoiceConfig): Promise<string> => {
  const ai = getClient();
  const modelId = "gemini-2.5-flash-preview-tts";

  try {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: [
        {
          parts: [
            { text: text }
          ]
        }
      ],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: {
              voiceName: voice.name
            }
          }
        }
      }
    });

    const audioPart = response.candidates?.[0]?.content?.parts?.[0];
    if (audioPart && audioPart.inlineData && audioPart.inlineData.data) {
      return audioPart.inlineData.data;
    }
    throw new Error("No audio data returned");

  } catch (error) {
    console.error("Error synthesizing speech:", error);
    throw error;
  }
};
