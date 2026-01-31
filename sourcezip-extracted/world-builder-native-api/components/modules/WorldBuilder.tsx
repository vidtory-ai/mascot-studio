
import React, { useContext, useState } from 'react';
import { ProjectContext } from '../../contexts/ProjectContext';
import { Card } from '../ui/Card';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { Textarea } from '../ui/Textarea';

const WorldBuilder: React.FC = () => {
    const { world, setWorld } = useContext(ProjectContext);
    const [localWorld, setLocalWorld] = useState(world);

    if (!localWorld) return <div>Loading world...</div>;

    const handleSave = () => {
        setWorld(localWorld);
    };

    return (
        <div>
            <h2 className="text-3xl font-bold text-white mb-6">World Builder</h2>
            <Card>
                <div className="space-y-6">
                    <Input
                        label="World Name"
                        id="world-name"
                        value={localWorld.name}
                        onChange={(e) => setLocalWorld({ ...localWorld, name: e.target.value })}
                    />
                    <Textarea
                        label="Core Lore & Description"
                        id="world-lore"
                        placeholder="Describe the climate, architecture, technology, and era of your world. What makes it unique?"
                        value={localWorld.lore}
                        onChange={(e) => setLocalWorld({ ...localWorld, lore: e.target.value })}
                        rows={8}
                    />
                    <Textarea
                        label="Key Locations"
                        id="world-locations"
                        placeholder="List important regions or cities, one per line."
                        value={localWorld.locations?.join('\n') || ''}
                        onChange={(e) => setLocalWorld({ ...localWorld, locations: e.target.value.split('\n') })}
                    />
                    <Textarea
                        label="Factions & Systems"
                        id="world-factions"
                        placeholder="Describe the main groups, religions, economic systems, or magic/tech rules."
                        value={localWorld.factions?.join('\n') || ''}
                        onChange={(e) => setLocalWorld({ ...localWorld, factions: e.target.value.split('\n') })}
                    />
                    <div className="text-right">
                        <Button onClick={handleSave}>Save World Details</Button>
                    </div>
                </div>
            </Card>
        </div>
    );
};

export default WorldBuilder;
