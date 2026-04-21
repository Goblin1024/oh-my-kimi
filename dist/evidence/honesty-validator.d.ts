/**
 * Honesty Validator
 *
 * Pattern-matches AI claims against submitted evidence.
 * If the AI claims X without evidence, the system detects and reports it.
 */
import type { Evidence, ValidationResult } from './schema.js';
export declare function validateClaim(claim: string, evidence: Evidence[]): ValidationResult;
//# sourceMappingURL=honesty-validator.d.ts.map