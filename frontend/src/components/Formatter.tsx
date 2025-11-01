import React, { useState, useRef } from 'react'
import { root_text } from '../data/text.ts'

interface TreeNode {
  id: string;
  text: string;
  children: TreeNode[];
  level: number;
}

interface SearchResult {
  nodeId: string;
  text: string;
  matchStart: number;
  matchEnd: number;
  context: string;
}

interface SegmentMapping {
  id: string;
  sourceSelection: TextSelection;
  targetSelection: TextSelection;
}

interface TextSelection {
  nodeId: string;
  start: number;
  end: number;
  selectedText: string;
}

interface DragState {
  draggedNode: TreeNode | null;
  dragOverNode: TreeNode | null;
  dropPosition: 'before' | 'after' | 'inside' | null;
}

function Formatter() {
  // Initialize tree structure from root_text
  const initializeTree = (): TreeNode[] => {
    const segments = root_text.split('\n').filter(segment => segment.trim() !== '');
    return segments.map((segment, index) => ({
      id: `node-${index}`,
      text: segment.trim(),
      children: [],
      level: 0
    }));
  };

  const [treeData, setTreeData] = useState<TreeNode[]>(initializeTree());
  const [dragState, setDragState] = useState<DragState>({
    draggedNode: null,
    dragOverNode: null,
    dropPosition: null
  });
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [segmentMappings, setSegmentMappings] = useState<SegmentMapping[]>([]);
  const [selectedSegment, setSelectedSegment] = useState<string | null>(null);
  const [textSelection, setTextSelection] = useState<TextSelection | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [showSearchPanel, setShowSearchPanel] = useState<boolean>(false);

  const dragCounter = useRef(0);

  // Find node by ID in tree
  const findNode = (nodes: TreeNode[], id: string): TreeNode | null => {
    for (const node of nodes) {
      if (node.id === id) return node;
      const found = findNode(node.children, id);
      if (found) return found;
    }
    return null;
  };

  // Remove node from tree
  const removeNode = (nodes: TreeNode[], id: string): TreeNode[] => {
    return nodes.filter(node => {
      if (node.id === id) return false;
      node.children = removeNode(node.children, id);
      return true;
    });
  };

  // Insert node at specific position
  const insertNode = (
    nodes: TreeNode[], 
    targetId: string, 
    newNode: TreeNode, 
    position: 'before' | 'after' | 'inside'
  ): TreeNode[] => {
    const result: TreeNode[] = [];
    
    for (const node of nodes) {
      if (node.id === targetId) {
        if (position === 'before') {
          result.push(newNode, node);
        } else if (position === 'after') {
          result.push(node, newNode);
        } else if (position === 'inside') {
          const updatedNode = { ...node };
          updatedNode.children = [...updatedNode.children, { ...newNode, level: node.level + 1 }];
          result.push(updatedNode);
        }
      } else {
        const updatedNode = { ...node };
        updatedNode.children = insertNode(updatedNode.children, targetId, newNode, position);
        result.push(updatedNode);
      }
    }
    
    return result;
  };

  // Update node levels recursively
  const updateLevels = (nodes: TreeNode[], level: number = 0): TreeNode[] => {
    return nodes.map(node => ({
      ...node,
      level,
      children: updateLevels(node.children, level + 1)
    }));
  };

  // Handle drag start
  const handleDragStart = (e: React.DragEvent, node: TreeNode) => {
    setDragState(prev => ({ ...prev, draggedNode: node }));
    e.dataTransfer.effectAllowed = 'move';
    dragCounter.current = 0;
  };

  // Handle drag over
  const handleDragOver = (e: React.DragEvent, node: TreeNode) => {
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

  // Handle drag enter
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    dragCounter.current++;
  };

  // Handle drag leave
  const handleDragLeave = () => {
    dragCounter.current--;
    if (dragCounter.current === 0) {
      setDragState(prev => ({
        ...prev,
        dragOverNode: null,
        dropPosition: null
      }));
    }
  };

  // Handle drop
  const handleDrop = (e: React.DragEvent, targetNode: TreeNode) => {
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

  // Toggle node expansion
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

  // Add child node
  const addChildNode = (parentId: string) => {
    const newNodeId = `node-${Date.now()}`;
    const newNode: TreeNode = {
      id: newNodeId,
      text: 'New text segment',
      children: [],
      level: 0 // Will be updated by updateLevels
    };

    const addChild = (nodes: TreeNode[]): TreeNode[] => {
      return nodes.map(node => {
        if (node.id === parentId) {
          return {
            ...node,
            children: [...node.children, newNode]
          };
        }
        return {
          ...node,
          children: addChild(node.children)
        };
      });
    };

    let newTree = addChild(treeData);
    newTree = updateLevels(newTree);
    setTreeData(newTree);
    
    // Expand parent node to show new child
    setExpandedNodes(prev => new Set([...prev, parentId]));
  };

  // Delete node
  const deleteNode = (nodeId: string) => {
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

  // Add new root node
  const addRootNode = () => {
    const newNodeId = `node-${Date.now()}`;
    const newNode: TreeNode = {
      id: newNodeId,
      text: 'New root segment',
      children: [],
      level: 0
    };
    
    setTreeData(prev => [...prev, newNode]);
  };

  // Render tree node
  const renderNode = (node: TreeNode): React.ReactElement => {
    const isExpanded = expandedNodes.has(node.id);
    const hasChildren = node.children.length > 0;
    const isDraggedOver = dragState.dragOverNode?.id === node.id;
    const dropPosition = dragState.dropPosition;
    
    return (
      <div key={node.id} className="select-none">
        {/* Drop indicator for 'before' */}
        {isDraggedOver && dropPosition === 'before' && (
          <div className="h-0.5 bg-blue-500 rounded-full mb-1 mx-2"></div>
        )}
        
        <div
          role="treeitem"
          aria-selected={dragState.draggedNode?.id === node.id}
          aria-expanded={hasChildren ? isExpanded : undefined}
          tabIndex={0}
          onDragOver={(e) => handleDragOver(e, node)}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, node)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              toggleExpanded(node.id);
            }
          }}
          className={`
            flex items-start p-2 rounded-lg transition-all duration-200
            ${isDraggedOver && dropPosition === 'inside' ? 'bg-blue-100 border-2 border-blue-300' : 'hover:bg-gray-50'}
            ${dragState.draggedNode?.id === node.id ? 'opacity-50' : ''}
            focus:outline-none focus:ring-2 focus:ring-blue-500
          `}
          style={{ marginLeft: `${node.level * 24}px` }}
        >
          {/* Expand/Collapse button */}
          <button
            onClick={() => toggleExpanded(node.id)}
            className={`
              w-6 h-6 flex items-center justify-center rounded mr-2 transition-colors
              ${hasChildren ? 'hover:bg-gray-200' : 'invisible'}
            `}
          >
            {hasChildren && (
              <svg
                className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            )}
          </button>

          {/* Drag handle */}
          <button 
            draggable
            onDragStart={(e) => handleDragStart(e, node)}
            className="w-6 h-6 flex items-center justify-center mr-2 text-gray-400 hover:text-gray-600 cursor-move border-none bg-transparent"
            aria-label="Drag to reorder"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
            </svg>
          </button>

          {/* Node content */}
          <div className="flex-1 min-w-0">
            <textarea
              value={node.text}
              onChange={(e) => {
                const newTree = [...treeData];
                const nodeToUpdate = findNode(newTree, node.id);
                if (nodeToUpdate) {
                  nodeToUpdate.text = e.target.value;
                  setTreeData(newTree);
                }
              }}
              onMouseUp={(e) => {
                handleTextSelection(node.id, e.target as HTMLTextAreaElement);
              }}
              onKeyUp={(e) => {
                if (e.key === 'ArrowLeft' || e.key === 'ArrowRight' || e.key === 'Shift') {
                  handleTextSelection(node.id, e.target as HTMLTextAreaElement);
                }
              }}
              className={`
                w-full p-2 border border-gray-300 rounded bg-white resize-none min-h-[60px]
                focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                ${selectedSegment === node.id ? 'bg-blue-50 border-blue-400' : ''}
                ${textSelection?.nodeId === node.id ? 'bg-yellow-50 border-yellow-400' : ''}
                cursor-text hover:bg-gray-50
              `}
              onClick={(e) => {
                e.stopPropagation();
                handleSegmentClick(node.id);
              }}
              rows={2}
            />
          </div>

          {/* Section number */}
          <span className="ml-2 px-2 py-1 text-xs bg-indigo-100 text-indigo-700 rounded font-medium">
            {getHierarchicalNumber(node.id)}
          </span>

          {/* Level indicator */}
          <span className="ml-2 px-2 py-1 text-xs bg-gray-100 rounded text-gray-600">
            L{node.level}
          </span>

          {/* Mapping count indicator */}
          {getMappingCount(node.id) > 0 && (
            <span className="ml-2 px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded font-medium">
              {getMappingCount(node.id)} mapping{getMappingCount(node.id) > 1 ? 's' : ''}
            </span>
          )}

          {/* Node actions */}
          <div className="ml-2 flex gap-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                addChildNode(node.id);
              }}
              className="w-6 h-6 flex items-center justify-center text-green-600 hover:bg-green-100 rounded transition-colors"
              title="Add child node"
            >
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                deleteNode(node.id);
              }}
              className="w-6 h-6 flex items-center justify-center text-red-600 hover:bg-red-100 rounded transition-colors"
              title="Delete node"
            >
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>

        {/* Drop indicator for 'after' */}
        {isDraggedOver && dropPosition === 'after' && (
          <div className="h-0.5 bg-blue-500 rounded-full mt-1 mx-2"></div>
        )}

        {/* Render children */}
        {hasChildren && isExpanded && (
          <div className="ml-6">
            {node.children.map(child => renderNode(child))}
          </div>
        )}
      </div>
    );
  };

  // Export tree structure as JSON
  const exportTree = () => {
    const exportData = generateExportData();
    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'text-tree-structure-with-mappings.json';
    link.click();
    URL.revokeObjectURL(url);
  };

  // Flatten tree to text
  const exportAsText = () => {
    const flattenTree = (nodes: TreeNode[], level: number = 0): string[] => {
      const result: string[] = [];
      for (const node of nodes) {
        const indent = '  '.repeat(level);
        result.push(`${indent}${node.text}`);
        if (node.children.length > 0) {
          const childResults = flattenTree(node.children, level + 1);
          result.push(...childResults);
        }
      }
      return result;
    };

    const textContent = flattenTree(treeData).join('\n');
    const dataBlob = new Blob([textContent], { type: 'text/plain' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'text-tree-structure.txt';
    link.click();
    URL.revokeObjectURL(url);
  };

  // Expand all nodes
  const expandAll = () => {
    const getAllNodeIds = (nodes: TreeNode[]): string[] => {
      const ids: string[] = [];
      for (const node of nodes) {
        ids.push(node.id);
        const childIds = getAllNodeIds(node.children);
        ids.push(...childIds);
      }
      return ids;
    };
    setExpandedNodes(new Set(getAllNodeIds(treeData)));
  };

  // Collapse all nodes
  const collapseAll = () => {
    setExpandedNodes(new Set());
  };

  // Search for text across all nodes
  const searchInTree = (query: string): SearchResult[] => {
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
    
    searchInNodes(treeData);
    return results;
  };

  // Handle text selection within a segment
  const handleTextSelection = (nodeId: string, textarea: HTMLTextAreaElement) => {
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    
    if (start !== end) {
      const selectedText = textarea.value.substring(start, end);
      setTextSelection({
        nodeId,
        start,
        end,
        selectedText
      });
    } else {
      setTextSelection(null);
    }
  };

  // Handle segment click
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

  // Handle search query change
  const handleSearchQueryChange = (query: string) => {
    setSearchQuery(query);
    const results = searchInTree(query);
    setSearchResults(results);
  };

  // Create mapping between text selections
  const createMapping = (searchResult: SearchResult) => {
    if (!selectedSegment || !textSelection || textSelection.nodeId !== selectedSegment) {
      alert('Please select text in the current segment first');
      return;
    }
    
    // Create target selection from search result
    const targetSelection: TextSelection = {
      nodeId: searchResult.nodeId,
      start: searchResult.matchStart,
      end: searchResult.matchEnd,
      selectedText: searchResult.text.substring(searchResult.matchStart, searchResult.matchEnd)
    };
    
    const mapping: SegmentMapping = {
      id: `mapping-${Date.now()}`,
      sourceSelection: textSelection,
      targetSelection: targetSelection
    };
    
    setSegmentMappings(prev => [...prev, mapping]);
  };

  // Clear all mappings
  const clearMappings = () => {
    setSegmentMappings([]);
  };

  // Get mapping count for a specific segment
  const getMappingCount = (nodeId: string): number => {
    return segmentMappings.filter(m => m.sourceSelection.nodeId === nodeId || m.targetSelection.nodeId === nodeId).length;
  };

  // Generate hierarchical numbering for nodes
  const generateHierarchicalNumbers = (nodes: TreeNode[], parentNumber: string = ''): Map<string, string> => {
    const numberMap = new Map<string, string>();
    
    nodes.forEach((node, index) => {
      const currentNumber = parentNumber 
        ? `${parentNumber}.${index + 1}` 
        : `${index + 1}`;
      
      numberMap.set(node.id, currentNumber);
      
      // Recursively number children
      if (node.children.length > 0) {
        const childNumbers = generateHierarchicalNumbers(node.children, currentNumber);
        childNumbers.forEach((number, id) => {
          numberMap.set(id, number);
        });
      }
    });
    
    return numberMap;
  };

  // Get hierarchical number for a node
  const getHierarchicalNumber = (nodeId: string): string => {
    const numberMap = generateHierarchicalNumbers(treeData);
    return numberMap.get(nodeId) || nodeId;
  };

  // Generate comprehensive export data
  const generateExportData = () => {
    const numberMap = generateHierarchicalNumbers(treeData);
    
    const exportData = {
      metadata: {
        totalNodes: treeData.length,
        totalMappings: segmentMappings.length,
        exportDate: new Date().toISOString(),
        version: "1.0"
      },
      segments: [] as any[],
      mappings: segmentMappings.map(mapping => ({
        id: mapping.id,
        source: {
          nodeId: mapping.sourceSelection.nodeId,
          hierarchicalNumber: numberMap.get(mapping.sourceSelection.nodeId) || mapping.sourceSelection.nodeId,
          selectedText: mapping.sourceSelection.selectedText,
          start: mapping.sourceSelection.start,
          end: mapping.sourceSelection.end,
          length: mapping.sourceSelection.selectedText.length
        },
        target: {
          nodeId: mapping.targetSelection.nodeId,
          hierarchicalNumber: numberMap.get(mapping.targetSelection.nodeId) || mapping.targetSelection.nodeId,
          selectedText: mapping.targetSelection.selectedText,
          start: mapping.targetSelection.start,
          end: mapping.targetSelection.end,
          length: mapping.targetSelection.selectedText.length
        }
      }))
    };

    // Recursively process nodes to include all details
    const processNodes = (nodes: TreeNode[], parentPath: string = '') => {
      return nodes.map((node, index) => {
        const hierarchicalNumber = numberMap.get(node.id) || node.id;
        const nodeMappings = segmentMappings.filter(m => 
          m.sourceSelection.nodeId === node.id || m.targetSelection.nodeId === node.id
        );
        
        const nodeData = {
          id: node.id,
          hierarchicalNumber,
          text: node.text,
          level: node.level,
          textLength: node.text.length,
          mappingCount: nodeMappings.length,
          mappings: {
            asSource: nodeMappings.filter(m => m.sourceSelection.nodeId === node.id).map(m => ({
              mappingId: m.id,
              targetNode: m.targetSelection.nodeId,
              targetHierarchicalNumber: numberMap.get(m.targetSelection.nodeId) || m.targetSelection.nodeId,
              sourceText: m.sourceSelection.selectedText,
              targetText: m.targetSelection.selectedText
            })),
            asTarget: nodeMappings.filter(m => m.targetSelection.nodeId === node.id).map(m => ({
              mappingId: m.id,
              sourceNode: m.sourceSelection.nodeId,
              sourceHierarchicalNumber: numberMap.get(m.sourceSelection.nodeId) || m.sourceSelection.nodeId,
              sourceText: m.sourceSelection.selectedText,
              targetText: m.targetSelection.selectedText
            }))
          },
          children: node.children.length > 0 ? processNodes(node.children, hierarchicalNumber) : []
        };
        
        return nodeData;
      });
    };

    exportData.segments = processNodes(treeData);
    return exportData;
  };

  return (
    <div className="p-4 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-800">Text Tree Structure</h2>
        <div className="flex gap-2 items-center">
          <span className="text-sm text-gray-600">Total Nodes: {treeData.length}</span>
          {selectedSegment && (
            <span className="text-sm text-blue-600">
              Selected: {getHierarchicalNumber(selectedSegment)}
              {textSelection && textSelection.nodeId === selectedSegment && (
                <span className="text-yellow-600"> | Text: "{textSelection.selectedText.substring(0, 20)}{textSelection.selectedText.length > 20 ? '...' : ''}"</span>
              )}
              {' | Mappings: '}{getMappingCount(selectedSegment)} | Total: {segmentMappings.length}
            </span>
          )}
          <div className="flex gap-2">
            <button
              onClick={() => setShowSearchPanel(!showSearchPanel)}
              className={`px-3 py-1 text-xs rounded transition-colors ${
                showSearchPanel 
                  ? 'bg-blue-100 text-blue-700 hover:bg-blue-200' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {showSearchPanel ? 'Hide Search' : 'Show Search'}
            </button>
            {segmentMappings.length > 0 && (
              <button
                onClick={clearMappings}
                className="px-3 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
              >
                Clear Mappings ({segmentMappings.length})
              </button>
            )}
            <button
              onClick={expandAll}
              className="px-3 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors"
            >
              Expand All
            </button>
            <button
              onClick={collapseAll}
              className="px-3 py-1 text-xs bg-yellow-100 text-yellow-700 rounded hover:bg-yellow-200 transition-colors"
            >
              Collapse All
            </button>
            <button
              onClick={exportAsText}
              className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
            >
              Export Text
            </button>
            <button
              onClick={exportTree}
              className="px-3 py-1 text-xs bg-purple-100 text-purple-700 rounded hover:bg-purple-200 transition-colors"
            >
              Export JSON
            </button>
            <button
              onClick={addRootNode}
              className="px-3 py-1 text-xs bg-indigo-100 text-indigo-700 rounded hover:bg-indigo-200 transition-colors"
            >
              + Add Root
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className={`flex gap-4 ${showSearchPanel ? '' : 'justify-center'}`}>
        {/* Tree Section */}
        <div className={showSearchPanel ? 'flex-1' : 'w-full max-w-4xl'}>
          <div role="tree" className="space-y-1 bg-gray-50 p-4 rounded-lg border">
            {treeData.map(node => renderNode(node))}
          </div>
        </div>

        {/* Search Panel */}
        {showSearchPanel && (
          <div className="w-80 space-y-4">
            <div className="bg-white border rounded-lg p-4 h-fit sticky top-4">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Search & Map</h3>
              {selectedSegment ? (
                <div className="mb-3 p-3 bg-blue-50 rounded border border-blue-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-blue-700 font-medium">Selected Segment:</span>
                    <span className="text-sm font-bold text-blue-900">{getHierarchicalNumber(selectedSegment)}</span>
                  </div>
                  
                  {/* Show selected text portion if any */}
                  {textSelection && textSelection.nodeId === selectedSegment ? (
                    <div className="p-2 bg-yellow-50 border border-yellow-200 rounded">
                      <div className="text-xs text-yellow-700 font-medium mb-1">Selected Text:</div>
                      <div className="text-sm text-yellow-800 bg-white p-2 rounded border border-yellow-200 max-h-20 overflow-y-auto">
                        "{textSelection.selectedText}"
                      </div>
                      <div className="text-xs text-yellow-600 mt-1">
                        Position: {textSelection.start} - {textSelection.end} ({textSelection.selectedText.length} chars)
                      </div>
                    </div>
                  ) : (
                    <div className="p-2 bg-gray-50 border border-gray-200 rounded">
                      <div className="text-sm text-gray-600 text-center">
                        Select text within the segment to see it here
                      </div>
                    </div>
                  )}
                  
                  <div className="text-xs text-blue-600 mt-2">
                    Level: {findNode(treeData, selectedSegment)?.level || 0} | 
                    Length: {findNode(treeData, selectedSegment)?.text.length || 0} chars |
                    Mappings: {getMappingCount(selectedSegment)}
                  </div>
                </div>
              ) : (
                <div className="mb-3 p-2 bg-gray-50 rounded border border-gray-200">
                  <span className="text-sm text-gray-600">Click on a segment to start mapping</span>
                </div>
              )}
              
              <input
                type="text"
                placeholder="Search text in all segments..."
                value={searchQuery}
                onChange={(e) => handleSearchQueryChange(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={!selectedSegment}
              />
            </div>

            {/* Search Results */}
            {searchResults.length > 0 && (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                <h4 className="text-sm font-medium text-gray-700">Search Results ({searchResults.length})</h4>
                {searchResults.map((result, index) => (
                  <button 
                    key={`${result.nodeId}-${index}`}
                    className="w-full text-left p-3 border border-gray-200 rounded hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => createMapping(result)}
                  >
                    <div className="text-xs text-gray-500 mb-1">Section: {getHierarchicalNumber(result.nodeId)}</div>
                    <div className="text-sm text-gray-800 mb-1">{result.context}</div>
                    <div className="text-xs text-blue-600">
                      {textSelection && textSelection.nodeId === selectedSegment 
                        ? 'Click to map selected text' 
                        : 'Select text first to enable mapping'}
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* Current Mappings */}
            {selectedSegment && segmentMappings.filter(m => m.sourceSelection.nodeId === selectedSegment).length > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <h4 className="text-sm font-medium text-gray-700 mb-2">
                  Mappings for {getHierarchicalNumber(selectedSegment)} ({segmentMappings.filter(m => m.sourceSelection.nodeId === selectedSegment).length})
                </h4>
                <div className="space-y-3 max-h-48 overflow-y-auto">
                  {segmentMappings.filter(m => m.sourceSelection.nodeId === selectedSegment).map((mapping) => {
                    return (
                      <div key={mapping.id} className="p-3 bg-green-50 border border-green-200 rounded text-xs">
                        {/* Source Text Selection */}
                        <div className="mb-2">
                          <div className="font-medium text-green-800 mb-1">
                            Source: {getHierarchicalNumber(mapping.sourceSelection.nodeId)}
                          </div>
                          <div className="text-green-700 bg-white p-2 rounded border">
                            "{mapping.sourceSelection.selectedText}"
                          </div>
                          <div className="text-green-600 mt-1">
                            Span: {mapping.sourceSelection.start} - {mapping.sourceSelection.end} ({mapping.sourceSelection.selectedText.length} chars)
                          </div>
                        </div>
                        
                        <div className="text-center text-green-700 my-1">↓ maps to ↓</div>
                        
                        {/* Target Text Selection */}
                        <div className="mb-2">
                          <div className="font-medium text-blue-800 mb-1">
                            Target: {getHierarchicalNumber(mapping.targetSelection.nodeId)}
                          </div>
                          <div className="text-blue-700 bg-white p-2 rounded border">
                            "{mapping.targetSelection.selectedText}"
                          </div>
                          <div className="text-blue-600 mt-1">
                            Span: {mapping.targetSelection.start} - {mapping.targetSelection.end} ({mapping.targetSelection.selectedText.length} chars)
                          </div>
                        </div>
                        
                        <button
                          onClick={() => setSegmentMappings(prev => prev.filter(m => m.id !== mapping.id))}
                          className="mt-2 px-2 py-1 text-red-600 hover:text-red-800 hover:bg-red-100 rounded transition-colors"
                        >
                          Remove Mapping
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            </div>

            {/* JSON Preview Section */}
            <div className="bg-white border rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold text-gray-800">Export Preview</h3>
                <button
                  onClick={exportTree}
                  className="px-3 py-1 text-xs bg-purple-100 text-purple-700 rounded hover:bg-purple-200 transition-colors"
                >
                  Download JSON
                </button>
              </div>
              
              <div className="text-xs text-gray-600 mb-2">
                Live preview of export data structure:
              </div>
              
              <div className="bg-gray-50 border rounded p-3 max-h-96 overflow-y-auto">
                <pre className="text-xs text-gray-800 whitespace-pre-wrap">
                  {JSON.stringify(generateExportData(), null, 2)}
                </pre>
              </div>
              
              <div className="mt-2 text-xs text-gray-500">
                Total: {treeData.length} segments, {segmentMappings.length} mappings
              </div>
            </div>
          </div>
        )}
      </div>


      {/* Instructions */}
      <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <h3 className="font-medium text-blue-900 mb-2">How to use:</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-blue-800">
          <div>
            <h4 className="font-medium mb-1">Drag & Drop:</h4>
            <ul className="space-y-1">
              <li>• <strong>Drag handle icon</strong> to reorder segments</li>
              <li>• <strong>Drop on top third</strong> to place before</li>
              <li>• <strong>Drop on middle third</strong> to nest inside</li>
              <li>• <strong>Drop on bottom third</strong> to place after</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium mb-1">Tree Operations:</h4>
            <ul className="space-y-1">
              <li>• <strong>Click arrow</strong> to expand/collapse</li>
              <li>• <strong>+ button</strong> to add child node</li>
              <li>• <strong>🗑️ button</strong> to delete node</li>
              <li>• <strong>Edit text</strong> directly in textareas</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium mb-1">Search & Mapping:</h4>
            <ul className="space-y-1">
              <li>• <strong>Click segment</strong> to select it</li>
              <li>• <strong>Show search panel</strong> on the right</li>
              <li>• <strong>Search text</strong> across all segments</li>
              <li>• <strong>Click search result</strong> to create mapping</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Formatter
