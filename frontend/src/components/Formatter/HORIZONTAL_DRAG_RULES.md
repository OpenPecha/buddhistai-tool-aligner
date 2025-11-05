# Horizontal Drag Rules

## 🎯 Core Concept

**Drag operations are HORIZONTAL only** - you can only move nodes left/right within their hierarchical level, not vertically across multiple levels.

---

## 📏 Horizontal Levels

### Visual Representation

```
Level 0 (Left-aligned):
1. First Section
2. Second Section  ← Same horizontal level as #1
3. Third Section   ← Same horizontal level as #1, #2

Level 1 (Indented right):
1. First Section
   1.1 Subsection  ← Child/subset of #1 (one level right)
   1.2 Subsection  ← Same level as 1.1 (horizontally aligned)
2. Second Section

Level 2 (Further indented):
1. First Section
   1.1 Subsection
       1.1.1 Sub-subsection  ← Child of 1.1 (one more level right)
```

### Key Principle
**Horizontal alignment = Same level = Siblings**

---

## ✅ Allowed Horizontal Operations

### 1. Horizontal Swap (Same Level)
**Direction:** ↔️ Left/Right  
**Constraint:** Only with adjacent sibling at same horizontal level

```
Before: 1, 2, 3 (all at same horizontal level)
Action: Drag 2 horizontally to swap with 1 or 3
After:  2, 1, 3 ✅ (2 swapped left with 1)
After:  1, 3, 2 ✅ (2 swapped right with 3)
```

### 2. Indent Right (Nest into Adjacent Sibling)
**Direction:** →  
**Constraint:** Can only nest into horizontally adjacent sibling

```
Before: 1, 2, 3 (same level)
Action: Drag 2 right into 1 (adjacent)
After:  1      ✅
        ├─ 1.1 (was 2, now indented right)
        3
```

### 3. Outdent Left (Unnest from Parent)
**Direction:** ←  
**Constraint:** Move one level left to parent's level

```
Before: 1
        ├─ 1.1
        ├─ 1.2
        2
Action: Drag 1.1 left to become sibling of 1
After:  1
        2      (was 1.1, now at parent level)
        3      (was 1.2)
        4      (was 2)
```

---

## ❌ Blocked Operations

### 1. Vertical Jump Across Levels
**Cannot skip horizontal levels**

```
Before: 1
        ├─ 1.1
        │  └─ 1.1.1
        2

❌ BLOCKED: Drag 1.1.1 directly to level 0
Reason: Would skip 2 levels vertically
Solution: Must outdent twice (1.1.1 → 1.2 → 2)
```

### 2. Non-Adjacent Horizontal Swap
**Cannot skip siblings at same level**

```
Before: 1, 2, 3, 4, 5 (same horizontal level)

❌ BLOCKED: Drag 5 to position 1
Reason: Not horizontally adjacent (distance = 4)
Solution: Multiple swaps (5→4, 4→3, 3→2, 2→1)
```

### 3. Diagonal Moves
**Cannot move diagonally across levels**

```
Before: 1
        ├─ 1.1
        2
        ├─ 2.1

❌ BLOCKED: Drag 1.1 into 2.1
Reason: Different horizontal levels
```

---

## 🎨 Visual Horizontal Hierarchy

### Example Tree with Horizontal Levels

```
←─────────────────────────────────────→
        HORIZONTAL DIRECTION

Level 0: │ 1. Introduction        │  ← Root level (left-aligned)
         │ 2. Body                │  ← Same horizontal level
         │ 3. Conclusion          │  ← Same horizontal level
         │                        │
Level 1: │    1.1 Overview        │  ← One indent right
         │    1.2 Details         │  ← Same horizontal level as 1.1
         │    2.1 Main Point      │  ← Same level, different parent
         │                        │
Level 2: │       1.1.1 Detail A   │  ← Two indents right
         │       1.1.2 Detail B   │  ← Same horizontal level

Vertical movement ↕️ = Multiple horizontal operations
Horizontal movement ↔️ = Single drag operation
```

---

## 🔄 Horizontal Movement Patterns

### Pattern 1: Sibling Swap (Horizontal Only)
```
[Same Level] → Drag → [Same Level]
    ↔️
```

**Example:**
```
Before: [A] [B] [C]  ← All at same horizontal level
         └─→─┘
After:  [B] [A] [C]  ← B moved left, A moved right
```

### Pattern 2: Indent Right (One Level)
```
[Level N] → Drag Right → [Level N+1]
              →
```

