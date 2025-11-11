// React import removed as it's not needed
import { useSearchParams } from 'react-router-dom';
import { useTextSelectionStore } from '../../../stores/textSelectionStore';
import { useQuery } from '@tanstack/react-query';
import { fetchInstance } from '../../../api/text';
import { useEditorContext } from '../context';

function TextNavigationBar() {
  const { clearAllSelections } = useTextSelectionStore();
  const { isScrollSyncEnabled, setScrollSyncEnabled} = useEditorContext();
  const [searchParams] = useSearchParams();

  const selectedSourceInstanceId = searchParams.get('sInstanceId');
  const selectedTargetInstanceId = searchParams.get('tInstanceId');
  const targetState = searchParams.get('state');

  // Fetch source instance details
  const { data: sourceInstanceData } = useQuery({
    queryKey: ['sourceInstanceNav', selectedSourceInstanceId],
    queryFn: () => fetchInstance(selectedSourceInstanceId!),
    enabled: Boolean(selectedSourceInstanceId),
    refetchInterval:false,
    refetchOnWindowFocus:false,
    refetchOnMount:false,
    refetchOnReconnect:false,
    refetchIntervalInBackground:false,
  });

  // Fetch target instance details (skip if in empty state)
  const { data: targetInstanceData } = useQuery({
    queryKey: ['targetInstanceNav', selectedTargetInstanceId],
    queryFn: () => fetchInstance(selectedTargetInstanceId!),
    refetchInterval:false,
    refetchOnWindowFocus:false,
    refetchOnMount:false,
    refetchOnReconnect:false,
    refetchIntervalInBackground:false,
    enabled: Boolean(selectedTargetInstanceId) && targetState !== 'empty'
  });

  // Helper function to get display name from instance data
  const getInstanceDisplayName = (instanceData: unknown, instanceId: string | null) => {
    if (!instanceData && !instanceId) return 'Not selected';
    if (!instanceData) return `Loading... (${instanceId})`; // Show loading state
    
    // Try to get a meaningful title from different possible structures
    const data = instanceData as Record<string, unknown>;
    
    // Check for direct incipit_title (normal instance structure)
    if (data.incipit_title && typeof data.incipit_title === 'object' && data.incipit_title !== null) {
      const titleObj = data.incipit_title as Record<string, string>;
      const titleKeys = Object.keys(titleObj);
      if (titleKeys.length > 0) {
        return titleObj[titleKeys[0]];
      }
    }
    
    // Check for metadata.incipit_title
    const metadata = data.metadata as Record<string, unknown> | undefined;
    if (metadata?.incipit_title && typeof metadata.incipit_title === 'object' && metadata.incipit_title !== null) {
      const titleObj = metadata.incipit_title as Record<string, string>;
      const titleKeys = Object.keys(titleObj);
      if (titleKeys.length > 0) {
        return titleObj[titleKeys[0]];
      }
    }
    
    // Check for metadata.title (related instances structure)
    if (metadata?.title && typeof metadata.title === 'object' && metadata.title !== null) {
      const titleObj = metadata.title as Record<string, string>;
      const titleKeys = Object.keys(titleObj);
      if (titleKeys.length > 0) {
        const title = titleObj[titleKeys[0]];
        const instanceType = (metadata.instance_type as string) || 'Instance';
        const language = metadata.language ? ` (${metadata.language as string})` : '';
        return `${instanceType} - ${title}${language}`;
      }
    }
    
    // Check for alt_incipit_titles
    if (data.alt_incipit_titles && typeof data.alt_incipit_titles === 'object' && data.alt_incipit_titles !== null) {
      const altTitleObj = data.alt_incipit_titles as Record<string, string>;
      const altTitleKeys = Object.keys(altTitleObj);
      if (altTitleKeys.length > 0) {
        return altTitleObj[altTitleKeys[0]];
      }
    }
    
    if (metadata?.alt_incipit_titles && Array.isArray(metadata.alt_incipit_titles) && metadata.alt_incipit_titles.length > 0) {
      const altTitle = metadata.alt_incipit_titles[0] as Record<string, string>;
      const altTitleKeys = Object.keys(altTitle);
      if (altTitleKeys.length > 0) {
        return altTitle[altTitleKeys[0]];
      }
    }
    
    // Fallback to instance type and ID
    const instanceType = (metadata?.instance_type as string) || (metadata?.type as string) || (data.type as string) || 'Instance';
    return `${instanceType} ${instanceId}`;
  };

  const handleReset = () => {
    clearAllSelections();
  };

  return (
    <div className="bg-white border-b border-gray-200 p-3">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">Source:</span>
            <div className="text-sm text-gray-900 border border-gray-300 rounded px-2 py-1 bg-gray-50 min-w-[200px]">
              {getInstanceDisplayName(sourceInstanceData, selectedSourceInstanceId)}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">Target:</span>
            <div className="text-sm text-gray-900 border border-gray-300 rounded px-2 py-1 bg-gray-50 min-w-[200px]">
              {targetState === 'empty' ? 'Empty Target File' : getInstanceDisplayName(targetInstanceData, selectedTargetInstanceId)}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Scroll Sync Toggle */}
          <label className={`flex items-center gap-2 text-sm cursor-pointer transition-colors px-2 py-1 rounded ${
            isScrollSyncEnabled 
              ? 'text-blue-700 bg-blue-50 hover:bg-blue-100' 
              : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50'
          }`}>
            <input
              type="checkbox"
              checked={isScrollSyncEnabled}
              onChange={(e) => setScrollSyncEnabled(e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
            />
            <span className="select-none font-medium">
              {isScrollSyncEnabled ? '🔗 Smart Sync (Alignment-aware)' : 'Smart Sync'}
            </span>
          </label>
          
       
          
          {/* Reset Button */}
          <button 
            onClick={handleReset} 
            className="px-3 py-1 text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors"
          >
            Reset
          </button>
        </div>
      </div>
    </div>
  );
}

export default TextNavigationBar;