import OpenAI from "openai";
import { z } from "zod";
import { SYSTEM_PROMPT, buildContext } from "@/lib/chat/prompt";
import { searchKnowledge } from "@/lib/knowledge/search";

const requestSchema = z.object({
  message: z.string().min(1)
});

const responseSchema = z.object({
  answer: z.string(),
  usedContext: z.boolean()
});

const MIN_SCORE = 0.2;
const CHAT_MODEL = process.env.OPENAI_CHAT_MODEL || "gpt-4o-mini";

function toPlainSummary(context: string): string {
  // Keep a concise local-only response by trimming long context blocks.
  const maxChars = 1100;
  if (context.length <= maxChars) return context;
  return `${context.slice(0, maxChars)}\n\n[Content shortened for readability.]`;
}

function buildFallbackAnswer(
  message: string,
  matches: Array<{ text: string }>
): string {
  const snippets = matches
    .map((m) => m.text.trim())
    .filter(Boolean)
    .slice(0, 2)
    .map((text) => toPlainSummary(text))
    .join("\n\n");

  return [
    `Based on the UMich files, here is the best available answer to "${message}":`,
    "",
    snippets || "I do not know from the current UMich files I have.",
    "",
    "If you want, I can help with a more specific follow-up question."
  ].join("\n");
}

function getClient(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY is not set.");
  return new OpenAI({ apiKey });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { message } = requestSchema.parse(body);

    const matches = await searchKnowledge(message, 4);
    const hasEvidence = matches.length > 0 && matches[0].score >= MIN_SCORE;
    if (!hasEvidence) {
      return Response.json({
        answer:
          "I do not know from the current UMich files I have. Please contact a University of Michigan advisor or support office for help with this question.",
        sources: [],
        confidence: "low"
      });
    }

    const context = buildContext(matches);
    const retrievalMode = process.env.RETRIEVAL_MODE || "keyword";
    let answer = buildFallbackAnswer(message, matches);

    if (retrievalMode === "embedding") {
      const client = getClient();
      const completion = await client.chat.completions.create({
        model: CHAT_MODEL,
        temperature: 0.1,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          {
            role: "user",
            content: `Question:\n${message}\n\nContext:\n${context}`
          }
        ]
      });

      const raw = completion.choices[0]?.message?.content || "{}";
      const parsed = responseSchema.safeParse(JSON.parse(raw));
      if (parsed.success && parsed.data.usedContext) {
        answer = parsed.data.answer;
      }
    }

    return Response.json({
      answer,
      confidence: matches[0].score > 0.5 ? "high" : "medium",
      sources: matches.map((m) => ({
        fileName: m.fileName,
        section: m.section,
        score: Number(m.score.toFixed(3))
      }))
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error";
    return Response.json({ error: message }, { status: 400 });
  }
}
