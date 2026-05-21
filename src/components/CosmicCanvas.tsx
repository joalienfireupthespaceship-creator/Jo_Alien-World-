import React, { useEffect, useRef, useState } from 'react';
import { AlienUniverse, UserFootage } from '../types';
import { Play, Pause, AlertTriangle } from 'lucide-react';

interface CosmicCanvasProps {
  universe: AlienUniverse;
  activeSceneIndex: number;
  userFootage: UserFootage[];
  analyserIn: AnalyserNode | null;
  analyserOut: AnalyserNode | null;
  pitchShiftRatio: number;
  isPlaying: boolean;
  isExporting: boolean;
  onExportProgress?: (pct: number) => void;
  // Ref to expose high-res recording capability to parent
  exporterRef?: React.MutableRefObject<((resolution: '4K' | '1080p') => Promise<Blob>) | null>;
}

export default function CosmicCanvas({
  universe,
  activeSceneIndex,
  userFootage,
  analyserIn,
  analyserOut,
  pitchShiftRatio,
  isPlaying,
  isExporting,
  exporterRef,
  onExportProgress
}: CosmicCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Create hidden reference wrappers for user videos to draw them frame-by-frame
  const videoElementsRef = useRef<Record<string, HTMLVideoElement>>({});
  // Create hidden reference wrappers for user images to draw them instantly
  const imageElementsRef = useRef<Record<string, HTMLImageElement>>({});

  // Storyboard particle state
  const starsRef = useRef<{ x: number; y: number; z: number; color: string }[]>([]);
  const beatPulseRef = useRef<number>(1.0);
  const rotationAngleRef = useRef<number>(0);

  // Load and cache new videos and images
  useEffect(() => {
    userFootage.forEach(foot => {
      if (foot.type === 'video') {
        if (!videoElementsRef.current[foot.id]) {
          const video = document.createElement('video');
          video.src = foot.url;
          video.crossOrigin = 'anonymous';
          video.loop = true;
          video.muted = true;
          video.playsInline = true;
          video.play().catch(() => {});
          videoElementsRef.current[foot.id] = video;
        }
      } else if (foot.type === 'image') {
        if (!imageElementsRef.current[foot.id]) {
          const img = new Image();
          img.src = foot.url;
          img.crossOrigin = 'anonymous';
          imageElementsRef.current[foot.id] = img;
        }
      }
    });

    // Cleanup stale videos
    Object.keys(videoElementsRef.current).forEach(id => {
      if (!userFootage.find(f => f.id === id)) {
        videoElementsRef.current[id].pause();
        delete videoElementsRef.current[id];
      }
    });
    
    // Cleanup stale images
    Object.keys(imageElementsRef.current).forEach(id => {
      if (!userFootage.find(f => f.id === id)) {
        delete imageElementsRef.current[id];
      }
    });
  }, [userFootage]);

  // Initialise star elements
  useEffect(() => {
    const starCount = 350;
    const items = [];
    const colors = ['#00ffcc', '#ff007f', '#00f0ff', '#ffffff', '#39ff14'];
    for (let i = 0; i < starCount; i++) {
      items.push({
        x: (Math.random() - 0.5) * 2000,
        y: (Math.random() - 0.5) * 2000,
        z: Math.random() * 2000,
        color: colors[Math.floor(Math.random() * colors.length)]
      });
    }
    starsRef.current = items;
  }, []);

  // Main high-performance render loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let frameId: number;
    let lastTime = performance.now();

    // Data arrays for analysers
    const freqData = new Uint8Array(analyserOut ? analyserOut.frequencyBinCount : 256);
    const audioTimeData = new Float32Array(analyserIn ? analyserIn.fftSize : 256);

    const render = (time: number) => {
      const delta = time - lastTime;
      lastTime = time;

      // Extract real-time frequency info
      let volumeFactor = 0.05; // Base pulsation offset
      let voiceAmplitude = 0;

      if (analyserOut) {
        analyserOut.getByteFrequencyData(freqData);
        // Calculate average core bass volume
        let bassSum = 0;
        for (let i = 0; i < 15; i++) bassSum += freqData[i];
        volumeFactor = Math.max(0.05, (bassSum / 15) / 255.0);
      }

      if (analyserIn) {
        analyserIn.getFloatTimeDomainData(audioTimeData);
        let ampSum = 0;
        for (let i = 0; i < audioTimeData.length; i++) {
          ampSum += Math.abs(audioTimeData[i]);
        }
        voiceAmplitude = Math.min(1.0, ampSum / audioTimeData.length * 4); // Boost voice visual amplitude
      }

      // Sync pulse
      beatPulseRef.current = beatPulseRef.current * 0.9 + (1.0 + volumeFactor * 0.8) * 0.1;
      rotationAngleRef.current += 0.003 + (volumeFactor * 0.02);

      const scene = universe.storyboard[activeSceneIndex] || universe.storyboard[0];
      const vibeColor = universe.vibeColor || '#ff0055';
      const sceneAccent = scene?.colorAccent || vibeColor;
      const sceneIdEffect = scene?.visualEffectMode || 'orbit';
      const spotFootage = userFootage && userFootage.length > 0
        ? userFootage[activeSceneIndex % userFootage.length]
        : null;

      // Ensure canvas respects actual container dimensions
      const container = containerRef.current;
      if (container && !isExporting) {
        const dpr = window.devicePixelRatio || 1;
        const rect = container.getBoundingClientRect();
        if (canvas.width !== rect.width * dpr || canvas.height !== rect.height * dpr) {
          canvas.width = rect.width * dpr;
          canvas.height = rect.height * dpr;
          canvas.style.width = '100%';
          canvas.style.height = '100%';
        }
      }

      const w = canvas.width;
      const h = canvas.height;

      // CLEAR CANVAS WITH SPACE RADIAL GRADIENT
      const baseGrad = ctx.createRadialGradient(w/2, h/2, 50, w/2, h/2, Math.max(w, h));
      baseGrad.addColorStop(0, '#090812');
      baseGrad.addColorStop(0.5, '#05040a');
      baseGrad.addColorStop(1, '#000000');
      ctx.fillStyle = baseGrad;
      ctx.fillRect(0, 0, w, h);

      // BACKGROUND OVERLAY VISUAL EFFECT (bg-blend)
      if (sceneIdEffect === 'bg-blend' && spotFootage) {
        ctx.save();
        const img = spotFootage.type === 'image' 
          ? imageElementsRef.current[spotFootage.id] 
          : videoElementsRef.current[spotFootage.id];
        if (img) {
          ctx.globalAlpha = 0.18 + (voiceAmplitude * 0.28); // sync background opacity to real voice levels
          const imgW = (img as any).naturalWidth || (img as any).videoWidth || w;
          const imgH = (img as any).naturalHeight || (img as any).videoHeight || h;
          const scale = Math.max(w / imgW, h / imgH);
          const iw = imgW * scale;
          const ih = imgH * scale;
          ctx.drawImage(img as CanvasImageSource, (w - iw) / 2, (h - ih) / 2, iw, ih);
        }
        ctx.restore();
      }

      // PART 1: DRAW 3D PERSPECTIVE STARFIELD (WARP SPEED EFFECT)
      const starSpeed = isPlaying ? (6.0 + volumeFactor * 25.0) : 1.5;
      ctx.lineWidth = 1.5;
      
      starsRef.current.forEach(star => {
        star.z -= starSpeed;
        if (star.z <= 0) {
          star.z = 2000;
          star.x = (Math.random() - 0.5) * 2000;
          star.y = (Math.random() - 0.5) * 2000;
        }

        // Project 3D points to 2D screen coordinate
        const k = 450 / star.z;
        const px = star.x * k + w / 2;
        const py = star.y * k + h / 2;

        // Draw star trail if moving fast
        if (px >= 0 && px < w && py >= 0 && py < h) {
          const trailLength = isPlaying ? (volumeFactor * 9) : 1;
          const prevK = 450 / (star.z + starSpeed * trailLength);
          const ppx = star.x * prevK + w / 2;
          const ppy = star.y * prevK + h / 2;

          ctx.strokeStyle = star.color;
          ctx.beginPath();
          ctx.moveTo(ppx, ppy);
          ctx.lineTo(px, py);
          ctx.stroke();
        }
      });

      // PART 2: THE 3D RETRO WIREFRAME GEOMETRIC SURREAL HORIZON GRID
      ctx.strokeStyle = `${sceneAccent}2b`; // Transparent scene color
      ctx.lineWidth = 1.0;
      const gridY = h * 0.65; // Horizon height
      
      // Horizontal lines
      const lineCount = 18;
      for (let i = 0; i < lineCount; i++) {
        const ratio = i / lineCount;
        const lineY = gridY + Math.pow(ratio, 2.5) * (h - gridY);
        ctx.beginPath();
        ctx.moveTo(0, lineY);
        ctx.lineTo(w, lineY);
        ctx.stroke();
      }

      // Vertical perspective lines meeting at virtual vanishing point (w/2, gridY)
      const perpLines = 24;
      for (let i = 0; i <= perpLines; i++) {
        const xPos = (i / perpLines) * w;
        ctx.beginPath();
        ctx.moveTo(w / 2, gridY);
        ctx.lineTo(xPos, h);
        ctx.stroke();
      }

      // Horizon line
      ctx.strokeStyle = sceneAccent;
      ctx.shadowBlur = 10;
      ctx.shadowColor = sceneAccent;
      ctx.beginPath();
      ctx.moveTo(0, gridY);
      ctx.lineTo(w, gridY);
      ctx.stroke();
      ctx.shadowBlur = 0; // Reset

      // PART 3: INJECT USER UPLOADED PICTURES OR VIDEOS AS CHOSEN MULTIMEDIA FX
      if (sceneIdEffect === 'orbit') {
        userFootage.forEach((foot, idx) => {
          // Position elements along an ellipse orbit matching user parameters
          const listLen = userFootage.length;
          const angleOffset = (idx / listLen) * Math.PI * 2;
          const orbitAngle = rotationAngleRef.current + angleOffset;
          
          // Orbital projection
          const radiusX = Math.min(w, h) * 0.35 * beatPulseRef.current;
          const radiusY = Math.min(w, h) * 0.12;

          const posX = w / 2 + Math.cos(orbitAngle) * radiusX;
          const posY = h * 0.45 + Math.sin(orbitAngle) * radiusY;

          // Size adapts to voice frequency volume peaks
          const sizeMultiplier = 1.0 + (voiceAmplitude * (foot.intensity / 100));
          const frameW = (w > 800 ? 160 : 100) * sizeMultiplier;
          const frameH = (w > 800 ? 120 : 80) * sizeMultiplier;

          ctx.save();
          
          // Draw futuristic glass-frame border with laser outline matching pitch ratio
          const neonColor = idx % 2 === 0 ? '#ff007f' : '#00ffff';
          ctx.lineWidth = 3.0;
          ctx.strokeStyle = neonColor;
          ctx.shadowBlur = 20;
          ctx.shadowColor = neonColor;
          
          // Slightly rotate each hologram panel
          ctx.translate(posX, posY);
          ctx.rotate(Math.sin(rotationAngleRef.current * 0.5 + idx) * 0.15);

          // Rounded clips for footage glass look
          ctx.beginPath();
          ctx.roundRect(-frameW / 2, -frameH / 2, frameW, frameH, 12);
          ctx.stroke();

          ctx.shadowBlur = 0; // reset shadow index
          ctx.clip();

          // Draw image or video frame
          try {
            if (foot.type === 'video') {
              const vid = videoElementsRef.current[foot.id];
              if (vid && vid.readyState >= 2) {
                ctx.drawImage(vid, -frameW / 2, -frameH / 2, frameW, frameH);
              } else {
                // Video loading glitch effect
                ctx.fillStyle = '#110c1c';
                ctx.fillRect(-frameW / 2, -frameH / 2, frameW, frameH);
                ctx.fillStyle = neonColor;
                ctx.font = '10px sans-serif';
                ctx.fillText('WARPING...', -25, 0);
              }
            } else {
              // Draw cached/pre-loaded Image object
              const img = imageElementsRef.current[foot.id];
              if (img && img.complete) {
                ctx.drawImage(img, -frameW / 2, -frameH / 2, frameW, frameH);
              } else {
                // Graceful loading fallback
                ctx.fillStyle = '#110c1c';
                ctx.fillRect(-frameW / 2, -frameH / 2, frameW, frameH);
                ctx.fillStyle = neonColor;
                ctx.font = '10px sans-serif';
                ctx.fillText('ALIGNED...', -25, 0);
              }
            }
          } catch (err) {
            ctx.fillStyle = '#221111';
            ctx.fillRect(-frameW / 2, -frameH / 2, frameW, frameH);
          }

          // Overlay holographic grid scans
          ctx.fillStyle = 'rgba(0, 240, 255, 0.08)';
          ctx.fillRect(-frameW / 2, -frameH / 2, frameW, frameH);
          
          // Hologram laser sweep lines
          const sweepY = (Math.sin(time * 0.003 + idx) * frameH/2);
          ctx.strokeStyle = 'rgba(0, 255, 100, 0.4)';
          ctx.lineWidth = 1.0;
          ctx.beginPath();
          ctx.moveTo(-frameW / 2, sweepY);
          ctx.lineTo(frameW / 2, sweepY);
          ctx.stroke();

          ctx.restore();
        });
      } else if (sceneIdEffect === 'glitch-ripple') {
        ctx.save();
        // Centered widescreen hologram display
        const frameW = Math.min(w * 0.5, 360) * beatPulseRef.current;
        const frameH = Math.min(h * 0.35, 240) * beatPulseRef.current;
        const posX = w / 2;
        const posY = h * 0.45;

        ctx.translate(posX, posY);

        // Simulated video glitch offset
        if (voiceAmplitude > 0.3) {
          ctx.translate((Math.random() - 0.5) * 12 * voiceAmplitude, (Math.random() - 0.5) * 4);
        }

        ctx.lineWidth = 4.0;
        ctx.strokeStyle = sceneAccent;
        ctx.shadowBlur = 25;
        ctx.shadowColor = sceneAccent;

        ctx.beginPath();
        ctx.roundRect(-frameW / 2, -frameH / 2, frameW, frameH, 16);
        ctx.stroke();
        ctx.shadowBlur = 0;
        ctx.clip();

        if (spotFootage) {
          try {
            const img = spotFootage.type === 'image' 
              ? imageElementsRef.current[spotFootage.id] 
              : videoElementsRef.current[spotFootage.id];
            if (img) {
              ctx.drawImage(img as CanvasImageSource, -frameW / 2, -frameH / 2, frameW, frameH);
            }
          } catch (err) {
            ctx.fillStyle = '#110515';
            ctx.fillRect(-frameW / 2, -frameH / 2, frameW, frameH);
          }
        } else {
          // Default glowing sci-fi matrix graph when no uploads exist
          ctx.fillStyle = '#0f0b18';
          ctx.fillRect(-frameW / 2, -frameH / 2, frameW, frameH);
          ctx.strokeStyle = `${sceneAccent}44`;
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          for (let i = -frameW/2; i < frameW/2; i += 20) {
            ctx.moveTo(i, -frameH/2);
            ctx.lineTo(i + Math.sin(time * 0.002) * 15, frameH/2);
          }
          ctx.stroke();

          ctx.fillStyle = sceneAccent;
          ctx.font = '9px monospace';
          ctx.fillText('STANDBY HOLOGRAM CONNECT', -70, 0);
        }

        // Horizontal scan raster overlay
        ctx.fillStyle = 'rgba(0, 245, 255, 0.08)';
        ctx.fillRect(-frameW / 2, -frameH / 2, frameW, frameH);
        
        const scanY = (Math.sin(time * 0.006) * frameH / 2);
        ctx.strokeStyle = '#39FF14';
        ctx.lineWidth = 2.0;
        ctx.beginPath();
        ctx.moveTo(-frameW / 2, scanY);
        ctx.lineTo(frameW / 2, scanY);
        ctx.stroke();

        ctx.restore();
      }

      // PART 4: REAL-TIME DOUBLE SPECTROGRAM WAVES AT HORIZON LINE
      if (analyserOut) {
        const barWidth = w / 40;
        ctx.fillStyle = `${sceneAccent}22`;
        for (let i = 0; i < 40; i++) {
          const val = freqData[i % freqData.length];
          const barHeight = (val / 255) * h * 0.22;
          // Left wing
          ctx.fillRect(w/2 - i * barWidth, gridY - barHeight, barWidth - 2, barHeight);
          // Right wing
          ctx.fillRect(w/2 + (i-1) * barWidth, gridY - barHeight, barWidth - 2, barHeight);
        }
      }

      // PART 5: THE CELESTIAL METRIC GAUGE RING (CENTER SUN VECTOR GRAPH)
      ctx.save();
      ctx.translate(w / 2, h * 0.35);
      ctx.rotate(rotationAngleRef.current * -0.5);
      
      const sunRad = Math.min(w, h) * 0.12 * beatPulseRef.current;
      const gradSun = ctx.createLinearGradient(-sunRad, -sunRad, sunRad, sunRad);
      gradSun.addColorStop(0, sceneAccent);
      gradSun.addColorStop(0.5, '#4b0082');
      gradSun.addColorStop(1, '#000000');
      
      // Double layer outline
      ctx.shadowBlur = 25;
      ctx.shadowColor = sceneAccent;
      ctx.lineWidth = 4.0;
      ctx.strokeStyle = sceneAccent;
      ctx.beginPath();
      ctx.arc(0, 0, sunRad * 1.15, 0, Math.PI * 2);
      ctx.stroke();

      if (sceneIdEffect === 'center-mask' && spotFootage) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(0, 0, sunRad, 0, Math.PI * 2);
        ctx.clip();
        try {
          const img = spotFootage.type === 'image' 
            ? imageElementsRef.current[spotFootage.id] 
            : videoElementsRef.current[spotFootage.id];
          if (img) {
            ctx.drawImage(img as CanvasImageSource, -sunRad, -sunRad, sunRad * 2, sunRad * 2);
          } else {
            ctx.fillStyle = gradSun;
            ctx.fill();
          }
        } catch (err) {
          ctx.fillStyle = gradSun;
          ctx.fill();
        }
        ctx.restore();
      } else {
        ctx.fillStyle = gradSun;
        ctx.shadowBlur = 0;
        ctx.beginPath();
        ctx.arc(0, 0, sunRad, 0, Math.PI * 2);
        ctx.fill();
      }

      // Extraterrestrial alien face drawing inside the central planet! Just simple glowing vector lines
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2.0;
      ctx.beginPath();
      // Eyes (Alien slant eyes)
      ctx.moveTo(-sunRad*0.35, -sunRad*0.1);
      ctx.bezierCurveTo(-sunRad*0.3, -sunRad*0.25, -sunRad*0.1, -sunRad*0.25, -sunRad*0.1, -sunRad*0.1);
      ctx.bezierCurveTo(-sunRad*0.15, -sunRad*0.02, -sunRad*0.3, -sunRad*0.02, -sunRad*0.35, -sunRad*0.1);

      ctx.moveTo(sunRad*0.35, -sunRad*0.1);
      ctx.bezierCurveTo(sunRad*0.3, -sunRad*0.25, sunRad*0.1, -sunRad*0.25, sunRad*0.1, -sunRad*0.1);
      ctx.bezierCurveTo(sunRad*0.15, -sunRad*0.02, sunRad*0.3, -sunRad*0.02, sunRad*0.35, -sunRad*0.1);
      ctx.fillStyle = '#00ffcc';
      ctx.fill();

      // Slit alien mouth
      ctx.beginPath();
      ctx.arc(0, sunRad*0.25, sunRad*0.1, 0, Math.PI, false);
      ctx.stroke();

      ctx.restore();

      // PART 6: OVERLAY STORYBOARD LYRICS & TITLES
      ctx.save();
      // Title overlay box
      ctx.fillStyle = 'rgba(10, 8, 20, 0.85)';
      ctx.strokeStyle = sceneAccent;
      ctx.lineWidth = 2.0;
      ctx.shadowBlur = 12;
      ctx.shadowColor = sceneAccent;
      
      const bannerW = Math.min(w * 0.9, 850);
      const bannerH = 95;
      const bannerX = (w - bannerW) / 2;
      const bannerY = 25;

      ctx.beginPath();
      ctx.roundRect(bannerX, bannerY, bannerW, bannerH, 14);
      ctx.fill();
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Title header text
      ctx.fillStyle = '#ffffff';
      ctx.font = `bold ${w > 800 ? '22px' : '15px'} "Space Grotesk", sans-serif`;
      ctx.fillText(universe.universeName, bannerX + 30, bannerY + 40);

      // Subtitle Scene Line
      ctx.fillStyle = sceneAccent;
      ctx.font = `italic ${w > 800 ? '16px' : '13px'} Courier, monospace`;
      ctx.fillText(`SCENE [0${activeSceneIndex + 1}]: ${scene?.title?.toUpperCase() || 'WARP MODE'}`, bannerX + 30, bannerY + 70);

      // Autotune Dynamic status
      ctx.textAlign = 'right';
      ctx.fillStyle = '#fff';
      ctx.font = '11px monospace';
      ctx.fillText(`KEY: ${universe.key} ${universe.scale.toUpperCase()}  |  BPM: ${universe.bpm}`, bannerX + bannerW - 30, bannerY + 38);
      
      // Floating Pitch Correction Speed Meter
      ctx.fillStyle = pitchShiftRatio > 1.01 ? '#ff007f' : pitchShiftRatio < 0.99 ? '#00ffcc' : '#aaa';
      ctx.fillText(`AUTOTUNE SHIFT DEV: ${Math.round((pitchShiftRatio - 1.0) * 100)} CENTS`, bannerX + bannerW - 30, bannerY + 68);

      ctx.restore();

      // STORYBOARD SCENE TRANSCRIPTION (Alien lyrics subtitle)
      ctx.save();
      const textLine = scene?.lyricsLine || 'JO_ALIEN COSMIC VIBRATION SEEDED';
      ctx.fillStyle = '#ffffff';
      ctx.shadowBlur = 10;
      ctx.shadowColor = '#00f0ff';
      ctx.font = `bold ${w > 800 ? '24px' : '16px'} "Space Grotesk", sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText(`" ${textLine} "`, w / 2, h * 0.85);
      
      // Prompt/Visual description subtitle
      ctx.fillStyle = 'rgba(255,255,255,0.45)';
      ctx.font = `12px "JetBrains Mono", Courier, monospace`;
      ctx.shadowBlur = 0;
      ctx.fillText(`PROMPT DIRECTIVE: ${scene?.visualPrompt || ''}`, w / 2, h * 0.91);
      ctx.restore();

      frameId = requestAnimationFrame(render);
    };

    frameId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(frameId);
  }, [universe, activeSceneIndex, userFootage, analyserIn, analyserOut, pitchShiftRatio, isPlaying, isExporting]);

  // EXPORTER IMPLEMENTATION: Renders offline highres frame-sequence and returns WebM video Blob
  useEffect(() => {
    if (exporterRef) {
      exporterRef.current = async (resolution: '4K' | '1080p' = '4K') => {
        return new Promise<Blob>((resolve, reject) => {
          try {
            // Setup offscreen virtual canvas at chosen resolution
            const videoWidth = resolution === '4K' ? 3840 : 1920;
            const videoHeight = resolution === '4K' ? 2160 : 1080;
            const scaleRatio = resolution === '4K' ? 1.0 : 0.5;

            const exportCanvas = document.createElement('canvas');
            exportCanvas.width = videoWidth;
            exportCanvas.height = videoHeight;
            const expCtx = exportCanvas.getContext('2d')!;

            // Capture canvas video stream
            const fps = 30;
            const canvasStream = exportCanvas.captureStream(fps);

            // Re-use active starfield nodes
            const starCount = starsRef.current.length || 300;
            
            // Set up record slices index
            const chunks: Blob[] = [];
            
            // Setup high-quality bitrate parameters and fallbacks
            let options = { mimeType: 'video/webm;codecs=vp9', videoBitsPerSecond: resolution === '4K' ? 28000000 : 12000000 };
            if (typeof MediaRecorder.isTypeSupported === 'function') {
              if (!MediaRecorder.isTypeSupported(options.mimeType)) {
                options = { mimeType: 'video/webm', videoBitsPerSecond: resolution === '4K' ? 20000000 : 8000000 };
              }
              if (!MediaRecorder.isTypeSupported(options.mimeType)) {
                options = { mimeType: '', videoBitsPerSecond: resolution === '4K' ? 12000000 : 6000000 };
              }
            } else {
              options = { mimeType: 'video/webm', videoBitsPerSecond: 12000000 };
            }

            const mediaRecorder = new MediaRecorder(canvasStream, options);

            mediaRecorder.ondataavailable = (e) => {
              if (e.data && e.data.size > 0) chunks.push(e.data);
            };

            mediaRecorder.onstop = () => {
              const videoBlob = new Blob(chunks, { type: 'video/webm' });
              resolve(videoBlob);
            };

            mediaRecorder.start();

            // Perform offline rendering loop for exactly 10 seconds of 4K content
            let currentFrameCount = 0;
            const totalFrames = fps * 10; // 10 second showcase

            const renderExportFrame = () => {
              if (currentFrameCount >= totalFrames) {
                mediaRecorder.stop();
                return;
              }

              // Normalised scene timing
              const normProgress = currentFrameCount / totalFrames;
              const sceneIndex = Math.min(universe.storyboard.length - 1, Math.floor(normProgress * universe.storyboard.length));
              const scene = universe.storyboard[sceneIndex];
              const sceneAccent = scene?.colorAccent || '#ff0055';
              const sceneIdEffect = scene?.visualEffectMode || 'orbit';
              const spotFootage = userFootage && userFootage.length > 0
                ? userFootage[sceneIndex % userFootage.length]
                : null;

              // Notify export progress
              if (onExportProgress) {
                onExportProgress(Math.round((currentFrameCount / totalFrames) * 100));
              }

              // Draw high res space background
              const radGrad = expCtx.createRadialGradient(videoWidth/2, videoHeight/2, 100, videoWidth/2, videoHeight/2, videoWidth);
              radGrad.addColorStop(0, '#0c0717');
              radGrad.addColorStop(0.6, '#04030a');
              radGrad.addColorStop(1, '#000000');
              expCtx.fillStyle = radGrad;
              expCtx.fillRect(0, 0, videoWidth, videoHeight);

              // 4K BACKDROP BLEND FILTER
              if (sceneIdEffect === 'bg-blend' && spotFootage) {
                const img = spotFootage.type === 'image' ? imageElementsRef.current[spotFootage.id] : videoElementsRef.current[spotFootage.id];
                if (img) {
                  expCtx.save();
                  expCtx.globalAlpha = 0.28;
                  const imgW = (img as any).naturalWidth || (img as any).videoWidth || videoWidth;
                  const imgH = (img as any).naturalHeight || (img as any).videoHeight || videoHeight;
                  const scale = Math.max(videoWidth / imgW, videoHeight / imgH);
                  const iw = imgW * scale;
                  const ih = imgH * scale;
                  expCtx.drawImage(img as CanvasImageSource, (videoWidth - iw) / 2, (videoHeight - ih) / 2, iw, ih);
                  expCtx.restore();
                }
              }

              // 4K Starfield
              starsRef.current.forEach(star => {
                const projectedSpeed = 15;
                const projectedZ = (star.z - (currentFrameCount * projectedSpeed)) % 2000;
                const safeZ = projectedZ <= 0 ? 2000 : projectedZ;
                const k = 1000 / safeZ;
                const px = star.x * k + videoWidth / 2;
                const py = star.y * k + videoHeight / 2;

                if (px >= 0 && px < videoWidth && py >= 0 && py < videoHeight) {
                  expCtx.fillStyle = star.color;
                  expCtx.beginPath();
                  expCtx.arc(px, py, 4 * scaleRatio, 0, Math.PI * 2);
                  expCtx.fill();
                }
              });

              // 4K Classic horizon grid
              expCtx.strokeStyle = `${sceneAccent}44`;
              expCtx.lineWidth = 2.0 * scaleRatio;
              const expHorizonY = videoHeight * 0.65;
              for (let i = 0; i < 20; i++) {
                const ratio = i / 20;
                const lineY = expHorizonY + Math.pow(ratio, 2.5) * (videoHeight - expHorizonY);
                expCtx.beginPath();
                expCtx.moveTo(0, lineY);
                expCtx.lineTo(videoWidth, lineY);
                expCtx.stroke();
              }
              for (let i = 0; i <= 32; i++) {
                const xPos = (i / 32) * videoWidth;
                expCtx.beginPath();
                expCtx.moveTo(videoWidth / 2, expHorizonY);
                expCtx.lineTo(xPos, videoHeight);
                expCtx.stroke();
              }

              // 4K Central Alien Head planet
              expCtx.save();
              expCtx.translate(videoWidth / 2, videoHeight * 0.35);
              const sunRad = videoHeight * 0.15;
              const planetGrad = expCtx.createLinearGradient(-sunRad, -sunRad, sunRad, sunRad);
              planetGrad.addColorStop(0, sceneAccent);
              planetGrad.addColorStop(0.5, '#2e004d');
              planetGrad.addColorStop(1, '#000');
              
              expCtx.shadowBlur = 40 * scaleRatio;
              expCtx.shadowColor = sceneAccent;
              expCtx.lineWidth = 8.0 * scaleRatio;
              expCtx.strokeStyle = sceneAccent;
              
              expCtx.beginPath();
              expCtx.arc(0, 0, sunRad * 1.1, 0, Math.PI * 2);
              expCtx.stroke();

              if (sceneIdEffect === 'center-mask' && spotFootage) {
                expCtx.save();
                expCtx.beginPath();
                expCtx.arc(0, 0, sunRad, 0, Math.PI * 2);
                expCtx.clip();
                try {
                  const img = spotFootage.type === 'image' 
                    ? imageElementsRef.current[spotFootage.id] 
                    : videoElementsRef.current[spotFootage.id];
                  if (img) {
                    expCtx.drawImage(img as CanvasImageSource, -sunRad, -sunRad, sunRad * 2, sunRad * 2);
                  } else {
                    expCtx.fillStyle = planetGrad;
                    expCtx.fill();
                  }
                } catch {
                  expCtx.fillStyle = planetGrad;
                  expCtx.fill();
                }
                expCtx.restore();
              } else {
                expCtx.fillStyle = planetGrad;
                expCtx.shadowBlur = 0;
                expCtx.beginPath();
                expCtx.arc(0, 0, sunRad, 0, Math.PI * 2);
                expCtx.fill();
              }

              // Draw Alien face on sun
              expCtx.strokeStyle = '#ffffff';
              expCtx.lineWidth = 4.0 * scaleRatio;
              expCtx.beginPath();
              expCtx.moveTo(-sunRad*0.35, -sunRad*0.1);
              expCtx.bezierCurveTo(-sunRad*0.3, -sunRad*0.25, -sunRad*0.1, -sunRad*0.25, -sunRad*0.1, -sunRad*0.1);
              expCtx.bezierCurveTo(-sunRad*0.15, -sunRad*0.02, -sunRad*0.3, -sunRad*0.02, -sunRad*0.35, -sunRad*0.1);

              expCtx.moveTo(sunRad*0.35, -sunRad*0.1);
              expCtx.bezierCurveTo(sunRad*0.3, -sunRad*0.25, sunRad*0.1, -sunRad*0.25, sunRad*0.1, -sunRad*0.1);
              expCtx.bezierCurveTo(sunRad*0.15, -sunRad*0.02, sunRad*0.3, -sunRad*0.02, sunRad*0.35, -sunRad*0.1);
              expCtx.fillStyle = '#00ffcc';
              expCtx.fill();

              expCtx.stroke();

              expCtx.beginPath();
              expCtx.arc(0, sunRad*0.25, sunRad*0.12, 0, Math.PI, false);
              expCtx.stroke();
              expCtx.restore();

              // User upload panels
              if (sceneIdEffect === 'orbit') {
                userFootage.forEach((foot, index) => {
                  const angle = (index / userFootage.length) * Math.PI * 2 + (currentFrameCount * 0.01);
                  const rx = videoWidth * 0.35;
                  const ry = videoHeight * 0.12;
                  const px = videoWidth / 2 + Math.cos(angle) * rx;
                  const py = videoHeight * 0.45 + Math.sin(angle) * ry;

                  const panW = 380 * scaleRatio;
                  const panY = 250 * scaleRatio;

                  expCtx.save();
                  expCtx.lineWidth = 6.0 * scaleRatio;
                  expCtx.strokeStyle = index % 2 === 0 ? '#ff007f' : '#00ffff';
                  expCtx.shadowBlur = 30 * scaleRatio;
                  expCtx.shadowColor = expCtx.strokeStyle;
                  
                  expCtx.translate(px, py);
                  expCtx.beginPath();
                  expCtx.roundRect(-panW / 2, -panY / 2, panW, panY, 20 * scaleRatio);
                  expCtx.stroke();
                  expCtx.shadowBlur = 0;
                  expCtx.clip();

                  // Images and Videos support safely in export
                  if (foot.type === 'image') {
                    const img = imageElementsRef.current[foot.id];
                    if (img && img.complete) {
                      expCtx.drawImage(img, -panW / 2, -panY / 2, panW, panY);
                    } else {
                      expCtx.fillStyle = '#110522';
                      expCtx.fillRect(-panW / 2, -panY / 2, panW, panY);
                    }
                  } else if (foot.type === 'video') {
                    const vid = videoElementsRef.current[foot.id];
                    if (vid && vid.readyState >= 2) {
                      expCtx.drawImage(vid, -panW / 2, -panY / 2, panW, panY);
                    } else {
                      expCtx.fillStyle = '#110522';
                      expCtx.fillRect(-panW / 2, -panY / 2, panW, panY);
                    }
                  } else {
                    expCtx.fillStyle = '#110522';
                    expCtx.fillRect(-panW / 2, -panY / 2, panW, panY);
                  }
                  expCtx.restore();
                });
              } else if (sceneIdEffect === 'glitch-ripple') {
                const panW = 600 * scaleRatio;
                const panY = 400 * scaleRatio;
                const px = videoWidth / 2;
                const py = videoHeight * 0.45;

                expCtx.save();
                expCtx.lineWidth = 8.0 * scaleRatio;
                expCtx.strokeStyle = sceneAccent;
                expCtx.shadowBlur = 30 * scaleRatio;
                expCtx.shadowColor = sceneAccent;
                
                expCtx.translate(px, py);
                expCtx.beginPath();
                expCtx.roundRect(-panW / 2, -panY / 2, panW, panY, 24 * scaleRatio);
                expCtx.stroke();
                expCtx.shadowBlur = 0;
                expCtx.clip();

                if (spotFootage) {
                  try {
                    const img = spotFootage.type === 'image' ? imageElementsRef.current[spotFootage.id] : videoElementsRef.current[spotFootage.id];
                    if (img) {
                      expCtx.drawImage(img as CanvasImageSource, -panW / 2, -panY / 2, panW, panY);
                    } else {
                      expCtx.fillStyle = '#110522';
                      expCtx.fillRect(-panW / 2, -panY / 2, panW, panY);
                    }
                  } catch {
                    expCtx.fillStyle = '#110522';
                    expCtx.fillRect(-panW / 2, -panY / 2, panW, panY);
                  }
                } else {
                  expCtx.fillStyle = '#110515';
                  expCtx.fillRect(-panW / 2, -panY / 2, panW, panY);
                }
                expCtx.restore();
              }

              // Lyrics overlay at the bottom in crystal clear size
              expCtx.save();
              expCtx.fillStyle = '#ffffff';
              expCtx.font = `bold ${Math.round(64 * scaleRatio)}px "Space Grotesk", sans-serif`;
              expCtx.textAlign = 'center';
              expCtx.shadowBlur = 20 * scaleRatio;
              expCtx.shadowColor = '#00f0ff';
              expCtx.fillText(`" ${scene?.lyricsLine || ''} "`, videoWidth / 2, videoHeight * 0.85);

              // Subtitles metadata
              expCtx.fillStyle = sceneAccent;
              expCtx.font = `${Math.round(36 * scaleRatio)}px monospace`;
              expCtx.fillText(`JO_ALIEN'S WORLD: MASTER RECRUIT EDITION | ${resolution} PRORES VP9`, videoWidth / 2, videoHeight * 0.92);
              
              // 4K Ultra HD badge watermark
              expCtx.fillStyle = 'rgba(255,255,255,0.7)';
              expCtx.font = `bold ${Math.round(44 * scaleRatio)}px sans-serif`;
              expCtx.fillText(resolution === '4K' ? '4K UHD' : '1080P HD', videoWidth - (250 * scaleRatio), 100 * scaleRatio);
              expCtx.restore();

              currentFrameCount++;
              setTimeout(renderExportFrame, 1000 / fps);
            };

            renderExportFrame();
          } catch (rErr) {
            reject(rErr);
          }
        });
      };
    }
  }, [universe, userFootage, starsRef, onExportProgress]);

  return (
    <div ref={containerRef} id="canvas-reactor-container" className="relative w-full h-[360px] md:h-[550px] bg-black rounded-2xl overflow-hidden border border-purple-500/30 shadow-[0_0_40px_rgba(75,0,130,0.4)]">
      <canvas ref={canvasRef} id="jo-alien-world-screen" className="absolute top-0 left-0 w-full h-full block" />
      
      {/* Dynamic Vibe Corner Badge */}
      <div className="absolute bottom-4 right-4 flex items-center gap-2 bg-black/80 backdrop-blur-md px-3.py-2 border border-purple-500/40 rounded-lg text-[10px] text-purple-400 font-mono tracking-widest leading-none z-10 px-3 py-1.5 shadow-lg select-none">
        <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
        RENDER: 4K INTERACTIVE HYPER-FRAME
      </div>
    </div>
  );
}
