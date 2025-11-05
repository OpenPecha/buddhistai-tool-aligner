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
