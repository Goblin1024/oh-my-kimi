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
export declare function searchBM25(documents: Document[], query: string, topK?: number): BM25Result[];
//# sourceMappingURL=bm25.d.ts.map