import React, { useState, useEffect } from 'react';
import { settingsService } from '../services/settingsService';

interface SettingsModalProps {
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ onClose }) => {
  const [apiKey, setApiKey] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setApiKey(settingsService.getApiKey());
  }, []);

  const handleSave = () => {
    settingsService.setApiKey(apiKey);
    setSaved(true);
    setTimeout(() => {
        setSaved(false);
        onClose();
    }, 1500);
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div 
        className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md flex flex-col gap-4 text-gray-800"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold text-blue-800"><i className="fas fa-cog mr-3"></i>API Settings</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 text-2xl">&times;</button>
        </div>
        
        <div>
          <label htmlFor="api-key-input" className="block text-sm font-semibold text-gray-600 mb-1">
            LeHuyDucAnh API Key
          </label>
          <input
            id="api-key-input"
            type="text"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            className="w-full bg-white border-2 border-blue-200 rounded-lg p-3 text-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200"
            placeholder="Enter your API key"
          />
          <p className="text-xs text-gray-500 mt-1">Changes will be saved in your browser. Leave blank to reset to default.</p>
        </div>

        <div className="mt-2 flex gap-3 justify-end">
            <button
                onClick={onClose}
                className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-6 rounded-full transition-colors"
            >
                Cancel
            </button>
             <button
                onClick={handleSave}
                className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-6 rounded-full transition-colors w-32"
            >
                {saved ? <><i className="fas fa-check mr-2"></i>Saved!</> : 'Save'}
            </button>
        </div>
      </div>
    </div>
  );
};
