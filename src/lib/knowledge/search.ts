import { loadIndex } from "./index-file";
import { embedText } from "./embed";
import { EmbeddedChunk } from "./types";

type ScoredChunk = EmbeddedChunk & { score: number };

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((token) => token.length > 2);
}

function unique(tokens: string[]): Set<string> {
  return new Set(tokens);
}

function keywordScore(query: string, chunkText: string): number {
  const q = unique(tokenize(query));
  const c = unique(tokenize(chunkText));
  if (q.size === 0 || c.size === 0) return 0;

  let overlap = 0;
  for (const token of q) {
    if (c.has(token)) overlap += 1;
  }

  // Score from 0 to 1 based on query token coverage.
  return overlap / q.size;
}

export async function searchKnowledge(query: string, limit = 4): Promise<ScoredChunk[]> {
  const index = await loadIndex();
  const retrievalMode = process.env.RETRIEVAL_MODE || "keyword";

  if (retrievalMode === "embedding" && index.dimensions > 0) {
    const queryEmbedding = await embedText(query);
    const scored = index.chunks
      .filter((chunk) => Array.isArray(chunk.embedding) && chunk.embedding.length > 0)
      .map((chunk) => ({
        ...chunk,
        score: cosineSimilarity(queryEmbedding, chunk.embedding as number[])
      }))
      .filter((chunk) => chunk.score > 0)
      .sort((a, b) => b.score - a.score);

    return scored.slice(0, limit);
  }

  const scored = index.chunks
    .map((chunk) => ({ ...chunk, score: keywordScore(query, chunk.text) }))
    .filter((chunk) => chunk.score > 0)
    .sort((a, b) => b.score - a.score);

  return scored.slice(0, limit);
}

function dot(a: number[], b: number[]): number {
  let sum = 0;
  for (let i = 0; i < a.length; i += 1) sum += (a[i] || 0) * (b[i] || 0);
  return sum;
}

function magnitude(v: number[]): number {
  return Math.sqrt(dot(v, v));
}

function cosineSimilarity(a: number[], b: number[]): number {
  const denom = magnitude(a) * magnitude(b);
  if (!denom) return 0;
  return dot(a, b) / denom;
}
