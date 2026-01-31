
import { GoogleGenAI, Modality } from "@google/genai";
import { AspectRatio, GenerationTarget, ReferenceAsset, CharacterBodyType } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

interface PromptGenerationParams {
    target: GenerationTarget;
    subjectDescription: string;
    style: string;
    world: string;
    specificPrompt: string;
    referenceAssetType?: GenerationTarget;
    hasEditReference?: boolean;
}

const generateTextPrompt = ({ target, subjectDescription, style, world, specificPrompt }: PromptGenerationParams): string => {
    const stylePrompt = `Art Style: ${style}.`;
    const worldContext = `World context: "${world}".`;
    const subjectContext = `Subject context: "${subjectDescription}".`;
    // Strong constraint to ensure only one character is generated
    const singleCharConstraint = "CRITICAL: Generate EXACTLY ONE character. Do NOT include any other characters in the image.";

    switch (target) {
        case 'secondary_character':
            // Generate secondary characters with natural poses, accessories, on a solid white background.
            return `${stylePrompt} ${worldContext} ${subjectContext} Generate EXACTLY ONE NEW, unique secondary character based on the following idea: "${specificPrompt}". This character should fit into the described world. Depict them full-body in a natural pose with an expression and accessories that match their personality. CRITICAL: The background must be solid, 100% white. ${singleCharConstraint}`;
        case 'world_scene':
            return `${stylePrompt} ${worldContext} Generate a scene of the following specific location: "${specificPrompt}". This location exists within the described world. It should feel like a place characters could inhabit. IMPORTANT: Do not include any characters or people, focus only on the environment and architecture.`;
        case 'new_shot':
        default:
            // Regular new shots should reflect the prompt (e.g., 'action pose'), not be a T-pose.
            return `${stylePrompt} Create a new shot of the following subject: "${subjectDescription}". The specific shot is: "${specificPrompt}". The character should be depicted full-body unless specified otherwise in the shot description. ${singleCharConstraint}`;
    }
};

const generateMultimodalPrompt = ({ target, subjectDescription, style, world, specificPrompt, referenceAssetType, hasEditReference }: PromptGenerationParams): string => {
    const stylePrompt = `Art Style: ${style}.`;
    const worldContext = `World context: "${world}".`;
    const subjectContext = `The subject is provided in the reference image. The subject can also be described as: "${subjectDescription}".`;
    // Strong constraint to ensure only one character is generated
    const singleCharConstraint = "CRITICAL: Generate EXACTLY ONE character. Do NOT include any other characters in the image.";

    switch (target) {
        case 'edit_image':
            if (hasEditReference) {
                 return `Image 1 is the target image. Image 2 is a reference image. Perform the following edit on Image 1: "${specificPrompt}". Use Image 2 as a visual guide for the desired look, detail, or style of the edit, while maintaining Image 1's original composition and unaffected areas.`;
            }
            return `Perform the following edit on the provided reference image: "${specificPrompt}". Maintain the EXACT same art style, character design, composition, and background as the reference image. Only change the specific details mentioned in the edit instruction.`;
        case 'secondary_character':
            // Generate secondary characters with natural poses, accessories, on a solid white background.
            return `${stylePrompt} ${worldContext} ${subjectContext} Using the provided reference image for the main subject as a style and world guide, generate EXACTLY ONE NEW, unique secondary character based on the following idea: "${specificPrompt}". Ensure the new character is visually consistent with the main subject's art style and world. Depict them full-body in a natural pose with an expression and accessories that match their personality. CRITICAL: The background must be solid, 100% white. ${singleCharConstraint}`;
        case 'world_scene':
            return `${stylePrompt} ${worldContext} ${subjectContext} The reference image shows a location. Generate a new view or angle of this location, focusing on the specific area described: "${specificPrompt}". For example, if the reference is a castle and the prompt is "the throne room", generate the throne room inside that castle. Do not include any characters or people, focus only on the environment and architecture, maintaining the style of the reference image.`;
        case 'new_shot':
        default:
            if (referenceAssetType === 'world_scene') {
                return `${stylePrompt} This is a new shot of the location from the reference image. The location's original description is: "${subjectDescription}". The specific new shot is: "${specificPrompt}". Generate a new camera angle or viewpoint of this same location. It is crucial to maintain the key architectural elements, objects, and overall atmosphere from the reference image to ensure it is recognizably the same place. Do not include any characters or people.`;
            }
            // Regular new shots from a reference should reflect the prompt, not be a T-pose.
            return `${stylePrompt} Create a new shot of the subject from the reference image. The subject's original description is: "${subjectDescription}". The specific new shot is: "${specificPrompt}". Ensure the subject's appearance, clothing, and details are consistent with the reference image. ${singleCharConstraint}`;
    }
};

