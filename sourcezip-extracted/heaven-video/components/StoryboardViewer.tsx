import React, { useEffect } from 'react';
import { StoryboardScene } from '../types';

interface StoryboardViewerProps {
  scenes: StoryboardScene[];
  onClose: () => void;
}

export const StoryboardViewer: React.FC<StoryboardViewerProps> = ({ scenes, onClose }) => {
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

  // Flatten the images with their corresponding lyrics, using thumbnails for performance
  const storyboardItems = scenes.flatMap(scene => 
    scene.imageUrls.map((imageUrl, index) => ({
      id: `${scene.id}-${imageUrl}`, // Create a more unique key
      lyric: scene.lyric,
      // Use thumbnail for display, fall back to full image if thumbnail not ready/failed
      displayUrl: scene.thumbnails[index] || imageUrl,
    }))
  );

  return (
    <div 
      className="fixed inset-0 bg-gray-900 bg-opacity-95 flex flex-col z-50 p-0 transition-opacity duration-300" 
      role="dialog" 
      aria-modal="true"
      onClick={onClose}
    >
      {/* Header */}
      <div className="flex-shrink-0 flex justify-between items-center p-4 border-b border-gray-700 bg-gray-900" onClick={e => e.stopPropagation()}>
        <h2 className="text-xl md:text-2xl font-bold text-white">
            <i className="fas fa-grip-horizontal mr-3"></i>Full Storyboard View
        </h2>
        <button 
          onClick={onClose} 
          aria-label="Close storyboard viewer" 
          className="text-gray-400 hover:text-white text-4xl transition-colors"
        >
          &times;
        </button>
      </div>

      {/* Scrollable Content Grid */}
      <div className="flex-grow overflow-y-auto p-4 md:p-8" onClick={e => e.stopPropagation()}>
        {storyboardItems.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
            {storyboardItems.map((item) => (
                <div key={item.id} className="flex flex-col bg-white text-gray-800 shadow-lg overflow-hidden transform hover:scale-[1.02] transition-transform duration-300">
                <div className="aspect-video w-full bg-gray-200">
                    <img 
                        src={item.displayUrl} 
                        alt={`Scene for "${item.lyric}"`} 
                        className="w-full h-full object-cover" 
                        onError={(e) => {
                            (e.target as HTMLImageElement).src = "https://via.placeholder.com/384x216.png?text=Image+Failed+to+Load";
                        }}
                    />
                </div>
                <div className="p-3 md:p-4 border-t">
                    <p className="text-sm text-gray-700 italic">"{item.lyric}"</p>
                </div>
                </div>
            ))}
            </div>
        ) : (
            <div className="flex items-center justify-center h-full w-full">
                <div className="text-center">
                    <i className="fas fa-images text-6xl text-gray-500 mb-4"></i>
                    <p className="text-gray-400 text-lg">No images have been generated yet.</p>
                </div>
            </div>
        )}
      </div>
    </div>
  );
};
