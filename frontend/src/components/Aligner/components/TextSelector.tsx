import React, { useState, useRef } from 'react';
import { useTexts, useLoadTextContent } from '../../../hooks/useTexts';

interface TextSelectorProps {
  onSourceTextSelect: (text: string) => void;
  onTargetTextSelect: (text: string) => void;
  onClearAll?: () => void;
}

const TextSelector: React.FC<TextSelectorProps> = ({
  onSourceTextSelect,
  onTargetTextSelect,
  onClearAll,
}) => {
  const targetFileRef = useRef<HTMLInputElement>(null);
  const [isTargetApiLoading, setIsTargetApiLoading] = useState(false);
  const [selectedTextId, setSelectedTextId] = useState<string>('');

  // React Query hooks
  const { data: availableTexts = [], isLoading: isLoadingTexts, error: textsError } = useTexts({ limit: 50 });
  const loadTextContentMutation = useLoadTextContent();

  // Handle text selection from dropdown
  const handleTextSelection = async (textId: string) => {
    if (!textId) return;
    
    try {
      const result = await loadTextContentMutation.mutateAsync(textId);
      console.log('result', result);
      handleLoadText(result.content,'source');
      setSelectedTextId(textId);
    } catch (error) {
      console.error('Error fetching text content:', error);
      alert('Failed to load text content. Please try again.');
    }
  };

  // Handle file upload for target text only
  const handleTargetFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file?.type === 'text/plain') {
      try {
        const text = await file.text();
        handleLoadText(text,'target');
        // Clear file input
        if (targetFileRef.current) {
          targetFileRef.current.value = '';
        }
      } catch (error) {
        console.error('Error reading file:', error);
        alert('Error reading file. Please try again.');
      }
    } else {
      alert('Please select a valid text file (.txt)');
      if (targetFileRef.current) {
        targetFileRef.current.value = '';
      }
    }
  };

  const handleLoadText = (content:string,type: 'source' | 'target') => {
    if (content.trim()) {
      if (type === 'source') {
        onSourceTextSelect(content);
      } else {
        onTargetTextSelect(content);
      }
    } else {
      alert(`Please enter or select ${type} text first.`);
    }
  };


  // Handle API loading for target text
  const handleTargetApiLoad = async () => {
    setIsTargetApiLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      const mockTargetText = `In order to maintain this precious mind, I properly offer to the Tathagatas and the sublime Dharma, to the stainless Triple Gem and the Buddha's children, oceans of good qualities.

Whatever flowers and fruits there are, whatever varieties of medicine exist, whatever precious things there are in the world, and whatever pure and pleasant waters there are.

Likewise precious mountains, and forests in quiet and delightful places, trees adorned with flowers and garlands, and trees whose branches are heavy with good fruit.`;
      handleLoadText(mockTargetText,'target');
    } catch (error) {
      console.error('Error loading text from API:', error);
      alert('Failed to load text from API. Please try again.');
    } finally {
      setIsTargetApiLoading(false);
    }
  };

  // Handle creating new text (redirect to another website)
  const handleCreateText = () => {
    // Open formatter page in new tab
    window.open('/formatter', '_blank');
  };

  const handleClearAll = () => {
    setSelectedTextId('');
    if (onClearAll) {
      onClearAll();
    }
  };

  return (
    <div className="bg-white border-b border-gray-200 p-4 shadow-sm shrink-0">
      <div className="max-w-7xl mx-auto">
      

        <div className="flex  gap-6 bg-red-200">
          {/* Source Text Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-medium text-gray-900">Source Text</h3>
              </div>
              
              {/* Source Text Selection */}
              <div className="flex gap-2 items-center">
                <div className="relative flex-1 max-w-md">
                  <select
                    value={selectedTextId}
                    onChange={(e) => handleTextSelection(e.target.value)}
                    disabled={isLoadingTexts || loadTextContentMutation.isPending}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-white disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">
                      {(() => {
                        if (isLoadingTexts) return 'Loading texts...';
                        if (textsError) return 'Error loading texts';
                        return 'Select a text from API';
                      })()}
                    </option>
                    {availableTexts.map((text) => (
                      <option key={text.id} value={text.id}>
                        {text.title.bo || text.title.en || text.title[Object.keys(text.title)[0]] || `Text ${text.id}`}
                        {text.language && ` (${text.language})`}
                      </option>
                    ))}
                  </select>
                  {loadTextContentMutation.isPending && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <svg className="animate-spin h-4 w-4 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    </div>
                  )}
                </div>
                
                {/* Error display for texts loading */}
                {textsError && (
                  <div className="text-sm text-red-600 bg-red-50 px-2 py-1 rounded">
                    Failed to load texts
                  </div>
                )}
                
                <button
                  onClick={handleCreateText}
                  className="px-3 py-2 bg-purple-100 text-purple-700 text-sm rounded hover:bg-purple-200 transition-colors flex items-center gap-1 shrink-0"
                  title="Create new text using the Formatter"
                >
                  ✏️ Create Text
                </button>
                
           
              </div>
            </div>

         
          </div>

          {/* Target Text Section */}
          <div className="space-y-4">

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-medium text-gray-900">Target Text</h3>
              </div>
              
              {/* Target Actions */}
              <div className="flex gap-2">
                <button
                  onClick={() => targetFileRef.current?.click()}
                  className="px-3 py-2 bg-gray-100 text-gray-700 text-sm rounded hover:bg-gray-200 transition-colors flex items-center gap-1"
                  title="Upload text file from system"
                >
                  📁 Upload File
                </button>
                <button
                  onClick={handleTargetApiLoad}
                  disabled={isTargetApiLoading}
                  className="px-3 py-2 bg-green-100 text-green-700 text-sm rounded hover:bg-green-200 transition-colors flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Load text from API"
                >
                  {isTargetApiLoading ? (
                    <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  ) : (
                    '🌐'
                  )}
                  Load from API
                </button>
                
              </div>
              {selectedTextId && (
            <button
              onClick={handleClearAll}
              className="px-4 py-2 bg-red-100 text-red-700 text-sm rounded hover:bg-red-200 transition-colors"
            >
              Clear All
            </button>
          )}
            </div>

        

            {/* Hidden file input for target */}
            <input
              ref={targetFileRef}
              type="file"
              accept=".txt,text/plain"
              onChange={handleTargetFileUpload}
              className="hidden"
            />


          </div>
        </div>
      </div>
    </div>
  );
};

export default TextSelector;
