import React from 'react';
import CodeMirror, { type ReactCodeMirrorRef } from '@uiw/react-codemirror';
import { EditorSelection } from '@codemirror/state';
import { EditorView, keymap } from '@codemirror/view';
import { Prec } from '@codemirror/state';
import TextLoader from './TextLoader';
import type { TextSelection, SelectionHandler, TextMapping, EditorType } from '../types';
import { useTextSelectionStore } from '../../../stores/textSelectionStore';
import { root_text } from '../../../data/text';
import { generateFileSegmentation, applySegmentation } from '../../../lib/annotation';

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
    sourceText, 
    isSourceLoaded,
    targetText, 
    isTargetLoaded,
    setSourceTextFromFile,
    setTargetTextFromFile
  } = useTextSelectionStore();

  let currentText = editorType === 'source' ? sourceText : targetText;
  const isTextLoaded = editorType === 'source' ? isSourceLoaded : isTargetLoaded;
  // Local UI state - only use root_text if no text has been loaded yet
  if(!isTextLoaded && (!currentText || currentText === '')){
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

  // Prevent backspace and delete keys
  const handleKeyDown = React.useCallback((event: React.KeyboardEvent) => {
    // Block backspace and delete keys
    if (event.key === 'Backspace' || event.key === 'Delete') {
      event.preventDefault();
      event.stopPropagation();
      return;
    }
    
    // Block Ctrl/Cmd + X (cut) and Ctrl/Cmd + D (delete line)
    if ((event.ctrlKey || event.metaKey) && (event.key === 'x' || event.key === 'X' || event.key === 'd' || event.key === 'D')) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }
    
    // Only allow Enter key when isEditable is true
    if (isEditable && event.key !== 'Enter') {
      event.preventDefault();
      event.stopPropagation();
    }
  }, [isEditable]);

  // Handle text loading from file or API
  const handleTextLoad = React.useCallback((text: string, source: 'file' | 'api') => {
    let processedText = text;
    
    // For file uploads, apply segmentation based on existing newlines
    if (source === 'file') {
      const fileSegmentation = generateFileSegmentation(text);
      if (fileSegmentation.length > 0) {
        processedText = applySegmentation(text, fileSegmentation);
      }
      
      // Update the store with the processed text
      if (editorType === 'source') {
        setSourceTextFromFile(processedText);
      } else if (editorType === 'target') {
        setTargetTextFromFile(processedText);
      }
    } else {
      // For API loads, just set the value directly
      setValue(processedText);
    }
    
    if (onTextLoad) {
      onTextLoad(processedText, source);
    }
  }, [onTextLoad, editorType, setSourceTextFromFile, setTargetTextFromFile]);
//  const showSourceSelectionRequired = editorType === 'target' && !isSourceLoaded;
const showSourceSelectionRequired = false;

  // Create extension to block deletion keys
  const blockDeletionExtension = React.useMemo(() => {
    return Prec.highest(keymap.of([
      {
        key: 'Backspace',
        run: () => true, // Return true to prevent default behavior
      },
      {
        key: 'Delete',
        run: () => true,
      },
      {
        key: 'Mod-x', // Ctrl+X or Cmd+X
        run: () => true,
      },
      {
        key: 'Mod-d', // Ctrl+D or Cmd+D
        run: () => true,
      },
    ]));
  }, []);

  return (
    <div className="relative h-full editor-container overflow-hidden">
      {/* Text Loader for both Source and Target Editors */}
      {/* {onTextLoad && (
        <TextLoader onTextLoad={handleTextLoad} />
      )} */}

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
            EditorView.lineWrapping,
            // Block deletion keys at editor level
            blockDeletionExtension
          ]}
        />
        
        {/* Overlay message for target editor when no source selection */}
        {showSourceSelectionRequired && (
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
