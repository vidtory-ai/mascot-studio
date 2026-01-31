import React, { useState } from 'react';
import { BrandGuidelines, ArtStyles, ColorPalettes, Lightings, Moods } from '../types';
import { Palette, Save, Trash2, Plus, Sparkles, Check, Star, Wand2, Upload } from 'lucide-react';

interface BrandGuidelinesPageProps {
    guidelines: BrandGuidelines[];
    activeGuideline: BrandGuidelines | null;
    onSave: (guideline: BrandGuidelines) => void;
    onSetActive: (id: string) => void;
    onDelete: (id: string) => void;
}

const Eras = [
    'Modern Day', 'Near Future Sci-Fi', 'Fantasy Medieval',
    'Cyberpunk 2077', 'Historical Renaissance', 'Post-Apocalyptic'
];

export const BrandGuidelinesPage: React.FC<BrandGuidelinesPageProps> = ({
    guidelines,
    activeGuideline,
    onSave,
    onSetActive,
    onDelete
}) => {
    const [isCreating, setIsCreating] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);

    const [name, setName] = useState('');
    const [artStyle, setArtStyle] = useState(ArtStyles[0]);
    const [colorPalette, setColorPalette] = useState(ColorPalettes[0]);
    const [lighting, setLighting] = useState(Lightings[0]);
    const [mood, setMood] = useState(Moods[0]);
    const [era, setEra] = useState(Eras[0]);
    const [promptPrefix, setPromptPrefix] = useState('');

    const resetForm = () => {
        setName('');
        setArtStyle(ArtStyles[0]);
        setColorPalette(ColorPalettes[0]);
        setLighting(Lightings[0]);
        setMood(Moods[0]);
        setEra(Eras[0]);
        setPromptPrefix('');
        setIsCreating(false);
        setEditingId(null);
    };

    const handleEdit = (g: BrandGuidelines) => {
        setEditingId(g.id);
        setName(g.name);
        setArtStyle(g.style.artStyle);
        setColorPalette(g.style.colorPalette);
        setLighting(g.style.lighting);
        setMood(g.style.mood);
        setEra(g.style.era);
        setPromptPrefix(g.promptPrefix);
        setIsCreating(true);
    };

    const handleSubmit = () => {
        const guideline: BrandGuidelines = {
            id: editingId || Date.now().toString(),
            name: name || 'Untitled Brand',
            style: { artStyle, colorPalette, lighting, mood, era },
            promptPrefix,
            isActive: editingId ? (activeGuideline?.id === editingId) : false,
            createdAt: editingId
                ? guidelines.find(g => g.id === editingId)?.createdAt || new Date().toISOString()
                : new Date().toISOString()
        };
        onSave(guideline);
        resetForm();
    };

    const generatePreviewPrompt = () => {
        return `Style: ${artStyle}. Color palette: ${colorPalette}. Lighting: ${lighting}. Mood: ${mood}. Era: ${era}. ${promptPrefix}`.trim();
    };

    return (
        <div className="flex-1 bg-slate-950 p-8 h-full overflow-y-auto">
            <div className="max-w-5xl mx-auto">

                {/* Header */}
                <header className="mb-8 flex justify-between items-center">
                    <div>
                        <h2 className="text-2xl font-bold text-white mb-1">Brand Guidelines</h2>
                        <p className="text-slate-400 text-sm">Manage visual styles that apply to all generated assets</p>
                    </div>
                    {!isCreating && (
                        <button
                            onClick={() => setIsCreating(true)}
                            className="px-5 py-2.5 bg-primary hover:bg-primary-hover text-white font-semibold rounded-lg flex items-center gap-2 transition-all shadow-md glow-primary"
                        >
                            <Plus size={18} /> New Style
                        </button>
                    )}
                </header>

                {/* Active Brand Banner */}
                {activeGuideline && !isCreating && (
                    <div className="mb-8 p-5 bg-slate-900 border border-slate-700/50 rounded-xl">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-primary/20 rounded-xl flex items-center justify-center text-primary">
                                    <Star size={24} />
                                </div>
                                <div>
                                    <p className="text-xs text-primary uppercase font-bold tracking-wider">Active Brand</p>
                                    <h3 className="text-xl font-bold text-white">{activeGuideline.name}</h3>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-sm text-slate-300">{activeGuideline.style.artStyle} • {activeGuideline.style.mood}</p>
                                <p className="text-xs text-slate-500">{activeGuideline.style.colorPalette} Palette</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Create/Edit Form - Clean White Card Style */}
                {isCreating && (
                    <div className="mb-8 bg-white rounded-xl p-6 space-y-6 shadow-lg">
                        <div className="flex items-center justify-between border-b border-slate-200 pb-4">
                            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                <div className="w-7 h-7 bg-primary rounded-lg flex items-center justify-center text-white text-sm">1</div>
                                {editingId ? 'Edit Style' : 'Create New Style'}
                            </h3>
                            <button onClick={resetForm} className="text-sm text-slate-400 hover:text-slate-600">Cancel</button>
                        </div>

                        {/* Name */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Brand Name</label>
                            <input
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="e.g. Cheerful Anime, Dark Fantasy..."
                                className="w-full bg-white border border-slate-300 rounded-lg p-3 text-slate-800 focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none transition-all placeholder-slate-400"
                            />
                        </div>

                        {/* Style Grid */}
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            <CleanSelector label="Art Style" value={artStyle} onChange={setArtStyle} options={ArtStyles} />
                            <CleanSelector label="Color Palette" value={colorPalette} onChange={setColorPalette} options={ColorPalettes} />
                            <CleanSelector label="Lighting" value={lighting} onChange={setLighting} options={Lightings} />
                            <CleanSelector label="Mood" value={mood} onChange={setMood} options={Moods} />
                            <CleanSelector label="Era/Setting" value={era} onChange={setEra} options={Eras} />
                        </div>

                        {/* Custom Prompt */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Custom Prompt Prefix (Optional)</label>
                            <textarea
                                value={promptPrefix}
                                onChange={(e) => setPromptPrefix(e.target.value)}
                                rows={2}
                                placeholder="Additional text injected at the start of every prompt..."
                                className="w-full bg-white border border-slate-300 rounded-lg p-3 text-slate-800 focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none transition-all text-sm placeholder-slate-400"
                            />
                        </div>

                        {/* Preview */}
                        <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                            <p className="text-xs font-bold text-primary uppercase mb-2 flex items-center gap-1">
                                <Sparkles size={12} /> Prompt Preview
                            </p>
                            <p className="text-sm text-slate-600 font-mono">{generatePreviewPrompt()}</p>
                        </div>

                        {/* Submit */}
                        <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                            <button onClick={resetForm} className="px-4 py-2 text-slate-500 hover:text-slate-700">Cancel</button>
                            <button
                                onClick={handleSubmit}
                                className="px-6 py-2.5 bg-primary hover:bg-primary-hover text-white font-semibold rounded-lg flex items-center gap-2 transition-all shadow-md"
                            >
                                <Save size={16} /> {editingId ? 'Update' : 'Save'} Style
                            </button>
                        </div>
                    </div>
                )}

                {/* Saved Styles Section */}
                <div className="bg-white rounded-xl p-6 shadow-lg">
                    <div className="flex items-center gap-2 mb-4 border-b border-slate-200 pb-4">
                        <div className="w-7 h-7 bg-primary rounded-lg flex items-center justify-center text-white text-sm font-bold">2</div>
                        <h3 className="text-lg font-bold text-slate-800">Saved Styles</h3>
                        <span className="bg-slate-100 text-slate-600 text-xs px-2 py-0.5 rounded-full ml-2">{guidelines.length}</span>
                    </div>

                    {guidelines.length === 0 ? (
                        <div className="text-center py-12 text-slate-400">
                            <Palette size={40} className="mx-auto mb-3 opacity-30" />
                            <p>No brand styles yet. Create your first one!</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {guidelines.map(g => (
                                <div
                                    key={g.id}
                                    className={`flex items-center gap-4 p-4 rounded-xl border transition-all cursor-pointer ${g.isActive
                                            ? 'border-primary bg-primary/5'
                                            : 'border-slate-200 hover:border-slate-300 bg-white'
                                        }`}
                                >
                                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${g.isActive ? 'bg-primary text-white' : 'bg-slate-100 text-slate-600'}`}>
                                        {g.isActive ? <Check size={20} /> : <Palette size={18} />}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="font-semibold text-slate-800 flex items-center gap-2">
                                            {g.name}
                                            {g.isActive && <span className="text-[10px] bg-primary text-white px-2 py-0.5 rounded uppercase font-bold">Active</span>}
                                        </h4>
                                        <p className="text-xs text-slate-500 mt-0.5">{g.style.artStyle} • {g.style.colorPalette} • {g.style.mood}</p>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        {!g.isActive && (
                                            <button
                                                onClick={() => onSetActive(g.id)}
                                                className="px-3 py-1.5 bg-primary/10 text-primary text-xs font-medium rounded-lg hover:bg-primary/20 transition-colors"
                                            >
                                                Set Active
                                            </button>
                                        )}
                                        <button
                                            onClick={() => handleEdit(g)}
                                            className="px-3 py-1.5 bg-slate-100 text-slate-600 text-xs rounded-lg hover:bg-slate-200 transition-colors"
                                        >
                                            Edit
                                        </button>
                                        <button
                                            onClick={() => onDelete(g.id)}
                                            className="p-1.5 text-slate-400 hover:text-red-500 transition-colors"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

// Clean selector matching reference image style
const CleanSelector: React.FC<{
    label: string;
    value: string;
    onChange: (v: string) => void;
    options: string[]
}> = ({ label, value, onChange, options }) => (
    <div>
        <label className="block text-xs font-medium text-slate-600 mb-1.5 uppercase tracking-wide">{label}</label>
        <select
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-slate-800 text-sm focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none transition-all"
        >
            {options.map(opt => (
                <option key={opt} value={opt}>{opt}</option>
            ))}
        </select>
    </div>
);
