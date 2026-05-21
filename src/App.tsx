import React, { useState, useEffect, useRef } from 'react';
import { 
  Sparkles, 
  Upload, 
  Music, 
  Play, 
  Pause, 
  Download, 
  Volume2, 
  VolumeX, 
  Cpu, 
  Sliders, 
  Activity, 
  ImageIcon, 
  Rocket, 
  Video,
  ListRestart,
  RefreshCw,
  Tv,
  Radio,
  SlidersHorizontal
} from 'lucide-react';
import { 
  AutotuneSettings, 
  ScaleType, 
  AlienUniverse, 
  StoryboardScene, 
  UserFootage 
} from './types';
import { 
  JoAlienAudioEngine, 
  midiToNoteName 
} from './utils/audioEngine';
import CosmicCanvas from './components/CosmicCanvas';

// Constants for Musical Key listing
const KEYS = ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'];

export const THEME_STYLES = {
  'hot-pink': {
    name: '💖 Cosmic Magenta',
    text: 'text-[#BF00FF]',
    hoverText: 'hover:text-[#BF00FF]',
    bg: 'bg-[#BF00FF]',
    hoverBg: 'hover:bg-[#BF00FF]/25',
    border: 'border-[#BF00FF]',
    hoverBorder: 'hover:border-[#BF00FF]',
    gradientFrom: 'from-[#BF00FF]',
    shadow: 'shadow-[0_0_15px_rgba(191,0,255,0.4)]',
    neonBorder: 'neon-border-pink',
    color: '#BF00FF'
  },
  'electric-blue': {
    name: '🔵 Cobalt Turquoise',
    text: 'text-[#00F5FF]',
    hoverText: 'hover:text-[#00F5FF]',
    bg: 'bg-[#00F5FF]',
    hoverBg: 'hover:bg-[#00F5FF]/25',
    border: 'border-[#00F5FF]',
    hoverBorder: 'hover:border-[#00F5FF]',
    gradientFrom: 'from-[#00F5FF]',
    shadow: 'shadow-[0_0_15px_rgba(0,245,255,0.4)]',
    neonBorder: 'neon-border-blue',
    color: '#00F5FF'
  },
  'cyber-green': {
    name: '🟢 Acid Alien Green',
    text: 'text-[#39FF14]',
    hoverText: 'hover:text-[#39FF14]',
    bg: 'bg-[#39FF14]',
    hoverBg: 'hover:bg-[#39FF14]/25',
    border: 'border-[#39FF14]',
    hoverBorder: 'hover:border-[#39FF14]',
    gradientFrom: 'from-[#39FF14]',
    shadow: 'shadow-[0_0_15px_rgba(57,255,20,0.4)]',
    neonBorder: 'neon-border-green',
    color: '#39FF14'
  }
};

export const AI_SOUNDTRACK_PRESETS = [
  {
    id: 'cyber-slime-wave',
    name: '🟢 Cyber Slime Wave',
    waveform: 'sawtooth',
    bpm: 120,
    decay: 0.8,
    resonance: 10.0,
    drumStyle: 'space-cyber'
  },
  {
    id: 'delta-orbit-lounge',
    name: '🌌 Delta Orbit Lounge',
    waveform: 'triangle',
    bpm: 90,
    decay: 1.2,
    resonance: 5.0,
    drumStyle: 'cosmic-thud'
  },
  {
    id: 'hyperdrive-laser-core',
    name: '⚡ Hyperdrive Laser Core',
    waveform: 'square',
    bpm: 140,
    decay: 0.4,
    resonance: 12.0,
    drumStyle: 'laser-heavy'
  }
];

