import React from 'react';
import CodeMirror, { type ReactCodeMirrorRef } from '@uiw/react-codemirror';
import { EditorSelection } from '@codemirror/state';
import { EditorView } from '@codemirror/view';
import TextLoader from './TextLoader';
import type { TextSelection, SelectionHandler, TextMapping, EditorType } from '../types';
import { useTextSelectionStore } from '../../../stores/textSelectionStore';
import { root_text } from '../../../data/text';

interface TextEditorProps {
  ref: React.RefObject<ReactCodeMirrorRef | null> | null;
  isEditable: boolean;
  editorId: string;
  editorType: EditorType;
  onSelectionChange?: SelectionHandler;
  mappings?: TextMapping[];
  onTextLoad?: (text: string, source: 'file' | 'api') => void;
}

function TextEditor({
  ref,
  isEditable,
  editorId,
  editorType,
  onSelectionChange,
  mappings = [],
  onTextLoad
}: TextEditorProps) {
  // Zustand store
  const {
    sourceText, isSourceLoaded,
    targetText, isTargetLoaded
  } = useTextSelectionStore();

  let currentText = editorType === 'source' ? sourceText : targetText;
  const isTextLoaded = editorType === 'source' ? isSourceLoaded : isTargetLoaded;
  
  // Local UI state
  if(!currentText || currentText === ''){
    console.log('currentText is empty');
    currentText = root_text;
  }
  const [value, setValue] = React.useState(currentText);
  const [currentSelection, setCurrentSelection] = React.useState<TextSelection | null>(null);

  // Update value when store text changes
  React.useEffect(() => {
    setValue(currentText);
    // Clear current selection when text changes
    setCurrentSelection(null);
    if (onSelectionChange) {
      onSelectionChange.onSelectionClear(editorId);
    }
  }, [currentText, editorId, onSelectionChange]);
  
  const onChange = React.useCallback((val: string) => {
    console.log('val:', val);
    setValue(val);
  }, []);

  // Handle text selection
  const handleSelectionChange = React.useCallback((selection: EditorSelection) => {
    if (onSelectionChange) {
      const range = selection.main;
      if (range.from === range.to) {
        setCurrentSelection(null);
        onSelectionChange.onSelectionClear(editorId);
      } else {
        // For target editor, only allow selection if there's a source selection
        if (editorType === 'target' && !isSourceLoaded) {
          // Clear the selection and show a message
          setCurrentSelection(null);
          return;
        }
        
        const selectedText = value.slice(range.from, range.to);
        const textSelection: TextSelection = {
          text: selectedText,
          start: range.from,
          end: range.to,
          editorId
        };
        
        setCurrentSelection(textSelection);
        onSelectionChange.onTextSelect(textSelection);
      }
    }
  }, [value, editorId, onSelectionChange, editorType, isSourceLoaded]);

  // Only allow Enter key when isEditable is true
  const handleKeyDown = React.useCallback((event: React.KeyboardEvent) => {
    if (isEditable && event.key !== 'Enter') {
      event.preventDefault();
      event.stopPropagation();
    }
  }, [isEditable]);

  // Handle text loading from file or API
  const handleTextLoad = React.useCallback((text: string, source: 'file' | 'api') => {
    setValue(text);
    if (onTextLoad) {
      onTextLoad(text, source);
    }
  }, [onTextLoad]);


  return (
    <div className="relative h-full editor-container overflow-hidden">
      {/* Text Loader for Target Editor */}
      {editorType === 'target' && onTextLoad && (
        <TextLoader onTextLoad={handleTextLoad} />
      )}

      {/* Editor Container with proper width constraints */}
      <div className="w-full h-full box-border relative" style={{ fontFamily: 'var(--font-monlam)' }}>
        <CodeMirror 
          value={value}  
          height="100%" 
          width="100%"
          ref={ref}
          className="w-full h-full text-lg" 
          onChange={onChange}  
          editable={isEditable}
          onKeyDown={handleKeyDown}
          onUpdate={(viewUpdate) => {
            if (viewUpdate.selectionSet) {
              handleSelectionChange(viewUpdate.state.selection);
            }
          }}
          basicSetup={{
            lineNumbers: true,
            foldGutter: true,
            dropCursor: false,
            allowMultipleSelections: false,
            indentOnInput: true,
            bracketMatching: true,
            closeBrackets: true,
            autocompletion: true,
            highlightSelectionMatches: false,
          }}
          extensions={[
            // Enable line wrapping for text that exceeds container width
            EditorView.lineWrapping
          ]}
        />
        
        {/* Overlay message for target editor when no source selection */}
        {editorType === 'target' && !isSourceLoaded && (
          <div className="absolute inset-0 bg-gray-100 bg-opacity-75 flex items-center justify-center pointer-events-none">
            <div className="bg-white p-4 rounded-lg shadow-lg border-2 border-orange-200 text-center max-w-sm">
              <div className="text-orange-600 text-2xl mb-2">⚠️</div>
              <div className="text-sm font-medium text-gray-800 mb-1">
                Source Selection Required
              </div>
              <div className="text-xs text-gray-600">
                Please select both text and instance in the source editor first before selecting target text for alignment.
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Selection indicator */}
      {currentSelection && (
        <div className="absolute top-2 right-2 bg-blue-500 text-white px-3 py-2 rounded-lg shadow-lg selection-indicator animate-pulse">
          <div className="text-xs font-medium mb-1">Selected Text</div>
          <div className="text-sm">
            "{currentSelection.text && currentSelection.text.length > 30 
              ? `${currentSelection.text.substring(0, 30)}...` 
              : currentSelection.text || ''}"
          </div>
          <div className="text-xs opacity-75 mt-1">
            Position: {currentSelection.start || 0}-{currentSelection.end || 0}
          </div>
        </div>
      )}

      {/* Mapping count indicator */}
      {mappings.length > 0 && (
        <div className="absolute bottom-2 left-2 bg-green-500 text-white px-2 py-1 rounded text-xs font-medium">
          {mappings.length} mapping{mappings.length === 1 ? '' : 's'}
        </div>
      )}
    </div>
  );
}

export default TextEditor;