**Example:**
```
Before: [A] [B]      ← Both at level 0
         └─→┘
After:  [A]          ← A stays at level 0
        └─[B]        ← B moved to level 1 (right)
```

### Pattern 3: Outdent Left (One Level)
```
[Level N+1] → Drag Left → [Level N]
                ←
```

**Example:**
```
Before: [A]          ← A at level 0
        └─[B]        ← B at level 1
           ←─
After:  [A] [B]      ← Both at level 0
```

---

## 🚫 Why Vertical Movement is Blocked

### Problem: Breaking Horizontal Structure
```
Before:
Level 0: [A]
Level 1:   [A.1]
Level 2:     [A.1.a]

If we allowed: Drag A.1.a directly to Level 0
Result: [A.1.a] [A]  ← Structure broken!
```

### Solution: Multiple Horizontal Moves
```
Step 1: Outdent A.1.a → A.2 (Level 2 → Level 1)
Level 0: [A]
Level 1:   [A.1] [A.2]

Step 2: Outdent A.2 → B (Level 1 → Level 0)
Level 0: [A] [B]
```

---

## 📐 Implementation Details

### Horizontal Level = Tree Level
```typescript
interface TreeNode {
  level: number;  // Horizontal level (0 = root, 1 = indented, etc.)
  // ...
}
```

### Adjacency Check (Same Horizontal Level)
```typescript
// Check if nodes are at same horizontal level AND adjacent
if (draggedParent?.id === targetParent?.id) {
  // Same parent = Same horizontal level
  const absIndexDiff = Math.abs(targetIndex - draggedIndex);
  if (absIndexDiff !== 1) {
    return false; // Not horizontally adjacent
  }
}
```

### Level Change Validation
```typescript
// Can only change level by ±1 (one indent/outdent)
const levelDiff = Math.abs(targetLevel - draggedLevel);
if (levelDiff > 1) {
  return false; // Cannot jump multiple levels vertically
}
```

---

## 🎯 Examples with Real Scenario

### Scenario: Document Structure
```
1. Chapter 1
   1.1 Section A
   1.2 Section B
       1.2.1 Subsection X
       1.2.2 Subsection Y
2. Chapter 2
   2.1 Section C
```

### Allowed Operations:
1. ✅ Swap 1.1 ↔️ 1.2 (same horizontal level)
2. ✅ Indent 2 → 1.3 (move right into adjacent Chapter 1)
3. ✅ Outdent 1.1 → 2 (move left to Chapter level)
4. ✅ Swap 1.2.1 ↔️ 1.2.2 (same horizontal level)

### Blocked Operations:
1. ❌ Drag 1.2.1 to become 3 (skips 2 levels)
2. ❌ Drag 1 to position after 2.1 (different levels)
3. ❌ Swap 1.1 with 1.2.1 (different horizontal levels)

---

## 🎨 UI Implications

### Visual Indicators
- **Same Level:** Blue horizontal line between nodes
- **Indent Right:** Blue arrow pointing right (→)
- **Outdent Left:** Blue arrow pointing left (←)
- **Invalid:** Red indicator for any non-horizontal operation

### Cursor Changes
- **Horizontal drag:** `cursor: ew-resize` (↔️)
- **Invalid area:** `cursor: not-allowed` (🚫)

---

## 💡 User Mental Model

Users should think:
1. **"Can I slide this horizontally to the next spot?"** → Yes, if adjacent
2. **"Can I indent this one level right?"** → Yes, into adjacent sibling
3. **"Can I outdent this one level left?"** → Yes, to parent level
4. **"Can I move this vertically up/down?"** → No, use horizontal moves

---

## 🔑 Key Takeaways

1. ✅ **Horizontal = Same Level** - Nodes at same indent are siblings
2. ✅ **Adjacent Only** - Can only swap with immediate horizontal neighbor
3. ✅ **One Level Change** - Can indent/outdent by exactly 1 level
4. ❌ **No Vertical Jumps** - Cannot skip levels or distant positions
5. 🔄 **Multi-Step for Distance** - Use multiple horizontal moves

---

## 🎓 Teaching Users

### Analogy: Sliding Blocks
```
Imagine blocks on shelves:
┌─────────────────┐
│ [A] [B] [C]    │ ← Shelf 1 (Level 0)
│   [D] [E]      │ ← Shelf 2 (Level 1, indented)
│     [F]        │ ← Shelf 3 (Level 2, more indented)
└─────────────────┘

You can:
- Slide blocks left/right on same shelf
- Drop a block down to next shelf
- Lift a block up to previous shelf
- But cannot throw blocks across multiple shelves
```

This matches the horizontal drag concept perfectly!



