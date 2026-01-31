import React, { useState } from 'react';
import { Project } from '../types';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Select } from './ui/Select';

interface ProjectDashboardProps {
    onCreateProject: (project: Project) => void;
}

const ProjectDashboard: React.FC<ProjectDashboardProps> = ({ onCreateProject }) => {
    const [projectName, setProjectName] = useState('');
    const [targetAudience, setTargetAudience] = useState('Kids');
    const [tone, setTone] = useState('Adventurous');
    const [aspectRatio, setAspectRatio] = useState<'16:9' | '1:1' | '9:16'>('16:9');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!projectName.trim()) {
            alert('Project name is required.');
            return;
        }
        onCreateProject({
            name: projectName,
            targetAudience,
            tone,
            defaultAspectRatio: aspectRatio
        });
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-sky-100">
            <Card className="w-full max-w-md">
                <h1 className="text-4xl font-extrabold text-center text-slate-800 mb-2">Brian's World Builder Studio</h1>
                <p className="text-center text-slate-500 mb-8">Create a new IP Project to begin your adventure!</p>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <Input
                        label="Project Name"
                        id="project-name"
                        value={projectName}
                        onChange={(e) => setProjectName(e.target.value)}
                        placeholder="e.g., 'The Magical Crystal Weavers'"
                        required
                    />
                    <Input
                        label="Target Audience"
                        id="target-audience"
                        value={targetAudience}
                        onChange={(e) => setTargetAudience(e.target.value)}
                        placeholder="e.g., 'Young Adventurers'"
                    />
                    <Input
                        label="Tone & Mood"
                        id="tone"
                        value={tone}
                        onChange={(e) => setTone(e.target.value)}
                        placeholder="e.g., 'Hopeful, mysterious, fun'"
                    />
                    <Select
                        label="Default Canvas Shape"
                        id="aspect-ratio"
                        value={aspectRatio}
                        onChange={(e) => setAspectRatio(e.target.value as '16:9' | '1:1' | '9:16')}
                    >
                        <option value="16:9">16:9 (Widescreen)</option>
                        <option value="1:1">1:1 (Square)</option>
                        <option value="9:16">9:16 (Tall)</option>
                    </Select>
                    <Button type="submit" className="w-full !py-3 !text-base">Start Creating!</Button>
                </form>
            </Card>
        </div>
    );
};

export default ProjectDashboard;