export default function App() {
  // Splash greeting banner trigger
  const [showSplash, setShowSplash] = useState<boolean>(true);
  
  // Real-time autotune variables inside state
  const [autotune, setAutotune] = useState<AutotuneSettings>({
    bypass: false,
    key: 'A',
    scale: 'alien',
    correctionSpeed: 85, // Fast (T-Pain)
    correctionAmount: 90,
    pitchShift: 0,
    alienGlowFactor: 30, // Ring Modulation level
    roboticResonance: 40,
  });

  // Audio stream diagnostics
  const [micEnabled, setMicEnabled] = useState<boolean>(false);
  const [micError, setMicError] = useState<string | null>(null);
  const [monitorVocal, setMonitorVocal] = useState<boolean>(false);
  
  // Dynamic vocal diagnostic telemetry state
  const [detectedPitch, setDetectedPitch] = useState<number>(-1);
  const [detectedNoteName, setDetectedNoteName] = useState<string>('---');
  const [quantizedNoteName, setQuantizedNoteName] = useState<string>('---');
  const [pitchShiftRatio, setPitchShiftRatio] = useState<number>(1.0);
  
  // Scrolling Melodyne-style graph data array
  const [pitchHistory, setPitchHistory] = useState<{ rawMidi: number; targetMidi: number; timestamp: number }[]>([]);

  // Generated space music video storyboards
  const [universe, setUniverse] = useState<AlienUniverse>({
    universeName: "JO-ALIEN: SLIME SYMPHONIA",
    bpm: 115,
    key: 'A',
    scale: 'alien',
    vibeColor: '#BF00FF',
    musicPreset: {
      synthWaveform: 'sawtooth',
      decay: 0.7,
      resonance: 8.0,
      drumStyle: 'space-cyber'
    },
    storyboard: [
      {
        sceneNumber: 1,
        title: "Hyper-drive Ignition",
        visualPrompt: "Cosmic galactic warp tunnels with neon green rays, rotating planetary coordinates.",
        lyricsLine: "WARPING THROUGH THE VELOCITY GAUNTLET... JO_ALIEN IS SPEECHLESS!",
        colorAccent: "#BF00FF",
        particleDensity: 180
      },
      {
        sceneNumber: 2,
        title: "Nebula Synapse",
        visualPrompt: "Abstract nebula cloud pulsating neon pink and turquoise wave beams.",
        lyricsLine: "MY SYNTAX CORRUPTS INTO CHROMATIC LIGHT... RECORDING IN 4K UHD.",
        colorAccent: "#00F5FF",
        particleDensity: 280
      },
      {
        sceneNumber: 3,
        title: "Slime Grid Rave",
        visualPrompt: "Rotating retro wireframe grid on an infinite horizon, geometric space structures.",
        lyricsLine: "AUTOTUNED VOCALS INTERFERING WITH THE RADIO MATRIX... RIDE THE WAVE!",
        colorAccent: "#39FF14",
        particleDensity: 140
      },
      {
        sceneNumber: 4,
        title: "Black Hole Singularity",
        visualPrompt: "Supermassive black hole devouring iridescent cyan stars and cosmic space dust.",
        lyricsLine: "SINKING INTO THE COSMIC DISSOLVE... TRANSMISSION DISCHARGED!",
        colorAccent: "#00F5FF",
        particleDensity: 450
      }
    ]
  });

  // Storyboard variables
  const [currentSceneIndex, setCurrentSceneIndex] = useState<number>(0);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [promptInput, setPromptInput] = useState<string>('');
  const [genreInput, setGenreInput] = useState<string>('Synthwave');

  // Custom multi-vibrancy design preset state
  const [vibeTheme, setVibeTheme] = useState<'hot-pink' | 'electric-blue' | 'cyber-green'>('hot-pink');
  // AI procedural soundtrack mix selection
  const [selectedAiSoundtrack, setSelectedAiSoundtrack] = useState<string>('cyber-slime-wave');

  // Vocal preset integration modes
  const [vocalPresetMode, setVocalPresetMode] = useState<'natural' | 'tpain' | 'mutant'>('tpain');
  const [presetAiConcept, setPresetAiConcept] = useState<string>('Laser rhythm pixel metropolis');

  // Sequencer beat states
  const [isPlayingSeq, setIsPlayingSeq] = useState<boolean>(false);
  
  // Drag and drop asset lists
  const [userFootage, setUserFootage] = useState<UserFootage[]>([]);
  const [activeFootageId, setActiveFootageId] = useState<string | null>(null);

  // User uploaded audio track variables
  const [userAudio, setUserAudio] = useState<{ url: string | null; name: string | null }>({ url: null, name: null });
  const [userAudioPlaying, setUserAudioPlaying] = useState<boolean>(false);
  const [userAudioVolume, setUserAudioVolume] = useState<number>(50); // 50%
  const userAudioRef = useRef<HTMLAudioElement | null>(null);

  // Exporter variables
  const [showExporter, setShowExporter] = useState<boolean>(false);
  const [exportProgress, setExportProgress] = useState<number>(0);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [exportLog, setExportLog] = useState<string[]>([]);
  const [exportResolution, setExportResolution] = useState<string>('4K'); // '4K' (3840x2160) or '1080p' (1920x1080)
  
  // Real video output binary elements
  const [exportedVideoUrl, setExportedVideoUrl] = useState<string | null>(null);
  const [exportedVideoBlob, setExportedVideoBlob] = useState<Blob | null>(null);
  const [copiedPlatform, setCopiedPlatform] = useState<string | null>(null);
  const [selectedSocial, setSelectedSocial] = useState<string | null>(null);

  // Hardware telemetry indicators
  const [cpuUsage, setCpuUsage] = useState<number>(24);
  const [gpuUsage, setGpuUsage] = useState<number>(86);

  // Quick Preset tags
  const QUICK_SECTORS = [
    "Slime Lagoon Acid Disco",
    "Nebula Supernova Explosion",
    "Asteroid Belt Cyber Laser Portal",
    "Iridescent Hyperlane Grid"
  ];

  // Ref audio engines
  const audioEngineRef = useRef<JoAlienAudioEngine | null>(null);
  const exporterRef = useRef<((resolution: '4K' | '1080p') => Promise<Blob>) | null>(null);

  // Keep telemetry ticking mock
  useEffect(() => {
    const teleTick = setInterval(() => {
      setCpuUsage(v => Math.max(12, Math.min(65, v + Math.floor(Math.random() * 9) - 4)));
      setGpuUsage(v => Math.max(45, Math.min(99, v + Math.floor(Math.random() * 7) - 3)));
    }, 3000);
    return () => clearInterval(teleTick);
  }, []);

  // Update autotune configurations dynamically as inputs are altered
  useEffect(() => {
    if (audioEngineRef.current) {
      audioEngineRef.current.setSettings(autotune);
    }
  }, [autotune]);

  // Sync Audio engine presets with universe generated content
  useEffect(() => {
    if (audioEngineRef.current) {
      audioEngineRef.current.setSynthPreset(
        universe.musicPreset.synthWaveform,
        universe.musicPreset.decay,
        universe.musicPreset.resonance,
        universe.musicPreset.drumStyle
      );
      audioEngineRef.current.updateBpm(universe.bpm);
    }
    // Update key and scale defaults matching AI generation outcome
    setAutotune(prev => ({
      ...prev,
      key: universe.key || 'A',
      scale: universe.scale || 'alien'
    }));
  }, [universe]);

  // Handle active listening events from vocal tracking processes
  useEffect(() => {
    if (micEnabled && audioEngineRef.current) {
      const unsub = audioEngineRef.current.addVoiceListener((freq, target, ratio, midi) => {
        setDetectedPitch(Math.round(freq));
        setPitchShiftRatio(ratio);
        
        if (freq > 0) {
          const rawNote = midiToNoteName(midi);
          setDetectedNoteName(`${rawNote}`);
          
          const targetMidi = Math.round(12 * Math.log2(target / 440) + 69);
          const targetNote = midiToNoteName(targetMidi);
          setQuantizedNoteName(`${targetNote}`);
          
          // Feed Melodic trace histories
          setPitchHistory(prev => {
            const nextList = [...prev, {
              rawMidi: midi,
              targetMidi,
              timestamp: Date.now()
            }];
            if (nextList.length > 60) nextList.shift();
            return nextList;
          });
        } else {
          setDetectedNoteName('---');
          setQuantizedNoteName('---');
        }
      });
      return unsub;
    }
  }, [micEnabled]);

  // Trigger permission setups & unlock Audio Context
  const startSpaceShipJourney = async () => {
    try {
      if (!audioEngineRef.current) {
        audioEngineRef.current = new JoAlienAudioEngine();
      }
      await audioEngineRef.current.init();
      
      setMicEnabled(true);
      setIsPlayingSeq(true);
      setShowSplash(false);
    } catch (err: any) {
      console.warn("Audio Context init fallback. Visuals fully operations.", err);
      setMicError("Microphone hardware blocked or not connected. Entering virtual producer sandbox mode.");
      setShowSplash(false);
    }
  };

  // Enable mic triggers
  const activateVocalMicSensors = async () => {
    try {
      if (!audioEngineRef.current) {
        audioEngineRef.current = new JoAlienAudioEngine();
      }
      await audioEngineRef.current.init();
      setMicEnabled(true);
      setMicError(null);
    } catch {
      setMicError("Sensor connection unsuccessful. Verify device microphone parameters.");
    }
  };

  // Sequencer beat play/pause triggers
  const toggleSequencerSynthBeat = () => {
    if (!audioEngineRef.current) return;
    
    if (isPlayingSeq) {
      audioEngineRef.current.suspend();
      setIsPlayingSeq(false);
    } else {
      audioEngineRef.current.resume();
      setIsPlayingSeq(true);
    }
  };

  // Autotune quick matrix preset setups
  const applyPitchPreset = (preset: 'natural' | 'tpain' | 'mutant') => {
    setVocalPresetMode(preset);
    if (preset === 'tpain') {
      setGenreInput('Synthwave');
      setPromptInput(promptInput || 'Laser-infused pixel rhythm metropolis disco grid');
      setAutotune(prev => ({
        ...prev,
        bypass: false,
        correctionSpeed: 100, // instant snap
        correctionAmount: 100, // rigid quantise
        pitchShift: 0,
        alienGlowFactor: 30,
        roboticResonance: 75
      }));
    } else if (preset === 'natural') {
      setGenreInput('Cosmic-Ambient-Void');
      setPromptInput(promptInput || 'Hyper-harmonic acoustic gravity lines and floating stardust');
      setAutotune(prev => ({
        ...prev,
        bypass: false,
        correctionSpeed: 30, // natural pitch glide
        correctionAmount: 65,
        pitchShift: 0,
        alienGlowFactor: 10,
        roboticResonance: 15
      }));
    } else if (preset === 'mutant') {
      setGenreInput('Cyber-Slime-Core');
      setPromptInput(promptInput || 'Deep cyber slime mutant alien growl void under heavy bass');
      setAutotune(prev => ({
        ...prev,
        bypass: false,
        correctionSpeed: 95,
        correctionAmount: 95,
        pitchShift: -12, // Heavy octave drop
        alienGlowFactor: 85, // Ring mod modulation
        roboticResonance: 90
      }));
    }
  };

  // Synchronize color changes with active cockpit canvas elements
  const selectThemeAndSync = (theme: 'hot-pink' | 'electric-blue' | 'cyber-green') => {
    setVibeTheme(theme);
    const colorHex = THEME_STYLES[theme].color;
    setUniverse(prev => ({
      ...prev,
      vibeColor: colorHex,
      storyboard: prev.storyboard.map((scene, i) => i === currentSceneIndex ? { ...scene, colorAccent: colorHex } : scene)
    }));
  };

  // Connect background soundtrack and configure universe parameters dynamically
  const handleSelectAiSoundtrack = (id: string) => {
    setSelectedAiSoundtrack(id);
    const preset = AI_SOUNDTRACK_PRESETS.find(p => p.id === id);
    if (preset) {
      setUniverse(prev => ({
        ...prev,
        bpm: preset.bpm,
        musicPreset: {
          synthWaveform: preset.waveform as any,
          decay: preset.decay,
          resonance: preset.resonance,
          drumStyle: preset.drumStyle as any
        }
      }));
    }
  };

  // Support both images AND videos in the upload selector!
  const onFootageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const url = URL.createObjectURL(file);
      const randomID = `user-${Date.now()}-${i}`;
      
      const isVideo = file.type.startsWith('video/');
      const asset: UserFootage = {
        id: randomID,
        type: isVideo ? 'video' : 'image',
        url,
        name: file.name,
        intensity: 75
      };

      setUserFootage(prev => [...prev, asset]);
      setActiveFootageId(randomID);
    }
  };

  // User uploaded audio track triggers
  const onAudioUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];
    const url = URL.createObjectURL(file);
    setUserAudio({
      url,
      name: file.name
    });
    setUserAudioPlaying(false);
    
    // Auto-fill prompt concept details based on filename for inspiration
    const cleanName = file.name.replace(/\.[^/.]+$/, "").replace(/[_-]/g, " ");
    setPromptInput(`Galaxy visuals synchronized with soundtrack ${cleanName}`);
  };

  const toggleUserAudioPlay = () => {
    if (!userAudioRef.current) return;
    
    if (audioEngineRef.current && audioEngineRef.current.ctx) {
      audioEngineRef.current.resume();
      audioEngineRef.current.connectAudioElement(userAudioRef.current);
    }
    
    if (userAudioPlaying) {
      userAudioRef.current.pause();
      setUserAudioPlaying(false);
    } else {
      userAudioRef.current.play().then(() => {
        setUserAudioPlaying(true);
        // Turn off synth sequencer dynamically when user plays personal soundtrack
        if (isPlayingSeq && audioEngineRef.current) {
          audioEngineRef.current.suspend();
          setIsPlayingSeq(false);
        }
      }).catch(err => {
        console.warn("User audio play failed:", err);
      });
    }
  };

  const handleUserAudioVolumeChange = (volumeVal: number) => {
    setUserAudioVolume(volumeVal);
    if (audioEngineRef.current) {
      audioEngineRef.current.setUserAudioVolume(volumeVal / 100);
    }
  };

  // Call AI Express endpoint with optional audio timing sync parameters
  const generateSpaceVideoUniverse = async (forcedQuery?: string) => {
    setIsGenerating(true);
    const query = forcedQuery || promptInput || "Slime Space Odyssey";
    
    try {
      const res = await fetch('/api/ai/generate-universe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: query,
          currentGenre: genreInput,
          audioFileName: userAudio.name || undefined
        })
      });

      if (!res.ok) throw new Error("Synthesis sector declined.");
      
      const payload = await res.json();
      if (payload) {
        setUniverse(payload);
        setCurrentSceneIndex(0);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsGenerating(false);
    }
  };

  // Dynamic rendering reports based on progress
  useEffect(() => {
    if (!isExporting) return;
    
    const messages: Record<number, string> = {
      10: "Warping warp starfield vector trails and particle physics...",
      25: "Drawing perspective 3D neon-grid wireframes at horizon vanishing vector...",
      40: "Constructing astronomical celestial alien core sun graphics...",
      55: "Formulating alien facial vectors inside central reactor planet...",
      70: "Blending useruploaded custom image hologram panels on cosmic ellipses...",
      85: "Applying real-time dual spectral audio waves onto visual timeline...",
      95: "Assembling ProRes video frames and aligning metadata codecs...",
    };

    const roundedProgress = Math.floor(exportProgress / 5) * 5;
    if (messages[roundedProgress] && !exportLog.some(log => log.includes(messages[roundedProgress]))) {
      setExportLog(curr => [...curr, `[${exportProgress}%] ${messages[roundedProgress]}`]);
    }
  }, [exportProgress, isExporting]);

  // Compile real 4K / 1080p video file from offscreen canvas recording
  const compile4KVideoExport = async () => {
    if (!exporterRef.current) {
      setExportLog(["⚠️ Error: Inner visual reactor canvas engine is not connected.", "Trigger spaceship sequencer ignition first!"]);
      setShowExporter(true);
      return;
    }

    setIsExporting(true);
    setShowExporter(true);
    setExportProgress(0);
    setExportedVideoUrl(null);
    setExportedVideoBlob(null);
    setSelectedSocial(null);
    setExportLog([
      `Initiating high-fidelity ${exportResolution} rendering shaders...`,
      `Configuring recorder: VP9 High-Profile codec [${exportResolution === '4K' ? '3840x2160' : '1920x1080'} @ 30 FPS]`,
      "Starting sequence capture. Please keep this browser tab active for synchronization..."
    ]);

    try {
      // Trigger actual offscreen canvas rendering loop (exactly 10 seconds)
      const recordBlob = await exporterRef.current(exportResolution as '4K' | '1080p');
      
      const videoUrl = URL.createObjectURL(recordBlob);
      setExportedVideoUrl(videoUrl);
      setExportedVideoBlob(recordBlob);
      setIsExporting(false);
      setExportProgress(100);

      setExportLog(curr => [
        ...curr,
        "[100%] RENDER WORK COMPLETED!",
        "Successfully baked high-efficiency alien visual dynamics with sync autotune parameters.",
        `File size: ${(recordBlob.size / (1024 * 1024)).toFixed(2)} MB.`
      ]);

      // Automatically download standard direct video asset
      const tag = document.createElement('a');
      tag.href = videoUrl;
      tag.download = `jo_alien_world_${exportResolution.toLowerCase()}_${universe.universeName.toLowerCase().replace(/[^a-z0-9]/g, '_')}.webm`;
      document.body.appendChild(tag);
      tag.click();
      document.body.removeChild(tag);

      // Also trigger textual metadata telemetry
      downloadTelemetryFile();
    } catch (err: any) {
      console.error(err);
      setIsExporting(false);
      setExportLog(curr => [...curr, `⚠️ Critical Error: ${err?.message || "Export processing error"}`]);
    }
  };

  // Real download trigger
  const downloadTelemetryFile = () => {
    try {
      const finalLayout = `
=========================================
  Jo_Alien’$ World — 4K TRANSMISSION DETECTED
=========================================
SYSTEM ENGINE BUILD: v9.4.1 // SECURE CONSOLE
COSMIC UNIVERSE ID: ${universe.universeName}
GENRE SYNC: ${genreInput}
BPM SYNCHRONISER: ${universe.bpm}
MASTER TONALITY: ${autotune.key} ${autotune.scale.toUpperCase()}

TUNING SPECIFICATIONS:
- Correction Retune speed: ${autotune.correctionSpeed}ms
- Target Correction Amount: ${autotune.correctionAmount}%
- Pitch Transposition Semitones: ${autotune.pitchShift}
- Alien Ring Mod Vibrato Factor: ${autotune.alienGlowFactor}%
- Robotic Resonance Filter: ${autotune.roboticResonance}Hz

CINEMATIC CLIPS STORYBOARD SEQUENCER:
${universe.storyboard.map(scene => `
[Clip 0${scene.sceneNumber}]: ${scene.title}
- Description prompts: "${scene.visualPrompt}"
- Lyrics subtitled line: "${scene.lyricsLine}"
- Color accent hex: ${scene.colorAccent}
- Warp Star density: ${scene.particleDensity} nodes
`).join('\n')}

ESTIMATED QUALITY SPECIFICATION: 3840 x 2160 (4K Cinema Broadcast format)
MADE IN CLOUD ALIEN STARSHIP SPACE.
=========================================
`;
      const blob = new Blob([finalLayout], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const tag = document.createElement('a');
      tag.href = url;
      tag.download = `jo_alien_4k_engine_${universe.universeName.toLowerCase().replace(/[^a-z0-9]/g, '_')}.txt`;
      document.body.appendChild(tag);
      tag.click();
      document.body.removeChild(tag);
    } catch (e) {
      console.error(e);
    }
  };

  // Mute toggle synthesizer sequencer beats
  const toggleSynthMute = () => {
    if (audioEngineRef.current) {
      const isMuted = monitorVocal; // Toggle monitoring
      setMonitorVocal(!monitorVocal);
    }
  };

  return (
    <div id="spaceship-dashboard" className="relative min-h-screen bg-[#050505] text-white flex flex-col font-sans overflow-hidden cyber-grid select-none">
      
      {/* Hidden background audio playing node */}
      <audio
        ref={userAudioRef}
        src={userAudio.url || undefined}
        className="hidden"
        onEnded={() => setUserAudioPlaying(false)}
      />

      {/* Dynamic crt horizontal line interference overlay */}
      <div className="absolute inset-0 scanlines pointer-events-none z-40 opacity-15"></div>

      {/* BOOT GREETING COVER DIALOG BANNER: FIRE UP THE $PACE $HIP */}
      {showSplash && (
        <div id="alien-ship-landing-gate" className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4">
          <div className="max-w-xl w-full border border-purple-500/50 bg-[#08080c]/90 rounded-3xl p-8 relative overflow-hidden neon-border text-center">
            
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(57,255,20,0.1)_0%,transparent_70%)] animate-pulse"></div>

            <div className="flex justify-center mb-6">
              <div className="relative w-24 h-24 flex items-center justify-center rounded-full border border-[#00F5FF]/30 bg-black">
                <Rocket className="w-12 h-12 text-[#39FF14] animate-bounce" />
                <span className="absolute inset-0 w-full h-full rounded-full border border-dashed border-[#BF00FF]/40 animate-spin"></span>
              </div>
            </div>

            {/* Glowing spaceship headers */}
            <h1 className="text-4xl font-extrabold tracking-tighter uppercase neon-text-pink mb-1">
              Jo_Alien’$ World
            </h1>
            <div className="h-1 w-24 bg-gradient-to-r from-[#BF00FF] via-[#00F5FF] to-[#39FF14] mx-auto mb-6"></div>

            <div className="inline-block border border-cyan-500/30 px-6 py-2 rounded-full mb-6 bg-[#00F5FF]/10 text-[#00F5FF] text-xs font-mono font-bold tracking-widest uppercase animate-pulse">
              🛸 FIRE UP THE $PACE $HIP 🛸
            </div>

            <p className="text-xs text-gray-300 leading-relaxed font-mono mb-8 max-w-sm mx-auto">
              Welcome traveler. Access your system voice sensor and sync dynamic autotune filters with customized visual particle generators.
            </p>

            <button 
              id="activate-starship-engine"
              onClick={startSpaceShipJourney}
              className="w-full h-14 bg-gradient-to-r from-[#BF00FF] to-[#00F5FF] hover:from-[#39FF14] hover:to-[#00F5FF] rounded-xl font-bold uppercase tracking-widest text-[#050505] shadow-[0_0_20px_rgba(0,245,255,0.4)] transition-all transform hover:scale-[1.02] cursor-pointer"
            >
              IGNITE STARSHIP SYSTEM
            </button>

            <p className="text-[10px] font-mono opacity-40 uppercase mt-4">
              JO_ALIEN MULTIVERSAL BEAM v9.4 // STATUS: SHIELD STANDBY
            </p>
          </div>
        </div>
      )}

      {/* TOP STUDIO NAVIGATION HEADER */}
      <header className="h-16 flex items-center justify-between px-6 border-b border-white/10 glass-panel z-10">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-[#BF00FF] to-[#39FF14] flex items-center justify-center font-bold text-[#050505] text-xl">
            🛸
          </div>
          <div className="flex flex-col">
            <h1 className="text-xl font-black tracking-tight uppercase text-transparent bg-clip-text bg-gradient-to-r from-[#BF00FF] to-[#00F5FF]">
              Jo_Alien’$ World
            </h1>
            <span className="text-[9px] font-mono tracking-widest text-[#39FF14] uppercase">FIRE UP THE $PACE $HIP</span>
          </div>
        </div>

        {/* INTERACTIVE NEON PALETTE SELECTOR */}
        <div id="neon-palette-selector" className="hidden md:flex items-center gap-1.5 bg-black/40 p-1 border border-white/5 rounded-lg alien-glow">
          <span className="text-[8px] font-mono text-gray-400 uppercase px-2">NEON VIBE:</span>
          <button
            onClick={() => selectThemeAndSync('hot-pink')}
            className={`px-2.5 py-1 text-[9px] font-mono font-bold tracking-wider rounded uppercase transition-all cursor-pointer ${
              vibeTheme === 'hot-pink'
                ? 'bg-[#BF00FF]/25 border border-[#BF00FF] text-[#BF00FF]'
                : 'bg-transparent border border-transparent text-gray-500 hover:text-white'
            }`}
          >
            💖 HOT PINK
          </button>
          <button
            onClick={() => selectThemeAndSync('electric-blue')}
            className={`px-2.5 py-1 text-[9px] font-mono font-bold tracking-wider rounded uppercase transition-all cursor-pointer ${
              vibeTheme === 'electric-blue'
                ? 'bg-[#00F5FF]/25 border border-[#00F5FF] text-[#00F5FF]'
                : 'bg-transparent border border-transparent text-gray-500 hover:text-white'
            }`}
          >
            🔵 CYBER BLUE
          </button>
          <button
            onClick={() => selectThemeAndSync('cyber-green')}
            className={`px-2.5 py-1 text-[9px] font-mono font-bold tracking-wider rounded uppercase transition-all cursor-pointer ${
              vibeTheme === 'cyber-green'
                ? 'bg-[#39FF14]/25 border border-[#39FF14] text-[#39FF14]'
                : 'bg-transparent border border-transparent text-gray-500 hover:text-white'
            }`}
          >
            🟢 ALIEN GREEN
          </button>
        </div>

        {/* Studio Status indicators */}
        <div className="flex items-center gap-6 text-xs font-mono">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#39FF14] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#39FF14]"></span>
            </span>
            <span className="text-[#39FF14] uppercase tracking-wider text-[10px]">Mic Sync Locked</span>
          </div>
          <div className="px-3 py-1 bg-white/5 border border-purple-500/30 text-purple-300 text-[9px] font-mono tracking-wider uppercase rounded">
            4K RENDERING ACTIVE
          </div>
        </div>
      </header>

      {/* DUAL WORKSPACE PANEL */}
      <main className="flex-1 grid grid-cols-1 lg:grid-cols-12 p-4 gap-4 alien-glow">
        
        {/* SIDEBAR LEFT: INTUITIVE AUTOTUNE CONTROLLERS */}
        <aside className="lg:col-span-5 flex flex-col gap-4">
          <div className="glass-panel rounded-2xl p-5 flex flex-col flex-1 border border-white/10 shadow-2xl relative overflow-hidden">
            
            <div className="absolute top-0 right-0 py-1 px-3 bg-[#BF00FF]/15 border-b border-l border-[#BF00FF]/30 text-[#BF00FF] text-[9px] font-mono rounded-bl">
              DSP AUTOCORE v2
            </div>

            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-[#BF00FF]" />
                <h2 className="text-white text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-1">
                  Pitch Correction Engine
                </h2>
              </div>
              <button 
                onClick={() => setAutotune(prev => ({ ...prev, bypass: !prev.bypass }))}
                className={`px-3 py-1 font-mono text-[10px] uppercase rounded border transition-all cursor-pointer ${
                  autotune.bypass 
                  ? 'border-red-500/50 bg-red-500/10 text-red-400' 
                  : 'border-[#39FF14]/50 bg-[#39FF14]/10 text-[#39FF14]'
                }`}
              >
                {autotune.bypass ? 'Bypassed' : 'Active'}
              </button>
            </div>

            {/* ARTISTIC PRESETS TRIGGER BOARD */}
            <div className="mb-4 bg-white/5 p-3 rounded-lg border border-white/5 space-y-3">
              <span className="text-[10px] font-mono text-gray-300 block uppercase tracking-wide">
                Algorithm Matrix Tuner & Vocal Presets
              </span>
              <div className="grid grid-cols-3 gap-2">
                <button
                  id="vocal-preset-natural"
                  onClick={() => applyPitchPreset('natural')}
                  className={`py-1.5 px-1 font-mono text-[9px] uppercase tracking-wider rounded border text-center transition-all cursor-pointer ${
                    vocalPresetMode === 'natural' || (!autotune.bypass && autotune.correctionSpeed < 50 && autotune.pitchShift === 0)
                    ? 'bg-[#00F5FF]/20 border-[#00F5FF] text-[#00F5FF] shadow-[0_0_10px_rgba(0,245,255,0.25)]'
                    : 'bg-white/5 border-white/10 hover:bg-white/10 text-gray-400'
                  }`}
                  title="Smooth, natural sounding voice alignment parameters"
                >
                  🟢 Natural Tune
                </button>
                <button
                  id="vocal-preset-tpain"
                  onClick={() => applyPitchPreset('tpain')}
                  className={`py-1.5 px-1 font-mono text-[9px] uppercase tracking-wider rounded border text-center transition-all cursor-pointer ${
                    vocalPresetMode === 'tpain' || (autotune.correctionSpeed === 100 && autotune.roboticResonance > 50)
                    ? 'bg-[#BF00FF]/25 border-[#BF00FF] text-[#BF00FF] neon-border'
                    : 'bg-white/5 border-white/10 hover:bg-white/10 text-gray-400'
                  }`}
                  title="Rigid, snappy T-Pain vocal quantiser effect"
                >
                  ✨ T-Pain Snap
                </button>
                <button
                  id="vocal-preset-mutant"
                  onClick={() => applyPitchPreset('mutant')}
                  className={`py-1.5 px-1 font-mono text-[9px] uppercase tracking-wider rounded border text-center transition-all cursor-pointer ${
                    vocalPresetMode === 'mutant' || (autotune.pitchShift === -12 && autotune.alienGlowFactor > 70)
                    ? 'bg-[#39FF14]/25 border-[#39FF14] text-[#39FF14] neon-border-green'
                    : 'bg-white/5 border-white/10 hover:bg-white/10 text-gray-400'
                  }`}
                  title="Heavy transposing ring modulator voice mutation"
                >
                  👽 Alien Growl
                </button>
              </div>

              {/* INTEGRATED AI VIDEO MUSIC GENERATOR TOOL */}
              <div className="mt-3 p-3 bg-black/80 rounded-xl border border-dashed border-[#00F5FF]/30 space-y-3 alien-glow">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-[#00F5FF] animate-pulse" />
                    <span className="text-[10px] font-mono font-bold uppercase text-white tracking-wide">
                      AI Music-Video Sync Tool
                    </span>
                  </div>
                  <span className="text-[8px] font-mono text-[#39FF14] px-1 py-0.5 rounded bg-[#39FF14]/10 uppercase tracking-widest leading-none">
                    {vocalPresetMode.toUpperCase()} MODE
                  </span>
                </div>

                {/* Subtitle / visual prompt description helper */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-[9px] font-mono text-gray-400 uppercase">Visual Space concept prompt</label>
                    <span className="text-[7.5px] font-mono text-purple-400">GenAI Active</span>
                  </div>
                  <textarea
                    rows={2}
                    value={promptInput}
                    onChange={(e) => setPromptInput(e.target.value)}
                    placeholder="E.g., Hyper-warp neon jellyfish clouds spinning inside Saturn disco..."
                    className="w-full bg-black/60 border border-white/10 hover:border-[#00F5FF]/40 rounded-lg p-2 text-[10px] text-white placeholder-gray-600 focus:outline-none focus:border-[#00F5FF] font-sans resize-none"
                  />
                </div>

                {/* Quick select concepts tailored specifically to the active vocal preset */}
                <div>
                  <span className="text-[8px] font-mono text-gray-400 block mb-1 uppercase">Preset theme presets:</span>
                  <div className="flex flex-wrap gap-1">
                    {vocalPresetMode === 'natural' && (
                      <>
                        <button
                          onClick={() => setPromptInput('Ethereal gravity acoustic flow waves with nebula shimmer')}
                          className="py-0.5 px-2 bg-white/5 border border-white/10 rounded text-[7.5px] font-mono hover:border-[#00F5FF]/50 text-gray-300 uppercase"
                        >
                          🌸 Cosmic Ethereal
                        </button>
                        <button
                          onClick={() => setPromptInput('Gravity lines of natural acoustic stars drifting in dark light')}
                          className="py-0.5 px-2 bg-white/5 border border-white/10 rounded text-[7.5px] font-mono hover:border-[#00F5FF]/50 text-gray-300 uppercase"
                        >
                          🕊️ Starry Drift
                        </button>
                      </>
                    )}
                    {vocalPresetMode === 'tpain' && (
                      <>
                        <button
                          onClick={() => setPromptInput('Laser rhythm pixel metropolis with hyper-active disco neon grid')}
                          className="py-0.5 px-2 bg-white/5 border border-white/10 rounded text-[7.5px] font-mono hover:border-[#00F5FF]/50 text-[#BF00FF] uppercase font-bold"
                        >
                          ⚡ Pixel Disco Grid
                        </button>
                        <button
                          onClick={() => setPromptInput('Auto-tuned slime disco with neon-pink lasers and retro cyberpunk bass')}
                          className="py-0.5 px-2 bg-white/5 border border-white/10 rounded text-[7.5px] font-mono hover:border-[#00F5FF]/50 text-[#00F5FF] uppercase font-bold"
                        >
                          🕺 Retro Cyberwave
                        </button>
                      </>
                    )}
                    {vocalPresetMode === 'mutant' && (
                      <>
                        <button
                          onClick={() => setPromptInput('Deep cyber slime mutant alien growl void under heavy synthetic lowpass bass')}
                          className="py-0.5 px-2 bg-white/5 border border-white/10 rounded text-[7.5px] font-mono hover:border-[#39FF14]/50 text-[#39FF14] uppercase font-bold"
                        >
                          🦠 Toxic Slime Void
                        </button>
                        <button
                          onClick={() => setPromptInput('Gargantuan ring modulation space wormhole growler exploding')}
                          className="py-0.5 px-2 bg-white/5 border border-white/10 rounded text-[7.5px] font-mono hover:border-[#39FF14]/50 text-yellow-400 uppercase font-bold"
                        >
                          🪐 Monster Wormhole
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Sound-Editor Mixer: Uploaded Music Track vs Synthbeats */}
                <div className="p-2 rounded-lg bg-white/5 border border-white/5 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[8px] font-mono text-gray-400 uppercase">added background music</span>
                    <span className="text-[10px] font-mono font-bold text-[#00F5FF] uppercase">24-Bit Mix</span>
                  </div>

                  {/* AI Procedural Soundtrack Selector */}
                  <div className="space-y-1 bg-black/40 p-2 rounded-lg border border-white/5">
                    <span className="text-[7.5px] font-mono text-cyan-400 block uppercase">Procedural AI Backing Soundtrack:</span>
                    <div className="grid grid-cols-1 gap-1">
                      {AI_SOUNDTRACK_PRESETS.map((preset) => (
                        <button
                          key={preset.id}
                          id={`soundtrack-${preset.id}`}
                          onClick={() => handleSelectAiSoundtrack(preset.id)}
                          className={`py-1 px-2 font-mono text-[8 rounded] text-[8.5px] text-left uppercase rounded border transition-all cursor-pointer flex justify-between items-center ${
                            selectedAiSoundtrack === preset.id
                              ? 'bg-cyan-500/10 border-cyan-400 text-cyan-300 shadow-[0_0_8px_rgba(0,245,255,0.15)]'
                              : 'bg-transparent border-white/5 hover:bg-white/5 text-gray-400'
                          }`}
                        >
                          <span>{preset.name}</span>
                          <span className="text-[7px] text-gray-500 font-bold">{preset.bpm} BPM</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {userAudio.url ? (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-1 p-1.5 bg-black/40 rounded-md border border-white/5">
                        <div className="min-w-0 flex-1">
                          <p className="text-[9px] font-mono text-gray-300 truncate" title={userAudio.name || ''}>
                            🎵 {userAudio.name}
                          </p>
                        </div>
                        <button
                          onClick={toggleUserAudioPlay}
                          className={`h-6 px-2 flex items-center justify-center rounded-md font-mono text-[8px] font-bold ${
                            userAudioPlaying 
                            ? 'bg-[#39FF14] text-black shadow' 
                            : 'bg-white/15 text-white hover:bg-white/20'
                          }`}
                        >
                          {userAudioPlaying ? 'PAUSE' : 'PLAY'}
                        </button>
                      </div>

                      {/* Soundtrack volume mixer slider */}
                      <div className="space-y-0.5">
                        <div className="flex justify-between text-[7px] font-mono text-gray-400">
                          <span>Music Mix Vol</span>
                          <span>{userAudioVolume}%</span>
                        </div>
                        <input 
                          type="range" 
                          min="0" 
                          max="100" 
                          value={userAudioVolume}
                          onChange={(e) => handleUserAudioVolumeChange(parseInt(e.target.value))}
                          className="w-full accent-[#00F5FF] h-1 bg-white/10 rounded cursor-pointer"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {/* Standard Synth Sequencer button fallback */}
                      <div className="flex items-center justify-between gap-2 p-1 bg-black/20 rounded border border-white/5">
                        <span className="text-[8px] font-mono text-[#39FF14] tracking-wide truncate">
                          {isPlayingSeq ? '🔊 Synth Loop Pulse Active' : '🔇 Synth Loop Suspended'}
                        </span>
                        <button
                          onClick={toggleSequencerSynthBeat}
                          className={`px-2 py-0.5 text-[8px] font-mono font-bold rounded uppercase transition-all ${
                            isPlayingSeq 
                            ? 'bg-red-500/20 text-red-400 border border-red-500/30' 
                            : 'bg-[#39FF14]/20 text-[#39FF14] border border-[#39FF14]/30 hover:bg-[#39FF14]/30'
                          }`}
                        >
                          {isPlayingSeq ? 'Mute' : 'Play'}
                        </button>
                      </div>

                      {/* Fast music file drag-drop selector */}
                      <label className="h-8 w-full border border-dashed border-white/10 hover:border-[#00F5FF]/50 bg-black/40 rounded flex items-center justify-center gap-1.5 cursor-pointer text-[8px] font-mono font-bold text-gray-300 uppercase transition-all">
                        <Upload className="w-3 h-3 text-[#00F5FF]" />
                        <span>Upload Custom Music File</span>
                        <input 
                          type="file" 
                          accept="audio/*" 
                          onChange={onAudioUpload} 
                          className="hidden" 
                        />
                      </label>
                    </div>
                  )}
                </div>

                {/* Direct Video / Image Footage Loader right within the presets */}
                <div className="p-2 rounded-lg bg-white/5 border border-white/5 space-y-1.5">
                  <div className="flex justify-between items-center">
                    <span className="text-[8px] font-mono text-gray-400 uppercase">Uploaded Video & Photo Clips</span>
                    <span className="text-[7.5px] font-mono text-cyan-400 font-bold">{userFootage.length} Loaded</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <label className="h-8 w-1/3 flex flex-col items-center justify-center bg-black/60 border border-white/10 hover:border-[#00F5FF]/40 rounded cursor-pointer text-center text-[7px] font-mono font-black text-gray-400 uppercase">
                      <Upload className="w-2.5 h-2.5 text-[#00F5FF] mb-0.5" />
                      <span>Add Clips</span>
                      <input 
                        type="file" 
                        accept="image/*,video/*" 
                        multiple 
                        onChange={onFootageUpload} 
                        className="hidden" 
                      />
                    </label>

                    {/* Simple horizontal timeline */}
                    <div className="flex-1 overflow-x-auto flex gap-1 py-1 max-h-9 scrollbar-thin">
                      {userFootage.length === 0 ? (
                        <span className="text-[7.5px] font-mono text-gray-600 mt-1 uppercase">No footage uploaded. Drop clips to edit!</span>
                      ) : (
                        userFootage.map(f => (
                          <div 
                            key={f.id}
                            onClick={() => setActiveFootageId(f.id)}
                            className={`h-7 w-7 rounded overflow-hidden relative cursor-pointer flex-shrink-0 transition-all border ${
                              activeFootageId === f.id ? 'border-[#39FF14]' : 'border-white/10'
                            }`}
                          >
                            {f.type === 'video' ? (
                              <div className="w-full h-full relative">
                                <video src={f.url} className="w-full h-full object-cover" muted playsInline />
                                <span className="absolute bottom-0 right-0 bg-[#BF00FF] text-[5px] text-white px-0.5 font-mono line-none">V</span>
                              </div>
                            ) : (
                              <img src={f.url} className="w-full h-full object-cover" alt="asset thumbnail" />
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>

                {/* Action button to compile / render synced video with added music */}
                <button
                  onClick={() => generateSpaceVideoUniverse()}
                  disabled={isGenerating}
                  className="w-full h-8.5 bg-gradient-to-r from-[#00F5FF] to-[#39FF14] hover:scale-[1.02] text-[#050505] font-black uppercase text-[9px] tracking-widest rounded-lg transition-all shadow-[0_0_15px_rgba(57,255,20,0.25)] flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  {isGenerating ? (
                    <div className="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <Sparkles className="w-3 h-3 fill-black text-black" />
                      <span>GENERATE MUSIC VIDEO UNIVERSE</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Scale signature grids */}
            <div className="grid grid-cols-2 gap-3 mb-4 bg-black/40 p-3 rounded-xl border border-white/5">
              <div>
                <label className="text-[9px] font-mono text-gray-400 block mb-1 uppercase">Key Signature</label>
                <select 
                  value={autotune.key} 
                  onChange={(e) => setAutotune(prev => ({ ...prev, key: e.target.value }))}
                  className="w-full bg-black border border-white/10 rounded px-2 py-1 text-xs text-white uppercase focus:outline-none focus:border-[#BF00FF] font-mono"
                >
                  {KEYS.map(k => (
                    <option key={k} value={k}>{k}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[9px] font-mono text-gray-400 block mb-1 uppercase">Symphonic Scale</label>
                <select 
                  value={autotune.scale} 
                  onChange={(e) => setAutotune(prev => ({ ...prev, scale: e.target.value as ScaleType }))}
                  className="w-full bg-black border border-white/10 rounded px-2 py-1 text-xs text-white uppercase focus:outline-none focus:border-[#BF00FF] font-mono"
                >
                  <option value="alien">👽 Alien Whole Tone</option>
                  <option value="minor">🌌 Natural Minor</option>
                  <option value="major">☀️ Natural Major</option>
                  <option value="pentatonic">🎸 Pentatonic Vibe</option>
                  <option value="phrygian">🔥 Phrygian Flame</option>
                </select>
              </div>
            </div>

            {/* REAL MICROPHONE TELEMETRY INPUT GAUGES */}
            <div className="bg-black/80 border border-white/10 rounded-xl p-3 mb-4 font-mono text-xs relative space-y-2">
              <div className="flex items-center justify-between border-b border-white/5 pb-1">
                <span className="text-[9px] text-[#00F5FF]">MIC WAVE DETECTOR STATE:</span>
                <span className={`w-2 h-2 rounded-full ${micEnabled ? 'bg-[#39FF14] animate-pulse' : 'bg-red-500'}`}></span>
              </div>
              
              <div className="grid grid-cols-2 gap-2 text-[10px]">
                <div>
                  <span className="opacity-50">INPUT FREQ:</span> <span className="text-white font-bold">{detectedPitch > 0 ? `${detectedPitch} Hz` : '---'}</span>
                </div>
                <div>
                  <span className="opacity-50">VOICE NOTE:</span> <span className="text-[#BF00FF] font-bold">{detectedPitch > 0 ? detectedNoteName : '---'}</span>
                </div>
                <div>
                  <span className="opacity-50">QUANTIZED NOTE:</span> <span className="text-[#39FF14] font-bold">{detectedPitch > 0 ? quantizedNoteName : '---'}</span>
                </div>
                <div>
                  <span className="opacity-50">PITCH RATIO:</span> <span className="text-[#00F5FF] font-bold">{pitchShiftRatio.toFixed(3)}</span>
                </div>
              </div>

              {micError && (
                <div className="text-[9px] text-yellow-400 font-sans mt-2">
                  ⚠️ {micError}
                </div>
              )}

              {!micEnabled && (
                <div className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center p-3 text-center rounded-xl">
                  <span className="text-[9px] text-[#39FF14] uppercase tracking-wide mb-1.5">Microphone analyzer is standby</span>
                  <button
                    onClick={activateVocalMicSensors}
                    className="bg-[#39FF14]/20 border border-[#39FF14]/50 hover:bg-[#39FF14]/30 text-[#39FF14] text-[9px] uppercase px-3 py-1 rounded cursor-pointer font-bold transition-all"
                  >
                    Connect Sensor Mic
                  </button>
                </div>
              )}
            </div>

            {/* PRECISE REAL-TIME FADERS */}
            <div className="space-y-4 flex-1 overflow-y-auto pr-1">
              {/* CORRECTION VELOCITY */}
              <div>
                <div className="flex justify-between text-[10px] font-mono uppercase mb-1">
                  <span className="text-white">Retune speed / snapping velocity</span>
                  <span className="text-[#39FF14] font-bold">{autotune.correctionSpeed}%</span>
                </div>
                <input 
                  type="range" 
                  min="0" 
                  max="100" 
                  value={autotune.correctionSpeed}
                  onChange={(e) => setAutotune(prev => ({ ...prev, correctionSpeed: parseInt(e.target.value) }))}
                  className="w-full accent-[#39FF14] cursor-pointer"
                />
                <div className="flex justify-between text-[8px] font-mono opacity-50 mt-1">
                  <span>GLIDE (NATURAL)</span>
                  <span>CONSTANT TRANSITION SNAP (T-PAIN)</span>
                </div>
              </div>

              {/* CORRECTION DEPTH */}
              <div>
                <div className="flex justify-between text-[10px] font-mono uppercase mb-1">
                  <span className="text-white">Correction Amount Depth</span>
                  <span className="text-purple-300 font-bold">{autotune.correctionAmount}%</span>
                </div>
                <input 
                  type="range" 
                  min="0" 
                  max="100" 
                  value={autotune.correctionAmount}
                  onChange={(e) => setAutotune(prev => ({ ...prev, correctionAmount: parseInt(e.target.value) }))}
                  className="w-full accent-[#BF00FF] cursor-pointer"
                />
              </div>

              {/* MANUAL TRANSPOSER */}
              <div>
                <div className="flex justify-between text-[10px] font-mono uppercase mb-1">
                  <span className="text-white">Octave shift / pitch transposition</span>
                  <span className="text-[#00F5FF] font-bold">{autotune.pitchShift > 0 ? `+${autotune.pitchShift}` : autotune.pitchShift} Key Semitones</span>
                </div>
                <input 
                  type="range" 
                  min="-12" 
                  max="12" 
                  value={autotune.pitchShift}
                  onChange={(e) => setAutotune(prev => ({ ...prev, pitchShift: parseInt(e.target.value) }))}
                  className="w-full accent-[#00F5FF] cursor-pointer"
                />
              </div>

              {/* HARMONIC GLOW */}
              <div>
                <div className="flex justify-between text-[10px] font-mono uppercase mb-1">
                  <span className="text-white">Vibrato modulator / alien glow factor</span>
                  <span className="text-emerald-300 font-bold">{autotune.alienGlowFactor}%</span>
                </div>
                <input 
                  type="range" 
                  min="0" 
                  max="100" 
                  value={autotune.alienGlowFactor}
                  onChange={(e) => setAutotune(prev => ({ ...prev, alienGlowFactor: parseInt(e.target.value) }))}
                  className="w-full accent-[#39FF14] cursor-pointer"
                />
              </div>

              {/* CYBER RESONANCE */}
              <div>
                <div className="flex justify-between text-[10px] font-mono uppercase mb-1">
                  <span className="text-white">Robotic highpass bandpass filter resonance</span>
                  <span className="text-purple-400 font-bold">{autotune.roboticResonance}%</span>
                </div>
                <input 
                  type="range" 
                  min="0" 
                  max="100" 
                  value={autotune.roboticResonance}
                  onChange={(e) => setAutotune(prev => ({ ...prev, roboticResonance: parseInt(e.target.value) }))}
                  className="w-full accent-[#BF00FF] cursor-pointer"
                />
              </div>

              {/* SPEAKER MONITOR CHECKBOX */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5 mt-2">
                <div className="flex flex-col">
                  <span className="text-[10px] font-mono font-bold uppercase">vocal output monitor play</span>
                  <span className="text-[8px] text-yellow-400 font-mono">Use headphones to bypass sound feedback howling loop</span>
                </div>
                <button
                  onClick={toggleSynthMute}
                  className={`p-2.5 rounded-full transition-all cursor-pointer ${
                    monitorVocal ? 'bg-[#39FF14] text-black shadow-lg shadow-[#39FF14]/30' : 'bg-white/10 text-white hover:bg-white/15'
                  }`}
                >
                  {monitorVocal ? <Volume2 className="w-4.5 h-4.5" /> : <VolumeX className="w-4.5 h-4.5" />}
                </button>
              </div>

              {/* SYNCED USER SOUNDTRACK */}
              <div className="mt-4 p-4 rounded-xl border border-dashed border-[#00F5FF]/30 bg-[#00F5FF]/5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Music className="w-3.5 h-3.5 text-[#00F5FF]" />
                    <span className="text-[10px] font-mono font-bold uppercase text-white tracking-wide">
                      Synced User Soundtrack
                    </span>
                  </div>
                  <span className="text-[8px] font-mono text-cyan-400 uppercase tracking-widest leading-none">
                    4K Auto-Sync
                  </span>
                </div>

                {!userAudio.url ? (
                  <label className="h-11 w-full border border-white/10 hover:border-[#00F5FF]/50 bg-black/60 rounded-lg flex items-center justify-center gap-2 cursor-pointer text-[10px] font-bold uppercase text-white transition-all">
                    <Upload className="w-3.5 h-3.5 text-[#00F5FF] animate-pulse" />
                    <span>Upload Song (MP3/WAV)</span>
                    <input 
                      type="file" 
                      accept="audio/*" 
                      onChange={onAudioUpload} 
                      className="hidden" 
                    />
                  </label>
                ) : (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2 p-2 bg-black/80 rounded-lg border border-white/5">
                      <div className="flex-1 min-w-0">
                        <span className="text-[9px] text-[#39FF14] uppercase tracking-widest font-mono block">AUDIO SYNC READY</span>
                        <p className="text-[10px] font-mono font-bold text-gray-200 truncate pr-1" title={userAudio.name || ''}>
                          🎵 {userAudio.name}
                        </p>
                      </div>
                      <button
                        onClick={toggleUserAudioPlay}
                        className={`h-8 px-2 flex items-center justify-center transition-all cursor-pointer rounded-lg text-[9px] font-mono uppercase font-bold gap-1 ${
                          userAudioPlaying 
                          ? 'bg-[#39FF14] text-black shadow-lg shadow-[#39FF14]/30' 
                          : 'bg-white/10 text-white hover:bg-white/15'
                        }`}
                      >
                        {userAudioPlaying ? (
                          <>
                            <Pause className="w-3 h-3 fill-black text-black" />
                            <span>PAUSE</span>
                          </>
                        ) : (
                          <>
                            <Play className="w-3 h-3 fill-white text-white ml-0.5" />
                            <span>PLAY</span>
                          </>
                        )}
                      </button>
                    </div>

                    {/* VOLUME SLIDER */}
                    <div>
                      <div className="flex justify-between text-[8px] font-mono uppercase mb-1 text-gray-400">
                        <span>Soundtrack Mixing Volume</span>
                        <span>{userAudioVolume}%</span>
                      </div>
                      <input 
                        type="range" 
                        min="0" 
                        max="100" 
                        value={userAudioVolume}
                        onChange={(e) => handleUserAudioVolumeChange(parseInt(e.target.value))}
                        className="w-full accent-[#00F5FF] h-1 bg-white/10 rounded-lg appearance-none cursor-pointer"
                      />
                    </div>

                    <div className="flex justify-between items-center pt-1 border-t border-white/5 text-center">
                      <span className="text-[7px] font-mono text-yellow-400 max-w-[200px] block leading-tight">Synth beats auto-paused during playback</span>
                      <button
                        onClick={() => {
                          setUserAudio({ url: null, name: null });
                          setUserAudioPlaying(false);
                          if (userAudioRef.current) {
                            userAudioRef.current.pause();
                          }
                        }}
                        className="text-[7.5px] font-mono text-pink-400 hover:text-pink-350 uppercase cursor-pointer"
                      >
                        [RESET]
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* REAL-TIME MELODYNE CHROMATIC MAP GRAPH */}
            <div className="mt-4 pt-4 border-t border-white/10">
              <span className="text-[9px] font-mono text-[#00F5FF] block mb-1.5 uppercase tracking-wider">
                Vocal Pitch Alignment trace (Real-time scrolling)
              </span>
              <div className="h-28 bg-black/90 border border-white/5 rounded-xl block relative overflow-hidden">
                
                {/* Horizontal reference lines */}
                <div className="absolute inset-0 flex flex-col justify-between opacity-15 pointer-events-none text-[7px] text-gray-500 font-mono p-1">
                  <div>HIGH PITCH RANGE: (C5 ➔ G5)</div>
                  <div className="border-t border-dashed border-white/30">MEDIUM: (A4 ➔ C4)</div>
                  <div className="border-t border-dashed border-white/30">LOW LEVEL: (E2 ➔ G2)</div>
                </div>

                {/* Draw Scrolling nodes */}
                <div className="absolute inset-0 flex items-center">
                  {pitchHistory.length === 0 ? (
                    <span className="text-[8px] font-mono text-gray-500 mx-auto uppercase">Vocal wave silent. Speak or hum into mic...</span>
                  ) : (
                    <div className="relative w-full h-full flex items-center">
                      {pitchHistory.map((pt, index) => {
                        const cellL = (index / pitchHistory.length) * 100;
                        const rawY = 100 - ((pt.rawMidi - 40) / 40) * 100;
                        const targetY = 100 - ((pt.targetMidi - 40) / 40) * 100;

                        return (
                          <React.Fragment key={index}>
                            {/* Raw voice input graph node */}
                            <span 
                              className="absolute w-1.5 h-1.5 rounded-full bg-red-400 opacity-60"
                              style={{ left: `${cellL}%`, top: `${Math.max(5, Math.min(95, rawY))}%`, transform: 'translate(-50%, -50%)' }}
                            ></span>
                            {/* Aligned target block */}
                            <span 
                              className="absolute w-2.5 h-1 bg-[#39FF14] shadow-[0_0_8px_#39FF14]"
                              style={{ left: `${cellL}%`, top: `${Math.max(5, Math.min(95, targetY))}%`, transform: 'translate(-50%, -50%)' }}
                            ></span>
                          </React.Fragment>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="absolute bottom-1 left-2 bg-black/80 px-2 py-0.5 rounded text-[7px] font-mono text-cyan-400 z-15 border border-cyan-500/20">
                  WAVE MODELER PRO
                </div>
              </div>
            </div>

          </div>
        </aside>

        {/* COLUMN RIGHT: MUSIC VIDEO VIEW & AI PRODUCER ENGINE */}
        <section className="lg:col-span-7 flex flex-col gap-4">
          
          {/* THE SPACE VISUALIZER COMPONENT */}
          <div className="glass-panel rounded-2xl p-4 flex flex-col flex-1 border border-white/10 relative overflow-hidden">
            <div className="absolute top-6 left-6 z-10 flex gap-2">
              <span className="text-[9px] font-mono uppercase bg-black/80 border border-[#00F5FF]/30 px-3 py-1 rounded-full text-cyan-300">
                🛰️ Outer Space Viewport
              </span>
              <span className="text-[9px] font-mono bg-purple-500/20 text-[#BF00FF] border border-[#BF00FF]/40 px-3 py-1 rounded-full font-bold">
                BPM: {universe.bpm}
              </span>
            </div>

            {/* Core HTML5 Canvas Frame wrapper */}
            <div className="flex-1 min-h-[350px] relative rounded-xl overflow-hidden border border-white/5 mb-4">
              <CosmicCanvas
                universe={universe}
                activeSceneIndex={currentSceneIndex}
                userFootage={userFootage}
                analyserIn={audioEngineRef.current?.analyserIn || null}
                analyserOut={audioEngineRef.current?.analyserOut || null}
                pitchShiftRatio={pitchShiftRatio}
                isPlaying={isPlayingSeq || userAudioPlaying}
                isExporting={isExporting}
                onExportProgress={(p) => setExportProgress(p)}
                exporterRef={exporterRef}
              />
            </div>

            {/* INTEGRATED SYNTH BEAT CONTROLS */}
            <div className="bg-black/50 border border-white/5 p-3 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Music className="w-4 h-4 text-[#39FF14]" />
                <span className="text-[10px] font-mono font-bold uppercase text-emerald-400 tracking-wider">
                  Starship Sequencer beats loop
                </span>
              </div>
              
              <div className="flex items-center gap-4">
                <span className="text-[9px] font-mono text-gray-500">PROCEUDURAL HARMONIES PLAYING ACCORDING TO SCALE</span>
                <button
                  onClick={toggleSequencerSynthBeat}
                  className={`h-9 px-5 rounded-lg text-[9px] font-mono uppercase font-bold transition-all cursor-pointer ${
                    isPlayingSeq 
                    ? 'bg-[#39FF14] text-black shadow-lg shadow-[#39FF14]/30' 
                    : 'bg-white/10 text-white hover:bg-white/15'
                  }`}
                >
                  {isPlayingSeq ? '■ STOP LOOP BEATS' : '▶ START DISCO BEATS'}
                </button>
              </div>
            </div>

            {/* FOOTAGE / PICTURE OVERLAY CUSTOMISATION LIST */}
            <div className="mt-4 pt-4 border-t border-white/5 flex flex-wrap items-center justify-between gap-4">
              
              {/* Left uploaded pictures and videos lists */}
              <div className="flex items-center gap-3">
                <div className="flex flex-col">
                  <span className="text-[9px] font-mono text-gray-400 block uppercase">Compose User Footage</span>
                  <label className="h-10 px-4 mt-1 border border-white/20 hover:border-[#00F5FF]/50 bg-white/5 hover:bg-white/10 rounded-lg flex items-center gap-2 cursor-pointer text-[10px] font-bold uppercase text-white transition-all">
                    <Upload className="w-3.5 h-3.5 text-[#00F5FF]" />
                    <span>Upload Footage</span>
                    <input 
                      type="file" 
                      accept="image/*,video/*" 
                      multiple 
                      onChange={onFootageUpload} 
                      className="hidden" 
                    />
                  </label>
                </div>

                {/* User thumbnail list */}
                {userFootage.length > 0 && (
                  <div className="flex items-center gap-2 border-l border-white/10 pl-3 pt-2">
                    {userFootage.map(f => (
                      <div key={f.id} className="relative group">
                        <button
                          onClick={() => setActiveFootageId(activeFootageId === f.id ? null : f.id)}
                          className={`w-10 h-10 rounded-lg overflow-hidden relative cursor-pointer border-2 transition-all ${
                            activeFootageId === f.id 
                            ? 'border-[#00F5FF] scale-105 shadow-[#00F5FF]/30 shadow-lg' 
                            : 'border-white/10 hover:border-white/30'
                          }`}
                        >
                          {f.type === 'video' ? (
                            <div className="w-full h-full relative">
                              <video src={f.url} className="w-full h-full object-cover" muted playsInline />
                              <span className="absolute top-0 right-0 bg-[#BF00FF] text-[6px] text-white px-0.5 rounded font-mono">VID</span>
                            </div>
                          ) : (
                            <img src={f.url} className="w-full h-full object-cover" alt="user asset" />
                          )}
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center text-[7px] font-mono">
                            USE
                          </div>
                        </button>
                        {/* Beats pulsation intensity adjustment slider */}
                        {activeFootageId === f.id && (
                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-black border border-cyan-500/40 p-2 rounded-lg z-30 w-28">
                            <span className="text-[7.5px] font-mono text-gray-300 block uppercase mb-1">Beat scale: {f.intensity}%</span>
                            <input 
                              type="range" 
                              min="20" 
                              max="150" 
                              value={f.intensity}
                              onChange={(e) => {
                                const val = parseInt(e.target.value);
                                setUserFootage(prev => prev.map(item => item.id === f.id ? { ...item, intensity: val } : item));
                              }}
                              className="w-full accent-[#00F5FF]"
                            />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Right current chapter changer */}
              <div className="flex items-center gap-2">
                <span className="text-[9px] font-mono text-gray-400 uppercase">Interactive Scene Chapters:</span>
                <div className="flex gap-1.5">
                  {universe.storyboard.map((scene, index) => (
                    <button
                      key={scene.sceneNumber}
                      onClick={() => setCurrentSceneIndex(index)}
                      className={`w-8 h-8 rounded border font-mono text-xs transition-all cursor-pointer ${
                        currentSceneIndex === index 
                        ? 'bg-[#00F5FF] text-[#050505] font-black border-[#00F5FF]' 
                        : 'bg-white/5 border-white/15 hover:border-white/40 text-white'
                      }`}
                      title={scene.title}
                    >
                      {scene.sceneNumber}
                    </button>
                  ))}
                </div>
              </div>

            </div>

          </div>

          {/* AI SPACE VIDEO COMPILER AND EXPANSION */}
          <div className="glass-panel rounded-2xl p-5 border border-white/10 flex flex-col gap-4 relative">
            
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#00F5FF]" />
                <h3 className="text-white text-xs font-mono font-bold uppercase tracking-wider">
                  AI Space Video generator studio
                </h3>
              </div>
              <span className="text-[8px] font-mono text-[#39FF14] uppercase tracking-widest animate-pulse">
                GEMINI GENAI ACTIVE
              </span>
            </div>

            {/* Prompt input details */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
              <div className="md:col-span-6">
                <label className="text-[9px] font-mono text-gray-400 block mb-1 uppercase">Scy-Fi Space Concept Visual Prompt</label>
                <input 
                  type="text"
                  value={promptInput}
                  onChange={(e) => setPromptInput(e.target.value)}
                  placeholder="E.g., Hyper-warp jellyfish clouds inside Saturn ring disco..."
                  className="w-full bg-black border border-white/10 hover:border-white/20 rounded-lg px-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#00F5FF]"
                />
              </div>

              <div className="md:col-span-3">
                <label className="text-[9px] font-mono text-gray-400 block mb-1 uppercase">Audio/Visual Vibe Theme</label>
                <select
                  value={genreInput}
                  onChange={(e) => setGenreInput(e.target.value)}
                  className="w-full bg-black border border-white/10 rounded-lg px-2 py-2 text-xs text-white focus:outline-none focus:border-[#00F5FF] font-mono"
                >
                  <option value="Synthwave">🎹 Synthwave Retro</option>
                  <option value="Alien-Slam-Funk">🛸 Alien Slam Funk</option>
                  <option value="Cyber-Slime-Core">🟢 Cyber Slime Core</option>
                  <option value="Cosmic-Ambient-Void">🌌 Ambient Void</option>
                </select>
              </div>

              <div className="md:col-span-3">
                <button
                  onClick={() => generateSpaceVideoUniverse()}
                  disabled={isGenerating}
                  className="w-full h-9 bg-[#00F5FF] hover:bg-[#39FF14] text-[#050505] font-black uppercase text-[10px] tracking-widest rounded-lg transition-all shadow-[0_0_12px_rgba(0,245,255,0.25)] flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  {isGenerating ? (
                    <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>GENERATE SCENIOS</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Preset sector warps */}
            <div>
              <span className="text-[9px] font-mono text-gray-400 block mb-1.5 uppercase">Quick-warp Planet sectors</span>
              <div className="flex flex-wrap gap-1.5">
                {QUICK_SECTORS.map(sec => (
                  <button
                    key={sec}
                    onClick={() => {
                      setPromptInput(sec);
                      generateSpaceVideoUniverse(sec);
                    }}
                    className="py-1 px-2.5 bg-white/5 border border-white/10 hover:border-[#00F5FF]/50 hover:bg-white/10 rounded-md text-[8.5px] font-mono text-gray-300 transition-all cursor-pointer"
                  >
                    🚀 {sec}
                  </button>
                ))}
              </div>
            </div>

            {/* Visual breakdown of current chapters */}
            <div className="border-t border-white/5 pt-3">
              <span className="text-[9px] font-mono text-gray-400 block mb-2 uppercase font-bold text-[#00F5FF]">AI STORYBOARD SCENE DETAILS</span>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-2.5">
                {universe.storyboard.map((scene, idx) => (
                  <div
                    key={scene.sceneNumber}
                    onClick={() => setCurrentSceneIndex(idx)}
                    className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
                      currentSceneIndex === idx 
                      ? 'bg-gradient-to-br from-[#BF00FF]/15 to-[#00F5FF]/15 border-[#00F5FF]' 
                      : 'bg-white/5 border-white/5 hover:bg-white/10'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1 text-[8px] font-mono">
                      <span className="text-cyan-400">SCENE 0{scene.sceneNumber}</span>
                      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: scene.colorAccent }}></span>
                    </div>
                    <h4 className="text-[10px] font-bold uppercase truncate text-white">{scene.title}</h4>
                    <p className="text-[8.5px] text-gray-400 leading-tight line-clamp-2 mt-0.5">{scene.visualPrompt}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* 4K EXPORTABLE CONTAINER FOOTER */}
            <div className="border-t border-white/10 pt-4 mt-2 flex flex-wrap items-center justify-between gap-4 bg-white/5 p-4 rounded-xl border border-white/5">
              <div className="flex flex-col gap-1 max-w-md">
                <div className="flex items-center gap-1.5">
                  <Video className="w-4 h-4 text-[#BF00FF]" />
                  <span className="text-xs font-bold uppercase tracking-wider text-white">4K Resolution broadcast Exporter</span>
                </div>
                <p className="text-[9px] font-mono text-gray-400">Ready to render? This builds a high fidelity simulation file containing lyrics synchronization, visual storyboard segments, and presets for downloads.</p>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex flex-col">
                  <span className="text-[8px] font-mono text-gray-400 uppercase mb-1 text-center">Bake Quality</span>
                  <div className="flex rounded-md overflow-hidden border border-white/15">
                    <button 
                      onClick={() => setExportResolution('4K')}
                      className={`px-2 py-1 font-mono text-[9px] transition-all cursor-pointer ${
                        exportResolution === '4K' ? 'bg-[#BF00FF] text-black font-bold' : 'hover:bg-white/5 text-gray-300'
                      }`}
                    >
                      3840x2160 (4K Cinema)
                    </button>
                    <button 
                      onClick={() => setExportResolution('1080p')}
                      className={`px-2 py-1 font-mono text-[9px] transition-all cursor-pointer ${
                        exportResolution === '1080p' ? 'bg-[#BF00FF] text-black font-bold' : 'hover:bg-white/5 text-gray-300'
                      }`}
                    >
                      1920x1080 (HD)
                    </button>
                  </div>
                </div>

                <button
                  onClick={compile4KVideoExport}
                  className="h-10 px-5 bg-[#BF00FF] hover:bg-[#39FF14] text-[#050505] rounded-xl font-bold uppercase text-[10px] tracking-widest hover:shadow-[0_0_15px_rgba(191,0,255,0.4)] transition-all transform hover:scale-[1.02] cursor-pointer"
                >
                  EXPORT 4K BROADCAST
                </button>
              </div>
            </div>

          </div>

        </section>

      </main>

      {/* RENDER TRANSCRIPTION MODAL SCREEN */}
      {showExporter && (
        <div className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="max-w-xl w-full border border-cyan-500/50 bg-[#050508] p-6 rounded-2xl relative overflow-hidden neon-border-cyan my-8">
            
            <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-[#00F5FF]" />
                <span className="text-xs font-mono font-bold text-white uppercase tracking-wider">
                  {exportResolution} Broadcast Sequence compiler
                </span>
              </div>
              <button
                onClick={() => setShowExporter(false)}
                disabled={isExporting}
                className="text-gray-400 hover:text-white text-xs font-mono disabled:opacity-20 cursor-pointer"
              >
                [CLOSE]
              </button>
            </div>

            {/* Video compile spinner */}
            {isExporting && (
              <div className="flex items-center gap-4 bg-white/5 p-4 rounded-xl border border-white/5 mb-4 select-none">
                <div className="w-12 h-12 rounded-full border-2 border-[#BF00FF] border-dashed animate-spin flex items-center justify-center">
                  <div className="w-8 h-8 rounded-full bg-[#00F5FF]/10"></div>
                </div>
                <div className="flex-1">
                  <div className="flex justify-between text-[10px] font-mono mb-1">
                    <span className="text-white uppercase font-bold">WRITING UHD DATA ENVELOPE</span>
                    <span className="text-cyan-400 font-bold">{exportProgress}%</span>
                  </div>
                  <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-[#BF00FF] to-[#00F5FF] shadow-[0_0_10px_#00F5FF]"
                      style={{ width: `${exportProgress}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            )}

            {/* Simulated compiler logging printouts */}
            {isExporting && (
              <div className="h-44 bg-black border border-white/5 p-3 rounded-lg font-mono text-[9.5px] text-[#39FF14] space-y-1 overflow-y-auto select-none">
                <div className="flex justify-between text-[7px] text-gray-500 border-b border-white/5 pb-1 mb-2">
                  <span>SEC LOG TRANSLATIONS v1.2</span>
                  <span>COMPILED FOR: EXPORT_READY</span>
                </div>
                {exportLog.map((log, index) => (
                  <div key={index} className="opacity-90 leading-tight">{log}</div>
                ))}
                <div className="animate-pulse">_ Sifting active matrix layers...</div>
              </div>
            )}

            {/* Live Render Video Player and Sharing Section */}
            {!isExporting && exportedVideoUrl && (
              <div className="space-y-4 animate-fade-in text-left">
                <div className="p-3 bg-[#39FF14]/10 border border-[#39FF14]/30 rounded-xl text-center select-none">
                  <span className="text-xs font-bold text-[#39FF14] uppercase tracking-wide">✨ {exportResolution} BROADCAST COMPILATION SECURED! ✨</span>
                  <p className="text-[9.5px] text-gray-300 font-mono mt-1">Your video file and companion metadata file have successfully generated and downloaded.</p>
                </div>

                {/* Live Video Player Node */}
                <div>
                  <span className="text-[9px] font-mono text-cyan-400 block mb-2 uppercase tracking-wider">🖥️ {exportResolution} High-Res Video Preview Frame:</span>
                  <div className="aspect-video w-full rounded-xl overflow-hidden border border-cyan-500/30 relative bg-black shadow-[0_0_20px_rgba(0,245,255,0.15)]">
                    <video 
                      src={exportedVideoUrl} 
                      controls 
                      autoPlay 
                      loop 
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>

                {/* Direct platform share anchors */}
                <div>
                  <span className="text-[9px] font-mono text-purple-400 block mb-2 uppercase tracking-wider">🚀 DIRECT SHARING OPTIONS:</span>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 select-none">
                    {Object.entries({
                      tiktok: { name: "TikTok", icon: "🎵" },
                      youtube: { name: "Shorts", icon: "📺" },
                      instagram: { name: "Instagram", icon: "📸" },
                      twitter: { name: "X / Twitter", icon: "🐦" },
                    }).map(([key, item]) => (
                      <button
                        key={key}
                        onClick={() => setSelectedSocial(selectedSocial === key ? null : key)}
                        className={`py-2 px-3 bg-white/5 border rounded-xl flex flex-col items-center justify-center gap-1.5 transition-all text-center cursor-pointer ${
                          selectedSocial === key 
                          ? 'border-[#00F5FF] bg-cyan-950/30 text-white shadow-[0_0_15px_rgba(0,245,255,0.2)] scale-105' 
                          : 'border-white/10 text-gray-300 hover:border-white/20'
                        }`}
                      >
                        <span className="text-xl">{item.icon}</span>
                        <span className="text-[9.5px] font-bold font-mono uppercase">{item.name}</span>
                      </button>
                    ))}
                  </div>

                  {/* Native Device Share API (Optional) */}
                  {navigator.share && (
                    <button
                      onClick={async () => {
                        if (!exportedVideoBlob) return;
                        try {
                          const file = new File([exportedVideoBlob], `jo_alien_world_${exportResolution.toLowerCase()}.webm`, { type: 'video/webm' });
                          await navigator.share({
                            files: [file],
                            title: `Jo_Alien - ${universe.universeName}`,
                            text: `Check out my alien autotune tracks in Jo_Alien's World! #JoAlien #Autotune`
                          });
                        } catch (err) {
                          console.warn(err);
                        }
                      }}
                      className="w-full py-2.5 mt-2 bg-gradient-to-r from-purple-600/35 to-cyan-500/35 border border-cyan-500/40 hover:border-[#39FF14]/50 rounded-xl font-mono font-bold uppercase text-[9px] tracking-wide flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                    >
                      📱 Tap to Native Share on Mobile
                    </button>
                  )}
                </div>

                {/* Social Caption details block */}
                {selectedSocial && (
                  <div className="bg-black/80 border border-white/10 rounded-xl p-4 space-y-2 text-xs font-mono animate-fade-in relative shadow-inner">
                    <div className="flex items-center justify-between border-b border-white/5 pb-1.5 select-none">
                      <span className="text-[10px] text-[#00F5FF] font-bold uppercase">Ready Social Draft Post:</span>
                      <span className="text-[8px] text-gray-400 capitalize bg-white/5 px-2 py-0.5 rounded border border-white/10">{selectedSocial} Layout</span>
                    </div>

                    <p className="text-[10px] text-gray-200 leading-normal select-all bg-black border border-white/5 p-2.5 rounded-lg whitespace-pre-wrap select-text selection:bg-cyan-500/40">
                      {selectedSocial === 'tiktok' && `🛸 Dropping autotuned frequencies straight from Jo_Alien’$ World! Engineered in ${exportResolution} resolution. Key: ${universe.key} ${universe.scale.toUpperCase()} at ${universe.bpm} BPM. #JoAlien #T-PainStyle #AutotuneSynth #SpaceMusicVideo`}
                      {selectedSocial === 'youtube' && `👾 Blasting into hyperspace! Space-beat synthesis procedurally synced using advanced alignment vectors. Watch "Jo_Alien: Slime Symphonias" in real-time ${exportResolution} Pro WebM codec! #YouTubeShorts #SpaceSynthwave #VocalCorrection #AlienCore`}
                      {selectedSocial === 'instagram' && `☄️ Quantum space vibes generated in the spaceship command center inside Jo_Alien’$ World. Subtitled line: "${universe.storyboard[currentSceneIndex]?.lyricsLine || 'JO_ALIEN COSMIC BEAM'}" #Reels #HologramVibes #FutureBass #AutotunedVoice`}
                      {selectedSocial === 'twitter' && `🛸 Blasted off in Jo_Alien's World with my customized vocoder tracks! Check out this dynamic ${exportResolution} cinema clip: ${universe.universeName} #JoAlien #AlienVocalCore #SynthwaveSpace`}
                    </p>

                    <div className="flex gap-2 pt-1 select-none">
                      <button
                        onClick={() => {
                          const captionMap: Record<string, string> = {
                            tiktok: `🛸 Dropping autotuned frequencies straight from Jo_Alien’$ World! Engineered in ${exportResolution} resolution. Key: ${universe.key} ${universe.scale.toUpperCase()} at ${universe.bpm} BPM. #JoAlien #T-PainStyle #AutotuneSynth #SpaceMusicVideo`,
                            youtube: `👾 Blasting into hyperspace! Space-beat synthesis procedurally synced using advanced alignment vectors. Watch "Jo_Alien: Slime Symphonias" in real-time ${exportResolution} Pro WebM codec! #YouTubeShorts #SpaceSynthwave #VocalCorrection #AlienCore`,
                            instagram: `☄️ Quantum space vibes generated in the spaceship command center inside Jo_Alien’$ World. Subtitled line: "${universe.storyboard[currentSceneIndex]?.lyricsLine || 'JO_ALIEN COSMIC BEAM'}" #Reels #HologramVibes #FutureBass #AutotunedVoice`,
                            twitter: `🛸 Blasted off in Jo_Alien's World with my customized vocoder tracks! Check out this dynamic ${exportResolution} cinema clip: ${universe.universeName} #JoAlien #AlienVocalCore #SynthwaveSpace`
                          };
                          const text = captionMap[selectedSocial];
                          navigator.clipboard.writeText(text);
                          setCopiedPlatform(selectedSocial);
                          setTimeout(() => setCopiedPlatform(null), 2500);
                        }}
                        className="flex-1 py-2 bg-[#BF00FF] hover:bg-[#39FF14] text-black rounded-lg font-bold uppercase text-[9.5px] tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer hover:shadow-[0_0_15px_rgba(191,0,255,0.3)]"
                      >
                        {copiedPlatform === selectedSocial ? "✅ COPIED TO CLIPBOARD!" : "📋 COPY POST CAPTION"}
                      </button>

                      <button
                        onClick={() => {
                          const links: Record<string, string> = {
                            tiktok: "https://www.tiktok.com/upload",
                            youtube: "https://youtube.com/upload",
                            instagram: "https://instagram.com",
                            twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(`Blasted off in Jo_Alien's World with my autotune tracker! "${universe.universeName}" 🛸👽 #JoAlien #Autotune`)}`
                          };
                          window.open(links[selectedSocial], '_blank', 'noopener,noreferrer');
                        }}
                        className="py-2 px-3 bg-white/10 hover:bg-white/15 border border-white/20 text-white hover:border-[#00F5FF]/50 rounded-lg text-[9.5px] font-bold uppercase font-mono tracking-wider transition-all flex items-center justify-center gap-1 cursor-pointer"
                      >
                        🚀 GO TO PLATFORM
                      </button>
                    </div>
                  </div>
                )}

                {/* Secondary downloads action row */}
                <div className="flex gap-2.5 pt-2 select-none">
                  <button
                    onClick={() => {
                      if (!exportedVideoUrl) return;
                      const tag = document.createElement('a');
                      tag.href = exportedVideoUrl;
                      tag.download = `jo_alien_world_${exportResolution.toLowerCase()}_${universe.universeName.toLowerCase().replace(/[^a-z0-9]/g, '_')}.webm`;
                      document.body.appendChild(tag);
                      tag.click();
                      document.body.removeChild(tag);
                    }}
                    className="flex-1 h-10 bg-[#39FF14] hover:bg-cyan-400 text-black font-black uppercase text-[10px] tracking-widest rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer hover:shadow-[0_0_15px_rgba(57,255,20,0.3)]"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download {exportResolution} Video</span>
                  </button>

                  <button
                    onClick={downloadTelemetryFile}
                    className="py-2 px-4.5 bg-white/10 hover:bg-white/15 border border-white/15 text-gray-300 hover:text-white rounded-xl text-[9px] font-bold uppercase font-mono tracking-wider transition-all flex items-center justify-center gap-1 cursor-pointer"
                  >
                    📝 Companion Log
                  </button>
                </div>
              </div>
            )}

            <div className="flex justify-between items-center text-[8px] font-mono opacity-40 mt-6 uppercase select-none">
              <span>JO_ALIEN MULTI INC © 2026</span>
              <span>TELEMETRY STABLE</span>
            </div>

          </div>
        </div>
      )}

      {/* FOOTER METRICS SYSTEM STATUS BAR */}
      <footer className="h-10 px-6 flex items-center justify-between text-[9px] font-mono opacity-60 border-t border-white/10 glass-panel">
        <div className="flex items-center gap-4">
          <div>CPU LOAD METRICS: <span className="text-[#39FF14] font-bold">{cpuUsage}%</span></div>
          <div className="w-1 bg-white/20 h-2"></div>
          <div>GPU SHADER CAPACITY: <span className="text-[#BF00FF] font-bold">{gpuUsage}%</span></div>
          <div className="w-1 bg-white/20 h-2"></div>
          <div>ESTIMATED REFRESH RATING: <span className="text-[#00F5FF] font-bold">144Hz</span></div>
        </div>
        <div>
          JO_ALIEN AUDIO-VIDEO GRID SYSTEM CONSTRUCT v9.4 // OK
        </div>
      </footer>

    </div>
  );
}
