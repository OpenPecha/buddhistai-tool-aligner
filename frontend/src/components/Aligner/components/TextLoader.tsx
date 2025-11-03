import React, { useRef, useState } from 'react';

interface TextLoaderProps {
  onTextLoad: (text: string, source: 'file' | 'api') => void;
  isLoading?: boolean;
}

const TextLoader: React.FC<TextLoaderProps> = ({ onTextLoad, isLoading = false }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isApiLoading, setIsApiLoading] = useState(false);

  // Mock API text - replace with actual API call when available
  const mockApiText = `སངས་རྒྱས་ཆོས་དང་ཚོགས་ཀྱི་མཆོག་ལ་བདག
བྱང་ཆུབ་བར་དུ་སྐྱབས་སུ་མཆི།
བདག་གིས་སྦྱིན་སོགས་བགྱིས་པའི་བསོད་ནམས་ཀྱིས།
འགྲོ་ལ་ཕན་ཕྱིར་སངས་རྒྱས་འགྲུབ་པར་ཤོག

དེ་ནས་བྱང་ཆུབ་སེམས་དཔའ་སེམས་དཔའ་ཆེན་པོ་འཇམ་དཔལ་གཞོན་ནུར་གྱུར་པ་ལ་བཅོམ་ལྡན་འདས་ཀྱིས་བཀའ་སྩལ་པ།
འཇམ་དཔལ་ཇི་ལྟར་ན་བྱང་ཆུབ་སེམས་དཔའ་སེམས་དཔའ་ཆེན་པོ་རྣམས་ཀྱིས་ཤེས་རབ་ཀྱི་ཕ་རོལ་ཏུ་ཕྱིན་པ་ལ་སྤྱད་པར་བྱ།

འཇམ་དཔལ་གྱིས་གསོལ་པ།
བཅོམ་ལྡན་འདས་བྱང་ཆུབ་སེམས་དཔའ་སེམས་དཔའ་ཆེན་པོ་རྣམས་ཀྱིས་ཤེས་རབ་ཀྱི་ཕ་རོལ་ཏུ་ཕྱིན་པ་ལ་སྤྱད་པར་འདོད་ན།
གཟུགས་ལ་མི་གནས་པར་བྱ་སྟེ།
ཚོར་བ་དང་འདུ་ཤེས་དང་འདུ་བྱེད་རྣམས་དང་རྣམ་པར་ཤེས་པ་ལ་ཡང་མི་གནས་པར་བྱའོ།`;

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'text/plain') {
      try {
        const text = await file.text();
        onTextLoad(text, 'file');
        // Reset file input
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      } catch (error) {
        console.error('Error reading file:', error);
        alert('Error reading file. Please try again.');
      }
    } else {
      alert('Please select a valid text file (.txt)');
    }
  };

  const handleApiLoad = async () => {
    setIsApiLoading(true);
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // In a real implementation, this would be:
      // const response = await fetch('/api/text');
      // const text = await response.text();
      
      onTextLoad(mockApiText, 'api');
    } catch (error) {
      console.error('Error loading from API:', error);
      alert('Error loading text from API. Please try again.');
    } finally {
      setIsApiLoading(false);
    }
  };

  const handleFileClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="absolute top-2 right-2 z-10 flex gap-2">
      {/* File Upload Button */}
      <button
        onClick={handleFileClick}
        disabled={isLoading || isApiLoading}
        className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors duration-200 flex items-center gap-1"
        title="Load text from file"
      >
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
        </svg>
        File
      </button>

      {/* API Load Button */}
      <button
        onClick={handleApiLoad}
        disabled={isLoading || isApiLoading}
        className="px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors duration-200 flex items-center gap-1"
        title="Load text from API"
      >
        {isApiLoading ? (
          <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin"></div>
        ) : (
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
        )}
        API
      </button>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".txt,text/plain"
        onChange={handleFileUpload}
        className="hidden"
      />
    </div>
  );
};

export default TextLoader;
