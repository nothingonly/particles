import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize the Gemini API client
const API_KEY = process.env.GEMINI_API_KEY || "AIzaSyDIKk8LQYkJ8s0JFz1niTmk-j5wAKtzXds";
const genAI = new GoogleGenerativeAI(API_KEY);

const systemInstruction = `
You are the "Soul" of a particle system. 
Input: User speech text.
Output: JSON object only.

Rules for "Mood":
- "angry" -> hex: "#FF3333", speed: 2.0
- "happy" -> hex: "#FFD700", speed: 0.8
- "sad" -> hex: "#1133AA", speed: 0.2
- "love" -> hex: "#FF69B4", speed: 0.5
- "neutral" -> hex: "#88CCFF", speed: 1.0

Response Format:
{
  "reply": "Your conversational reply here",
  "mood": "angry|happy|sad|love|neutral",
  "hex": "#RRGGBB"
}
`;

export default async function handler(req, res) {
  // CORS setup
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { text } = req.body;
    if (!text) {
      return res.status(400).json({ error: 'Missing text in request body' });
    }

    const getResponse = async (modelName) => {
      const model = genAI.getGenerativeModel({ model: modelName });
      const prompt = `System Instructions: ${systemInstruction}\n\nAnalyze the sentiment of this user text: "${text}".\nReturn JSON ONLY.`;
      const result = await model.generateContent(prompt);
      let textResponse = result.response.text();
      return textResponse.replace(/```json|```/g, "").trim();
    };

    let textResponse;
    try {
      textResponse = await getResponse("gemini-2.5-flash"); // attempt newer if available
    } catch(e) {
      try {
        textResponse = await getResponse("gemini-2.0-flash");
      } catch(err) {
        textResponse = await getResponse("gemini-1.5-flash");
      }
    }
    
    const jsonResponse = JSON.parse(textResponse);
    return res.status(200).json(jsonResponse);
  } catch (error) {
    console.error("Critical Error handling request:", error);
    return res.status(500).json({ error: error.message });
  }
}
