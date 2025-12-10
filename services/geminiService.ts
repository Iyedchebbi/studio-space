
import { GoogleGenAI, Type } from "@google/genai";
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

const getClient = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

const parseJSONSafe = (text: string): any => {
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch (e) {
    // Attempt to extract JSON object if direct parse fails (e.g. markdown blocks or trailing text)
    try {
        // Remove markdown tags
        let clean = text.replace(/```json/gi, '').replace(/```/g, '').trim();
        // Extract substring from first { to last }
        const first = clean.indexOf('{');
        const last = clean.lastIndexOf('}');
        if (first !== -1 && last !== -1) {
             clean = clean.substring(first, last + 1);
        }
        return JSON.parse(clean);
    } catch (finalErr) {
        console.error("Failed to parse JSON response:", finalErr);
        console.error("Original text:", text);
        return {};
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
    const result = (typeof data === 'object') ? data : {};

    return {
      productDescription: result.productDescription || "Product",
      category: result.category || "General",
      colors: Array.isArray(result.colors) ? result.colors : [],
      suggestedAngles: Array.isArray(result.suggestedAngles) ? result.suggestedAngles : [],
      suggestedScene: result.suggestedScene || "Studio setting"
    };
  } catch (error) {
    console.error("Analysis Error:", error);
    // Return safe default
    return { productDescription: "Product", category: "General", colors: [], suggestedAngles: [], suggestedScene: "" };
  }
};

export const generateAdPrompt = async (params: GeneratePromptParams): Promise<GeneratedResult> => {
  try {
    const parts: any[] = [];
    if (params.base64Image) {
      const cleanBase64 = params.base64Image.replace(/^data:image\/(png|jpeg|webp);base64,/, '');
      parts.push({ inlineData: { mimeType: 'image/png', data: cleanBase64 } });
    }

    const typeDef = AD_TYPE_DEFINITIONS[params.adTypes[0]] || AD_TYPE_DEFINITIONS[AdType.ProductShowcase];
    
    const colors = Array.isArray(params.imageAnalysis?.colors) ? params.imageAnalysis!.colors.join(', ') : '';
    const camera = Array.isArray(params.camera) ? params.camera.join(', ') : '';
    
    const userPrompt = `
      PROJECT: Video Ad Generation
      MODEL TARGET: ${params.model}
      
      INPUT DATA:
      - Product: ${params.imageAnalysis?.productDescription || 'Generic Product'}
      - Colors: ${colors}
      - Brand Message: "${params.context.brandMessage}"
      
      CONFIGURATION:
      - Style: ${params.adTypes[0]} (${params.isHybridMode ? 'HYBRID MODE ACTIVE' : 'Single Mode'})
      - Mood: ${params.style}
      - Lighting: ${params.lighting}
      - Camera: ${camera}
      - Duration: ${params.videoDuration}s
      - Sliders: Creativity ${params.sliders.creativity}%, Realism ${params.sliders.realism}%
      
      VISUAL MANDATES:
      ${typeDef.visuals}
      
      TASK:
      Generate a comprehensive JSON response including:
      1. 'final_full_generation_prompt': The master prompt for the video AI.
      2. 'strategy': Short explanation of the creative direction.
      3. 'hooks': 3 viral hooks.
    `;

    parts.push({ text: userPrompt });

    const response = await getClient().models.generateContent({
      model: GENERATION_MODEL,
      contents: { parts },
      config: {
        systemInstruction: DIRECTOR_SYSTEM_PROMPT,
        responseMimeType: "application/json"
      }
    });

    const json = parseJSONSafe(response.text || "{}");

    return {
      finalPrompt: json.final_full_generation_prompt || json.prompt || "Error generating prompt",
      richData: json
    };

  } catch (error) {
    console.error("Prompt Generation Error:", error);
    throw error;
  }
};

export const generateReferenceImage = async (base64Source: string, config: SceneGenConfig): Promise<string> => {
  try {
    const primaryType = (config.adTypes && config.adTypes.length > 0) ? config.adTypes[0] : AdType.ProductShowcase;
    const typeDef = AD_TYPE_DEFINITIONS[primaryType] || AD_TYPE_DEFINITIONS[AdType.ProductShowcase];
    
    const desc = config.analysis?.productDescription || 'A premium product';
    const scene = config.analysis?.suggestedScene || 'Professional studio';
    const lighting = config.lighting || 'Cinematic';
    const style = config.style || 'Modern';
    const colors = Array.isArray(config.analysis?.colors) ? config.analysis!.colors.join(', ') : 'Neutral';
    const cam = Array.isArray(config.camera) ? config.camera.join(', ') : 'Standard';

    const textPrompt = `A high-resolution photorealistic commercial image of ${desc}. 
    Context: ${scene}. 
    Lighting: ${lighting}. 
    Colors: ${colors}. 
    Style: ${style} - ${typeDef.visuals}. 
    Camera: ${cam}. 
    8k resolution, highly detailed, advertising photography.`;

    const response = await getClient().models.generateContent({
      model: IMAGE_GEN_MODEL,
      contents: { parts: [{ text: textPrompt }] },
      config: { imageConfig: { aspectRatio: "16:9" } }
    });

    for (const candidate of response.candidates || []) {
      for (const part of candidate.content?.parts || []) {
        if (part.inlineData) {
          return `data:image/png;base64,${part.inlineData.data}`;
        }
      }
    }
    
    const textPart = response.candidates?.[0]?.content?.parts?.[0]?.text;
    if (textPart) throw new Error(`AI Refusal: ${textPart}`);
    
    throw new Error("No image data returned from AI.");
  } catch (error) {
    console.error("Scene Gen Error:", error);
    throw error;
  }
};

// NEW: Enhance the user's rough idea
export const enhanceStoryConcept = async (concept: string): Promise<string> => {
    try {
        const prompt = `
            Act as an Expert Film Director and Script Doctor.
            Refine and Enhance the following raw film idea. 
            Make it more cinematic, detailed, and visually evocative.
            Keep it concise (3-4 sentences max).
            Do not add conversational filler. Just return the improved concept text.
            
            Raw Idea: "${concept}"
        `;
        const response = await getClient().models.generateContent({
            model: GENERATION_MODEL,
            contents: { parts: [{ text: prompt }] },
        });
        return response.text || concept;
    } catch (e) {
        console.error("Enhance Error", e);
        return concept;
    }
};

export const generateStoryboard = async (idea: string, config: StudioConfig, model: string, language: AppLanguage): Promise<{fullScript: string, backgroundMusicPrompt: string, characters: StudioCharacter[], scenes: StudioScene[]}> => {
  try {
    const prompt = `
      Act as a Lead Storyboard Artist, Sound Designer, and Video Production Expert.
      Idea: "${idea}"
      Style: ${config.style}
      Language: ${language}
      
      STEP 1: Create a Cast of Characters (1-3 max). Define them with vivid visual details (clothing, face, accessories) so an image generator can reproduce them consistently.
      STEP 2: Write a complete, compelling Voiceover/Narrator Script for the ENTIRE video.
      STEP 3: Write a specific AI Music Generator prompt for the Background Music. It should describe the mood, instruments, tempo, and genre that fits this story perfectly.
      STEP 4: Break down the visual story into exactly ${config.sceneCount} scenes.
      
      CRITICAL RULES FOR "videoPrompt" in SCENES:
      1. It MUST describe the camera movement and action.
      2. It MUST include the phrase "Consistent voice".
      3. It MUST include the phrase "Very high lips sync" if there is dialogue.
      4. IF the scene involves a character speaking, you MUST append their specific dialogue line to the video prompt using the format: "Character saying: '...line...'".

      IMPORTANT: When writing the 'visualPrompt' for each scene, if a defined character appears, YOU MUST include their full physical description again (e.g. 'The man with the red scarf and cyber goggles...') to ensure the image generator maintains consistency. Do not just use their name.

      Output JSON structure:
      {
        "characters": [
          { "name": "Name", "description": "Personality/Role", "visualPrompt": "Portrait prompt focusing on face/outfit..." }
        ],
        "fullScript": "The complete narration text for the whole video...",
        "backgroundMusicPrompt": "Detailed prompt for AI music generator (Suno/Udio style)...",
        "scenes": [
            {
                "title": "Scene 1: [Name]",
                "visualPrompt": "STATIC IMAGE PROMPT. Highly detailed. Includes character visual details if present.",
                "videoPrompt": "VIDEO GENERATION PROMPT. Includes action + 'Consistent voice' + 'Very high lips sync' + 'Character saying: ...'",
                "script": "The specific segment of the voiceover/dialogue for this scene."
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
    
    // Defensive extraction
    const rawScenes = data.scenes || data.storyboard || [];
    const rawChars = data.characters || [];
    const fullScript = data.fullScript || data.script || "No script generated.";
    const backgroundMusicPrompt = data.backgroundMusicPrompt || "Cinematic ambient background music.";

    if (!Array.isArray(rawScenes) || rawScenes.length === 0) {
        throw new Error("Failed to parse valid storyboard scenes from AI response.");
    }

    const characters = rawChars.map((c: any, i: number) => ({
      id: i + 1,
      name: c.name || `Character ${i + 1}`,
      description: c.description || "",
      visualPrompt: c.visualPrompt || "",
      isGeneratingImage: false,
      aspectRatio: AspectRatio.Portrait // Characters usually portrait
    }));

    const scenes = rawScenes.map((s: any, i: number) => ({
      id: i + 1,
      title: s.title || `Scene ${i + 1}`,
      description: s.description || s.visualPrompt || "",
      visualPrompt: s.visualPrompt || "",
      videoPrompt: s.videoPrompt || s.visualPrompt || "",
      script: s.script || s.voiceover || "",
      voiceover: s.script || s.voiceover || "",
      isGeneratingImage: false,
      duration: config.sceneDuration,
      aspectRatio: AspectRatio.Landscape
    }));

    return { fullScript, backgroundMusicPrompt, characters, scenes };

  } catch (error) {
    console.error("Storyboard Error:", error);
    throw error;
  }
};

export const generateImage = async (visualPrompt: string, style: string, aspectRatio: AspectRatio): Promise<string> => {
  try {
    let ratioStr = "16:9";
    switch (aspectRatio) {
      case AspectRatio.Vertical: ratioStr = "9:16"; break;
      case AspectRatio.Square: ratioStr = "1:1"; break;
      case AspectRatio.Portrait: ratioStr = "3:4"; break;
      case AspectRatio.Landscape: ratioStr = "16:9"; break;
      default: ratioStr = "16:9";
    }

    // Explicit instruction to generate image only, reducing conversational refusal/preamble
    const finalPrompt = `
      Generate a photorealistic image based on this description. 
      Do not generate text. Do not offer a preamble.
      
      Visual Description: ${visualPrompt}
      Style: ${style}
      Quality: 8k, cinematic lighting, highly detailed.
    `;
    
    const response = await getClient().models.generateContent({
      model: IMAGE_GEN_MODEL,
      contents: { parts: [{ text: finalPrompt }] },
      config: { imageConfig: { aspectRatio: ratioStr as any } }
    });

    for (const candidate of response.candidates || []) {
      for (const part of candidate.content?.parts || []) {
        if (part.inlineData) return `data:image/png;base64,${part.inlineData.data}`;
      }
    }

    // If no image, check for refusal text
    const textPart = response.candidates?.[0]?.content?.parts?.[0]?.text;
    if (textPart) {
         // If the model gets chatty ("Absolutely, here is..."), we treat it as a failure but log it clearly
         throw new Error(`AI returned text instead of image: "${textPart.substring(0, 50)}..."`);
    }
    
    throw new Error("No image generated by AI model (empty response).");
  } catch (error) {
    console.error("Image Gen Error:", error);
    throw error;
  }
};

export const generateCreativeContext = async (
  analysis: ImageAnalysis | null, 
  adTypes: string[], 
  style: string,
  language: AppLanguage
): Promise<{ brandMessage: string; voiceover: string }> => {
  try {
      const prompt = `
        You are a Top Copywriter.
        Product: "${analysis?.productDescription || 'General Product'}"
        Style: ${adTypes[0]} / ${style}
        Language: ${language}
        
        Generate:
        1. A catchy, stunning brand slogan (max 7 words).
        2. A short mood description for voiceover.
        
        Return JSON: { "brandMessage": "...", "voiceover": "..." }
      `;

      const response = await getClient().models.generateContent({
        model: GENERATION_MODEL,
        contents: { parts: [{ text: prompt }] },
        config: { responseMimeType: "application/json" }
      });

      const json = parseJSONSafe(response.text || "{}");

      return json;
  } catch (error) {
      console.error("Context Gen Error", error);
      return { brandMessage: "", voiceover: "" };
  }
};
