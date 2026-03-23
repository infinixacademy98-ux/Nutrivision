import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export const analyzeFoodImage = async (base64Image: string) => {
  const model = "gemini-2.5-flash";
  const prompt = `Analyze this food image. Provide the top 3 most likely food items. 
  For each item, estimate nutrition for a standard portion (100g).
  Return as JSON.`;

  const response = await ai.models.generateContent({
    model,
    contents: [
      {
        parts: [
          { text: prompt },
          { inlineData: { mimeType: "image/jpeg", data: base64Image } }
        ]
      }
    ],
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            calories: { type: Type.NUMBER },
            protein: { type: Type.NUMBER },
            fat: { type: Type.NUMBER },
            carbs: { type: Type.NUMBER },
            fiber: { type: Type.NUMBER },
            confidence: { type: Type.NUMBER }
          },
          required: ["name", "calories", "protein", "fat", "carbs", "fiber"]
        }
      }
    }
  });

  return JSON.parse(response.text);
};

export const analyzeFoodText = async (foodText: string) => {
  const model = "gemini-2.5-flash";
  const prompt = `The user says they ate: "${foodText}". 
  Provide the most likely food item and its estimated nutrition for a standard portion (100g).
  Return as an array with 1 item in JSON.`;

  const response = await ai.models.generateContent({
    model,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            calories: { type: Type.NUMBER },
            protein: { type: Type.NUMBER },
            fat: { type: Type.NUMBER },
            carbs: { type: Type.NUMBER },
            fiber: { type: Type.NUMBER },
            confidence: { type: Type.NUMBER }
          },
          required: ["name", "calories", "protein", "fat", "carbs", "fiber"]
        }
      }
    }
  });

  return JSON.parse(response.text);
};

export const getFoodAdvice = async (foodName: string, userProfile: any, dailyTotals: any) => {
  const model = "gemini-2.5-flash";
  const prompt = `The user wants to eat "${foodName}". 
  User Profile: ${JSON.stringify(userProfile)}
  Daily Totals so far: ${JSON.stringify(dailyTotals)}
  Analyze if this fits their goals. Suggest whether to "Eat", "Avoid", or "Limit". 
  Provide a brief reason and suggest 2 healthier alternatives if applicable.
  Return as JSON.`;

  const response = await ai.models.generateContent({
    model,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          recommendation: { type: Type.STRING, enum: ["Eat", "Avoid", "Limit"] },
          reason: { type: Type.STRING },
          alternatives: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
          }
        },
        required: ["recommendation", "reason", "alternatives"]
      }
    }
  });

  return JSON.parse(response.text);
};

export const getCoachResponse = async (history: any[], message: string, userProfile: any) => {
  const model = "gemini-2.5-flash";
  const systemInstruction = `You are NutriVision AI Coach. You help users with diet, meal suggestions, and fitness advice.
  User Profile: ${JSON.stringify(userProfile)}.
  Be encouraging, professional, and evidence-based.`;

  const chat = ai.chats.create({
    model,
    config: { systemInstruction }
  });

  // Convert history to Gemini format
  const contents = history.map(h => ({
    role: h.role === 'user' ? 'user' : 'model',
    parts: [{ text: h.text }]
  }));

  const response = await ai.models.generateContent({
    model,
    contents: [...contents, { role: 'user', parts: [{ text: message }] }],
    config: { systemInstruction }
  });

  return response.text;
};
