import { fetchAlignmentInference } from "../../api/text";
import { useQuery } from '@tanstack/react-query'

const getScoreColorClass = (score: number): string => {
    if (score > 0.8) return 'bg-green-100 text-green-800';
    if (score > 0.6) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
};

function SecondPanel({ selectedTextIdFromFirstPanel }: Readonly<{
    selectedTextFromFirstPanel: string | null;
    selectedTextIdFromFirstPanel: string | null;
}>) {

    const { data: alignmentData, isLoading: isLoadingAlignment, error: alignmentError } = useQuery({
        queryKey: ['alignmentInference', selectedTextIdFromFirstPanel],
        queryFn: async () => fetchAlignmentInference(selectedTextIdFromFirstPanel || ''),
        enabled: !!selectedTextIdFromFirstPanel,
    });

    // Show alignment details if we have data
    if (selectedTextIdFromFirstPanel && alignmentData) {
        return (
            <div className="h-full flex flex-col p-4">
                <div className="bg-white rounded-lg shadow-md">
                    <div className="p-4 border-b">
                        <h3 className="text-lg font-medium text-gray-900">Alignment Analysis</h3>
                        <p className="text-sm text-gray-500">Text ID: {selectedTextIdFromFirstPanel}</p>
                    </div>
                    
                    {/* Summary Section */}
                    <div className="p-4 border-b bg-gray-50">
                        <h4 className="font-medium text-gray-900 mb-2">Summary</h4>
                        <div className="grid grid-cols-3 gap-4 text-sm">
                            <div>
                                <span className="text-gray-600">Total Segments:</span>
                                <span className="ml-2 font-medium">{alignmentData.summary.total_segments}</span>
                            </div>
                            <div>
                                <span className="text-gray-600">Aligned:</span>
                                <span className="ml-2 font-medium">{alignmentData.summary.aligned_segments}</span>
                            </div>
                            <div>
                                <span className="text-gray-600">Avg Confidence:</span>
                                <span className="ml-2 font-medium">{(alignmentData.summary.average_confidence * 100).toFixed(1)}%</span>
                            </div>
                        </div>
                    </div>

                    {/* Alignment Details */}
                    <div className="max-h-96 overflow-y-auto">
                        {alignmentData.alignment_details.map((detail, index) => (
                            <div key={detail.segment_id} className="p-4 border-b hover:bg-gray-50">
                                <div className="flex justify-between items-start mb-2">
                                    <h5 className="font-medium text-gray-900">Segment {index + 1}</h5>
                                    <span className={`px-2 py-1 rounded text-xs font-medium ${getScoreColorClass(detail.alignment_score)}`}>
                                        Score: {(detail.alignment_score * 100).toFixed(1)}%
                                    </span>
</div>

                                {detail.aligned_segments.length > 0 && (
                                    <div className="space-y-2">
                                        <p className="text-sm text-gray-600">Aligned segments:</p>
                                        {detail.aligned_segments.map((segment) => (
                                            <div key={`${detail.segment_id}-${segment.source}`} className="bg-gray-50 p-2 rounded text-sm">
                                                <div className="flex justify-between items-start mb-1">
                                                    <span className="text-xs text-gray-500">Source: {segment.source}</span>
                                                    <span className="text-xs text-gray-500">Confidence: {(segment.confidence * 100).toFixed(1)}%</span>
                                                </div>
                                                <p className="text-gray-800">{segment.text}</p>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                
                                <div className="mt-2 text-xs text-gray-500">
                                    Algorithm: {detail.metadata.algorithm} | 
                                    Processed: {new Date(detail.metadata.timestamp).toLocaleString()}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    // Loading state
    if (selectedTextIdFromFirstPanel && isLoadingAlignment) {
        return (
            <div className="h-full flex flex-col items-center justify-center p-4">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Analyzing Alignment</h3>
                    <p className="text-gray-500">Processing text alignment for ID: {selectedTextIdFromFirstPanel}</p>
                </div>
            </div>
        );
    }

    // Error state
    if (selectedTextIdFromFirstPanel && alignmentError) {
        return (
            <div className="h-full flex flex-col items-center justify-center p-4">
                <div className="text-center">
                    <div className="text-red-500 mb-4">
                        <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Failed to Load Alignment</h3>
                    <p className="text-gray-500 mb-4">Could not fetch alignment data for the selected text.</p>
                    <p className="text-sm text-red-600">{alignmentError.message}</p>
                </div>
            </div>
        );
    }

    // Empty state - no text selected in first panel
    return (
        <div className="h-full flex flex-col items-center justify-center p-4 bg-gray-50">
            <div className="text-center">
                <div className="mb-4">
                    <svg className="mx-auto h-16 w-16 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                </div>
                <h3 className="text-xl font-medium text-gray-900 mb-2">No Text Selected</h3>
                <p className="text-gray-500 mb-4 max-w-md">
                    Please select a text from the first panel to view its alignment analysis here.
                </p>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-md">
                    <div className="flex items-start">
                        <div className="shrink-0">
                            <svg className="h-5 w-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <div className="ml-3">
                            <h4 className="text-sm font-medium text-blue-800">How it works</h4>
                            <p className="text-sm text-blue-700 mt-1">
                                Once you select a text in the first panel, this panel will automatically show detailed alignment analysis including segment scores, confidence levels, and aligned text segments.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default SecondPanel;