export interface GenerateVisualOptions {
    mainCharacterDescription: string;
    characterBodyType: CharacterBodyType;
    styleDescription: string;
    worldDescription: string;
    specificPrompt: string;
    generationTarget: GenerationTarget;
    aspectRatio: AspectRatio;
    mainCharacterImage: { base64: string; mimeType: string; src: string; } | null;
    referenceAsset: ReferenceAsset | null;
    editReferenceAsset?: ReferenceAsset | null;
}

export const generateVisual = async (options: GenerateVisualOptions): Promise<string> => {
    const {
        mainCharacterDescription,
        characterBodyType,
        styleDescription,
        worldDescription,
        specificPrompt,
        generationTarget,
        aspectRatio,
        mainCharacterImage,
        referenceAsset,
        editReferenceAsset
    } = options;

    try {
        let subjectImage: { base64: string; mimeType: string } | null = null;
        let editRefImage: { base64: string; mimeType: string } | null = null;
        let subjectDescription = '';

        if (referenceAsset) {
            const [header, base64] = referenceAsset.src.split(',');
            const mimeType = header.match(/:(.*?);/)?.[1] || 'image/jpeg';
            subjectImage = { base64, mimeType };
            subjectDescription = referenceAsset.prompt; // Use the original prompt as the description
        } else {
            subjectImage = mainCharacterImage;
            subjectDescription = mainCharacterDescription;
             // Prepend body type if specified and not default
            if (characterBodyType && characterBodyType !== 'default') {
                const firstChar = subjectDescription.charAt(0);
                const restOfString = subjectDescription.slice(1);
                // Make the original first character lowercase unless it's a lone 'A' or 'I'
                const adjustedRest = (firstChar === 'A' || firstChar === 'I') && (restOfString.startsWith(' ') || restOfString.length === 0) 
                    ? subjectDescription 
                    : firstChar.toLowerCase() + restOfString;
                subjectDescription = `${characterBodyType.charAt(0).toUpperCase() + characterBodyType.slice(1)} ${adjustedRest}`;
            }
        }
        
        if (editReferenceAsset && generationTarget === 'edit_image') {
             const [header, base64] = editReferenceAsset.src.split(',');
             const mimeType = header.match(/:(.*?);/)?.[1] || 'image/jpeg';
             editRefImage = { base64, mimeType };
        }

        if (subjectImage) {
            console.log("Generating with reference image(s) using gemini-2.5-flash-image");
            const textPrompt = generateMultimodalPrompt({
                target: generationTarget,
                subjectDescription: subjectDescription,
                style: styleDescription,
                world: worldDescription,
                specificPrompt: specificPrompt,
                referenceAssetType: referenceAsset?.generationTarget,
                hasEditReference: !!editRefImage
            });

            const parts: any[] = [
                {
                    inlineData: {
                        data: subjectImage.base64,
                        mimeType: subjectImage.mimeType,
                    },
                }
            ];
            
            if (editRefImage) {
                 parts.push({
                    inlineData: {
                        data: editRefImage.base64,
                        mimeType: editRefImage.mimeType,
                    },
                });
            }

            parts.push({ text: textPrompt });

            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash-image',
                contents: { parts: parts },
                config: {
                    responseModalities: [Modality.IMAGE],
                    imageConfig: {
                        aspectRatio: aspectRatio,
                    }
                },
            });
            
            for (const part of response.candidates[0].content.parts) {
              if (part.inlineData) {
                const base64ImageBytes: string = part.inlineData.data;
                const mimeType = part.inlineData.mimeType;
                return `data:${mimeType};base64,${base64ImageBytes}`;
              }
            }
            throw new Error("No image data found in gemini-2.5-flash-image response.");

        } else {
            console.log("Generating with text only using imagen-4.0-generate-001");
            const fullPrompt = generateTextPrompt({
                target: generationTarget,
                subjectDescription: subjectDescription,
                style: styleDescription,
                world: worldDescription,
                specificPrompt: specificPrompt
            });

            const response = await ai.models.generateImages({
                model: 'imagen-4.0-generate-001',
                prompt: fullPrompt,
                config: {
                  numberOfImages: 1,
                  outputMimeType: 'image/jpeg',
                  aspectRatio: aspectRatio,
                },
            });

            if (response.generatedImages && response.generatedImages.length > 0) {
                const base64ImageBytes: string = response.generatedImages[0].image.imageBytes;
                return `data:image/jpeg;base64,${base64ImageBytes}`;
            }
            
            throw new Error("No valid image data found in imagen-4.0-generate-001 response.");
        }
    } catch (error) {
        console.error("Error generating visual:", error);
        return 'https://via.placeholder.com/1024/ff0000/FFFFFF?text=Generation+Failed';
    }
};

