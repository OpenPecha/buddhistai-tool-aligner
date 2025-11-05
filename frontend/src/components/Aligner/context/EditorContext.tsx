import React, { useRef, useCallback, useMemo } from 'react';
import type { ReactCodeMirrorRef } from '@uiw/react-codemirror';
import type { SentenceMapping } from './types';
import { EditorContext, type EditorContextValue } from './context';

export function EditorProvider({ children }: { readonly children: React.ReactNode }) {
  const sourceEditorRef = useRef<ReactCodeMirrorRef | null>(null);
  const targetEditorRef = useRef<ReactCodeMirrorRef | null>(null);

  const getSourceContent = useCallback(() => {
    return sourceEditorRef.current?.view?.state.doc.toString();
  }, []);

  const getTargetContent = useCallback(() => {
    return targetEditorRef.current?.view?.state.doc.toString();
  }, []);

  // Split text into sentences based on common sentence terminators
  const splitIntoSentences = useCallback((text: string): string[] => {
    if (!text) return [];
    
    // Split by newline characters
    return text.split(/\n+/).filter(line => line.trim().length > 0);
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

    // Create 1:1 mappings between sentences
    // If counts don't match, map as many as possible
    const minLength = Math.min(sourceSentences.length, targetSentences.length);
    
    for (let i = 0; i < minLength; i++) {
      const sourceSentence = sourceSentences[i];
      const targetSentence = targetSentences[i];
      
      // Find the actual position in the original text
      // Note: start is inclusive, end is exclusive (standard substring behavior)
      // For example: text.substring(start, end) includes character at start but excludes character at end
      const sourceStart = sourceContent.indexOf(sourceSentence, sourcePos);
      const sourceEnd = sourceStart + sourceSentence.length; // Points to position AFTER last character
      
      const targetStart = targetContent.indexOf(targetSentence, targetPos);
      const targetEnd = targetStart + targetSentence.length; // Points to position AFTER last character
      const uniqueId = crypto.randomUUID();
      mappings.push({
        source: { start: sourceStart, end: sourceEnd ,index:uniqueId},
        target: { start: targetStart, end: targetEnd ,alignment_index:[uniqueId]}
      });
      
      sourcePos = sourceEnd;
      targetPos = targetEnd;
    }
    
    return mappings;
  }, [getSourceContent, getTargetContent, splitIntoSentences]);

  const value: EditorContextValue = useMemo(() => ({
    sourceEditorRef,
    targetEditorRef,
    getSourceContent,
    getTargetContent,
    generateSentenceMappings,
  }), [getSourceContent, getTargetContent, generateSentenceMappings]);

  return (
    <EditorContext.Provider value={value}>
      {children}
    </EditorContext.Provider>
  );
}

