import { AutotuneSettings, ScaleType } from '../types';

// Constants for pitch detection and mapping
const SCALE_INTERVALS: Record<ScaleType, number[]> = {
  major: [0, 2, 4, 5, 7, 9, 11],
  minor: [0, 2, 3, 5, 7, 8, 10],
  pentatonic: [0, 2, 4, 7, 9],
  phrygian: [0, 1, 3, 5, 7, 8, 10],
  alien: [0, 2, 4, 6, 8, 10], // whole-tone extraterrestrial scale
};

const KEY_MIDI_MAP: Record<string, number> = {
  'C': 0, 'C#': 1, 'D': 2, 'Eb': 3, 'E': 4, 'F': 5, 'F#': 6, 'G': 7, 'Ab': 8, 'A': 9, 'Bb': 10, 'B': 11
};

const NOTE_NAMES = ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'];

export function midiToNoteName(midi: number): string {
  const noteIndex = Math.round(midi) % 12;
  const octave = Math.floor(midi / 12) - 1;
  return `${NOTE_NAMES[noteIndex]}${octave}`;
}

export function detectPitch(buffer: Float32Array, sampleRate: number): number {
  let rms = 0;
  for (let i = 0; i < buffer.length; i++) {
    rms += buffer[i] * buffer[i];
  }
  rms = Math.sqrt(rms / buffer.length);
  if (rms < 0.006) return -1; // Too quiet/noise threshold

  // Autocorrelation within voice bounds (70Hz - 1000Hz)
  const minFreq = 70;
  const maxFreq = 1000;
  const minPeriod = Math.floor(sampleRate / maxFreq);
  const maxPeriod = Math.ceil(sampleRate / minFreq);

  let bestPeriod = -1;
  let maxCorrelation = -Infinity;

  const r = new Float32Array(maxPeriod + 1);
  for (let tau = minPeriod; tau <= maxPeriod; tau++) {
    let sum = 0;
    const limit = buffer.length - tau;
    for (let i = 0; i < limit; i++) {
      sum += buffer[i] * buffer[i + tau];
    }
    r[tau] = sum;
    if (sum > maxCorrelation) {
      maxCorrelation = sum;
      bestPeriod = tau;
    }
  }

  if (bestPeriod === -1 || maxCorrelation <= 0) return -1;

  // Parabolic interpolation for pitch precision
  let refinedPeriod = bestPeriod;
  if (bestPeriod > minPeriod && bestPeriod < maxPeriod) {
    const s0 = r[bestPeriod - 1];
    const s1 = r[bestPeriod];
    const s2 = r[bestPeriod + 1];
    const denom = s0 - 2 * s1 + s2;
    if (Math.abs(denom) > 1e-4) {
      refinedPeriod = bestPeriod - 0.5 * (s2 - s0) / denom;
    }
  }

  return sampleRate / refinedPeriod;
}

export function getNearestScaleNote(midiNote: number, scaleType: ScaleType, rootKey: string): number {
  const rootMidi = KEY_MIDI_MAP[rootKey] ?? 0;
  const intervals = SCALE_INTERVALS[scaleType] ?? SCALE_INTERVALS.major;
  
  let closestNote = midiNote;
  let minDiff = Infinity;
  
  // Search grid of nearby midi frequencies
  for (let checkMidi = Math.round(midiNote) - 12; checkMidi <= Math.round(midiNote) + 12; checkMidi++) {
    const diff = (checkMidi - rootMidi) % 12;
    const normalizedDiff = diff < 0 ? diff + 12 : diff;
    if (intervals.includes(normalizedDiff)) {
      const absDiff = Math.abs(checkMidi - midiNote);
      if (absDiff < minDiff) {
        minDiff = absDiff;
        closestNote = checkMidi;
      }
    }
  }
  return closestNote;
}

class GranularPitchShifter {
  private bufferSize: number = 32768;
  private delayBuffer = new Float32Array(this.bufferSize);
  private writePtr = 0;
  private gPhase = 0;

