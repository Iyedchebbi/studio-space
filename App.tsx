
import React, { useState, useRef, useEffect } from 'react';
import { 
  Upload, Image as ImageIcon, Sparkles, Layers, Aperture, 
  Settings, Wand2, Download, Play, Repeat, Shuffle, 
  Monitor, Clapperboard, PenTool, ArrowRight, CheckCircle2,
  Video, Languages, Plus, RefreshCcw, Command,
  Film, Clock, User, Palette, Ratio, Copy, FileText, UserCircle2, Music,
  History, Trash2, Calendar
} from 'lucide-react';

import { AppState, AdType, CreativeStyle, AIModel, AspectRatio, AppLanguage, HistoryItem, StudioScene, StudioConfig, StudioCharacter } from './types';
import { MODELS, ASPECT_RATIOS, AD_TYPES, STYLES, CAMERA_MOVEMENTS, LIGHTING_MOODS, TRANSLATIONS, VIDEO_DURATIONS, STUDIO_STYLES } from './constants';
import { analyzeImage, generateAdPrompt, enhanceStoryConcept, generateStoryboard, generateImage } from './services/geminiService';

import { Slider } from './components/ui/Slider';
import { ResultPanel } from './components/ResultPanel';

// --- COMPONENTS ---

const NavButton: React.FC<{ active: boolean; icon: React.ReactNode; label: string; onClick: () => void }> = ({ active, icon, label, onClick }) => (
  <button 
    onClick={onClick}
    className={`
      flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 w-full group relative overflow-hidden
      ${active 
        ? 'bg-gradient-to-r from-orange-500/10 to-orange-500/5 text-orange-600 shadow-sm border border-orange-500/10' 
        : 'text-zinc-500 hover:bg-white hover:text-zinc-900 hover:shadow-sm'}
    `}
  >
    <span className={`relative z-10 ${active ? 'text-orange-600' : 'text-zinc-400 group-hover:text-zinc-600 transition-colors'}`}>{icon}</span>
    <span className="relative z-10 font-semibold text-sm tracking-wide">{label}</span>
    {active && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-orange-500 rounded-r-full"></div>}
  </button>
);

const GlassCard: React.FC<{ children: React.ReactNode; className?: string; hoverEffect?: boolean }> = ({ children, className = "", hoverEffect = false }) => (
  <div className={`glass-panel rounded-2xl p-6 ${hoverEffect ? 'glass-panel-hover' : ''} ${className}`}>
    {children}
  </div>
);

// --- MAIN APP ---

const App: React.FC = () => {
  // --- STATE ---
  const [state, setState] = useState<AppState>({
    language: 'en',
    outputFormat: 'normal',
    activeMode: 'ad-creator',
    activeView: 'create', // 'create' | 'history'
    showHistoryPanel: false,
    history: [],
    image: null,
    generatedSceneImage: null,
    isAnalyzing: false,
    isGeneratingScene: false,
    
    // Studio State
    studioConfig: {
      style: 'Hollywood Cinematic',
      sceneCount: 5,
      sceneDuration: 5,
      characterDescription: '' 
    },
    studioInput: '',
    storyScript: '',
    backgroundMusic: '',
    studioCharacters: [],
    studioScenes: [],
    isGeneratingStory: false,
    isEnhancing: false,
    studioResult: null,
    
    // Image Editing State
    isEditingImage: false,
    editPrompt: '',

    analysis: null,
    selectedAdType: [AdType.ProductShowcase],
    isHybridMode: false,
    selectedStyle: CreativeStyle.Modern,
    selectedModel: AIModel.Veo3,
    aspectRatio: AspectRatio.Landscape,
    customAspectRatio: '',
    videoDuration: 10,
    sliders: { creativity: 60, realism: 90, technical: 80 },
    additionalContext: { voiceover: '', brandMessage: '' },
    cameraMovement: [],
    lighting: 'Cinematic',
    isGenerating: false,
    result: null,
  });

  const [copiedId, setCopiedId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const t = TRANSLATIONS[state.language];
  const isRTL = state.language === 'ar';

  // --- PERSISTENCE ---

  useEffect(() => {
    // Load history on mount
    const saved = localStorage.getItem('studio_space_history');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setState(p => ({ ...p, history: parsed }));
      } catch (e) { console.error("History load error", e); }
    }
  }, []);

  const saveToHistory = (itemData: any, type: 'ad' | 'studio') => {
    const newItem: HistoryItem = {
      id: Date.now().toString(),
      timestamp: Date.now(),
      model: state.selectedModel,
      adType: type === 'ad' ? state.selectedAdType : [],
      result: itemData, // Stores the GeneratedResult OR the Studio State bundle
      imageThumbnail: type === 'ad' ? state.image : (state.studioScenes[0]?.imageUrl || null)
    };

    setState(prev => {
      const updatedHistory = [newItem, ...prev.history].slice(0, 20); // Keep last 20
      localStorage.setItem('studio_space_history', JSON.stringify(updatedHistory));
      return { ...prev, history: updatedHistory };
    });
  };

  const loadHistoryItem = (item: HistoryItem) => {
    // Determine if it's a Studio project or Ad project based on structure
    // We are simplifying by inferring from the data structure
    if (item.result.scenes && Array.isArray(item.result.scenes)) {
       // Studio Project
       setState(p => ({
         ...p,
         activeMode: 'studio',
         activeView: 'create',
         studioInput: item.result.idea || "",
         studioScenes: item.result.scenes,
         studioCharacters: item.result.characters || [],
         storyScript: item.result.fullScript || "",
         backgroundMusic: item.result.backgroundMusicPrompt || "",
         studioConfig: item.result.config || p.studioConfig
       }));
    } else {
       // Ad Project
       setState(p => ({
         ...p,
         activeMode: 'ad-creator',
         activeView: 'create',
         result: item.result,
         image: item.imageThumbnail || null,
         // We might not restore every slider setting to keep it simple, but we could
       }));
    }
  };

  const clearHistory = () => {
    if(confirm("Are you sure you want to clear all history?")) {
        localStorage.removeItem('studio_space_history');
        setState(p => ({...p, history: []}));
    }
  };

  // --- HANDLERS ---

  const handleReset = () => {
    setState(prev => ({
        ...prev, image: null, generatedSceneImage: null, result: null, analysis: null, studioInput: '', storyScript: '', backgroundMusic: '', studioScenes: [], studioCharacters: [], studioResult: null,
        selectedAdType: [AdType.ProductShowcase], isHybridMode: false,
        studioConfig: { style: 'Hollywood Cinematic', sceneCount: 5, sceneDuration: 5, characterDescription: '' },
        isGenerating: false, isGeneratingScene: false, isAnalyzing: false, activeView: 'create'
    }));
    if (fileInputRef.current) fileInputRef.current.value = '';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDownloadImage = (base64Data: string, filename: string) => {
    const link = document.createElement('a');
    link.href = base64Data;
    link.download = `${filename}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = reader.result as string;
      setState(prev => ({ ...prev, image: base64, isAnalyzing: true, analysis: null }));
      try {
        const analysis = await analyzeImage(base64);
        setState(prev => ({ ...prev, isAnalyzing: false, analysis }));
      } catch (err) { setState(prev => ({ ...prev, isAnalyzing: false })); }
    };
    reader.readAsDataURL(file);
  };

  const handleGeneratePrompt = async () => {
    if (!state.image) return;
    setState(prev => ({ ...prev, isGenerating: true, result: null }));
    try {
      const result = await generateAdPrompt({
        imageAnalysis: state.analysis, base64Image: state.image, adTypes: state.selectedAdType, isHybridMode: state.isHybridMode,
        style: state.selectedStyle ? state.selectedStyle.toString() : null, model: state.selectedModel,
        aspectRatio: state.aspectRatio, videoDuration: state.videoDuration, sliders: state.sliders, camera: state.cameraMovement, lighting: state.lighting,
        context: state.additionalContext, language: state.language
      });
      setState(prev => ({ ...prev, isGenerating: false, result }));
      saveToHistory(result, 'ad');
    } catch (error) { console.error(error); setState(prev => ({ ...prev, isGenerating: false })); }
  };

  const handleEnhanceIdea = async () => {
      if(!state.studioInput) return;
      setState(p => ({...p, isEnhancing: true}));
      try {
          const improved = await enhanceStoryConcept(state.studioInput);
          setState(p => ({...p, isEnhancing: false, studioInput: improved}));
      } catch (e) { setState(p => ({...p, isEnhancing: false})); }
  };

  const handleGenerateStoryboard = async () => {
    if (!state.studioInput) return;
    // Reset
    setState(p => ({ ...p, isGeneratingStory: true, studioScenes: [], studioCharacters: [], storyScript: '', backgroundMusic: '' }));
    try {
      // 1. Generate Text (Script, Music, Characters, Scenes)
      const { fullScript, backgroundMusicPrompt, characters, scenes } = await generateStoryboard(state.studioInput, state.studioConfig, state.selectedModel, state.language);
      
      setState(p => ({ ...p, isGeneratingStory: false, studioScenes: scenes, studioCharacters: characters, storyScript: fullScript, backgroundMusic: backgroundMusicPrompt }));

      // 2. Auto-Trigger Character Generation
      characters.forEach(char => handleGenerateCharacterImage(char.id, char.visualPrompt, char.aspectRatio, characters));

      // 3. Save to History
      const studioStateBundle = {
         idea: state.studioInput,
         scenes: scenes,
         characters: characters,
         fullScript: fullScript,
         backgroundMusicPrompt: backgroundMusicPrompt,
         config: state.studioConfig
      };
      saveToHistory(studioStateBundle, 'studio');

    } catch (e) { setState(p => ({ ...p, isGeneratingStory: false })); }
  };

  const handleGenerateCharacterImage = async (charId: number, prompt: string, ratio: AspectRatio, currentChars: StudioCharacter[]) => {
      // Optimistic update
      const updatedChars = currentChars.map(c => c.id === charId ? { ...c, isGeneratingImage: true } : c);
      setState(p => ({ ...p, studioCharacters: updatedChars }));

      try {
          const base64 = await generateImage(prompt, state.studioConfig.style, ratio);
          setState(p => ({
              ...p,
              studioCharacters: p.studioCharacters.map(c => c.id === charId ? { ...c, imageUrl: base64, isGeneratingImage: false } : c)
          }));
      } catch (e: any) {
           console.error(e);
           alert("Failed to generate character image: " + (e.message || "Unknown error"));
           setState(p => ({
              ...p,
              studioCharacters: p.studioCharacters.map(c => c.id === charId ? { ...c, isGeneratingImage: false } : c)
          }));
      }
  };
  
  const handleGenerateSceneImage = async (sceneId: number, prompt: string, ratio: AspectRatio) => {
      setState(p => ({
          ...p,
          studioScenes: p.studioScenes.map(s => s.id === sceneId ? { ...s, isGeneratingImage: true } : s)
      }));

      try {
          const base64 = await generateImage(prompt, state.studioConfig.style, ratio);
          setState(p => ({
              ...p,
              studioScenes: p.studioScenes.map(s => s.id === sceneId ? { ...s, imageUrl: base64, isGeneratingImage: false } : s)
          }));
      } catch (e: any) {
          console.error(e);
          alert("Failed to generate scene image: " + (e.message || "Unknown error"));
          setState(p => ({
              ...p,
              studioScenes: p.studioScenes.map(s => s.id === sceneId ? { ...s, isGeneratingImage: false } : s)
          }));
      }
  };

  const handleCharRatioChange = (id: number, ratio: AspectRatio) => {
      const char = state.studioCharacters.find(c => c.id === id);
      if (char) {
          setState(p => ({ ...p, studioCharacters: p.studioCharacters.map(c => c.id === id ? { ...c, aspectRatio: ratio } : c)}));
          // Immediate regeneration
          handleGenerateCharacterImage(id, char.visualPrompt, ratio, state.studioCharacters);
      }
  };

  const handleSceneRatioChange = (id: number, ratio: AspectRatio) => {
      const scene = state.studioScenes.find(s => s.id === id);
      if (scene) {
          setState(p => ({ ...p, studioScenes: p.studioScenes.map(s => s.id === id ? { ...s, aspectRatio: ratio } : s)}));
          // Immediate regeneration
          handleGenerateSceneImage(id, scene.visualPrompt, ratio);
      }
  };

  // --- RENDER HELPERS ---
  const formatDate = (ts: number) => new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(ts));

  // --- RENDER ---

  return (
    <div dir={isRTL ? 'rtl' : 'ltr'} className={`flex h-screen overflow-hidden text-zinc-900 font-sans selection:bg-orange-500/30`}>
      
      {/* FLOATING SIDEBAR */}
      <aside className="w-20 lg:w-64 bg-white/80 backdrop-blur-xl border-r border-white/50 flex flex-col z-20 shadow-[4px_0_24px_rgba(0,0,0,0.02)] transition-all duration-300">
        <div className="h-24 flex items-center px-4 lg:px-6 gap-3 border-b border-zinc-100/50">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center shadow-lg shadow-orange-500/30 shrink-0 transform hover:scale-105 transition-transform duration-300">
            <Command className="w-5 h-5 text-white" />
          </div>
          <div className="hidden lg:block opacity-0 animate-fade-in delay-100">
            <h1 className="font-bold text-lg tracking-tight text-zinc-800">Studio Space</h1>
            <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                <span className="text-[10px] text-zinc-400 font-mono font-medium tracking-wide">ONLINE</span>
            </div>
          </div>
        </div>

        <div className="flex-1 px-3 lg:px-4 py-6 space-y-2 overflow-y-auto">
          <div className="hidden lg:block px-2 mb-2 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Workspace</div>
          
          <NavButton 
            active={state.activeView === 'create' && state.activeMode === 'ad-creator'} 
            icon={<Clapperboard className="w-5 h-5"/>} 
            label={t.modes.adCreator} 
            onClick={() => setState(p => ({...p, activeMode: 'ad-creator', activeView: 'create'}))} 
          />
          <NavButton 
            active={state.activeView === 'create' && state.activeMode === 'studio'} 
            icon={<PenTool className="w-5 h-5"/>} 
            label={t.modes.studio} 
            onClick={() => setState(p => ({...p, activeMode: 'studio', activeView: 'create'}))} 
          />

          <div className="my-6 border-t border-zinc-100/50"></div>
          
          <div className="hidden lg:block px-2 mb-2 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Library</div>
          <NavButton 
            active={state.activeView === 'history'} 
            icon={<History className="w-5 h-5"/>} 
            label="Saved Projects" 
            onClick={() => setState(p => ({...p, activeView: 'history'}))} 
          />
          
          <div className="mt-auto pt-6">
             <button onClick={handleReset} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900 transition-all border border-transparent hover:border-zinc-200/50 group">
                <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform" /> 
                <span className="hidden lg:inline font-medium text-sm">{t.newProject}</span>
             </button>
          </div>
        </div>

        <div className="p-6 border-t border-zinc-100/50 bg-white/40">
            <div className="flex items-center justify-between">
                <button onClick={() => setState(p => ({...p, language: p.language === 'en' ? 'ar' : 'en'}))} className="px-3 py-1.5 rounded-lg bg-white border border-zinc-200 text-xs font-bold text-zinc-600 hover:text-orange-600 hover:border-orange-500/30 transition-all shadow-sm">
                    {state.language === 'en' ? 'English' : 'Arabic'}
                </button>
            </div>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 flex flex-col relative overflow-hidden">
        
        {/* HEADER */}
        <header className="h-20 flex items-center justify-between px-8 z-10 animate-fade-in">
           <div className="flex items-center gap-4">
               {state.activeView === 'history' ? (
                   <h2 className="text-2xl font-bold text-zinc-800 tracking-tight">Project History</h2>
               ) : (
                   <div className="flex flex-col">
                       <h2 className="text-xl font-bold text-zinc-800 tracking-tight">{state.activeMode === 'ad-creator' ? 'Product Ad Synthesis' : 'Storyboard Director'}</h2>
                       <p className="text-xs text-zinc-400 font-medium">Gemini 3.0 Pro Powered</p>
                   </div>
               )}
           </div>
           
           <div className="flex items-center gap-4">
              <div className="hidden md:flex items-center gap-2 px-4 py-2 rounded-full bg-white/50 border border-white shadow-sm backdrop-blur-md">
                 <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                 <span className="text-xs font-bold text-zinc-600 tracking-wide">SYSTEM OPERATIONAL</span>
              </div>
           </div>
        </header>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-8 pb-32">
            
            {/* --- HISTORY VIEW --- */}
            {state.activeView === 'history' && (
                <div className="max-w-7xl mx-auto animate-slide-up">
                    <div className="flex justify-end mb-6">
                        <button onClick={clearHistory} className="text-red-500 text-xs font-bold hover:text-red-600 flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-red-50 transition-colors">
                            <Trash2 className="w-4 h-4"/> Clear All History
                        </button>
                    </div>
                    {state.history.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-96 text-zinc-400 border-2 border-dashed border-zinc-200 rounded-3xl">
                            <History className="w-16 h-16 mb-4 opacity-20"/>
                            <p className="text-sm font-medium">No saved projects yet.</p>
                            <p className="text-xs">Generate something to see it here.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {state.history.map((item) => (
                                <div key={item.id} onClick={() => loadHistoryItem(item)} className="glass-panel rounded-2xl p-4 cursor-pointer hover:scale-[1.02] transition-transform duration-300 group relative overflow-hidden">
                                    <div className="aspect-video bg-zinc-100 rounded-xl mb-4 overflow-hidden relative">
                                        {item.imageThumbnail ? (
                                            <img src={item.imageThumbnail} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-zinc-100 to-zinc-200">
                                                <FileText className="w-8 h-8 text-zinc-300"/>
                                            </div>
                                        )}
                                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                                            <div className="opacity-0 group-hover:opacity-100 bg-white/90 backdrop-blur px-4 py-2 rounded-lg shadow-lg text-xs font-bold text-zinc-800 transform translate-y-2 group-hover:translate-y-0 transition-all duration-300">
                                                Restore Project
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex justify-between items-start mb-2">
                                        <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${item.result.scenes ? 'bg-purple-100 text-purple-700' : 'bg-orange-100 text-orange-700'}`}>
                                            {item.result.scenes ? 'Storyboard' : 'Ad Campaign'}
                                        </span>
                                        <span className="text-[10px] text-zinc-400 flex items-center gap-1">
                                            <Clock className="w-3 h-3"/> {formatDate(item.timestamp)}
                                        </span>
                                    </div>
                                    <p className="text-sm font-bold text-zinc-800 line-clamp-2 leading-snug">
                                        {item.result.idea || (item.result.richData?.strategy || "Untitled Project")}
                                    </p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* --- AD CREATOR MODE --- */}
            {state.activeView === 'create' && state.activeMode === 'ad-creator' && (
                <div className="max-w-[1800px] mx-auto animate-fade-in">
                    <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 h-[calc(100vh-180px)]">
                        {/* LEFT: CONTROLS */}
                        <div className="xl:col-span-4 space-y-6 overflow-y-auto custom-scrollbar pr-2 h-full pb-20">
                            
                            {/* UPLOAD */}
                            <GlassCard hoverEffect className="relative group overflow-hidden border-orange-500/10">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="text-sm font-bold text-zinc-700 uppercase tracking-wide flex items-center gap-2"><ImageIcon className="w-4 h-4 text-orange-500"/> Source Asset</h3>
                                    {state.isAnalyzing && <span className="text-xs text-orange-500 animate-pulse font-bold">SCANNING VECTORS...</span>}
                                </div>
                                <div className="relative aspect-video rounded-xl bg-zinc-50 border-2 border-dashed border-zinc-200 hover:border-orange-500/50 transition-colors flex flex-col items-center justify-center overflow-hidden group-hover:bg-white">
                                    <input ref={fileInputRef} type="file" onChange={handleImageUpload} className="absolute inset-0 opacity-0 cursor-pointer z-20" />
                                    {state.image ? (
                                        <img src={state.image} className="w-full h-full object-contain z-10" />
                                    ) : (
                                        <div className="text-center p-6 transition-transform duration-300 group-hover:scale-110">
                                            <div className="w-12 h-12 rounded-full bg-orange-50 flex items-center justify-center mx-auto mb-3">
                                                <Upload className="w-5 h-5 text-orange-500" />
                                            </div>
                                            <p className="text-xs font-bold text-zinc-400">Drag & Drop or Click to Upload</p>
                                        </div>
                                    )}
                                </div>
                                {state.analysis && (
                                    <div className="mt-4 pt-4 border-t border-zinc-100 grid grid-cols-2 gap-2 text-[10px]">
                                        <div className="bg-zinc-100 p-2 rounded text-zinc-600 font-medium text-center">{state.analysis.category}</div>
                                        <div className="bg-zinc-100 p-2 rounded flex gap-1 justify-center">{state.analysis.colors.slice(0,3).map((c,i) => <span key={i} className="w-3 h-3 rounded-full shadow-sm ring-1 ring-black/5" style={{backgroundColor: c}}></span>)}</div>
                                    </div>
                                )}
                            </GlassCard>

                            {/* CONFIGURATION */}
                            <GlassCard hoverEffect>
                                <div className="space-y-6">
                                    <div>
                                        <label className="text-xs font-bold text-zinc-400 uppercase block mb-3">Model Configuration</label>
                                        <div className="grid grid-cols-2 gap-3">
                                            <select value={state.selectedModel} onChange={e => setState(p => ({...p, selectedModel: e.target.value as AIModel}))} className="glass-input w-full rounded-xl px-3 py-2.5 text-sm font-medium text-zinc-700 shadow-sm"><option>{AIModel.Veo3}</option><option>{AIModel.Sora2}</option><option>{AIModel.Runway}</option></select>
                                            <select value={state.aspectRatio} onChange={e => setState(p => ({...p, aspectRatio: e.target.value as AspectRatio}))} className="glass-input w-full rounded-xl px-3 py-2.5 text-sm font-medium text-zinc-700 shadow-sm">{ASPECT_RATIOS.map(r => <option key={r}>{r}</option>)}</select>
                                        </div>
                                        <div className="mt-4">
                                            <label className="text-[10px] font-bold text-zinc-400 uppercase block mb-2">{t.duration}</label>
                                            <div className="flex gap-2 bg-zinc-50/50 p-1 rounded-xl border border-zinc-100">
                                                {[5, 10, 15, 30].map(d => (
                                                    <button key={d} onClick={() => setState(p => ({...p, videoDuration: d}))} className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${state.videoDuration === d ? 'bg-white text-orange-600 shadow-sm' : 'text-zinc-400 hover:text-zinc-600'}`}>
                                                        {d}s
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div>
                                        <div className="flex justify-between mb-3"><label className="text-xs font-bold text-zinc-400 uppercase">Creative Style</label><button onClick={() => setState(p => ({...p, isHybridMode: !p.isHybridMode}))} className={`text-[10px] px-2 py-0.5 rounded-full font-bold transition-colors ${state.isHybridMode ? 'bg-gradient-to-r from-purple-500 to-indigo-500 text-white' : 'bg-zinc-100 text-zinc-400'}`}>HYBRID MODE</button></div>
                                        <div className="grid grid-cols-3 gap-2">
                                            {AD_TYPES.slice(0, 6).map(type => (
                                                <button key={type} onClick={() => setState(p => ({...p, selectedAdType: [type]}))} className={`p-2 rounded-xl text-[10px] font-bold border transition-all duration-200 ${state.selectedAdType.includes(type) ? 'bg-zinc-900 text-white border-zinc-900 shadow-lg' : 'bg-white border-zinc-100 text-zinc-500 hover:border-zinc-300'}`}>
                                                    {type.split(' ')[0]}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div>
                                        <label className="text-xs font-bold text-zinc-400 uppercase block mb-3">Refinements</label>
                                        <Slider label="Creativity" value={state.sliders.creativity} onChange={v => setState(p => ({...p, sliders: {...p.sliders, creativity: v}}))} />
                                    </div>
                                </div>
                            </GlassCard>

                            <button onClick={handleGeneratePrompt} disabled={!state.image || state.isGenerating} className={`w-full py-4 rounded-xl font-bold text-sm tracking-widest uppercase transition-all duration-300 shadow-lg ${!state.image || state.isGenerating ? 'bg-zinc-100 text-zinc-400 cursor-not-allowed' : 'bg-gradient-to-r from-orange-600 to-amber-600 hover:scale-[1.02] hover:shadow-orange-500/30 text-white'}`}>
                                {state.isGenerating ? 'Synthesizing...' : 'Generate Master Prompt'}
                            </button>
                        </div>

                        {/* RIGHT: OUTPUT ONLY */}
                        <div className="xl:col-span-8 flex flex-col h-full animate-slide-in-right delay-200">
                            <div className="flex-1 glass-panel rounded-2xl h-full border-white/60 shadow-xl overflow-hidden relative">
                                <ResultPanel result={state.result} loading={state.isGenerating} onRegenerate={handleGeneratePrompt} outputFormat={state.outputFormat} setOutputFormat={f => setState(p => ({...p, outputFormat: f}))} language={state.language} model={state.selectedModel} />
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* --- STUDIO MODE --- */}
            {state.activeView === 'create' && state.activeMode === 'studio' && (
                <div className="max-w-6xl mx-auto space-y-8 animate-slide-up pb-24">
                    <div className="text-center space-y-3 py-6">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-100/50 border border-orange-200 text-orange-700 text-[10px] font-bold uppercase tracking-wider mb-2">
                             New V3.1 Engine
                        </div>
                        <h2 className="text-4xl lg:text-5xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-zinc-900 via-zinc-800 to-zinc-600 tracking-tight">
                            Cinematic Storyteller
                        </h2>
                        <p className="text-sm text-zinc-500 font-medium max-w-lg mx-auto leading-relaxed">
                            Transform raw concepts into production-ready storyboards using Gemini 3.0 Pro's multimodal intelligence.
                        </p>
                    </div>

                    {/* STUDIO CONFIGURATION BAR */}
                    <GlassCard hoverEffect className="border-orange-500/10">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
                            <div>
                                <label className="text-[10px] font-bold text-zinc-400 uppercase mb-2 block">{t.studio.config.style}</label>
                                <div className="relative group">
                                    <select value={state.studioConfig.style} onChange={e => setState(p => ({...p, studioConfig: {...p.studioConfig, style: e.target.value}}))} className="glass-input w-full rounded-xl px-4 py-3 text-sm font-semibold text-zinc-700 appearance-none cursor-pointer">
                                        {STUDIO_STYLES.map(s => <option key={s}>{s}</option>)}
                                    </select>
                                    <Palette className="w-4 h-4 text-zinc-400 absolute right-4 top-3.5 pointer-events-none group-hover:text-orange-500 transition-colors"/>
                                </div>
                            </div>
                            
                            <div>
                                <label className="text-[10px] font-bold text-zinc-400 uppercase mb-2 block">{t.studio.config.count} ({state.studioConfig.sceneCount})</label>
                                <div className="h-11 flex items-center px-2 bg-white/50 rounded-xl border border-zinc-200">
                                   <input type="range" min="3" max="10" value={state.studioConfig.sceneCount} onChange={e => setState(p => ({...p, studioConfig: {...p.studioConfig, sceneCount: Number(e.target.value)}}))} className="w-full h-2 bg-zinc-200 rounded-lg appearance-none cursor-pointer accent-orange-500 hover:accent-orange-400 transition-all" />
                                </div>
                            </div>

                            <div>
                                <label className="text-[10px] font-bold text-zinc-400 uppercase mb-2 block">{t.studio.config.duration} ({state.studioConfig.sceneDuration}s)</label>
                                <div className="flex gap-1 bg-zinc-50/50 p-1 rounded-xl border border-zinc-100">
                                    {[5, 8, 10].map(d => (
                                        <button key={d} onClick={() => setState(p => ({...p, studioConfig: {...p.studioConfig, sceneDuration: d}}))} className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${state.studioConfig.sceneDuration === d ? 'bg-white text-orange-600 shadow-sm' : 'text-zinc-400 hover:text-zinc-600'}`}>
                                            {d}s
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </GlassCard>

                    {/* INPUT AREA WITH ENHANCE */}
                    <div className="relative group">
                        <div className="absolute inset-0 bg-gradient-to-r from-orange-500/20 to-purple-500/20 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                        <GlassCard className="relative z-10 p-0 overflow-hidden shadow-2xl shadow-orange-500/5">
                            <textarea 
                                value={state.studioInput} 
                                onChange={e => setState(p => ({...p, studioInput: e.target.value}))} 
                                placeholder="Describe your film concept here... (e.g., A cyberpunk detective walking through rainy neon streets looking for a rogue android)" 
                                className="w-full bg-transparent border-none p-8 text-lg font-medium text-zinc-800 placeholder-zinc-300 focus:ring-0 outline-none min-h-[160px] resize-none" 
                            />
                            <div className="bg-zinc-50/80 backdrop-blur border-t border-zinc-100 p-4 flex justify-between items-center">
                                <button 
                                    onClick={handleEnhanceIdea}
                                    disabled={state.isEnhancing || !state.studioInput}
                                    className="px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 border border-indigo-200 rounded-xl font-bold text-xs transition-all flex items-center gap-2"
                                >
                                    {state.isEnhancing ? <Sparkles className="w-3 h-3 animate-spin"/> : <Sparkles className="w-3 h-3"/>} 
                                    Enhance Concept
                                </button>
                                
                                <button 
                                    onClick={handleGenerateStoryboard} 
                                    disabled={state.isGeneratingStory || !state.studioInput} 
                                    className="px-8 py-3 bg-gradient-to-r from-zinc-900 to-zinc-800 hover:to-zinc-700 text-white rounded-xl font-bold text-sm transition-all flex items-center gap-2 shadow-lg shadow-zinc-900/20 hover:scale-[1.02]"
                                >
                                    {state.isGeneratingStory ? <Sparkles className="w-4 h-4 animate-spin"/> : <Wand2 className="w-4 h-4"/>} 
                                    Generate Storyboard
                                </button>
                            </div>
                        </GlassCard>
                    </div>

                    {/* SCRIPT RESULTS */}
                    {state.storyScript && (
                        <GlassCard hoverEffect className="border-orange-500/20 bg-gradient-to-br from-white to-orange-50/30 animate-fade-in">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-xs font-bold text-orange-600 uppercase tracking-widest flex items-center gap-2 bg-orange-100 px-3 py-1 rounded-full">
                                    <FileText className="w-3 h-3"/> Full Script & Voiceover
                                </h3>
                                <button 
                                    onClick={() => copyToClipboard(state.storyScript, 'full-script')}
                                    className="text-xs flex items-center gap-1.5 text-zinc-400 hover:text-orange-600 font-bold transition-colors"
                                >
                                    {copiedId === 'full-script' ? <CheckCircle2 className="w-3 h-3 text-green-500"/> : <Copy className="w-3 h-3"/>}
                                    {copiedId === 'full-script' ? 'Copied' : 'Copy Text'}
                                </button>
                            </div>
                            <div className="bg-white/60 p-8 rounded-2xl font-mono text-sm text-zinc-700 whitespace-pre-wrap leading-loose border border-orange-500/10 shadow-inner">
                                {state.storyScript}
                            </div>
                        </GlassCard>
                    )}

                    {/* BACKGROUND MUSIC PROMPT */}
                    {state.backgroundMusic && (
                        <GlassCard hoverEffect className="border-purple-500/20 bg-gradient-to-br from-white to-purple-50/30 animate-fade-in delay-100">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-xs font-bold text-purple-600 uppercase tracking-widest flex items-center gap-2 bg-purple-100 px-3 py-1 rounded-full">
                                    <Music className="w-3 h-3"/> Audio Direction
                                </h3>
                                <button 
                                    onClick={() => copyToClipboard(state.backgroundMusic, 'music-prompt')}
                                    className="text-xs flex items-center gap-1.5 text-zinc-400 hover:text-purple-600 font-bold transition-colors"
                                >
                                    {copiedId === 'music-prompt' ? <CheckCircle2 className="w-3 h-3 text-green-500"/> : <Copy className="w-3 h-3"/>}
                                    {copiedId === 'music-prompt' ? 'Copied' : 'Copy Prompt'}
                                </button>
                            </div>
                            <div className="bg-white/60 p-6 rounded-2xl font-mono text-sm text-zinc-700 whitespace-pre-wrap leading-relaxed border border-purple-500/10 shadow-inner">
                                {state.backgroundMusic}
                            </div>
                        </GlassCard>
                    )}

                    {/* CHARACTERS SECTION */}
                    {state.studioCharacters.length > 0 && (
                        <div className="animate-fade-in delay-200 space-y-6">
                            <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2 pl-2">
                                <UserCircle2 className="w-4 h-4"/> Cast of Characters
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                {state.studioCharacters.map((char) => (
                                    <GlassCard key={char.id} className="border-zinc-100 p-4 shadow-lg hover:shadow-xl transition-all duration-300">
                                        <div className="aspect-[3/4] bg-zinc-100 rounded-xl mb-5 overflow-hidden relative group shadow-inner">
                                            {char.imageUrl ? (
                                                <img src={char.imageUrl} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                                            ) : (
                                                <div className="absolute inset-0 flex items-center justify-center bg-zinc-50">
                                                    {char.isGeneratingImage ? (
                                                        <div className="w-8 h-8 border-2 border-orange-500/30 border-t-orange-500 rounded-full animate-spin"></div>
                                                    ) : (
                                                        <User className="w-12 h-12 text-zinc-200"/>
                                                    )}
                                                </div>
                                            )}
                                            
                                            {/* Image Controls Overlay */}
                                            <div className="absolute top-3 right-3 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
                                                <button 
                                                    onClick={() => handleGenerateCharacterImage(char.id, char.visualPrompt, char.aspectRatio, state.studioCharacters)} 
                                                    disabled={char.isGeneratingImage}
                                                    className="p-2.5 bg-white/90 backdrop-blur-md rounded-xl shadow-lg hover:bg-white text-zinc-600 hover:text-orange-600 transition-colors"
                                                >
                                                    <RefreshCcw className={`w-4 h-4 ${char.isGeneratingImage ? 'animate-spin' : ''}`}/>
                                                </button>
                                                {char.imageUrl && (
                                                    <button 
                                                        onClick={() => handleDownloadImage(char.imageUrl!, `character-${char.name.replace(/\s+/g, '-')}`)}
                                                        className="p-2.5 bg-white/90 backdrop-blur-md rounded-xl shadow-lg hover:bg-white text-zinc-600 hover:text-orange-600 transition-colors"
                                                    >
                                                        <Download className="w-4 h-4"/>
                                                    </button>
                                                )}
                                            </div>
                                            <div className="absolute bottom-3 left-3 right-3 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
                                                <select 
                                                    value={char.aspectRatio}
                                                    onChange={(e) => handleCharRatioChange(char.id, e.target.value as AspectRatio)}
                                                    className="w-full text-[10px] bg-white/90 backdrop-blur-md rounded-lg py-2 px-3 border-none outline-none text-zinc-700 font-bold shadow-lg"
                                                >
                                                    {ASPECT_RATIOS.map(r => <option key={r}>{r}</option>)}
                                                </select>
                                            </div>
                                        </div>
                                        
                                        <div className="px-1">
                                            <h4 className="font-bold text-zinc-800 text-base mb-1">{char.name}</h4>
                                            <p className="text-xs text-zinc-500 mb-4 line-clamp-2 leading-relaxed">{char.description}</p>
                                            
                                            <div className="relative group/prompt">
                                                 <div className="bg-zinc-50 p-3 rounded-lg border border-zinc-100 text-[10px] text-zinc-500 font-mono h-24 overflow-y-auto custom-scrollbar group-hover/prompt:border-orange-200 transition-colors">
                                                    {char.visualPrompt}
                                                 </div>
                                                 <button 
                                                    onClick={() => copyToClipboard(char.visualPrompt, `char-${char.id}`)}
                                                    className="absolute bottom-2 right-2 p-1.5 bg-white rounded-md border border-zinc-200 text-zinc-400 hover:text-orange-600 hover:border-orange-200 shadow-sm opacity-0 group-hover/prompt:opacity-100 transition-all"
                                                 >
                                                    {copiedId === `char-${char.id}` ? <CheckCircle2 className="w-3 h-3 text-green-500"/> : <Copy className="w-3 h-3"/>}
                                                 </button>
                                            </div>
                                        </div>
                                    </GlassCard>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* SCENES SECTION */}
                    {state.studioScenes.length > 0 && (
                        <div className="space-y-8 animate-fade-in delay-300">
                            <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2 pl-2 border-t border-zinc-200 pt-8">
                                <Film className="w-4 h-4"/> Scene Breakdown
                            </h3>
                            <div className="space-y-12">
                                {state.studioScenes.map((scene, i) => (
                                    <div key={i} className="relative">
                                        {/* Connector Line */}
                                        {i !== state.studioScenes.length - 1 && (
                                            <div className="absolute left-[20px] lg:left-[calc(33.333%+24px)] top-[100%] h-12 w-px bg-gradient-to-b from-zinc-200 to-transparent z-0 hidden lg:block"></div>
                                        )}
                                        
                                        <GlassCard className="border-white shadow-xl relative z-10 hover:shadow-2xl transition-all duration-500">
                                            <div className="border-b border-zinc-100 pb-4 mb-6 flex justify-between items-center">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-zinc-900 text-white flex items-center justify-center font-bold text-xs shadow-md">
                                                        {scene.id}
                                                    </div>
                                                    <h4 className="text-sm font-bold text-zinc-800 uppercase tracking-wide">
                                                        {scene.title}
                                                    </h4>
                                                </div>
                                                <div className="px-3 py-1 bg-zinc-100 rounded-full text-[10px] font-mono font-bold text-zinc-500">
                                                    {state.studioConfig.sceneDuration} SEC
                                                </div>
                                            </div>
                                            
                                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                                                {/* Left Column: Image Generation */}
                                                <div className="lg:col-span-4">
                                                    <div className="aspect-video bg-zinc-100 rounded-2xl overflow-hidden relative group border border-zinc-200 shadow-inner">
                                                        {scene.imageUrl ? (
                                                            <img src={scene.imageUrl} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                                                        ) : (
                                                            <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-zinc-50">
                                                                {scene.isGeneratingImage ? (
                                                                    <div className="flex flex-col items-center gap-4">
                                                                         <div className="w-10 h-10 border-4 border-orange-500/30 border-t-orange-500 rounded-full animate-spin"></div>
                                                                         <span className="text-[10px] text-zinc-400 font-bold tracking-widest uppercase animate-pulse">Rendering V3.1...</span>
                                                                    </div>
                                                                ) : (
                                                                    <>
                                                                        <ImageIcon className="w-10 h-10 text-zinc-200 mb-4"/>
                                                                        <button 
                                                                            onClick={() => handleGenerateSceneImage(scene.id, scene.visualPrompt, scene.aspectRatio)}
                                                                            className="px-5 py-2.5 bg-white border border-zinc-200 shadow-sm rounded-xl text-xs font-bold text-zinc-600 hover:text-orange-600 hover:border-orange-500/30 transition-all hover:-translate-y-1"
                                                                        >
                                                                            Generate Visualization
                                                                        </button>
                                                                    </>
                                                                )}
                                                            </div>
                                                        )}

                                                        {/* Scene Image Controls */}
                                                        <div className={`absolute top-3 right-3 flex flex-col gap-2 transition-all duration-300 transform ${scene.imageUrl ? 'opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0' : 'opacity-100'}`}>
                                                            {scene.imageUrl && (
                                                                <>
                                                                    <button 
                                                                        onClick={() => handleGenerateSceneImage(scene.id, scene.visualPrompt, scene.aspectRatio)} 
                                                                        disabled={scene.isGeneratingImage}
                                                                        className="p-2.5 bg-white/90 backdrop-blur-md rounded-xl shadow-lg hover:bg-white text-zinc-600 hover:text-orange-600 transition-colors"
                                                                    >
                                                                        <RefreshCcw className={`w-4 h-4 ${scene.isGeneratingImage ? 'animate-spin' : ''}`}/>
                                                                    </button>
                                                                    <button 
                                                                        onClick={() => handleDownloadImage(scene.imageUrl!, `scene-${scene.id}`)}
                                                                        className="p-2.5 bg-white/90 backdrop-blur-md rounded-xl shadow-lg hover:bg-white text-zinc-600 hover:text-orange-600 transition-colors"
                                                                    >
                                                                        <Download className="w-4 h-4"/>
                                                                    </button>
                                                                </>
                                                            )}
                                                        </div>
                                                        
                                                        <div className={`absolute bottom-3 left-3 max-w-[120px] transition-all duration-300 transform ${scene.imageUrl ? 'opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0' : 'opacity-100'}`}>
                                                            <select 
                                                                value={scene.aspectRatio}
                                                                onChange={(e) => handleSceneRatioChange(scene.id, e.target.value as AspectRatio)}
                                                                className="w-full text-[10px] bg-white/90 backdrop-blur-md rounded-lg py-2 px-3 border-none outline-none text-zinc-700 font-bold shadow-lg"
                                                            >
                                                                {ASPECT_RATIOS.map(r => <option key={r}>{r}</option>)}
                                                            </select>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Right Column: Prompts */}
                                                <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                                                    {/* VISUAL PROMPT */}
                                                    <div className="space-y-3 group/panel">
                                                        <div className="flex justify-between items-center px-1">
                                                            <span className="text-[10px] font-bold text-zinc-400 uppercase flex items-center gap-1.5 group-hover/panel:text-orange-600 transition-colors">
                                                                <ImageIcon className="w-3 h-3"/> {t.studio.visuals}
                                                            </span>
                                                            <button 
                                                                onClick={() => copyToClipboard(scene.visualPrompt, `vis-${scene.id}`)}
                                                                className="text-zinc-300 hover:text-zinc-900 transition-colors"
                                                            >
                                                                {copiedId === `vis-${scene.id}` ? <CheckCircle2 className="w-3 h-3 text-green-500"/> : <Copy className="w-3 h-3"/>}
                                                            </button>
                                                        </div>
                                                        <div className="bg-zinc-50 border border-zinc-100 p-4 rounded-2xl h-40 overflow-y-auto custom-scrollbar shadow-inner group-hover/panel:bg-white group-hover/panel:shadow-lg transition-all duration-300">
                                                            <p className="text-xs text-zinc-600 font-mono leading-relaxed">{scene.visualPrompt}</p>
                                                        </div>
                                                    </div>

                                                    {/* VIDEO PROMPT */}
                                                    <div className="space-y-3 group/panel">
                                                        <div className="flex justify-between items-center px-1">
                                                            <span className="text-[10px] font-bold text-zinc-400 uppercase flex items-center gap-1.5 group-hover/panel:text-blue-600 transition-colors">
                                                                <Video className="w-3 h-3"/> {t.studio.videoPrompt}
                                                            </span>
                                                            <button 
                                                                onClick={() => copyToClipboard(scene.videoPrompt || scene.visualPrompt, `vid-${scene.id}`)}
                                                                className="text-zinc-300 hover:text-zinc-900 transition-colors"
                                                            >
                                                                {copiedId === `vid-${scene.id}` ? <CheckCircle2 className="w-3 h-3 text-green-500"/> : <Copy className="w-3 h-3"/>}
                                                            </button>
                                                        </div>
                                                        <div className="bg-zinc-50 border border-zinc-100 p-4 rounded-2xl h-40 overflow-y-auto custom-scrollbar shadow-inner group-hover/panel:bg-white group-hover/panel:shadow-lg transition-all duration-300">
                                                            <p className="text-xs text-zinc-600 font-mono leading-relaxed">{scene.videoPrompt || scene.visualPrompt}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </GlassCard>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

        </div>
      </main>
    </div>
  );
};

export default App;
