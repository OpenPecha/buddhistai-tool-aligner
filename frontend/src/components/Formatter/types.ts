export interface TreeNode {
  id: string;
  hierarchicalNumber: string;
  text: string;
  level: number;
  type?: 'heading' | 'paragraph';
  lineNumber?: number;
  textLength: number;
  mappingCount: number;
  mappings: {
    asSource: any[];
    asTarget: any[];
  };
  children: TreeNode[];
  title?: string; // Custom title field separate from text content
  isTitle: boolean; // Flag to identify title nodes vs content nodes
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

export interface ExportData {
  metadata: {
    totalNodes: number;
    totalMappings: number;
    exportDate: string;
    version: string;
  };
  segments: TreeNode[];
  mappings: any[];
}

export interface ImportData {
  metadata: {
    totalNodes: number;
    totalMappings: number;
    exportDate: string;
    version: string;
  };
  segments: TreeNode[];
  mappings: any[];
}

export interface TextRange {
  startLine: number;
  endLine: number;
  selectedLines: number[];
}

export interface TitleCreationData {
  title: string;
  selectedRange?: TextRange;
  targetSegments?: string[]; // Node IDs of segments to group under this title
}

export interface SegmentAnnotation {
  id: string;
  start: number;
  end: number;
  title?: string;
}

export interface TOCEntry {
  title: string;
  segmentation: SegmentAnnotation[];
}

export interface DragState {
  isDragging: boolean;
  draggedNodeId: string | null;
  dragOverNodeId: string | null;
  dropPosition: 'before' | 'after' | 'inside' | null;
}