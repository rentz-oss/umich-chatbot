import fs from "node:fs/promises";
import path from "node:path";
import matter from "gray-matter";
import mammoth from "mammoth";
import { remark } from "remark";
import strip from "strip-markdown";
import { SourceDoc } from "./types";

const SUPPORTED_EXTENSIONS = [".md", ".markdown", ".txt", ".docx"];

async function walk(dirPath: string): Promise<string[]> {
  const entries = await fs.readdir(dirPath, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await walk(fullPath)));
      continue;
    }

    if (SUPPORTED_EXTENSIONS.some((ext) => entry.name.toLowerCase().endsWith(ext))) {
      files.push(fullPath);
    }
  }

  return files;
}

async function markdownToText(markdown: string): Promise<string> {
  const file = await remark().use(strip).process(markdown);
  return String(file).replace(/\n{3,}/g, "\n\n").trim();
}

async function readFileAsText(filePath: string): Promise<string> {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === ".docx") {
    const result = await mammoth.extractRawText({ path: filePath });
    return result.value.trim();
  }

  const raw = await fs.readFile(filePath, "utf8");
  if (ext === ".md" || ext === ".markdown") {
    const parsed = matter(raw);
    return markdownToText(parsed.content);
  }
  return raw.trim();
}

function toDocId(filePath: string): string {
  return filePath.replace(/[^\w]+/g, "_").toLowerCase();
}

export async function loadSourceDocs(sourceDir: string): Promise<SourceDoc[]> {
  const stat = await fs.stat(sourceDir).catch(() => null);
  if (!stat || !stat.isDirectory()) {
    throw new Error(`Knowledge directory not found: ${sourceDir}`);
  }

  const files = await walk(sourceDir);
  const docs: SourceDoc[] = [];

  for (const filePath of files) {
    const rawText = await readFileAsText(filePath);
    if (!rawText) continue;

    const fileName = path.basename(filePath);
    docs.push({
      id: toDocId(filePath),
      filePath,
      fileName,
      title: fileName.replace(path.extname(fileName), ""),
      rawText
    });
  }

  return docs;
}
