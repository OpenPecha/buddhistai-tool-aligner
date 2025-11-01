import type { TreeNode, DragState } from '../types';
import { removeNode, insertNode, updateLevels } from './tree-utils';

/**
 * Handle drag start event
 */
export const handleDragStart = (
  e: React.DragEvent,
  node: TreeNode,
  setDragState: React.Dispatch<React.SetStateAction<DragState>>,
  dragCounter: React.MutableRefObject<number>
): void => {
  setDragState(prev => ({ ...prev, draggedNode: node }));
  e.dataTransfer.effectAllowed = 'move';
  dragCounter.current = 0;
};

/**
 * Handle drag over event
 */
export const handleDragOver = (
  e: React.DragEvent,
  node: TreeNode,
  setDragState: React.Dispatch<React.SetStateAction<DragState>>
): void => {
  e.preventDefault();
  e.dataTransfer.dropEffect = 'move';
  
  const rect = e.currentTarget.getBoundingClientRect();
  const y = e.clientY - rect.top;
  const height = rect.height;
  
  let position: 'before' | 'after' | 'inside' = 'after';
  
  if (y < height * 0.25) {
    position = 'before';
  } else if (y > height * 0.75) {
    position = 'after';
  } else {
    position = 'inside';
  }
  
  setDragState(prev => ({
    ...prev,
    dragOverNode: node,
    dropPosition: position
  }));
};

/**
 * Handle drag enter event
 */
export const handleDragEnter = (
  e: React.DragEvent,
  dragCounter: React.MutableRefObject<number>
): void => {
  e.preventDefault();
  dragCounter.current++;
};

/**
 * Handle drag leave event
 */
export const handleDragLeave = (
  dragCounter: React.MutableRefObject<number>,
  setDragState: React.Dispatch<React.SetStateAction<DragState>>
): void => {
  dragCounter.current--;
  if (dragCounter.current === 0) {
    setDragState(prev => ({
      ...prev,
      dragOverNode: null,
      dropPosition: null
    }));
  }
};

/**
 * Handle drop event
 */
export const handleDrop = (
  e: React.DragEvent,
  targetNode: TreeNode,
  dragState: DragState,
  treeData: TreeNode[],
  setTreeData: React.Dispatch<React.SetStateAction<TreeNode[]>>,
  setDragState: React.Dispatch<React.SetStateAction<DragState>>,
  dragCounter: React.MutableRefObject<number>
): void => {
  e.preventDefault();
  
  const { draggedNode, dropPosition } = dragState;
  
  if (!draggedNode || !dropPosition || draggedNode.id === targetNode.id) {
    setDragState({ draggedNode: null, dragOverNode: null, dropPosition: null });
    return;
  }

  // Remove dragged node from tree
  let newTree = removeNode(treeData, draggedNode.id);
  
  // Insert at new position
  newTree = insertNode(newTree, targetNode.id, draggedNode, dropPosition);
  
  // Update levels
  newTree = updateLevels(newTree);
  
  setTreeData(newTree);
  setDragState({ draggedNode: null, dragOverNode: null, dropPosition: null });
  dragCounter.current = 0;
};

/**
 * Reset drag state
 */
export const resetDragState = (): DragState => ({
  draggedNode: null,
  dragOverNode: null,
  dropPosition: null
});
