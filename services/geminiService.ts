
import { GoogleGenAI } from "@google/genai";
import { AIModel, GeneratedResult, ImageAnalysis, AppLanguage, AdType, SceneGenConfig, StudioScene, GeneratePromptParams, StudioConfig, AspectRatio, StudioCharacter, CreativeStyle } from "../types";

// --- CONFIGURATION ---
const ANALYSIS_MODEL = 'gemini-3-pro-preview'; 
const GENERATION_MODEL = 'gemini-3-pro-preview'; 
const IMAGE_GEN_MODEL = 'gemini-2.5-flash-image'; 

// --- ADVANCED CREATIVE RULES ---
const AD_TYPE_DEFINITIONS: Record<string, string> = {
  [AdType.UGC]: "Aesthetic: Raw, authentic, TikTok-style. Camera: Handheld iPhone 15 Pro, slight shake, vertical framing. Lighting: Ring light or natural window light, unpolished. Vibe: Relatable, high-energy, 'user-generated' feel.",
  [AdType.Cinematic]: "Aesthetic: Hollywood blockbuster. Camera: Arri Alexa LF, Panavision Anamorphic lenses (blue flares). Lighting: Rembrandt lighting, volumetric fog, deep shadows, teal & orange color grade. Vibe: Emotional, epic, high-budget.",
  [AdType.ProductShowcase]: "Aesthetic: High-end commercial macro. Camera: Probe lens, slow smooth motion control (Bolt robot). Lighting: Studio softbox, rim lighting, caustic reflections on glass/metal. Vibe: Luxurious, clean, perfectionist.",
  [AdType.Lifestyle]: "Aesthetic: Aspirational commercial. Camera: Steadicam, medium focal length (50mm), tracking shots. Lighting: Golden hour sun, lens flares, warm, soft fill. Vibe: Happy, energetic, sun-kissed.",
  [AdType.Animation3D]: "Aesthetic: Pixar/Unreal Engine 5. Physics: Soft-body dynamics, particle simulations. Lighting: Octane Render, Global Illumination, subsurface scattering. Vibe: Playful, magical, impossible physics.",
  [AdType.Luxury]: "Aesthetic: Vogue/High Fashion. Camera: Slow motion (120fps), static or very slow push-in. Texture: Velvet, gold, marble, silk. Lighting: Chiaroscuro, silhouette, high contrast. Vibe: Mysterious, expensive, exclusive.",
  [AdType.Minimal]: "Aesthetic: Bauhaus/Apple style. Composition: Negative space, geometric alignment, flat lay. Colors: Pastel or monochrome. Lighting: Soft, shadowless, ambient occlusion. Vibe: Clean, organized, satisfying.",
  [AdType.Testimonial]: "Aesthetic: Documentary interview. Camera: Shallow depth of field (f/1.8), focus on eyes. Background: Softly blurred office or home. Lighting: Key light, separation light (hair light). Vibe: Trustworthy, professional.",
  [AdType.SocialShort]: "Aesthetic: Fast-paced Instagram Reel. Editing: Whip pans, crash zooms, speed ramps. Colors: High saturation, pop art. Vibe: Viral, loud, attention-grabbing."
};

const MODEL_SPECIFIC_RULES: Record<AIModel, string> = {
  [AIModel.Sora2]: "Focus deeply on physics simulation, fluid dynamics, and complex object permanence. Use keywords like 'physically accurate', 'temporal consistency', 'simulated reality'.",
  [AIModel.Veo3]: "Focus on cinematic fidelity, HDR lighting, and 4K resolution. Use film terminology like 'anamorphic', 'chromatic aberration', 'ISO 800', 'shutter angle'.",
  [AIModel.Runway]: "Focus on specific camera movements and control. Use keywords like 'camera zoom in', 'truck left', 'rack focus', 'motion brush'.",
  [AIModel.Midjourney]: "Focus on artistic style, composition, and texture. Use parameters like '--style raw', '--stylize 1000'.",
  [AIModel.Luma]: "Focus on high-speed motion and morphing effects. Keywords: 'dynamic transition', 'smooth interpolation'.",
  [AIModel.StableVideo]: "Focus on frame stability and noise reduction.",
  [AIModel.Flux]: "Focus on surrealism and prompt adherence.",
  [AIModel.Dalle3]: "Focus on literal prompt interpretation and distinct subjects."
};

