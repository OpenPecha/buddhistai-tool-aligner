import type { TreeNode, SegmentMapping } from '../types';
import { generateHierarchicalNumbers } from './tree-utils';
import { getMappingCount, getMappingsAsSource } from './search-utils';

/**
 * Get hierarchical number for a node
 */
export const getHierarchicalNumber = (nodeId: string, treeData: TreeNode[]): string => {
  const numberMap = generateHierarchicalNumbers(treeData);
  return numberMap.get(nodeId) || nodeId;
};

/**
 * Get mapping count for a specific node
 */
export const getNodeMappingCount = (nodeId: string, segmentMappings: SegmentMapping[]): number => {
  return getMappingCount(nodeId, segmentMappings);
};

/**
 * Get mappings where the node is the source
 */
export const getNodeMappingsAsSource = (nodeId: string, segmentMappings: SegmentMapping[]) => {
  return getMappingsAsSource(nodeId, segmentMappings);
};

/**
 * Format selected text for display
 */
export const formatSelectedTextDisplay = (selectedText: string, maxLength: number = 20): string => {
  if (selectedText.length > maxLength) {
    return `${selectedText.substring(0, maxLength)}...`;
  }
  return selectedText;
};

/**
 * Generate node statistics
 */
export const getNodeStatistics = (treeData: TreeNode[]) => {
  const totalNodes = treeData.length;
  return { totalNodes };
};

/**
 * Check if search panel should be shown based on state
 */
export const shouldShowSearchPanel = (showSearchPanel: boolean, selectedSegment: string | null): boolean => {
  return showSearchPanel && selectedSegment !== null;
};

/**
 * Get CSS classes for search panel toggle button
 */
export const getSearchPanelToggleClasses = (showSearchPanel: boolean): string => {
  return `px-3 py-1 text-xs rounded transition-colors ${
    showSearchPanel 
      ? 'bg-blue-100 text-blue-700 hover:bg-blue-200' 
      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
  }`;
};

/**
 * Get CSS classes for main content layout
 */
export const getMainContentClasses = (showSearchPanel: boolean): string => {
  return `flex flex-1 gap-4 ${showSearchPanel ? '' : 'justify-center'}`;
};

/**
 * Get CSS classes for tree section
 */
export const getTreeSectionClasses = (showSearchPanel: boolean): string => {
  return showSearchPanel ? 'flex-1 max-w-7xl' : 'w-full max-w-4xl';
};
