import { root_text } from '../../../data/text.ts';
import { useTreeState } from '../hooks/useTreeState';
import { SimpleTextDisplay } from './SimpleTextDisplay';
import SegmentedTextDisplay from './SegmentedTextDisplay';
import { TableOfContents } from './TableOfContents';
import SegmentTOC from './SegmentTOC';
import { exportTreeAsJSON, exportTreeAsText } from '../utils/export-utils';
import {
  getHierarchicalNumber,
  getNodeMappingCount,
} from '../utils/formatter-utils';
import {
  createTitleNode,
  getAllTitleNodes,
  createSegmentsFromRange,
} from '../utils/tree-utils';
import type { TreeNode, TextRange, TitleCreationData, SegmentAnnotation } from '../types';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useInstance, useAnnotation } from '../../../hooks/useTextData';
import type { SegmentationAnnotation as APISegmentationAnnotation } from '../../../types/text';
import SubmitFormat from './SubmitFormat.tsx';
import '../Formatter.css';
import { useTranslation } from 'react-i18next';
import { fetchAnnotation, fetchInstance } from '../../../api/text.ts';

function FormatterWorkstation() {
  const { t } = useTranslation();
  const { instanceId: urlInstanceId } = useParams<{ instanceId: string }>();
  const navigate = useNavigate();
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
  const [hasExistingSegmentation, setHasExistingSegmentation] = useState<boolean>(false);
  const [hasExistingTOC, setHasExistingTOC] = useState<boolean>(false);
  const [isLoadingAnnotations, setIsLoadingAnnotations] = useState<boolean>(false);
  
  // Fetch instance data if URL parameter is provided
  const { data: urlInstanceData, isLoading: isLoadingUrlInstance, isSuccess: isUrlInstanceSuccess } = useInstance(urlInstanceId || null);
  
  // Get segmentation annotation ID from the URL instance
  const urlSegmentationAnnotationId = urlInstanceData?.annotations && Array.isArray(urlInstanceData.annotations) 
    ? urlInstanceData.annotations.find((annotation: { type?: string; annotation_id?: string }) => annotation.type === 'segmentation')?.annotation_id
    : undefined;
  
  // Determine if we've checked for segmentation annotation
  const hasCheckedForSegmentation = isUrlInstanceSuccess && urlInstanceData;
  
  // Fetch segmentation annotation for URL instance
  const { isLoading: isLoadingUrlSegmentation, isSuccess: isUrlSegmentationSuccess } = useAnnotation(urlSegmentationAnnotationId || null);
  
  // Determine if we're ready to load (either segmentation loaded or no segmentation exists)
  const isReadyToLoad = hasCheckedForSegmentation && (
    !urlSegmentationAnnotationId || // No segmentation annotation
    (urlSegmentationAnnotationId && isUrlSegmentationSuccess) // Segmentation loaded
  );
  
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

  // Keep segmentedText synchronized with segmentAnnotations
  useEffect(() => {
    if (segmentAnnotations.length > 0 && baseText) {
      const updatedSegmentedText = segmentAnnotations.map(segment => ({
        segment,
        text: baseText.slice(segment.start, segment.end)
      }));
     
      setSegmentedText(updatedSegmentedText);
    }
  }, [segmentAnnotations, baseText]);

  // For legacy line-based view, use segmented text with newlines if segments exist, otherwise baseText
  const editorText = useMemo(() => {
    if (segmentAnnotations.length > 0 && baseText) {
      // Create text with newlines between segments
      const generated = segmentAnnotations
        .map(segment => baseText.slice(segment.start, segment.end))
        .join('\n');
  
      return generated;
    }
 
    return baseText || root_text;
  }, [segmentAnnotations, baseText]);

  // Auto-load instance from URL parameter if provided
  useEffect(() => {
    // Don't load if:
    // - No URL instance ID
    // - Already loaded an instance
    // - Not ready to load (still fetching data)
    const loadUrlInstance = async () => {
      try {
        if (!urlInstanceId || !urlInstanceData) {
          setIsLoadingAnnotations(false);
          return;
        }
        
        setIsLoadingAnnotations(true);
        
        const baseText = urlInstanceData.content || '';
        const segmentAnnotations: SegmentAnnotation[] = [];
        const instance = await fetchInstance(urlInstanceId);

        // Handle annotations as array (API format)
        const annotationsArray = Array.isArray(instance.annotations) 
          ? instance.annotations 
          : [];
        
        const TOC_annotation = annotationsArray.find((annotation: { type?: string; annotation_id?: string }) => annotation.type === 'table_of_contents');
        const segmentation_annotation = annotationsArray.find((annotation: { type?: string; annotation_id?: string }) => annotation.type === 'segmentation');
        
        // Process TOC and segmentation annotations
        const segmentIdToTitleMap = new Map<string, string>();
        
        // Fetch TOC annotation if it exists
        if (TOC_annotation) {
          setHasExistingTOC(true);
          try {
            const TOCAnnotationId = TOC_annotation.annotation_id;
            if (TOCAnnotationId) {
              const tocAnnotations = await fetchAnnotation(TOCAnnotationId);
              
              // Parse TOC data structure
              let tocData: Array<{ id: string; title: string; segments: string[] }> = [];
              
              if (tocAnnotations && typeof tocAnnotations === 'object') {
                const tocDataProperty = (tocAnnotations as Record<string, unknown>).data;
                if (tocDataProperty && Array.isArray(tocDataProperty)) {
                  tocData = tocDataProperty as Array<{ id: string; title: string; segments: string[] }>;
                }
              }
              
              // Create a map of segment ID -> title from TOC
              for (const tocEntry of tocData) {
                for (const segmentId of tocEntry.segments) {
                  segmentIdToTitleMap.set(segmentId, tocEntry.title);
                }
              }
              
              console.log(`TOC found with ${tocData.length} entries, mapping ${segmentIdToTitleMap.size} segments`);
            }
          } catch (tocError) {
            console.warn('Error processing TOC annotation:', tocError);
          }
        } else {
          setHasExistingTOC(false);
        }
        
        // Fetch and process segmentation annotation
        if (segmentation_annotation) {
          console.log('segmentation annotation found');
          try {
            const segmentationAnnotationId = segmentation_annotation.annotation_id;
            if (segmentationAnnotationId) {
              const urlSegmentationData = await fetchAnnotation(segmentationAnnotationId);
              
              // Handle different annotation data structures
              let annotationArray: APISegmentationAnnotation[] = [];
              
              if (Array.isArray(urlSegmentationData)) {
                annotationArray = urlSegmentationData as APISegmentationAnnotation[];
              } else if (urlSegmentationData && typeof urlSegmentationData === 'object') {
                // Check for data property (new API format: { id, type, data: [...] })
                const dataProperty = (urlSegmentationData as Record<string, unknown>).data;
                if (dataProperty && Array.isArray(dataProperty)) {
                  annotationArray = dataProperty as APISegmentationAnnotation[];
                } 
                // Check for annotation property (legacy format: { annotation: [...] })
                else {
                  const annotationProperty = (urlSegmentationData as Record<string, unknown>).annotation;
                  if (annotationProperty && Array.isArray(annotationProperty)) {
                    annotationArray = annotationProperty as APISegmentationAnnotation[];
                  } else {
                    console.warn('Unexpected segmentation data structure:', urlSegmentationData);
                  }
                }
              }
              
              if (annotationArray.length > 0) {
                // Convert to formatter-compatible segments and apply titles from TOC
                const convertedSegments: SegmentAnnotation[] = annotationArray.map((seg: APISegmentationAnnotation, index: number) => {
                  const segmentId = seg.id || `seg_${index + 1}`;
                  const title = segmentIdToTitleMap.get(segmentId);
                  
                  return {
                    id: segmentId,
                    start: seg.span?.start || 0,
                    end: seg.span?.end || 0,
                    ...(title && { title }), // Apply title if found in TOC map
                  };
                });
                
                // Update segmentAnnotations with the converted segments
                segmentAnnotations.push(...convertedSegments);
                
                const segmentsWithTitles = convertedSegments.filter(s => s.title).length;
                const titleInfo = segmentsWithTitles > 0 ? `, ${segmentsWithTitles} with titles` : '';
                console.log(`Applied ${convertedSegments.length} segmentation segments${titleInfo}`);
              }
            }
          } catch (segError) {
            console.warn('Error applying segmentation:', segError);
          }
        }
        
        // Create segmented text array
        const segmentedText = segmentAnnotations.map(segment => ({
          segment,
          text: baseText.slice(segment.start, segment.end)
        }));
        
        // Load the data
        setInstanceId(urlInstanceId);
        setBaseText(baseText);
        setSegmentAnnotations(segmentAnnotations);
        setSegmentedText(segmentedText);
        setSelectedSegments([]);
        setHasExistingSegmentation(segmentAnnotations.length > 0);
        // Note: hasExistingTOC is set above when processing TOC annotation
        
        setIsLoadingAnnotations(false);
      } catch (error) {
        console.error('Error auto-loading instance from URL:', error);
        setIsLoadingAnnotations(false);
      }
    };
    if(urlInstanceId && urlInstanceData){
      loadUrlInstance();
    }
  }, [urlInstanceId, urlInstanceData]);

  // Handle changing text (go back to selection)
  const handleChangeText = useCallback(() => {
    setInstanceId(null);
    setBaseText('');
    setSegmentAnnotations([]);
    setSegmentedText([]);
    setSelectedSegments([]);
    setHasExistingSegmentation(false);
    setHasExistingTOC(false);
    setTreeData([]); // Clear legacy tree data
    
    // Navigate back to formatter page
    navigate('/formatter');
  }, [setTreeData, navigate]);

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
    
   
    
    setSegmentAnnotations(prev => {
      const updated = prev.map(segment => 
        targetSegments.includes(segment.id)
          ? { ...segment, title }
          : segment
      );
      return updated;
    });
    
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
                baseText={baseText}
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
            title={t('formatter.showTableOfContents')}
          >
            <svg className="w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        )}

        {/* Editor Section */}
        <div className="flex-1 flex flex-col mb-15">
          {/* View Toggle - only show when we have content */}
          {instanceId && (
            <div className="p-4 border-b border-gray-200 bg-white">
              <div className="flex items-center gap-6 flex-wrap">
               

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
            {(() => {
              // Show loading state when auto-loading from URL
              // Show loading if: we have a URL instance ID but haven't set local instanceId yet,
              // AND we're either still loading or not ready to load
              const isStillLoading = urlInstanceId && !instanceId && (
                isLoadingUrlInstance || 
                isLoadingUrlSegmentation || 
                isLoadingAnnotations ||
                !isReadyToLoad
              );
              
              if (isStillLoading) {
                return (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
                      <p className="text-gray-600">Loading instance from URL...</p>
                      <p className="text-sm text-gray-500 mt-2">Instance ID: {urlInstanceId}</p>
                      {isLoadingUrlInstance && <p className="text-xs text-gray-400 mt-1">Fetching instance data...</p>}
                      {!isLoadingUrlInstance && (isLoadingUrlSegmentation || isLoadingAnnotations) && <p className="text-xs text-gray-400 mt-1">Loading annotations...</p>}
                      {!isLoadingUrlInstance && !isLoadingUrlSegmentation && !isLoadingAnnotations && !isReadyToLoad && <p className="text-xs text-gray-400 mt-1">Preparing data...</p>}
                    </div>
                  </div>
                );
              }
              
          
              
              // Show content when instance is loaded
              return (
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
              );
            })()}
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
                hasExistingSegmentation={hasExistingSegmentation}
                hasExistingTOC={hasExistingTOC}
                instanceId={instanceId}
              />
            </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default FormatterWorkstation
