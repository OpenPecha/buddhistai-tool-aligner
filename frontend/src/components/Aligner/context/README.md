# EditorContext Usage

The `EditorContext` provides access to both source and target editor refs throughout the component tree.

## Usage Example

```tsx
import { useEditorContext, type SentenceMapping } from '../context';

function YourComponent() {
  const { 
    sourceEditorRef, 
    targetEditorRef, 
    getSourceContent, 
    getTargetContent,
    generateSentenceMappings 
  } = useEditorContext();
  
  const handleSomeAction = () => {
    // Get the current content from the editors
    const sourceContent = getSourceContent();
    const targetContent = getTargetContent();
    
    console.log('Source:', sourceContent);
    console.log('Target:', targetContent);
    
    // Generate sentence mappings
    const mappings = generateSentenceMappings();
    console.log('Mappings:', mappings);
    // Output example:
    // [
    //   { source: { start: 0, end: 100 }, target: { start: 0, end: 200 } },
    //   { source: { start: 101, end: 250 }, target: { start: 201, end: 380 } },
    //   ...
    // ]
    
    // You can also access the refs directly
    if (sourceEditorRef.current?.view) {
      // Do something with the CodeMirror view
      const state = sourceEditorRef.current.view.state;
      // ...
    }
  };
  
  return (
    <button onClick={handleSomeAction}>
      Get Editor Contents
    </button>
  );
}
```

## Available Methods

- `sourceEditorRef`: React ref to the source editor (CodeMirror)
- `targetEditorRef`: React ref to the target editor (CodeMirror)
- `getSourceContent()`: Returns the current text content from source editor
- `getTargetContent()`: Returns the current text content from target editor
- `generateSentenceMappings()`: Generates sentence-to-sentence mappings between source and target editors

## Sentence Mapping

The `generateSentenceMappings()` function automatically:
1. Splits both source and target texts into sentences
2. Creates 1:1 mappings between corresponding sentences
3. Returns an array of mappings with character positions

### Mapping Format

```typescript
interface SentenceMapping {
  source: { start: number; end: number };  // Character positions in source text (start-inclusive, end-exclusive)
  target: { start: number; end: number };  // Character positions in target text (start-inclusive, end-exclusive)
}
```

**Important:** Positions follow standard JavaScript substring behavior:
- `start`: Index of the first character (inclusive)
- `end`: Index after the last character (exclusive)

Example:
```typescript
const mapping = { source: { start: 0, end: 5 }, target: { start: 0, end: 7 } };
const sourceText = "Hello\nWorld";
const targetText = "Bonjour\nMonde";

// Extract text using substring (end is exclusive)
const sourceSentence = sourceText.substring(mapping.source.start, mapping.source.end); // "Hello"
const targetSentence = targetText.substring(mapping.target.start, mapping.target.end); // "Bonjour"
```

### Sentence Detection

The function splits text by:
- Sentence terminators: `.`, `!`, `?`
- Tibetan sentence terminators: `།` (shad), `༎` (double shad)
- Line breaks (fallback if no terminators found)

## Notes

- The context is provided by `EditorProvider` which wraps the entire `Aligner` component
- You can use `useEditorContext()` hook from any component within the Aligner component tree
- The hook will throw an error if used outside of `EditorProvider`
- If source and target have different sentence counts, mappings are created for the minimum count

