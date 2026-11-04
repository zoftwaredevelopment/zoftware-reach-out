const GROQ_MODEL = "openai/gpt-oss-120b";

export interface GeneratedMessage {
  content: string;
  variant: string;
}

export interface GroqCallResult {
  message: GeneratedMessage;
  usage: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number };
}

/**
 * Server-only call to the Groq API free tier (OpenAI-compatible chat
 * completions). Generates personalized WhatsApp outreach messages.
 */
export async function generateMessage(prompt: string): Promise<GroqCallResult> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error("GROQ_API_KEY not configured");
  }

  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      messages: [
        {
          role: "system",
          content:
            "You are a web-development consultant at Zoftware Development. Generate personalized WhatsApp outreach messages for Ottawa small-business decision-makers. Always refer to the company as \"Zoftware Development\" — never \"Zoftware Development Resourcing\". Keep messages concise (under 280 characters), friendly, and focused on websites and online stores that win customers. Never use phrases like \"cleaning businesses like [X]\" or \"[industry] businesses like [X]\" that imply Zoftware Development has worked in their industry — say \"Ottawa businesses like [X]\" instead. Return JSON with 'content' and 'variant' fields.",
        },
        { role: "user", content: prompt },
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Groq API returned ${res.status}: ${text}`);
  }

  const data = await res.json();
  const content = data?.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error("Groq API returned no content");
  }

  const message = JSON.parse(content) as GeneratedMessage;
  return { message, usage: data.usage ?? {} };
}

export interface GeneratedEmail {
  subject: string;
  body: string;
}

export interface GroqEmailCallResult {
  email: GeneratedEmail;
  usage: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number };
}

export async function generateEmail(prompt: string): Promise<GroqEmailCallResult> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error("GROQ_API_KEY not configured");

  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: GROQ_MODEL,
      messages: [
        {
          role: "system",
          content: "You are a web-development consultant at Zoftware Development writing concise, personalized cold emails to Ottawa small-business decision-makers. Always call the company Zoftware Development. Do not invent client relationships, case studies, or company facts. Return JSON with subject and body fields; the body must be plain text.",
        },
        { role: "user", content: prompt },
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Groq API returned ${res.status}: ${text}`);
  }

  const data = await res.json();
  const content = data?.choices?.[0]?.message?.content;
  if (!content) throw new Error("Groq API returned no content");
  const parsed = JSON.parse(content);
  if (typeof parsed.subject !== "string" || typeof parsed.body !== "string" || !parsed.subject.trim() || !parsed.body.trim()) {
    throw new Error("Groq returned an invalid email draft");
  }

  return {
    email: { subject: parsed.subject.trim(), body: parsed.body.trim() },
    usage: data.usage ?? {},
  };
}

export { GROQ_MODEL };