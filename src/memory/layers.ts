/**
 * MemPalace-inspired 4-layer memory stack interfaces.
 *
 * L0 — Identity:        who the user is, their preferences, role, constraints (~100 tokens)
 * L1 — Essential Story: auto-generated from accumulated evidence (~500–800 tokens)
 * L2 — On-Demand:       fetched by topic / skill match (~200–500 tokens)
 * L3 — Deep Search:     full BM25 / vector search over the entire corpus (unlimited)
 */

export interface MemoryLayer {
  /** Human-readable label for the layer */
  readonly label: string;

  /** Approximate token budget for this layer */
  readonly tokenBudget: number;

  /** Current estimated token count, or null if not yet computed */
  tokenCount: number | null;
}

/** L0 — Identity
 *
 * Static user identity: role, preferences, constraints.
 * Typically loaded from a plain-text file edited by the user.
 */
export interface Layer0Identity extends MemoryLayer {
  readonly label: 'Identity';
  readonly tokenBudget: 100;

  /** Raw identity text (e.g. content of ~/.omk/identity.txt) */
  text: string;

  /** Whether the text was sourced from a user-created file */
  userDefined: boolean;
}

/** L1 — Essential Story
 *
 * Auto-generated narrative built from observed evidence across sessions.
 */
export interface Layer1EssentialStory extends MemoryLayer {
  readonly label: 'Essential Story';
  readonly tokenBudget: 650;

  /** Markdown or plain-text narrative */
  story: string;

  /** Evidence items that contributed to the current story */
  evidenceIds: string[];
}

/** L2 — On-Demand
 *
 * Relevant snippets retrieved at query time by topic or skill matching.
 */
export interface Layer2OnDemand extends MemoryLayer {
  readonly label: 'On-Demand';
  readonly tokenBudget: 350;

  /** Snippets selected for the current context window */
  snippets: string[];

  /** Topics / skills that triggered retrieval */
  matchedTopics: string[];
}

/** L3 — Deep Search
 *
 * Full-corpus retrieval via BM25, vector search, or hybrid ranking.
 */
export interface Layer3DeepSearch extends MemoryLayer {
  readonly label: 'Deep Search';
  readonly tokenBudget: number;

  /** Search results for the current query */
  results: SearchResult[];

  /** Query string that produced these results */
  query: string;
}

export interface SearchResult {
  /** Unique identifier for the document / chunk */
  id: string;

  /** Relevance score (higher = more relevant) */
  score: number;

  /** Source path or URI */
  source: string;

  /** Matching text snippet */
  text: string;
}

/** Convenience union of all memory layers */
export type MemoryLayerStack =
  | Layer0Identity
  | Layer1EssentialStory
  | Layer2OnDemand
  | Layer3DeepSearch;
