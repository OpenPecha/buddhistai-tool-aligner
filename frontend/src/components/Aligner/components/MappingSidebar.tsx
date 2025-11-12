import React, { useState } from 'react';
import type { TextMapping } from '../types';
import { useEditorContext } from '../context';
import { useTextSelectionStore } from '../../../stores/textSelectionStore';
import TypeSelector from './TypeSelector';
import PublishForm, { type PublishMetadata } from './PublishForm';
import { transformMappingsToAPI, validatePublishData, getMappingsSummary } from '../utils/publishUtils';
import { createTranslation, createCommentary } from '../../../api/text';

interface MappingSidebarProps {
  mappings: TextMapping[];
}

const MappingSidebar: React.FC<MappingSidebarProps> = ({
  mappings,
}) => {
  const { generateSentenceMappings, getSourceContent, getTargetContent } = useEditorContext();
  const { targetType, sourceInstanceId } = useTextSelectionStore();
  
  // Publishing states
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishError, setPublishError] = useState<string | null>(null);
  const [publishSuccess, setPublishSuccess] = useState<string | null>(null);
  


  // Validate data before allowing form submission
  const validateBeforeSubmit = (): boolean => {
    // Clear previous messages
    setPublishError(null);
    setPublishSuccess(null);
    
    const sentenceMappings = generateSentenceMappings();
    const sourceContent = getSourceContent();
    const targetContent = getTargetContent();
    
    const validation = validatePublishData(sentenceMappings, sourceContent, targetContent);
    
    if (!validation.isValid) {
      setPublishError(validation.error || 'Validation failed');
      return false;
    }
    
    if (!targetType) {
      setPublishError('Please select a target type (Translation or Commentary) before publishing');
      return false;
    }
    
    if (!sourceInstanceId) {
      setPublishError('Source instance ID is required for publishing');
      return false;
    }
    
    return true;
  };

  // Handle actual publishing after metadata is collected
  const handlePublishSubmit = async (metadata: PublishMetadata) => {
    // First validate before proceeding
    if (!validateBeforeSubmit()) {
      return;
    }
    
    setIsPublishing(true);
    setPublishError(null);
    
    try {
      const sentenceMappings = generateSentenceMappings();
      const targetContent = getTargetContent();
      
      if (!targetContent) {
        throw new Error('Target content is required');
      }
      
      // Transform mappings to API format
      const publishData = transformMappingsToAPI(sentenceMappings, targetContent, metadata);
      // Call appropriate API based on target type
      let result;
      if (targetType === 'translation') {
        result = await createTranslation(sourceInstanceId!, publishData);
      } else if (targetType === 'commentary') {
        result = await createCommentary(sourceInstanceId!, publishData);
      } else {
        throw new Error('Invalid target type');
      }
      
      // Success
      setPublishSuccess(`${targetType === 'translation' ? 'Translation' : 'Commentary'} published successfully! ID: ${result.instance_id}`);
      
      // Log summary for debugging
      const summary = getMappingsSummary(sentenceMappings);
      console.log('Published successfully:', {
        type: targetType,
        instanceId: result.instance_id,
        summary
      });
      
    } catch (error) {
      console.error('Publishing failed:', error);
      setPublishError(error instanceof Error ? error.message : 'Publishing failed');
    } finally {
      setIsPublishing(false);
    }
  };


  return (
    <div className="w-full bg-white border-l border-gray-200 flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 bg-gray-50">
        
        {/* Type Selector */}
        <TypeSelector className="mb-4" />
        
        {/* Success Message */}
        {publishSuccess && (
          <div className="mb-3 p-3 bg-green-50 border border-green-200 rounded-md">
            <p className="text-sm text-green-800">{publishSuccess}</p>
          </div>
        )}
        
        {/* Error Message */}
        {publishError && (
          <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-800">{publishError}</p>
          </div>
        )}
        
    
      </div>

      {/* Publish Form - embedded directly in sidebar */}
      <div className="flex-1 p-4 overflow-y-auto">
        <PublishForm
          onSubmit={handlePublishSubmit}
          targetType={targetType}
          isLoading={isPublishing}
        />
      </div>
    </div>
  );
};

export default MappingSidebar;
