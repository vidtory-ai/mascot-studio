
import React, { useState, useEffect } from 'react';
import { StoryboardScene, Character } from '../types';
import { SceneCard } from './SceneCard';

interface OutputPanelProps {
  scenes: StoryboardScene[];
  isLoading: boolean;
  error: string | null;
  savedCharacters: Character[];
  onAddScene: (index: number) => void;
  onGenerateImage: (sceneId: string, model?: 'nano' | 'nano2') => void;
  onCancelImage: (sceneId: string) => void; // New
  onUploadCustomImage: (sceneId: string, file: File) => void;
  onSceneDataChange: (sceneId: string, field: keyof StoryboardScene, value: any) => void;
  onUpdateSceneCharacters: (sceneId: string, newCharacterNames: string[]) => void;
  onDeleteImage: (sceneId: string, imageUrl: string) => void;
  onViewImage: (imageUrl: string) => void;
  onEnrichScene: (sceneId: string) => void;
  onSelectImageForVideo: (sceneId: string, imageUrl: string) => void;
  onGenerateVideo: (sceneId: string) => void;
  onCancelVideo: (sceneId: string) => void;
  onToggleVideoUpscale: (sceneId: string) => void;
  onUpscaleVideo: (sceneId: string) => void;
  onBreakdownScene: (sceneId: string) => void;
  onToggleExpansion: (sceneId: string) => void;
  onAddShot: (sceneId: string) => void;
  onDeleteShot: (sceneId: string, shotId: string) => void;
  onDeleteScene: (sceneId: string) => void;
}

const ITEMS_PER_PAGE = 5;

export const OutputPanel: React.FC<OutputPanelProps> = (props) => {
  const { 
    scenes, 
    isLoading, 
    error, 
    savedCharacters,
    onAddScene,
    onGenerateImage,
    onCancelImage,
    onUploadCustomImage,
    onSceneDataChange,
    onUpdateSceneCharacters,
    onDeleteImage,
    onViewImage,
    onEnrichScene,
    onSelectImageForVideo,
    onGenerateVideo,
    onCancelVideo,
    onToggleVideoUpscale,
    onUpscaleVideo,
    onBreakdownScene,
    onToggleExpansion,
    onAddShot,
    onDeleteShot,
    onDeleteScene
  } = props;

  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    if (scenes.length === 0) setCurrentPage(1);
  }, [scenes.length]);

  if (error && scenes.length === 0) {
    return (
      <div className="bg-red-100 p-6 rounded-lg border border-red-400 text-red-700 shadow-lg">
        <h2 className="text-xl font-bold mb-2"><i className="fas fa-exclamation-triangle mr-2"></i>An Error Occurred</h2>
        <p className="bg-red-50 p-3 font-mono text-sm break-words">{error}</p>
      </div>
    );
  }

  const totalPages = Math.ceil(scenes.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const currentScenes = scenes.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <div className="space-y-6">
      {totalPages > 1 && (
        <div className="flex justify-between items-center bg-white p-3 rounded-lg border border-gray-200 shadow-sm sticky top-0 z-10">
           <button 
             onClick={() => handlePageChange(currentPage - 1)}
             disabled={currentPage === 1}
             className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-md disabled:opacity-50 font-bold text-gray-700"
           >
             <i className="fas fa-chevron-left mr-2"></i> Prev
           </button>
           <span className="font-bold text-gray-700">
             Page {currentPage} of {totalPages} ({scenes.length} Scenes)
           </span>
           <button 
             onClick={() => handlePageChange(currentPage + 1)}
             disabled={currentPage === totalPages}
             className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-md disabled:opacity-50 font-bold text-gray-700"
           >
             Next <i className="fas fa-chevron-right ml-2"></i>
           </button>
        </div>
      )}

      {currentScenes.map((scene, index) => {
        const actualIndex = startIndex + index;
        return (
        <React.Fragment key={scene.id}>
          <div className="relative">
            <span className="absolute -top-4 -left-4 bg-pink-500 text-white font-bold h-8 w-8 rounded-full flex items-center justify-center text-md z-10 shadow-md border-2 border-white">
                {actualIndex + 1}
            </span>
            <SceneCard 
                scene={scene}
                savedCharacters={savedCharacters}
                onGenerateImage={onGenerateImage}
                onCancelImage={onCancelImage}
                onUploadCustomImage={onUploadCustomImage}
                onSceneDataChange={onSceneDataChange}
                onUpdateSceneCharacters={onUpdateSceneCharacters}
                onDeleteImage={onDeleteImage}
                onViewImage={onViewImage}
                onEnrichScene={onEnrichScene}
                onSelectImageForVideo={onSelectImageForVideo}
                onGenerateVideo={onGenerateVideo}
                onCancelVideo={onCancelVideo}
                onToggleVideoUpscale={onToggleVideoUpscale}
                onUpscaleVideo={onUpscaleVideo}
                onBreakdownScene={onBreakdownScene}
                onToggleExpansion={onToggleExpansion}
                onAddShot={onAddShot}
                onDeleteShot={onDeleteShot}
                onDeleteScene={onDeleteScene}
            />
          </div>
          <div className="flex justify-center py-2">
            <button
              onClick={() => onAddScene(actualIndex + 1)}
              className="bg-lime-200 text-lime-800 font-bold py-2 px-6 rounded-full border-2 border-dashed border-lime-500 hover:bg-lime-300 hover:border-solid transition-all duration-300"
            >
              <i className="fas fa-plus mr-2"></i>Thêm cảnh
            </button>
          </div>
        </React.Fragment>
      )})}

      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-4 mt-6">
           <button 
             onClick={() => handlePageChange(currentPage - 1)}
             disabled={currentPage === 1}
             className="px-4 py-2 bg-white border border-gray-300 hover:bg-gray-50 rounded-full disabled:opacity-50 shadow-sm"
           >
             <i className="fas fa-chevron-left"></i>
           </button>
           <div className="flex gap-2">
             {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <button
                  key={page}
                  onClick={() => handlePageChange(page)}
                  className={`w-8 h-8 rounded-full font-bold text-sm ${currentPage === page ? 'bg-blue-500 text-white' : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-100'}`}
                >
                  {page}
                </button>
             ))}
           </div>
           <button 
             onClick={() => handlePageChange(currentPage + 1)}
             disabled={currentPage === totalPages}
             className="px-4 py-2 bg-white border border-gray-300 hover:bg-gray-50 rounded-full disabled:opacity-50 shadow-sm"
           >
             <i className="fas fa-chevron-right"></i>
           </button>
        </div>
      )}
    </div>
  );
};
