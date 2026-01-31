import React from 'react';
import { ImageUpload } from './ImageUpload';
import { MultiImageUpload } from './MultiImageUpload';

interface ThumbnailCopyPanelProps {
  ingredientFiles: File[];
  setIngredientFiles: (files: File[]) => void;
  sampleFile: File | null;
  setSampleFile: (file: File | null) => void;
  userPrompt: string;
  setUserPrompt: (prompt: string) => void;
  onGenerate: () => void;
  generatedThumbnail: string | null;
  isLoading: boolean;
  error: string | null;
}

export const ThumbnailCopyPanel: React.FC<ThumbnailCopyPanelProps> = ({
  ingredientFiles,
  setIngredientFiles,
  sampleFile,
  setSampleFile,
  userPrompt,
  setUserPrompt,
  onGenerate,
  generatedThumbnail,
  isLoading,
  error,
}) => {
  const isGenerateDisabled = isLoading || !sampleFile || ingredientFiles.length === 0;

  return (
    <div className="bg-slate-900/50 p-6 rounded-lg w-full max-w-7xl mx-auto text-gray-300 space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-cyan-400"><i className="fas fa-clone mr-3"></i>Thumbnail Copy</h2>
        <p className="text-gray-400 mt-2 max-w-3xl mx-auto">Upload ingredient images and a sample thumbnail. The AI will analyze the style and create a new thumbnail combining the elements.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Input Column */}
        <div className="bg-slate-800 p-6 border border-slate-700 rounded-lg flex flex-col gap-6">
          <MultiImageUpload
            id="ingredient-images"
            label="1. Upload Ingredient Images"
            files={ingredientFiles}
            onFilesChange={setIngredientFiles}
          />
          <ImageUpload
            id="sample-thumbnail"
            label="2. Upload Sample Thumbnail"
            file={sampleFile}
            onFileChange={setSampleFile}
          />
          <div>
            <label htmlFor="user-prompt" className="block text-md font-bold text-cyan-400 mb-2">
              3. Describe Your Goal (Optional)
            </label>
            <textarea
              id="user-prompt"
              value={userPrompt}
              onChange={(e) => setUserPrompt(e.target.value)}
              placeholder="e.g., Use the character from ingredient 1 and the logo from ingredient 2."
              className="w-full h-24 bg-slate-700 border border-slate-600 p-3 rounded-md text-gray-200 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition duration-200 resize-y"
            />
          </div>
          <button
            onClick={onGenerate}
            disabled={isGenerateDisabled}
            className="w-full bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-3 px-4 rounded-full disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 flex items-center justify-center gap-2 text-lg shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
            title={isGenerateDisabled ? "Please upload ingredients and a sample thumbnail" : "Generate Thumbnail"}
          >
            {isLoading ? (
              <>
                <i className="fas fa-spinner fa-spin"></i>
                Generating...
              </>
            ) : (
              <>
                <i className="fas fa-magic"></i>
                Generate Thumbnail
              </>
            )}
          </button>
        </div>

        {/* Output Column */}
        <div className="bg-slate-800 p-6 border border-slate-700 rounded-lg flex flex-col justify-center items-center">
          <h3 className="text-xl font-bold text-cyan-400 mb-4 w-full text-center">Generated Result (16:9)</h3>
          {error && (
             <div className="w-full bg-red-900/50 p-4 border border-red-500 text-center mb-4 rounded-md">
                <h3 className="font-bold text-red-300 mb-1">Generation Failed</h3>
                <p className="text-red-400 text-sm break-words">{error}</p>
            </div>
          )}
          <div className="w-full aspect-video bg-slate-900/50 rounded-lg flex items-center justify-center overflow-hidden">
            {isLoading && (
              <div className="text-center text-cyan-400 animate-pulse">
                <i className="fas fa-image text-6xl"></i>
                <p className="mt-2 font-semibold">AI is creating...</p>
              </div>
            )}
            {!isLoading && generatedThumbnail && (
              <img src={generatedThumbnail} alt="Generated Thumbnail" className="w-full h-full object-contain" />
            )}
            {!isLoading && !generatedThumbnail && (
               <div className="text-center text-slate-500">
                <i className="fas fa-image text-6xl"></i>
                <p className="mt-2 font-semibold">Your new thumbnail will appear here</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
