import { createContext } from 'react';
import type { ReactCodeMirrorRef } from '@uiw/react-codemirror';
import type { SentenceMapping } from './types';

export interface EditorContextValue {
  sourceEditorRef: React.RefObject<ReactCodeMirrorRef | null>;
  targetEditorRef: React.RefObject<ReactCodeMirrorRef | null>;
  getSourceContent: () => string | undefined;
  getTargetContent: () => string | undefined;
  generateSentenceMappings: () => SentenceMapping[];
}

export const EditorContext = createContext<EditorContextValue | undefined>(undefined);













