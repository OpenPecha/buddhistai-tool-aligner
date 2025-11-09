export function getAnnotation (text: string){
    const segments = [];
    let pos = 0;
    const lines = text.split('\n');
    for (const line of lines) {
        const start = pos;
        const end = pos + line.length;
        segments.push({
            start,
            end,
            text: line
        });
        // Account for newline character not included in line
        pos = end + 1;
    }
    return segments;
}

/**
 * Apply segmentation annotations to text content
 * @param text - Original text content
 * @param segmentations - Array of segmentation annotations with span information
 * @returns Segmented text with separators between segments
 */
export function applySegmentation(text: string, segmentations: Array<{span: {start: number, end: number}}>): string {
    if (!segmentations || segmentations.length === 0) {
        return text;
    }

    // Sort segmentations by start position
    const sortedSegmentations = [...segmentations].sort((a, b) => a.span.start - b.span.start);

    // Build the result by inserting newlines at segment boundaries
    let result = '';
    let lastEnd = 0;

    for (let i = 0; i < sortedSegmentations.length; i++) {
        const seg = sortedSegmentations[i];
        
        // Add text from lastEnd to the start of this segment
        result += text.substring(lastEnd, seg.span.start);
        
        // Add newline BEFORE the segment (but not for the first segment, unless it's at position 0)
        if (i > 0 || seg.span.start > 0) {
            result += '\n';
        }
        
        // Add the segment itself
        result += text.substring(seg.span.start, seg.span.end);
        
        lastEnd = seg.span.end;
    }

    // Add any remaining text after the last segment
    if (lastEnd < text.length) {
        result += text.substring(lastEnd);
    }

    return result;
}

/**
 * Generate segmentation annotations from text file content using newlines as segment boundaries
 * @param text - Raw text content from uploaded file
 * @returns Array of segmentation annotations based on line breaks
 */
export function generateFileSegmentation(text: string): Array<{span: {start: number, end: number}}> {
    const segments = [];
    let pos = 0;
    const lines = text.split('\n');
    
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        // Skip empty lines but still account for their position
        if (line.trim().length > 0) {
            segments.push({
                span: {
                    start: pos,
                    end: pos + line.length
                }
            });
        }
        // Move position past the line and newline character
        pos += line.length + 1; // +1 for the newline character
    }
    
    return segments;
}