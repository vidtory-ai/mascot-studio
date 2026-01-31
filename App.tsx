import React, { useState, useCallback } from 'react';
import { Sidebar } from './components/Sidebar';
import { AssetLibrary } from './components/AssetLibrary';
import { Dashboard } from './components/Dashboard';
import { CharacterCreator } from './components/CharacterCreator';
import { DirectorStudio } from './components/DirectorStudio';
import { VideoMaker } from './components/VideoMaker';
import { WorldBuilder } from './components/WorldBuilder';
import { PosterGenerator } from './components/PosterGenerator';
import { Settings } from './components/Settings';
import { BrandGuidelinesPage } from './components/BrandGuidelines';
import { ToastContainer } from './components/Toast';
import { ViewMode, Asset, AssetType, ToastMessage, ToastType, SceneRender, BrandGuidelines } from './types';

// Business Mascot Storytelling - AI-generated assets for brand marketing
const INITIAL_ASSETS: Asset[] = [
  // Mascot Characters
  { id: 'mascot_01', name: 'Happy Brand Mascot', type: AssetType.CHARACTER, thumbnailUrl: '/assets/samples/mascot_01.png', createdAt: '2026-01-30' },
  { id: 'mascot_02', name: 'Tech Buddy Robot', type: AssetType.CHARACTER, thumbnailUrl: '/assets/samples/mascot_02.png', createdAt: '2026-01-30' },
  // Business Scenes
  { id: 'scene_01', name: 'Modern Office Lobby', type: AssetType.LOCATION, thumbnailUrl: '/assets/samples/scene_01.png', createdAt: '2026-01-30' },
  { id: 'scene_02', name: 'Product Launch Stage', type: AssetType.LOCATION, thumbnailUrl: '/assets/samples/scene_02.png', createdAt: '2026-01-30' },
  { id: 'scene_03', name: 'Coffee Shop Meeting', type: AssetType.LOCATION, thumbnailUrl: '/assets/samples/scene_03.png', createdAt: '2026-01-30' },
  { id: 'scene_04', name: 'Social Media Studio', type: AssetType.LOCATION, thumbnailUrl: '/assets/samples/scene_04.png', createdAt: '2026-01-30' },
  { id: 'scene_05', name: 'E-commerce Warehouse', type: AssetType.LOCATION, thumbnailUrl: '/assets/samples/scene_05.png', createdAt: '2026-01-30' },
  { id: 'scene_06', name: 'Digital Marketing Dashboard', type: AssetType.LOCATION, thumbnailUrl: '/assets/samples/scene_06.png', createdAt: '2026-01-30' },
  // Marketing Props
  { id: 'prop_01', name: 'Gift Box Package', type: AssetType.PROP, thumbnailUrl: '/assets/samples/prop_01.png', createdAt: '2026-01-30' },
  { id: 'prop_02', name: 'Megaphone Announcement', type: AssetType.PROP, thumbnailUrl: '/assets/samples/prop_02.png', createdAt: '2026-01-30' },
  { id: 'prop_03', name: 'Shopping Cart', type: AssetType.PROP, thumbnailUrl: '/assets/samples/prop_03.png', createdAt: '2026-01-30' },
  { id: 'prop_04', name: 'Star Rating Badge', type: AssetType.PROP, thumbnailUrl: '/assets/samples/prop_04.png', createdAt: '2026-01-30' },
  { id: 'prop_05', name: 'Sale Tag Banner', type: AssetType.PROP, thumbnailUrl: '/assets/samples/prop_05.png', createdAt: '2026-01-30' },
];

const DEFAULT_GUIDELINE: BrandGuidelines = {
  id: 'default',
  name: '3D Mascot Storytelling',
  style: {
    artStyle: '3D Cartoon/Pixar',
    colorPalette: 'Vibrant & Bold',
    lighting: 'Soft Studio',
    mood: 'Cheerful & Fun',
    era: 'Modern Day'
  },
  promptPrefix: '3D cartoon Pixar style, bright cheerful colors, friendly mascot aesthetic, professional brand marketing, high quality render',
  isActive: true,
  createdAt: new Date().toISOString()
};


