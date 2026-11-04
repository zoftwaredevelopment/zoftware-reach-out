import type { Company, Contact, MessageStage } from "@/lib/types";

export function buildMessagePrompt(
  company: Company,
  contact: Contact | null,
  stage: MessageStage,
  conversationHistory?: string,
): string {
  const contactName = contact?.name || "there";
  const contactRole = contact?.role || "decision-maker";
  const industry = company.industry || "business";

  const stageContext = {
    initial: "This is the first outreach. Introduce Zoftware Development and ask about their website or online store needs.",
    follow_up_1: "Follow-up message sent 1 week (7 days) after initial outreach. Remind them of the value proposition.",
    follow_up_2: "Follow-up message sent 1 week (7 days) after first follow-up. Add a specific pain point relevant to their industry. Do NOT invent case studies or claim/imply Zoftware Development has worked with specific companies.",
    follow_up_3: "Final follow-up after 1 week. Keep it brief and professional.",
    breakup: "Breakup message after no response. Politely close the conversation and leave the door open.",
    re_engagement: "Re-engagement message after 2+ weeks of silence. Reference a new service or insight.",
  };

  const historySection = conversationHistory
    ? `\nPrevious conversation:\nThe lead replied: "${conversationHistory}"\nUse their actual response to craft a relevant, personalized reply. Do not ignore what they said.\n`
    : "";

  return `Generate a WhatsApp message for ${contactName} (${contactRole}) at ${company.name}, a ${industry} business in ${company.city || "Ottawa"}.

Stage: ${stage}
Context: ${stageContext[stage]}
${historySection}Requirements:
- Keep it under 280 characters
- Friendly, professional tone
- Reference their industry (${industry})
- Mention Zoftware Development — always say "Zoftware Development", NEVER "Zoftware Development Resourcing"
- Introduce yourself as "Mishael" from Zoftware Development within the message body — do NOT add a "-Mishael" signature at the end
- Greet with a friendly, natural opening — never use gendered salutations
- Include a clear call-to-action (e.g. a free 20-minute scoping call or a homepage concept)
- Avoid generic phrases like "I hope this message finds you well"
- Do NOT invent unverified claims — only reference what you actually know
- Do NOT use phrases like "cleaning businesses like [X]" or "[industry] businesses like [X]" that imply we've worked in their industry — say "Ottawa businesses like [X]" instead
- Write company names exactly as they appear — do NOT capitalize, title-case, or ALL CAPS them for emphasis — keep it natural
- Do NOT use phone number templates — keep it natural and conversational
- Use Canadian English conventions

Return JSON: { "content": "message text", "variant": "A" }`;
}

export function buildEmailPrompt(company: Company, contact: Contact | null): string {
  const contactName = contact?.name || "there";
  const industry = company.industry || "business";

  return `Write an initial outreach email to ${contactName} at ${company.name}, a ${industry} business in ${company.city || "Ottawa"}.

Requirements:
- Subject: clear, natural, under 70 characters, with no clickbait or false urgency
- Body: 80–120 words of plain text, friendly and professional
- Greet naturally and introduce Mishael from Zoftware Development
- Ask about their current website or online store needs and include a clear, low-pressure call-to-action
- Reference their industry without claiming Zoftware Development has clients in that industry
- Do not invent growth, vacancies, case studies, or other facts about the company
- Write the company name exactly as supplied, without adding emphasis or changing its capitalization
- Use Canadian English conventions
- End with a simple sign-off, then "Mishael" on one line and "Zoftware Development" on the next line

Return JSON: { "subject": "email subject", "body": "plain text email body" }`;
}