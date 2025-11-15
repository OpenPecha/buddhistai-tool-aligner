import Aligner from '../components/Aligner/Aligner';
import CatalogerButton from '../components/CatalogerButton';
import { useTextSelectionStore } from '../stores/textSelectionStore';

function AlignerPage() {
  const { isTargetLoaded } = useTextSelectionStore();
  
  return (
    <div className="h-screen bg-gray-50 flex flex-col overflow-hidden">
      {/* Navigation Header */}
    

      {/* Main Content */}
      <div className="flex-1 min-h-0">
        <Aligner />
      </div>
    </div>
  );
}

export default AlignerPage;

