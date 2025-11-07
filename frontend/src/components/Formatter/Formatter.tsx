import { root_text } from '../../data/text.ts';
import { useTreeState } from './hooks/useTreeState';
import { SimpleTextDisplay } from './components/SimpleTextDisplay';
import SegmentedTextDisplay from './components/SegmentedTextDisplay';
import { TableOfContents } from './components/TableOfContents';
import SegmentTOC from './components/SegmentTOC';
import TextInstanceSelector from './components/TextInstanceSelector';
import { exportTreeAsJSON, exportTreeAsText } from './utils/export-utils';
import {
  getHierarchicalNumber,
  getNodeMappingCount,
} from './utils/formatter-utils';
import {
  createTitleNode,
  getAllTitleNodes,
  createSegmentsFromRange,
} from './utils/tree-utils';
import type { TreeNode, TextRange, TitleCreationData, SegmentAnnotation } from './types';
import { useState, useEffect, useCallback, useMemo } from 'react';
import SubmitFormat from './components/SubmitFormat.tsx';
import './Formatter.css';

function Formatter() {
  const [showTOC, setShowTOC] = useState(true);
  const [headingMap] = useState<Map<number, number>>(new Map());
  const [currentLine, setCurrentLine] = useState(1);
  const [useSegmentView, setUseSegmentView] = useState(true); // Toggle between views
  
  // Text range selection state (for legacy line-based view)
  const [selectedRange, setSelectedRange] = useState<TextRange | null>(null);
  const [availableTitles, setAvailableTitles] = useState<TreeNode[]>([]);
  
  // Text instance state
  const [instanceId, setInstanceId] = useState<string | null>(null);
  const [baseText, setBaseText] = useState<string>('');
  const [segmentAnnotations, setSegmentAnnotations] = useState<SegmentAnnotation[]>([]);
  const [segmentedText, setSegmentedText] = useState<Array<{segment: SegmentAnnotation, text: string}>>([]);
  const [selectedSegments, setSelectedSegments] = useState<string[]>([]);
  
  const {
    treeData,
    setTreeData,
    expandedNodes,
    selectedSegment,
    setSelectedSegment,
    segmentMappings,
    toggleExpanded,
    expandAll,
    collapseAll,
  } = useTreeState([]); // Start with empty tree

  // Keep availableTitles synchronized with treeData (for legacy line-based view)
  useEffect(() => {
    const titles = getAllTitleNodes(treeData);
    setAvailableTitles(titles);
  }, [treeData]);

  // For legacy line-based view, use segmented text with newlines if segments exist, otherwise baseText
  const editorText = useMemo(() => {
    if (segmentAnnotations.length > 0 && baseText) {
      // Create text with newlines between segments
      return segmentAnnotations
        .map(segment => baseText.slice(segment.start, segment.end))
        .join('\n');
    }
    return baseText || root_text;
  }, [segmentAnnotations, baseText]);

  // Handle text loading from TextInstanceSelector
  const handleTextLoad = useCallback((data: {
    instanceId: string;
    content: string;
    baseText: string;
    segmentAnnotations: SegmentAnnotation[];
    segmentedText: Array<{segment: SegmentAnnotation, text: string}>;
  }) => {
    setInstanceId(data.instanceId);
    setBaseText(data.baseText);
    setSegmentAnnotations(data.segmentAnnotations);
    setSegmentedText(data.segmentedText);
    setSelectedSegments([]);
  }, []);

  // Handle changing text (go back to selection)
  const handleChangeText = useCallback(() => {
    setInstanceId(null);
    setBaseText('');
    setSegmentAnnotations([]);
    setSegmentedText([]);
    setSelectedSegments([]);
    setTreeData([]); // Clear legacy tree data
  }, [setTreeData]);

  // Handle segment selection
  const handleSegmentSelect = useCallback((segmentId: string, isShiftClick?: boolean) => {
    if (isShiftClick) {
      // Toggle selection for multiple segments
      setSelectedSegments(prev => 
        prev.includes(segmentId) 
          ? prev.filter(id => id !== segmentId)
          : [...prev, segmentId]
      );
    } else {
      // Single selection
      setSelectedSegments([segmentId]);
    }
  }, []);

  // Handle title assignment to segments
  const handleAssignTitleToSegments = useCallback((title: string, segmentIds?: string[]) => {
    const targetSegments = segmentIds || selectedSegments;
    
    setSegmentAnnotations(prev => 
      prev.map(segment => 
        targetSegments.includes(segment.id)
          ? { ...segment, title }
          : segment
      )
    );
    
    // Clear selection after assignment
    setSelectedSegments([]);
  }, [selectedSegments]);

  // Handle line click from SimpleTextDisplay
  const handleLineClick = useCallback((lineNumber: number, _lineText: string, isShiftClick?: boolean) => {
    setCurrentLine(lineNumber);
    
    // Handle range selection with shift-click
    if (isShiftClick && selectedRange) {
      const startLine = Math.min(selectedRange.startLine, lineNumber);
      const endLine = Math.max(selectedRange.endLine, lineNumber);
      const selectedLines = Array.from({ length: endLine - startLine + 1 }, (_, i) => startLine + i);
      
      setSelectedRange({
        startLine,
        endLine,
        selectedLines
      });
    } else if (isShiftClick && currentLine !== lineNumber) {
      // Start new range selection
      const startLine = Math.min(currentLine, lineNumber);
      const endLine = Math.max(currentLine, lineNumber);
      const selectedLines = Array.from({ length: endLine - startLine + 1 }, (_, i) => startLine + i);
      
      setSelectedRange({
        startLine,
        endLine,
        selectedLines
      });
    } else {
      // Single line selection - clear range
      setSelectedRange(null);
    }
  }, [selectedRange, currentLine]);

  // Handle segment click
  const handleSegmentClick = useCallback((nodeId: string) => {
    setSelectedSegment(nodeId);
  }, [setSelectedSegment]);

  // Handle title creation
  const handleCreateTitle = useCallback((titleData: TitleCreationData) => {
    const newTitleNode = createTitleNode(titleData);
    
    // If there's a selected range, create segments from it and assign to the title
    if (selectedRange && titleData.selectedRange) {
      const textLines = editorText.split('\n');
      let updatedTree = [...treeData, newTitleNode];
      
      // Create segments from the selected range and assign to title
      updatedTree = createSegmentsFromRange(
        updatedTree,
        newTitleNode.id,
        selectedRange.startLine,
        selectedRange.endLine,
        textLines
      );
      
      setTreeData(updatedTree);
    } else {
      // Just add the title node
      setTreeData(prev => [...prev, newTitleNode]);
    }
    
    // Update available titles
    setAvailableTitles(prev => [...prev, newTitleNode]);
    
    // Clear selection after creating title
    setSelectedRange(null);
  }, [selectedRange, editorText, treeData, setTreeData, setAvailableTitles]);

  // Handle title creation from line button
  const handleCreateTitleFromLine = useCallback((lineNumber: number, titleText: string) => {
    const titleData: TitleCreationData = {
      title: titleText,
      selectedRange: {
        startLine: lineNumber,
        endLine: lineNumber,
        selectedLines: [lineNumber]
      }
    };
    handleCreateTitle(titleData);
  }, [handleCreateTitle]);



  // Export functionality
  const handleExportSelect = (exportType: 'text' | 'json') => {
    if (exportType === 'text') {
      exportTreeAsText(treeData);
    } else {
      exportTreeAsJSON(treeData, segmentMappings);
    }
  };





  return (
    <div className="h-screen flex flex-col">

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">

        {/* TOC Sidebar - only show when we have content */}
        {showTOC && instanceId && (
          <div className="w-80 shrink-0 overflow-hidden">
            {useSegmentView ? (
              <SegmentTOC
                segmentAnnotations={segmentAnnotations}
                onClose={() => setShowTOC(false)}
              />
            ) : (
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
                onCreateTitle={handleCreateTitle}
              />
            )}
          </div>
        )}

        {/* Show TOC Button - when TOC is hidden and we have content */}
        {!showTOC && instanceId && (
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

        {/* Editor Section */}
        <div className="flex-1 flex flex-col">
          {/* View Toggle - only show when we have content */}
          {instanceId && (
            <div className="p-4 border-b border-gray-200 bg-white">
              <div className="flex items-center gap-6 flex-wrap">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={useSegmentView}
                    onChange={(e) => setUseSegmentView(e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    Use Segment View
                  </span>
                </label>

                <span className="text-xs text-gray-500">
                  {useSegmentView ?
                    `Showing ${segmentAnnotations.length} segments with annotations` :
                    'Line-based view'
                  }
                </span>

                {/* Instance info and change text button */}
                <div className="ml-auto flex items-center gap-3">
                  <span className="text-xs text-gray-500">
                    Instance: <span className="font-mono">{instanceId}</span>
                  </span>
                  <button
                    onClick={handleChangeText}
                    className="px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md transition-colors duration-200 flex items-center gap-1"
                    title="Change text or instance"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Change Text
                  </button>
                </div>
              </div>
            </div>
          )}
          
          {/* Text Display */}
          <div className="flex-1 overflow-hidden">
            {instanceId === null ? (
              /* Show integrated text selector when no instance is loaded */
              <div className="integrated-text-selector">
                <TextInstanceSelector
                  onTextLoad={handleTextLoad}
                />
              </div>
            ) : (
              /* Show content when instance is loaded */
              <>
                {useSegmentView ? (
                  /* Show segmented view when segment view is enabled */
                  <SegmentedTextDisplay
                    segmentedText={segmentedText}
                    selectedSegments={selectedSegments}
                    onSegmentSelect={handleSegmentSelect}
                    onAssignTitle={handleAssignTitleToSegments}
                  />
                ) : (
                  /* Show line-based view when segment view is disabled */
                  <SimpleTextDisplay
                    text={editorText}
                    headingMap={headingMap}
                    onLineClick={handleLineClick}
                    selectedRange={selectedRange}
                    titleNodes={availableTitles}
                    onCreateTitle={handleCreateTitleFromLine}
                  />
                )}
              </>
            )}
          </div>
        </div>


        {/* Actions Sidebar - only show when we have content */}
        {instanceId && (
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
              <SubmitFormat 
                segmentAnnotations={segmentAnnotations}
              />
            </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Formatter
