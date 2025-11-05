# Drag and Drop Constraints

## Overview
The Formatter component implements strict drag and drop constraints to maintain logical document structure. Only "nearest-neighbor" operations are allowed to prevent arbitrary reordering that could break document flow.

## Allowed Operations

### 1. Swap with Adjacent Sibling
- A node can swap positions with its immediate neighbor (previous or next sibling)
- Both nodes must share the same parent
- Example: In a list [1, 2, 3], you can swap 2 with 1 or 2 with 3

### 2. Nest into Adjacent Sibling
- A node can become a child of its immediately adjacent sibling
- Works in both directions (previous or next sibling)
- Example: Node 2 can become 1.1 (child of node 1) if they are adjacent

### 3. Unnest from Parent
- A child node can move out to become a sibling of its parent
- Can be placed either before or after the parent
- Example: Node 1.1 can move out to become node 2 (placed after its parent)

### 4. Move to Adjacent Sibling of Parent
- A child node can move to become a sibling of its parent's adjacent sibling
- Only allowed if the node is the first or last child in its parent
- The target must be immediately adjacent to the parent
- Example: If node 1 has children [1.1, 1.2], then 1.1 can move before node 0 (if 0 is before 1)

## Visual Feedback

### Valid Drop Zones
- **Blue line indicator**: Shows where the node will be placed if dropped
- **Blue background**: Shows when dropping inside a node (nesting)

### Invalid Drop Zones
- **Red line indicator**: Indicates the drop is not allowed at this position
- **Red background**: Shows when attempting to nest in an invalid location
- **Notification**: A toast message appears explaining the constraint violation

## Technical Implementation

### Key Files
1. `utils/drag-utils.ts` - Contains validation logic
   - `isValidMove()`: Validates if a drag operation is allowed
   - `getNodeContext()`: Retrieves parent and sibling information
   - `handleDrop()`: Executes the drop with validation

2. `components/TreeNode.tsx` - Implements drag behavior
   - Visual feedback during drag operations
   - Passes validation to child nodes

3. `components/DragNotification.tsx` - User feedback
   - Shows error messages for invalid moves
   - Auto-dismisses after 3 seconds

### Validation Logic
The `isValidMove()` function checks:
1. Node cannot be dropped on itself
2. Node cannot be dropped into its own descendants
3. For nesting: nodes must be adjacent siblings
4. For swapping: nodes must be immediate neighbors
5. For unnesting: validates parent-child relationships

## Benefits of These Constraints

1. **Maintains Document Structure**: Prevents accidental disruption of logical flow
2. **Predictable Behavior**: Users always know what moves are allowed
3. **Prevents Errors**: Invalid operations are blocked before execution
4. **Clear Feedback**: Visual and textual indicators guide users

## Example Scenarios

### Scenario 1: Simple Swap
```
Before:  1, 2, 3
Action:  Drag 2 after 3
Result:  1, 3, 2 ✓
```

### Scenario 2: Nesting
```
Before:  1, 2, 3
Action:  Drag 2 inside 1 (adjacent)
Result:  1 (with child 1.1), 3 ✓
```

### Scenario 3: Invalid Move (Non-adjacent)
```
Before:  1, 2, 3
Action:  Drag 1 after 3 (skipping 2)
Result:  ✗ Blocked - not adjacent
```

### Scenario 4: Unnesting
```
Before:  1 (with child 1.1), 2
Action:  Drag 1.1 after node 1
Result:  1, 2 (where 2 was previously 1.1) ✓
```

## User Guide

### How to Reorder Nodes
1. **Grab the node**: Click and hold the drag handle (≡ icon)
2. **Move the cursor**: Drag to the desired location
3. **Watch for indicators**: 
   - Blue = valid drop zone
   - Red = invalid drop zone
4. **Release**: Drop the node when positioned correctly

### What to Do When a Move is Blocked
If you see a red indicator or error message:
1. The target location is not adjacent to the source
2. Try moving the node one step at a time
3. Use multiple small moves instead of one large move
4. Consider if nesting/unnesting would help reach the target

## Future Enhancements
Potential improvements to consider:
- Multi-step drag suggestions (show path to distant targets)
- Undo/redo for drag operations
- Keyboard shortcuts for adjacent swaps
- Visual preview of final position before drop



