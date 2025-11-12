import { Link, useSearchParams } from 'react-router-dom';
import Aligner from '../components/Aligner';
import CatalogerButton from '../components/CatalogerButton';
import { useTextSelectionStore } from '../stores/textSelectionStore';
import React from 'react';

function AlignerPage() {
  const { 
    isSourceLoaded, 
    isTargetLoaded, 
    sourceInstanceId, 
    targetInstanceId, 
    setSourceSelection,
    setTargetSelection
  } = useTextSelectionStore();
  const [searchParams] = useSearchParams();
  const isBothTextLoaded = isSourceLoaded && isTargetLoaded;
  
  // Restore source and target selection from URL parameters on mount
  React.useEffect(() => {
    const sTextId = searchParams.get('sTextId');
    const sInstanceId = searchParams.get('sInstanceId');
    const tTextId = searchParams.get('tTextId');
    const tInstanceId = searchParams.get('tInstanceId');
    
    // Only restore if URL has params but store doesn't have the selection
    if (sTextId && sInstanceId && !sourceInstanceId) {
      setSourceSelection(sTextId, sInstanceId);
    }
    
    // Restore target selection if available in URL
    if (tTextId && tInstanceId && !targetInstanceId) {
      setTargetSelection(tTextId, tInstanceId);
    }
  }, [searchParams, sourceInstanceId, targetInstanceId, setSourceSelection, setTargetSelection]);
  return (
    <div className="h-screen bg-gray-50 flex flex-col">
      {/* Navigation Header */}
      <header className="bg-white shadow-sm border-b flex-shrink-0">
        <div className=" mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
         
            <h1 className="text-xl font-semibold text-gray-900">Aligner</h1>
            <CatalogerButton />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden">
       
        <Aligner />
      </main>
    </div>
  );
}

export default AlignerPage;
