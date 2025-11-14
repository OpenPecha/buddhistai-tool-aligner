import TextInstanceSelector from './components/TextInstanceSelector';
import './Formatter.css';

function Formatter() {
  // Dummy handler - TextInstanceSelector now navigates directly
  const handleTextLoad = () => {
    // This is no longer used, but kept for compatibility
  };





  return (
    <div className="h-screen flex flex-col">
      {/* Text Selector */}
      <div className="flex-1 overflow-hidden">
        <div className="integrated-text-selector">
          <TextInstanceSelector
            onTextLoad={handleTextLoad}
          />
        </div>
      </div>
    </div>
  );
}

export default Formatter
