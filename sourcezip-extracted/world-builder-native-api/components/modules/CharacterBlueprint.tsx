
import React, { useContext, useState } from 'react';
import { ProjectContext } from '../../contexts/ProjectContext';
import { Card } from '../ui/Card';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';

const defaultFields = [
    { id: 'age', label: 'Age', placeholder: 'e.g., 25 years old' },
    { id: 'bodyType', label: 'Body Type', placeholder: 'e.g., Athletic, Slender' },
    { id: 'silhouette', label: 'Silhouette', placeholder: 'e.g., Triangular, flowing robes' },
    { id: 'mainExpression', label: 'Dominant Expression', placeholder: 'e.g., Determined, curious' },
    { id: 'mainColor', label: 'Dominant Color', placeholder: 'e.g., Royal Blue' },
    { id: 'props', label: 'Signature Props', placeholder: 'e.g., Crystal staff, leather-bound book' },
    { id: 'occupation', label: 'Occupation', placeholder: 'e.g., Light-weaver, Royal Guard' },
    { id: 'archetype', label: 'Archetype', placeholder: 'e.g., The Rebel, The Mentor' },
    { id: 'motivation', label: 'Motivation', placeholder: 'e.g., To restore balance, to protect their family' },
    { id: 'flaw', label: 'Fatal Flaw', placeholder: 'e.g., Overly trusting, reckless' },
];

const CharacterBlueprint: React.FC = () => {
    const { character, setCharacter } = useContext(ProjectContext);
    const [localCharacter, setLocalCharacter] = useState(character);

    if (!localCharacter) return <div>Loading character...</div>;

    const handleBlueprintChange = (key: string, value: string) => {
        setLocalCharacter(prev => ({
            ...prev!,
            blueprint: {
                ...prev!.blueprint,
                [key]: value
            }
        }));
    };

    const handleSave = () => {
        setCharacter(localCharacter);
    };

    return (
        <div>
            <h2 className="text-3xl font-bold text-white mb-6">Character Blueprint</h2>
            <Card>
                <div className="space-y-6">
                    <Input
                        label="Character Name"
                        id="char-name"
                        value={localCharacter.name}
                        onChange={(e) => setLocalCharacter({ ...localCharacter, name: e.target.value })}
                        className="text-2xl font-bold"
                    />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {defaultFields.map(field => (
                            <Input
                                key={field.id}
                                label={field.label}
                                id={`bp-${field.id}`}
                                value={localCharacter.blueprint[field.id] || ''}
                                onChange={(e) => handleBlueprintChange(field.id, e.target.value)}
                                placeholder={field.placeholder}
                            />
                        ))}
                    </div>
                     <div className="text-right">
                        <Button onClick={handleSave}>Save Blueprint</Button>
                    </div>
                </div>
            </Card>
        </div>
    );
};

export default CharacterBlueprint;
