
import React, { useContext, useState } from 'react';
import { ProjectContext } from '../../contexts/ProjectContext';
import { Card } from '../ui/Card';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { Textarea } from '../ui/Textarea';

const StyleEditor: React.FC = () => {
    const { style, setStyle } = useContext(ProjectContext);
    const [localStyle, setLocalStyle] = useState(style);

    if (!localStyle) return <div>Loading style...</div>;

    const handlePaletteChange = (index: number, color: string) => {
        const newPalette = [...localStyle.palette];
        newPalette[index] = color;
        setLocalStyle({ ...localStyle, palette: newPalette });
    };
    
    const addColor = () => {
        setLocalStyle(prev => ({...prev!, palette: [...prev!.palette, '#ffffff']}));
    }

    const handleSave = () => {
        setStyle(localStyle);
        // Add a visual confirmation if desired
    };

    return (
        <div>
            <h2 className="text-3xl font-bold text-white mb-6">Style Lock System</h2>
            <Card>
                <div className="space-y-6">
                    <Input
                        label="Style Name"
                        id="style-name"
                        value={localStyle.name}
                        onChange={(e) => setLocalStyle({ ...localStyle, name: e.target.value })}
                    />
                    <Textarea
                        label="Style Description"
                        id="style-desc"
                        placeholder="e.g., 'Cel-shaded with thick outlines, warm lighting, inspired by Studio Ghibli.'"
                        value={localStyle.description || ''}
                        onChange={(e) => setLocalStyle({ ...localStyle, description: e.target.value })}
                    />
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Color Palette</label>
                        <div className="flex flex-wrap gap-3 items-center">
                            {localStyle.palette.map((color, index) => (
                                <div key={index} className="relative">
                                    <input
                                        type="color"
                                        value={color}
                                        onChange={(e) => handlePaletteChange(index, e.target.value)}
                                        className="w-12 h-12 p-0 border-none rounded-full cursor-pointer appearance-none bg-transparent"
                                        style={{'backgroundColor': color}}
                                    />
                                </div>
                            ))}
                             <button onClick={addColor} className="w-12 h-12 rounded-full bg-gray-700 flex items-center justify-center hover:bg-gray-600">+</button>
                        </div>
                    </div>
                     <div>
                        <label htmlFor="style-weight" className="block text-sm font-medium text-gray-300">
                            Style Weight: {localStyle.modelProfile.styleWeight.toFixed(2)}
                        </label>
                        <input
                            id="style-weight"
                            type="range"
                            min="0"
                            max="1"
                            step="0.05"
                            value={localStyle.modelProfile.styleWeight}
                            onChange={(e) => setLocalStyle({...localStyle, modelProfile: { styleWeight: parseFloat(e.target.value) }})}
                            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                        />
                    </div>
                    <div className="text-right">
                        <Button onClick={handleSave}>Save Style</Button>
                    </div>
                </div>
            </Card>
        </div>
    );
};

export default StyleEditor;
