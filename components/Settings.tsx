import React, { useState, useEffect } from 'react';
import { Key, CreditCard, ShieldCheck, CheckCircle2, Save } from 'lucide-react';

export const Settings: React.FC = () => {
  const [geminiKey, setGeminiKey] = useState('');
  const [videoKey, setVideoKey] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    // Load from local storage on mount
    setGeminiKey(localStorage.getItem('NEXUS_GEMINI_KEY') || '');
    setVideoKey(localStorage.getItem('NEXUS_VIDEO_KEY') || '');
  }, []);

  const handleSave = () => {
    localStorage.setItem('NEXUS_GEMINI_KEY', geminiKey);
    localStorage.setItem('NEXUS_VIDEO_KEY', videoKey);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="flex-1 bg-nexus-900 p-8 overflow-y-auto">
       <div className="max-w-3xl mx-auto space-y-8">
          <header className="border-b border-nexus-700 pb-6">
             <h2 className="text-3xl font-bold text-white mb-2">Studio Settings</h2>
             <p className="text-nexus-400">Manage your subscription and external API connections.</p>
          </header>

          {/* Subscription Section */}
          <section className="bg-nexus-800 rounded-xl border border-nexus-700 p-6">
             <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-purple-500/20 rounded-lg text-purple-400">
                   <CreditCard size={24} />
                </div>
                <div>
                   <h3 className="text-lg font-bold text-white">Subscription Plan</h3>
                   <p className="text-sm text-nexus-400">Manage billing and features</p>
                </div>
             </div>

             <div className="bg-gradient-to-r from-nexus-700 to-nexus-800 rounded-lg p-6 border border-nexus-600 flex justify-between items-center">
                <div>
                   <p className="text-xs text-nexus-400 uppercase tracking-wider font-bold mb-1">Current Plan</p>
                   <h4 className="text-2xl font-bold text-white">Pro Studio</h4>
                   <p className="text-sm text-nexus-300 mt-2 flex items-center gap-2">
                     <CheckCircle2 size={14} className="text-green-400" /> Active until Nov 2025
                   </p>
                </div>
                <button className="px-4 py-2 bg-white text-nexus-900 font-bold rounded-lg hover:bg-gray-200">
                   Manage Billing
                </button>
             </div>
          </section>

          {/* API Keys Section */}
          <section className="bg-nexus-800 rounded-xl border border-nexus-700 p-6">
             <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-nexus-accent/20 rounded-lg text-nexus-accent">
                   <Key size={24} />
                </div>
                <div>
                   <h3 className="text-lg font-bold text-white">API Connections</h3>
                   <p className="text-sm text-nexus-400">Connect generative AI providers</p>
                </div>
             </div>

             <div className="space-y-6">
                <div>
                   <label className="block text-sm font-medium text-nexus-300 mb-2">Google Gemini API Key</label>
                   <div className="relative">
                      <input 
                        type="password" 
                        value={geminiKey}
                        onChange={(e) => setGeminiKey(e.target.value)}
                        placeholder="AIzaSy..."
                        className="w-full bg-nexus-900 border border-nexus-600 rounded-lg p-3 text-white focus:border-nexus-accent outline-none pl-10"
                      />
                      <ShieldCheck className="absolute left-3 top-3.5 text-nexus-500" size={18} />
                   </div>
                   <p className="text-xs text-nexus-500 mt-2">Used for Text Generation, Vision Analysis, and Image Generation.</p>
                </div>

                <div>
                   <label className="block text-sm font-medium text-nexus-300 mb-2">Video Generation API Key</label>
                   <div className="relative">
                      <input 
                        type="password" 
                        value={videoKey}
                        onChange={(e) => setVideoKey(e.target.value)}
                        placeholder="ak_..."
                        className="w-full bg-nexus-900 border border-nexus-600 rounded-lg p-3 text-white focus:border-nexus-accent outline-none pl-10"
                      />
                      <ShieldCheck className="absolute left-3 top-3.5 text-nexus-500" size={18} />
                   </div>
                </div>

                <div className="pt-4 border-t border-nexus-700 flex justify-end">
                   <button 
                     onClick={handleSave}
                     className="px-6 py-3 bg-nexus-accent hover:bg-nexus-accentHover text-white font-bold rounded-lg flex items-center gap-2 transition-all"
                   >
                      {saved ? <CheckCircle2 size={18} /> : <Save size={18} />}
                      {saved ? 'Settings Saved' : 'Save API Keys'}
                   </button>
                </div>
             </div>
          </section>
       </div>
    </div>
  );
};