/**
 * Transcript pipeline often exceeds 5 minutes. Railway public HTTP limit ~15m;
 * stay slightly under for the non-streaming axios fallback.
 */
export const TRANSCRIPT_EVAL_TIMEOUT_MS = 14 * 60 * 1000
