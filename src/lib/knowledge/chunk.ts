import { Chunk, SourceDoc } from "./types";

const TARGET_CHUNK_SIZE = 900;

function splitParagraphs(text: string): string[] {
  return text
    .split(/\n{2,}/)
    .map((part) => part.trim())
    .filter(Boolean);
}

function toChunkId(docId: string, index: number): string {
  return `${docId}_chunk_${index}`;
}

export function chunkDocs(docs: SourceDoc[]): Chunk[] {
  const chunks: Chunk[] = [];

  for (const doc of docs) {
    const paragraphs = splitParagraphs(doc.rawText);
    let chunkText = "";
    let chunkIndex = 0;

    for (const paragraph of paragraphs) {
      const next = chunkText ? `${chunkText}\n\n${paragraph}` : paragraph;
      if (next.length > TARGET_CHUNK_SIZE && chunkText) {
        chunks.push({
          id: toChunkId(doc.id, chunkIndex++),
          docId: doc.id,
          fileName: doc.fileName,
          section: `Section ${chunkIndex}`,
          text: chunkText
        });
        chunkText = paragraph;
      } else {
        chunkText = next;
      }
    }

    if (chunkText) {
      chunks.push({
        id: toChunkId(doc.id, chunkIndex++),
        docId: doc.id,
        fileName: doc.fileName,
        section: `Section ${chunkIndex}`,
        text: chunkText
      });
    }
  }

  return chunks;
}
