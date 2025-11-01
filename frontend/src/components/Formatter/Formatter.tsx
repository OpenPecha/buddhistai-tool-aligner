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

function Formatter() {
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

  // Computed values
  const { totalNodes } = getNodeStatistics(treeData);
  const showSearch = shouldShowSearchPanel(showSearchPanel, selectedSegment);



  return (
    <div className={LAYOUT_CONFIG.CONTAINER_CLASSES}>
      {/* Header */}
      <div className={LAYOUT_CONFIG.HEADER_CLASSES}>
        <h2 className={LAYOUT_CONFIG.TITLE_CLASSES}>{TEXT_CONSTANTS.TITLE}</h2>
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
              {' | '}{TEXT_CONSTANTS.LABELS.MAPPINGS} {getNodeMappingCount(selectedSegment, segmentMappings)} | {TEXT_CONSTANTS.LABELS.TOTAL} {segmentMappings.length}
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
            <button
              onClick={() => exportTreeAsText(treeData)}
              className={`${UI_CONFIG.BUTTON_CLASSES.PRIMARY} ${UI_CONFIG.BUTTON_CLASSES.EXPORT_TEXT}`}
            >
              {TEXT_CONSTANTS.BUTTONS.EXPORT_TEXT}
            </button>
            <button
              onClick={() => exportTreeAsJSON(treeData, segmentMappings)}
              className={`${UI_CONFIG.BUTTON_CLASSES.PRIMARY} ${UI_CONFIG.BUTTON_CLASSES.EXPORT_JSON}`}
            >
              {TEXT_CONSTANTS.BUTTONS.EXPORT_JSON}
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className={getMainContentClasses(showSearchPanel)}>
        {/* Tree Section */}
        <div className={getTreeSectionClasses(showSearchPanel)}>
          <div 
            role="tree" 
            className={`${LAYOUT_CONFIG.TREE_CONTAINER_CLASSES} max-h-[${UI_CONFIG.MAX_TREE_HEIGHT}]`}
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
                getMappingCount={(nodeId: string) => getNodeMappingCount(nodeId, segmentMappings)}
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
            getMappingCount={(nodeId: string) => getNodeMappingCount(nodeId, segmentMappings)}
            getMappingsAsSource={(nodeId: string) => getNodeMappingsAsSource(nodeId, segmentMappings)}
          />
        )}
      </div>


    
    </div>
  );
}

export default Formatter
