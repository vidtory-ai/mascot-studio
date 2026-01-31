
import React from 'react';
import { AppModule } from '../App';

interface SidebarProps {
  activeModule: AppModule;
  onNavigate: (module: AppModule) => void;
}

const NavItem: React.FC<{
  icon: string;
  label: string;
  module: AppModule;
  activeModule: AppModule;
  onClick: (module: AppModule) => void;
}> = ({ icon, label, module, activeModule, onClick }) => {
  const isActive = activeModule === module;
  return (
    <button
      onClick={() => onClick(module)}
      className={`w-full flex items-center gap-4 px-4 py-3 text-left text-sm font-bold transition-all duration-200 rounded-lg ${
        isActive
          ? 'bg-blue-500 text-white shadow-md'
          : 'text-gray-500 hover:bg-blue-100 hover:text-blue-700'
      }`}
    >
      <i className={`fas ${icon} w-6 text-center text-lg`}></i>
      <span>{label}</span>
    </button>
  );
};

export const Sidebar: React.FC<SidebarProps> = ({
  activeModule,
  onNavigate,
}) => {
  return (
    <nav className="w-64 bg-white border-r border-gray-200 flex-shrink-0 flex flex-col p-2">
      <div className="p-4 border-b border-gray-200">
         <h1 className="text-xl font-bold text-blue-600 text-center">
          <i className="fas fa-film mr-2"></i>Animation Agent
        </h1>
      </div>
      <div className="flex-grow py-4 space-y-2">
        <NavItem
          icon="fa-users"
          label="Asset Manager"
          module="assets"
          activeModule={activeModule}
          onClick={onNavigate}
        />
        <NavItem
          icon="fa-robot"
          label="Director Agent"
          module="script-processor"
          activeModule={activeModule}
          onClick={onNavigate}
        />
        <NavItem
          icon="fa-border-all"
          label="Storyboard View"
          module="storyboard"
          activeModule={activeModule}
          onClick={onNavigate}
        />
        <NavItem
          icon="fa-mountain"
          label="Landscape View"
          module="landscape"
          activeModule={activeModule}
          onClick={onNavigate}
        />
        <NavItem
          icon="fa-clone"
          label="Thumbnail Creator"
          module="thumbnails"
          activeModule={activeModule}
          onClick={onNavigate}
        />
      </div>
       <div className="p-4 border-t border-gray-200 text-center text-xs text-gray-400">
          <p>Animation Storyboard Agent</p>
          <p>&copy; 2025</p>
        </div>
    </nav>
  );
};