const DIRECTOR_SYSTEM_PROMPT = `
You are the world's most advanced AI Visual Director and Prompt Engineer, powered by Gemini 3.0 Pro.
Your task is to synthesize the ultimate video generation prompt for a specific AI model.

# CRITICAL INSTRUCTIONS
1. **Analyze**: Deeply understand the product, the chosen styles, and the target audience.
2. **Synthesize**: Merge the selected 'Ad Types' and 'Creative Styles' into a cohesive visual language. Do not just list them; blend them (e.g., "A cyberpunk lighting scheme applied to a luxury perfume bottle").
3. **Model Optimization**: strictly adhere to the specific keywords and best practices for the chosen Target Model.
4. **Detail Level**: The output prompt must be 'Stunning'. Describe textures (brushed metal, condensation), lighting (subsurface scattering, god rays), and camera movement (parallax, dolly zoom) in microscopic detail.
5. **JSON Output**: Return ONLY valid JSON.

# SLIDER INTERPRETATION
- **Creativity**: High = Surreal, dreamlike, impossible physics, abstract transitions. Low = Literal, grounded, realistic.
- **Realism**: High = 8K, uncompressed, raw photo-style. Low = Stylized, painterly, digital art.
- **Technical**: High = Use specific lens metrics (f/1.4, 85mm), ISO, shutter speed. Low = General visual descriptors.
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
      1. Product Description (Physical details, material, texture).
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
    // 1. Construct Style Profile
    const adTypeDesc = params.adTypes.map(t => AD_TYPE_DEFINITIONS[t]).join(" ");
    const modelRules = MODEL_SPECIFIC_RULES[params.model] || "General video generation rules.";
    const stylesDesc = params.styles.join(" + ");
    
    // 2. Interpret Sliders
    const creativityInstruction = params.sliders.creativity > 70 
      ? "Push boundaries. Use surreal transitions, defying gravity, magical realism elements." 
      : "Keep it grounded. Strictly adhere to real-world physics and logic.";
    
    const realismInstruction = params.sliders.realism > 70
      ? "Target 'Photorealism'. Use keywords: 8k, raw footage, uncompressed, optical perfection."
      : "Allow for stylized, artistic, or animated interpretations.";

    const technicalInstruction = params.sliders.technical > 70
      ? "Include deep technical camera specs: Focal length (e.g. 35mm), Aperture (e.g. f/1.8), Shutter angle, ISO, Lighting ratios."
      : "Focus on the visual vibe and mood rather than camera numbers.";

    // 3. Construct the Mega-Prompt
    const prompt = `
      ${DIRECTOR_SYSTEM_PROMPT}

      # PROJECT INPUTS
      - **Target Model**: ${params.model} (Rules: ${modelRules})
      - **Product Analysis**: ${params.imageAnalysis?.productDescription}
      - **Context/Brand**: "${params.context.brandMessage}"
      - **Voiceover Idea**: "${params.context.voiceover}"
      - **Language**: ${params.language === 'ar' ? 'Arabic rationale, English Prompt' : 'English'}
      
      # CREATIVE CONFIGURATION
      - **Ad Types (Fusion)**: ${params.adTypes.join(', ')} -> ${adTypeDesc}
      - **Visual Styles**: ${stylesDesc} (Hybrid Mode: ${params.isHybridMode})
      - **Aspect Ratio**: ${params.aspectRatio}
      - **Duration**: ${params.videoDuration}s
      
      # DIRECTOR SETTINGS (SLIDERS)
      1. Creativity (${params.sliders.creativity}%): ${creativityInstruction}
      2. Realism (${params.sliders.realism}%): ${realismInstruction}
      3. Technical Depth (${params.sliders.technical}%): ${technicalInstruction}
      4. Lighting Setup: ${params.lighting}
      5. Camera Movement: ${params.camera.join(', ')}

      # TASK
      Generate a comprehensive JSON response containing the Master Prompt and Strategy.
      
      # OUTPUT JSON STRUCTURE
      {
        "finalPrompt": "THE_FULL_MASTER_PROMPT (Include subject, action, environment, lighting, camera, technical specs, --parameters)",
        "richData": {
          "strategy": "A brief explanation of why this creative direction fits the product.",
          "visual_hooks": ["Hook 1 (0-3s)", "Hook 2 (Mid-video)", "Hook 3 (Ending)"],
          "audio_direction": "Detailed sound design (SFX) and music mood description.",
          "color_grade": "Description of the color palette and grading style."
        },
        "idea": "A catchy title for this campaign concept"
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
      contents: { text: `Act as a Hollywood Screenwriter using Gemini 3.0 Pro. Take this raw film concept and enhance it to be more cinematic, intriguing, and visually descriptive, but keep it concise (under 100 words). \n\nRAW CONCEPT: "${concept}"\n\nENHANCED CONCEPT:` }
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
      You are a Lead Narrative Designer and Cinematographer powered by Gemini 3.0 Pro.
      
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
