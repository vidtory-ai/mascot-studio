

import React, { useState } from 'react';
import saveAs from 'file-saver';
import { Character, Setting } from '../types';

// Helper to convert file to data url, needed for immediate preview and use
const fileToDataUrl = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });

interface CharacterCardProps {
  character: Character;
  onAssetChange: (characterId: string, assetUrl: string | undefined) => void;
  onAgeChange: (characterId: string, age: string) => void;
  onNameChange: (characterId: string, name: string) => void;
  onDescriptionChange: (characterId: string, description: string) => void;
  onIsMainChange: (characterId: string, isMain: boolean) => void;
  onDelete: (characterId: string) => void;
  onViewImage: (imageUrl: string) => void;
}

const CharacterCard: React.FC<CharacterCardProps> = ({ 
    character, onAssetChange, onAgeChange, onNameChange, onDescriptionChange, onIsMainChange, onDelete, onViewImage
}) => {

  const handleFinalAssetFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const dataUrl = await fileToDataUrl(file);
      onAssetChange(character.id, dataUrl);
    }
    // Reset file input
    e.target.value = '';
  };
  
  const handleDownload = () => {
    if (!character.assetUrl) return;
    try {
      const mimeTypeMatch = character.assetUrl.match(/data:(image\/[^;]+);base64,/);
      const mimeType = mimeTypeMatch ? mimeTypeMatch[1] : 'image/png';
      const extension = mimeType.split('/')[1] || 'png';
      const filename = `${character.name.replace(/\s+/g, '_')}.${extension}`;
      saveAs(character.assetUrl, filename);
    } catch(e) {
      console.error("Failed to download image", e);
      alert("Could not download image. See console for details.");
    }
  };
  
  return (
    <div className="bg-blue-50 p-4 rounded-lg border-2 border-pink-300 flex flex-col gap-3 relative text-gray-800 shadow-sm hover:shadow-md transition-shadow">
       <div className="absolute top-2 left-2 z-10">
          {character.isMainCharacter ? (
              <button
                  onClick={() => onIsMainChange(character.id, false)}
                  className="bg-pink-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow flex items-center gap-1 hover:bg-pink-600"
                  title="Remove Main Character status"
              >
                  <i className="fas fa-star text-yellow-300"></i>
                  <span>Main Character</span>
              </button>
          ) : (
              <button
                  onClick={() => onIsMainChange(character.id, true)}
                  className="bg-gray-200 text-gray-600 text-xs font-bold px-2 py-1 rounded-full shadow flex items-center gap-1 hover:bg-green-200 hover:text-green-800"
                  title="Set as Main Character"
              >
                  <i className="far fa-star"></i>
                  <span>Make Main</span>
              </button>
          )}
        </div>
        <button
            onClick={() => onDelete(character.id)}
            className="absolute top-2 right-2 bg-gray-300 text-white rounded-full h-6 w-6 flex items-center justify-center text-xs font-bold hover:bg-red-500 transition-colors z-10"
            aria-label="Delete character"
        >
            &times;
        </button>

        <input
            type="text"
            value={character.name}
            onChange={(e) => onNameChange(character.id, e.target.value)}
            className="font-bold text-lg text-pink-800 text-center bg-transparent w-full p-1 mt-6 focus:outline-none focus:ring-1 focus:ring-pink-400 rounded border-b border-pink-200 hover:border-pink-400 placeholder-pink-300"
            placeholder="Character Name"
        />
      
      <div className="grid grid-cols-1 gap-2">
         <div className="bg-white p-2 rounded-md border border-pink-100">
            <label htmlFor={`age-${character.id}`} className="block text-xs font-bold text-gray-500 mb-1">Age / Details</label>
            <input
                id={`age-${character.id}`}
                type="text"
                value={character.age || ''}
                onChange={(e) => onAgeChange(character.id, e.target.value)}
                placeholder="e.g., 20 years old, Tall"
                className="w-full bg-white border-0 border-b-2 border-pink-200 focus:ring-0 focus:border-blue-500 p-1 text-sm text-gray-900 font-medium placeholder-gray-400"
            />
        </div>
        <div className="bg-white p-2 rounded-md border border-pink-100">
             <label htmlFor={`desc-${character.id}`} className="block text-xs font-bold text-gray-500 mb-1">Physical Description</label>
            <textarea
                id={`desc-${character.id}`}
                value={character.description}
                onChange={(e) => onDescriptionChange(character.id, e.target.value)}
                className="text-sm text-gray-900 bg-white w-full resize-none focus:outline-none placeholder-gray-400"
                rows={4}
                placeholder="Describe appearance (hair, eyes, outfit)..."
            />
        </div>
      </div>

      <div className="mt-2 flex-grow flex flex-col">
        <label className="block text-xs font-bold text-gray-500 mb-1">Character Image</label>
        {character.assetUrl ? (
          <div className="relative group">
             <img 
                src={character.assetUrl} 
                alt={character.name} 
                className="w-full h-auto max-h-64 object-contain rounded-lg border-2 border-pink-300 cursor-pointer bg-white"
                onClick={() => onViewImage(character.assetUrl!)}
             />
             <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 flex items-center justify-center transition-all pointer-events-none"></div>
             
             <div className="absolute top-2 right-2 flex flex-col gap-2">
                <button
                    onClick={handleDownload}
                    className="bg-blue-500 text-white rounded-full h-8 w-8 flex items-center justify-center text-sm font-bold hover:bg-blue-600 shadow-md transition-transform transform hover:scale-110"
                    aria-label="Download image"
                    title="Download Image"
                >
                    <i className="fas fa-download"></i>
                </button>
                <button
                    onClick={() => onAssetChange(character.id, undefined)}
                    className="bg-red-500 text-white rounded-full h-8 w-8 flex items-center justify-center text-sm font-bold hover:bg-red-600 shadow-md transition-transform transform hover:scale-110"
                    aria-label="Remove image"
                    title="Remove Image"
                >
                    &times;
                </button>
             </div>
          </div>
        ) : (
            <div className="flex-grow min-h-[200px] bg-white border-2 border-dashed border-pink-300 rounded-lg hover:bg-pink-50 transition-colors">
                <label htmlFor={`upload-${character.id}`} className="cursor-pointer w-full h-full flex flex-col justify-center items-center text-pink-400 hover:text-pink-600 p-4">
                    <i className="fas fa-cloud-upload-alt text-4xl mb-2"></i>
                    <span className="block font-bold text-sm">Upload Image</span>
                    <span className="text-xs text-gray-400 mt-1">PNG, JPG</span>
                </label>
                <input id={`upload-${character.id}`} type="file" accept="image/*" className="hidden" onChange={handleFinalAssetFileChange} />
            </div>
        )}
      </div>
    </div>
  );
};


