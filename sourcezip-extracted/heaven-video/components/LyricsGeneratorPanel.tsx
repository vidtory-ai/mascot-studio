import React, { useState } from 'react';

const RANDOM_IDEAS = [
    "A story of betrayal over a shared secret.",
    "Two best friends fall for the same person, leading to a falling out.",
    "A misunderstanding tears a close-knit group of friends apart.",
    "One character's ambition causes them to hurt their friends in the pursuit of success.",
    "A secret from the past comes back to haunt the group, testing their loyalty.",
    "The friends discover a magical object that grants wishes, but it comes with a dark price that creates conflict between them."
];

interface LyricsGeneratorPanelProps {
  idea: string;
  setIdea: (idea: string) => void;
  characterNames: string;
  setCharacterNames: (names: string) => void;
  onGenerateLyrics: () => void;
  onUseLyrics: () => void;
  isLoading: boolean;
  error: string | null;
  lyrics: string;
  lyricsLanguage: string;
  setLyricsLanguage: (lang: string) => void;
}

export const LyricsGeneratorPanel: React.FC<LyricsGeneratorPanelProps> = ({
  idea,
  setIdea,
  characterNames,
  setCharacterNames,
  onGenerateLyrics,
  onUseLyrics,
  isLoading,
  error,
  lyrics,
  lyricsLanguage,
  setLyricsLanguage,
}) => {
  const isGenerateDisabled = isLoading || !idea.trim() || !characterNames.trim();
  const [copied, setCopied] = useState(false);

  const handleRandomIdea = () => {
    const randomIndex = Math.floor(Math.random() * RANDOM_IDEAS.length);
    setIdea(RANDOM_IDEAS[randomIndex]);
  };

  const handleCopy = () => {
    if (!lyrics) return;
    navigator.clipboard.writeText(lyrics);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
      {/* Left Column: Inputs */}
      <div className="md:col-span-2 bg-slate-800 p-6 border border-slate-700 flex flex-col gap-6 h-fit">
        <div className="text-center">
            <h2 className="text-2xl font-bold text-cyan-400">
                <i className="fas fa-feather-alt mr-3"></i>Lyrics Generator
            </h2>
            <p className="text-gray-400 mt-2">Start your story here. Provide an idea and your characters, and let the AI write the song.</p>
        </div>

        {error && (
            <div className="bg-red-900/50 p-4 border border-red-500 text-center">
                <h3 className="font-bold text-red-300 mb-1">Generation Failed</h3>
                <p className="text-red-400 text-sm">{error}</p>
            </div>
        )}

        <div>
          <label htmlFor="idea" className="block text-lg font-bold text-cyan-400 mb-2">
            <i className="fas fa-lightbulb mr-2"></i>Story Idea
          </label>
          <div className="flex gap-2">
              <textarea
                  id="idea"
                  value={idea}
                  onChange={(e) => setIdea(e.target.value)}
                  placeholder="e.g., A drama about betrayal and forgiveness..."
                  className="w-full h-48 bg-slate-700 border border-slate-600 p-3 text-gray-200 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition duration-200 resize-y"
              />
              <button
                  onClick={handleRandomIdea}
                  className="bg-purple-600 hover:bg-purple-700 text-white font-bold px-4 transition-all duration-300 flex flex-col items-center justify-center gap-1 text-md shadow-sm hover:shadow-md transform hover:-translate-y-0.5"
                  title="Generate a random idea"
              >
                  <i className="fas fa-dice"></i>
                  <span className="text-xs font-semibold">Random</span>
              </button>
          </div>
        </div>
        <div>
          <label htmlFor="characters" className="block text-lg font-bold text-cyan-400 mb-2">
            <i className="fas fa-user-friends mr-2"></i>Main Characters
          </label>
          <input
            id="characters"
            type="text"
            value={characterNames}
            onChange={(e) => setCharacterNames(e.target.value)}
            placeholder="e.g., Rumi, Mira, Zoey"
            className="w-full bg-slate-700 border border-slate-600 p-3 text-gray-200 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition duration-200"
          />
        </div>

        <div>
          <label className="block text-lg font-bold text-cyan-400 mb-2">
            <i className="fas fa-language mr-2"></i>Output Language
          </label>
          <div className="flex gap-2 bg-slate-700 border border-slate-600 p-1">
              <button 
                  onClick={() => setLyricsLanguage('English')}
                  className={`flex-1 py-2 px-4 text-sm font-bold transition-all duration-200 ${lyricsLanguage === 'English' ? 'bg-cyan-600 text-white shadow-sm' : 'bg-transparent text-gray-400 hover:bg-slate-600'}`}
              >
                  English
              </button>
              <button 
                  onClick={() => setLyricsLanguage('Vietnamese')}
                  className={`flex-1 py-2 px-4 text-sm font-bold transition-all duration-200 ${lyricsLanguage === 'Vietnamese' ? 'bg-cyan-600 text-white shadow-sm' : 'bg-transparent text-gray-400 hover:bg-slate-600'}`}
              >
                  Tiếng Việt
              </button>
          </div>
        </div>
        
        <div className="border-t border-slate-700 -mx-6 pt-6 px-6">
          <button
              onClick={onGenerateLyrics}
              disabled={isGenerateDisabled}
              className="w-full bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-3 px-4 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 flex items-center justify-center gap-2 text-lg shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
              title={isGenerateDisabled ? "Please provide both an Idea and Character Names" : ""}
          >
              {isLoading ? (
              <>
                  <i className="fas fa-spinner fa-spin"></i>
                  Writing Lyrics...
              </>
              ) : (
              <>
                  <i className="fas fa-magic"></i>
                  Generate Lyrics
              </>
              )}
          </button>
        </div>
      </div>

      {/* Right Column: Output */}
      <div className="md:col-span-3">
        <div className="bg-slate-800 p-6 border border-slate-700 space-y-4 h-full flex flex-col min-h-[500px]">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-bold text-cyan-400">Generated Lyrics:</h3>
                <button
                    onClick={handleCopy}
                    disabled={!lyrics}
                    className="bg-slate-600 hover:bg-slate-500 text-white px-3 py-1 text-xs font-semibold flex items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {copied ? <><i className="fas fa-check"></i>Copied!</> : <><i className="fas fa-copy"></i>Copy</>}
                </button>
            </div>
            <div className="bg-slate-700/50 p-4 whitespace-pre-wrap font-mono text-sm text-gray-300 flex-grow overflow-y-auto">
              {lyrics ? (
                lyrics
              ) : (
                <div className="flex items-center justify-center h-full text-slate-500">
                    <div className="text-center">
                        <i className="fas fa-music text-4xl mb-3"></i>
                        <p>Your generated lyrics will appear here.</p>
                    </div>
                </div>
              )}
            </div>
            <button
              onClick={onUseLyrics}
              disabled={!lyrics}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 transition-all duration-300 flex items-center justify-center gap-2 text-lg shadow-md hover:shadow-lg transform hover:-translate-y-0.5 mt-auto disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Use these Lyrics in Storyboard
              <i className="fas fa-arrow-right"></i>
            </button>
        </div>
      </div>
    </div>
  );
};