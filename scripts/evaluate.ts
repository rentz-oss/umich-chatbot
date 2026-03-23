import fs from "node:fs/promises";
import path from "node:path";
import { searchKnowledge } from "../src/lib/knowledge/search";

type TestCase = {
  question: string;
  expectMatch: boolean;
};

const DEFAULT_TESTS: TestCase[] = [
  { question: "What foster youth financial aid support is available at UMich?", expectMatch: true },
  { question: "How do I apply to University of Michigan?", expectMatch: true },
  { question: "What is the weather forecast in Ann Arbor tomorrow?", expectMatch: false }
];

async function loadTests(): Promise<TestCase[]> {
  const testFile = path.resolve(process.cwd(), "data", "eval-questions.json");
  const exists = await fs.stat(testFile).catch(() => null);
  if (!exists) {
    return DEFAULT_TESTS;
  }

  const raw = await fs.readFile(testFile, "utf8");
  return JSON.parse(raw) as TestCase[];
}

async function main() {
  const tests = await loadTests();
  let passed = 0;

  for (const test of tests) {
    const results = await searchKnowledge(test.question, 1);
    const score = results[0]?.score || 0;
    const didMatch = score >= 0.2;
    const ok = didMatch === test.expectMatch;
    if (ok) passed += 1;

    console.log(
      `${ok ? "PASS" : "FAIL"} | score=${score.toFixed(3)} | expectMatch=${test.expectMatch} | ${test.question}`
    );
  }

  console.log(`\n${passed}/${tests.length} tests passed.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
