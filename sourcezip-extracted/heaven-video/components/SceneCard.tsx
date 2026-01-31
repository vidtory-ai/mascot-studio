
import React from 'react';
import { StoryboardScene, Character } from '../types';
import { PromptCard } from './PromptCard';
import { ImageGenCard } from './ImageGenCard';
import { VideoGenCard } from './VideoGenCard';

interface SceneCardProps {
  scene: StoryboardScene;
  savedCharacters: Character[];
  onGenerateImage: (sceneId: string, model?: 'nano' | 'nano2') => void;
  onCancelImage: (sceneId: string) => void;
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
  onBreakdownScene?: (sceneId: string) => void;
  onToggleExpansion?: (sceneId: string) => void;
  onAddShot?: (sceneId: string) => void;
  onDeleteShot?: (sceneId: string, shotId: string) => void;
  onDeleteScene?: (sceneId: string) => void;
  isShot?: boolean;
}

export const SceneCard: React.FC<SceneCardProps> = (props) => {
  const { 
    scene, 
    savedCharacters,
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
    onDeleteScene,
    isShot = false
  } = props;

  const hasShots = scene.shots && scene.shots.length > 0;

  return (
    <div className={`flex flex-col gap-2 ${isShot ? 'ml-8 border-l-4 border-gray-300 pl-4 py-2' : ''}`}>
        <div className="bg-blue-50 p-4 border-2 border-pink-300 rounded-2xl shadow-lg relative">
          
          {!isShot && (
              <div className="absolute top-2 right-2 flex gap-2 z-10">
                 <button
                    onClick={() => onBreakdownScene && onBreakdownScene(scene.id)}
                    disabled={scene.isBreakingDown}
                    className="bg-purple-100 hover:bg-purple-200 text-purple-800 text-xs font-bold px-3 py-1 rounded-full shadow-sm flex items-center gap-1 transition-colors disabled:opacity-50"
                    title="Break down into detailed shots"
                >
                    {scene.isBreakingDown ? (
                         <i className="fas fa-spinner fa-spin"></i>
                    ) : (
                         <i className="fas fa-wand-magic-sparkles"></i>
                    )}
                    Breakdown Shots
                </button>
                <button
                    onClick={() => onDeleteScene && onDeleteScene(scene.id)}
                    className="bg-red-100 hover:bg-red-200 text-red-600 rounded-full h-6 w-6 flex items-center justify-center text-xs font-bold transition-colors"
                    title="Delete Scene"
                >
                    <i className="fas fa-trash"></i>
                </button>
              </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
            <div className="lg:col-span-1 h-full">
                <PromptCard
                scene={scene}
                onSceneDataChange={onSceneDataChange}
                onEnrichScene={onEnrichScene}
                />
            </div>
            <div className="lg:col-span-1 h-full">
                <ImageGenCard
                scene={scene}
                savedCharacters={savedCharacters}
                onGenerateImage={onGenerateImage}
                onCancelImage={onCancelImage}
                onUploadCustomImage={onUploadCustomImage}
                onDeleteImage={onDeleteImage}
                onViewImage={onViewImage}
                onSelectImageForVideo={onSelectImageForVideo}
                onUpdateSceneCharacters={onUpdateSceneCharacters}
                onSceneDataChange={onSceneDataChange}
                />
            </div>
            <div className="lg:col-span-1 h-full">
                <VideoGenCard
                scene={scene}
                onGenerateVideo={onGenerateVideo}
                onCancelVideo={onCancelVideo}
                onToggleVideoUpscale={() => onSceneDataChange(scene.id, 'shouldUpscaleVideo', !scene.shouldUpscaleVideo)}
                onUpscaleVideo={onUpscaleVideo}
                />
            </div>
          </div>
        </div>

        {!isShot && (hasShots || scene.isBreakingDown) && (
            <div className="mt-2">
                <div 
                    className="flex items-center gap-2 mb-2 cursor-pointer select-none text-gray-500 hover:text-blue-600 transition-colors pl-8"
                    onClick={() => onToggleExpansion && onToggleExpansion(scene.id)}
                >
                    <i className={`fas fa-chevron-right transition-transform ${scene.isExpanded ? 'rotate-90' : ''}`}></i>
                    <span className="text-sm font-bold">Shots Breakdown ({scene.shots?.length || 0})</span>
                </div>

                {scene.isExpanded && (
                    <div className="space-y-4">
                        {scene.shots?.map((shot, shotIndex) => (
                             <div key={shot.id} className="relative">
                                <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gray-300 -z-10"></div>
                                <span className="absolute left-[1.3rem] top-6 bg-gray-500 text-white text-[10px] font-bold h-5 w-5 rounded-full flex items-center justify-center z-10">
                                    {shotIndex + 1}
                                </span>

                                <SceneCard
                                    {...props}
                                    scene={shot}
                                    isShot={true}
                                />
                                {onDeleteShot && (
                                    <button 
                                        onClick={() => onDeleteShot(scene.id, shot.id)}
                                        className="absolute top-4 right-4 bg-gray-200 hover:bg-red-500 hover:text-white text-gray-500 rounded-full h-6 w-6 flex items-center justify-center text-xs transition-colors z-20"
                                        title="Delete Shot"
                                    >
                                        <i className="fas fa-trash"></i>
                                    </button>
                                )}
                             </div>
                        ))}
                         <div className="ml-8 pl-4">
                            <button
                                onClick={() => onAddShot && onAddShot(scene.id)}
                                className="text-xs bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold py-1 px-3 rounded-full flex items-center gap-1 transition-colors"
                            >
                                <i className="fas fa-plus"></i> Add Shot
                            </button>
                        </div>
                    </div>
                )}
            </div>
        )}
    </div>
  );
};
