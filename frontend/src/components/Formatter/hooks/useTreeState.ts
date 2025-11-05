import { useState } from 'react';
import type { TreeNode, SegmentMapping, TextSelection, SearchResult } from '../types';
import { initializeTreeFromText, getAllNodeIds } from '../utils/tree-utils';

export const useTreeState = (initialData: string | TreeNode[]) => {
  // Tree data state
  const [treeData, setTreeData] = useState<TreeNode[]>(() => 
    typeof initialData === 'string' 
      ? initializeTreeFromText(initialData)
      : initialData
  );
  
  // UI state
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [selectedSegment, setSelectedSegment] = useState<string | null>(null);
  const [showSearchPanel, setShowSearchPanel] = useState<boolean>(false);
  
  // Text selection and mapping state
  const [textSelection, setTextSelection] = useState<TextSelection | null>(null);
  const [segmentMappings, setSegmentMappings] = useState<SegmentMapping[]>([]);
  
  // Search state
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);

  // Tree manipulation functions
  const toggleExpanded = (nodeId: string) => {
    setExpandedNodes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(nodeId)) {
        newSet.delete(nodeId);
      } else {
        newSet.add(nodeId);
      }
      return newSet;
    });
  };

  const expandAll = () => {
    setExpandedNodes(new Set(getAllNodeIds(treeData)));
  };

  const collapseAll = () => {
    setExpandedNodes(new Set());
  };

  const clearMappings = () => {
    setSegmentMappings([]);
  };

  return {
    // State
    treeData,
    setTreeData,
    expandedNodes,
    setExpandedNodes,
    selectedSegment,
    setSelectedSegment,
    showSearchPanel,
    setShowSearchPanel,
    textSelection,
    setTextSelection,
    segmentMappings,
    setSegmentMappings,
    searchQuery,
    setSearchQuery,
    searchResults,
    setSearchResults,
    
    // Actions
    toggleExpanded,
    expandAll,
    collapseAll,
    clearMappings,
  };
};
