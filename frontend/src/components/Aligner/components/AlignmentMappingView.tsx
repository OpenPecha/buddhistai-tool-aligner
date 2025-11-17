import React from 'react';
import { useTextSelectionStore } from '../../../stores/textSelectionStore';

const AlignmentMappingView: React.FC = () => {
  const { annotationData } = useTextSelectionStore();

  if (!annotationData) {
    return (
      <div className="p-4 text-sm text-gray-500">
        No alignment data available
      </div>
    );
  }

  // Create a map of target annotations by ID for quick lookup
  const targetMap = new Map<string, {
    id?: string | null;
    span: { start: number; end: number };
    content?: string;
  }>();
  
  annotationData.target_annotation.forEach((target) => {
    if (target && target.id) {
      targetMap.set(target.id, target);
    }
  });

  // Create a reverse map: which alignment annotations map to each target annotation
  const alignmentMap = new Map<string, number[]>();
  annotationData.alignment_annotation.forEach((alignment, idx) => {
    if (alignment && alignment.aligned_segments) {
      alignment.aligned_segments.forEach((targetId) => {
        if (!alignmentMap.has(targetId)) {
          alignmentMap.set(targetId, []);
        }
        alignmentMap.get(targetId)!.push(idx);
      });
    }
  });

  // Create a map to track which sources have been displayed
  const displayedSources = new Set<number>();
  
  // Build rows based on alignment_annotation (targets) as primary driver
  const rows: Array<{
    alignment: typeof annotationData.alignment_annotation[0];
    alignmentIdx: number;
    sources: Array<{ source: typeof annotationData.target_annotation[0]; sourceIdx: number }>;
  }> = [];

  // Iterate through alignment_annotation to create rows
  annotationData.alignment_annotation.forEach((alignment, alignmentIdx) => {
    if (!alignment) return;
    
    const alignedSources: Array<{ source: typeof annotationData.target_annotation[0]; sourceIdx: number }> = [];
    
    // Find which sources map to this alignment
    if (alignment.aligned_segments && alignment.aligned_segments.length > 0) {
      alignment.aligned_segments.forEach((sourceId) => {
        const sourceIdx = annotationData.target_annotation.findIndex(t => t?.id === sourceId);
        if (sourceIdx >= 0 && annotationData.target_annotation[sourceIdx]) {
          alignedSources.push({
            source: annotationData.target_annotation[sourceIdx]!,
            sourceIdx
          });
          displayedSources.add(sourceIdx);
        }
      });
    }
    
    rows.push({
      alignment,
      alignmentIdx,
      sources: alignedSources
    });
  });

  // Add any remaining source segments that weren't mapped to any target
  annotationData.target_annotation.forEach((source, sourceIdx) => {
    if (!displayedSources.has(sourceIdx) && source && source.id !== null) {
      // Find if this source maps to any alignment
      const mapsToAlignment = alignmentMap.has(source.id);
      if (!mapsToAlignment) {
        // Add as unmapped source row
        rows.push({
          alignment: null,
          alignmentIdx: -1,
          sources: [{ source, sourceIdx }]
        });
      }
    }
  });

  return (
    <div className=" flex flex-col min-h-0 h-[80vh] pb-[20px]">
      {/* Headers */}
      <div className="grid grid-cols-2 gap-4 p-4 border-b border-gray-200 bg-gray-50 shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-500"></div>
          <h3 className="text-sm font-semibold text-gray-700">Source Text</h3>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-blue-500"></div>
          <h3 className="text-sm font-semibold text-gray-700">Target Text</h3>
        </div>
      </div>

      {/* Side by side mappings */}
      <div className="flex-1 min-h-0 overflow-y-auto  overscroll-contain">
        <div className="p-4 space-y-3 ">
          {rows.map((row, rowIdx) => {
            const { alignment, alignmentIdx, sources } = row;
            
            const isAlignmentGap = alignment && alignment.id === null;
            const hasAlignment = alignment && alignment.id !== null;
            
            // Get aligned segments for this alignment
            const alignedTargets = alignment?.aligned_segments
              ?.map((targetId) => targetMap.get(targetId))
              .filter(Boolean) || [];

            return (
              <div key={rowIdx} className="grid grid-cols-2 gap-4">
                {/* Source Column */}
                <div className={`border rounded-lg p-3 flex flex-col ${
                  sources.length > 0
                    ? 'bg-green-50 border-green-200'
                    : 'bg-gray-50 border-gray-200'
                }`}>
                  {sources.length > 0 ? (
                    <>
                      {sources.map(({ source, sourceIdx }, sourceItemIdx) => (
                        <div key={sourceItemIdx} className={sourceItemIdx > 0 ? 'mt-3 pt-3 border-t border-green-300' : ''}>
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-xs font-semibold text-gray-600">
                              Source {sourceIdx + 1}
                            </span>
                            {source.id && (
                              <span className="text-xs px-2 py-0.5 bg-green-200 text-gray-700 rounded">
                                {source.id.substring(0, 8)}...
                              </span>
                            )}
                          </div>
                          <div className="text-sm text-gray-800 mb-2">
                            {source.content || '(no content)'}
                          </div>
                          <div className="text-xs text-gray-500 mb-2">
                            Span: [{source.span.start}-{source.span.end}]
                          </div>
                        </div>
                      ))}
                      {/* Mapped to section - aligned at bottom */}
                      <div className="mt-auto pt-2 border-t border-green-300">
                        {hasAlignment ? (
                          <>
                            <div className="text-xs text-gray-600 font-semibold mb-1">
                              Mapped to:
                            </div>
                            <div className="text-xs text-gray-600">
                              → Target {alignmentIdx + 1}
                            </div>
                          </>
                        ) : (
                          <div className="text-xs text-gray-400 italic">No mapping</div>
                        )}
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-col h-full min-h-[100px]">
                      <div className="flex-1 flex items-center justify-center">
                        <div className="text-xs text-gray-400 italic">No source segment</div>
                      </div>
                      {/* Empty mapping section at bottom to align with target */}
                      <div className="mt-auto pt-2 border-t border-gray-300">
                        <div className="text-xs text-gray-400 italic">No mapping</div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Target Column */}
                <div className={`border rounded-lg p-3 flex flex-col ${
                  hasAlignment
                    ? 'bg-blue-50 border-blue-200'
                    : isAlignmentGap
                    ? 'bg-gray-50 border-gray-300'
                    : 'bg-gray-50 border-gray-200'
                }`}>
                  {hasAlignment ? (
                    <>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs font-semibold text-gray-600">
                          Target {alignmentIdx + 1}
                        </span>
                        <span className="text-xs px-2 py-0.5 bg-blue-200 text-gray-700 rounded">
                          {alignment.id?.substring(0, 8)}...
                        </span>
                      </div>
                      <div className="text-sm text-gray-800 mb-2">
                        {alignment.content || '(no content)'}
                      </div>
                      <div className="text-xs text-gray-500 mb-2">
                        Span: [{alignment.span.start}-{alignment.span.end}]
                      </div>
                      {/* Mapped from section - aligned at bottom */}
                      <div className="mt-auto pt-2 border-t border-blue-300">
                        {sources.length > 0 ? (
                          <>
                            <div className="text-xs text-gray-600 font-semibold mb-1">
                              Mapped from:
                            </div>
                            {sources.map(({ sourceIdx }) => (
                              <div key={sourceIdx} className="text-xs text-gray-600">
                                ← Source {sourceIdx + 1}
                              </div>
                            ))}
                          </>
                        ) : (
                          <div className="text-xs text-gray-400 italic">No mapping</div>
                        )}
                      </div>
                    </>
                  ) : isAlignmentGap ? (
                    <>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs font-semibold text-gray-600">
                          Target {alignmentIdx + 1}
                        </span>
                        <span className="text-xs px-2 py-0.5 bg-gray-300 text-gray-700 rounded">
                          Gap
                        </span>
                      </div>
                      <div className="text-sm text-gray-600 mb-2">
                        {alignment.content || '(gap content)'}
                      </div>
                      <div className="text-xs text-gray-500 mb-2">
                        Span: [{alignment.span.start}-{alignment.span.end}]
                      </div>
                      {/* Empty mapping section at bottom to align with source */}
                      <div className="mt-auto pt-2 border-t border-gray-300">
                        <div className="text-xs text-gray-400 italic">No source mapping</div>
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-col h-full min-h-[100px]">
                      <div className="flex-1 flex items-center justify-center">
                        <div className="text-xs text-gray-400 italic">No target segment</div>
                      </div>
                      {/* Empty mapping section at bottom to align with source */}
                      <div className="mt-auto pt-2 border-t border-gray-300">
                        <div className="text-xs text-gray-400 italic">No mapping</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default AlignmentMappingView;

