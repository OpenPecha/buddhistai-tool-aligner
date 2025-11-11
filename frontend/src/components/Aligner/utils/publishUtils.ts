import type { SentenceMapping } from '../context/types';

export interface PublishData {
  language: string;
  content: string;
  title: string;
  author: {
    person_bdrc_id: string;
  };
  category_id: string;
  segmentation: Array<{
    span: {
      start: number;
      end: number;
    };
  }>;
  target_annotation: Array<{
    span: {
      start: number;
      end: number;
    };
    index: number;
  }>;
  alignment_annotation: Array<{
    span: {
      start: number;
      end: number;
    };
    index: number;
    alignment_index: number[];
  }>;
  copyright: string;
}

export interface PublishMetadata {
  title: string;
  language: string;
  author: {
    person_bdrc_id: string;
  };
  category_id: string;
  copyright: string;
}

/**
 * Transform SentenceMapping[] to API format for publishing
 * @param mappings - Array of sentence mappings from the editor
 * @param targetContent - The target text content
 * @param metadata - Publication metadata (title, author, etc.)
 * @returns Transformed data ready for API submission
 */
export const transformMappingsToAPI = (
  mappings: SentenceMapping[],
  targetContent: string,
  metadata: PublishMetadata
): PublishData => {
  // Filter out empty mappings (where start is -1 or end is -1)
  const validMappings = mappings.filter(
    m => m.source.start !== -1 && m.source.end !== -1 && 
         m.target.start !== -1 && m.target.end !== -1
  );

  // Create segmentation array (same as alignment_annotation but without index/alignment_index)
  const segmentation = validMappings.map(mapping => ({
    span: {
      start: mapping.target.start,
      end: mapping.target.end
    }
  }));

  // Create target_annotation array (source spans with index)
  const target_annotation = validMappings.map((mapping, index) => ({
    span: {
      start: mapping.source.start,
      end: mapping.source.end
    },
    index
  }));

  // Create alignment_annotation array (target spans with index and alignment_index)
  const alignment_annotation = validMappings.map((mapping, index) => ({
    span: {
      start: mapping.target.start,
      end: mapping.target.end
    },
    index,
    alignment_index: [index]
  }));

  return {
    language: metadata.language,
    content: targetContent,
    title: metadata.title,
    author: metadata.author,
    category_id: metadata.category_id,
    segmentation,
    target_annotation,
    alignment_annotation,
    copyright: metadata.copyright
  };
};

/**
 * Validate mappings and content before publishing
 * @param mappings - Array of sentence mappings
 * @param sourceContent - Source text content
 * @param targetContent - Target text content
 * @returns Validation result with error message if invalid
 */
export const validatePublishData = (
  mappings: SentenceMapping[],
  sourceContent: string | null,
  targetContent: string | null
): { isValid: boolean; error?: string } => {
  if (!sourceContent || sourceContent.trim().length === 0) {
    return { isValid: false, error: 'Source content is required' };
  }

  if (!targetContent || targetContent.trim().length === 0) {
    return { isValid: false, error: 'Target content is required' };
  }

  if (!mappings || mappings.length === 0) {
    return { isValid: false, error: 'At least one mapping is required' };
  }

  // Check if there are any valid mappings (non-empty)
  const validMappings = mappings.filter(
    m => m.source.start !== -1 && m.source.end !== -1 && 
         m.target.start !== -1 && m.target.end !== -1
  );

  if (validMappings.length === 0) {
    return { isValid: false, error: 'At least one valid mapping is required' };
  }

  return { isValid: true };
};

/**
 * Get summary statistics for mappings
 * @param mappings - Array of sentence mappings
 * @returns Summary statistics
 */
export const getMappingsSummary = (mappings: SentenceMapping[]) => {
  const validMappings = mappings.filter(
    m => m.source.start !== -1 && m.source.end !== -1 && 
         m.target.start !== -1 && m.target.end !== -1
  );

  const emptySourceMappings = mappings.filter(m => m.source.start === -1).length;
  const emptyTargetMappings = mappings.filter(m => m.target.start === -1).length;

  return {
    totalMappings: mappings.length,
    validMappings: validMappings.length,
    emptySourceMappings,
    emptyTargetMappings
  };
};
