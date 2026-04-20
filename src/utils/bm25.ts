/**
 * Lightweight BM25 implementation for memory search
 */

export interface Document {
  id: string;
  content: string;
}

export interface BM25Result {
  id: string;
  score: number;
}

const k1 = 1.2;
const b = 0.75;

/** Tokenize text into lowercase words */
function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[\W_]+/)
    .filter((t) => t.length > 0);
}

export function searchBM25(documents: Document[], query: string, topK = 5): BM25Result[] {
  if (!documents.length) return [];

  const queryTokens = tokenize(query);
  if (!queryTokens.length) return [];

  const docTokens = documents.map((doc) => tokenize(doc.content));
  const N = documents.length;

  // Calculate avgdl
  const sumDl = docTokens.reduce((sum, tokens) => sum + tokens.length, 0);
  const avgdl = sumDl / N;

  // Calculate document frequencies
  const df: Record<string, number> = {};
  for (const tokens of docTokens) {
    const uniqueTokens = new Set(tokens);
    for (const token of uniqueTokens) {
      df[token] = (df[token] || 0) + 1;
    }
  }

  // Compute IDF
  const idf: Record<string, number> = {};
  for (const token of queryTokens) {
    const n = df[token] || 0;
    // Standard BM25 IDF formula with +0.5 to prevent negative scores
    idf[token] = Math.log((N - n + 0.5) / (n + 0.5) + 1);
  }

  // Calculate scores
  const results: BM25Result[] = [];
  for (let i = 0; i < N; i++) {
    const tokens = docTokens[i];
    const dl = tokens.length;
    let score = 0;

    // Term frequencies for this doc
    const tf: Record<string, number> = {};
    for (const token of tokens) {
      tf[token] = (tf[token] || 0) + 1;
    }

    for (const token of queryTokens) {
      if (tf[token]) {
        const freq = tf[token];
        const num = freq * (k1 + 1);
        const den = freq + k1 * (1 - b + b * (dl / avgdl));
        score += idf[token] * (num / den);
      }
    }

    if (score > 0) {
      results.push({ id: documents[i].id, score });
    }
  }

  // Sort by descending score and take top K
  return results.sort((a, x) => x.score - a.score).slice(0, topK);
}
