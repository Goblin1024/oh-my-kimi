import { type CatalogManifest, type CatalogCounts } from './schema.js';
export declare function readCatalogManifest(packageRoot?: string): CatalogManifest;
export declare function tryReadCatalogManifest(packageRoot?: string): CatalogManifest | null;
export declare function getCatalogCounts(packageRoot?: string): CatalogCounts;
export interface PublicCatalogContract {
    generatedAt: string;
    version: string;
    counts: CatalogCounts;
    coreSkills: string[];
    skills: CatalogManifest['skills'];
    agents: CatalogManifest['agents'];
    aliases: Array<{
        name: string;
        canonical: string;
    }>;
    internalHidden: string[];
}
export declare function toPublicCatalogContract(manifest: CatalogManifest): PublicCatalogContract;
//# sourceMappingURL=reader.d.ts.map