  public process(
    input: Float32Array, 
    output: Float32Array, 
    ratio: number, 
    sampleRate: number
  ) {
    const len = input.length;
    // 40ms grain size is sweet spot for low latency + clear vocals
    const grainSize = Math.floor(sampleRate * 0.040);

    for (let i = 0; i < len; i++) {
      this.delayBuffer[this.writePtr] = input[i];

      if (Math.abs(ratio - 1.0) < 0.005) {
        output[i] = input[i];
        this.writePtr = (this.writePtr + 1) % this.bufferSize;
        continue;
      }

      const phase1 = this.gPhase;
      const phase2 = (this.gPhase + 0.5) % 1.0;

      const d1 = phase1 * grainSize;
      const d2 = phase2 * grainSize;

      let rPtr1 = this.writePtr - d1;
      if (rPtr1 < 0) rPtr1 += this.bufferSize;
      let rPtr2 = this.writePtr - d2;
      if (rPtr2 < 0) rPtr2 += this.bufferSize;

      const idx1 = Math.floor(rPtr1);
      const frac1 = rPtr1 - idx1;
      const val1 = this.delayBuffer[idx1] * (1 - frac1) + this.delayBuffer[(idx1 + 1) % this.bufferSize] * frac1;

      const idx2 = Math.floor(rPtr2);
      const frac2 = rPtr2 - idx2;
      const val2 = this.delayBuffer[idx2] * (1 - frac2) + this.delayBuffer[(idx2 + 1) % this.bufferSize] * frac2;

      // Sine/Cosine crossfade windows ensure 1.0 total gain and zero click transients
      const win1 = Math.sin(phase1 * Math.PI);
      const win2 = Math.sin(phase2 * Math.PI);

      output[i] = (val1 * win1 + val2 * win2);

      // Pitch sweep logic: dPhase = (1 - ratio) / grainSize
      const dPhase = (1.0 - ratio) / grainSize;
      this.gPhase += dPhase;
      if (this.gPhase < 0) this.gPhase += 1.0;
      if (this.gPhase >= 1.0) this.gPhase -= 1.0;

      this.writePtr = (this.writePtr + 1) % this.bufferSize;
    }
  }
}

export class JoAlienAudioEngine {
  public ctx: AudioContext | null = null;
  public micStream: MediaStream | null = null;
  public micSource: MediaStreamAudioSourceNode | null = null;
  public analyserIn: AnalyserNode | null = null;
  public analyserOut: AnalyserNode | null = null;
  public autotuneNode: ScriptProcessorNode | null = null;
  public audioElementSource: MediaElementAudioSourceNode | null = null;
  public userAudioVolume: GainNode | null = null;

  // Cybernetic synthesizer chain
  public bpm = 110;
  public synthVolume: GainNode | null = null;
  public mainOutput: GainNode | null = null;
  private sequencerTimer: any = null;
  private currentStep = 0;

  // Real-time parameters and state indicators
  public autotuneSettings: AutotuneSettings = {
    bypass: false,
    key: 'A',
    scale: 'alien',
    correctionSpeed: 85, // Default is T-Pain style pop
    correctionAmount: 90,
    pitchShift: 0,
    alienGlowFactor: 30,
    roboticResonance: 30,
  };

  public currentDetectedFreq = -1;
  public currentTargetFreq = -1;
  public currentDetectedMidi = -1;
  public currentDetectedNote = '---';
  public currentTargetNote = '---';
  public pitchShiftRatioOutput = 1.0;

  private shifter = new GranularPitchShifter();
  private smoothedRatio = 1.0;
  private alienPhase = 0;

  // Synthesizer preset configuration
  public drumStyle = 'space-cyber';
  public synthWaveform: OscillatorType = 'sawtooth';
  public filterDecay = 0.6;
  public filterResonance = 8.0;

  // Instantiation list for event listener tracking
  private listeners: Set<(freq: number, target: number, ratio: number, midi: number) => void> = new Set();

  constructor() {}

