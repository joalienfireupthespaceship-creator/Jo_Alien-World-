export type ScaleType = 'major' | 'minor' | 'pentatonic' | 'alien' | 'phrygian';

export interface AutotuneSettings {
  bypass: boolean;
  key: string;            // 'C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'
  scale: ScaleType;
  correctionSpeed: number; // 0 (slow glide) to 100 (instant T-Pain pop)
  correctionAmount: number; // 0 (dry) to 100 (fully quantised)
  pitchShift: number;      // -12 to +12 (semitones of permanent transposition)
  alienGlowFactor: number; // 0 to 100 (dry/wet of ring modulation / vocal vibrato)
  roboticResonance: number; // 0 to 100 (cyber filter resonance)
}

export interface StoryboardScene {
  sceneNumber: number;
  title: string;
  visualPrompt: string;
  lyricsLine: string;
  colorAccent: string;
  particleDensity: number;
  visualEffectMode?: 'orbit' | 'bg-blend' | 'glitch-ripple' | 'center-mask';
  matchingFootageCue?: string;
}

export interface SynthPreset {
  synthWaveform: 'sawtooth' | 'triangle' | 'sine' | 'square';
  decay: number;       // 0.1 to 1.5s
  resonance: number;   // 1 to 15
  drumStyle: string;   // 'laser-heavy', 'cosmic-thud', 'space-cyber'
}

export interface AlienUniverse {
  universeName: string;
  bpm: number;
  key: string;
  scale: ScaleType;
  vibeColor: string;
  musicPreset: SynthPreset;
  storyboard: StoryboardScene[];
}

export interface UserFootage {
  id: string;
  type: 'image' | 'video';
  url: string;      // Blob URL or Base64
  name: string;
  intensity: number; // 0 - 100 scaling for visual pulsation
}
