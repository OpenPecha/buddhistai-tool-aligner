import React from 'react';

interface LoadingOverlayProps {
  isVisible: boolean;
  message?: string;
  className?: string;
}

const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ 
  isVisible, 
  message = "Loading...", 
  className = "" 
}) => {
  if (!isVisible) return null;

  return (
    <div className={`absolute inset-0 bg-white bg-opacity-90 flex items-center justify-center z-50 ${className}`}>
      <div className="flex flex-col items-center space-y-4">
        {/* Spinner */}
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        
        {/* Message */}
        <div className="text-center">
          <p className="text-lg font-medium text-gray-900">{message}</p>
          <p className="text-sm text-gray-600 mt-1">Please wait while we process the annotations...</p>
        </div>
      </div>
    </div>
  );
};

export default LoadingOverlay;
