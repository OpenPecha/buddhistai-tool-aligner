# Horizontal Drag & Drop Implementation Summary

## 🎯 Core Principle

**ALL drag operations are HORIZONTAL** - nodes can only move left/right within their hierarchical level, never vertically across multiple levels.

---

## 🔑 Key Concept: Horizontal Alignment = Same Level

```
Level 0 (Root):           [A]     [B]     [C]      ← Horizontally aligned
                           ↕       ↕       ↕
Level 1 (Indented):        [A.1]   [B.1]   [C.1]   ← Horizontally aligned
                                   ↕
Level 2 (More indented):           [B.1.1]         ← At its own level
```

### Visual Tree with Horizontal Levels

```
├── 1. Introduction          ← Level 0
│   ├── 1.1 Overview        ← Level 1 (right of Level 0)
│   └── 1.2 Background      ← Level 1 (horizontally aligned with 1.1)
├── 2. Body                  ← Level 0 (horizontally aligned with 1)
│   └── 2.1 Main Point      ← Level 1
└── 3. Conclusion            ← Level 0 (horizontally aligned with 1, 2)
```

---

## ✅ Three Horizontal Operations

### 1. Horizontal Swap (↔️)
**Movement:** Left/Right within same level  
**Symbol:** `↔️` (bidirectional horizontal)

```
Before: [1] [2] [3]  ← All at Level 0
         └──┬──┘
After:  [1] [3] [2]  ← Swapped 2 and 3 (horizontal movement)
```

**Rules:**
- ✅ Can swap with immediately adjacent sibling
- ❌ Cannot skip siblings (no jumping)
- ✅ Must be at same horizontal level (same parent)

**Console Output:**
```
✓ Horizontal swap right (→): [1] → after [2]
```

---

### 2. Indent Right (→)
**Movement:** Move one level right into adjacent sibling  
**Symbol:** `→` (horizontal right arrow)

```
Before: [1] [2] [3]    ← Level 0
         └──┘
After:  [1]            ← Level 0
        └─ [2]         ← Level 1 (indented right into 1)
        [3]            ← Level 0
```

**Rules:**
- ✅ Can indent into horizontally adjacent sibling
- ❌ Cannot skip to non-adjacent sibling
- ✅ Creates parent-child relationship (level increases by 1)

**Console Output:**
```
✓ Horizontally adjacent siblings, indenting allowed (→)
```

---

### 3. Outdent Left (←)
**Movement:** Move one level left to parent's level  
**Symbol:** `←` (horizontal left arrow)

```
Before: [1]            ← Level 0
        └─ [1.1]       ← Level 1
           ←──
After:  [1] [2]        ← Both at Level 0
              ↑
            (was 1.1)
```

**Rules:**
- ✅ Can outdent to parent's level
- ✅ Can outdent to adjacent sibling of parent
- ❌ Only first/last child can outdent to parent's adjacent sibling

**Console Output:**
```
✓ Outdenting left (←): moving from Level N+1 → Level N (parent level)
```

---

## ❌ Blocked: Vertical Jumps

### Example: Cannot Jump Across Levels
```
Before:
Level 0: [1]
Level 1:   [1.1]
Level 2:     [1.1.1]
             
❌ BLOCKED: Drag [1.1.1] directly to Level 0
Reason: Would skip 2 levels vertically
```

**Console Output:**
```
❌ Blocked (Horizontal Rule): Node at index 2 cannot jump to index 0
   Horizontal distance: 2 positions (must be exactly 1)
   Use multiple adjacent swaps to reach distant positions
```

### Solution: Multiple Horizontal Moves
```
Step 1: Outdent [1.1.1] → [1.2]
Level 0: [1]
Level 1:   [1.1] [1.2]

Step 2: Outdent [1.2] → [2]
Level 0: [1] [2]
```

---

## 🎨 Visual Implementation

### 1. Drag Handle Icon
Changed from vertical bars to **horizontal dots grid**:

```typescript
// Horizontal grip pattern (3x3 dots)
<svg>
  <circle cx="4" cy="12" r="1.5" />
  <circle cx="12" cy="12" r="1.5" />
  <circle cx="20" cy="12" r="1.5" />
  // ... more dots
</svg>
```

**Cursor:** `cursor-ew-resize` (east-west resize, indicates horizontal movement)

### 2. Visual Feedback

| State | Indicator | Meaning |
|-------|-----------|---------|
| Valid horizontal swap | Blue line | Can move left/right |
| Valid indent | Blue background | Can move right into sibling |
| Invalid jump | Red line/background | Violates horizontal rule |
| Dragging | Semi-transparent | Node being moved |

### 3. Notification Message
```
"Invalid move: Only horizontal adjacent swaps allowed (no vertical jumps)"
```

