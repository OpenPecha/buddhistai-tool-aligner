import type { DragState } from '../types';

/**
 * Returns a fresh drag state with all values reset to their initial state
 */
export const resetDragState = (): DragState => ({
  isDragging: false,
  draggedNodeId: null,
  dragOverNodeId: null,
  dropPosition: null,
});