function App() {
  const [currentMode, setCurrentMode] = useState<ViewMode>(ViewMode.DASHBOARD);
  const [assets, setAssets] = useState<Asset[]>(INITIAL_ASSETS);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const [brandGuidelines, setBrandGuidelines] = useState<BrandGuidelines[]>([DEFAULT_GUIDELINE]);
  const [activeGuideline, setActiveGuideline] = useState<BrandGuidelines | null>(DEFAULT_GUIDELINE);

  const [sceneHistory, setSceneHistory] = useState<SceneRender[]>([]);

  const addToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { id, message, type }]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const handleSaveGuideline = (guideline: BrandGuidelines) => {
    setBrandGuidelines(prev => {
      const exists = prev.find(g => g.id === guideline.id);
      if (exists) {
        return prev.map(g => g.id === guideline.id ? guideline : g);
      }
      return [...prev, guideline];
    });
    addToast(`Brand style "${guideline.name}" saved`, 'success');
  };

  const handleSetActiveGuideline = (id: string) => {
    setBrandGuidelines(prev => prev.map(g => ({ ...g, isActive: g.id === id })));
    const active = brandGuidelines.find(g => g.id === id);
    if (active) {
      setActiveGuideline({ ...active, isActive: true });
      addToast(`"${active.name}" is now active`, 'success');
    }
  };

  const handleDeleteGuideline = (id: string) => {
    if (brandGuidelines.length <= 1) {
      addToast('Cannot delete last brand style', 'error');
      return;
    }
    setBrandGuidelines(prev => prev.filter(g => g.id !== id));
    if (activeGuideline?.id === id) {
      const firstRemaining = brandGuidelines.find(g => g.id !== id);
      if (firstRemaining) handleSetActiveGuideline(firstRemaining.id);
    }
    addToast('Brand style deleted', 'info');
  };

  const handleSaveAsset = (newAsset: Asset) => {
    setAssets(prev => [newAsset, ...prev]);
    addToast(`${newAsset.name} saved to library`, 'success');
  };

  const handleSceneGenerated = (render: SceneRender) => {
    setSceneHistory(prev => [render, ...prev]);
    addToast('Scene added to production history', 'success');
  };

  const renderContent = () => {
    switch (currentMode) {
      case ViewMode.DASHBOARD:
        return <Dashboard assets={assets} onChangeMode={setCurrentMode} />;
      case ViewMode.ASSETS:
        return <AssetLibrary assets={assets} onUpdateAsset={(updated) => {
          setAssets(prev => prev.map(a => a.id === updated.id ? updated : a));
          addToast('Asset updated successfully', 'success');
        }} />;
      case ViewMode.CHARACTER_CREATOR:
        return <CharacterCreator onSave={handleSaveAsset} notify={addToast} />;
      case ViewMode.WORLD_BUILDER:
        return <WorldBuilder onSave={handleSaveAsset} notify={addToast} />;
      case ViewMode.DIRECTOR_STUDIO:
        return <DirectorStudio assets={assets} onSceneGenerated={handleSceneGenerated} />;
      case ViewMode.VIDEO_MAKER:
        return <VideoMaker assets={assets} sceneHistory={sceneHistory} />;
      case ViewMode.POSTER_GEN:
        return <PosterGenerator assets={assets} onSave={handleSaveAsset} />;
      case ViewMode.SETTINGS:
        return <Settings />;
      case ViewMode.BRAND_GUIDELINES:
        return (
          <BrandGuidelinesPage
            guidelines={brandGuidelines}
            activeGuideline={activeGuideline}
            onSave={handleSaveGuideline}
            onSetActive={handleSetActiveGuideline}
            onDelete={handleDeleteGuideline}
          />
        );
      default:
        return (
          <div className="flex-1 flex items-center justify-center bg-slate-950 text-slate-500">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-2">Feature Coming Soon</h2>
              <p>The {currentMode.replace('_', ' ')} module is currently under development.</p>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-950 text-slate-100 font-sans">
      <Sidebar currentMode={currentMode} setMode={setCurrentMode} />
      <main className="flex-1 flex flex-col h-full overflow-hidden relative">
        {renderContent()}
      </main>
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </div>
  );
}

export default App;