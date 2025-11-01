import type { TreeNode, SearchResult, SegmentMapping, TextSelection } from '../types';

/**
 * Search for text across all nodes in the tree
 */
export const searchInTree = (nodes: TreeNode[], query: string): SearchResult[] => {
  if (!query.trim()) return [];
  
  const results: SearchResult[] = [];
  const searchQuery = query.toLowerCase();
  
  const searchInNodes = (nodes: TreeNode[]) => {
    nodes.forEach(node => {
      const nodeText = node.text.toLowerCase();
      let startIndex = 0;
      
      while (true) {
        const matchIndex = nodeText.indexOf(searchQuery, startIndex);
        if (matchIndex === -1) break;
        
        // Create context around the match
        const contextStart = Math.max(0, matchIndex - 20);
        const contextEnd = Math.min(node.text.length, matchIndex + query.length + 20);
        const context = node.text.substring(contextStart, contextEnd);
        
        results.push({
          nodeId: node.id,
          text: node.text,
          matchStart: matchIndex,
          matchEnd: matchIndex + query.length,
          context: contextStart > 0 ? '...' + context : context + (contextEnd < node.text.length ? '...' : '')
        });
        
        startIndex = matchIndex + 1;
      }
      
      // Search in children
      if (node.children.length > 0) {
        searchInNodes(node.children);
      }
    });
  };
  
  searchInNodes(nodes);
  return results;
};

/**
 * Create a mapping between text selections
 */
export const createTextMapping = (
  textSelection: TextSelection,
  searchResult: SearchResult
): SegmentMapping => {
  const targetSelection: TextSelection = {
    nodeId: searchResult.nodeId,
    start: searchResult.matchStart,
    end: searchResult.matchEnd,
    selectedText: searchResult.text.substring(searchResult.matchStart, searchResult.matchEnd)
  };
  
  return {
    id: `mapping-${Date.now()}`,
    sourceSelection: textSelection,
    targetSelection: targetSelection
  };
};

/**
 * Get mapping count for a specific segment
 */
export const getMappingCount = (nodeId: string, mappings: SegmentMapping[]): number => {
  return mappings.filter(m => 
    m.sourceSelection.nodeId === nodeId || m.targetSelection.nodeId === nodeId
  ).length;
};

/**
 * Get mappings for a specific node as source
 */
export const getMappingsAsSource = (nodeId: string, mappings: SegmentMapping[]): SegmentMapping[] => {
  return mappings.filter(m => m.sourceSelection.nodeId === nodeId);
};

/**
 * Get mappings for a specific node as target
 */
export const getMappingsAsTarget = (nodeId: string, mappings: SegmentMapping[]): SegmentMapping[] => {
  return mappings.filter(m => m.targetSelection.nodeId === nodeId);
};

/**
 * Handle text selection within a textarea
 */
export const handleTextSelection = (
  nodeId: string, 
  textarea: HTMLTextAreaElement
): TextSelection | null => {
  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  
  if (start !== end) {
    const selectedText = textarea.value.substring(start, end);
    return {
      nodeId,
      start,
      end,
      selectedText
    };
  }
  
  return null;
};
