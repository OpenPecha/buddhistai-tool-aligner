# Formatter Component

A comprehensive text formatting and mapping component with tree structure visualization, **horizontal drag-and-drop** functionality, and text alignment capabilities.

## 🎯 Horizontal Drag & Drop

**Key Concept:** All drag operations are HORIZONTAL - nodes can only move left/right within their hierarchical level.

```
Level 0:  [1]     [2]     [3]      ← Horizontal alignment
           ↕       ↕       ↕
Level 1:  [1.1]   [2.1]   [3.1]    ← One level right (indented)

Operations:
→  Indent right (nest into adjacent sibling)
←  Outdent left (move to parent level)  
↔️  Swap with adjacent sibling (same level)
❌  No vertical jumps across levels
```

### Quick Rules
- ✅ Swap Node 2 ↔️ Node 1 or 3 (adjacent only, same level)
- ✅ Indent Node 2 → 1.1 (if adjacent)
- ✅ Outdent Node 1.1 ← Node 2 (to parent level)
- ❌ Node 3 CANNOT jump to position 1 (distance = 2, use 2 swaps)

📚 **Documentation:**
- [HORIZONTAL_DRAG_RULES.md](./HORIZONTAL_DRAG_RULES.md) - Complete horizontal drag guide
- [HORIZONTAL_IMPLEMENTATION.md](./HORIZONTAL_IMPLEMENTATION.md) - Technical implementation
- [TEST_CASES.md](./TEST_CASES.md) - Test scenarios
- [VALIDATION_PROOF.md](./VALIDATION_PROOF.md) - Mathematical proof of constraints

## 📁 Structure

```
Formatter/
├── components/           # Sub-components
│   ├── SearchPanel.tsx  # Search and mapping panel
│   └── TreeNode.tsx     # Individual tree node component
├── constants/           # Configuration and constants
│   └── formatter-constants.ts
├── hooks/              # Custom React hooks
│   ├── useFormatterHandlers.ts  # Event handlers hook
│   └── useTreeState.ts          # Tree state management hook
├── utils/              # Utility functions
│   ├── drag-utils.ts           # Drag and drop utilities
│   ├── export-utils.ts         # Export functionality
│   ├── formatter-utils.ts      # Component-specific utilities
│   ├── search-utils.ts         # Search and mapping utilities
│   └── tree-utils.ts           # Tree manipulation utilities
├── Formatter.tsx       # Main component
├── index.ts           # Barrel exports
├── types.ts           # TypeScript type definitions
└── README.md          # This file
```

## 🚀 Features

- **Tree Structure Management**: Create, edit, and organize hierarchical text segments
- **Drag & Drop**: Reorder nodes with visual feedback
- **Text Mapping**: Create alignments between text segments
- **Search Functionality**: Find and highlight text across all nodes
- **Export Options**: Export as JSON or plain text
- **Responsive UI**: Adaptive layout with collapsible panels

## 🔧 Usage

```tsx
import { Formatter } from './components/Formatter';

function App() {
  return <Formatter />;
}
```

## 📋 Component Architecture

### Main Component (`Formatter.tsx`)
The main component is now clean and focused, delegating responsibilities to:
- **Hooks** for state management and event handling
- **Utilities** for business logic
- **Constants** for configuration
- **Sub-components** for UI rendering

### Custom Hooks

#### `useTreeState`
Manages all tree-related state including:
- Tree data structure
- UI state (expanded nodes, selected segments)
- Search state
- Mapping state
- Drag and drop state

#### `useFormatterHandlers`
Encapsulates all event handlers:
- Segment selection and interaction
- Node manipulation (add, delete)
- Search and mapping operations
- Text selection handling

### Utility Functions

#### `tree-utils.ts`
Core tree manipulation functions:
- `findNode()` - Locate nodes by ID
- `removeNode()` - Delete nodes and children
- `addChildToNode()` - Add new child nodes
- `updateLevels()` - Recalculate node hierarchy
- `generateHierarchicalNumbers()` - Create numbering system

#### `search-utils.ts`
Search and mapping functionality:
- `searchInTree()` - Full-text search across nodes
- `createTextMapping()` - Create text alignments
- `getMappingCount()` - Count mappings per node
- `handleTextSelection()` - Process text selections

#### `export-utils.ts`
Data export capabilities:
- `exportTreeAsJSON()` - Comprehensive JSON export
- `exportTreeAsText()` - Plain text export
- `generateExportData()` - Structured data preparation

#### `drag-utils.ts`
Drag and drop operations:
- `handleDragStart()` - Initialize drag operations
- `handleDragOver()` - Visual feedback during drag
- `handleDrop()` - Complete drag operations
- Position calculation and validation

#### `formatter-utils.ts`
Component-specific utilities:
- UI helper functions
- CSS class generators
- Display formatters
- Statistics calculators

### Constants (`formatter-constants.ts`)
Centralized configuration:
- **UI_CONFIG**: Button styles, layout dimensions
- **TEXT_CONSTANTS**: All user-facing text
- **NODE_CONFIG**: Default node settings
- **LAYOUT_CONFIG**: CSS class definitions

## 🎨 Styling

The component uses Tailwind CSS with a consistent design system:
- Color-coded buttons for different actions
- Responsive layout that adapts to screen size
- Visual feedback for interactions
- Consistent spacing and typography

## 🔄 State Management

State is organized into logical groups:
- **Tree State**: Node structure and hierarchy
- **UI State**: Visual controls and panels
- **Selection State**: Active nodes and text
- **Search State**: Query and results
- **Mapping State**: Text alignments

## 📊 Data Flow

1. **User Interaction** → Event handlers in `useFormatterHandlers`
2. **State Updates** → Managed by `useTreeState`
3. **UI Updates** → React re-renders with new state
4. **Utility Functions** → Process data transformations
5. **Sub-components** → Render updated UI

## 🧪 Testing Considerations

The refactored structure makes testing easier:
- **Isolated utilities** can be unit tested independently
- **Custom hooks** can be tested with React Testing Library
- **Event handlers** are separated from UI logic
- **Constants** ensure consistent behavior

## 🔮 Future Enhancements

The modular structure supports easy extension:
- Additional export formats
- New search algorithms
- Enhanced drag and drop features
- Undo/redo functionality
- Keyboard shortcuts
- Accessibility improvements

## 📝 Type Safety

Full TypeScript support with:
- Comprehensive type definitions in `types.ts`
- Proper typing for all functions and components
- Generic types for reusable utilities
- Strict null checks and error handling