interface CustomApiPayload {
    prompt: string;
    aspectRatio: string;
    subjects: { url: string; caption: string }[];
    scenes: { url: string; caption: string }[];
    styles: { url: string; caption: string }[];
    cleanup?: boolean;
}

export const generateVisualWithCustomApi = async (options: GenerateVisualOptions): Promise<string> => {
    const {
        mainCharacterDescription,
        characterBodyType,
        specificPrompt,
        aspectRatio,
        mainCharacterImage,
        referenceAsset
    } = options;

    const payload: CustomApiPayload = {
        prompt: specificPrompt,
        aspectRatio: aspectRatio,
        subjects: [],
        scenes: [],
        styles: [],
        cleanup: true,
    };

    let subjectImageSrc: string | null = null;
    let subjectDescription = '';
    let subjectIsScene = false;

    // Prioritize reference asset
    if (referenceAsset) {
        subjectImageSrc = referenceAsset.src;
        subjectDescription = referenceAsset.name || referenceAsset.prompt;
        if (referenceAsset.generationTarget === 'world_scene') {
            subjectIsScene = true;
        }
    } else if (mainCharacterImage) { // Fallback to main character
        subjectImageSrc = mainCharacterImage.src;
        subjectDescription = mainCharacterDescription;
        if (characterBodyType && characterBodyType !== 'default') {
            const firstChar = subjectDescription.charAt(0);
            const restOfString = subjectDescription.slice(1);
            const adjustedRest = (firstChar === 'A' || firstChar === 'I') && (restOfString.startsWith(' ') || restOfString.length === 0) 
                ? subjectDescription 
                : firstChar.toLowerCase() + restOfString;
            subjectDescription = `${characterBodyType.charAt(0).toUpperCase() + characterBodyType.slice(1)} ${adjustedRest}`;
        }
    }

    if (subjectImageSrc) {
        const item = { url: subjectImageSrc, caption: subjectDescription };
        if (subjectIsScene) {
            payload.scenes.push(item);
        } else {
            payload.subjects.push(item);
        }
    }

    try {
        console.log("Generating with custom API:", payload);
        const response = await fetch('https://api2.lehuyducanh.com/api/image/generate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': 'ak_c1b12201fb92b8f90593d4ce8cd54e1acee1831c5d7b7ee09a83911715b9888e'
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error("Custom API Error:", errorText);
            throw new Error(`Custom API request failed with status ${response.status}`);
        }

        const blob = await response.blob();
        
        return new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => {
                resolve(reader.result as string);
            };
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });

    } catch (error) {
        console.error("Error generating visual with custom API:", error);
        return 'https://via.placeholder.com/1024/ff0000/FFFFFF?text=Generation+Failed+(Custom)';
    }
};

