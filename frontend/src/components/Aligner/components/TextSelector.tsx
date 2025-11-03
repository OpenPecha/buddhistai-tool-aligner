import React, { useState, useRef } from 'react';

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
  const [sourceText, setSourceText] = useState('');
  const [targetText, setTargetText] = useState('');
  const targetFileRef = useRef<HTMLInputElement>(null);
  const [isSourceApiLoading, setIsSourceApiLoading] = useState(false);
  const [isTargetApiLoading, setIsTargetApiLoading] = useState(false);


  // Handle file upload for target text only
  const handleTargetFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file?.type === 'text/plain') {
      try {
        const text = await file.text();
        setTargetText(text);
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

  const handleLoadText = (type: 'source' | 'target') => {
    const text = type === 'source' ? sourceText : targetText;
    if (text.trim()) {
      if (type === 'source') {
        onSourceTextSelect(text);
      } else {
        onTargetTextSelect(text);
      }
    } else {
      alert(`Please enter or select ${type} text first.`);
    }
  };

  // Handle API loading for source text
  const handleSourceApiLoad = async () => {
    setIsSourceApiLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      const mockSourceText = `རིན་ཆེན་སེམས་དེ་གཟུང་བར་བྱ་བའི་ཕྱིར། །དེ་བཞིན་གཤེགས་པ་རྣམས་དང་དམ་པའི་ཆོས། །དཀོན་མཆོག་དྲི་མ་མེད་དང་སངས་རྒྱས་སྲས། །ཡོན་ཏན་རྒྱ་མཚོ་རྣམས་ལ་ལེགས་པར་མཆོད། །
མེ་ཏོག་འབྲས་བུ་ཇི་སྙེད་ཡོད་པ་དང་། །སྨན་གྱི་རྣམ་པ་གང་དག་ཡོད་པ་དང་། །འཇིག་རྟེན་རིན་ཆེན་ཇི་སྙེད་ཡོད་པ་དང་། །ཆུ་གཙང་ཡིད་དུ་འོང་བ་ཅི་ཡོད་དང་། །
རིན་ཆེན་རི་བོ་དང་ནི་དེ་བཞིན་དུ། །ནགས་ཚལ་ས་ཕྱོགས་དབེན་ཞིང་ཉམས་དགའ་དང་། །ལྗོན་ཤིང་མེ་ཏོག་རྒྱན་སྤྲས་སྤུད་པ་དང་། །ཤིང་གང་འབྲས་བཟང་ཡལ་ག་དུད་པ་དང་། །`;
      setSourceText(mockSourceText);
    } catch (error) {
      console.error('Error loading text from API:', error);
      alert('Failed to load text from API. Please try again.');
    } finally {
      setIsSourceApiLoading(false);
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
      setTargetText(mockTargetText);
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
    setSourceText('');
    setTargetText('');
    if (onClearAll) {
      onClearAll();
    }
  };

  return (
    <div className="bg-white border-b border-gray-200 p-4 shadow-sm flex-shrink-0">
      <div className="max-w-7xl mx-auto">
     
         

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Source Text Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <h3 className="text-sm font-medium text-gray-900">Source Text</h3>
              </div>
              
              {/* Source Actions */}
              <div className="flex gap-2">
                <button
                  onClick={handleCreateText}
                  className="px-3 py-2 bg-purple-100 text-purple-700 text-sm rounded hover:bg-purple-200 transition-colors flex items-center gap-1"
                  title="Create new text using the Formatter"
                >
                  ✏️ Create Text
                </button>
                <button
                  onClick={handleSourceApiLoad}
                  disabled={isSourceApiLoading}
                  className="px-3 py-2 bg-green-100 text-green-700 text-sm rounded hover:bg-green-200 transition-colors flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Load text from API"
                >
                  {isSourceApiLoading ? (
                    <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  ) : (
                    '🌐'
                  )}
                  Load from API
                </button>
                <button
                  onClick={() => handleLoadText('source')}
                  disabled={!sourceText.trim()}
                  className="px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Load Source Text
                </button>
              </div>
            </div>

            {/* Source Text Display */}
            {sourceText && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="text-sm text-gray-800 font-medium mb-1" style={{ fontFamily: 'var(--font-monlam)' }}>
                  {sourceText.length > 150 ? `${sourceText.substring(0, 150)}...` : sourceText}
                </div>
                <div className="text-xs text-gray-500">
                  Length: {sourceText.length} characters
                </div>
              </div>
            )}
          </div>

          {/* Target Text Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
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
                <button
                  onClick={() => handleLoadText('target')}
                  disabled={!targetText.trim()}
                  className="px-4 py-2 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Load Target Text
                </button>
              </div>
            </div>

            {/* Target Text Display */}
            {targetText && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <div className="text-sm text-gray-800 font-medium mb-1">
                  {targetText.length > 150 ? `${targetText.substring(0, 150)}...` : targetText}
                </div>
                <div className="text-xs text-gray-500">
                  Length: {targetText.length} characters
                </div>
              </div>
            )}

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
