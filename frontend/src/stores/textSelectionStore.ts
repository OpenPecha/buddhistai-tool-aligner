import { create } from 'zustand';

interface TextSelectionState {
  // Source state
  sourceTextId: string | null;
  sourceInstanceId: string | null;
  sourceText: string;
  isSourceLoaded: boolean;
  
  // Target state  
  targetTextId: string | null;
  targetInstanceId: string | null;
  targetText: string;
  isTargetLoaded: boolean;
  
  // Actions
  setSourceText: (textId: string, instanceId: string, content: string) => void;
  setTargetText: (textId: string, instanceId: string, content: string) => void;
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
  
  // Initial target state
  targetTextId: null,
  targetInstanceId: null,
  targetText: '',
  isTargetLoaded: false,
  
  // Actions
  setSourceText: (textId: string, instanceId: string, content: string) =>
    set({
      sourceTextId: textId,
      sourceInstanceId: instanceId,
      sourceText: content,
      isSourceLoaded: true,
    }),
    
  setTargetText: (textId: string, instanceId: string, content: string) =>
    set({
      targetTextId: textId,
      targetInstanceId: instanceId,
      targetText: content,
      isTargetLoaded: true,
    }),
    
  clearSourceSelection: () =>
    set({
      sourceTextId: null,
      sourceInstanceId: null,
      sourceText: '',
      isSourceLoaded: false,
    }),
    
  clearTargetSelection: () =>
    set({
      targetTextId: null,
      targetInstanceId: null,
      targetText: '',
      isTargetLoaded: false,
    }),
    
  clearAllSelections: () =>
    set({
      sourceTextId: null,
      sourceInstanceId: null,
      sourceText: '',
      isSourceLoaded: false,
      targetTextId: null,
      targetInstanceId: null,
      targetText: '',
      isTargetLoaded: false,
    }),
}));
