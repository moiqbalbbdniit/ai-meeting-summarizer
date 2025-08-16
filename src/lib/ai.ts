// lib/ai.ts
import { z } from "zod";

const hasGroq = !!process.env.GROQ_API_KEY;
const hasOpenAI = !!process.env.OPENAI_API_KEY;

export const summarizeSchema = z.object({
  transcript: z.string().min(1, "Transcript is required"),
  prompt: z
    .string()
    .default("Summarize in concise bullet points. Include action items and owners if present.")
});

export async function summarizeWithLLM({
  transcript,
  prompt
}: z.infer<typeof summarizeSchema>) {
  if (hasGroq) return summarizeWithGroq(transcript, prompt);
  if (hasOpenAI) return summarizeWithOpenAI(transcript, prompt);
  throw new Error("No AI provider configured. Set GROQ_API_KEY or OPENAI_API_KEY.");
}

async function summarizeWithGroq(transcript: string, prompt: string) {
  const resp = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      // strong, general-purpose model; change if you prefer another Groq model
      model: "compound-beta-mini",
      temperature: 0.2,
      messages: [
        {
          role: "system",
          content:
            "You are an assistant that produces compact, well-structured meeting summaries. " +
            "Respect the user's custom instruction. Prefer bullet lists, headers, and clear action items."
        },
        {
          role: "user",
          content:
            `Instruction: ${prompt}\n\n` +
            `Transcript:\n${transcript}\n\n` +
            `Output: Return a clean, structured summary in Markdown. Include sections if helpful (Overview, Key Points, Action Items, Decisions, Risks).`
        }
      ]
    })
  });

  if (!resp.ok) {
    const text = await resp.text().catch(() => "");
    throw new Error(`Groq error (${resp.status}): ${text}`);
  }
  const data = await resp.json();
  return data.choices?.[0]?.message?.content?.trim() ?? "";
}

async function summarizeWithOpenAI(transcript: string, prompt: string) {
  const resp = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      temperature: 0.2,
      messages: [
        { role: "system", content: "You produce compact, well-structured meeting summaries." },
        {
          role: "user",
          content:
            `Instruction: ${prompt}\n\nTranscript:\n${transcript}\n\nReturn Markdown with sections (Overview, Key Points, Action Items, Decisions, Risks).`
        }
      ]
    })
  });

  if (!resp.ok) {
    const text = await resp.text().catch(() => "");
    throw new Error(`OpenAI error (${resp.status}): ${text}`);
  }
  const data = await resp.json();
  return data.choices?.[0]?.message?.content?.trim() ?? "";
}
