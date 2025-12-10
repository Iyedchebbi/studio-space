
import { AdType, AIModel, AspectRatio, CreativeStyle, AppLanguage } from './types';
import { Video, Camera, Zap, Star, MonitorPlay, Box, Film, User, Layers, Aperture, Sun, Moon, Move, Palette } from 'lucide-react';

export const MODELS = Object.values(AIModel);
export const ASPECT_RATIOS = Object.values(AspectRatio);
export const AD_TYPES = Object.values(AdType);
export const STYLES = Object.values(CreativeStyle);
export const VIDEO_DURATIONS = [5, 8, 10, 12, 15, 20, 30, 60];

export const STUDIO_STYLES = [
  'Hollywood Cinematic',
  'Disney Animation',
  'Pixar 3D Style',
  'Anime Studio Ghibli',
  'Dark Noir Film',
  'Cyberpunk 2077',
  'Vintage 1950s',
  'Claymation',
  'Hyper-Realistic',
  'Watercolor Painting'
];

export const CAMERA_MOVEMENTS = [
  'Cinematic Push-In', 
  'Slow Pull-Back', 
  'Dynamic Orbit', 
  'FPV Drone Fly-Through', 
  'Low Angle Tracking', 
  'Handheld Chaos (UGC)', 
  'Top-Down Bird\'s Eye', 
  'Crash Zoom', 
  'Parallax Slider',
  'Whip Pan Transition'
];

export const LIGHTING_MOODS = [
  'Soft Studio', 'Natural Daylight', 'Dramatic Contrast', 'Neon Cyberpunk', 'Golden Hour', 'Dark & Moody', 'Bright High-Key', 'Volumetric Fog'
];

export const AD_TYPE_ICONS: Record<string, any> = {
  [AdType.UGC]: User,
  [AdType.Cinematic]: Film,
  [AdType.ProductShowcase]: Box,
  [AdType.Lifestyle]: Sun,
  [AdType.Animation3D]: Layers,
  [AdType.Luxury]: Star,
  [AdType.Minimal]: Aperture,
  [AdType.Testimonial]: MonitorPlay,
  [AdType.SocialShort]: Zap,
};

