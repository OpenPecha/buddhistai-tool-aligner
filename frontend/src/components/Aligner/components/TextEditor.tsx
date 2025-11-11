import React from 'react';
import CodeMirror, { type ReactCodeMirrorRef } from '@uiw/react-codemirror';
import { EditorSelection, Prec } from '@codemirror/state';
import { EditorView, keymap } from '@codemirror/view';
import type { TextSelection, SelectionHandler, TextMapping, EditorType } from '../types';
import { useTextSelectionStore } from '../../../stores/textSelectionStore';
import { useEditorContext } from '../context';
import { root_text } from '../../../data/text';

interface TextEditorProps {
  readonly ref: React.RefObject<ReactCodeMirrorRef | null> | null;
  readonly isEditable: boolean;
  readonly editorId: string;
  readonly editorType: EditorType;
  readonly onSelectionChange?: SelectionHandler;
  readonly mappings?: TextMapping[];
}

function TextEditor({
  ref,
  isEditable,
  editorId,
  editorType,
  onSelectionChange,
  mappings = []
}: TextEditorProps) {
  // Editor context for scroll synchronization
  const { syncScrollToLine, syncToClickedLine, isScrollSyncing } = useEditorContext();
  
  // Zustand store
  const {
    sourceText, 
    isSourceLoaded,
    targetText, 
    isTargetLoaded,
    targetTextId,
    targetLoadType,
    setTargetTextFromFile
  } = useTextSelectionStore();
  let currentText = editorType === 'source' ? sourceText : targetText;
  const isTextLoaded = editorType === 'source' ? isSourceLoaded : isTargetLoaded;
  
  // Track if this target editor was initially empty (to maintain editability)
  const [wasInitiallyEmptyTarget] = React.useState(() => 
    editorType === 'target' && targetTextId === 'empty-target'
  );
  
  // Determine if editor should be fully editable (allow text input, backspace, delete)
  // For target editor: when it was initially empty OR when it's loaded from file (user input)
  // For source editor: never fully editable (keep current behavior)
  const isFullyEditable = editorType === 'target' && 
    (wasInitiallyEmptyTarget || targetLoadType === 'file');
  
  // Debug logging
  React.useEffect(() => {
    if (editorType === 'target') {
      console.log('TextEditor Debug:', {
        targetTextId,
        targetLoadType,
        wasInitiallyEmptyTarget,
        isFullyEditable,
        currentText: currentText.substring(0, 50) + '...'
      });
    }
  }, [editorType, targetTextId, targetLoadType, wasInitiallyEmptyTarget, isFullyEditable, currentText]);
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
    
    // If this is a target editor that should be editable, update the store with the new content
    if (editorType === 'target' && (wasInitiallyEmptyTarget || targetLoadType === 'file')) {
      setTargetTextFromFile(val);
    }
  }, [editorType, wasInitiallyEmptyTarget, targetLoadType, setTargetTextFromFile]);

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

  // Handle key restrictions based on editor type and state
  const handleKeyDown = React.useCallback((event: React.KeyboardEvent) => {
    // If fully editable (empty target), allow all keys
    if (isFullyEditable) {
      return; // Allow all keyboard input
    }
    
    // For non-fully-editable editors, block destructive keys
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
    
    // Only allow Enter key when isEditable is true (for selection-only mode)
    if (isEditable && event.key !== 'Enter') {
      event.preventDefault();
      event.stopPropagation();
    }
  }, [isEditable, isFullyEditable]);

  // Handle scroll synchronization with throttling
  const lastScrollLineRef = React.useRef<number>(0);
  const handleScroll = React.useCallback((view: EditorView) => {
    if (isScrollSyncing.current) return; // Don't sync if we're already syncing
    
    try {
      // Get the current viewport
      const viewport = view.viewport;
      const doc = view.state.doc;
      
      // Find the line number at the top of the viewport
      const topLine = doc.lineAt(viewport.from);
      const lineNumber = topLine.number;
      
      // Only sync if the line number has changed significantly (avoid micro-scrolls)
      if (Math.abs(lineNumber - lastScrollLineRef.current) >= 1) {
        lastScrollLineRef.current = lineNumber;
        // Sync the other editor to this line
        syncScrollToLine(editorType, lineNumber);
      }
    } catch (error) {
      console.error('Error handling scroll:', error);
    }
  }, [editorType, syncScrollToLine, isScrollSyncing]);

  // Handle click synchronization
  const handleClick = React.useCallback((view: EditorView, event: MouseEvent) => {
    try {
      // Get the position where the user clicked
      const pos = view.posAtCoords({ x: event.clientX, y: event.clientY });
      if (pos !== null) {
        // Trigger synchronization to the clicked line
        syncToClickedLine(pos, editorType);
      }
    } catch (error) {
      console.error('Error handling click:', error);
    }
  }, [editorType, syncToClickedLine]);

  const showSourceSelectionRequired = false;

  // Create extension to block deletion keys (only when not fully editable)
  const blockDeletionExtension = React.useMemo(() => {
    // If fully editable, return empty extension (allow all keys)
    if (isFullyEditable) {
      return [];
    }
    
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
  }, [isFullyEditable]);

  // Create scroll synchronization extension
  const scrollSyncExtension = React.useMemo(() => {
    return EditorView.updateListener.of((update) => {
      // Only handle scroll events, not other updates
      if (update.geometryChanged || update.viewportChanged) {
        handleScroll(update.view);
      }
    });
  }, [handleScroll]);

  // Create click synchronization extension
  const clickSyncExtension = React.useMemo(() => {
    return EditorView.domEventHandlers({
      click: (event, view) => {
        handleClick(view, event);
        return false; // Don't prevent default click behavior
      }
    });
  }, [handleClick]);

  return (
    <div className="relative h-full editor-container overflow-hidden">
   

      {/* Editor Container with proper width constraints */}
      <div className="w-full h-full box-border relative" style={{ fontFamily: 'var(--font-monlam)' }}>
        <CodeMirror 
          value={value}  
          height="100%" 
          width="100%"
          ref={ref}
          className="w-full h-full text-lg" 
          onChange={onChange}  
          editable={isFullyEditable || isEditable}
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
            blockDeletionExtension,
            // Scroll synchronization
            scrollSyncExtension,
            // Click synchronization
            clickSyncExtension
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
