import { useState, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useEditorContext } from '../context';
import { useTextSelectionStore } from '../../../stores/textSelectionStore';
import { createAnnotation, updateAnnotation } from '../../../api/text';
import { fetchRelatedInstances } from '../../../api/instances';
import type { Annotations } from '../../../types/text';
import { useTranslation } from 'react-i18next';
import { generateAlignment } from '../utils/generateAnnotation';



const MappingSidebar = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { getSourceContent, getTargetContent, isContentValid } = useEditorContext();
  const { sourceInstanceId, targetInstanceId, hasAlignment, sourceText, targetText } = useTextSelectionStore();
  const [annotationId, setAnnotationId] = useState<string | null>(null);
  
  // Local state for success/error messages
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Fetch annotation ID when hasAlignment is true
  useEffect(() => {
    const fetchAnnotationId = async () => {
      if (hasAlignment && sourceInstanceId && targetInstanceId) {
        try {
          const relatedInstances = await fetchRelatedInstances(sourceInstanceId);
          const targetInstance = relatedInstances.find(
            (instance) => (instance.instance_id || instance.id) === targetInstanceId
          );

          if (targetInstance) {
            let id: string | null = null;
            if (
              'annotation' in targetInstance &&
              typeof targetInstance.annotation === 'string'
            ) {
              id = targetInstance.annotation;
            } else if (
              Array.isArray(targetInstance.annotations) &&
              targetInstance.annotations[0]?.annotation_id
            ) {
              id = targetInstance.annotations[0].annotation_id;
            }
            setAnnotationId(id);
          }
        } catch (error) {
          console.error('Error fetching annotation ID:', error);
        }
      } else {
        setAnnotationId(null);
      }
    };

    fetchAnnotationId();
  }, [hasAlignment, sourceInstanceId, targetInstanceId]);
  // React Query mutation for creating annotation
  const createAnnotationMutation = useMutation<Annotations, Error, {
    inferenceId: string;
    annotationData: {
      type: string;
      target_manifestation_id: string;
      target_annotation: Array<{
        span: { start: number; end: number };
        index: number;
      }>;
      alignment_annotation: Array<{
        span: { start: number; end: number };
        index: number;
        alignment_index: number[];
      }>;
    };
  }>({
    mutationFn: async ({ inferenceId, annotationData }) => {
      return await createAnnotation(inferenceId, annotationData);
    },
    onSuccess: () => {
      setSaveSuccess(t('mapping.alignmentSavedSuccess'));
      setSaveError(null);
      // Show success alert and redirect to home page
      globalThis.alert(t('mapping.alignmentSavedSuccess'));
      navigate('/');
    },
    onError: (error) => {
      console.error(t('mapping.savingAlignmentFailed'), error);
      setSaveError(error.message || t('mapping.failedToSaveAlignment'));
      setSaveSuccess(null);
    },
  });

  // React Query mutation for updating annotation
  const updateAnnotationMutation = useMutation<Annotations, Error, {
    annotationId: string;
    annotationData: {
      type: string;
      target_manifestation_id: string;
      target_annotation: Array<{
        span: { start: number; end: number };
        index: number;
      }>;
      alignment_annotation: Array<{
        span: { start: number; end: number };
        index: number;
        alignment_index: number[];
      }>;
    };
  }>({
    mutationFn: async ({ annotationId, annotationData }) => {
      return await updateAnnotation(annotationId, annotationData);
    },
    onSuccess: () => {
      setSaveSuccess(t('mapping.alignmentUpdatedSuccess') || 'Alignment updated successfully');
      setSaveError(null);
      // Show success alert and redirect to home page
      globalThis.alert(t('mapping.alignmentUpdatedSuccess') || 'Alignment updated successfully');
      navigate('/');
    },
    onError: (error) => {
      console.error('Failed to update alignment:', error);
      setSaveError(error.message || t('mapping.failedToUpdateAlignment') || 'Failed to update alignment');
      setSaveSuccess(null);
    },
  });



  // Handle saving alignment annotation
  const handleSave = () => {
    // Show confirmation dialog before saving
    const confirmMessage = hasAlignment 
      ? t('mapping.confirmUpdateAlignment') || 'Are you sure you want to update this alignment?'
      : t('mapping.confirmSaveAlignment');
    const confirmed = globalThis.confirm(confirmMessage);
    if (!confirmed) {
      return;
    }
    if (!sourceInstanceId || !targetInstanceId) {
      setSaveError(t('mapping.sourceAndTargetRequired'));
      return;
    }

    // Validate content before saving
    if (!isContentValid()) {
      setSaveError(t('mapping.contentModifiedError'));
      return;
    }
    
    // Get source and target content from editors, with fallback to store
    const editorSourceContent = getSourceContent();
    const editorTargetContent = getTargetContent();
    // Use editor content if available, otherwise fallback to store content
    const sourceContent = editorSourceContent ?? sourceText ?? '';
    const targetContent = editorTargetContent ?? targetText ?? '';
    
    if (!sourceContent || !targetContent) {
      setSaveError(t('mapping.sourceAndTargetContentRequired'));
      return;
    }
    const sourceSegments = sourceContent.split('\n');
    const targetSegments = targetContent.split('\n');

    const spans = generateAlignment(sourceSegments, targetSegments);

    // Use update if hasAlignment and annotationId exists, otherwise create
    if (hasAlignment && annotationId) {
      // Convert string indices to numbers for updateAnnotation API
      const targetAnnotation = spans.target_annotation
        .filter(item => item.index !== undefined && item.index !== null)
        .map(item => ({
          span: item.span,
          index: typeof item.index === 'string' ? Number.parseInt(item.index, 10) : (item.index ?? 0),
        }));

      const alignmentAnnotation = spans.alignment_annotation
        .filter(item => item.index !== undefined && item.index !== null && item.alignment_index !== undefined)
        .map(item => ({
          span: item.span,
          index: typeof item.index === 'string' ? Number.parseInt(item.index, 10) : (item.index ?? 0),
          alignment_index: (item.alignment_index ?? []).map(idx => typeof idx === 'string' ? Number.parseInt(idx, 10) : idx),
        }));
      console.log(targetAnnotation, alignmentAnnotation);
      // updateAnnotationMutation.mutate({
      //   annotationId,
      //   annotationData: {
      //     type: 'alignment',
      //     target_manifestation_id: sourceInstanceId,
      //     target_annotation: targetAnnotation,
      //     alignment_annotation: alignmentAnnotation,
      //   },
      // });
    } else {
      // Convert to number format for createAnnotation
      const checkCondition=(d)=>d.span.start<d.span.end;
      const createTargetAnnotation = spans.target_annotation
        .filter(item => item.index !== undefined && item.index !== null)
        .filter(checkCondition)
        .map(item => ({
          span: item.span,
          index: typeof item.index === 'string' ? Number.parseInt(item.index, 10) : (item.index ?? 0),
        }));

      const createAlignmentAnnotation = spans.alignment_annotation
        .filter(item => item.index !== undefined && item.index !== null && item.alignment_index !== undefined)
        .filter(checkCondition)
        .map(item => ({
          span: item.span,
          index: typeof item.index === 'string' ? Number.parseInt(item.index, 10) : (item.index ?? 0),
          alignment_index: (item.alignment_index ?? []).map(idx => typeof idx === 'string' ? Number.parseInt(idx, 10) : idx),
        }));
        function filterAlignedArrays(arr1, arr2) {
          // Collect all indices from arr1
          const arr1IndicesSet = new Set();
          for (const item of arr1) {
              arr1IndicesSet.add(item.index);
          }
          
          // Collect all indices that appear in arr2's alignment_index arrays
          const alignmentIndicesSet = new Set();
          for (const item of arr2) {
              if (item.alignment_index && Array.isArray(item.alignment_index)) {
                  for (const idx of item.alignment_index) {
                      alignmentIndicesSet.add(idx);
                  }
              }
          }
          
          // Filter arr1: keep only elements whose index exists in arr2's alignment_index
          const filteredArr1 = arr1.filter(item => alignmentIndicesSet.has(item.index));
          
          // Filter arr2: keep only elements whose alignment_index contains at least one index from arr1
          const filteredArr2 = arr2.filter(item => {
              if (!item.alignment_index || !Array.isArray(item.alignment_index)) {
                  return false;
              }
              return item.alignment_index.some(idx => arr1IndicesSet.has(idx));
          });
          
          return {
              source: filteredArr1,
              target: filteredArr2
          };
      }
       const filtered = filterAlignedArrays(createTargetAnnotation, createAlignmentAnnotation);

      createAnnotationMutation.mutate({
        inferenceId: targetInstanceId,
        annotationData: {
          type: 'alignment',
          target_manifestation_id: sourceInstanceId,
          target_annotation: filtered.source,
          alignment_annotation: filtered.target,
        },
      });
    }
  };


  return (
      <div className="p-4">
        {/* Success Message */}
        {saveSuccess && (
          <div className="mb-3 p-3 bg-green-50 border border-green-200 rounded-md">
            <p className="text-sm text-green-800">{saveSuccess}</p>
          </div>
        )}
        
        {/* Error Message */}
        {saveError && (
          <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-800">{saveError}</p>
          </div>
        )}

        {/* Save Button */}
        { hasAlignment && (
          <div className="mb-3 p-3 bg-green-50 border border-green-200 rounded-md">
            <p className="text-sm text-green-800">{t('mapping.alignmentSavedSuccess')}</p>
          </div>
        ) }
        <button
          onClick={handleSave}
          disabled={createAnnotationMutation.isPending || updateAnnotationMutation.isPending}
          className="w-full px-4 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          {(() => {
            const isPending = createAnnotationMutation.isPending || updateAnnotationMutation.isPending;
            if (isPending) {
              return hasAlignment ? (t('mapping.updating') || 'Updating...') : t('mapping.publishing');
            }
            return hasAlignment ? (t('mapping.saveUpdate') || 'Save/Update') : t('mapping.publish');
          })()}
        </button>
      </div>
  );
};

export default MappingSidebar;
