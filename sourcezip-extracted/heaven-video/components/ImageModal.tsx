import React, { useEffect } from 'react';

interface ImageModalProps {
  imageUrl: string;
  onClose: () => void;
}

export const ImageModal: React.FC<ImageModalProps> = ({ imageUrl, onClose }) => {
  // Add keyboard support to close with Escape key
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4 transition-opacity duration-300"
      onClick={onClose} // Close on backdrop click
      role="dialog"
      aria-modal="true"
    >
      <button 
        className="absolute top-4 right-4 text-white text-4xl font-bold hover:text-gray-300 transition-colors z-50"
        onClick={onClose}
        aria-label="Close image viewer"
      >
        &times;
      </button>
      <div 
        className="relative max-w-full max-h-full"
        onClick={(e) => e.stopPropagation()} // Prevent closing when clicking on the image itself
      >
        <img 
          src={imageUrl} 
          alt="Full size view" 
          className="block max-w-[95vw] max-h-[95vh] object-contain shadow-2xl"
        />
      </div>
    </div>
  );
};
