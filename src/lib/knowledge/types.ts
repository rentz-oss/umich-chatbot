export type SourceDoc = {
  id: string;
  filePath: string;
  fileName: string;
  title: string;
  rawText: string;
};

export type Chunk = {
  id: string;
  docId: string;
  fileName: string;
  section: string;
  text: string;
};

export type EmbeddedChunk = Chunk & {
  embedding?: number[];
};

export type KnowledgeIndex = {
  createdAt: string;
  embeddingModel: string;
  dimensions: number;
  chunks: EmbeddedChunk[];
};
