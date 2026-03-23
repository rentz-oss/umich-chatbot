# UMich Files-Only Chatbot

This is a strict files-only chatbot pilot for University of Michigan guidance.
It answers from local `.md`, `.txt`, and `.docx` files only.
Default mode is keyword retrieval (free, no OpenAI billing required), with optional OpenAI embedding mode.

## 1) Setup

1. Install Node.js 20+ on your machine.
2. In this folder, run:

```bash
npm install
```

3. Copy environment template:

```bash
cp .env.example .env.local
```

4. For keyword mode, no API key is required.

## 2) Add your knowledge files

- Put files in `knowledge/` (or set `KNOWLEDGE_DIR` in `.env.local`).
- Supported extensions: `.md`, `.markdown`, `.txt`, `.docx`
- If your files are one folder up (current workspace root), set:

```bash
KNOWLEDGE_DIR=..
```

## 3) Build the knowledge index

```bash
npm run index
```

This creates `data/knowledge-index.json`.

## 4) Run the app

```bash
npm run dev
```

Then open `http://localhost:3000`.

## 5) Validate behavior

```bash
npm run eval
```

This runs a small set of retrieval checks to confirm in-scope questions match and out-of-scope questions defer.

## Enable OpenAI embedding mode

1. In `.env.local`, set:

```env
RETRIEVAL_MODE=embedding
OPENAI_API_KEY=your_key
OPENAI_CHAT_MODEL=gpt-4o-mini
OPENAI_EMBED_MODEL=text-embedding-3-small
```

2. Rebuild index:

```bash
npm run index
```

3. Run app:

```bash
npm run dev
```
