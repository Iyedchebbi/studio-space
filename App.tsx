
import React, { useState, useRef } from 'react';
import { 
  Upload, Image as ImageIcon, Sparkles, Layers, Aperture, 
  Settings, Wand2, Download, Play, Repeat, Shuffle, 
  Monitor, Clapperboard, PenTool, ArrowRight, CheckCircle2,
  Video, Languages, Plus, RefreshCcw, Command,
  Film, Clock, User, Palette, Ratio, Copy, FileText, UserCircle2, Music
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
      flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 w-full group
      ${active 
        ? 'bg-gradient-to-r from-orange-500/20 to-amber-500/10 border border-orange-500/20 text-orange-600' 
        : 'text-zinc-500 hover:bg-black/5 hover:text-zinc-900'}
    `}
  >
    <span className={`${active ? 'text-orange-500' : 'text-zinc-400 group-hover:text-zinc-600'}`}>{icon}</span>
    <span className="font-semibold text-sm tracking-wide">{label}</span>
    {active && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.5)]"></div>}
  </button>
);

const GlassCard: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = "" }) => (
  <div className={`glass-panel rounded-2xl p-6 ${className}`}>{children}</div>
);

// --- MAIN APP ---

const App: React.FC = () => {
  // --- STATE ---
  const [state, setState] = useState<AppState>({
    language: 'en',
    outputFormat: 'normal',
    activeMode: 'ad-creator',
    activeView: 'create',
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

  // --- HANDLERS ---

  const handleReset = () => {
    setState(prev => ({
        ...prev, image: null, generatedSceneImage: null, result: null, analysis: null, studioInput: '', storyScript: '', backgroundMusic: '', studioScenes: [], studioCharacters: [], studioResult: null,
        selectedAdType: [AdType.ProductShowcase], isHybridMode: false,
        studioConfig: { style: 'Hollywood Cinematic', sceneCount: 5, sceneDuration: 5, characterDescription: '' },
        isGenerating: false, isGeneratingScene: false, isAnalyzing: false
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

  // --- RENDER ---

  return (
    <div dir={isRTL ? 'rtl' : 'ltr'} className={`flex h-screen overflow-hidden text-zinc-900 font-sans selection:bg-orange-500/30`}>
      
      {/* SIDEBAR */}
      <aside className="w-64 border-r border-zinc-200 bg-white flex flex-col z-20 shadow-xl">
        <div className="h-20 flex items-center px-6 gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center shadow-lg shadow-orange-500/20">
            <Command className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-lg tracking-tight text-zinc-800">Studio Space</h1>
            <span className="text-[10px] text-zinc-400 font-mono">v3.1 PRO</span>
          </div>
        </div>

        <div className="flex-1 px-4 py-6 space-y-2">
          <div className="px-2 mb-2 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Workspace</div>
          <NavButton active={state.activeMode === 'ad-creator'} icon={<Clapperboard className="w-5 h-5"/>} label={t.modes.adCreator} onClick={() => setState(p => ({...p, activeMode: 'ad-creator'}))} />
          <NavButton active={state.activeMode === 'studio'} icon={<PenTool className="w-5 h-5"/>} label={t.modes.studio} onClick={() => setState(p => ({...p, activeMode: 'studio'}))} />
          
          <div className="px-2 mt-8 mb-2 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Actions</div>
          <button onClick={handleReset} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-zinc-500 hover:bg-black/5 hover:text-zinc-900 transition-all">
             <Plus className="w-5 h-5" /> <span className="text-sm font-medium">{t.newProject}</span>
          </button>
        </div>

        <div className="p-6 border-t border-zinc-200 space-y-4">
            <div className="flex items-center justify-between">
                <button onClick={() => setState(p => ({...p, language: p.language === 'en' ? 'ar' : 'en'}))} className="px-3 py-1 rounded-md bg-black/5 text-xs font-bold text-zinc-500 hover:text-zinc-900 transition-colors">
                    {state.language === 'en' ? 'EN' : 'AR'}
                </button>
            </div>
            <div className="text-center">
                <div className="text-[10px] text-zinc-400 font-medium">{t.footerDev} <span className="text-orange-600 font-bold">{t.footerName}</span></div>
            </div>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 flex flex-col relative overflow-hidden bg-zinc-50">
        {/* HEADER */}
        <header className="h-20 flex items-center justify-between px-8 border-b border-zinc-200 bg-white/80 backdrop-blur-sm z-10">
           <h2 className="text-xl font-bold text-zinc-800">{state.activeMode === 'ad-creator' ? 'Product Ad Synthesis' : 'Storyboard Director'}</h2>
           <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-500/10 border border-green-500/20">
                 <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                 <span className="text-xs font-medium text-green-700">System Online</span>
              </div>
           </div>
        </header>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-8">
            <div className="max-w-[1800px] mx-auto">
                
                {/* --- AD CREATOR MODE --- */}
                {state.activeMode === 'ad-creator' && (
                    <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 h-[calc(100vh-180px)]">
                        {/* LEFT: CONTROLS */}
                        <div className="xl:col-span-4 space-y-6 overflow-y-auto custom-scrollbar pr-2 h-full">
                            
                            {/* UPLOAD */}
                            <GlassCard className="relative group overflow-hidden border-orange-500/10">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="text-sm font-bold text-zinc-700 uppercase tracking-wide flex items-center gap-2"><ImageIcon className="w-4 h-4 text-orange-500"/> Source Asset</h3>
                                    {state.isAnalyzing && <span className="text-xs text-orange-500 animate-pulse">Analyzing...</span>}
                                </div>
                                <div className="relative aspect-video rounded-xl bg-zinc-100 border border-dashed border-zinc-300 hover:border-orange-500/50 transition-colors flex flex-col items-center justify-center overflow-hidden">
                                    <input ref={fileInputRef} type="file" onChange={handleImageUpload} className="absolute inset-0 opacity-0 cursor-pointer z-20" />
                                    {state.image ? (
                                        <img src={state.image} className="w-full h-full object-contain z-10" />
                                    ) : (
                                        <div className="text-center p-6">
                                            <Upload className="w-8 h-8 text-zinc-400 mx-auto mb-3" />
                                            <p className="text-xs text-zinc-500">Drop asset here</p>
                                        </div>
                                    )}
                                </div>
                                {state.analysis && (
                                    <div className="mt-4 pt-4 border-t border-zinc-200 grid grid-cols-2 gap-2 text-[10px]">
                                        <div className="bg-black/5 p-2 rounded text-zinc-600">{state.analysis.category}</div>
                                        <div className="bg-black/5 p-2 rounded flex gap-1">{state.analysis.colors.slice(0,3).map((c,i) => <span key={i} className="w-3 h-3 rounded-full bg-current" style={{color: c}}></span>)}</div>
                                    </div>
                                )}
                            </GlassCard>

                            {/* CONFIGURATION */}
                            <GlassCard>
                                <div className="space-y-6">
                                    <div>
                                        <label className="text-xs font-bold text-zinc-500 uppercase block mb-3">Model & Format</label>
                                        <div className="grid grid-cols-2 gap-3">
                                            <select value={state.selectedModel} onChange={e => setState(p => ({...p, selectedModel: e.target.value as AIModel}))} className="glass-input w-full rounded-lg px-3 py-2 text-sm text-zinc-700"><option>{AIModel.Veo3}</option><option>{AIModel.Sora2}</option><option>{AIModel.Runway}</option></select>
                                            <select value={state.aspectRatio} onChange={e => setState(p => ({...p, aspectRatio: e.target.value as AspectRatio}))} className="glass-input w-full rounded-lg px-3 py-2 text-sm text-zinc-700">{ASPECT_RATIOS.map(r => <option key={r}>{r}</option>)}</select>
                                        </div>
                                        <div className="mt-3">
                                            <label className="text-[10px] font-bold text-zinc-500 uppercase block mb-2">{t.duration} (Sec)</label>
                                            <div className="flex gap-2">
                                                {[5, 10, 15, 30].map(d => (
                                                    <button key={d} onClick={() => setState(p => ({...p, videoDuration: d}))} className={`flex-1 py-1.5 rounded text-xs font-bold border transition-all ${state.videoDuration === d ? 'bg-orange-500 text-white border-orange-500' : 'bg-black/5 border-transparent text-zinc-500 hover:text-zinc-700'}`}>
                                                        {d}s
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div>
                                        <div className="flex justify-between mb-3"><label className="text-xs font-bold text-zinc-500 uppercase">Style</label><button onClick={() => setState(p => ({...p, isHybridMode: !p.isHybridMode}))} className={`text-[10px] px-2 rounded border ${state.isHybridMode ? 'border-orange-500 text-orange-500' : 'border-zinc-300 text-zinc-500'}`}>HYBRID</button></div>
                                        <div className="grid grid-cols-3 gap-2">
                                            {AD_TYPES.slice(0, 6).map(type => (
                                                <button key={type} onClick={() => setState(p => ({...p, selectedAdType: [type]}))} className={`p-2 rounded-lg text-[10px] font-medium border transition-all ${state.selectedAdType.includes(type) ? 'bg-orange-500 text-white border-orange-500' : 'bg-black/5 border-transparent text-zinc-500 hover:bg-black/10'}`}>
                                                    {type.split(' ')[0]}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div>
                                        <label className="text-xs font-bold text-zinc-500 uppercase block mb-3">Refinements</label>
                                        <Slider label="Creativity" value={state.sliders.creativity} onChange={v => setState(p => ({...p, sliders: {...p.sliders, creativity: v}}))} />
                                    </div>
                                </div>
                            </GlassCard>

                            <button onClick={handleGeneratePrompt} disabled={!state.image || state.isGenerating} className={`w-full py-4 rounded-xl font-bold text-sm tracking-widest uppercase transition-all shadow-lg shadow-orange-500/20 ${!state.image || state.isGenerating ? 'bg-zinc-200 text-zinc-400' : 'bg-gradient-to-r from-orange-600 to-amber-600 hover:scale-[1.02] text-white'}`}>
                                {state.isGenerating ? 'Compiling...' : 'Generate Master Prompt'}
                            </button>
                        </div>

                        {/* RIGHT: OUTPUT ONLY */}
                        <div className="xl:col-span-8 flex flex-col h-full">
                            <div className="flex-1 glass-panel rounded-2xl h-full border-orange-500/10 overflow-hidden">
                                <ResultPanel result={state.result} loading={state.isGenerating} onRegenerate={handleGeneratePrompt} outputFormat={state.outputFormat} setOutputFormat={f => setState(p => ({...p, outputFormat: f}))} language={state.language} model={state.selectedModel} />
                            </div>
                        </div>
                    </div>
                )}

                {/* --- STUDIO MODE --- */}
                {state.activeMode === 'studio' && (
                    <div className="max-w-6xl mx-auto space-y-8 animate-slide-up pb-24">
                        <div className="text-center space-y-2 py-4">
                            <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-orange-600 to-amber-500">Director's Studio</h2>
                            <p className="text-sm text-zinc-500 max-w-lg mx-auto">Describe your film concept. Gemini 3.0 Pro will script, cast, and storyboard every scene.</p>
                        </div>

                        {/* STUDIO CONFIGURATION BAR */}
                        <GlassCard className="border-orange-500/10">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                                <div>
                                    <label className="text-[10px] font-bold text-zinc-500 uppercase mb-2 block">{t.studio.config.style}</label>
                                    <div className="relative">
                                        <select value={state.studioConfig.style} onChange={e => setState(p => ({...p, studioConfig: {...p.studioConfig, style: e.target.value}}))} className="glass-input w-full rounded-lg px-3 py-2.5 text-sm text-zinc-700 appearance-none">
                                            {STUDIO_STYLES.map(s => <option key={s}>{s}</option>)}
                                        </select>
                                        <Palette className="w-4 h-4 text-zinc-400 absolute right-3 top-3 pointer-events-none"/>
                                    </div>
                                </div>
                                
                                <div>
                                    <label className="text-[10px] font-bold text-zinc-500 uppercase mb-2 block">{t.studio.config.count} ({state.studioConfig.sceneCount})</label>
                                    <input type="range" min="3" max="10" value={state.studioConfig.sceneCount} onChange={e => setState(p => ({...p, studioConfig: {...p.studioConfig, sceneCount: Number(e.target.value)}}))} className="w-full h-2 bg-black/10 rounded-lg appearance-none cursor-pointer accent-orange-500" />
                                </div>

                                <div>
                                    <label className="text-[10px] font-bold text-zinc-500 uppercase mb-2 block">{t.studio.config.duration} ({state.studioConfig.sceneDuration}s)</label>
                                    <div className="flex gap-1">
                                        {[5, 8, 10].map(d => (
                                            <button key={d} onClick={() => setState(p => ({...p, studioConfig: {...p.studioConfig, sceneDuration: d}}))} className={`flex-1 py-2 rounded text-xs font-bold border ${state.studioConfig.sceneDuration === d ? 'bg-orange-500 text-white border-orange-500' : 'bg-black/5 border-transparent text-zinc-500'}`}>
                                                {d}s
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </GlassCard>

                        {/* INPUT AREA WITH ENHANCE */}
                        <div className="relative">
                            <textarea 
                                value={state.studioInput} 
                                onChange={e => setState(p => ({...p, studioInput: e.target.value}))} 
                                placeholder="A futuristic car chase in neon Tokyo..." 
                                className="w-full bg-white border border-zinc-200 rounded-2xl p-6 text-lg text-zinc-800 focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/20 outline-none min-h-[120px] shadow-xl resize-none pr-32" 
                            />
                            
                            <div className="absolute bottom-4 right-4 flex gap-2">
                                <button 
                                    onClick={handleEnhanceIdea}
                                    disabled={state.isEnhancing || !state.studioInput}
                                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold text-xs transition-all flex items-center gap-2 shadow-lg shadow-indigo-500/20"
                                >
                                    {state.isEnhancing ? <Sparkles className="w-3 h-3 animate-spin"/> : <Sparkles className="w-3 h-3"/>} 
                                    Enhance with AI
                                </button>
                                
                                <button 
                                    onClick={handleGenerateStoryboard} 
                                    disabled={state.isGeneratingStory || !state.studioInput} 
                                    className="px-6 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded-xl font-bold text-sm transition-all flex items-center gap-2 shadow-lg shadow-orange-500/20"
                                >
                                    {state.isGeneratingStory ? <Sparkles className="w-4 h-4 animate-spin"/> : <Wand2 className="w-4 h-4"/>} 
                                    Generate Storyboard
                                </button>
                            </div>
                        </div>

                        {/* SCRIPT RESULTS */}
                        {state.storyScript && (
                            <GlassCard className="border-orange-500/20 bg-orange-500/5 animate-fade-in">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="text-sm font-bold text-orange-600 uppercase tracking-widest flex items-center gap-2">
                                        <FileText className="w-4 h-4"/> Full Script & Voiceover
                                    </h3>
                                    <button 
                                        onClick={() => copyToClipboard(state.storyScript, 'full-script')}
                                        className="text-xs flex items-center gap-1 text-orange-600 hover:text-orange-800 font-bold"
                                    >
                                        {copiedId === 'full-script' ? <CheckCircle2 className="w-3 h-3"/> : <Copy className="w-3 h-3"/>}
                                        {copiedId === 'full-script' ? 'Copied' : 'Copy'}
                                    </button>
                                </div>
                                <div className="bg-white/60 p-6 rounded-xl font-mono text-sm text-zinc-700 whitespace-pre-wrap leading-relaxed border border-orange-500/10">
                                    {state.storyScript}
                                </div>
                            </GlassCard>
                        )}

                        {/* BACKGROUND MUSIC PROMPT */}
                        {state.backgroundMusic && (
                            <GlassCard className="border-purple-500/20 bg-purple-500/5 animate-fade-in">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="text-sm font-bold text-purple-600 uppercase tracking-widest flex items-center gap-2">
                                        <Music className="w-4 h-4"/> Background Music Prompt
                                    </h3>
                                    <button 
                                        onClick={() => copyToClipboard(state.backgroundMusic, 'music-prompt')}
                                        className="text-xs flex items-center gap-1 text-purple-600 hover:text-purple-800 font-bold"
                                    >
                                        {copiedId === 'music-prompt' ? <CheckCircle2 className="w-3 h-3"/> : <Copy className="w-3 h-3"/>}
                                        {copiedId === 'music-prompt' ? 'Copied' : 'Copy'}
                                    </button>
                                </div>
                                <div className="bg-white/60 p-6 rounded-xl font-mono text-sm text-zinc-700 whitespace-pre-wrap leading-relaxed border border-purple-500/10">
                                    {state.backgroundMusic}
                                </div>
                            </GlassCard>
                        )}

                        {/* CHARACTERS SECTION */}
                        {state.studioCharacters.length > 0 && (
                            <div className="animate-fade-in space-y-4">
                                <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                                    <UserCircle2 className="w-4 h-4"/> Generated Cast
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {state.studioCharacters.map((char) => (
                                        <GlassCard key={char.id} className="border-zinc-200">
                                            <div className="aspect-[3/4] bg-zinc-100 rounded-lg mb-4 overflow-hidden relative group">
                                                {char.imageUrl ? (
                                                    <img src={char.imageUrl} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                                                ) : (
                                                    <div className="absolute inset-0 flex items-center justify-center">
                                                        {char.isGeneratingImage ? <div className="w-8 h-8 border-4 border-orange-500/30 border-t-orange-500 rounded-full animate-spin"></div> : <User className="w-12 h-12 text-zinc-300"/>}
                                                    </div>
                                                )}
                                                
                                                {/* Image Controls Overlay */}
                                                <div className="absolute top-2 right-2 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button 
                                                        onClick={() => handleGenerateCharacterImage(char.id, char.visualPrompt, char.aspectRatio, state.studioCharacters)} 
                                                        disabled={char.isGeneratingImage}
                                                        className="p-2 bg-white/90 backdrop-blur rounded-lg shadow-sm hover:bg-white text-zinc-600 hover:text-orange-600 transition-colors"
                                                    >
                                                        <RefreshCcw className={`w-4 h-4 ${char.isGeneratingImage ? 'animate-spin' : ''}`}/>
                                                    </button>
                                                    {char.imageUrl && (
                                                        <button 
                                                            onClick={() => handleDownloadImage(char.imageUrl!, `character-${char.name.replace(/\s+/g, '-')}`)}
                                                            className="p-2 bg-white/90 backdrop-blur rounded-lg shadow-sm hover:bg-white text-zinc-600 hover:text-orange-600 transition-colors"
                                                        >
                                                            <Download className="w-4 h-4"/>
                                                        </button>
                                                    )}
                                                </div>
                                                <div className="absolute bottom-2 left-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <select 
                                                        value={char.aspectRatio}
                                                        onChange={(e) => handleCharRatioChange(char.id, e.target.value as AspectRatio)}
                                                        className="w-full text-[10px] bg-white/90 backdrop-blur rounded-md py-1 px-2 border border-zinc-200 outline-none text-zinc-700"
                                                    >
                                                        {ASPECT_RATIOS.map(r => <option key={r}>{r}</option>)}
                                                    </select>
                                                </div>
                                            </div>
                                            
                                            <h4 className="font-bold text-zinc-800 text-sm">{char.name}</h4>
                                            <p className="text-xs text-zinc-500 mb-3 line-clamp-2">{char.description}</p>
                                            
                                            <div className="relative">
                                                 <div className="bg-zinc-50 p-2 rounded border border-zinc-100 text-[10px] text-zinc-600 font-mono h-20 overflow-y-auto custom-scrollbar">
                                                    {char.visualPrompt}
                                                 </div>
                                                 <button 
                                                    onClick={() => copyToClipboard(char.visualPrompt, `char-${char.id}`)}
                                                    className="absolute bottom-2 right-2 p-1 bg-white rounded border border-zinc-200 text-zinc-400 hover:text-orange-600"
                                                 >
                                                    {copiedId === `char-${char.id}` ? <CheckCircle2 className="w-3 h-3 text-green-500"/> : <Copy className="w-3 h-3"/>}
                                                 </button>
                                            </div>
                                        </GlassCard>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* SCENES SECTION */}
                        {state.studioScenes.length > 0 && (
                            <div className="space-y-6 animate-fade-in">
                                <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                                    <Film className="w-4 h-4"/> Scene Breakdown
                                </h3>
                                <div className="space-y-4">
                                    {state.studioScenes.map((scene, i) => (
                                        <GlassCard key={i} className="border-orange-500/5">
                                            <div className="border-b border-zinc-100 pb-3 mb-4 flex justify-between items-center">
                                                <h4 className="text-sm font-bold text-zinc-700 uppercase tracking-widest">
                                                    Scene {scene.id}
                                                </h4>
                                                <div className="px-2 py-1 bg-zinc-100 rounded text-[10px] font-mono text-zinc-500">
                                                    {state.studioConfig.sceneDuration}s
                                                </div>
                                            </div>
                                            
                                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                                                {/* Left Column: Image Generation */}
                                                <div className="lg:col-span-4">
                                                    <div className="aspect-video bg-zinc-100 rounded-xl overflow-hidden relative group border border-zinc-200">
                                                        {scene.imageUrl ? (
                                                            <img src={scene.imageUrl} className="w-full h-full object-cover" />
                                                        ) : (
                                                            <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
                                                                {scene.isGeneratingImage ? (
                                                                    <div className="flex flex-col items-center gap-3">
                                                                         <div className="w-8 h-8 border-4 border-orange-500/30 border-t-orange-500 rounded-full animate-spin"></div>
                                                                         <span className="text-xs text-orange-600 font-medium">Rendering...</span>
                                                                    </div>
                                                                ) : (
                                                                    <>
                                                                        <ImageIcon className="w-8 h-8 text-zinc-300 mb-2"/>
                                                                        <button 
                                                                            onClick={() => handleGenerateSceneImage(scene.id, scene.visualPrompt, scene.aspectRatio)}
                                                                            className="px-4 py-2 bg-white border border-zinc-200 shadow-sm rounded-lg text-xs font-bold text-zinc-600 hover:text-orange-600 hover:border-orange-500/30 transition-all"
                                                                        >
                                                                            Generate Visual
                                                                        </button>
                                                                    </>
                                                                )}
                                                            </div>
                                                        )}

                                                        {/* Scene Image Controls */}
                                                        <div className={`absolute top-2 right-2 flex flex-col gap-2 transition-opacity ${scene.imageUrl ? 'opacity-0 group-hover:opacity-100' : 'opacity-100'}`}>
                                                            {scene.imageUrl && (
                                                                <>
                                                                    <button 
                                                                        onClick={() => handleGenerateSceneImage(scene.id, scene.visualPrompt, scene.aspectRatio)} 
                                                                        disabled={scene.isGeneratingImage}
                                                                        className="p-2 bg-white/90 backdrop-blur rounded-lg shadow-sm hover:bg-white text-zinc-600 hover:text-orange-600 transition-colors"
                                                                    >
                                                                        <RefreshCcw className={`w-4 h-4 ${scene.isGeneratingImage ? 'animate-spin' : ''}`}/>
                                                                    </button>
                                                                    <button 
                                                                        onClick={() => handleDownloadImage(scene.imageUrl!, `scene-${scene.id}`)}
                                                                        className="p-2 bg-white/90 backdrop-blur rounded-lg shadow-sm hover:bg-white text-zinc-600 hover:text-orange-600 transition-colors"
                                                                    >
                                                                        <Download className="w-4 h-4"/>
                                                                    </button>
                                                                </>
                                                            )}
                                                        </div>
                                                        
                                                        <div className={`absolute bottom-2 left-2 max-w-[120px] transition-opacity ${scene.imageUrl ? 'opacity-0 group-hover:opacity-100' : 'opacity-100'}`}>
                                                            <select 
                                                                value={scene.aspectRatio}
                                                                onChange={(e) => handleSceneRatioChange(scene.id, e.target.value as AspectRatio)}
                                                                className="w-full text-[10px] bg-white/90 backdrop-blur rounded-md py-1 px-2 border border-zinc-200 outline-none text-zinc-700 shadow-sm"
                                                            >
                                                                {ASPECT_RATIOS.map(r => <option key={r}>{r}</option>)}
                                                            </select>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Right Column: Prompts */}
                                                <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                                                    {/* VISUAL PROMPT */}
                                                    <div className="space-y-2">
                                                        <div className="flex justify-between items-center">
                                                            <span className="text-[10px] font-bold text-orange-600 uppercase flex items-center gap-1">
                                                                <ImageIcon className="w-3 h-3"/> {t.studio.visuals}
                                                            </span>
                                                            <button 
                                                                onClick={() => copyToClipboard(scene.visualPrompt, `vis-${scene.id}`)}
                                                                className="text-zinc-400 hover:text-orange-600 transition-colors"
                                                            >
                                                                {copiedId === `vis-${scene.id}` ? <CheckCircle2 className="w-3 h-3 text-green-500"/> : <Copy className="w-3 h-3"/>}
                                                            </button>
                                                        </div>
                                                        <div className="bg-zinc-50 border border-zinc-200 p-3 rounded-lg h-32 overflow-y-auto custom-scrollbar">
                                                            <p className="text-xs text-zinc-600 font-mono leading-relaxed">{scene.visualPrompt}</p>
                                                        </div>
                                                    </div>

                                                    {/* VIDEO PROMPT */}
                                                    <div className="space-y-2">
                                                        <div className="flex justify-between items-center">
                                                            <span className="text-[10px] font-bold text-blue-600 uppercase flex items-center gap-1">
                                                                <Video className="w-3 h-3"/> {t.studio.videoPrompt}
                                                            </span>
                                                            <button 
                                                                onClick={() => copyToClipboard(scene.videoPrompt || scene.visualPrompt, `vid-${scene.id}`)}
                                                                className="text-zinc-400 hover:text-blue-600 transition-colors"
                                                            >
                                                                {copiedId === `vid-${scene.id}` ? <CheckCircle2 className="w-3 h-3 text-green-500"/> : <Copy className="w-3 h-3"/>}
                                                            </button>
                                                        </div>
                                                        <div className="bg-zinc-50 border border-zinc-200 p-3 rounded-lg h-32 overflow-y-auto custom-scrollbar">
                                                            <p className="text-xs text-zinc-600 font-mono leading-relaxed">{scene.videoPrompt || scene.visualPrompt}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </GlassCard>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}

            </div>
        </div>
      </main>
    </div>
  );
};

export default App;
