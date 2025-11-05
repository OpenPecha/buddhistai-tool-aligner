# Drag and Drop Test Cases

## Test Setup: Nodes 1, 2, 3

For these test cases, assume we have three nodes at the root level:
- Node 1 (index 0)
- Node 2 (index 1)  
- Node 3 (index 2)

---

## ✅ ALLOWED Operations

### Test 1: Adjacent Swap (2 ↔ 1)
**Action:** Drag Node 2 before Node 1  
**Expected:** ✅ ALLOWED - Nodes are adjacent  
**Result:** Order becomes `2, 1, 3`  
**Console Log:** `✓ Before: dragged[1] → before target[0], diff=-1`

### Test 2: Adjacent Swap (2 ↔ 3)
**Action:** Drag Node 2 after Node 3  
**Expected:** ✅ ALLOWED - Nodes are adjacent  
**Result:** Order becomes `1, 3, 2`  
**Console Log:** `✓ After: dragged[1] → after target[2], diff=1`

### Test 3: Adjacent Swap (1 ↔ 2)
**Action:** Drag Node 1 after Node 2  
**Expected:** ✅ ALLOWED - Nodes are adjacent  
**Result:** Order becomes `2, 1, 3`  
**Console Log:** `✓ After: dragged[0] → after target[1], diff=1`

### Test 4: Nest into Adjacent (2 → 1)
**Action:** Drag Node 2 inside Node 1 (middle zone)  
**Expected:** ✅ ALLOWED - Nodes are adjacent  
**Result:** Node 1 now has child 1.1 (was Node 2), Node 3 moves up  
**Console Log:** `✓ Adjacent siblings, nesting allowed`

### Test 5: Nest into Adjacent (2 → 3)
**Action:** Drag Node 2 inside Node 3 (middle zone)  
**Expected:** ✅ ALLOWED - Nodes are adjacent  
**Result:** Node 3 now has child 3.1 (was Node 2)  
**Console Log:** `✓ Adjacent siblings, nesting allowed`

---

## ❌ BLOCKED Operations

### Test 6: Skip Swap (3 → 1) ⚠️ PRIMARY TEST
**Action:** Drag Node 3 before Node 1  
**Expected:** ❌ BLOCKED - Nodes are NOT adjacent (distance = 2)  
**Result:** Red indicator shown, drop fails, notification appears  
**Console Log:** `❌ Blocked: Node at index 2 cannot move to index 0 (difference: 2, must be 1)`

### Test 7: Skip Swap (1 → 3)
**Action:** Drag Node 1 after Node 3  
**Expected:** ❌ BLOCKED - Nodes are NOT adjacent (distance = 2)  
**Result:** Red indicator shown, drop fails, notification appears  
**Console Log:** `❌ Blocked: Node at index 0 cannot move to index 2 (difference: 2, must be 1)`

### Test 8: Nest into Non-Adjacent (1 → 3)
**Action:** Drag Node 1 inside Node 3 (middle zone)  
**Expected:** ❌ BLOCKED - Nodes are NOT adjacent (distance = 2)  
**Result:** Red background shown, drop fails  
**Console Log:** `❌ Not adjacent: distance = 2, must be 1`

### Test 9: Nest into Non-Adjacent (3 → 1)
**Action:** Drag Node 3 inside Node 1 (middle zone)  
**Expected:** ❌ BLOCKED - Nodes are NOT adjacent (distance = 2)  
**Result:** Red background shown, drop fails  
**Console Log:** `❌ Not adjacent: distance = 2, must be 1`

---

## 🔄 Multi-Node Sequences

### Scenario: Move Node 3 to Position of Node 1
**Goal:** Get Node 3 to the first position  
**Direct approach:** ❌ BLOCKED (distance = 2)  
**Correct approach:** 
1. Drag Node 3 before Node 2 → Result: `1, 3, 2` ✅
2. Drag Node 3 before Node 1 → Result: `3, 1, 2` ✅

**Total steps:** 2 swaps required

### Scenario: Move Node 1 to Position of Node 3
**Goal:** Get Node 1 to the last position  
**Direct approach:** ❌ BLOCKED (distance = 2)  
**Correct approach:**
1. Drag Node 1 after Node 2 → Result: `2, 1, 3` ✅
2. Drag Node 1 after Node 3 → Result: `2, 3, 1` ✅

**Total steps:** 2 swaps required

---

## 🏗️ Nested Structure Tests

### Setup: Node 1 with children
```
1
├─ 1.1
└─ 1.2
2
3
```

