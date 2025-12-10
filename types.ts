

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
export type AppMode = 'ad-creator' | 'studio';

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
  visualPrompt: string;
  videoPrompt: string;
  script: string;
  voiceover: string;
  imageUrl?: string | null;
  isGeneratingImage: boolean;
  duration?: number;
  aspectRatio: AspectRatio;
}

export interface GeneratedResult {
  finalPrompt?: string;
  fullScript?: string;
  richData?: {
    strategy?: string;
    visual_hooks?: string[];
    audio_direction?: string;
    color_grade?: string;
    [key: string]: any;
  };
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
  styles: CreativeStyle[];
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
  activeMode: AppMode;
  
  // Navigation State
  activeView: 'create' | 'history' | 'templates';
  showHistoryPanel: boolean;
  history: HistoryItem[];

  // Error State
  error: string | null; // NEW: To display errors in UI

  // Ad Creator State
  image: string | null;
  generatedSceneImage: string | null;
  isAnalyzing: boolean;
  isGeneratingScene: boolean;
  
  // Studio Prompt State
  studioConfig: StudioConfig;
  studioInput: string;
  storyScript: string;
  backgroundMusic: string;
  studioCharacters: StudioCharacter[];
  studioScenes: StudioScene[];
  isGeneratingStory: boolean;
  isEnhancing: boolean;
  studioResult: GeneratedResult | null;
  
  // Image Editing State
  isEditingImage: boolean;
  editPrompt: string;

  analysis: ImageAnalysis | null;
  selectedAdType: AdType[];
  isHybridMode: boolean;
  selectedStyles: CreativeStyle[]; // Changed from selectedStyle: CreativeStyle | null
  selectedModel: AIModel;
  aspectRatio: AspectRatio;
  customAspectRatio: string;
  videoDuration: number;
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
