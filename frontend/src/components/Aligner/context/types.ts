/**
 * Represents a mapping between a sentence in the source text and target text
 * 
 * Note: Positions are start-inclusive and end-exclusive
 * - start: index of the first character (inclusive)
 * - end: index after the last character (exclusive)
 * 
 * Example: For "Hello" at position 0-5:
 * - start: 0 (points to 'H')
 * - end: 5 (points AFTER 'o')
 * - text.substring(0, 5) returns "Hello"
 */
export interface SentenceMapping {
  source: { start: number; end: number ,index:string};
  target: { start: number; end: number ,alignment_index:string[]};
}

