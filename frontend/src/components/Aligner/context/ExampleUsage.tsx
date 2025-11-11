/**
 * Example component demonstrating how to use EditorContext
 * with the generateSentenceMappings function
 */

import React from 'react';
import { useEditorContext, type SentenceMapping } from './index';

export function ExampleMappingButton() {
  const { 
    getSourceContent, 
    getTargetContent, 
    generateSentenceMappings 
  } = useEditorContext();

  const handleGenerateMappings = () => {
    // Get content from both editors
    const sourceContent = getSourceContent();
    const targetContent = getTargetContent();
    
    
    // Generate sentence-to-sentence mappings
    const mappings: SentenceMapping[] = generateSentenceMappings();
    
    
    // Example: Log each mapping
    mappings.forEach((mapping, index) => {
      const sourceText = sourceContent?.substring(
        mapping.source.start, 
        mapping.source.end
      );
      const targetText = targetContent?.substring(
        mapping.target.start, 
        mapping.target.end
      );
      
    });
    
    // You can now use these mappings for:
    // - Creating alignment visualizations
    // - Exporting alignment data
    // - Highlighting corresponding sentences
    // - etc.
    
    return mappings;
  };

  return (
    <button
      onClick={handleGenerateMappings}
      className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
    >
      Generate Sentence Mappings
    </button>
  );
}















