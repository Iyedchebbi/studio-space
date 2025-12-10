
import { GoogleGenAI } from "@google/genai";
import { AIModel, GeneratedResult, ImageAnalysis, AppLanguage, AdType, SceneGenConfig, StudioScene, GeneratePromptParams, StudioConfig, AspectRatio, StudioCharacter } from "../types";

// --- CONFIGURATION ---
const ANALYSIS_MODEL = 'gemini-3-pro-preview'; 
const GENERATION_MODEL = 'gemini-3-pro-preview'; 
const IMAGE_GEN_MODEL = 'gemini-2.5-flash-image'; 

// --- CREATIVE RULES ---
const AD_TYPE_DEFINITIONS: Record<string, { visuals: string; camera: string; lighting: string }> = {
  [AdType.UGC]: {
    visuals: "Shot on iPhone 15 Pro Max. Vertical 9:16. 4K 60fps. Authentic, raw, unpolished, digital noise, 'social media' look. NOT CINEMATIC.",
    camera: "Handheld selfie mode, POV, snap zooms, slight shake, authentic framing.",
    lighting: "Natural window light, ring light, uneven shadows, real-world mix."
  },
  [AdType.Cinematic]: {
    visuals: "Shot on Arri Alexa LF. Anamorphic lens. Film grain. Teal & Orange grade. High dynamic range. Shallow depth of field.",
    camera: "Gimbal smooth, dolly push-in, parallax slide, steadycam, rack focus.",
    lighting: "Volumetric fog, rembrandt lighting, moody contrast."
  },
  [AdType.ProductShowcase]: {
    visuals: "8K Macro photography. Infinite background. Liquid simulation. Extremely sharp textures. Flawless rendering.",
    camera: "Slow orbit, probe lens macro, smooth pan, fixed focal length.",
    lighting: "Studio softbox, three-point lighting, caustic reflections, high-key."
  },
  [AdType.Lifestyle]: {
    visuals: "High-end commercial. Golden hour. Happy people. Natural saturation. Aspirational vibe.",
    camera: "Medium shots, stabilized handheld, following subject, eye level.",
    lighting: "Sunlight, lens flares, soft fill, warm tones."
  },
  [AdType.Animation3D]: {
    visuals: "Octane Render. Unreal Engine 5. Subsurface scattering. Physics simulation. Particle effects.",
    camera: "Impossible angles, fly-through, speed ramps, looping motion.",
    lighting: "Global illumination, neon emission, studio HDRI."
  },
  [AdType.Luxury]: {
    visuals: "Vogue editorial. Velvet/Gold/Marble textures. Deep blacks. Slow motion (120fps).",
    camera: "Slow pans, static symmetry, low angle, macro texture.",
    lighting: "Low key, silhouette, glinting reflections, chiaroscuro."
  },
  [AdType.Minimal]: {
    visuals: "Bauhaus design. Negative space. Pastel colors. Geometric. Flat lay.",
    camera: "Top-down bird's eye, static tripod, slow zoom out.",
    lighting: "Flat even lighting, soft shadows, ambient occlusion."
  },
  [AdType.Testimonial]: {
    visuals: "Interview setting. Head and shoulders. Blurred office background. Broadcast quality.",
    camera: "Static tripod, rule of thirds, eye contact.",
    lighting: "Key light, separation light, professional setup."
  },
  [AdType.SocialShort]: {
    visuals: "Fast paced. Split screens. Bold overlays. High saturation. Meme aesthetic.",
    camera: "Whip pans, crash zooms, chaotic energy.",
    lighting: "Bright pop, colorful LED, high contrast."
  }
};

const DIRECTOR_SYSTEM_PROMPT = `
You are a World-Class AI Creative Director and Film Strategist using Gemini 3.0 Pro intelligence.
Your goal: Create the perfect video generation prompt for models like Sora, Veo, and Runway.

# OUTPUT RULES
1. **Format**: Return ONLY valid JSON.
2. **Detail**: The 'final_full_generation_prompt' must be massive (500+ words). Describe physics, textures, lenses, and lighting in excruciating detail.
3. **Logic**:
   - If UGC: Ban cinematic terms. Demand imperfection.
   - If Cinematic: Demand high-end production value.
   - If Hybrid: Blend them intelligently (e.g., "Starts with UGC hook, transitions to Cinematic reveal").
4. **Structure**: Every video must have a timeline [00:00] -> [END].
5. **Closing**: ALWAYS end with a 2-second closing scene (Logo/Fade).
`;

// --- API HELPERS ---

const getClient = () => {
  const key = process.env.API_KEY;
  if (!key || key.trim() === '') {
    throw new Error("Missing API Key. Check your .env file or Netlify Environment Variables.");
  }
  return new GoogleGenAI({ apiKey: key });
};