interface SettingCardProps {
  setting: Setting;
  onDelete: (id: string) => void;
  onViewImage: (imageUrl: string) => void;
  onAddImages: (files: File[]) => void;
  onNameChange: (id: string, name: string) => void;
}

const SettingCard: React.FC<SettingCardProps> = ({ setting, onDelete, onViewImage, onAddImages, onNameChange }) => {
    
    const handleAdd = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            onAddImages(Array.from(e.target.files));
        }
        e.target.value = '';
    };

    return (
        <div className="bg-green-50 p-4 rounded-lg border-2 border-green-300 flex flex-col gap-3 relative text-gray-800 shadow-sm hover:shadow-md transition-shadow">
             <button
                onClick={() => onDelete(setting.id)}
                className="absolute top-2 right-2 bg-gray-300 text-white rounded-full h-6 w-6 flex items-center justify-center text-xs font-bold hover:bg-red-500 transition-colors z-10"
                aria-label="Delete setting"
            >
                &times;
            </button>
            <div className="mt-4 text-center">
                 <input 
                    type="text"
                    value={setting.name}
                    onChange={(e) => onNameChange(setting.id, e.target.value)}
                    className="font-bold text-lg text-green-800 text-center bg-transparent w-full p-1 focus:outline-none focus:ring-1 focus:ring-green-400 rounded border-b border-green-200 hover:border-green-400 placeholder-green-300"
                    placeholder="Setting Name"
                 />
                 <p className="text-xs text-gray-500 mt-1">{setting.imageUrls?.length || 0} images available</p>
            </div>
            <div className="mt-2 flex-grow flex flex-col gap-2">
                 {/* Main Preview */}
                 {setting.imageUrls && setting.imageUrls.length > 0 ? (
                     <div className="relative group">
                         <img 
                            src={setting.imageUrls[0]} 
                            alt={setting.name} 
                            className="w-full h-auto max-h-48 object-cover rounded-lg border-2 border-green-300 cursor-pointer bg-white"
                            onClick={() => onViewImage(setting.imageUrls[0])}
                         />
                         {setting.imageUrls.length > 1 && (
                            <div className="grid grid-cols-4 gap-1 mt-2">
                                {setting.imageUrls.slice(1, 5).map((url, i) => (
                                    <img 
                                        key={i} 
                                        src={url} 
                                        className="w-full h-10 object-cover rounded cursor-pointer border border-green-200"
                                        onClick={() => onViewImage(url)}
                                    />
                                ))}
                                {setting.imageUrls.length > 5 && (
                                    <div className="flex items-center justify-center bg-green-200 text-green-800 text-xs font-bold rounded">
                                        +{setting.imageUrls.length - 5}
                                    </div>
                                )}
                            </div>
                         )}
                     </div>
                 ) : (
                     <div className="bg-white h-48 flex items-center justify-center rounded-lg border-2 border-dashed border-gray-300">
                         <span className="text-gray-400">No images</span>
                     </div>
                 )}
                 
                 {/* Add More Button */}
                 <label className="cursor-pointer bg-green-100 hover:bg-green-200 text-green-700 text-xs font-bold py-2 rounded-lg text-center flex items-center justify-center gap-1">
                     <i className="fas fa-plus"></i> Add Images
                     <input type="file" multiple accept="image/*" className="hidden" onChange={handleAdd} />
                 </label>
            </div>
        </div>
    );
};


