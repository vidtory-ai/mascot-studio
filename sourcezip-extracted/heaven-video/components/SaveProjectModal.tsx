
import React, { useState } from 'react';

interface SaveProjectModalProps {
  onSave: (filename: string, compactMode: boolean) => void;
  onClose: () => void;
}

export const SaveProjectModal: React.FC<SaveProjectModalProps> = ({ onSave, onClose }) => {
  const [filename, setFilename] = useState(`heaven-studios-project-${new Date().toISOString().slice(0, 10)}`);
  const [isCompactMode, setIsCompactMode] = useState(false);

  const handleSaveClick = () => {
    // Basic validation to prevent saving with an empty name
    if (filename.trim()) {
      onSave(filename.trim(), isCompactMode);
    }
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
          <h2 className="text-xl font-bold text-blue-800"><i className="fas fa-save mr-3"></i>Save Project As...</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 text-2xl">&times;</button>
        </div>
        
        <div>
          <label htmlFor="project-filename" className="block text-sm font-semibold text-gray-600 mb-1">
            Filename
          </label>
          <input
            id="project-filename"
            type="text"
            value={filename}
            onChange={(e) => setFilename(e.target.value)}
            className="w-full bg-white border-2 border-blue-200 rounded-lg p-3 text-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200"
            placeholder="Enter a filename"
          />
          <p className="text-xs text-gray-500 mt-1">The project will be saved as a <code className="font-mono bg-gray-200 px-1 rounded">.heaven</code> file.</p>
        </div>

        {/* Save Mode Options */}
        <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 space-y-2">
            <h4 className="font-bold text-sm text-gray-700">Save Mode</h4>
            
            <label className="flex items-start gap-3 cursor-pointer p-2 hover:bg-white rounded transition-colors">
                <input 
                    type="radio" 
                    name="saveMode" 
                    checked={!isCompactMode} 
                    onChange={() => setIsCompactMode(false)}
                    className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500"
                />
                <div>
                    <span className="block font-bold text-sm text-gray-800">Full Backup (Recommended)</span>
                    <span className="block text-xs text-gray-500">Downloads all images & videos into the file. Guarantees assets work offline and won't expire. Larger file size.</span>
                </div>
            </label>

            <label className="flex items-start gap-3 cursor-pointer p-2 hover:bg-white rounded transition-colors">
                <input 
                    type="radio" 
                    name="saveMode" 
                    checked={isCompactMode} 
                    onChange={() => setIsCompactMode(true)}
                    className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500"
                />
                <div>
                    <span className="block font-bold text-sm text-gray-800">Compact (Links Only)</span>
                    <span className="block text-xs text-gray-500">Saves URLs only. Extremely small file size, but generated images <strong>may expire or break</strong> later.</span>
                </div>
            </label>
        </div>

        <div className="mt-2 flex gap-3 justify-end">
            <button
                onClick={onClose}
                className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-6 rounded-full transition-colors"
            >
                Cancel
            </button>
             <button
                onClick={handleSaveClick}
                disabled={!filename.trim()}
                className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-6 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
                Save
            </button>
        </div>
      </div>
    </div>
  );
};
