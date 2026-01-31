
import React, { useContext } from 'react';
import { ModuleType } from '../types';
import { ProjectContext } from '../contexts/ProjectContext';
import { 
    PaintBrushIcon, UserCircleIcon, GlobeAltIcon, BookOpenIcon, 
    PhotoIcon, FilmIcon, ArrowDownTrayIcon, ArrowUpTrayIcon
} from '@heroicons/react/24/outline';

interface SidebarProps {
    activeModule: ModuleType;
    setActiveModule: (module: ModuleType) => void;
    onImportProject: () => void;
    onSaveProject: () => void;
}

const modules: { id: ModuleType; name: string; icon: React.ElementType }[] = [
    { id: 'CHARACTER', name: 'Character', icon: UserCircleIcon },
    { id: 'STYLE', name: 'Style Lock', icon: PaintBrushIcon },
    { id: 'WORLD', name: 'World', icon: GlobeAltIcon },
    { id: 'STORY', name: 'Story', icon: BookOpenIcon },
    { id: 'VISUALS', name: 'Visuals', icon: PhotoIcon },
    { id: 'STORYBOARD', name: 'Storyboard', icon: FilmIcon },
];

const Sidebar: React.FC<SidebarProps> = ({ activeModule, setActiveModule, onImportProject, onSaveProject }) => {
    const { project } = useContext(ProjectContext);

    return (
        <div className="flex flex-col w-64 bg-gray-900 text-gray-300">
            <div className="flex items-center justify-center h-20 border-b border-gray-700">
                <h1 className="text-xl font-bold text-white truncate px-4">{project?.name || 'Project'}</h1>
            </div>
            <nav className="flex-1 px-4 py-4 space-y-2">
                {modules.map((module) => (
                    <button
                        key={module.id}
                        onClick={() => setActiveModule(module.id)}
                        className={`flex items-center w-full px-4 py-2.5 text-sm font-medium rounded-lg transition-colors duration-200 ${
                            activeModule === module.id
                                ? 'bg-indigo-600 text-white'
                                : 'hover:bg-gray-700 hover:text-white'
                        }`}
                    >
                        <module.icon className="w-6 h-6 mr-3" />
                        {module.name}
                    </button>
                ))}
            </nav>
            <div className="px-4 py-4 border-t border-gray-700 space-y-2">
                <button
                    onClick={onSaveProject}
                    className="flex items-center w-full px-4 py-2.5 text-sm font-medium rounded-lg hover:bg-gray-700 hover:text-white transition-colors duration-200"
                >
                    <ArrowDownTrayIcon className="w-6 h-6 mr-3" />
                    Save Project
                </button>
                <button
                    onClick={onImportProject}
                    className="flex items-center w-full px-4 py-2.5 text-sm font-medium rounded-lg hover:bg-gray-700 hover:text-white transition-colors duration-200"
                >
                    <ArrowUpTrayIcon className="w-6 h-6 mr-3" />
                    Import Project
                </button>
            </div>
        </div>
    );
};

export default Sidebar;
