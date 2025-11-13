
type Span = {
    start: number;
    end: number;
  };
  
  type Annotation = {
    index: string;     // index as string
    span: Span;
  };
  
  type AlignmentAnnotation = {
    index: string;           // index as string
    span: Span;
    alignment_index: string[];  // one-to-one mapping
  };
  
  type AlignmentResult = {
    type: "alignment";
    target_annotation: Annotation[];
    alignment_annotation: AlignmentAnnotation[];
  };
  
  export function generateAlignment(a: string[], b: string[]): AlignmentResult {
    const target_annotation: Annotation[] = [];
    const alignment_annotation: AlignmentAnnotation[] = [];
  
    // --- Build target_annotation from a[] ---
    let aCursor = 0; // cumulative span
  
    a.forEach((text, i) => {
      const length = text.length;
      const start = aCursor;
      const end = aCursor + length;
  
      target_annotation.push({
        index: String(i),
        span: { start, end }
      });
  
      if (length > 0) {
        aCursor = end; // only advance when non-empty
      }
    });
  
    // --- Build alignment_annotation from b[] ---
    let bCursor = 0;
  
    b.forEach((text, i) => {
      const length = text.length;
      const start = bCursor;
      const end = bCursor + length;
  
      alignment_annotation.push({
        index: String(i),
        span: { start, end },
        alignment_index: [String(i)]  // strict 1-to-1 mapping
      });
  
      if (length > 0) {
        bCursor = end;
      }
    });
  
    return {
      type: "alignment",
      target_annotation,
      alignment_annotation
    };
  }

  /**
   * Reconstructs source and target segment arrays from annotations and content.
   * This is the inverse operation of generateAlignment.
   * 
   * @param target_annotation - Annotations with spans for source content
   * @param alignment_annotation - Annotations with spans for target content
   * @param sourceContent - Full source text content
   * @param targetContent - Full target text content
   * @returns Object containing source and target segment arrays
   */
  export function reconstructSegments(
    target_annotation: Annotation[],
    alignment_annotation: AlignmentAnnotation[],
    sourceContent: string,
    targetContent: string
  ): { source: string[]; target: string[] } {
    // Sort annotations by index to ensure correct order
    const sortedTargetAnnotations = [...target_annotation].sort((a, b) => 
      Number(a.index) - Number(b.index)
    );
    const sortedAlignmentAnnotations = [...alignment_annotation].sort((a, b) => 
      Number(a.index) - Number(b.index)
    );

    // Extract source segments from target_annotation spans
    const source: string[] = sortedTargetAnnotations.map(ann => {
      return sourceContent.substring(ann.span.start, ann.span.end);
    });

    // Extract target segments from alignment_annotation spans
    const target: string[] = sortedAlignmentAnnotations.map(ann => {
      return targetContent.substring(ann.span.start, ann.span.end);
    });

    return { source, target };
  }
  