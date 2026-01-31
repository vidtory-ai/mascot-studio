
import { createContext, Dispatch, SetStateAction } from 'react';
import { Project, Style, Character, World, Story } from '../types';

interface IProjectContext {
    project: Project | null;
    setProject: Dispatch<SetStateAction<Project | null>>;
    style: Style | null;
    setStyle: Dispatch<SetStateAction<Style | null>>;
    character: Character | null;
    setCharacter: Dispatch<SetStateAction<Character | null>>;
    world: World | null;
    setWorld: Dispatch<SetStateAction<World | null>>;
    story: Story | null;
    setStory: Dispatch<SetStateAction<Story | null>>;
}

export const ProjectContext = createContext<IProjectContext>({
    project: null,
    setProject: () => {},
    style: null,
    setStyle: () => {},
    character: null,
    setCharacter: () => {},
    world: null,
    setWorld: () => {},
    story: null,
    setStory: () => {},
});
