import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import type { TextMapping } from '../types';
import { useEditorContext } from '../context';
import { useTextSelectionStore } from '../../../stores/textSelectionStore';
import { createAnnotation } from '../../../api/text';
import type { Annotations } from '../../../types/text';
import { useTranslation } from 'react-i18next';

interface MappingSidebarProps {
  mappings: TextMapping[];
}

const MappingSidebar: React.FC<MappingSidebarProps> = () => {
  const { t } = useTranslation();
  const { generateSentenceMappings, getSourceContent, getTargetContent } = useEditorContext();
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

    // Create objects mapping line numbers to content for both source and target
    const sourceSegmentsMap: Record<number, string> = {};
    const targetSegmentsMap: Record<number, string> = {};
    
    for (const [index, segment] of sourceSegments.entries()) {
      sourceSegmentsMap[index+1] = segment;
    }
    
    for (const [index, segment] of targetSegments.entries()) {
      targetSegmentsMap[index+1] = segment;
    }

    const spans = generateAnnotations(sourceSegmentsMap, targetSegmentsMap, sourceContent, targetContent);
    // Get sentence mappings
    console.log('spans', spans);
    const sentenceMappings = generateSentenceMappings();
    
    if (sentenceMappings.length === 0) {
      setSaveError(t('mapping.noAlignmentMappings'));
      return;
    }

    // Helper function to calculate line number from text position
    // Line numbers are 0-based (first line is 0)
    const getLineNumberFromPosition = (position: number): number => {
      if (position < 0) return 0;
      // Count newlines before this position
      const textBeforePosition = sourceContent.substring(0, position);
      return textBeforePosition.split('\n').length - 1;
    };
    
    // Reverse engineer the loading logic:
    // When loading: target_annotation is applied to SOURCE text to segment it
    // alignment_annotation is used to build target segmentation by iterating through indices
    // and finding alignment_annotation entries where alignment_index.includes(i)
    
    // Step 1: Get all source segments (valid source segments) - these become target_annotation
    // target_annotation[i] represents source segment at index i (where i is the line number)
    const allSourceSegments = sentenceMappings.filter(
      m => m.source.start >= 0 && m.source.end > m.source.start
    );

    // Step 2: Build target_annotation from all source segments with line number as index
    // This matches how the loader applies target_annotation to source text
    const targetAnnotation = allSourceSegments.map((mapping) => {
      // Calculate line number based on the start position of the source segment
      const lineNumber = getLineNumberFromPosition(mapping.source.start);
      
      return {
        span: {
          start: Math.max(mapping.source.start, 0),
          end: Math.max(mapping.source.end, 0),
        },
        index: lineNumber,  // Use line number as index instead of sequential index
      };
    });

    // Step 3: Build alignment_annotation - for each source line number that has a target segment
    // The loader iterates i from 0 to maxAlignmentIndex and looks for:
    // alignment_annotation.find(ann => ann.alignment_index.includes(i))
    // So we need: for each source line number i with a target, create entry with alignment_index: [i]
    const alignmentAnnotation: Array<{
      span: { start: number; end: number };
      index: number;
      alignment_index: number[];
    }> = [];

    // Create a map from source segment to its line number (index in targetAnnotation)
    const sourceLineNumberMap = new Map<string, number>();
    for (const mapping of allSourceSegments) {
      const key = `${mapping.source.start}-${mapping.source.end}`;
      const lineNumber = getLineNumberFromPosition(mapping.source.start);
      sourceLineNumberMap.set(key, lineNumber);
    }

    // Track which source line numbers we've already processed to avoid duplicates
    const processedSourceLineNumbers = new Set<number>();

    // For each mapping, if it has both source and target, create alignment_annotation entry
    for (const mapping of sentenceMappings) {
      // Only process mappings where both source and target are valid
      if (mapping.source.start >= 0 && mapping.source.end > mapping.source.start &&
          mapping.target.start >= 0 && mapping.target.end > mapping.target.start) {
        
        // Find the source line number
        const key = `${mapping.source.start}-${mapping.source.end}`;
        const sourceLineNumber = sourceLineNumberMap.get(key);
        
        // Only create alignment_annotation entry if we haven't processed this source line number yet
        if (sourceLineNumber !== undefined && !processedSourceLineNumbers.has(sourceLineNumber)) {
          processedSourceLineNumbers.add(sourceLineNumber);
          
          // Create alignment_annotation entry for this source line number
          // The loader will find this when it does: alignment_index.includes(sourceLineNumber)
          alignmentAnnotation.push({
            span: {
              start: Math.max(mapping.target.start, 0),  // Use TARGET span
              end: Math.max(mapping.target.end, 0),
            },
            index: sourceLineNumber,  // Source line number (used as index)
            alignment_index: [sourceLineNumber],  // References source line number so loader can find it
          });
        }
      }
    }

    console.log('alignmentAnnotation', alignmentAnnotation);
    console.log('targetAnnotation', targetAnnotation);
    
    // Trigger the mutation
    // createAnnotationMutation.mutate({
    //   inferenceId: targetInstanceId,
    //   annotationData: {
    //     type: 'alignment',
    //     target_manifestation_id: sourceInstanceId,
    //     target_annotation: targetAnnotation,
    //     alignment_annotation: alignmentAnnotation,
    //   },
    // });
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


function generateAnnotations(
  source: Record<number, string>, 
  target: Record<number, string>,
  sourceContent: string,
  targetContent: string
) {
  const targetAnnotation: Array<{
    index: number;
    span: { start: number; end: number };
  }> = [];
  
  const alignmentAnnotation: Array<{
    index: number;
    alignment_index: number[];
    span: { start: number; end: number };
  }> = [];
  
  // Helper function to find the position of a line in the text
  // Excludes newlines from span calculation and end is exclusive
  // Positions are calculated as if newlines don't exist in the text
  const findLinePosition = (text: string, lineNumber: number): { start: number; end: number } => {
    const lines = text.split('\n');
    let position = 0;
    
    // Calculate start position: sum of all previous lines (excluding newlines)
    // This gives us the position in a version of text where newlines are removed
    for (let i = 0; i < lineNumber - 1 && i < lines.length; i++) {
      position += lines[i].length; // Only count line content, not newline
    }
    
    const lineIndex = lineNumber - 1;
    if (lineIndex >= 0 && lineIndex < lines.length) {
      const lineText = lines[lineIndex];
      // End is exclusive: points to position after the last character of this line
      // (in the version of text without newlines)
      return {
        start: position,
        end: position + lineText.length
      };
    }
    
    return { start: position, end: position };
  };

  // Get all line numbers from both source and target, sorted
  const sourceKeys = Object.keys(source).map(Number).sort((a, b) => a - b);
  const targetKeys = Object.keys(target).map(Number).sort((a, b) => a - b);
  const maxLine = Math.max(...sourceKeys, ...targetKeys, -1);

  // Process each line number for one-to-one mapping
  for (let i = 1; i <= maxLine; i++) {
    const sourceText = source[i];
    const targetText = target[i];

    // Skip if neither source nor target has this line
    if (sourceText === undefined && targetText === undefined) {
      continue;
    }

    // Calculate source span from actual source content (only if source line exists)
    if (sourceText !== undefined) {
      const sourceSpan = findLinePosition(sourceContent, i);
      
      // target_annotation: Always add source segment if it exists
      // This represents the source segmentation
      targetAnnotation.push({
        index: i,  // Line number as index
        span: {
          start: sourceSpan.start,
          end: sourceSpan.end
        }
      });
    }

    // alignment_annotation: Only add if both source and target have content (one-to-one mapping)
    if (sourceText !== undefined && targetText !== undefined && 
        sourceText.trim() !== "" && targetText.trim() !== "") {
      const targetSpan = findLinePosition(targetContent, i);
      
      alignmentAnnotation.push({
        index: i,  // Source line number
        alignment_index: [i],  // References the source index (one-to-one mapping)
        span: {
          start: targetSpan.start,  // Target span position
          end: targetSpan.end
        }
      });
    }
  }

  return { targetAnnotation, alignmentAnnotation };
}
