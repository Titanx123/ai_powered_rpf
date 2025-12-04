const Groq = require('groq-sdk');
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

function extractJson(text) {
  if (!text) return '{}';
  return text
    .replace(/```/)
    .replace(/```/g, '')
    .trim();
}

class AIService {
  static async createRFPFromText(text) {
    const prompt = `
You are a procurement assistant.
Convert this procurement request into structured JSON.

Input:
${text}

Respond with ONLY valid JSON.
Do NOT include backticks, code fences, or any explanation.
The JSON must match exactly this shape:
{
  "title": "string",
  "description": "string",
  "budget": number,
  "currency": "USD",
  "deliveryDays": number,
  "paymentTerms": "string",
  "warrantyMonths": number,
  "items": [
    {
      "category": "string",
      "description": "string",
      "quantity": number,
      "specs": {}
    }
  ]
}
`;

    const response = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.1
    });

    // NEW: log once to see real structure
    console.log('Groq response:', JSON.stringify(response, null, 2));

    const choice = response.choices && response.choices[0];
    const message = choice && (choice.message || choice.delta);

    if (!message || !message.content) {
      throw new Error('No content returned from Groq');
    }

    const raw = Array.isArray(message.content)
      ? message.content.map(p => (typeof p === 'string' ? p : p.text || '')).join('')
      : message.content;

    const cleaned = extractJson(raw);
    return JSON.parse(cleaned);
  }
}

module.exports = AIService;
