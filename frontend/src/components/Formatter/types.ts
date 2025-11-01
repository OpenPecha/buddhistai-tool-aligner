export interface TreeNode {
  id: string;
  text: string;
  children: TreeNode[];
  level: number;
}

export interface SearchResult {
  nodeId: string;
  text: string;
  matchStart: number;
  matchEnd: number;
  context: string;
}

export interface SegmentMapping {
  id: string;
  sourceSelection: TextSelection;
  targetSelection: TextSelection;
}

export interface TextSelection {
  nodeId: string;
  start: number;
  end: number;
  selectedText: string;
}

export interface DragState {
  draggedNode: TreeNode | null;
  dragOverNode: TreeNode | null;
  dropPosition: 'before' | 'after' | 'inside' | null;
}

export interface ExportData {
  metadata: {
    totalNodes: number;
    totalMappings: number;
    exportDate: string;
    version: string;
  };
  segments: any[];
  mappings: any[];
}
