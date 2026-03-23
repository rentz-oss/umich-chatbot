import fs from "node:fs/promises";
import path from "node:path";
import { KnowledgeIndex } from "./types";

const INDEX_PATH = path.join(process.cwd(), "data", "knowledge-index.json");

export function getIndexPath(): string {
  return INDEX_PATH;
}

export async function saveIndex(index: KnowledgeIndex): Promise<void> {
  await fs.mkdir(path.dirname(INDEX_PATH), { recursive: true });
  await fs.writeFile(INDEX_PATH, JSON.stringify(index, null, 2), "utf8");
}

export async function loadIndex(): Promise<KnowledgeIndex> {
  const raw = await fs.readFile(INDEX_PATH, "utf8");
  return JSON.parse(raw) as KnowledgeIndex;
}
