
import React from 'react';
import { ImageUpload } from './ImageUpload';

interface StoryboardActionHeaderProps {
  styleFile: File | null;
  onStyleFileChange: (file: File | null) => void;
  styleText: string;
  onStyleTextChange: (text: string) => void;
  onGenerateAllImages: () => void;
  onPickAllImages: () => void;
  onGenerateAllVideos: () => void;
  onUpscaleAllVideos: () => void;
  onDownloadAllImages: () => void;
  onDownloadAllVideos: () => void;
  onStopAll: () => void;
  isGeneratingImages: boolean;
  isGeneratingVideos: boolean;
  isUpscaling: boolean;
  isDownloading: boolean;
  onViewStoryboard: () => void;
  isViewDisabled: boolean;
}

export const StoryboardActionHeader: React.FC<StoryboardActionHeaderProps> = ({
  styleFile,
  onStyleFileChange,
  styleText,
  onStyleTextChange,
  onGenerateAllImages,
  onPickAllImages,
  onGenerateAllVideos,
  onUpscaleAllVideos,
  onDownloadAllImages,
  onDownloadAllVideos,
  onStopAll,
  isGeneratingImages,
  isGeneratingVideos,
  isUpscaling,
  isDownloading,
  onViewStoryboard,
  isViewDisabled,
}) => {
  const isAnyGenerating = isGeneratingImages || isGeneratingVideos || isUpscaling;

  return (
    <div className="bg-white p-4 rounded-xl border-2 border-blue-200 shadow-md w-full sticky top-4 z-20">
      <div className="flex flex-col gap-4">
         {/* Style Configuration */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 p-3 rounded-lg border border-gray-200">
             <div>
                 <label className="block text-xs font-bold text-gray-800 mb-1">Global Style Description (for Enrichment)</label>
                 <input 
                    type="text" 
                    value={styleText} 
                    onChange={(e) => onStyleTextChange(e.target.value)}
                    className="w-full text-sm border border-gray-300 rounded p-2 bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                    placeholder="e.g. 3D Animation, Pixar Style, Vibrant Colors"
                />
             </div>
             <div>
                 <ImageUpload
                    id="global-style-ref"
                    label="Global Style Reference Image"
                    file={styleFile}
                    onFileChange={onStyleFileChange}
                 />
             </div>
        </div>

        {/* Action Buttons */}
        <div className="flex-grow bg-blue-50 border-2 border-dashed border-blue-200 p-3 rounded-lg">
          <div className="flex justify-between items-center mb-2 flex-wrap gap-2">
            <h3 className="text-sm font-bold text-blue-800">Batch Actions:</h3>
            <div className="flex items-center gap-2">
                <button
                    onClick={onStopAll}
                    disabled={!isAnyGenerating}
                    className={`font-bold py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-1.5 text-xs shadow-sm ${isAnyGenerating ? 'bg-red-500 hover:bg-red-600 text-white' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
                >
                    <i className="fas fa-stop-circle"></i>
                    <span>Stop All</span>
                </button>
                <div className="w-px h-4 bg-blue-200 mx-1"></div>
                <button
                    onClick={onDownloadAllImages}
                    disabled={isDownloading}
                    className="bg-cyan-100 text-cyan-800 font-bold py-2 px-3 rounded-lg hover:bg-cyan-200 transition-colors flex items-center justify-center gap-1.5 text-xs shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isDownloading ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-download"></i>}
                    <span>Images</span>
                </button>
                <button
                    onClick={onDownloadAllVideos}
                    disabled={isDownloading}
                    className="bg-cyan-100 text-cyan-800 font-bold py-2 px-3 rounded-lg hover:bg-cyan-200 transition-colors flex items-center justify-center gap-1.5 text-xs shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isDownloading ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-download"></i>}
                    <span>Videos</span>
                </button>
                <button
                    onClick={onViewStoryboard}
                    disabled={isViewDisabled}
                    className="bg-pink-500 hover:bg-pink-600 text-white font-bold py-2 px-3 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 flex items-center justify-center gap-1.5 text-xs shadow-sm"
                >
                    <i className="fas fa-grip-horizontal"></i>
                    View
                </button>
            </div>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
            <button
              onClick={onGenerateAllImages}
              disabled={isGeneratingImages}
              className="bg-green-100 text-green-800 font-bold py-2 px-3 rounded-lg hover:bg-green-200 transition-colors flex items-center gap-2 text-xs disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isGeneratingImages ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-images"></i>}
              <span>Generate All Images</span>
            </button>
            <button
              onClick={onPickAllImages}
              className="bg-yellow-100 text-yellow-800 font-bold py-2 px-3 rounded-lg hover:bg-yellow-200 transition-colors flex items-center gap-2 text-xs"
            >
              <i className="fas fa-check-double"></i>
              <span>Pick All Images</span>
            </button>
            <button
              onClick={onGenerateAllVideos}
              disabled={isGeneratingVideos}
              className="bg-red-100 text-red-800 font-bold py-2 px-3 rounded-lg hover:bg-red-200 transition-colors flex items-center gap-2 text-xs disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isGeneratingVideos ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-film"></i>}
              <span>Generate All Videos</span>
            </button>
            <button
              onClick={onUpscaleAllVideos}
              disabled={isUpscaling}
              className="bg-purple-100 text-purple-800 font-bold py-2 px-3 rounded-lg hover:bg-purple-200 transition-colors flex items-center gap-2 text-xs disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isUpscaling ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-magic"></i>}
              <span>Upscale All Missing</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
