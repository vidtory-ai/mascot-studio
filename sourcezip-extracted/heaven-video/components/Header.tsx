
import React, { useState } from 'react';
import { UsageDisplay } from './UsageDisplay';
import { usageService, USAGE_LIMITS } from '../services/usageService';
import { AppModule } from '../App';
import { SettingsModal } from './SettingsModal';

type UsageData = ReturnType<typeof usageService.getUsage>;

interface HeaderProps {
  currentUser: string;
  activeModule: AppModule;
  onLogout: () => void;
  onSaveProject: () => void;
  onImportProject: () => void;
  onViewStoryboard: () => void;
  usage: UsageData;
}

export const Header: React.FC<HeaderProps> = ({ currentUser, activeModule, onLogout, onSaveProject, onImportProject, onViewStoryboard, usage }) => {
  const [isUsageVisible, setIsUsageVisible] = useState(false);
  const [isSettingsModalVisible, setIsSettingsModalVisible] = useState(false);

  const moduleTitles: { [key in AppModule]: string } = {
    assets: 'Kilo & Bruno: Asset Manager',
    'script-processor': 'Script Processor',
    storyboard: 'Storyboard Output',
    thumbnails: 'Thumbnail Creator',
    landscape: 'Landscape Transition Creator',
  };

  return (
    <>
      <header className="bg-white p-3 border-b border-gray-200 flex justify-between items-center flex-shrink-0 z-20 shadow-sm">
        <div className="flex items-center gap-4">
          <i className="fas fa-bars text-gray-500 text-xl xl:hidden"></i> {/* Placeholder for mobile menu toggle */}
          <h2 className="text-xl font-bold text-gray-800">{moduleTitles[activeModule] || 'Dashboard'}</h2>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={onImportProject} className="bg-yellow-100 text-yellow-800 font-bold py-2 px-4 rounded-lg hover:bg-yellow-200 transition-colors flex items-center gap-2 text-sm">
              <i className="fas fa-upload"></i>
              Import
          </button>
          <button onClick={onSaveProject} className="bg-blue-100 text-blue-800 font-bold py-2 px-4 rounded-lg hover:bg-blue-200 transition-colors flex items-center gap-2 text-sm">
              <i className="fas fa-save"></i>
              Save
          </button>
          <button onClick={() => setIsSettingsModalVisible(true)} className="bg-gray-100 text-gray-800 font-bold py-2 px-4 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2 text-sm">
              <i className="fas fa-cog"></i>
              Settings
          </button>
          <div className="w-px h-6 bg-gray-300 mx-2"></div>
          <div className="relative">
            <button 
              onClick={() => setIsUsageVisible(!isUsageVisible)}
              className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div className="text-right">
                  <span className="font-semibold text-gray-700 text-sm">Welcome, {currentUser}!</span>
                  <p className="text-xs text-gray-500">View Usage</p>
              </div>
              <i className={`fas fa-chevron-down text-xs text-gray-500 transition-transform ${isUsageVisible ? 'rotate-180' : ''}`}></i>
            </button>
            {isUsageVisible && (
              <div className="absolute top-full right-0 mt-2 w-72 bg-white border border-gray-200 rounded-lg shadow-lg z-30 p-4">
                 <UsageDisplay usage={usage} limits={USAGE_LIMITS} />
              </div>
            )}
          </div>
          <button onClick={onLogout} title="Logout" className="bg-red-100 hover:bg-red-200 text-red-700 font-bold h-10 w-10 rounded-lg transition-colors flex items-center justify-center">
              <i className="fas fa-sign-out-alt"></i>
          </button>
        </div>
      </header>
      {isSettingsModalVisible && <SettingsModal onClose={() => setIsSettingsModalVisible(false)} />}
    </>
  );
};
