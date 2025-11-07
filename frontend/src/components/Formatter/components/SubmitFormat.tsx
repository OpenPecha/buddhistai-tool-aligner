import type { SegmentAnnotation, TOCEntry } from '../types'

type submitFormatProps = {
   readonly segmentAnnotations: SegmentAnnotation[],
}

function SubmitFormat({segmentAnnotations}: submitFormatProps) {
  const handleSubmitFormat = () => {
    // Generate TOC from segment annotations
    const generateTOC = (): TOCEntry[] => {
      // Filter segments that have titles
      const titledSegments = segmentAnnotations.filter(segment => segment.title);
      
      if (titledSegments.length === 0) {
        console.log([]);
        return [];
      }
      
      // Group segments by title, maintaining order and checking for consecutiveness
      const tocEntries: TOCEntry[] = [];
      let currentTitle = '';
      let currentSegments: SegmentAnnotation[] = [];
      
      // Sort segments by their start position to ensure proper order
      const sortedSegments = [...titledSegments].sort((a, b) => a.start - b.start);
      
      for (let i = 0; i < sortedSegments.length; i++) {
        const segment = sortedSegments[i];
        const nextSegment = sortedSegments[i + 1];
        
        if (segment.title === currentTitle) {
          // Check if this segment is consecutive with the previous one
          const lastSegment = currentSegments.at(-1);
          const isConsecutive = lastSegment && lastSegment.end === segment.start;
          
          if (isConsecutive) {
            // Add to current group
            currentSegments.push(segment);
          } else {
            // Break the group - save current and start new
            tocEntries.push({
              title: currentTitle,
              segmentation: [...currentSegments]
            });
            currentSegments = [segment];
          }
        } else {
          // Save previous group if it exists
          if (currentTitle && currentSegments.length > 0) {
            tocEntries.push({
              title: currentTitle,
              segmentation: [...currentSegments]
            });
          }
          
          // Start new group
          currentTitle = segment.title!;
          currentSegments = [segment];
        }
        
        // Handle last segment or when title changes for next segment
        if (i === sortedSegments.length - 1 || 
            (nextSegment && nextSegment.title !== currentTitle)) {
          tocEntries.push({
            title: currentTitle,
            segmentation: [...currentSegments]
          });
          currentSegments = [];
        }
      }
      
      return tocEntries;
    };
    
    const result = generateTOC();
    console.log('Generated TOC:', result);
    
    // Also log in the legacy format for compatibility
    const legacyFormat = result.map(entry => ({
      title: entry.title,
      segments: entry.segmentation
    }));
    console.log('Legacy format:', legacyFormat);
  }

  return (
    <button
      onClick={handleSubmitFormat}
      className="px-4 py-2 w-full bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors duration-200 text-sm font-medium"
    >
      Publish
    </button>
  )
}


export default SubmitFormat