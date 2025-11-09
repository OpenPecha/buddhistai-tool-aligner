import { create } from 'zustand';

interface TextSelectionState {
  // Source state
  sourceTextId: string | null;
  sourceInstanceId: string | null;
  sourceText: string;
  isSourceLoaded: boolean;
  sourceLoadType: 'database' | 'file' | null; // Track how the text was loaded
  
  // Target state  
  targetTextId: string | null;
  targetInstanceId: string | null;
  targetText: string;
  isTargetLoaded: boolean;
  targetLoadType: 'database' | 'file' | null; // Track how the text was loaded
  
  // Actions
  setSourceText: (textId: string, instanceId: string, content: string, loadType?: 'database' | 'file') => void;
  setTargetText: (textId: string, instanceId: string, content: string, loadType?: 'database' | 'file') => void;
  setSourceTextFromFile: (content: string) => void;
  setTargetTextFromFile: (content: string) => void;
  clearSourceSelection: () => void;
  clearTargetSelection: () => void;
  clearAllSelections: () => void;
}

export const useTextSelectionStore = create<TextSelectionState>((set) => ({
  // Initial source state
  sourceTextId: null,
  sourceInstanceId: null,
  sourceText: '',
  isSourceLoaded: false,
  sourceLoadType: null,
  
  // Initial target state
  targetTextId: null,
  targetInstanceId: null,
  targetText: '',
  isTargetLoaded: false,
  targetLoadType: null,
  
  // Actions
  setSourceText: (textId: string, instanceId: string, content: string, loadType: 'database' | 'file' = 'database') =>
    set({
      sourceTextId: textId,
      sourceInstanceId: instanceId,
      sourceText: content,
      isSourceLoaded: true,
      sourceLoadType: loadType,
    }),
    
  setTargetText: (textId: string, instanceId: string, content: string, loadType: 'database' | 'file' = 'database') =>
    set({
      targetTextId: textId,
      targetInstanceId: instanceId,
      targetText: content,
      isTargetLoaded: true,
      targetLoadType: loadType,
    }),

  setSourceTextFromFile: (content: string) =>
    set({
      sourceTextId: 'file-upload',
      sourceInstanceId: 'file-instance',
      sourceText: content,
      isSourceLoaded: true,
      sourceLoadType: 'file',
    }),

  setTargetTextFromFile: (content: string) =>
    set({
      targetTextId: 'file-upload',
      targetInstanceId: 'file-instance',
      targetText: content,
      isTargetLoaded: true,
      targetLoadType: 'file',
    }),
    
  clearSourceSelection: () =>
    set({
      sourceTextId: null,
      sourceInstanceId: null,
      sourceText: '',
      isSourceLoaded: false,
      sourceLoadType: null,
    }),
    
  clearTargetSelection: () =>
    set({
      targetTextId: null,
      targetInstanceId: null,
      targetText: '',
      isTargetLoaded: false,
      targetLoadType: null,
    }),
    
  clearAllSelections: () =>
    set({
      sourceTextId: null,
      sourceInstanceId: null,
      sourceText: '',
      isSourceLoaded: false,
      sourceLoadType: null,
      targetTextId: null,
      targetInstanceId: null,
      targetText: '',
      isTargetLoaded: false,
      targetLoadType: null,
    }),
}));
