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
  // NEW: parse vendor proposal email
  static async parseVendorProposal(body, subject) {
    const prompt = `
You are a procurement assistant.

Extract a structured commercial proposal from this vendor email.

Subject:
${subject}

Body:
${body}

Respond with ONLY valid JSON, no backticks or explanations.
Use this shape:
{
  "items": [
    {
      "description": "string",
      "quantity": number,
      "unitPrice": number,
      "totalPrice": number
    }
  ],
  "total": number,
  "currency": "string",
  "deliveryDays": number,
  "warrantyMonths": number,
  "paymentTerms": "string",
  "completenessScore": number
}
`;

    const response = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.1
    });

    const choice = response.choices && response.choices[0];
    const message = choice && (choice.message || choice.delta);
    if (!message || !message.content) throw new Error('No content returned from Groq');

    const raw = Array.isArray(message.content)
      ? message.content.map(p => (typeof p === 'string' ? p : p.text || '')).join('')
      : message.content;

    const cleaned = extractJson(raw);
    return JSON.parse(cleaned);
  }
 static async compareProposals(rfp, proposals) {
  const prompt = `
You are a procurement advisor.

RFP:
Budget ${rfp.budget} ${rfp.currency}, max delivery ${rfp.deliveryDays} days,
min warranty ${rfp.warrantyMonths} months, payment terms ${rfp.paymentTerms}.

Vendor proposals:
${proposals.map((p, i) => `
Vendor ${i+1} (${p.vendorName}):
  Total: ${p.proposal.total} ${p.proposal.currency}
  Delivery: ${p.proposal.deliveryDays} days
  Warranty: ${p.proposal.warrantyMonths} months
  Terms: ${p.proposal.paymentTerms}
  Completeness: ${p.proposal.completenessScore}
`).join('\n')}

Score each vendor 0-10 on price, delivery, warranty, terms, completeness.
Then recommend the best vendor and explain why.

Respond with ONLY JSON (no backticks), in this shape:
{
  "scores": [
    {
      "vendorName": "string",
      "priceScore": number,
      "deliveryScore": number,
      "warrantyScore": number,
      "termsScore": number,
      "completenessScore": number,
      "totalScore": number
    }
  ],
  "recommendation": {
    "vendorName": "string",
    "reason": "string"
  }
}
`;

  const response = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.2
  });

  console.log("Groq compare response:", JSON.stringify(response, null, 2));

  const choice = response.choices && response.choices[0];
  const message = choice && (choice.message || choice.delta);
  if (!message || !message.content) {
    throw new Error("No content returned from Groq in compareProposals");
  }

  const raw = Array.isArray(message.content)
    ? message.content.map(p => (typeof p === "string" ? p : p.text || "")).join("")
    : message.content;

  const cleaned = extractJson(raw);
  console.log("Cleaned compare JSON:", cleaned);

  return JSON.parse(cleaned);
}


}

module.exports = AIService;
