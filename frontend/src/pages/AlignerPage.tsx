import React from 'react';
import Aligner from '../components/Aligner';
import CatalogerButton from '../components/CatalogerButton';
import { useTextSelectionStore } from '../stores/textSelectionStore';
import { RotateCcw } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';

function ResetButton() {
  const { sourceInstanceId, targetInstanceId } = useTextSelectionStore();
  const [, setSearchParams] = useSearchParams();

  const handleReset = React.useCallback(() => {
    const { clearSourceSelection, clearTargetSelection } = useTextSelectionStore.getState();
    clearSourceSelection();
    clearTargetSelection();
    
    setSearchParams((prev) => {
      prev.delete('sTextId');
      prev.delete('sInstanceId');
      prev.delete('tTextId');
      prev.delete('tInstanceId');
      return prev;
    });
  }, [setSearchParams]);

  // Only show reset button if there's a selection
  if (!sourceInstanceId && !targetInstanceId) {
    return null;
  }

  return (
    <button 
      title="Reset all selections" 
      onClick={handleReset} 
      className='cursor-pointer flex gap-2 items-center px-3 py-2 text-sm rounded transition-colors hover:bg-red-50 text-red-600 border border-red-200 hover:border-red-300'
    >
      <RotateCcw className="w-4 h-4" />
      <span className="hidden sm:inline">Reset</span>
    </button>
  );
}

function AlignerPage() {
  return (
    <div className="h-screen bg-gray-50 flex flex-col">
      {/* Navigation Header */}
      <header className="bg-white shadow-sm border-b shrink-0">
        <div className=" mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-xl font-semibold text-gray-900">Aligner</h1>
            <div className="flex items-center gap-3">
              <ResetButton />
              <CatalogerButton />
            </div>
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
