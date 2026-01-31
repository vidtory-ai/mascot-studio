
import React, { useContext, useState } from 'react';
import { ProjectContext } from '../../contexts/ProjectContext';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Select } from '../ui/Select';
import { Textarea } from '../ui/Textarea';
import { generateLogline, generateSynopsis } from '../../services/geminiService';

const StoryEngine: React.FC = () => {
    const { story, setStory } = useContext(ProjectContext);
    const [isLoading, setIsLoading] = useState(false);

    if (!story) return <div>Loading story...</div>;
    
    const handleGenerateLogline = async () => {
        setIsLoading(true);
        const premise = story.synopsis || 'A character with a unique ability in a threatened world.';
        const newLogline = await generateLogline(premise);
        setStory({ ...story, logline: newLogline });
        setIsLoading(false);
    };

    const handleGenerateSynopsis = async () => {
        if (!story.logline) {
            alert("Please generate a logline first.");
            return;
        }
        setIsLoading(true);
        const newSynopsis = await generateSynopsis(story.logline);
        setStory({ ...story, synopsis: newSynopsis });
        setIsLoading(false);
    };

    return (
        <div>
            <h2 className="text-3xl font-bold text-white mb-6">Story Engine</h2>
            <Card>
                <div className="space-y-6">
                    <Select
                        label="Story Template"
                        id="story-template"
                        value={story.template}
                        onChange={(e) => setStory({ ...story, template: e.target.value })}
                    >
                        <option>Hero's Journey</option>
                        <option>Save The Cat</option>
                        <option>Three-Act Structure</option>
                        <option>Five-Act Structure</option>
                    </Select>

                    <div>
                        <Textarea
                            label="Logline"
                            id="story-logline"
                            placeholder="A compelling one-sentence summary of your story."
                            value={story.logline || ''}
                            onChange={(e) => setStory({ ...story, logline: e.target.value })}
                        />
                        <Button onClick={handleGenerateLogline} disabled={isLoading} className="mt-2" variant="secondary">
                            {isLoading ? 'Generating...' : 'AI Generate Logline'}
                        </Button>
                    </div>

                    <div>
                        <Textarea
                            label="Synopsis"
                            id="story-synopsis"
                            placeholder="A brief summary of the plot."
                            value={story.synopsis || ''}
                            onChange={(e) => setStory({ ...story, synopsis: e.target.value })}
                            rows={6}
                        />
                         <Button onClick={handleGenerateSynopsis} disabled={isLoading || !story.logline} className="mt-2" variant="secondary">
                            {isLoading ? 'Generating...' : 'AI Generate Synopsis from Logline'}
                        </Button>
                    </div>
                </div>
            </Card>
        </div>
    );
};

export default StoryEngine;
