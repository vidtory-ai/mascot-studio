
import React, { useState } from 'react';
import { StoryboardScene, Character } from '../types';

interface ImageGenCardProps {
  scene: StoryboardScene;
  savedCharacters: Character[];
  onGenerateImage: (sceneId: string, model?: 'nano' | 'nano2') => void;
  onCancelImage: (sceneId: string) => void;
  onUploadCustomImage: (sceneId: string, file: File) => void;
  onDeleteImage: (sceneId: string, imageUrl: string) => void;
  onViewImage: (imageUrl: string) => void;
  onSelectImageForVideo: (sceneId: string, imageUrl: string) => void;
  onUpdateSceneCharacters: (sceneId: string, newCharacterNames: string[]) => void;
  onSceneDataChange: (sceneId: string, field: keyof StoryboardScene, value: any) => void;
}

export const ImageGenCard: React.FC<ImageGenCardProps> = ({
  scene,
  savedCharacters,
  onGenerateImage,
  onCancelImage,
  onUploadCustomImage,
  onDeleteImage,
  onViewImage,
  onSelectImageForVideo,
  onUpdateSceneCharacters,
  onSceneDataChange,
}) => {
  const [isCharacterSelectorOpen, setIsCharacterSelectorOpen] = useState(false);
  const [selectedModel, setSelectedModel] = useState<'nano' | 'nano2'>('nano');

  const handleCharSelectionChange = (charName: string) => {
    const newSelection = scene.charactersInScene?.includes(charName)
      ? scene.charactersInScene.filter(name => name !== charName)
      : [...(scene.charactersInScene || []), charName];

    if (newSelection.length > 3) {
        alert("You can select a maximum of 3 characters per scene.");
        return;
    }
    onUpdateSceneCharacters(scene.id, newSelection);
  };
  
  const handleAddExtraCharacter = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
            const newExtra = { id: crypto.randomUUID(), assetUrl: reader.result as string };
            const updatedExtras = [...(scene.extraCharacters || []), newExtra];
            onSceneDataChange(scene.id, 'extraCharacters', updatedExtras);
        };
    }
  };

  const handleRemoveExtraCharacter = (extraId: string) => {
    const updatedExtras = scene.extraCharacters?.filter(ec => ec.id !== extraId) || [];
    onSceneDataChange(scene.id, 'extraCharacters', updatedExtras);
  };

  const handleCustomImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onUploadCustomImage(scene.id, file);
    }
  };
  
  const handleBackgroundFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
            onSceneDataChange(scene.id, 'backgroundUrl', reader.result as string);
        };
        e.target.value = '';
    }
  };

  const handleRemoveBackground = () => {
    onSceneDataChange(scene.id, 'backgroundUrl', undefined);
  };

  return (
    <div className="bg-white p-4 rounded-xl border border-blue-200 space-y-3 h-full flex flex-col text-gray-800">
       <div className="flex-shrink-0">
         <div className="flex justify-between items-center">
             <h4 className="font-bold text-sm text-blue-800 flex items-center gap-2"><i className="fas fa-users"></i>Scene Visuals</h4>
              <button
                onClick={() => setIsCharacterSelectorOpen(!isCharacterSelectorOpen)}
                className="text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors flex items-center gap-1"
              >
                <i className="fas fa-edit"></i>
                Edit Characters
              </button>
         </div>
        
        <div className="mt-2 flex flex-wrap gap-2 items-center">
            {scene.charactersInScene?.map(charName => {
                const character = savedCharacters.find(c => c.name === charName);
                if (!character) return null;
                return (
                    <div key={character.id} className="flex items-center gap-1 bg-blue-100 p-1 rounded-full">
                        <img src={character.assetUrl} alt={character.name} className="w-6 h-6 rounded-full object-cover border-2 border-white"/>
                        <span className="text-xs font-bold text-blue-800 pr-2">{character.name}</span>
                    </div>
                );
            })}
             {scene.extraCharacters?.map(extraChar => (
                <div key={extraChar.id} className="flex items-center gap-1 bg-gray-200 p-1 rounded-full relative group">
                    <img src={extraChar.assetUrl} alt="Extra Character" className="w-6 h-6 rounded-full object-cover border-2 border-white"/>
                    <span className="text-xs font-bold text-gray-600 pr-2">Extra</span>
                    <button onClick={() => handleRemoveExtraCharacter(extraChar.id)} className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full h-4 w-4 flex items-center justify-center text-[8px] opacity-0 group-hover:opacity-100 transition-opacity">&times;</button>
                </div>
            ))}
        </div>

        {isCharacterSelectorOpen && (
            <div className="mt-2 bg-blue-50 p-3 border-2 border-blue-200 rounded-lg space-y-3">
                <div>
                    <h5 className="font-bold text-xs text-gray-600 mb-1">Main Characters (Max 3)</h5>
                     <div className="max-h-24 overflow-y-auto space-y-1 pr-2">
                        {savedCharacters.map(char => (
                            <label key={char.id} className="flex items-center gap-2 text-sm cursor-pointer p-1 hover:bg-blue-100 rounded">
                                <input
                                    type="checkbox"
                                    checked={scene.charactersInScene?.includes(char.name)}
                                    onChange={() => handleCharSelectionChange(char.name)}
                                    className="h-4 w-4 rounded border-gray-400 bg-white text-blue-600 focus:ring-blue-500"
                                />
                                {char.assetUrl && <img src={char.assetUrl} alt={char.name} className="w-6 h-6 rounded-full object-cover"/>}
                                <span className="font-semibold">{char.name}</span>
                            </label>
                        ))}
                    </div>
                </div>
                <div>
                    <label htmlFor={`extra-char-upload-${scene.id}`} className="w-full text-center cursor-pointer bg-gray-200 hover:bg-gray-300 text-gray-700 text-xs font-bold py-1 px-2 rounded flex items-center justify-center gap-2">
                        <i className="fas fa-plus"></i> Upload Extra Character
                    </label>
                    <input id={`extra-char-upload-${scene.id}`} type="file" accept="image/*" className="hidden" onChange={handleAddExtraCharacter} />
                </div>
            </div>
        )}
      </div>

      <div className="flex-shrink-0 pt-3 border-t border-blue-200">
        <h5 className="font-bold text-sm text-blue-800 flex items-center gap-2 mb-2"><i className="fas fa-mountain"></i>Background Image</h5>
        {scene.backgroundUrl ? (
          <div className="relative">
            <img src={scene.backgroundUrl} alt="Background" className="w-full aspect-video object-cover rounded-lg border-2 border-green-400" />
            <button
              onClick={handleRemoveBackground}
              className="absolute -top-2 -right-2 bg-red-500 text-white h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold shadow-md hover:bg-red-600 transition-transform transform hover:scale-110"
              title="Remove Background Image"
            >
              &times;
            </button>
          </div>
        ) : (
          <div>
            <label htmlFor={`bg-upload-${scene.id}`} className="w-full text-center cursor-pointer bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold py-2 px-2 rounded-lg flex items-center justify-center gap-2 border-2 border-dashed border-gray-300 hover:border-solid">
                <i className="fas fa-upload"></i> Upload Background
            </label>
            <input id={`bg-upload-${scene.id}`} type="file" accept="image/*" className="hidden" onChange={handleBackgroundFileChange} />
          </div>
        )}
      </div>

      <div className="pt-3 border-t border-blue-200 space-y-2">
        <div className="flex justify-between items-center px-1">
             <label className="text-xs font-bold text-gray-600">Model:</label>
             <select 
                value={selectedModel} 
                onChange={(e) => setSelectedModel(e.target.value as any)}
                className="bg-white border border-gray-300 text-gray-700 py-1 px-2 rounded-lg text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
                <option value="nano">Nano (Fast)</option>
                <option value="nano2">Nano 2 (Quality)</option>
            </select>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => onGenerateImage(scene.id, selectedModel)}
            disabled={scene.isGeneratingImage}
            className="flex-1 bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-3 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 flex items-center justify-center gap-2 text-sm"
          >
            {scene.isGeneratingImage ? (
              <><i className="fas fa-spinner fa-spin"></i>Generating...</>
            ) : (
              <><i className="fas fa-image"></i>Generate More</>
            )}
          </button>
          
          {scene.isGeneratingImage && (
             <button
                onClick={() => onCancelImage(scene.id)}
                className="bg-gray-400 hover:bg-gray-500 text-white font-bold py-2 px-3 rounded-lg flex items-center justify-center"
                title="Stop Generation"
             >
                <i className="fas fa-stop"></i>
             </button>
          )}

          <label htmlFor={`custom-upload-${scene.id}`} className="flex-1 cursor-pointer bg-purple-500 hover:bg-purple-600 text-white font-bold py-2 px-3 rounded-lg transition-all duration-300 flex items-center justify-center gap-2 text-sm">
            <i className="fas fa-upload"></i> Upload
          </label>
          <input id={`custom-upload-${scene.id}`} type="file" accept="image/*" className="hidden" onChange={handleCustomImageUpload} />
        </div>
        {scene.imageGenerationError && <p className="text-red-600 text-xs mt-1 text-center">{scene.imageGenerationError}</p>}
      </div>

      <div className="flex-grow min-h-[120px]">
        {scene.imageUrls.length > 0 ? (
          <div className="grid grid-cols-2 gap-3">
            {scene.imageUrls.map((url, index) => {
                const isSelected = scene.selectedImageForVideo === url;
                return (
                    <div key={index} className="relative aspect-video">
                        <img
                        src={url}
                        alt={`Scene ${index + 1}`}
                        className={`w-full h-full object-cover rounded-lg cursor-pointer transition-all duration-200 ${isSelected ? 'border-4 border-blue-500' : 'border-2 border-gray-200 hover:border-blue-400'}`}
                        onClick={() => onViewImage(url)}
                        />

                        <button
                        onClick={() => onDeleteImage(scene.id, url)}
                        className="absolute -top-2 -right-2 bg-red-500 text-white h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold shadow-md hover:bg-red-600 transition-transform transform hover:scale-110"
                        title="Delete Image"
                        >
                        &times;
                        </button>

                        {isSelected ? (
                        <div className="absolute bottom-0 left-0 right-0 bg-green-600 text-white text-xs font-bold text-center py-1 rounded-b-lg">
                            <i className="fas fa-check mr-1"></i>
                            Video Base
                        </div>
                        ) : (
                        <button
                            onClick={() => onSelectImageForVideo(scene.id, url)}
                            className="absolute bottom-2 left-2 bg-blue-500 text-white h-7 w-7 rounded-full flex items-center justify-center shadow-md hover:bg-blue-600 transition-transform transform hover:scale-110"
                            title="Use as Video Base"
                        >
                            <i className="fas fa-film"></i>
                        </button>
                        )}
                    </div>
                );
            })}
          </div>
        ) : !scene.isGeneratingImage && (
          <div className="w-full h-full bg-gray-100 rounded-lg flex items-center justify-center">
            <div className="text-center text-gray-400">
                <i className="fas fa-image text-3xl mb-2"></i>
                <p className="text-xs font-semibold">Generated images will appear here</p>
            </div>
          </div>
        )}
         {scene.isGeneratingImage && scene.imageUrls.length === 0 && (
            <div className="w-full h-full bg-gray-200 rounded-lg flex items-center justify-center animate-pulse">
                <i className="fas fa-image text-gray-400 text-3xl"></i>
            </div>
        )}
      </div>
    </div>
  );
};
