import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { createTableOfContentsAnnotation } from '../../../api/text';
import type { SegmentAnnotation, TOCEntry } from '../types';
import type { Annotations } from '../../../types/text';
import { useTranslation } from 'react-i18next';

type submitFormatProps = {
   readonly segmentAnnotations: SegmentAnnotation[],
   readonly hasExistingSegmentation?: boolean,
   readonly hasExistingTOC?: boolean,
   readonly instanceId: string | null,
}

function SubmitFormat({segmentAnnotations, hasExistingSegmentation = false, hasExistingTOC = false, instanceId}: submitFormatProps) {
  const { t } = useTranslation();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // React Query mutation for creating table of contents annotation
  const createTOCMutation = useMutation<Annotations, Error, {
    instanceId: string;
    annotationData: {
      type: string;
      annotation: Array<{
        title: string;
        segments: string[];
      }>;
    };
  }>({
    mutationFn: async ({ instanceId, annotationData }) => {
      return await createTableOfContentsAnnotation(instanceId, annotationData);
    },
    onSuccess: () => {
      setSubmitSuccess(true);
      setSubmitError(null);
    },
    onError: (error) => {
      console.error(t('formatter.submittingTOCFailed'), error);
      setSubmitError(error.message || t('formatter.failedToSubmitTOC'));
      setSubmitSuccess(false);
    },
  });


  const handleSubmitFormat = () => {
    if (!instanceId) {
      setSubmitError(t('formatter.noInstanceSelected'));
      return;
    }

    setSubmitError(null);
    setSubmitSuccess(false);

    // Generate TOC from segment annotations
    const generateTOC = (): TOCEntry[] => {
        // Filter segments that have titles
        const titledSegments = segmentAnnotations.filter(segment => segment.title);
        
        if (titledSegments.length === 0) {
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
    
    const tocEntries = generateTOC();
    
    if (tocEntries.length === 0) {
      setSubmitError(t('formatter.noTOCEntries'));
      return;
    }

    // Transform TOC entries to API format
    const annotationData = {
      type: 'table_of_contents',
      annotation: tocEntries.map((entry, index) => ({
        id: `section_${String(index + 1).padStart(3, '0')}`,
        title: entry.title,
        segments: entry.segmentation.map(seg => seg.id)
      }))
    };

    // Trigger the mutation
    createTOCMutation.mutate({
      instanceId,
      annotationData,
    });
  }

  return (
    <div className="space-y-2">
      <button
        onClick={handleSubmitFormat}
        disabled={createTOCMutation.isPending || !instanceId || hasExistingTOC}
        className="px-4 py-2 w-full bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors duration-200 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {(() => {
          if (createTOCMutation.isPending) return t('formatter.submitting');
          return hasExistingSegmentation ? t('common.save') : t('common.save');
        })()}
      </button>
      
      {submitError && (
        <div className="p-2 bg-red-50 border border-red-200 rounded-md">
          <p className="text-xs text-red-600">{submitError}</p>
        </div>
      )}
      
      {submitSuccess && (
        <div className="p-2 bg-green-50 border border-green-200 rounded-md">
          <p className="text-xs text-green-600">{t('formatter.tocSubmittedSuccess')}</p>
        </div>
      )}
    </div>
  )
}


export default SubmitFormat