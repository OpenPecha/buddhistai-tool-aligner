import Editor from "../Editor";
import TextSelector from "../TextSelector";

function FirstPanel({ onTextSelect, selectedText, selectedTextId, placeholder }: Readonly<{
    onTextSelect: (text: string, textId: string) => void;
    selectedText: string | null;
    selectedTextId: string | null;
    placeholder: string;
}>) {



    if (selectedText) {
        return (
            <div className="h-full flex flex-col">
                <div className="p-2 bg-gray-100 border-b flex justify-between items-center">
                    <div className="text-sm text-gray-600">
                        <span>Text Selected</span>
                        {selectedTextId && (
                            <span className="ml-2 text-xs text-blue-600">ID: {selectedTextId}</span>
                        )}
                    </div>
                    <button 
                        onClick={() => {
                            onTextSelect('', '');
                        }}
                        className="text-xs bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600"
                    >
                        Clear Selection
                    </button>
                </div>
                <div className="flex-1">
                    <Editor 
                        initialValue={selectedText} 
                        ref={null} 
                        isEditable={false}
                    />
                </div>
            </div>
        );
    }

    return (
      <TextSelector placeholder={placeholder} onTextSelect={onTextSelect} />
    );
}

export default FirstPanel;