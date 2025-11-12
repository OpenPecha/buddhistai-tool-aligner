import React, { useState, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import type { TextMapping } from '../types';
import { useEditorContext } from '../context';
import { useTextSelectionStore } from '../../../stores/textSelectionStore';
import { createAnnotation } from '../../../api/text';
import type { Annotations } from '../../../types/text';

interface MappingSidebarProps {
  mappings: TextMapping[];
}

const MappingSidebar: React.FC<MappingSidebarProps> = () => {
  const { generateSentenceMappings } = useEditorContext();
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
      setSaveSuccess('Alignment saved successfully!');
      setSaveError(null);
    },
    onError: (error) => {
      console.error('Saving alignment failed:', error);
      setSaveError(error.message || 'Failed to save alignment');
      setSaveSuccess(null);
    },
  });

  // Clear messages when mutation state changes
  useEffect(() => {
    if (createAnnotationMutation.isSuccess) {
      const timer = setTimeout(() => {
        setSaveSuccess(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [createAnnotationMutation.isSuccess]);

  useEffect(() => {
    if (createAnnotationMutation.isError) {
      const timer = setTimeout(() => {
        setSaveError(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [createAnnotationMutation.isError]);

  // Handle saving alignment annotation
  const handleSave = () => {
    if (!sourceInstanceId || !targetInstanceId) {
      setSaveError('Source and target instance IDs are required');
      return;
    }

    // Get sentence mappings
    const sentenceMappings = generateSentenceMappings();
    
    if (sentenceMappings.length === 0) {
      setSaveError('No alignment mappings found');
      return;
    }
   
    // Create a map from source UUID to numeric index
    const sourceIndexMap = new Map<string, number>();
    let sourceIndexCounter = 0;
    for (const mapping of sentenceMappings) {
      if (mapping.source.start >= 0 && mapping.source.end > mapping.source.start) {
        if (!sourceIndexMap.has(mapping.source.index)) {
          sourceIndexMap.set(mapping.source.index, sourceIndexCounter++);
        }
      }
    }

    // Build target_annotation from source segments
    const targetAnnotation = sentenceMappings
      .filter(m => m.source.start >= 0 && m.source.end > m.source.start)
      .map((mapping) => {
        const sourceIdx = sourceIndexMap.get(mapping.source.index);
        if (sourceIdx === undefined) return null;
        
        return {
          span: {
            start: Math.max(mapping.source.start, 0),
            end: Math.max(mapping.source.end, 0),
          },
          index: sourceIdx,
        };
      })
      .filter((m): m is NonNullable<typeof m> => m !== null);

    // Build alignment_annotation from target segments
    let targetIndexCounter = 0;
    const alignmentAnnotation = sentenceMappings
      .filter(m => m.target.start >= 0 && m.target.end > m.target.start)
      .map((mapping) => {
        // Find all source numeric indices that align with this target segment
        const alignmentIndices: number[] = [];
        for (const sourceUuid of mapping.target.alignment_index) {
          const sourceIdx = sourceIndexMap.get(sourceUuid);
          if (sourceIdx !== undefined) {
            alignmentIndices.push(sourceIdx);
          }
        }
        
        // If no alignment found, use empty array (or could use target index)
        const targetIdx = targetIndexCounter++;
        
        return {
          span: {
            start: Math.max(mapping.target.start, 0),
            end: Math.max(mapping.target.end, 0),
          },
          index: targetIdx,
          alignment_index: alignmentIndices.length > 0 ? alignmentIndices : [targetIdx],
        };
      });

    // Trigger the mutation
    createAnnotationMutation.mutate({
      inferenceId: targetInstanceId,
      annotationData: {
        type: 'alignment',
        target_manifestation_id: sourceInstanceId,
        target_annotation: targetAnnotation,
        alignment_annotation: alignmentAnnotation,
      },
    });
  };


  return (
    <div className="w-full bg-white border-l border-gray-200 flex flex-col h-full">
      <div className="p-4 border-b border-gray-200 bg-gray-50">
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
    </div>
  );
};

export default MappingSidebar;
