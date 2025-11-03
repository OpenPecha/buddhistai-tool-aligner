import React, { useState } from 'react';
import type { TreeNode as TreeNodeType, DragState, TextSelection } from '../types';
import { 
  handleDragStart, 
  handleDragOver, 
  handleDragEnter, 
  handleDragLeave, 
  handleDrop 
} from '../utils/drag-utils';
import { handleTextSelection } from '../utils/search-utils';
import { findNode } from '../utils/tree-utils';

interface TreeNodeProps {
  node: TreeNodeType;
  treeData: TreeNodeType[];
  setTreeData: React.Dispatch<React.SetStateAction<TreeNodeType[]>>;
  dragState: DragState;
  setDragState: React.Dispatch<React.SetStateAction<DragState>>;
  dragCounter: React.MutableRefObject<number>;
  expandedNodes: Set<string>;
  toggleExpanded: (nodeId: string) => void;
  selectedSegment: string | null;
  textSelection: TextSelection | null;
  setTextSelection: React.Dispatch<React.SetStateAction<TextSelection | null>>;
  onSegmentClick: (nodeId: string) => void;
  onAddChild: (parentId: string) => void;
  onDelete: (nodeId: string) => void;
  getHierarchicalNumber: (nodeId: string) => string;
  getMappingCount: (nodeId: string) => number;
}

export const TreeNodeComponent: React.FC<TreeNodeProps> = ({
  node,
  treeData,
  setTreeData,
  dragState,
  setDragState,
  dragCounter,
  expandedNodes,
  toggleExpanded,
  selectedSegment,
  textSelection,
  setTextSelection,
  onSegmentClick,
  onAddChild,
  onDelete,
  getHierarchicalNumber,
  getMappingCount,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const isExpanded = expandedNodes.has(node.id);
  const hasChildren = node.children.length > 0;
  const isDraggedOver = dragState.dragOverNode?.id === node.id;
  const dropPosition = dragState.dropPosition;

  const handleTextAreaSelection = (e: React.MouseEvent<HTMLTextAreaElement> | React.KeyboardEvent<HTMLTextAreaElement>) => {
    const selection = handleTextSelection(node.id, e.target as HTMLTextAreaElement);
    setTextSelection(selection);
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newTree = [...treeData];
    const nodeToUpdate = findNode(newTree, node.id);
    if (nodeToUpdate) {
      nodeToUpdate.text = e.target.value;
      setTreeData(newTree);
    }
  };

  function renderActionButtons() {
    return (
      <div 
        className={`
          absolute bottom-2 left-1/2 transform -translate-x-1/2 
          flex items-center justify-center gap-1 
          bg-white border border-gray-200 rounded-lg shadow-lg px-2 py-1
          transition-all duration-200 ease-in-out
          ${isHovered ? 'opacity-100 visible' : 'opacity-0 invisible'}
        `}
        style={{ zIndex: 10 }}
      >
        <button
          onClick={(e) => {
            e.stopPropagation();
            onAddChild(node.id);
          }}
          className="w-7 h-7 flex items-center justify-center text-green-600 hover:bg-green-100 rounded transition-colors"
          title="Add child node"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </button>

        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(node.id);
          }}
          className="w-7 h-7 flex items-center justify-center text-red-600 hover:bg-red-100 rounded transition-colors"
          title="Delete node"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>
    );
  }

  return (
    <div key={node.id} className="select-none  ">
      {/* Drop indicator for 'before' */}
      {isDraggedOver && dropPosition === 'before' && (
        <div className="h-0.5 bg-blue-500 rounded-full mb-1 mx-2"></div>
      )}
      
      <div
        role="treeitem"
        aria-selected={dragState.draggedNode?.id === node.id}
        aria-expanded={hasChildren ? isExpanded : undefined}
        tabIndex={0}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onDragOver={(e) => handleDragOver(e, node, setDragState)}
        onDragEnter={(e) => handleDragEnter(e, dragCounter)}
        onDragLeave={() => handleDragLeave(dragCounter, setDragState)}
        onDrop={(e) => handleDrop(e, node, dragState, treeData, setTreeData, setDragState, dragCounter)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            toggleExpanded(node.id);
          }
        }}
        className={`relative
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

        {/* Action buttons */}
        <div className="flex items-center justify-center flex-col">
          <button 
            draggable
            onDragStart={(e) => handleDragStart(e, node, setDragState, dragCounter)}
            className="w-6 h-6 flex items-center justify-center mr-2 text-gray-400 hover:text-gray-600 cursor-move border-none bg-transparent"
            aria-label="Drag to reorder"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
            </svg>
          </button>

         
        </div>

        {/* Node content */}
        <div className="flex-1 min-w-0 relative">
          <textarea
            value={node.text}
            onChange={handleTextChange}
            onMouseUp={handleTextAreaSelection}
            onKeyUp={(e) => {
              if (e.key === 'ArrowLeft' || e.key === 'ArrowRight' || e.key === 'Shift') {
                handleTextAreaSelection(e);
              }
            }}
            className={`
              min-w-[800px]
              w-full p-2 border border-gray-300 rounded bg-white resize-none min-h-[60px]
              focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
              ${selectedSegment === node.id ? 'bg-blue-50 border-blue-400' : ''}
              ${textSelection?.nodeId === node.id ? 'bg-yellow-50 border-yellow-400' : ''}
              cursor-text hover:bg-gray-50
            `}
            onClick={(e) => {
              e.stopPropagation();
              onSegmentClick(node.id);
            }}
            style={{ resize: "vertical" }}
            rows={4}
          />
          {renderActionButtons()}
        </div>

        {/* Node metadata */}
        <div className="ml-2 absolute top-[-5px] right-0 flex gap-1 flex-col">
          {/* Section number */}
          <span className="ml-2 px-2 py-1 text-xs bg-indigo-100 text-indigo-700 rounded font-medium">
            {getHierarchicalNumber(node.id)}
          </span>

          {/* Mapping count indicator */}
          {getMappingCount(node.id) > 0 && (
            <span className="ml-2 px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded font-medium">
              {getMappingCount(node.id)} mapping{getMappingCount(node.id) > 1 ? 's' : ''}
            </span>
          )}
        </div>
      </div>

      {/* Drop indicator for 'after' */}
      {isDraggedOver && dropPosition === 'after' && (
        <div className="h-0.5 bg-blue-500 rounded-full mt-1 mx-2"></div>
      )}

      {/* Render children */}
      {hasChildren && isExpanded && (
        <div className="ml-6">
          {node.children.map(child => (
            <TreeNodeComponent
              key={child.id}
              node={child}
              treeData={treeData}
              setTreeData={setTreeData}
              dragState={dragState}
              setDragState={setDragState}
              dragCounter={dragCounter}
              expandedNodes={expandedNodes}
              toggleExpanded={toggleExpanded}
              selectedSegment={selectedSegment}
              textSelection={textSelection}
              setTextSelection={setTextSelection}
              onSegmentClick={onSegmentClick}
              onAddChild={onAddChild}
              onDelete={onDelete}
              getHierarchicalNumber={getHierarchicalNumber}
              getMappingCount={getMappingCount}
            />
          ))}
        </div>
      )}
    </div>
  );
};
