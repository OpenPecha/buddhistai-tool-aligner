import { root_text } from '../../data/text.ts';
import { useTreeState } from './hooks/useTreeState';
import { useFormatterHandlers } from './hooks/useFormatterHandlers';
import { TreeNodeComponent } from './components/TreeNode';
import { SearchPanel } from './components/SearchPanel';
import { findNode } from './utils/tree-utils';
import { exportTreeAsJSON, exportTreeAsText } from './utils/export-utils';
import {
  getHierarchicalNumber,
  getNodeMappingCount,
  getNodeMappingsAsSource,
  formatSelectedTextDisplay,
  getNodeStatistics,
  shouldShowSearchPanel,
  getSearchPanelToggleClasses,
  getMainContentClasses,
  getTreeSectionClasses,
} from './utils/formatter-utils';
import { UI_CONFIG, TEXT_CONSTANTS, LAYOUT_CONFIG } from './constants/formatter-constants';
import type { ImportData, TreeNode } from './types';
import {useEffect, useState, useRef } from 'react';
import SubmitFormat from './components/SubmitFormat.tsx';

// Utility function to convert imported JSON data to TreeNode format
function convertImportDataToTreeNodes(importData: ImportData): TreeNode[] {
  return importData.segments;
}

type FormatterProps = {
 readonly formatting_data: ImportData;
}

