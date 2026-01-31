import React from 'react';
import { ImageUpload } from './ImageUpload';
import { Character } from '../types';

interface InputPanelProps {
  lyrics: string;
  setLyrics: (lyrics: string) => void;
  style: string;
  setStyle: (style: string) => void;
  theme: string;
  setTheme: (theme: string) => void;
  promptLanguage: string;
  setPromptLanguage: (language: string) => void;
  onGenerateStoryboard: () => void;
  isLoading: boolean;
  projectStyle: File | null;
  setProjectStyle: (file: File | null) => void;
  savedCharacters: Character[];
  selectedCharacterIds: string[];
  onSelectedCharacterIdsChange: (ids: string[]) => void;
}

export const InputPanel: React.FC<InputPanelProps> = ({ 
  lyrics, setLyrics, style, setStyle, theme, setTheme, promptLanguage, setPromptLanguage, onGenerateStoryboard, isLoading,
  projectStyle, setProjectStyle,
  savedCharacters, selectedCharacterIds, onSelectedCharacterIdsChange
}) => {
  const isProceedDisabled = isLoading || !lyrics.trim() || !style.trim() || selectedCharacterIds.length === 0;

  const handleCharacterSelection = (characterId: string) => {
    const newSelection = selectedCharacterIds.includes(characterId)
      ? selectedCharacterIds.filter(id => id !== characterId)
      : [...selectedCharacterIds, characterId];
    onSelectedCharacterIdsChange(newSelection);
  };

  return (
    <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm w-full max-w-4xl mx-auto text-gray-800 flex flex-col gap-6">
       <div>
        <label htmlFor="style" className="block text-lg font-bold text-blue-700 mb-2">
          <i className="fas fa-users mr-2"></i>Select Characters for Storyboard
        </label>
        <div className="bg-blue-50 p-3 border-2 border-blue-200 rounded-lg">
            {savedCharacters.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                    {savedCharacters.map(char => {
                        const isSelected = selectedCharacterIds.includes(char.id);
                        return (
                            <div 
                                key={char.id} 
                                onClick={() => handleCharacterSelection(char.id)}
                                className={`p-2 border-2 rounded-md transition-all duration-200 cursor-pointer ${isSelected ? 'border-blue-500 bg-blue-100 shadow-inner' : 'border-transparent hover:bg-gray-100'}`}
                            >
                                <div className="aspect-square bg-gray-200 rounded mb-2 overflow-hidden">
                                    {char.assetUrl && <img src={char.assetUrl} alt={char.name} className="w-full h-full object-cover"/>}
                                </div>
                                <div className="flex items-center gap-2">
                                    <input 
                                        type="checkbox"
                                        checked={isSelected}
                                        readOnly
                                        className="h-4 w-4 rounded border-gray-400 bg-white text-blue-600 focus:ring-blue-500 pointer-events-none"
                                    />
                                    <span className="text-sm font-bold text-gray-700 truncate">{char.name}</span>
                                </div>
                            </div>
                        )
                    })}
                </div>
            ) : (
                <div className="text-center text-gray-500 py-4">
                    <p>No characters have been saved yet.</p>
                    <p className="text-sm">Create and save characters in the "Character Design" module to use them here.</p>
                </div>
            )}
        </div>
      </div>

      <div className="border-t border-gray-200 -mx-6"></div>

      <div>
        <label htmlFor="lyrics" className="block text-lg font-bold text-blue-700 mb-2">
          <i className="fas fa-music mr-2"></i>Song Lyrics
        </label>
        <textarea
          id="lyrics"
          value={lyrics}
          onChange={(e) => setLyrics(e.target.value)}
          placeholder="Paste your song lyrics here, or generate them in the 'Lyrics Generator' module."
          className="w-full h-48 bg-white border-2 border-gray-200 rounded-lg p-3 text-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200 resize-none"
        />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
            <label htmlFor="style" className="block text-lg font-bold text-blue-700 mb-2">
            <i className="fas fa-palette mr-2"></i>Visual Style
            </label>
            <input
            id="style"
            type="text"
            value={style}
            onChange={(e) => setStyle(e.target.value)}
            placeholder="e.g., Anime, fantasy, dark noir, vibrant pop..."
            className="w-full bg-white border-2 border-gray-200 rounded-lg p-3 text-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200"
            />
        </div>
        <div>
            <label htmlFor="theme" className="block text-lg font-bold text-blue-700 mb-2">
            <i className="fas fa-lightbulb mr-2"></i>Theme / Core Idea
            </label>
            <input
            id="theme"
            type="text"
            value={theme}
            onChange={(e) => setTheme(e.target.value)}
            placeholder="e.g., A journey of friendship..."
            className="w-full bg-white border-2 border-gray-200 rounded-lg p-3 text-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200"
            />
        </div>
      </div>
      <div>
        <label className="block text-lg font-bold text-blue-700 mb-2">
          <i className="fas fa-language mr-2"></i>Prompt Language
        </label>
        <div className="flex gap-2 bg-blue-50 border-2 border-blue-200 rounded-lg p-1">
            <button 
                onClick={() => setPromptLanguage('English')}
                className={`flex-1 py-2 px-4 text-sm font-bold rounded-md transition-all duration-200 ${promptLanguage === 'English' ? 'bg-blue-500 text-white shadow-sm' : 'bg-transparent text-gray-600 hover:bg-blue-100'}`}
            >
                English
            </button>
            <button 
                onClick={() => setPromptLanguage('Vietnamese')}
                className={`flex-1 py-2 px-4 text-sm font-bold rounded-md transition-all duration-200 ${promptLanguage === 'Vietnamese' ? 'bg-blue-500 text-white shadow-sm' : 'bg-transparent text-gray-600 hover:bg-blue-100'}`}
            >
                Tiếng Việt
            </button>
        </div>
      </div>
      
      <div className="border-t border-gray-200 -mx-6"></div>

      <button
        onClick={onGenerateStoryboard}
        disabled={isProceedDisabled}
        className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-4 rounded-full disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 flex items-center justify-center gap-2 text-lg shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
        title={isProceedDisabled ? "Please provide Lyrics, a Visual Style, and select at least one Character to continue" : ""}
      >
        {isLoading ? (
          <>
            <i className="fas fa-spinner fa-spin"></i>
            Generating...
          </>
        ) : (
          <>
            Generate Storyboard
            <i className="fas fa-arrow-right"></i>
          </>
        )}
      </button>
    </div>
  );
};