// Translations
export const TRANSLATIONS = {
  en: {
    appTitle: "Studio Space",
    appSubtitle: "AI CREATIVE SUITE",
    systemStatus: "Ready",
    visualRef: "Source Visual",
    visualRefSub: "Upload asset for analysis",
    scenePreview: "AI Scene Vis",
    scenePreviewSub: "Contextual visualization",
    clickToReplace: "Replace Asset",
    dragDrop: "Drag source image here",
    analyzing: "Analyzing Vectors...",
    generatingScene: "Rendering Scene...",
    analysisComplete: "Analysis Ready",
    category: "Category",
    palette: "Colors",
    model: "AI Model",
    ratio: "Format",
    duration: "Duration",
    creativeDir: "Creative Direction",
    creativeDirSub: "Define style & mood",
    adCategory: "Campaign Type",
    multiSelect: "Multi-select active",
    hybridMode: "Hybrid Mode",
    visualStyle: "Visual Style",
    fineTuning: "Precision Control",
    cameraMove: "Camera Action",
    lightingMood: "Lighting",
    brandContext: "Brand Context",
    generateAI: "Auto-Generate",
    magicWorking: "Thinking...",
    brandMsg: "Brand Slogan",
    brandMsgPlace: "e.g. Just Do It",
    voiceover: "Script / Voiceover",
    voiceoverPlace: "Describe the narration...",
    outputFormat: "Output",
    generateBtn: "Generate Master Prompt",
    processing: "Compiling Prompt...",
    resultTitle: "Studio Output",
    resultSub: "High-Fidelity Prompt Generated",
    modelOptimized: "Model Optimized",
    masterDesc: "Master Description",
    shortPunchy: "Short / Punchy",
    detailedCinematic: "Detailed / Cinematic",
    strategyInsight: "Strategy",
    viralHooks: "Hooks",
    awaitingInput: "Studio Ready",
    awaitingInputDesc: "Configure your project settings to begin generation.",
    constructing: "Processing",
    constructingDesc: "The AI Director is crafting your scene...",
    copy: "Copy Prompt",
    exportJson: "Export JSON",
    regenerate: "Regenerate",
    footerDev: "Developed with ❤️ by",
    footerName: "Iyed Chebbi",
    version: "Studio Space v3.0",
    settings: "Settings",
    uploadFirst: "Upload source image",
    selectModel: "Model",
    selectRatio: "Ratio",
    selectDuration: "Duration",
    formatNormal: "Visual",
    formatJson: "JSON",
    formatPython: "Python",
    newProject: "New Project",
    genSlogan: "Generate Slogan",
    nav: {
      create: "Create",
      resetConfirm: "Reset current workspace?"
    },
    sliders: {
      creativity: "Creativity",
      realism: "Realism",
      technical: "Technical"
    },
    sceneGen: {
      title: "First Frame Preview",
      btn: "Render First Frame",
      download: "Download",
      desc: "Generate a high-fidelity first frame visualization.",
      generating: "Rendering..."
    },
    history: {
      title: "History",
      empty: "No projects yet.",
      restore: "Load",
      generatedOn: "Date"
    },
    aiEditor: {
      title: "Magic Edit",
      placeholder: "e.g. 'Add cinematic fog'",
      btn: "Apply",
      applying: "Applying..."
    },
    // STUDIO MODE TRANSLATIONS
    modes: {
      adCreator: "Product Ads Creator",
      studio: "StoryBoard Creator"
    },
    studio: {
      title: "StoryBoard Studio",
      subtitle: "Text-to-Video Storytelling Engine",
      inputLabel: "Director's Treatment",
      inputPlaceholder: "Describe your film idea (e.g., A cyberpunk chase scene through Tokyo neon streets...)",
      generateStory: "Generate Storyboard",
      generatingStory: "Writing Script...",
      scene: "SCENE",
      visuals: "VISUAL PROMPT (IMAGE)",
      videoPrompt: "VIDEO PROMPT (MOTION + VO)",
      genImage: "Visualize Scene",
      generatingImg: "Rendering...",
      compileBtn: "Compile Video Prompt",
      compiling: "Compiling...",
      config: {
        style: "Film Style",
        count: "Scenes",
        duration: "Time/Scene",
        character: "Character Consistency",
        charPlaceholder: "Describe main character..."
      }
    }
  },
  ar: {
    appTitle: "استوديو سبيس",
    appSubtitle: "جناح الإبداع بالذكاء الاصطناعي",
    systemStatus: "جاهز",
    visualRef: "المصدر البصري",
    visualRefSub: "ارفع ملف للتحليل",
    scenePreview: "معاينة المشهد",
    scenePreviewSub: "تصور سياقي",
    clickToReplace: "استبدال",
    dragDrop: "اسحب الصورة هنا",
    analyzing: "جاري التحليل...",
    generatingScene: "جاري الريندر...",
    analysisComplete: "تم التحليل",
    category: "التصنيف",
    palette: "الألوان",
    model: "النموذج",
    ratio: "الأبعاد",
    duration: "المدة",
    creativeDir: "التوجه الإبداعي",
    creativeDirSub: "تحديد النمط والمزاج",
    adCategory: "نوع الحملة",
    multiSelect: "تحديد متعدد",
    hybridMode: "الوضع الهجين",
    visualStyle: "النمط البصري",
    fineTuning: "تحكم دقيق",
    cameraMove: "حركة الكاميرا",
    lightingMood: "الإضاءة",
    brandContext: "سياق العلامة",
    generateAI: "توليد تلقائي",
    magicWorking: "جاري العمل...",
    brandMsg: "الشعار",
    brandMsgPlace: "مثال: انطلق بلا حدود",
    voiceover: "السكربت / التعليق",
    voiceoverPlace: "وصف السرد...",
    outputFormat: "المخرجات",
    generateBtn: "توليد الأمر النهائي",
    processing: "جاري التجميع...",
    resultTitle: "مخرجات الاستوديو",
    resultSub: "أمر عالي الدقة جاهز",
    modelOptimized: "محسن للنموذج",
    masterDesc: "الوصف الشامل",
    shortPunchy: "قصير / خاطف",
    detailedCinematic: "مفصل / سينمائي",
    strategyInsight: "الاستراتيجية",
    viralHooks: "الخطافات",
    awaitingInput: "الاستوديو جاهز",
    awaitingInputDesc: "قم بإعداد المشروع للبدء.",
    constructing: "جاري المعالجة",
    constructingDesc: "يقوم المخرج الذكي بصياغة المشهد...",
    copy: "نسخ الأمر",
    exportJson: "تصدير JSON",
    regenerate: "إعادة التوليد",
    footerDev: "تم التطوير",
    footerBy: "بواسطة",
    footerName: "إياد الشابي",
    version: "Studio Space v3.0",
    settings: "الإعدادات",
    uploadFirst: "ارفع صورة أولاً",
    selectModel: "النموذج",
    selectRatio: "الأبعاد",
    selectDuration: "المدة",
    formatNormal: "نص",
    formatJson: "JSON",
    formatPython: "بايثون",
    newProject: "مشروع جديد",
    genSlogan: "توليد شعار",
    nav: {
      create: "إنشاء",
      resetConfirm: "إعادة تعيين مساحة العمل؟"
    },
    sliders: {
      creativity: "الإبداع",
      realism: "الواقعية",
      technical: "التقنية"
    },
    sceneGen: {
      title: "معاينة الإطار الأول",
      btn: "توليد الإطار",
      download: "تنزيل",
      desc: "إنشاء تصور عالي الدقة.",
      generating: "جاري المعالجة..."
    },
    history: {
      title: "السجل",
      empty: "لا يوجد مشاريع.",
      restore: "فتح",
      generatedOn: "التاريخ"
    },
    aiEditor: {
      title: "تعديل سحري",
      placeholder: "مثال: أضف ضباب سينمائي",
      btn: "تطبيق",
      applying: "جاري التطبيق..."
    },
    modes: {
      adCreator: "منشئ الإعلانات",
      studio: "منشئ القصة"
    },
    studio: {
      title: "استوديو القصة",
      subtitle: "محرك تحويل النص لفيديو",
      inputLabel: "رؤية المخرج",
      inputPlaceholder: "صف فكرة الفيلم...",
      generateStory: "توليد القصة",
      generatingStory: "كتابة السكربت...",
      scene: "مشهد",
      visuals: "الوصف البصري (صورة)",
      videoPrompt: "أمر الفيديو (حركة وصوت)",
      genImage: "تخيل المشهد",
      generatingImg: "رسم...",
      compileBtn: "تجميع أمر الفيديو",
      compiling: "تجميع...",
      config: {
        style: "نمط الفيلم",
        count: "المشاهد",
        duration: "وقت/مشهد",
        character: "الشخصية (اتساق)",
        charPlaceholder: "وصف الشخصية الرئيسية..."
      }
    }
  }
};
