import OpenAI from "openai";

const EMBED_MODEL = process.env.OPENAI_EMBED_MODEL || "text-embedding-3-small";

function getClient(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not set.");
  }
  return new OpenAI({ apiKey });
}

export async function embedText(text: string): Promise<number[]> {
  const client = getClient();
  const response = await client.embeddings.create({
    model: EMBED_MODEL,
    input: text
  });
  return response.data[0]?.embedding || [];
}

export function getEmbedModelName(): string {
  return EMBED_MODEL;
}