const parseJSONSafe = (text: string): any => {
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch (e) {
    try {
        // Attempt to extract JSON from Markdown code blocks
        let clean = text.replace(/```json/gi, '').replace(/```/g, '').trim();
        const first = clean.indexOf('{');
        const last = clean.lastIndexOf('}');
        if (first !== -1 && last !== -1) {
             clean = clean.substring(first, last + 1);
        }
        return JSON.parse(clean);
    } catch (finalErr) {
        console.error("Failed to parse JSON response:", finalErr);
        throw new Error("AI response was not valid JSON. Please try again.");
    }
  }
};

// --- SERVICES ---

export const analyzeImage = async (base64Image: string): Promise<ImageAnalysis> => {
  try {
    const cleanBase64 = base64Image.replace(/^data:image\/(png|jpeg|webp);base64,/, '');
    const prompt = `
      Analyze this image for a high-budget video ad.
      Extract:
      1. Product Description (Physical details).
      2. Category.
      3. Brand Colors (Hex/Names).
      4. 3 Best Camera Angles for this specific item.
      5. A compatible scenic background description.
      Return JSON.
    `;
    
    const response = await getClient().models.generateContent({
      model: ANALYSIS_MODEL,
      contents: {
        parts: [
          { inlineData: { mimeType: 'image/png', data: cleanBase64 } },
          { text: prompt }
        ]
      },
      config: { responseMimeType: "application/json" }
    });

    const data = parseJSONSafe(response.text || "{}");
    return {
      productDescription: data.productDescription || "Product",
      category: data.category || "General",
      colors: Array.isArray(data.colors) ? data.colors : [],
      suggestedAngles: Array.isArray(data.suggestedAngles) ? data.suggestedAngles : [],
      suggestedScene: data.suggestedScene || "Studio setting"
    };
  } catch (error: any) {
    console.error("Analysis Error:", error);
    throw new Error(`Image Analysis Failed: ${error.message}`);
  }
};

export const generateAdPrompt = async (params: GeneratePromptParams): Promise<GeneratedResult> => {
  try {
    const adStyle = params.adTypes.map(t => AD_TYPE_DEFINITIONS[t] || { visuals: "", camera: "", lighting: "" }).reduce((acc, curr) => ({
       visuals: acc.visuals + " " + curr.visuals,
       camera: acc.camera + " " + curr.camera,
       lighting: acc.lighting + " " + curr.lighting
    }), { visuals: "", camera: "", lighting: "" });

    const prompt = `
      ${DIRECTOR_SYSTEM_PROMPT}

      # PROJECT BRIEF
      - **Language**: ${params.language === 'ar' ? 'Arabic (Return rationale in Arabic, Prompt in English)' : 'English'}
      - **Input**: ${params.imageAnalysis?.productDescription}
      - **Target Model**: ${params.model}
      - **Aspect Ratio**: ${params.aspectRatio}
      - **Duration**: ${params.videoDuration}s
      - **Ad Types**: ${params.adTypes.join(', ')}
      - **Hybrid Mode**: ${params.isHybridMode}
      - **Visual Style**: ${params.style || 'None'}
      - **Brand Context**: ${params.context.brandMessage}
      - **Voiceover**: ${params.context.voiceover}
      - **Technical Specs**: Camera [${params.camera.join(', ')}], Lighting [${params.lighting}].
      - **Creative DNA**: 
        - Visuals: ${adStyle.visuals}
        - Camera Movement: ${adStyle.camera}
        - Lighting Mood: ${adStyle.lighting}
      
      # OUTPUT JSON STRUCTURE
      {
        "finalPrompt": "THE_FULL_DETAILED_PROMPT_HERE",
        "richData": {
          "strategy": "Why this works...",
          "visual_hooks": ["Hook 1", "Hook 2"],
          "audio_direction": "Sound design notes..."
        },
        "idea": "Short summary of the concept"
      }
    `;

    const response = await getClient().models.generateContent({
      model: GENERATION_MODEL,
      contents: { parts: [{ text: prompt }] },
      config: { responseMimeType: "application/json" }
    });

    const data = parseJSONSafe(response.text || "{}");
    if (!data.finalPrompt) throw new Error("AI did not return a valid prompt.");

    return {
      finalPrompt: data.finalPrompt,
      richData: data.richData,
      idea: data.idea
    };
  } catch (error: any) {
    console.error("Generation Error:", error);
    throw new Error(`Prompt Generation Failed: ${error.message}`);
  }
};

export const enhanceStoryConcept = async (concept: string): Promise<string> => {
  try {
    const response = await getClient().models.generateContent({
      model: GENERATION_MODEL,
      contents: { text: `Act as a Hollywood Screenwriter. Take this raw film concept and enhance it to be more cinematic, intriguing, and visually descriptive, but keep it concise (under 100 words). \n\nRAW CONCEPT: "${concept}"\n\nENHANCED CONCEPT:` }
    });
    return response.text?.trim() || concept;
  } catch (error: any) {
     throw new Error(`Enhancement Failed: ${error.message}`);
  }
};

