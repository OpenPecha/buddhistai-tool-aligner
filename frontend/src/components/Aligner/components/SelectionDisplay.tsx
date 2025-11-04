import React, { useState, useRef } from 'react';

interface TextSelectorProps {
  onSourceTextSelect: (text: string) => void;
  onTargetTextSelect: (text: string) => void;
}

const TextSelector: React.FC<TextSelectorProps> = ({
  onSourceTextSelect,
  onTargetTextSelect,
}) => {
  const [sourceText, setSourceText] = useState('');
  const [targetText, setTargetText] = useState('');
  const sourceFileRef = useRef<HTMLInputElement>(null);
  const targetFileRef = useRef<HTMLInputElement>(null);

  // Sample texts for quick selection
  const sampleTexts = {
    source: [
      'རིན་ཆེན་སེམས་དེ་གཟུང་བར་བྱ་བའི་ཕྱིར། །དེ་བཞིན་གཤེགས་པ་རྣམས་དང་དམ་པའི་ཆོས། །དཀོན་མཆོག་དྲི་མ་མེད་དང་སངས་རྒྱས་སྲས། །ཡོན་ཏན་རྒྱ་མཚོ་རྣམས་ལ་ལེགས་པར་མཆོད།',
      'མེ་ཏོག་འབྲས་བུ་ཇི་སྙེད་ཡོད་པ་དང་། །སྨན་གྱི་རྣམ་པ་གང་དག་ཡོད་པ་དང་། །འཇིག་རྟེན་རིན་ཆེན་ཇི་སྙེད་ཡོད་པ་དང་། །ཆུ་གཙང་ཡིད་དུ་འོང་བ་ཅི་ཡོད་དང་།',
      'རིན་ཆེན་རི་བོ་དང་ནི་དེ་བཞིན་དུ། །ནགས་ཚལ་ས་ཕྱོགས་དབེན་ཞིང་ཉམས་དགའ་དང་། །ལྗོན་ཤིང་མེ་ཏོག་རྒྱན་སྤྲས་སྤུད་པ་དང་། །ཤིང་གང་འབྲས་བཟང་ཡལ་ག་དུད་པ་དང་།'
    ],
    target: [
      'In order to maintain this precious mind, I properly offer to the Tathagatas and the sublime Dharma, to the stainless Triple Gem and the Buddha\'s children, oceans of good qualities.',
      'Whatever flowers and fruits there are, whatever varieties of medicine exist, whatever precious things there are in the world, and whatever pure and pleasant waters there are.',
      'Likewise precious mountains, and forests in quiet and delightful places, trees adorned with flowers and garlands, and trees whose branches are heavy with good fruit.'
    ]
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>, type: 'source' | 'target') => {
    const file = event.target.files?.[0];
    if (file && file.type === 'text/plain') {
      try {
        const text = await file.text();
        if (type === 'source') {
          setSourceText(text);
        } else {
          setTargetText(text);
        }
      } catch (error) {
        console.error('Error reading file:', error);
        alert('Error reading file. Please try again.');
      }
    } else {
      alert('Please select a valid text file (.txt)');
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

  const handleSampleSelect = (text: string, type: 'source' | 'target') => {
    if (type === 'source') {
      setSourceText(text);
    } else {
      setTargetText(text);
    }
  };

  return (
    <div className="bg-white border-b border-gray-200 p-6 shadow-sm">
      <div className="max-w-7xl mx-auto">

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Source Text Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <h3 className="text-sm font-medium text-gray-900">Source Text</h3>
            </div>

            {/* Source Text Input */}
            <textarea
              value={sourceText}
              onChange={(e) => setSourceText(e.target.value)}
              placeholder="Enter source text or select from samples below..."
              className="w-full h-32 p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              style={{ fontFamily: 'var(--font-monlam)' }}
            />

            {/* Source Actions */}
            <div className="flex gap-2">
              <button
                onClick={() => sourceFileRef.current?.click()}
                className="px-3 py-2 bg-gray-100 text-gray-700 text-sm rounded hover:bg-gray-200 transition-colors"
              >
                📁 Upload File
              </button>
              <button
                onClick={() => handleLoadText('source')}
                className="px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
              >
                Load Source Text
              </button>
            </div>

            {/* Source Samples */}
            <div className="space-y-2">
              <div className="text-xs text-gray-600">Quick Select:</div>
              {sampleTexts.source.map((text, index) => (
                <button
                  key={index}
                  onClick={() => handleSampleSelect(text, 'source')}
                  className="w-full text-left p-2 text-xs bg-blue-50 hover:bg-blue-100 rounded border text-gray-700 transition-colors"
                  style={{ fontFamily: 'var(--font-monlam)' }}
                >
                  {text.length > 80 ? `${text.substring(0, 80)}...` : text}
                </button>
              ))}
            </div>

            <input
              ref={sourceFileRef}
              type="file"
              accept=".txt,text/plain"
              onChange={(e) => handleFileUpload(e, 'source')}
              className="hidden"
            />
          </div>

          {/* Target Text Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <h3 className="text-sm font-medium text-gray-900">Target Text</h3>
            </div>

            {/* Target Text Input */}
            <textarea
              value={targetText}
              onChange={(e) => setTargetText(e.target.value)}
              placeholder="Enter target text or select from samples below..."
              className="w-full h-32 p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
            />

            {/* Target Actions */}
            <div className="flex gap-2">
              <button
                onClick={() => targetFileRef.current?.click()}
                className="px-3 py-2 bg-gray-100 text-gray-700 text-sm rounded hover:bg-gray-200 transition-colors"
              >
                📁 Upload File
              </button>
              <button
                onClick={() => handleLoadText('target')}
                className="px-4 py-2 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition-colors"
              >
                Load Target Text
              </button>
            </div>

            {/* Target Samples */}
            <div className="space-y-2">
              <div className="text-xs text-gray-600">Quick Select:</div>
              {sampleTexts.target.map((text, index) => (
                <button
                  key={index}
                  onClick={() => handleSampleSelect(text, 'target')}
                  className="w-full text-left p-2 text-xs bg-green-50 hover:bg-green-100 rounded border text-gray-700 transition-colors"
                >
                  {text.length > 80 ? `${text.substring(0, 80)}...` : text}
                </button>
              ))}
            </div>

            <input
              ref={targetFileRef}
              type="file"
              accept=".txt,text/plain"
              onChange={(e) => handleFileUpload(e, 'target')}
              className="hidden"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default TextSelector;
