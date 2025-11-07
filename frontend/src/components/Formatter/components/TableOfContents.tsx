import React, { useState } from 'react';
import type { TreeNode, TitleCreationData } from '../types';

interface TableOfContentsProps {
  treeData: TreeNode[];
  selectedSegment: string | null;
  onSegmentClick: (nodeId: string) => void;
  getHierarchicalNumber: (nodeId: string) => string;
  getMappingCount: (nodeId: string) => number;
  expandedNodes: Set<string>;
  toggleExpanded: (nodeId: string) => void;
  onClose: () => void;
  expandAll: () => void;
  collapseAll: () => void;
  onCreateTitle?: (titleData: TitleCreationData) => void;
}

interface TOCNodeProps {
  node: TreeNode;
  selectedSegment: string | null;
  onSegmentClick: (nodeId: string) => void;
  getHierarchicalNumber: (nodeId: string) => string;
  getMappingCount: (nodeId: string) => number;
  expandedNodes: Set<string>;
  toggleExpanded: (nodeId: string) => void;
}

const TOCNode: React.FC<TOCNodeProps> = ({
  node,
  selectedSegment,
  onSegmentClick,
  getHierarchicalNumber,
  getMappingCount,
  expandedNodes,
  toggleExpanded,
}) => {
  const isExpanded = expandedNodes.has(node.id);
  const hasChildren = node.children.length > 0;
  const isSelected = selectedSegment === node.id;
  const mappingCount = getMappingCount(node.id);

  // Truncate text for display
  const displayText = node.text.length > 50 
    ? `${node.text.substring(0, 50)}...` 
    : node.text;

  // Level-based styling
  const getLevelClasses = (level: number, isTitle: boolean = false) => {
    const baseClasses = "px-2 py-0.5 rounded text-xs font-medium";
    
    if (isTitle) {
      return `${baseClasses} bg-amber-100 text-amber-700 font-bold`;
    }
    
    switch(level) {
      case 0: return `${baseClasses} bg-red-100 text-red-700`; // H1
      case 1: return `${baseClasses} bg-orange-100 text-orange-700`; // H2
      case 2: return `${baseClasses} bg-yellow-100 text-yellow-700`; // H3
      case 3: return `${baseClasses} bg-green-100 text-green-700`; // H4
      case 4: return `${baseClasses} bg-blue-100 text-blue-700`; // H5
      case 5: return `${baseClasses} bg-purple-100 text-purple-700`; // H6
      default: return `${baseClasses} bg-gray-100 text-gray-700`;
    }
  };

  return (
    <div className="toc-node">
      <div
        className={`
          flex items-center gap-2 p-2 rounded cursor-pointer transition-colors
          hover:bg-gray-100
          ${isSelected ? 'bg-blue-50 border-l-4 border-blue-500' : ''}
          ${node.isTitle ? 'bg-amber-50 border-l-4 border-amber-400' : ''}
        `}
        style={{ paddingLeft: `${node.level * 16 + 8}px` }}
        onClick={() => onSegmentClick(node.id)}
      >
        {/* Expand/Collapse button */}
        {hasChildren && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleExpanded(node.id);
            }}
            className="shrink-0 w-4 h-4 flex items-center justify-center hover:bg-gray-200 rounded"
          >
            <svg
              className={`w-3 h-3 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        )}
        {!hasChildren && <div className="w-4" />}

        {/* Node content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold text-gray-700">
              {getHierarchicalNumber(node.id)}
            </span>
            <span className={getLevelClasses(node.level, node.isTitle)}>
              {node.isTitle ? 'TITLE' : `H${node.level + 1}`}
            </span>
            {mappingCount > 0 && (
              <span className="px-2 py-0.5 rounded text-xs font-medium bg-indigo-100 text-indigo-700">
                {mappingCount}
              </span>
            )}
          </div>
          <div className={`text-xs truncate ${node.isTitle ? 'text-amber-700 font-semibold' : 'text-gray-600'}`} title={node.title || node.text}>
            {node.isTitle ? (node.title || displayText) : displayText}
          </div>
        </div>
      </div>

      {/* Render children */}
      {hasChildren && isExpanded && (
        <div>
          {node.children.filter(child => child.type === 'heading').map((child) => (
            <TOCNode
              key={child.id}
              node={child}
              selectedSegment={selectedSegment}
              onSegmentClick={onSegmentClick}
              getHierarchicalNumber={getHierarchicalNumber}
              getMappingCount={getMappingCount}
              expandedNodes={expandedNodes}
              toggleExpanded={toggleExpanded}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export const TableOfContents: React.FC<TableOfContentsProps> = ({
  treeData,
  selectedSegment,
  onSegmentClick,
  getHierarchicalNumber,
  getMappingCount,
  expandedNodes,
  toggleExpanded,
  onClose,
  expandAll,
  collapseAll,
  onCreateTitle,
}) => {
  const [newTitleText, setNewTitleText] = useState('');

  const handleCreateTitle = () => {
    if (newTitleText.trim() && onCreateTitle) {
      const titleData: TitleCreationData = {
        title: newTitleText.trim(),
      };
      onCreateTitle(titleData);
      setNewTitleText('');
    }
  };

  return (
    <div className="h-full flex flex-col bg-white border-r border-gray-200">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
            </svg>
            Table of Contents
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-gray-200 rounded transition-colors"
            title="Hide TOC"
          >
            <svg className="w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        </div>
      
        <div className="flex gap-1 mb-3">
          <button
            onClick={expandAll}
            className="flex-1 px-2 py-1 text-xs bg-blue-100 hover:bg-blue-200 text-blue-700 rounded transition-colors"
            title="Expand all nodes"
          >
            Expand All
          </button>
          <button
            onClick={collapseAll}
            className="flex-1 px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 rounded transition-colors"
            title="Collapse all nodes"
          >
            Collapse All
          </button>
        </div>

        {/* Title Creation */}
        {onCreateTitle && (
          <div className="space-y-2">
            <div className="text-xs font-semibold text-gray-700">Add New Title</div>
            <div className="flex gap-1">
              <input
                type="text"
                value={newTitleText}
                onChange={(e) => setNewTitleText(e.target.value)}
                placeholder="Enter title name"
                className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-amber-500 focus:border-amber-500"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleCreateTitle();
                  }
                }}
              />
              <button
                onClick={handleCreateTitle}
                disabled={!newTitleText.trim()}
                className="px-2 py-1 text-xs bg-amber-600 hover:bg-amber-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded transition-colors"
                title="Create new title"
              >
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* TOC Tree */}
      <div className="flex-1 overflow-y-auto p-2">
        {treeData.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-400 text-sm">
            No sections yet
          </div>
        ) : (
          treeData.filter(node => node.type === 'heading' || node.isTitle).map((node) => (
            <TOCNode
              key={node.id}
              node={node}
              selectedSegment={selectedSegment}
              onSegmentClick={onSegmentClick}
              getHierarchicalNumber={getHierarchicalNumber}
              getMappingCount={getMappingCount}
              expandedNodes={expandedNodes}
              toggleExpanded={toggleExpanded}
            />
          ))
        )}
      </div>

      {/* Legend */}
      <div className="p-3 border-t border-gray-200 bg-gray-50">
        <div className="text-xs font-semibold text-gray-700 mb-2">Legend</div>
        <div className="grid grid-cols-3 gap-1 mb-2">
          <span className="px-2 py-0.5 rounded text-xs bg-red-100 text-red-700 text-center">H1</span>
          <span className="px-2 py-0.5 rounded text-xs bg-orange-100 text-orange-700 text-center">H2</span>
          <span className="px-2 py-0.5 rounded text-xs bg-yellow-100 text-yellow-700 text-center">H3</span>
          <span className="px-2 py-0.5 rounded text-xs bg-green-100 text-green-700 text-center">H4</span>
          <span className="px-2 py-0.5 rounded text-xs bg-blue-100 text-blue-700 text-center">H5</span>
          <span className="px-2 py-0.5 rounded text-xs bg-purple-100 text-purple-700 text-center">H6</span>
        </div>
        <div className="flex justify-center">
          <span className="px-2 py-0.5 rounded text-xs bg-amber-100 text-amber-700 font-bold text-center">TITLE</span>
        </div>
      </div>
    </div>
  );
};

