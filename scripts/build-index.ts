import fs from "node:fs/promises";
import path from "node:path";
import { chunkDocs } from "../src/lib/knowledge/chunk";
import { embedText, getEmbedModelName } from "../src/lib/knowledge/embed";
import { saveIndex } from "../src/lib/knowledge/index-file";
import { loadSourceDocs } from "../src/lib/knowledge/loaders";
import { EmbeddedChunk } from "../src/lib/knowledge/types";

function resolveKnowledgeDir(): string {
  if (process.env.KNOWLEDGE_DIR) {
    return path.resolve(process.cwd(), process.env.KNOWLEDGE_DIR);
  }

  const localDir = path.resolve(process.cwd(), "knowledge");
  return localDir;
}

async function ensureKnowledgeDir(dirPath: string): Promise<void> {
  const exists = await fs.stat(dirPath).catch(() => null);
  if (!exists) {
    await fs.mkdir(dirPath, { recursive: true });
  }
}

async function main() {
  const retrievalMode = process.env.RETRIEVAL_MODE || "keyword";
  const knowledgeDir = resolveKnowledgeDir();
  await ensureKnowledgeDir(knowledgeDir);

  const docs = await loadSourceDocs(knowledgeDir);
  if (docs.length === 0) {
    throw new Error(
      `No supported files found in ${knowledgeDir}. Add .md, .markdown, .txt, or .docx files.`
    );
  }

  const chunks = chunkDocs(docs);
  let indexChunks: EmbeddedChunk[] = chunks;
  let embeddingModel = "keyword-only";
  let dimensions = 0;

  if (retrievalMode === "embedding") {
    const embeddedChunks: EmbeddedChunk[] = [];
    for (const chunk of chunks) {
      const embedding = await embedText(chunk.text);
      embeddedChunks.push({ ...chunk, embedding });
    }
    indexChunks = embeddedChunks;
    embeddingModel = getEmbedModelName();
    dimensions = embeddedChunks[0]?.embedding?.length || 0;
  }

  await saveIndex({
    createdAt: new Date().toISOString(),
    embeddingModel,
    dimensions,
    chunks: indexChunks
  });

  console.log(`Indexed ${docs.length} documents and ${indexChunks.length} chunks.`);
  console.log(`Mode: ${retrievalMode}`);
  console.log("Saved index at data/knowledge-index.json");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
