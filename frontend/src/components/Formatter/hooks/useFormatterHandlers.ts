import type { TreeNode, SearchResult, TextSelection, SegmentMapping } from '../types';
import { 
  removeNode, 
  updateLevels, 
  addChildToNode 
} from '../utils/tree-utils';
import { 
  searchInTree, 
  createTextMapping 
} from '../utils/search-utils';

interface UseFormatterHandlersProps {
  treeData: TreeNode[];
  setTreeData: React.Dispatch<React.SetStateAction<TreeNode[]>>;
  selectedSegment: string | null;
  setSelectedSegment: React.Dispatch<React.SetStateAction<string | null>>;
  setShowSearchPanel: React.Dispatch<React.SetStateAction<boolean>>;
  setSearchQuery: React.Dispatch<React.SetStateAction<string>>;
  setSearchResults: React.Dispatch<React.SetStateAction<SearchResult[]>>;
  textSelection: TextSelection | null;
  setTextSelection: React.Dispatch<React.SetStateAction<TextSelection | null>>;
  setSegmentMappings: React.Dispatch<React.SetStateAction<SegmentMapping[]>>;
  setExpandedNodes: React.Dispatch<React.SetStateAction<Set<string>>>;
}

export const useFormatterHandlers = ({
  treeData,
  setTreeData,
  selectedSegment,
  setSelectedSegment,
  setShowSearchPanel,
  setSearchQuery,
  setSearchResults,
  textSelection,
  setTextSelection,
  setSegmentMappings,
  setExpandedNodes,
}: UseFormatterHandlersProps) => {
  
  /**
   * Handle segment click - select segment and show search panel
   */
  const handleSegmentClick = (nodeId: string) => {
    setSelectedSegment(nodeId);
    setShowSearchPanel(true);
    setSearchQuery('');
    setSearchResults([]);
    // Clear text selection when switching segments
    if (textSelection?.nodeId !== nodeId) {
      setTextSelection(null);
    }
  };

  /**
   * Handle search query changes and update results
   */
  const handleSearchQueryChange = (query: string) => {
    setSearchQuery(query);
    const results = searchInTree(treeData, query);
    setSearchResults(results);
  };

  /**
   * Handle creating a mapping between text selections
   */
  const handleCreateMapping = (searchResult: SearchResult) => {
    if (!selectedSegment || !textSelection || textSelection?.nodeId !== selectedSegment) {
      alert('Please select text in the current segment first');
      return;
    }
    
    const mapping = createTextMapping(textSelection, searchResult);
    setSegmentMappings(prev => [...prev, mapping]);
  };

  /**
   * Handle removing a mapping
   */
  const handleRemoveMapping = (mappingId: string) => {
    setSegmentMappings(prev => prev.filter(m => m.id !== mappingId));
  };

  /**
   * Handle adding a child node to a parent
   */
  const handleAddChild = (parentId: string) => {
    const newNodeId = `node-${Date.now()}`;
    const newNode: TreeNode = {
      id: newNodeId,
      text: 'New text segment',
      children: [],
      level: 0 // Will be updated by updateLevels
    };

    let newTree = addChildToNode(treeData, parentId, newNode);
    newTree = updateLevels(newTree);
    setTreeData(newTree);
    
    // Expand parent node to show new child
    setExpandedNodes(prev => new Set([...prev, parentId]));
  };

  /**
   * Handle deleting a node
   */
  const handleDeleteNode = (nodeId: string) => {
    if (globalThis.confirm('Are you sure you want to delete this node and all its children?')) {
      const newTree = removeNode(treeData, nodeId);
      setTreeData(newTree);
      
      // Remove from expanded nodes
      setExpandedNodes(prev => {
        const newSet = new Set(prev);
        newSet.delete(nodeId);
        return newSet;
      });
    }
  };

  /**
   * Handle adding a root node
   */
  const handleAddRootNode = () => {
    const newNodeId = `node-${Date.now()}`;
    const newNode: TreeNode = {
      id: newNodeId,
      text: 'New root segment',
      children: [],
      level: 0
    };
    
    setTreeData(prev => [...prev, newNode]);
  };

  return {
    handleSegmentClick,
    handleSearchQueryChange,
    handleCreateMapping,
    handleRemoveMapping,
    handleAddChild,
    handleDeleteNode,
    handleAddRootNode,
  };
};