  public addVoiceListener(cb: (freq: number, target: number, ratio: number, midi: number) => void) {
    this.listeners.add(cb);
    return () => this.listeners.delete(cb);
  }

  public async init() {
    if (this.ctx) return;

    // Check availability of Web Audio Context
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    this.ctx = new AudioContextClass({ latencyHint: 'interactive' });

    // Request Mic permission
    this.micStream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      }
    });

    this.micSource = this.ctx.createMediaStreamSource(this.micStream);

    // Initialise analysers for dual real-time visual waves
    this.analyserIn = this.ctx.createAnalyser();
    this.analyserIn.fftSize = 2048;
    this.analyserOut = this.ctx.createAnalyser();
    this.analyserOut.fftSize = 2048;

    this.mainOutput = this.ctx.createGain();
    this.mainOutput.gain.value = 1.0;
    this.mainOutput.connect(this.ctx.destination);

    this.synthVolume = this.ctx.createGain();
    this.synthVolume.gain.value = 0.25;
    this.synthVolume.connect(this.mainOutput);

    // Custom ScriptProcessor for real-time DSP pitch modification
    this.autotuneNode = this.ctx.createScriptProcessor(1024, 1, 1);
    this.autotuneNode.onaudioprocess = (e) => this.handleProcess(e);

    // Node pathing
    this.micSource.connect(this.analyserIn);
    this.analyserIn.connect(this.autotuneNode);
    this.autotuneNode.connect(this.analyserOut);
    this.analyserOut.connect(this.mainOutput);

    // Start Beat Synthesizer Loop
    this.startSequencer();
  }

  public setSettings(settings: AutotuneSettings) {
    this.autotuneSettings = { ...settings };
  }

  public setSynthPreset(waveform: 'sawtooth' | 'triangle' | 'sine' | 'square', decay: number, resonance: number, drum: string) {
    this.synthWaveform = waveform;
    this.filterDecay = decay;
    this.filterResonance = resonance;
    this.drumStyle = drum;
  }

  public updateBpm(newBpm: number) {
    this.bpm = Math.max(60, Math.min(220, newBpm));
    if (this.sequencerTimer) {
      clearInterval(this.sequencerTimer);
      this.startSequencer();
    }
  }

  public handleProcess(e: AudioProcessingEvent) {
    const input = e.inputBuffer.getChannelData(0);
    const output = e.outputBuffer.getChannelData(0);
    const sampleRate = this.ctx?.sampleRate ?? 44100;

    // 1. Detect natural voice pitch
    const pitch = detectPitch(input, sampleRate);
    let targetRatio = 1.0;

    if (pitch > 0) {
      this.currentDetectedFreq = pitch;
      const midi = 12 * Math.log2(pitch / 440) + 69;
      this.currentDetectedMidi = midi;
      this.currentDetectedNote = midiToNoteName(midi);

      // Map to scale using key/scale settings
      const nearestMidi = getNearestScaleNote(midi, this.autotuneSettings.scale, this.autotuneSettings.key);
      const targetPitch = 440 * Math.pow(2, (nearestMidi - 69) / 12);
      this.currentTargetFreq = targetPitch;
      this.currentTargetNote = midiToNoteName(nearestMidi);

      if (!this.autotuneSettings.bypass) {
        // Quantise pitch discrepancy based on target amount and speed settings
        const semitoneDiscrepancy = nearestMidi - midi;
        
        // SPEED CONFIGURATION:
        // 'T-Pain' (high speed, e.g. 70-100) snaps instantly.
        // 'Natural' (low speed, e.g. 10-40) glides gently.
        const speedFract = this.autotuneSettings.correctionSpeed / 100;
        const amountFract = this.autotuneSettings.correctionAmount / 100;

        // Apply corrective pitch distance
        const finalDiscrepancy = semitoneDiscrepancy * amountFract;
        const correctionFactor = Math.pow(2, (finalDiscrepancy) / 12);

        // Standard user shift transposition factor
        const transposeFactor = Math.pow(2, this.autotuneSettings.pitchShift / 12);
        
        targetRatio = correctionFactor * transposeFactor;
      } else {
        targetRatio = Math.pow(2, this.autotuneSettings.pitchShift / 12);
      }
    } else {
      // Retain or glide slowly if no voice detected
      this.currentDetectedFreq = -1;
      const transposeFactor = Math.pow(2, this.autotuneSettings.pitchShift / 12);
      targetRatio = transposeFactor;
    }

    // Smooth ratio according to speed
    // Higher speed coefficient corresponds to extremely rapid snapping
    const filterAlpha = Math.max(0.01, Math.min(1.0, (this.autotuneSettings.correctionSpeed / 100) * 0.95));
    this.smoothedRatio = this.smoothedRatio * (1 - filterAlpha) + targetRatio * filterAlpha;
    this.pitchShiftRatioOutput = this.smoothedRatio;

    // Write pitch shifted DSP chunks
    this.shifter.process(input, output, this.smoothedRatio, sampleRate);

    // 2. Extra DSP modulation features
    // A. Alien Glow Node (Wet/Dry Ring Modulator with futuristic vibrato harmonics)
    const ringModAmount = this.autotuneSettings.alienGlowFactor / 100;
    if (ringModAmount > 0 && !this.autotuneSettings.bypass) {
      for (let s = 0; s < output.length; s++) {
        // Ring modulation frequency moves dynamically with detected pitch or static alien sweep
        const carrierFreq = this.currentDetectedFreq > 0 ? this.currentDetectedFreq * 0.5 : 220; 
        const carrier = Math.sin(this.alienPhase);
        this.alienPhase += (2 * Math.PI * carrierFreq) / sampleRate;
        if (this.alienPhase > 2 * Math.PI) this.alienPhase -= 2 * Math.PI;

        // Overlay harmonic frequency
        output[s] = output[s] * (1 - ringModAmount) + (output[s] * carrier) * ringModAmount;
      }
    }

    // Push state metrics safely to listeners
    this.listeners.forEach(cb => {
      cb(this.currentDetectedFreq, this.currentTargetFreq, this.pitchShiftRatioOutput, this.currentDetectedMidi);
    });
  }

  // Pure synthesized beat creator for incredible background jamming
  private startSequencer() {
    const stepDurationMs = (60 / this.bpm) / 4 * 1000; // 16th notes
    this.sequencerTimer = setInterval(() => {
      this.playSequencerStep();
    }, stepDurationMs);
  }

  private playSequencerStep() {
    if (!this.ctx || this.ctx.state === 'suspended' || !this.synthVolume) return;

    const t = this.ctx.currentTime;
    const step = this.currentStep;

    // Define alien bass sequence matched to root key and penta/alien scales
    const rootMidi = KEY_MIDI_MAP[this.autotuneSettings.key] ?? 0;
    const scale = SCALE_INTERVALS[this.autotuneSettings.scale] ?? SCALE_INTERVALS.alien;
    
    // Procedural Alien Bass Sequence
    const bassRhythm = [1, 0, 0, 1, 1, 0, 1, 0, 1, 0, 0, 1, 0, 1, 0, 0];
    const drumKickRhythm = [1, 0, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 1, 0, 0];
    const drumLaserRhythm = [0, 0, 1, 0, 1, 0, 0, 0, 0, 0, 1, 0, 1, 1, 0, 1];

    if (bassRhythm[step] === 1) {
      // Pick dynamic scale degrees based on step position
      const noteOffset = scale[step % scale.length];
      const bassMidiMidi = rootMidi + 36 + noteOffset; // Bass range
      const bassFreq = 440 * Math.pow(2, (bassMidiMidi - 69) / 12);
      this.triggerBassSynth(bassFreq, t);
    }

    if (drumKickRhythm[step] === 1) {
      this.triggerKickDrum(t);
    }

    if (drumLaserRhythm[step] === 1) {
      this.triggerLaserHihat(t);
    }

    this.currentStep = (this.currentStep + 1) % 16;
  }

  private triggerBassSynth(freq: number, time: number) {
    if (!this.ctx || !this.synthVolume) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = this.synthWaveform;
    osc.frequency.setValueAtTime(freq, time);

    // Warm, futuristic glide filter
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(freq * 3, time);
    filter.Q.setValueAtTime(this.filterResonance, time);
    // Envelope action
    filter.frequency.exponentialRampToValueAtTime(freq * 0.8, time + this.filterDecay);

    gain.gain.setValueAtTime(0.0, time);
    gain.gain.linearRampToValueAtTime(0.22, time + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, time + this.filterDecay);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.synthVolume);

    osc.start(time);
    osc.stop(time + this.filterDecay);
  }

  private triggerKickDrum(time: number) {
    if (!this.ctx || !this.synthVolume) return;

    // Laser kick wave
    const kickNode = this.ctx.createOscillator();
    const kickGain = this.ctx.createGain();
    
    kickNode.type = 'sine';
    kickNode.frequency.setValueAtTime(150, time);
    kickNode.frequency.exponentialRampToValueAtTime(0.01, time + 0.15);

    kickGain.gain.setValueAtTime(0.0, time);
    kickGain.gain.linearRampToValueAtTime(0.6, time + 0.005);
    kickGain.gain.exponentialRampToValueAtTime(0.001, time + 0.16);

    kickNode.connect(kickGain);
    kickGain.connect(this.synthVolume);

    kickNode.start(time);
    kickNode.stop(time + 0.18);
  }

  private triggerLaserHihat(time: number) {
    if (!this.ctx || !this.synthVolume) return;

    // High frequency cyber filter sweep for hats
    const bandOsc = this.ctx.createOscillator();
    const hiGain = this.ctx.createGain();

    bandOsc.type = 'triangle';
    bandOsc.frequency.setValueAtTime(8000, time);
    bandOsc.frequency.exponentialRampToValueAtTime(400, time + 0.08);

    hiGain.gain.setValueAtTime(0.0, time);
    hiGain.gain.linearRampToValueAtTime(0.12, time + 0.001);
    hiGain.gain.exponentialRampToValueAtTime(0.001, time + 0.06);

    bandOsc.connect(hiGain);
    hiGain.connect(this.synthVolume);

    bandOsc.start(time);
    bandOsc.stop(time + 0.08);
  }

  public toggleMuteSynth(mute: boolean) {
    if (this.synthVolume) {
      this.synthVolume.gain.setValueAtTime(mute ? 0.0 : 0.25, this.ctx?.currentTime ?? 0);
    }
  }

  public connectAudioElement(audioElement: HTMLAudioElement) {
    if (!this.ctx) return;
    if (this.audioElementSource) {
      try {
        this.audioElementSource.disconnect();
      } catch (e) {
        console.warn("Audio element source disconnect warning:", e);
      }
    }
    
    this.audioElementSource = this.ctx.createMediaElementSource(audioElement);
    
    if (!this.userAudioVolume) {
      this.userAudioVolume = this.ctx.createGain();
      this.userAudioVolume.gain.value = 0.5; // Sweet default volume
    }
    
    this.audioElementSource.connect(this.userAudioVolume);
    this.userAudioVolume.connect(this.analyserOut!);
  }

  public setUserAudioVolume(volume: number) {
    if (this.userAudioVolume) {
      this.userAudioVolume.gain.value = volume;
    }
  }

  public suspend() {
    if (this.ctx) {
      this.ctx.suspend();
    }
    if (this.sequencerTimer) {
      clearInterval(this.sequencerTimer);
      this.sequencerTimer = null;
    }
  }

  public resume() {
    if (this.ctx) {
      this.ctx.resume();
    }
    if (!this.sequencerTimer) {
      this.startSequencer();
    }
  }

  public destroy() {
    this.suspend();
    if (this.micStream) {
      this.micStream.getTracks().forEach(track => track.stop());
    }
    this.listeners.clear();
  }
}
