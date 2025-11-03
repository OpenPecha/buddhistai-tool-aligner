import React from 'react';
import CodeMirror, { type ReactCodeMirrorRef } from '@uiw/react-codemirror';
import { EditorSelection } from '@codemirror/state';
import { EditorView } from '@codemirror/view';
import type { TextSelection, SelectionHandler, TextMapping, EditorType } from '../types';

type EditorPropsType = {
    readonly initialValue: string,
    readonly ref: React.RefObject<ReactCodeMirrorRef | null> | null,
    readonly isEditable: boolean,
    readonly editorId: string,
    readonly editorType: EditorType,
    readonly onSelectionChange?: SelectionHandler,
    readonly mappings?: TextMapping[],
}


function Editor({
  initialValue,
  ref,
  isEditable,
  editorId,
  editorType,
  onSelectionChange,
  mappings = []
}: EditorPropsType) {
  const [value, setValue] = React.useState(initialValue);
  const [currentSelection, setCurrentSelection] = React.useState<TextSelection | null>(null);
  
  // Update value when initialValue changes
  React.useEffect(() => {
    setValue(initialValue);
  }, [initialValue]);
  
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
  }, [value, editorId, onSelectionChange]);

  // Only allow Enter key when isEditable is true
  const handleKeyDown = React.useCallback((event: React.KeyboardEvent) => {
    if (isEditable && event.key !== 'Enter') {
      event.preventDefault();
      event.stopPropagation();
    }
  }, [isEditable]);

  // Note: Highlighting decorations would be implemented using CodeMirror extensions
  // For now, we'll use CSS classes and visual indicators

  return (
    <div className="relative  h-full editor-container overflow-hidden">
      {/* Editor Type Label */}
     

      {/* Editor Container with proper width constraints */}
      <div className="w-full h-full box-border" style={{ fontFamily: 'var(--font-monlam)' }}>
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
      </div>
      
      {/* Selection indicator */}
      {currentSelection && (
        <div className="absolute top-2 right-2 bg-blue-500 text-white px-3 py-2 rounded-lg shadow-lg selection-indicator animate-pulse">
          <div className="text-xs font-medium mb-1">Selected Text</div>
          <div className="text-sm">
            "{currentSelection.text.length > 30 
              ? `${currentSelection.text.substring(0, 30)}...` 
              : currentSelection.text}"
          </div>
          <div className="text-xs opacity-75 mt-1">
            Position: {currentSelection.start}-{currentSelection.end}
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
export default Editor;