export const generateCharacterSheet = async (sourceImage: { base64: string; mimeType: string }): Promise<string> => {
    const prompt = `Generate a character turnaround sheet showing three views of the character from the reference image, arranged side-by-side in a single image.
The background for the entire image must be solid, 100% white.
The character's appearance, clothing, colors, and art style must be perfectly consistent with the reference image. CRITICAL: REMOVE any objects, items, or props the character is holding in the reference image. Their hands must be empty in all views.

The three views MUST be as follows:
1.  **Front View:** The character facing forward, in a strict T-pose with arms outstretched horizontally to the sides, palms facing down. The character must be standing straight.
2.  **Side View:** The character in profile (facing left or right), in the exact same strict T-pose. Arms must remain outstretched horizontally.
3.  **Back View:** The character facing away from the camera, in the exact same strict T-pose. Arms must remain outstretched horizontally.

It is absolutely essential that the T-pose is maintained across all three views without any deviation. No hands in pockets, no bent arms, no holding objects.`;

    try {
        console.log("Generating character sheet using gemini-2.5-flash-image");
        const imagePart = {
            inlineData: {
                data: sourceImage.base64,
                mimeType: sourceImage.mimeType,
            },
        };
        const textPart = { text: prompt };

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: { parts: [imagePart, textPart] },
            config: {
                responseModalities: [Modality.IMAGE],
            },
        });
        
        for (const part of response.candidates[0].content.parts) {
          if (part.inlineData) {
            const base64ImageBytes: string = part.inlineData.data;
            const mimeType = part.inlineData.mimeType;
            return `data:${mimeType};base64,${base64ImageBytes}`;
          }
        }
        throw new Error("No image data found in gemini-2.5-flash-image response for character sheet.");
    } catch (error) {
        console.error("Error generating character sheet:", error);
        return 'https://via.placeholder.com/1024/ff0000/FFFFFF?text=Sheet+Generation+Failed';
    }
};

export const generateAssetVariation = async (
    sourceImage: { base64: string; mimeType: string },
    prompt: string
): Promise<string> => {
    const fullPrompt = `Using the reference image, generate a new image based on this instruction: "${prompt}". 
    Maintain strict consistency with the reference image's subject details, art style, and colors unless explicitly told to change them.`;

    try {
        console.log("Generating asset variation using gemini-2.5-flash-image");
        const imagePart = {
            inlineData: {
                data: sourceImage.base64,
                mimeType: sourceImage.mimeType,
            },
        };
        const textPart = { text: fullPrompt };

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: { parts: [imagePart, textPart] },
            config: {
                responseModalities: [Modality.IMAGE],
            },
        });
        
        for (const part of response.candidates[0].content.parts) {
          if (part.inlineData) {
            const base64ImageBytes: string = part.inlineData.data;
            const mimeType = part.inlineData.mimeType;
            return `data:${mimeType};base64,${base64ImageBytes}`;
          }
        }
        throw new Error("No image data found in response for asset variation.");
    } catch (error) {
        console.error("Error generating asset variation:", error);
        return 'https://via.placeholder.com/1024/ff0000/FFFFFF?text=Variation+Failed';
    }
};

export const describeImage = async (
    base64Data: string,
    mimeType: string
): Promise<string> => {
    const prompt = "Describe this image for use as a prompt for an AI image generator. Focus on the main subject, artistic style, colors, and composition. Be detailed and descriptive.";
    try {
        const imagePart = {
            inlineData: {
                data: base64Data,
                mimeType: mimeType,
            },
        };
        const textPart = { text: prompt };
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: { parts: [imagePart, textPart] },
        });
        return response.text.trim();
    } catch (error) {
        console.error("Error describing image:", error);
        return "Failed to analyze image.";
    }
};

export const generateLogline = async (premise: string): Promise<string> => {
    const prompt = `Based on the following premise, generate a compelling, one-sentence logline for a story: "${premise}"`;
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });
        return response.text.trim();
    } catch (error) {
        console.error("Error generating logline:", error);
        return "Failed to generate logline.";
    }
};

export const generateSynopsis = async (logline: string): Promise<string> => {
    const prompt = `Based on the following logline, expand it into a short, one-paragraph synopsis (3-5 sentences): "${logline}"`;
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });
        return response.text.trim();
    } catch (error) {
        console.error("Error generating synopsis:", error);
        return "Failed to generate synopsis.";
    }
};