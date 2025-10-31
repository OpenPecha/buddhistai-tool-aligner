import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { OpenPechaText, OpenPechaTextInstance } from '../types/text';
import { fetchInstance, fetchTextInstances, fetchTexts } from '../api/text';



function TextSelector({ placeholder, onTextSelect }: {
    placeholder: string;
    onTextSelect: (text: string, textId: string) => void;
}) {
    const [showTextList, setShowTextList] = useState(false);
    const [selectedText, setSelectedText] = useState<OpenPechaText | null>(null);
    const [showInstanceList, setShowInstanceList] = useState(false);
    const [selectedInstance, setSelectedInstance] = useState<OpenPechaTextInstance | null>(null);

    // Fetch texts using react-query
    const { 
        data: texts = [], 
        isLoading, 
        error,
        refetch 
    } = useQuery({
        queryKey: ['texts'],
        queryFn: () => fetchTexts({ limit: 20 }),
        enabled: showTextList, // Only fetch when the list is shown
    });
    // Fetch text instances list
    const { 
        data: textInstances,
        isLoading: isLoadingInstances,
        error: instancesError
    } = useQuery({
        queryKey: ['textInstances', selectedText?.id],
        queryFn: async () => {
            if (!selectedText) return null;
            console.log('Fetching text instances for ID:', selectedText.id);
            console.log('Selected text object:', selectedText);
            try {
                const instances = await fetchTextInstances(selectedText.id);
                console.log('Fetched instances data:', instances);
                return instances;
            } catch (error) {
                console.error('Error fetching text instances:', error);
                throw error;
            }
        },
        enabled: !!selectedText && showInstanceList,
    });

    // Fetch specific instance content
    const { 
        data: instanceContent,
        isLoading: isLoadingContent,
        error: instanceError
    } = useQuery({
        queryKey: ['instanceContent', selectedInstance?.id],
        queryFn: async () => fetchInstance(selectedInstance?.id || ''),
        enabled: !!selectedInstance,
    });
    const handleTextSelection = async (text: OpenPechaText) => {
      
        
        setSelectedText(text);
        setShowTextList(false);
        setShowInstanceList(true);
    };

    const handleInstanceSelection = (instance: OpenPechaTextInstance) => {
  
        
        setSelectedInstance(instance);
        setShowInstanceList(false);
    };

    const handleSelectText = () => {
        setShowTextList(true);
    };

    const handleConfirmSelection = () => {
        if (instanceContent?.base) {
            onTextSelect(instanceContent.base, selectedInstance?.id || '');
        }
    };

    const handleClearSelection = () => {
        setSelectedText(null);
        setSelectedInstance(null);
        setShowTextList(false);
        setShowInstanceList(false);
    };

    const handleBackToTextSelection = () => {
        setSelectedText(null);
        setSelectedInstance(null);
        setShowInstanceList(false);
        setShowTextList(true);
    };

    const handleBackToInstanceSelection = () => {
        setSelectedInstance(null);
        setShowInstanceList(true);
    };

    // Step 3: Instance selected - show confirmation
    if (selectedInstance) {
        return (
            <div className="h-full flex flex-col items-center justify-center p-4 bg-gray-50">
                <div className="w-full max-w-2xl bg-white rounded-lg shadow-md p-6">
                    <div className="text-center">
                        <div className="mb-4">
                            <svg className="mx-auto h-12 w-12 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">Instance Selected</h3>
                        <h4 className="text-md font-semibold text-blue-600 mb-2">
                            {selectedText?.title.en || selectedText?.title.bo || 'Unknown Title'}
                        </h4>
                        <p className="text-sm text-gray-500 mb-2">
                            Instance ID: {selectedInstance.id}
                        </p>
                        <p className="text-sm text-gray-500 mb-4">
                            Language: {selectedText?.language} | Type: {selectedText?.type}
                        </p>
                        
                        {isLoadingContent ? (
                            <div className="mb-4">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                                <p className="mt-2 text-gray-500">Loading instance content...</p>
                            </div>
                        ) : (() => {
                            if (instanceError) {
                                return (
                                    <div className="mb-4">
                                        <div className="text-red-500 mb-2">
                                            <svg className="mx-auto h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                        </div>
                                        <p className="text-red-600 text-sm">Failed to load instance content</p>
                                        <p className="text-xs text-gray-500 mt-1">Will use fallback content</p>
                                    </div>
                                );
                            }
                            
                            return (
                                <div className="mb-4">
                                    <p className="text-sm text-gray-600">
                                        {instanceContent?.base ? (
                                            <>
                                                <span className="text-green-600">✓ Base text loaded</span>
                                                <br />
                                                <span className="text-xs text-gray-500">
                                                    {instanceContent.base.length} characters
                                                </span>
                                            </>
                                        ) : (
                                            'Will use fallback content'
                                        )}
                                    </p>
                                </div>
                            );
                        })()}

                        <div className="flex gap-3 justify-center">
                            <button 
                                onClick={handleConfirmSelection}
                                disabled={isLoadingContent}
                                className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600 transition-colors disabled:bg-gray-400"
                            >
                                Use This Instance
                            </button>
                            <button 
                                onClick={handleBackToInstanceSelection}
                                className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600 transition-colors"
                            >
                                Choose Different Instance
                            </button>
                            <button 
                                onClick={handleClearSelection}
                                className="bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600 transition-colors"
                            >
                                Start Over
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Step 2: Text selected - show instance list
    if (selectedText && showInstanceList) {
        return (
            <div className="h-full flex flex-col items-center justify-center p-4 bg-gray-50">
                <div className="w-full max-w-2xl">
                    <div className="bg-white rounded-lg shadow-md">
                        <div className="p-4 border-b flex justify-between items-center">
                            <div>
                                <h3 className="text-lg font-medium">Select an Instance</h3>
                                <p className="text-sm text-gray-500">
                                    Text: {selectedText.title.en || selectedText.title.bo || 'Unknown Title'}
                                </p>
                            </div>
                            <button 
                                onClick={handleBackToTextSelection}
                                className="text-gray-500 hover:text-gray-700"
                            >
                                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        <div className="max-h-96 overflow-y-auto">
                            {(() => {
                                if (isLoadingInstances) {
                                    return (
                                        <div className="p-4 text-center">
                                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                                            <p className="mt-2 text-gray-500">Loading instances...</p>
                                        </div>
                                    );
                                }
                                
                                if (instancesError) {
                                    return (
                                        <div className="p-4 text-center">
                                            <div className="text-red-500 mb-2">
                                                <svg className="mx-auto h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                            </div>
                                            <p className="text-red-600 mb-2">Failed to load instances</p>
                                        </div>
                                    );
                                }

                                // Handle different response formats
                                let instances: OpenPechaTextInstance[] = [];
                                if (Array.isArray(textInstances)) {
                                    instances = textInstances;
                                } else if (textInstances) {
                                    instances = [textInstances];
                                }
                                
                                if (instances.length === 0) {
                                    return (
                                        <div className="p-4 text-center">
                                            <p className="text-gray-500">No instances found for this text</p>
                                        </div>
                                    );
                                }
                                
                                return (
                                    <div className="divide-y">
                                        {instances.map((instance, index) => (
                                            <button 
                                                key={instance.id || index}
                                                onClick={() => handleInstanceSelection(instance)}
                                                className="w-full text-left p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                                            >
                                                <h4 className="font-medium text-gray-900">
                                                    Instance {index + 1}
                                                </h4>
                                                <p className="text-sm text-gray-500 mt-1">
                                                    ID: {instance.id || 'Unknown'}
                                                </p>
                                                <p className="text-sm text-gray-500">
                                                    Type: {instance.type || 'Unknown'} | 
                                                    Base text: {instance.base ? `${instance.base.length} chars` : 'Not available'}
                                                </p>
                                            </button>
                                        ))}
                                    </div>
                                );
                            })()}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col items-center justify-center p-4 bg-gray-50">
            {showTextList ? (
                <div className="w-full max-w-2xl">
                    <div className="bg-white rounded-lg shadow-md">
                        <div className="p-4 border-b flex justify-between items-center">
                            <h3 className="text-lg font-medium">Select a Text</h3>
                            <button 
                                onClick={() => setShowTextList(false)}
                                className="text-gray-500 hover:text-gray-700"
                            >
                                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        <div className="max-h-96 overflow-y-auto">
                            {(() => {
                                if (isLoading) {
                                    return (
                                        <div className="p-4 text-center">
                                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                                            <p className="mt-2 text-gray-500">Loading texts...</p>
                                        </div>
                                    );
                                }
                                
                                if (error) {
                                    return (
                                        <div className="p-4 text-center">
                                            <div className="text-red-500 mb-2">
                                                <svg className="mx-auto h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                            </div>
                                            <p className="text-red-600 mb-2">Failed to load texts</p>
                                            <button 
                                                onClick={() => refetch()}
                                                className="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600"
                                            >
                                                Retry
                                            </button>
                                        </div>
                                    );
                                }
                                
                                return (
                                    <div className="divide-y">
                                        {texts.map((text) => (
                                            <button 
                                                key={text.id}
                                                onClick={() => handleTextSelection(text)}
                                                className="w-full text-left p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                                            >
                                                <h4 className="font-medium text-gray-900">
                                                    {text.title.en || text.title.bo || 'Unknown Title'}
                                                </h4>
                                                <p className="text-sm text-gray-500 mt-1">
                                                    Language: {text.language} | Type: {text.type}
                                                </p>
                                                {text.contributions && text.contributions.length > 0 && (
                                                    <p className="text-xs text-gray-400 mt-1">
                                                        Contributors: {text.contributions.map(c => c.role).join(', ')}
                                                    </p>
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                );
                            })()}
                        </div>
                    </div>
                </div>
            ) : (
                <div className="text-center">
                    <div className="mb-4">
                        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Text Selected</h3>
                    <p className="text-gray-500 mb-4">{placeholder}</p>
                    <button 
                        onClick={handleSelectText}
                        className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-colors"
                    >
                        Select Text
                    </button>
                </div>
            )}
        </div>
    );
}

export default TextSelector;