export const generateStoryboard = async (
  idea: string, 
  config: StudioConfig, 
  model: string,
  language: AppLanguage
): Promise<{
  fullScript: string;
  backgroundMusicPrompt: string;
  characters: StudioCharacter[];
  scenes: StudioScene[];
}> => {
  try {
    const prompt = `
      You are a Lead Narrative Designer and Cinematographer.
      
      # INPUT
      - Idea: "${idea}"
      - Style: ${config.style}
      - Scene Count: ${config.sceneCount}
      - Scene Duration: ${config.sceneDuration}s
      - Language: ${language}

      # TASK
      1. **Characters**: Create consistent characters with names and detailed visual descriptions (hair, clothes, face).
      2. **Script**: Write a full Voiceover Script for the entire video (Narrator or Dialogue).
      3. **Audio**: Describe the perfect background music (BGM) to match the mood.
      4. **Scenes**: Break the script into exactly ${config.sceneCount} visual scenes.
      
      # SCENE RULES
      - **Visual Prompt**: For Image Generation. MUST include the physical description of the character (e.g., "John, a rugged man with a scar...") to ensure consistency. describe the setting and action.
      - **Video Prompt**: For Video Generation. Must include camera movement, lighting, and "High fidelity lip sync" instructions if there is dialogue.

      # OUTPUT JSON FORMAT
      {
        "characters": [
          { "id": 1, "name": "Name", "description": "Personality...", "visualPrompt": "Physical appearance details...", "aspectRatio": "16:9" }
        ],
        "fullScript": "The complete voiceover text...",
        "backgroundMusicPrompt": "Detailed audio prompt for the music...",
        "scenes": [
          {
            "id": 1,
            "title": "Scene Title",
            "visualPrompt": "Image gen prompt (including character visual details)...",
            "videoPrompt": "Video gen prompt (Motion + Camera + 'Lip sync: [Dialogue]')...",
            "aspectRatio": "16:9"
          }
        ]
      }
    `;

    const response = await getClient().models.generateContent({
      model: GENERATION_MODEL,
      contents: { parts: [{ text: prompt }] },
      config: { responseMimeType: "application/json" }
    });

    const data = parseJSONSafe(response.text || "{}");
    
    if (!data.scenes || !Array.isArray(data.scenes)) {
        throw new Error("AI failed to generate valid scenes.");
    }

    // Map and hydrate with default state
    const characters: StudioCharacter[] = (data.characters || []).map((c: any) => ({
        ...c,
        isGeneratingImage: false,
        imageUrl: null,
        aspectRatio: AspectRatio.Landscape
    }));

    const scenes: StudioScene[] = data.scenes.map((s: any) => ({
        ...s,
        isGeneratingImage: false,
        imageUrl: null,
        aspectRatio: AspectRatio.Landscape,
        script: "", // Legacy field
        voiceover: "" // Legacy field
    }));

    return {
        fullScript: data.fullScript || "",
        backgroundMusicPrompt: data.backgroundMusicPrompt || "",
        characters,
        scenes
    };
  } catch (error: any) {
    console.error("Storyboard Error:", error);
    throw new Error(`Storyboard Generation Failed: ${error.message}`);
  }
};

export const generateImage = async (prompt: string, style: string, ratio: AspectRatio): Promise<string> => {
  try {
    const finalPrompt = `
      Create a high-quality, photorealistic image.
      Style: ${style}.
      Subject: ${prompt}.
      Aspect Ratio: ${ratio}.
      REQUIREMENTS: No text overlay, no watermarks, cinematic lighting, 8k resolution.
    `;

    const response = await getClient().models.generateContent({
      model: IMAGE_GEN_MODEL,
      contents: { parts: [{ text: finalPrompt }] }
    });

    // Handle text refusal gracefully
    const textPart = response.candidates?.[0]?.content?.parts?.find(p => p.text);
    if (textPart && textPart.text && !response.candidates?.[0]?.content?.parts?.find(p => p.inlineData)) {
         if (textPart.text.toLowerCase().includes("cannot") || textPart.text.toLowerCase().includes("unable")) {
             throw new Error("AI Refusal: " + textPart.text);
         }
    }

    const imagePart = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
    
    if (!imagePart || !imagePart.inlineData || !imagePart.inlineData.data) {
       throw new Error("Model did not return an image. It might have been blocked by safety filters.");
    }

    return `data:${imagePart.inlineData.mimeType};base64,${imagePart.inlineData.data}`;
  } catch (error: any) {
    console.error("Image Gen Error:", error);
    throw new Error(error.message || "Image generation failed.");
  }
};
