import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import type { TextMapping } from '../types';
import { useEditorContext } from '../context';
import { useTextSelectionStore } from '../../../stores/textSelectionStore';
import { createAnnotation } from '../../../api/text';
import type { Annotations } from '../../../types/text';
import { useTranslation } from 'react-i18next';
import { generateAlignment } from '../utils/generateAnnotation';

interface MappingSidebarProps {
  mappings: TextMapping[];
}

const MappingSidebar: React.FC<MappingSidebarProps> = () => {
  const { t } = useTranslation();
  const { getSourceContent, getTargetContent } = useEditorContext();
  const { sourceInstanceId, targetInstanceId } = useTextSelectionStore();
  
  // Local state for success/error messages
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  // React Query mutation for creating annotation
  const createAnnotationMutation = useMutation<Annotations, Error, {
    inferenceId: string;
    annotationData: {
      type: string;
      target_manifestation_id: string;
      target_annotation: Array<{
        span: { start: number; end: number };
        index: string;
      }>;
      alignment_annotation: Array<{
        span: { start: number; end: number };
        index: string;
        alignment_index: string[];
      }>;
    };
  }>({
    mutationFn: async ({ inferenceId, annotationData }) => {
      return await createAnnotation(inferenceId, annotationData);
    },
    onSuccess: () => {
      setSaveSuccess(t('mapping.alignmentSavedSuccess'));
      setSaveError(null);
    },
    onError: (error) => {
      console.error(t('mapping.savingAlignmentFailed'), error);
      setSaveError(error.message || t('mapping.failedToSaveAlignment'));
      setSaveSuccess(null);
    },
  });


  // Handle saving alignment annotation
  const handleSave = () => {
    if (!sourceInstanceId || !targetInstanceId) {
      setSaveError(t('mapping.sourceAndTargetRequired'));
      return;
    }

    // Get source and target content
    const sourceContent = getSourceContent();
    const targetContent = getTargetContent();
    
    if (!sourceContent || !targetContent) {
      setSaveError('Source and target content are required');
      return;
    }
    const sourceSegments = sourceContent.split('\n');
    const targetSegments = targetContent.split('\n');


    const spans = generateAlignment(sourceSegments, targetSegments);

    
    // Trigger the mutation
    createAnnotationMutation.mutate({
      inferenceId: targetInstanceId,
      annotationData: {
        type: 'alignment',
        target_manifestation_id: sourceInstanceId,
        target_annotation: spans.target_annotation,
        alignment_annotation: spans.alignment_annotation,
      },
    });
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
        <button
          onClick={handleSave}
          disabled={createAnnotationMutation.isPending || !sourceInstanceId || !targetInstanceId}
          className="w-full px-4 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          {createAnnotationMutation.isPending ? 'Saving...' : 'Save'}
        </button>
      </div>
  );
};

export default MappingSidebar;