interface CharacterDesignPanelProps {
    characters: Character[];
    settings: Setting[];
    onAddNewCharacter: () => void;
    onAddNewCharacterWithAsset: (file: File) => void;
    onAddNewSettingWithAsset: (file: File | File[], name?: string) => void;
    onAddImagesToSetting: (settingId: string, files: File[]) => void;
    onDeleteCharacter: (characterId: string) => void;
    onDeleteSetting: (id: string) => void;
    onCharacterNameChange: (characterId: string, name: string) => void;
    onCharacterDescriptionChange: (characterId: string, description: string) => void;
    onCharacterIsMainChange: (characterId: string, isMain: boolean) => void;
    onCharacterAssetChange: (characterId: string, assetUrl: string | undefined) => void;
    onCharacterAgeChange: (characterId: string, age: string) => void;
    onSettingNameChange: (id: string, name: string) => void;
    onSaveAssets: () => void;
    onViewImage: (imageUrl: string) => void;
    error: string | null;
}

export const CharacterDesignPanel: React.FC<CharacterDesignPanelProps> = ({ 
    characters, settings, onAddNewCharacter, onAddNewCharacterWithAsset, onAddNewSettingWithAsset, onAddImagesToSetting, onDeleteCharacter, onDeleteSetting, onCharacterNameChange, onCharacterDescriptionChange, onCharacterIsMainChange, onCharacterAssetChange, onCharacterAgeChange, onSettingNameChange, onSaveAssets, onViewImage, error 
}) => {
    
    const [activeTab, setActiveTab] = useState<'characters' | 'settings'>('characters');
    const [newSettingName, setNewSettingName] = useState('');

    const handleUploadAndAdd = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            onAddNewCharacterWithAsset(file);
        }
        // Reset file input to allow selecting the same file again
        e.target.value = '';
    };
    
    const handleUploadAndAddSetting = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files && files.length > 0) {
            onAddNewSettingWithAsset(Array.from(files), newSettingName.trim() || "New Setting");
            setNewSettingName(''); // Reset name after upload
        }
        e.target.value = '';
    };

    return (
        <div className="bg-white p-6 rounded-2xl border-4 border-blue-400 shadow-lg w-full max-w-7xl mx-auto text-gray-800">
            <div className="text-center mb-6 border-b-2 border-blue-200 pb-4">
                <h2 className="text-3xl font-bold text-blue-800 mb-2"><i className="fas fa-users mr-3"></i>Asset Manager</h2>
                <p className="text-gray-600 mb-4">Manage characters and settings (backgrounds) for your story.</p>
                
                <div className="flex justify-center gap-4 mb-4">
                    <button 
                        onClick={() => setActiveTab('characters')}
                        className={`py-2 px-6 rounded-full font-bold transition-all ${activeTab === 'characters' ? 'bg-blue-500 text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                    >
                        <i className="fas fa-user mr-2"></i>Characters
                    </button>
                    <button 
                        onClick={() => setActiveTab('settings')}
                        className={`py-2 px-6 rounded-full font-bold transition-all ${activeTab === 'settings' ? 'bg-green-500 text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                    >
                        <i className="fas fa-image mr-2"></i>Settings / Backgrounds
                    </button>
                </div>

                <div className="flex items-center gap-2 flex-wrap justify-center">
                    {activeTab === 'characters' ? (
                        <>
                            <label className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-6 rounded-full transition-all duration-300 flex items-center justify-center gap-2 text-md shadow-sm cursor-pointer">
                                <i className="fas fa-upload"></i>
                                Add Character via Upload
                                <input type="file" accept="image/*" className="hidden" onChange={handleUploadAndAdd} />
                            </label>
                            <button
                                onClick={onAddNewCharacter}
                                className="bg-blue-100 text-blue-700 hover:bg-blue-200 font-bold py-2 px-6 rounded-full transition-all duration-300 flex items-center justify-center gap-2 text-md shadow-sm"
                            >
                                <i className="fas fa-plus"></i>
                                Add Empty Character
                            </button>
                        </>
                    ) : (
                        <div className="flex items-center gap-2 bg-green-50 p-2 rounded-full border border-green-200">
                             <input 
                                type="text"
                                placeholder="Name (e.g. Living Room)"
                                value={newSettingName}
                                onChange={(e) => setNewSettingName(e.target.value)}
                                className="px-3 py-2 rounded-full border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 w-48"
                             />
                             <label className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-6 rounded-full transition-all duration-300 flex items-center justify-center gap-2 text-md shadow-sm cursor-pointer">
                                <i className="fas fa-upload"></i>
                                Add Setting
                                <input type="file" accept="image/*" multiple className="hidden" onChange={handleUploadAndAddSetting} />
                            </label>
                        </div>
                    )}

                     <button
                        onClick={onSaveAssets}
                        disabled={characters.length === 0 && settings.length === 0}
                        className="bg-purple-500 hover:bg-purple-600 text-white font-bold py-2 px-6 rounded-full transition-all duration-300 flex items-center justify-center gap-2 text-md shadow-sm disabled:opacity-50 disabled:cursor-not-allowed ml-4"
                        title="Save assets"
                    >
                        <i className="fas fa-save"></i>
                        Save All Assets
                    </button>
                </div>
            </div>

            {error && (
                <div className="bg-red-100 p-4 rounded-lg border border-red-400 text-red-700 mb-4">
                    <strong>Error:</strong> {error}
                </div>
            )}

            {activeTab === 'characters' && (
                <>
                    {characters.length === 0 && (
                        <div className="text-center p-10 bg-blue-50 border-2 border-dashed border-blue-200 rounded-lg min-h-[300px] flex flex-col justify-center items-center">
                            <i className="fas fa-folder-open text-5xl text-blue-300 mb-4"></i>
                            <h3 className="text-xl font-bold text-blue-700">No Characters Yet</h3>
                            <p className="text-blue-600 mt-2 mb-4">Upload character images to get started.</p>
                        </div>
                    )}
                    {characters.length > 0 && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {characters.map(char => (
                                <CharacterCard 
                                    key={char.id} 
                                    character={char} 
                                    onAssetChange={onCharacterAssetChange}
                                    onAgeChange={onCharacterAgeChange}
                                    onNameChange={onCharacterNameChange}
                                    onDescriptionChange={onCharacterDescriptionChange}
                                    onIsMainChange={onCharacterIsMainChange}
                                    onDelete={onDeleteCharacter}
                                    onViewImage={onViewImage}
                                />
                            ))}
                        </div>
                    )}
                </>
            )}

            {activeTab === 'settings' && (
                 <>
                    {settings.length === 0 && (
                        <div className="text-center p-10 bg-green-50 border-2 border-dashed border-green-200 rounded-lg min-h-[300px] flex flex-col justify-center items-center">
                            <i className="fas fa-image text-5xl text-green-300 mb-4"></i>
                            <h3 className="text-xl font-bold text-green-700">No Settings Yet</h3>
                            <p className="text-green-600 mt-2 mb-4">Upload background images for common locations.</p>
                        </div>
                    )}
                    {settings.length > 0 && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {settings.map(setting => (
                                <SettingCard
                                    key={setting.id}
                                    setting={setting}
                                    onDelete={onDeleteSetting}
                                    onViewImage={onViewImage}
                                    onAddImages={(files) => onAddImagesToSetting(setting.id, files)}
                                    onNameChange={onSettingNameChange}
                                />
                            ))}
                        </div>
                    )}
                 </>
            )}
        </div>
    );
}