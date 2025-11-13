import React, { useRef, useCallback, useMemo } from 'react';
import type { ReactCodeMirrorRef } from '@uiw/react-codemirror';
import { EditorSelection } from '@codemirror/state';
import { EditorView } from '@codemirror/view';
import type { SentenceMapping } from './types';
import { EditorContext, type EditorContextValue, type ExternalAlignmentData } from './context';

export function EditorProvider({ children }: { readonly children: React.ReactNode }) {
  const sourceEditorRef = useRef<ReactCodeMirrorRef | null>(null);
  const targetEditorRef = useRef<ReactCodeMirrorRef | null>(null);
  const isScrollSyncing = useRef<boolean>(false);
  const [isScrollSyncEnabled, setScrollSyncEnabled] = React.useState<boolean>(true);
  const [externalAlignmentData, setExternalAlignmentData] = React.useState<ExternalAlignmentData | null>(null);

  // Utility function to load alignment data from API response
  const loadAlignmentData = useCallback((alignmentResponse: ExternalAlignmentData) => {
    setExternalAlignmentData(alignmentResponse);
  }, []);

  const getSourceContent = useCallback(() => {
    return sourceEditorRef.current?.view?.state.doc.toString();
  }, []);

  const getTargetContent = useCallback(() => {
    return targetEditorRef.current?.view?.state.doc.toString();
  }, []);

  // Split text into sentences based on newlines, preserving empty lines for alignment
  const splitIntoSentences = useCallback((text: string): string[] => {
    if (!text) return [];
    
    // Split by single newline characters, preserving empty lines
    // This ensures that empty lines in the target text are preserved for proper alignment
    return text.split(/\n/);
  }, []);

  // Generate sentence-to-sentence mappings between source and target
  const generateSentenceMappings = useCallback((): SentenceMapping[] => {
    const sourceContent = getSourceContent();
    const targetContent = getTargetContent();
    if (!sourceContent || !targetContent) {
      return [];
    }

    const sourceSentences = splitIntoSentences(sourceContent);
    const targetSentences = splitIntoSentences(targetContent);
    const mappings: SentenceMapping[] = [];
    
    
    
    let sourcePos = 0;
    let targetPos = 0;
    let sourceIndex = 0; // Index in sourceNonEmpty array
    let targetIndex = 0; // Index in targetNonEmpty array
    

    // Handle mapping with empty target segments
    const maxLength = Math.max(sourceSentences.length, targetSentences.length);
    
    for (let i = 0; i < maxLength; i++) {
      const sourceSentence = sourceSentences[i];
      const targetSentence = targetSentences[i];
      const uniqueId = crypto.randomUUID();
      
      // If we have a source sentence
      if (sourceSentence !== undefined) {
        if (sourceSentence.trim().length > 0) {
          // Non-empty source sentence - calculate position in clean content
          const sourceStart = sourcePos;
          const sourceEnd = sourceStart + sourceSentence.length;
          
          // If we have a corresponding non-empty target sentence
          if (targetSentence !== undefined && targetSentence.trim().length > 0) {
            const targetStart = targetPos;
            const targetEnd = targetStart + targetSentence.length;
            
            mappings.push({
              source: { start: sourceStart, end: sourceEnd, index: uniqueId },
              target: { start: targetStart, end: targetEnd, alignment_index: [uniqueId] }
            });
            
            targetPos = targetEnd; // Next element starts where this one ends (exclusive end)
            targetIndex++;
          } else {
            // Empty or no target sentence
            mappings.push({
              source: { start: sourceStart, end: sourceEnd, index: uniqueId },
              target: { start: -1, end: -1, alignment_index: [uniqueId] } // -1 indicates empty line
            });
          }
          
          sourcePos = sourceEnd; // Next element starts where this one ends (exclusive end)
          sourceIndex++;
        } else {
          // Empty source sentence - map to empty
          mappings.push({
            source: { start: -1, end: -1, index: uniqueId },
            target: targetSentence !== undefined && targetSentence.trim().length > 0 
              ? { start: targetPos, end: targetPos + targetSentence.length, alignment_index: [uniqueId] }
              : { start: -1, end: -1, alignment_index: [uniqueId] }
          });
          
          if (targetSentence !== undefined && targetSentence.trim().length > 0) {
            targetPos += targetSentence.length;
            targetIndex++;
          }
        }
      } else if (targetSentence !== undefined && targetSentence.trim().length > 0) {
        // We have a target sentence but no corresponding source
        const targetStart = targetPos;
        const targetEnd = targetStart + targetSentence.length;
        
        mappings.push({
          source: { start: -1, end: -1, index: uniqueId },
          target: { start: targetStart, end: targetEnd, alignment_index: [uniqueId] }
        });
        
        targetPos = targetEnd;
        targetIndex++;
      }
    }
    
    return mappings;
  }, [getSourceContent, getTargetContent, splitIntoSentences]);

  // Scroll synchronization function
  const syncScrollToLine = useCallback((fromEditor: 'source' | 'target', lineNumber: number) => {
    if (!isScrollSyncEnabled || isScrollSyncing.current) return; // Check if sync is enabled and prevent infinite loop
    
    isScrollSyncing.current = true;
    
    try {
      const targetEditor = fromEditor === 'source' ? targetEditorRef.current : sourceEditorRef.current;
      
      if (targetEditor?.view) {
        const doc = targetEditor.view.state.doc;
        const totalLines = doc.lines;
        
        // Ensure line number is within bounds
        const clampedLineNumber = Math.max(1, Math.min(lineNumber, totalLines));
        
        // Get the position of the line
        const linePos = doc.line(clampedLineNumber).from;
        
        // Use scrollPosIntoView for smooth scrolling to the line
        const scrollEffect = EditorView.scrollIntoView(linePos, {
          y: 'start', // Align to top of viewport
          yMargin: 0
        });
        
        targetEditor.view.dispatch({
          effects: [scrollEffect]
        });
      }
    } catch (error) {
      console.error('Error syncing scroll:', error);
    } finally {
      // Reset the flag after a short delay to allow the scroll to complete
      setTimeout(() => {
        isScrollSyncing.current = false;
      }, 50);
    }
  }, [isScrollSyncEnabled]);

  // Click-based synchronization function with alignment support
  const syncToClickedLine = useCallback((clickPosition: number, fromEditor: 'source' | 'target') => {
    if (!isScrollSyncEnabled) return; // Only sync if enabled
    
    try {
      const sourceEditor = sourceEditorRef.current;
      const targetEditor = targetEditorRef.current;
      const clickedEditor = fromEditor === 'source' ? sourceEditor : targetEditor;
      const otherEditor = fromEditor === 'source' ? targetEditor : sourceEditor;
      
      if (!clickedEditor?.view || !otherEditor?.view) return;
      
      // Try to use external alignment data first, then internal mappings, then fallback to line-based sync
      let targetPosition = null;
      
      // Priority 1: Use external alignment data if available
      if (externalAlignmentData?.data) {
        const { alignment_annotation, target_annotation } = externalAlignmentData.data;
        
        if (fromEditor === 'source') {
          // Find source annotation containing click position
          const sourceAnnotation = alignment_annotation.find(ann => 
            clickPosition >= ann.span.start && clickPosition <= ann.span.end
          );
          
          if (sourceAnnotation && sourceAnnotation.alignment_index.length > 0) {
            // Find corresponding target annotation
            const targetIndex = sourceAnnotation.alignment_index[0];
            const targetAnnotation = target_annotation.find(ann => ann.index === targetIndex);
            
            if (targetAnnotation) {
              targetPosition = targetAnnotation.span.start;
            }
          }
        } else {
          // Find target annotation containing click position
          const targetAnnotation = target_annotation.find(ann => 
            clickPosition >= ann.span.start && clickPosition <= ann.span.end
          );
          
          if (targetAnnotation) {
            // Find corresponding source annotation
            const sourceAnnotation = alignment_annotation.find(ann => 
              ann.alignment_index.includes(targetAnnotation.index)
            );
            
            if (sourceAnnotation) {
              targetPosition = sourceAnnotation.span.start;
            }
          }
        }
        
        if (targetPosition !== null) {
          // Scroll to the aligned segment
          const scrollEffect = EditorView.scrollIntoView(targetPosition, {
            y: 'start', // Center the segment in viewport for better visibility
            yMargin: 50
          });
          
          // Temporarily disable scroll sync to prevent feedback loop
          isScrollSyncing.current = true;
          
          otherEditor.view.dispatch({
            effects: [scrollEffect]
          });
          
          // Reset the sync flag after a short delay
          setTimeout(() => {
            isScrollSyncing.current = false;
          }, 100);
          
          return; // Successfully used external alignment data
        }
      }
      
      // Priority 2: Use internal alignment mappings
      const alignmentMappings = generateSentenceMappings();
      
      if (alignmentMappings.length > 0) {
        // Find the alignment segment that contains the click position
        
        for (const mapping of alignmentMappings) {
          const sourceSpan = mapping.source;
          const targetSpan = mapping.target;
          
          if (fromEditor === 'source') {
            // Check if click is within source span
            if (clickPosition >= sourceSpan.start && clickPosition <= sourceSpan.end) {
              // Found matching source segment, get corresponding target position
              if (targetSpan.start >= 0 && targetSpan.end >= 0) {
                targetPosition = targetSpan.start;
              }
              break;
            }
          } else {
            // Check if click is within target span
            if (clickPosition >= targetSpan.start && clickPosition <= targetSpan.end) {
              // Found matching target segment, get corresponding source position
              if (sourceSpan.start >= 0 && sourceSpan.end >= 0) {
                targetPosition = sourceSpan.start;
              }
              break;
            }
          }
        }
        
        if (targetPosition !== null) {
          // Scroll to the aligned segment
          const scrollEffect = EditorView.scrollIntoView(targetPosition, {
            y: 'start', // Center the segment in viewport for better visibility
            yMargin: 50
          });
          
          // Temporarily disable scroll sync to prevent feedback loop
          isScrollSyncing.current = true;
          
          otherEditor.view.dispatch({
            effects: [scrollEffect]
          });
          
          // Reset the sync flag after a short delay
          setTimeout(() => {
            isScrollSyncing.current = false;
          }, 100);
          
          return; // Successfully used alignment mapping
        }
      }
      
      // Fallback to line-based synchronization if no alignment mapping found
      const doc = clickedEditor.view.state.doc;
      const line = doc.lineAt(clickPosition);
      const lineNumber = line.number;
      
      // Get the target document
      const targetDoc = otherEditor.view.state.doc;
      const totalTargetLines = targetDoc.lines;
      
      // Ensure the target line exists
      const targetLineNumber = Math.min(lineNumber, totalTargetLines);
      
      if (targetLineNumber > 0) {
        // Get the position of the target line
        const targetLinePos = targetDoc.line(targetLineNumber).from;
        
        // Scroll the other editor to the corresponding line
        const scrollEffect = EditorView.scrollIntoView(targetLinePos, {
          y: 'start', // Align to top of viewport
          yMargin: 0
        });
        
        // Temporarily disable scroll sync to prevent feedback loop
        isScrollSyncing.current = true;
        
        otherEditor.view.dispatch({
          effects: [scrollEffect]
        });
        
        // Reset the sync flag after a short delay
        setTimeout(() => {
          isScrollSyncing.current = false;
        }, 100);
        
      }
    } catch (error) {
      console.error('Error syncing to clicked line:', error);
    }
  }, [isScrollSyncEnabled, generateSentenceMappings, externalAlignmentData]);

  // Line selection synchronization function
  const syncLineSelection = useCallback((fromEditor: 'source' | 'target', lineNumber: number) => {
    if (!isScrollSyncEnabled || isScrollSyncing.current) return; // Check if sync is enabled and prevent infinite loop
    
    isScrollSyncing.current = true;
    
    try {
      const targetEditor = fromEditor === 'source' ? targetEditorRef.current : sourceEditorRef.current;
      
      if (targetEditor?.view) {
        const doc = targetEditor.view.state.doc;
        const totalLines = doc.lines;
        
        // Ensure line number is within bounds
        const clampedLineNumber = Math.max(1, Math.min(lineNumber, totalLines));
        
        // Get the position of the line
        const line = doc.line(clampedLineNumber);
        const lineStart = line.from;
        const lineEnd = line.to;
        
        // Create a selection for the entire line
        const selection = EditorSelection.single(lineStart, lineEnd);
        
        // Apply the selection and scroll to it
        const scrollEffect = EditorView.scrollIntoView(lineStart, {
          y: 'center', // Center the line in viewport
          yMargin: 50
        });
        
        targetEditor.view.dispatch({
          selection,
          effects: [scrollEffect]
        });
      }
    } catch (error) {
      console.error('Error syncing line selection:', error);
    } finally {
      // Reset the flag after a short delay to allow the selection to complete
      setTimeout(() => {
        isScrollSyncing.current = false;
      }, 100);
    }
  }, [isScrollSyncEnabled]);

  const value: EditorContextValue = useMemo(() => ({
    sourceEditorRef,
    targetEditorRef,
    getSourceContent,
    getTargetContent,
    generateSentenceMappings,
    syncScrollToLine,
    syncToClickedLine,
    syncLineSelection,
    isScrollSyncing,
    isScrollSyncEnabled,
    setScrollSyncEnabled,
    externalAlignmentData,
    setExternalAlignmentData,
    loadAlignmentData,
  }), [getSourceContent, getTargetContent, generateSentenceMappings, syncScrollToLine, syncToClickedLine, syncLineSelection, isScrollSyncEnabled, externalAlignmentData, loadAlignmentData]);

  return (
    <EditorContext.Provider value={value}>
      {children}
    </EditorContext.Provider>
  );
}

