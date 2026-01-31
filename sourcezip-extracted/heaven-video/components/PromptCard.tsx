import React, { useState } from 'react';
import { StoryboardScene } from '../types';

interface PromptCardProps {
  scene: StoryboardScene;
  onSceneDataChange: (sceneId: string, field: keyof StoryboardScene, value: any) => void;
  onEnrichScene: (sceneId: string) => void;
}

export const PromptCard: React.FC<PromptCardProps> = ({ scene, onSceneDataChange, onEnrichScene }) => {

  return (
    <div className="bg-white p-4 rounded-xl border border-blue-200 flex flex-col gap-4 h-full text-gray-800">
      <blockquote className="border-l-4 border-pink-400 pl-3">
        <p className="text-gray-600 italic">"{scene.lyric}"</p>
      </blockquote>
      
      <div className="space-y-4 flex-grow flex flex-col">
        {/* Image Prompt Section */}
        <div className="relative group bg-blue-100/50 p-3 rounded-lg border border-blue-200 flex-grow flex flex-col">
          <div className="flex justify-between items-center mb-2">
            <h4 className="font-bold text-sm text-blue-800 flex items-center gap-2">
              <i className="fas fa-image"></i>Image Prompt (Start Frame)
            </h4>
          </div>
          <textarea
            value={scene.imagePrompt}
            onChange={(e) => onSceneDataChange(scene.id, 'imagePrompt', e.target.value)}
            placeholder="Edit image prompt..."
            className="w-full bg-white border border-blue-200 rounded p-2 text-gray-700 text-sm focus:ring-1 focus:ring-blue-500 transition duration-200 resize-y flex-grow"
            rows={5}
          />
        </div>

        {/* Video Prompt Section */}
        <div className="relative group bg-blue-100/50 p-3 rounded-lg border border-blue-200 flex-grow flex flex-col">
            <div className="flex justify-between items-center mb-2">
                <h4 className="font-bold text-sm text-blue-800 flex items-center gap-2">
                    <i className="fas fa-video"></i>Video Motion Prompt
                </h4>
                 <button
                    onClick={() => onEnrichScene(scene.id)}
                    disabled={scene.isEnriching}
                    className="text-xs font-semibold text-purple-600 hover:text-purple-800 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors flex items-center gap-1"
                    title="Tạo mô tả chi tiết"
                >
                    {scene.isEnriching ? (
                        <><i className="fas fa-spinner fa-spin"></i>Enriching...</>
                    ) : (
                        <><i className="fas fa-wand-magic-sparkles"></i>Tạo mô tả chi tiết</>
                    )}
                </button>
            </div>
          <textarea
            value={scene.videoPrompt}
            onChange={(e) => onSceneDataChange(scene.id, 'videoPrompt', e.target.value)}
            placeholder="Edit video motion prompt..."
            className="w-full bg-white border border-blue-200 rounded p-2 text-gray-700 text-sm focus:ring-1 focus:ring-blue-500 transition duration-200 resize-y flex-grow"
            rows={5}
          />
        </div>
      </div>
    </div>
  );
};