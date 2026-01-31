import React from 'react';
import { ViewMode } from '../types';
import {
  LayoutDashboard,
  FolderOpen,
  UserPlus,
  Globe,
  Clapperboard,
  BookOpen,
  Film,
  Image as ImageIcon,
  Settings,
  Sparkles,
  Palette,
  LogOut
} from 'lucide-react';

interface SidebarProps {
  currentMode: ViewMode;
  setMode: (mode: ViewMode) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentMode, setMode }) => {
  const navItems = [
    { mode: ViewMode.DASHBOARD, icon: LayoutDashboard, label: 'Dashboard' },
    { mode: ViewMode.ASSETS, icon: FolderOpen, label: 'IP Asset Library' },
    { mode: ViewMode.BRAND_GUIDELINES, icon: Palette, label: 'Brand Guidelines' },
    { type: 'separator', label: 'CREATION' },
    { mode: ViewMode.CHARACTER_CREATOR, icon: UserPlus, label: 'Character Sheet' },
    { mode: ViewMode.WORLD_BUILDER, icon: Globe, label: 'World Builder' },
    { type: 'separator', label: 'PRODUCTION' },
    { mode: ViewMode.DIRECTOR_STUDIO, icon: Clapperboard, label: 'Scene Studio' },
    { mode: ViewMode.COMIC_GEN, icon: BookOpen, label: 'Comic Gen' },
    { mode: ViewMode.VIDEO_MAKER, icon: Film, label: 'Video Maker' },
    { mode: ViewMode.POSTER_GEN, icon: ImageIcon, label: 'Poster/Banner' },
  ];

  return (
    <div className="w-60 bg-slate-900 border-r border-slate-700/50 flex flex-col h-screen">
      {/* Logo Section */}
      <div className="p-5 border-b border-slate-700/50">
        <h1 className="text-lg font-bold text-white tracking-wider flex items-center gap-2.5">
          <div className="w-8 h-8 bg-gradient-to-br from-primary to-emerald-400 rounded-lg flex items-center justify-center text-white shadow-lg">
            <Sparkles size={16} />
          </div>
          <span>Mascot Studio</span>
        </h1>
        <p className="text-[11px] text-slate-500 mt-1 ml-10">Brand Storytelling Platform</p>
      </div>

      <nav className="flex-1 overflow-y-auto py-4 px-3">
        <ul className="space-y-1">
          {navItems.map((item, idx) => {
            if (item.type === 'separator') {
              return (
                <li key={idx} className="pt-5 pb-2 px-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                  {item.label}
                </li>
              );
            }
            const Icon = item.icon as React.ElementType;
            const isActive = currentMode === item.mode;
            return (
              <li key={idx}>
                <button
                  onClick={() => item.mode && setMode(item.mode as ViewMode)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${isActive
                    ? 'bg-primary text-white shadow-md'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                    }`}
                >
                  <Icon size={18} />
                  <span>{item.label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="p-4 border-t border-slate-700/50">
        <button
          onClick={() => setMode(ViewMode.SETTINGS)}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all mb-4 ${currentMode === ViewMode.SETTINGS
            ? 'bg-primary text-white'
            : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
        >
          <Settings size={18} />
          <span>Settings</span>
        </button>

        <div className="flex items-center gap-3 px-1">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center text-white font-bold text-sm shadow-md">
            🦊
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">Demo Brand</p>
            <p className="text-[10px] text-slate-500">Pro Plan</p>
          </div>
          <button className="p-2 text-slate-500 hover:text-white hover:bg-slate-800 rounded-lg transition-colors">
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};