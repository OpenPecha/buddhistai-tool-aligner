import { useState } from 'react'
import Navbar from './Navbar'
import { getAnnotation } from '../lib/annotation'
import FirstPanel from './panels/FirstPanel'
import SecondPanel from './panels/SecondPanel'
import TextMapper from './TextMapper'


function EditorWrapper() {
    const [mode, setMode] = useState<'alignment' | 'mapper'>('alignment');
    const [firstPanelSelectedText, setFirstPanelSelectedText] = useState<string | null>(null);
    const [firstPanelSelectedTextId, setFirstPanelSelectedTextId] = useState<string | null>(null);
  
    const handleFirstPanelTextSelect = (text: string, textId: string) => {
        setFirstPanelSelectedText(text);
        setFirstPanelSelectedTextId(textId);
    };

    const handleSubmit = () => {
        if (!firstPanelSelectedText || !firstPanelSelectedTextId) {
            alert('Please select a text in the first panel before analyzing alignment.');
            return;
        }

        const annotation = getAnnotation(firstPanelSelectedText);
        console.log('Selected text annotation:', annotation);
        console.log('Text ID for alignment analysis:', firstPanelSelectedTextId);
    };

    if (mode === 'mapper') {
        return (
            <div className="h-screen w-full flex flex-col">
                <Navbar />
                <div className="p-2 bg-gray-100 border-b flex justify-between items-center">
                    <div className="flex gap-2">
                        <button
                            onClick={() => setMode('alignment')}
                            className="px-3 py-1 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
                        >
                            ← Back to Alignment
                        </button>
                    </div>
                    <h2 className="text-lg font-semibold text-gray-800">Text Mapping Mode</h2>
                    <div></div>
                </div>
                <TextMapper />
            </div>
        );
    }

    return (
      <div className="h-screen w-full flex flex-col">
        <Navbar/>
        <div className="p-2 bg-gray-100 border-b flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-800">Alignment Analysis Mode</h2>
            <button
                onClick={() => setMode('mapper')}
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
            >
                Switch to Text Mapper
            </button>
        </div>
        <div className="flex flex-1">
                <div className="w-1/2 border-r">
                    <FirstPanel 
                        onTextSelect={handleFirstPanelTextSelect}
                        selectedText={firstPanelSelectedText}
                        selectedTextId={firstPanelSelectedTextId}
                        placeholder="Select a text to begin alignment analysis."
                    />
          </div>
          <div className="w-1/2">
                    <SecondPanel 
                        selectedTextFromFirstPanel={firstPanelSelectedText}
                        selectedTextIdFromFirstPanel={firstPanelSelectedTextId}
                    />
                </div>
            </div>
            <div className="p-4 bg-gray-100 border-t">
                <div className="flex justify-between items-center">
                    <div className="text-sm text-gray-600">
                        {firstPanelSelectedText ? (
                            <span>✓ Text selected - Alignment analysis will appear in the right panel</span>
                        ) : (
                            <span>Select a text in the left panel to view alignment analysis</span>
                        )}
                    </div>
                    <button 
                        onClick={handleSubmit} 
                        className="bg-blue-500 text-white px-6 py-2 rounded-md hover:bg-blue-600 transition-colors disabled:bg-gray-400"
                        disabled={!firstPanelSelectedText || !firstPanelSelectedTextId}
                    >
                        Export Analysis
                    </button>
                </div>
          </div>
        </div>
    );
}





export default EditorWrapper
