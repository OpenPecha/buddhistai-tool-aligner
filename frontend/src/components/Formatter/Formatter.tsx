import { root_text } from '../../data/text.ts';
import { useTreeState } from './hooks/useTreeState';
import { SimpleTextDisplay } from './components/SimpleTextDisplay';
import { TableOfContents } from './components/TableOfContents';
import { EditorToolbar } from './components/EditorToolbar';
import { exportTreeAsJSON, exportTreeAsText } from './utils/export-utils';
import {
  getHierarchicalNumber,
  getNodeMappingCount,
} from './utils/formatter-utils';
import { LAYOUT_CONFIG } from './constants/formatter-constants';
import type { TreeNode } from './types';
import { useState } from 'react';
import SubmitFormat from './components/SubmitFormat.tsx';

function Formatter() {
  const [showTOC, setShowTOC] = useState(true);
  const [editorText] = useState(root_text);
  const [headingMap, setHeadingMap] = useState<Map<number, number>>(new Map());
  const [currentLine, setCurrentLine] = useState(1);
  const [currentLineText, setCurrentLineText] = useState('');
  
  const {
    treeData,
    setTreeData,
    expandedNodes,
    setExpandedNodes,
    selectedSegment,
    setSelectedSegment,
    segmentMappings,
    toggleExpanded,
    expandAll,
    collapseAll,
  } = useTreeState([]); // Start with empty tree

  // Handle line click from SimpleTextDisplay
  const handleLineClick = (lineNumber: number, lineText: string) => {
    setCurrentLine(lineNumber);
    setCurrentLineText(lineText);
  };

  // Handle segment click
  const handleSegmentClick = (nodeId: string) => {
    setSelectedSegment(nodeId);
  };

  // Export functionality
  const handleExportSelect = (exportType: 'text' | 'json') => {
    if (exportType === 'text') {
      exportTreeAsText(treeData);
    } else {
      exportTreeAsJSON(treeData, segmentMappings);
    }
  };

  // Handle applying heading from toolbar
  const handleApplyHeading = (level: number) => {
    // Update heading map
    const newHeadingMap = new Map(headingMap);
    newHeadingMap.set(currentLine, level - 1); // Store as 0-5 for internal use
    setHeadingMap(newHeadingMap);
    
    const newTree = [...treeData];
    
    // Generate a unique ID for the node
    const nodeId = `line-${currentLine}-${Date.now()}`;
    
    // Create a new node
    const newNode: TreeNode = {
      id: nodeId,
      hierarchicalNumber: '',
      text: currentLineText.trim(),
      level: level - 1, // Convert H1-H6 to level 0-5
      type: 'heading',
      lineNumber: currentLine,
      textLength: currentLineText.trim().length,
      mappingCount: 0,
      mappings: {
        asSource: [],
        asTarget: [],
      },
      children: [],
    };
    
    // Insert node in correct position based on line number and hierarchy
    const insertNodeByLineNumber = (nodes: TreeNode[], node: TreeNode): TreeNode[] => {
      if (nodes.length === 0) {
        return [node];
      }
      
      const result: TreeNode[] = [];
      let inserted = false;
      
      for (let i = 0; i < nodes.length; i++) {
        const currentNode = nodes[i];
        
        // If new node should come before current node (by line number)
        if (!inserted && node.lineNumber! < (currentNode.lineNumber || Infinity)) {
          // Check if it should be a child of previous node based on level
          if (i > 0 && node.level > nodes[i - 1].level) {
            // Insert as child of previous node
            const prevNode = result.at(-1)!;
            result[result.length - 1] = {
              ...prevNode,
              children: insertNodeByLineNumber(prevNode.children, node)
            };
            inserted = true;
          } else {
            // Insert as sibling before current node
            result.push(node);
            inserted = true;
          }
        }
        
        result.push(currentNode);
      }
      
      // If not inserted yet, add at the end
      if (!inserted) {
        const lastNode = result.at(-1)!;
        if (node.level > lastNode.level) {
          // Add as child of last node
          result[result.length - 1] = {
            ...lastNode,
            children: insertNodeByLineNumber(lastNode.children, node)
          };
        } else {
          // Add as sibling at end
          result.push(node);
        }
      }
      
      return result;
    };
    
    const updatedTree = insertNodeByLineNumber(newTree, newNode);
    setTreeData(updatedTree);
    
    // Select the new node
    setSelectedSegment(nodeId);
    
    // Expand the node's parent if it has one
    setExpandedNodes(new Set([...expandedNodes, nodeId]));
  };




  return (
    <div className={LAYOUT_CONFIG.CONTAINER_CLASSES}>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Show TOC Button - when TOC is hidden */}
        {!showTOC && (
          <button
            onClick={() => setShowTOC(true)}
            className="w-8 shrink-0 bg-gray-100 hover:bg-gray-200 border-r border-gray-300 flex items-center justify-center transition-colors"
            title="Show Table of Contents"
          >
            <svg className="w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        )}

        {/* TOC Sidebar */}
        {showTOC && (
          <div className="w-80 shrink-0 overflow-hidden">
            <TableOfContents
              treeData={treeData}
              selectedSegment={selectedSegment}
              onSegmentClick={handleSegmentClick}
              getHierarchicalNumber={(nodeId: string) => getHierarchicalNumber(nodeId, treeData)}
              getMappingCount={(nodeId: string) => getNodeMappingCount(nodeId, segmentMappings, treeData)}
              expandedNodes={expandedNodes}
              toggleExpanded={toggleExpanded}
              onClose={() => setShowTOC(false)}
              expandAll={expandAll}
              collapseAll={collapseAll}
            />
          </div>
        )}

        {/* Editor Section */}
        <div className="flex-1 flex flex-col">
          {/* Editor Toolbar */}
          <EditorToolbar
            currentLine={currentLine}
            currentLineText={currentLineText}
            onApply={handleApplyHeading}
          />
          
          {/* Text Display */}
          <div className={`${LAYOUT_CONFIG.TREE_CONTAINER_CLASSES} flex-1`}>
            <SimpleTextDisplay
              text={editorText}
              headingMap={headingMap}
              onLineClick={handleLineClick}
            />
          </div>
        </div>


        {/* Actions Sidebar */}
        <div className="w-64 shrink-0 bg-white border-l border-gray-200 flex flex-col">
          <div className="p-4 border-b border-gray-200 bg-gray-50">
            <h3 className="text-sm font-semibold text-gray-800">Actions</h3>
          </div>
          
          <div className="flex-1 p-4 space-y-3">
            {/* Export Section */}
            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Export</h4>
              <button
                onClick={() => handleExportSelect('text')}
                className="w-full px-4 py-2 text-sm bg-green-600 hover:bg-green-700 text-white rounded-md transition-colors flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Export Text
              </button>
              <button
                onClick={() => handleExportSelect('json')}
                className="w-full px-4 py-2  text-sm bg-transparent border border-green-700 hover:text-white hover:bg-green-700 text-green-700 rounded-md transition-colors flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
                </svg>
                Export JSON
              </button>
            </div>

            {/* Submit Section */}
            <div className="space-y-2 pt-3 border-t border-gray-200">
              <h4 className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Submit</h4>
              <SubmitFormat treeData={treeData} segmentMappings={segmentMappings} />
            </div>
          </div>
        </div>
      </div>


    
    </div>
  );
}

export default Formatter