### Test 10: Unnest Child (1.1 → sibling of 1)
**Action:** Drag Node 1.1 after Node 1  
**Expected:** ✅ ALLOWED - Child can move out to parent level  
**Result:**
```
1
2 (was 1.1)
3 (was 1.2, now renumbered)
4 (was 2)
```
**Console Log:** `✓ Unnesting: moving out to become sibling of parent`

### Test 11: First Child to Adjacent Parent Sibling
**Action:** Drag Node 1.1 (first child) before Node 0 (if exists and adjacent to Node 1)  
**Expected:** ✅ ALLOWED - First child can move to adjacent sibling of parent  
**Console Log:** `✓ Moving out to adjacent sibling of parent`

### Test 12: Middle Child Cannot Move Out to Parent's Sibling
**Setup:**
```
1
├─ 1.1
├─ 1.2  ← Middle child
└─ 1.3
2
```
**Action:** Drag Node 1.2 after Node 2  
**Expected:** ❌ BLOCKED - Only first/last child can move to parent's sibling  
**Console Log:** `❌ Can only move out from first/last position in parent`

---

## 🎯 Critical Validation Points

### 1. Distance Check (Most Important)
```javascript
const absIndexDiff = Math.abs(targetIndex - draggedIndex);
if (absIndexDiff !== 1) {
  return false; // ❌ BLOCKED
}
```

### 2. Position Direction Check
```javascript
// For 'before' position:
indexDiff === -1  // Target must be immediately before dragged

// For 'after' position:
indexDiff === 1   // Target must be immediately after dragged
```

### 3. Examples with Indices
| Dragged Index | Target Index | Difference | Valid? |
|---------------|--------------|------------|--------|
| 2 | 0 | \|-2\| = 2 | ❌ NO |
| 2 | 1 | \|-1\| = 1 | ✅ YES |
| 0 | 2 | \|2\| = 2 | ❌ NO |
| 0 | 1 | \|1\| = 1 | ✅ YES |
| 1 | 0 | \|-1\| = 1 | ✅ YES |
| 1 | 2 | \|1\| = 1 | ✅ YES |

---

## 🧪 Manual Testing Checklist

### Basic Adjacent Swaps
- [ ] Swap first two nodes (1 ↔ 2)
- [ ] Swap last two nodes (2 ↔ 3)
- [ ] Swap middle nodes in a longer list

### Non-Adjacent Attempts (Should Fail)
- [ ] Try to move Node 3 to position 1 → See red indicator
- [ ] Try to move Node 1 to position 3 → See red indicator
- [ ] Try to move Node 5 to position 1 → See red indicator

### Nesting Operations
- [ ] Nest Node 2 into Node 1 (adjacent) → Should work
- [ ] Try to nest Node 3 into Node 1 (not adjacent) → Should fail
- [ ] Unnest a child node → Should work

### Console Output
When testing, open browser console (F12) to see detailed logs:
```
🔍 Validating move: "Node 3 text..." → before "Node 1 text..."
   Dragged: index 2 of 3 siblings
   Target: index 0 of 3 siblings
❌ Blocked: Node at index 2 cannot move to index 0 (difference: 2, must be 1)
❌ No valid move pattern matched
```

---

## 🐛 Debugging

If you see a move that shouldn't be allowed:
1. **Check Console Logs**: Look for the validation output
2. **Verify Indices**: Ensure nodes have correct indices
3. **Check Parent Relationships**: Verify parent IDs match expectations
4. **Test in Isolation**: Create a minimal test case with just 3 nodes

If a valid move is blocked:
1. **Check Adjacency**: Are the nodes truly adjacent in the tree?
2. **Verify Tree Structure**: Use React DevTools to inspect the tree
3. **Check Console**: Look for which validation rule is failing

---

## ✅ Expected User Experience

1. **Visual Feedback**:
   - Drag starts → Node becomes semi-transparent
   - Hover over valid target → Blue line/background appears
   - Hover over invalid target → Red line/background appears

2. **Drop Behavior**:
   - Valid drop → Node moves smoothly, tree updates
   - Invalid drop → Nothing happens, error notification shows

3. **Error Messages**:
   - Clear toast notification appears
   - Message: "Invalid move: Only adjacent swaps and nesting are allowed"
   - Auto-dismisses after 3 seconds

---

## 🔒 Guarantee

**With this implementation, Node 3 CANNOT move to position 1 directly.**

The validation logic explicitly checks:
```javascript
const absIndexDiff = Math.abs(targetIndex - draggedIndex);
// For nodes at index 2 and 0: abs(0 - 2) = 2
if (absIndexDiff !== 1) {
  return false; // ❌ BLOCKED
}
```

This ensures **only nearest-neighbor operations** are allowed.



