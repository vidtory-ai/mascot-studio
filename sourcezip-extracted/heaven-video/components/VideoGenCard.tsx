
import React, { useState, useEffect } from 'react';
import { StoryboardScene } from '../types';

interface VideoGenCardProps {
  scene: StoryboardScene;
  onGenerateVideo: (sceneId: string) => void;
  onCancelVideo: (sceneId: string) => void;
  onToggleVideoUpscale: (sceneId: string) => void;
  onUpscaleVideo: (sceneId: string) => void;
}

// Helper to check if the video resource is actually reachable
const checkVideoAvailability = async (url: string): Promise<boolean> => {
    try {
        // Use HEAD request to check headers without downloading the body
        const response = await fetch(url, { method: 'HEAD', cache: 'no-cache' }); 
        return response.ok;
    } catch (e) {
        return false;
    }
};

export const VideoGenCard: React.FC<VideoGenCardProps> = ({ scene, onGenerateVideo, onCancelVideo, onToggleVideoUpscale, onUpscaleVideo }) => {
  const hasBaseImage = !!scene.selectedImageForVideo;
  const canGenerate = hasBaseImage && !scene.isGeneratingVideo;
  const canUpscale = !!scene.videoUrl && !!scene.mediaGenerationId && !scene.upscaledVideoUrl && !scene.isUpscaling;
  
  const rawVideoUrl = scene.upscaledVideoUrl || scene.videoUrl;
  
  // Local state to handle the "safe" URL that is definitely ready to play
  const [verifiedVideoUrl, setVerifiedVideoUrl] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  useEffect(() => {
    // Determine the target URL (local playback override or remote URL)
    const urlToCheck = scene.playableUpscaledVideoUrl || scene.playableVideoUrl || rawVideoUrl;

    if (!urlToCheck) {
        setVerifiedVideoUrl(null);
        setIsVerifying(false);
        return;
    }

    // If it's a Data URL (base64 from import), it's always ready.
    if (urlToCheck.startsWith('data:')) {
         setVerifiedVideoUrl(urlToCheck);
         setIsVerifying(false);
         return;
    }

    const verifyAndSetUrl = async () => {
        // If we are regenerating, don't show the old video, show verifying state
        if (scene.isGeneratingVideo || scene.isUpscaling) {
            setVerifiedVideoUrl(null);
            return;
        }

        setIsVerifying(true);
        
        // Retry logic: Attempt to reach the file for up to 5 times (10 seconds)
        // This handles race conditions where API says "Done" but CDN is lagging.
        let isReady = false;
        for (let i = 0; i < 5; i++) {
            isReady = await checkVideoAvailability(urlToCheck);
            if (isReady) break;
            await new Promise(resolve => setTimeout(resolve, 2000));
        }

        // Cache Busting: Always append timestamp to force browser to ignore stale cache
        // This fixes the "Infinity Load" issue caused by partial content caching.
        const cacheBuster = urlToCheck.includes('?') ? `&t=${Date.now()}` : `?t=${Date.now()}`;
        setVerifiedVideoUrl(urlToCheck + cacheBuster);
        setIsVerifying(false);
    };

    verifyAndSetUrl();

  }, [rawVideoUrl, scene.playableVideoUrl, scene.playableUpscaledVideoUrl, scene.isGeneratingVideo, scene.isUpscaling]);

  const hasExistingVideo = !!scene.videoUrl;

  return (
    <div className="bg-white p-4 rounded-xl border border-blue-200 space-y-3 h-full flex flex-col text-gray-800">
      <div className="flex-shrink-0">
        <h4 className="font-bold text-sm text-blue-800 flex items-center gap-2"><i className="fas fa-video"></i>Video Generation</h4>
        {!hasBaseImage && (
          <div className="text-center text-xs text-yellow-800 bg-yellow-100 border border-yellow-300 p-3 mt-2 rounded-lg">
            <i className="fas fa-info-circle mr-1"></i>
            Select an image from the "Image Generation" panel to use as the base for your video.
          </div>
        )}
      </div>

      <div className="mt-auto pt-3 border-t border-blue-200 space-y-2">
        <div className="flex items-center justify-between">
            <label htmlFor={`upscale-toggle-${scene.id}`} className="flex items-center gap-2 text-sm font-semibold text-gray-700 cursor-pointer">
                <input
                    type="checkbox"
                    id={`upscale-toggle-${scene.id}`}
                    checked={scene.shouldUpscaleVideo}
                    onChange={() => onToggleVideoUpscale(scene.id)}
                    className="h-4 w-4 rounded border-gray-400 bg-white text-purple-600 focus:ring-purple-500"
                />
                Auto-Upscale Video
            </label>
        </div>
        
        <div className="flex items-center gap-2">
            <button
              onClick={() => onGenerateVideo(scene.id)}
              disabled={!canGenerate || scene.isCancelling}
              className={`w-full font-bold py-2 px-3 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 flex items-center justify-center gap-2 text-sm ${
                  hasExistingVideo 
                    ? 'bg-orange-400 hover:bg-orange-500 text-white' 
                    : 'bg-red-400 hover:bg-red-500 text-white'
                }`}
            >
              {scene.isGeneratingVideo ? (
                <><i className="fas fa-spinner fa-spin"></i>Generating...</>
              ) : hasExistingVideo ? (
                <><i className="fas fa-sync-alt"></i>Regenerate</>
              ) : (
                <><i className="fas fa-film"></i>Generate Video</>
              )}
            </button>
            {scene.isGeneratingVideo && (
                <button
                    onClick={() => onCancelVideo(scene.id)}
                    disabled={scene.isCancelling}
                    className="bg-gray-400 hover:bg-gray-500 text-white font-bold py-2 px-3 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 flex items-center justify-center gap-2 text-sm"
                    title="Stop Video Generation"
                >
                    {scene.isCancelling ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-stop"></i>}
                </button>
            )}
        </div>
        
        {canUpscale && (
             <button
                onClick={() => onUpscaleVideo(scene.id)}
                disabled={scene.isUpscaling}
                className="w-full bg-purple-500 hover:bg-purple-600 text-white font-bold py-2 px-3 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 flex items-center justify-center gap-2 text-sm"
            >
                {scene.isUpscaling ? (
                    <><i className="fas fa-spinner fa-spin"></i>Upscaling...</>
                ) : (
                    <><i className="fas fa-magic"></i>Upscale Now</>
                )}
            </button>
        )}

        {scene.videoGenerationError && (
          <p className="text-red-600 text-xs text-center bg-red-100 p-2 rounded-md">Error: {scene.videoGenerationError}</p>
        )}
      </div>

      <div className="flex-grow min-h-[90px]">
        {/* Loading / Verifying State */}
        {(scene.isGeneratingVideo || scene.isUpscaling || isVerifying) && (
            <div className="w-full aspect-video bg-gray-200 rounded-lg flex flex-col items-center justify-center animate-pulse gap-2 border border-gray-300">
                <i className="fas fa-video text-gray-400 text-3xl"></i>
                <div className="text-center">
                    {isVerifying ? (
                        <span className="text-xs text-blue-600 font-bold">Finalizing Video File...</span>
                    ) : (
                        <span className="text-xs text-gray-500 font-bold">
                            {scene.isUpscaling ? "Upscaling Video..." : "Generating Video..."}
                        </span>
                    )}
                </div>
            </div>
        )}
        
        {/* Playable Video State */}
        {!scene.isGeneratingVideo && !scene.isUpscaling && !isVerifying && verifiedVideoUrl && (
            <div className="relative aspect-video">
                <video
                    key={verifiedVideoUrl} /* CRITICAL: Force React to destroy and recreate the player when URL changes */
                    src={verifiedVideoUrl}
                    controls
                    loop
                    playsInline
                    preload="auto"
                    poster={scene.selectedImageForVideo}
                    className="w-full h-full object-cover bg-black rounded-lg shadow-sm"
                    onError={(e) => console.error("Video Playback Error", e)}
                />
                {scene.upscaledVideoUrl && (
                     <div className="absolute top-1 right-1 bg-purple-600 text-white px-2 py-0.5 text-xs font-bold flex items-center gap-1 rounded-md shadow-sm pointer-events-none">
                        <i className="fas fa-check"></i> Upscaled
                    </div>
                )}
            </div>
        )}

        {/* Empty State */}
        {!verifiedVideoUrl && !scene.isGeneratingVideo && !scene.isUpscaling && !isVerifying && (
             <div className="w-full h-full bg-gray-50 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-200">
                <div className="text-center text-gray-400">
                    <i className="fas fa-film text-3xl mb-1"></i>
                    <p className="text-[10px] font-semibold">No video generated</p>
                </div>
            </div>
        )}
      </div>
    </div>
  );
};