---

## 🔍 Console Logging Format

### Example: Blocked Jump
```
🔍 [HORIZONTAL DRAG] Validating: "Node 3..." → before "Node 1..."
   Dragged: Level 0, index 2 of 3 siblings
   Target: Level 0, index 0 of 3 siblings
❌ Blocked (Horizontal Rule): Node at index 2 cannot jump to index 0
   Horizontal distance: 2 positions (must be exactly 1)
   Use multiple adjacent swaps to reach distant positions
❌ No valid horizontal move pattern matched
   Remember: Only horizontal operations allowed (no vertical jumps)
```

### Example: Allowed Swap
```
🔍 [HORIZONTAL DRAG] Validating: "Node 2..." → after "Node 3..."
   Dragged: Level 0, index 1 of 3 siblings
   Target: Level 0, index 2 of 3 siblings
✓ Horizontal swap right (→): [1] → after [2]
```

---

## 📊 Rules Summary Matrix

| Source Level | Target Level | Adjacent? | Allowed? | Operation Type |
|--------------|--------------|-----------|----------|----------------|
| 0 | 0 | Yes | ✅ | Horizontal swap (↔️) |
| 0 | 0 | No | ❌ | Blocked (jump) |
| 0 | 1 | Sibling | ✅ | Indent right (→) |
| 1 | 0 | Parent | ✅ | Outdent left (←) |
| 0 | 2 | N/A | ❌ | Blocked (vertical jump) |
| 2 | 0 | N/A | ❌ | Blocked (vertical jump) |

---

## 🏗️ Code Implementation

### Key Validation: Horizontal Distance Check
```typescript
const absIndexDiff = Math.abs(targetIndex - draggedIndex);

// STRICT: Nodes must be horizontally adjacent (difference of exactly 1)
// This prevents vertical jumps across the tree
if (absIndexDiff !== 1) {
  console.log(`❌ Blocked (Horizontal Rule): ...`);
  return false;
}
```

### Why This Works
1. **Same Level:** Nodes with same parent are horizontally aligned
2. **Index Difference:** Distance = 1 means immediately adjacent
3. **No Jumps:** Distance > 1 means there's a gap → blocked
4. **Level Change:** Only allowed through indent/outdent (±1 level)

---

## 🎓 Teaching the User

### Mental Model: "Sliding Blocks on Shelves"

```
Think of nodes as blocks on horizontal shelves:

Shelf 0: [A] [B] [C]     ← Can slide left/right
         ↓
Shelf 1:   [A.1] [A.2]   ← Can slide left/right (different shelf)
           ↑
         Can drop down from A or B (one shelf only)
```

**You can:**
- ✅ Slide blocks left/right on same shelf (horizontal swap)
- ✅ Drop block down to next shelf (indent)
- ✅ Lift block up to previous shelf (outdent)

**You cannot:**
- ❌ Throw block across multiple positions
- ❌ Jump block across multiple shelves
- ❌ Skip shelves vertically

---

## 🎯 Examples

### Scenario: List [1, 2, 3]

| Goal | Direct? | Method |
|------|---------|--------|
| Swap 1 ↔ 2 | ✅ Yes | Single horizontal swap (←) |
| Swap 2 ↔ 3 | ✅ Yes | Single horizontal swap (→) |
| Move 3 → position 1 | ❌ No | Two swaps: 3→2, then 2→1 |
| Nest 2 into 1 | ✅ Yes | Single indent (→) |

### Scenario: Nested Structure
```
1
├─ 1.1
└─ 1.2
2
```

| Goal | Direct? | Method |
|------|---------|--------|
| Swap 1.1 ↔ 1.2 | ✅ Yes | Horizontal swap at Level 1 |
| Move 1.1 → Level 0 | ✅ Yes | Single outdent (←) |
| Move 1.2 → into 2 | ❌ No | Outdent to L0, then indent into 2 |

---

## ✅ Implementation Checklist

- [x] Horizontal distance check (index diff = 1)
- [x] Level-aware validation (parent matching)
- [x] Horizontal drag handle icon (3x3 dots)
- [x] Horizontal cursor (`ew-resize`)
- [x] Console logging with ↔️ → ← symbols
- [x] Error message emphasizes horizontal constraint
- [x] Visual indicators (blue/red)
- [x] Documentation with horizontal terminology
- [x] No linter errors
- [x] Type-safe implementation

---

## 🚀 Result

**Node 3 CANNOT move to position 1 directly** because:
1. They are 2 positions apart (not 1)
2. This would be a "jump" (not horizontal slide)
3. Validation blocks with: "Horizontal distance: 2 positions (must be exactly 1)"
4. User must use 2 horizontal swaps to achieve this

**The system enforces pure horizontal movement semantics! ✅**




