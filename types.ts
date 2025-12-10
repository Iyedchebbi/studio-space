

export enum AIModel {
  Sora2 = 'OpenAI Sora 2',
  Veo3 = 'Google Veo 3.1',
  Midjourney = 'Midjourney V6',
  Runway = 'Runway Gen-3',
  Luma = 'Luma Dream Machine',
  StableVideo = 'Stable Video Diffusion',
  Flux = 'Flux.1',
  Dalle3 = 'DALL-E 3'
}

export enum AspectRatio {
  Vertical = '9:16',
  Landscape = '16:9',
  Square = '1:1',
  Portrait = '4:5',
  Ultrawide = '21:9',
  Custom = 'Custom'
}

export enum AdType {
  UGC = 'UGC Style',
  Cinematic = 'Cinematic Ad',
  ProductShowcase = 'Product Showcase',
  Lifestyle = 'Lifestyle',
  Animation3D = '3D Animation',
  Luxury = 'Luxury',
  Minimal = 'Minimalist',
  Testimonial = 'Testimonial',
  SocialShort = 'Social Media Short'
}

export enum CreativeStyle {
  Modern = 'Modern',
  Futuristic = 'Futuristic',
  Vintage = 'Vintage',
  Realistic = 'Photorealistic',
  Anime = 'Anime',
  NeonCyberpunk = 'Neon Cyberpunk',
  HighFashion = 'High Fashion',
  Playful = 'Playful & Colorful'
}

export type AppLanguage = 'en' | 'ar';
export type OutputFormat = 'normal' | 'json' | 'python';
export type AppMode = 'ad-creator' | 'studio'; // New Mode Switcher

export interface ImageAnalysis {
  productDescription: string;
  colors: string[];
  suggestedAngles: string[];
  category: string;
  suggestedScene?: string;
}

export interface StudioConfig {
  style: string;
  sceneCount: number;
  sceneDuration: number;
  characterDescription: string;
}

export interface StudioCharacter {
  id: number;
  name: string;
  description: string;
  visualPrompt: string;
  imageUrl?: string | null;
  isGeneratingImage: boolean;
  aspectRatio: AspectRatio;
}

export interface StudioScene {
  id: number;
  title: string;
  description: string;
  visualPrompt: string; // For Image Generation
  videoPrompt: string;  // For Video Model (Motion/Physics)
  script: string;       // Dialogue or Voiceover lines
  voiceover: string;    // Kept for backward compat, merged into script
  imageUrl?: string | null;
  isGeneratingImage: boolean;
  duration?: number;
  aspectRatio: AspectRatio; // Per-scene ratio
}

export interface GeneratedResult {
  finalPrompt?: string; // The single, perfect, detailed prompt (Optional for Studio results)
  fullScript?: string; // The compiled voiceover/dialogue script
  richData?: any; // The full JSON structured output (hooks, scenes, strategy)
  
  // Studio Mode specific fields
  idea?: string;
  scenes?: StudioScene[];
  characters?: StudioCharacter[];
  backgroundMusicPrompt?: string;
  config?: StudioConfig;
}

export interface HistoryItem {
  id: string;
  timestamp: number;
  model: AIModel;
  adType: AdType[];
  result: GeneratedResult;
  imageThumbnail?: string | null;
}

export interface SceneGenConfig {
  analysis: ImageAnalysis | null;
  adTypes: string[];
  style: string | null;
  lighting: string;
  camera: string[];
  sliders: { creativity: number; realism: number; technical: number };
  context?: { brandMessage: string };
}

export interface GeneratePromptParams {
  imageAnalysis: ImageAnalysis | null;
  base64Image: string | null;
  adTypes: AdType[];
  isHybridMode: boolean;
  style: string | null;
  model: AIModel;
  aspectRatio: AspectRatio;
  videoDuration: number;
  sliders: {
    creativity: number;
    realism: number;
    technical: number;
  };
  camera: string[];
  lighting: string;
  context: {
    voiceover: string;
    brandMessage: string;
  };
  language: AppLanguage;
}

export interface AppState {
  language: AppLanguage;
  outputFormat: OutputFormat;
  activeMode: AppMode; // Switch between Ad Creator and Studio
  
  // Navigation State
  activeView: 'create' | 'history' | 'templates';
  showHistoryPanel: boolean;
  history: HistoryItem[];

  // Ad Creator State
  image: string | null; // Base64
  generatedSceneImage: string | null; // Base64 of the AI generated preview
  isAnalyzing: boolean;
  isGeneratingScene: boolean;
  
  // Studio Prompt State
  studioConfig: StudioConfig;
  studioInput: string;
  storyScript: string; // New: Holds the global narrator script
  backgroundMusic: string; // New: Holds the background music prompt
  studioCharacters: StudioCharacter[]; // New: Characters list
  studioScenes: StudioScene[];
  isGeneratingStory: boolean;
  isEnhancing: boolean; // New: For the enhance button
  studioResult: GeneratedResult | null;
  
  // Image Editing State
  isEditingImage: boolean;
  editPrompt: string;

  analysis: ImageAnalysis | null;
  selectedAdType: AdType[];
  isHybridMode: boolean; // New Flag
  selectedStyle: CreativeStyle | null;
  selectedModel: AIModel;
  aspectRatio: AspectRatio;
  customAspectRatio: string;
  videoDuration: number; // Duration in seconds
  sliders: {
    creativity: number;
    realism: number;
    technical: number;
  };
  additionalContext: {
    voiceover: string;
    brandMessage: string;
  };
  cameraMovement: string[];
  lighting: string;
  isGenerating: boolean;
  result: GeneratedResult | null;
}