function Formatter({formatting_data}:FormatterProps) {
  const {
    treeData,
    setTreeData,
    dragState,
    setDragState,
    dragCounter,
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
    toggleExpanded,
    expandAll,
    collapseAll,
    clearMappings,
  } = useTreeState(root_text);

  // Update tree data when imported data changes
  useEffect(() => {
    if (formatting_data) {
      setTreeData(convertImportDataToTreeNodes(formatting_data));
    }
  }, [formatting_data, setTreeData]);

  // Event handlers hook
  const {
    handleSegmentClick,
    handleSearchQueryChange,
    handleCreateMapping,
    handleRemoveMapping,
    handleAddChild,
    handleDeleteNode,
    handleAddRootNode,
  } = useFormatterHandlers({
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
  });

  // Export functionality
  const [showExportDropdown, setShowExportDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleExportSelect = (exportType: 'text' | 'json') => {
    if (exportType === 'text') {
      exportTreeAsText(treeData);
    } else {
      exportTreeAsJSON(treeData, segmentMappings);
    }
    setShowExportDropdown(false);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowExportDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Computed values
  const { totalNodes } = getNodeStatistics(treeData);
  const showSearch = shouldShowSearchPanel(showSearchPanel, selectedSegment);



  return (
    <div className={LAYOUT_CONFIG.CONTAINER_CLASSES}>
      {/* Header */}
      <div className={LAYOUT_CONFIG.HEADER_CLASSES}>
        <div className="flex items-center gap-2">
        <img src="/img/icon.png" alt="Icon" className="w-10 h-10" />
        <h2 className={LAYOUT_CONFIG.TITLE_CLASSES}>{TEXT_CONSTANTS.TITLE}</h2>
        </div>
        <div className="flex gap-2 items-center">
          <span className={LAYOUT_CONFIG.STATS_CLASSES}>
            {TEXT_CONSTANTS.LABELS.TOTAL_NODES} {totalNodes}
          </span>
          {selectedSegment && (
            <span className={LAYOUT_CONFIG.SELECTED_INFO_CLASSES}>
              {TEXT_CONSTANTS.LABELS.SELECTED} {getHierarchicalNumber(selectedSegment, treeData)}
              {textSelection && textSelection?.nodeId === selectedSegment && (
                <span className={LAYOUT_CONFIG.TEXT_HIGHLIGHT_CLASSES}>
                  {' | '}{TEXT_CONSTANTS.LABELS.TEXT} "{formatSelectedTextDisplay(textSelection.selectedText, UI_CONFIG.MAX_TEXT_DISPLAY_LENGTH)}"
                </span>
              )}
              {' | '}{TEXT_CONSTANTS.LABELS.MAPPINGS} {getNodeMappingCount(selectedSegment, segmentMappings, treeData)} | {TEXT_CONSTANTS.LABELS.TOTAL} {segmentMappings.length}
            </span>
          )}
          <div className={LAYOUT_CONFIG.BUTTON_GROUP_CLASSES}>
         
            <button
              onClick={() => setShowSearchPanel(!showSearchPanel)}
              className={`${UI_CONFIG.BUTTON_CLASSES.PRIMARY} ${getSearchPanelToggleClasses(showSearchPanel)}`}
            >
              {showSearchPanel ? TEXT_CONSTANTS.BUTTONS.HIDE_SEARCH : TEXT_CONSTANTS.BUTTONS.SHOW_SEARCH}
            </button>
            {segmentMappings.length > 0 && (
              <button
                onClick={clearMappings}
                className={`${UI_CONFIG.BUTTON_CLASSES.PRIMARY} ${UI_CONFIG.BUTTON_CLASSES.CLEAR_MAPPINGS}`}
              >
                {TEXT_CONSTANTS.BUTTONS.CLEAR_MAPPINGS} ({segmentMappings.length})
              </button>
            )}
            <button
              onClick={expandAll}
              className={`${UI_CONFIG.BUTTON_CLASSES.PRIMARY} ${UI_CONFIG.BUTTON_CLASSES.EXPAND_ALL}`}
            >
              {TEXT_CONSTANTS.BUTTONS.EXPAND_ALL}
            </button>
            <button
              onClick={collapseAll}
              className={`${UI_CONFIG.BUTTON_CLASSES.PRIMARY} ${UI_CONFIG.BUTTON_CLASSES.COLLAPSE_ALL}`}
            >
              {TEXT_CONSTANTS.BUTTONS.COLLAPSE_ALL}
            </button>
            
            {/* Export Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setShowExportDropdown(!showExportDropdown)}
                className={`${UI_CONFIG.BUTTON_CLASSES.PRIMARY} bg-green-600 hover:bg-green-700 flex items-center gap-1`}
              >
                Export
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              
              {showExportDropdown && (
                <div className="absolute right-0 mt-1 w-32 bg-white border border-gray-200 rounded-md shadow-lg z-10">
                  <button
                    onClick={() => handleExportSelect('text')}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-t-md"
                  >
                    Export Text
                  </button>
                  <button
                    onClick={() => handleExportSelect('json')}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-b-md"
                  >
                    Export JSON
                  </button>
                </div>
              )}
            </div>

            <SubmitFormat treeData={treeData} segmentMappings={segmentMappings} />

          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className={getMainContentClasses(showSearchPanel)}>
        {/* Tree Section */}
        <div className={getTreeSectionClasses(showSearchPanel)}>
          <div 
            role="tree" 
            className={`${LAYOUT_CONFIG.TREE_CONTAINER_CLASSES} h-[calc(100vh-100px)]`}
          >
            {treeData.map(node => (
              <TreeNodeComponent
                key={node.id}
                node={node}
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
                onSegmentClick={handleSegmentClick}
                onAddChild={handleAddChild}
                onDelete={handleDeleteNode}
                getHierarchicalNumber={(nodeId: string) => getHierarchicalNumber(nodeId, treeData)}
                getMappingCount={(nodeId: string) => getNodeMappingCount(nodeId, segmentMappings, treeData)}
              />
            ))}
            <button
              className={LAYOUT_CONFIG.ADD_ROOT_BUTTON_CLASSES}
              onClick={handleAddRootNode}
            >
              {TEXT_CONSTANTS.BUTTONS.ADD_ROOT}
            </button>
          </div>
        </div>

        {/* Search Panel */}
        {showSearch && (
          <SearchPanel
            selectedSegment={selectedSegment}
            textSelection={textSelection}
            searchQuery={searchQuery}
            searchResults={searchResults}
            segmentMappings={segmentMappings}
            treeData={treeData}
            onSearchQueryChange={handleSearchQueryChange}
            onCreateMapping={handleCreateMapping}
            onRemoveMapping={handleRemoveMapping}
            getHierarchicalNumber={(nodeId: string) => getHierarchicalNumber(nodeId, treeData)}
            findNode={findNode}
            getMappingCount={(nodeId: string) => getNodeMappingCount(nodeId, segmentMappings, treeData)}
            getMappingsAsSource={(nodeId: string) => getNodeMappingsAsSource(nodeId, segmentMappings)}
          />
        )}
      </div>


    
    </div>
  );
}

export default Formatter
