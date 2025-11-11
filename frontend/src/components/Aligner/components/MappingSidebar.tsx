import React, { useState } from 'react';
import type { TextMapping, TextSelection } from '../types';
import { useEditorContext } from '../context';
import { useTextSelectionStore } from '../../../stores/textSelectionStore';
import TypeSelector from './TypeSelector';
import PublishModal, { type PublishMetadata } from './PublishModal';
import { transformMappingsToAPI, validatePublishData, getMappingsSummary } from '../utils/publishUtils';
import { createTranslation, createCommentary } from '../../../api/text';

interface MappingSidebarProps {
  mappings: TextMapping[];
  currentSourceSelection: TextSelection | null;
  currentTargetSelections: TextSelection[];
  canCreateMapping: boolean;
  onCreateMapping: () => void;
  onDeleteMapping: (mappingId: string) => void;
  onClearAllMappings: () => void;
  onExportMappings: () => void;
  onClearSelections: () => void;
}

const MappingSidebar: React.FC<MappingSidebarProps> = ({
  mappings,
  currentSourceSelection,
  currentTargetSelections,
  canCreateMapping,
  onCreateMapping,
  onDeleteMapping,
  onClearAllMappings,
  onExportMappings,
  onClearSelections,
}) => {
  const { generateSentenceMappings, getSourceContent, getTargetContent } = useEditorContext();
  const { targetType, sourceInstanceId } = useTextSelectionStore();
  
  // Modal and loading states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishError, setPublishError] = useState<string | null>(null);
  const [publishSuccess, setPublishSuccess] = useState<string | null>(null);
  
  const formatText = (text: string, maxLength: number = 50) => {
    return text.length > maxLength ? `${text.substring(0, maxLength)}...` : text;
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };


  // Handle opening publish modal
  const handlePublishClick = () => {
    // Clear previous messages
    setPublishError(null);
    setPublishSuccess(null);
    
    // Validate data before opening modal
    const sentenceMappings = generateSentenceMappings();
    const sourceContent = getSourceContent();
    const targetContent = getTargetContent();
    
    const validation = validatePublishData(sentenceMappings, sourceContent, targetContent);
    
    if (!validation.isValid) {
      setPublishError(validation.error || 'Validation failed');
      return;
    }
    
    if (!targetType) {
      setPublishError('Please select a target type (Translation or Commentary) before publishing');
      return;
    }
    
    if (!sourceInstanceId) {
      setPublishError('Source instance ID is required for publishing');
      return;
    }
    
    setIsModalOpen(true);
  };

  // Handle actual publishing after metadata is collected
  const handlePublishSubmit = async (metadata: PublishMetadata) => {
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
      setIsModalOpen(false);
      
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

  // Handle closing modal
  const handleModalClose = () => {
    if (!isPublishing) {
      setIsModalOpen(false);
    }
  };

  return (
    <div className="w-full bg-white border-l border-gray-200 flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 bg-gray-50">
        <h2 className="text-lg font-semibold text-gray-900 mb-3">Text Mappings</h2>
        
        {/* Type Selector */}
        <TypeSelector className="mb-4" />
        
        {/* Publish Button */}
        <button 
          onClick={handlePublishClick} 
          disabled={isPublishing}
          className="w-full px-4 py-2 bg-green-600 text-white text-sm font-medium rounded hover:bg-green-700 transition-colors mb-3 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
        >
          {isPublishing && (
            <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          )}
          <span>{isPublishing ? 'Saving...' : 'Save Mappings'}</span>
        </button>
        
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
        
        <p className="text-sm text-gray-600">
          {mappings.length} mapping{mappings.length !== 1 ? 's' : ''} created
        </p>
      </div>

      
      {/* Publish Modal */}
      <PublishModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        onSubmit={handlePublishSubmit}
        targetType={targetType}
        isLoading={isPublishing}
      />
    </div>
  );
};

export default MappingSidebar;
