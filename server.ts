import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Lazy-initialized Gemini client with safety fallback
let aiClient: GoogleGenAI | null = null;
function getGeminiClient() {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey) {
      aiClient = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build",
          },
        },
      });
    }
  }
  return aiClient;
}

// REST route to generate custom music video blueprints using Gemini 3.5 Flash
app.post("/api/ai/generate-universe", async (req, res) => {
  try {
    const { prompt, currentGenre, audioFileName } = req.body;
    const client = getGeminiClient();

    if (!client) {
      console.warn("GEMINI_API_KEY is not defined. Using procedural alien engine fallback.");
      return res.json(getFallbackBlueprint(prompt || "Cosmic Warp Gate", currentGenre || "Synthwave"));
    }

    const systemInstruction = `You are Jo_Alien, an eccentric extra-terrestrial sound designer and neon visual architect from the future.
Generate a complete, cohesive Sci-Fi neon music video blueprint based on the user's creative prompt.
Return your output STRICTLY adhering to the requested JSON layout. Ensure the storyboard has exactly 4 scenes forming a logical story arc.`;

    const userPrompt = `Create a music video blueprint for the concept: "${prompt || "Deep Space Slime Disco"}".
The user wants a "${currentGenre || "Synthwave"}" audio vibe. ${audioFileName ? `The user is providing an audio track file named "${audioFileName}". Intelligently customize the storyboard scenes, neon accents, and lyrics/subtitles to synchronize perfectly with this track's vibe!` : ""} Make sure everything (the synth configurations, ambient lyrics, visual descriptions) fits this aesthetic and Jo_Alien's quirky, glowing, neon-infused style!`;

    const response = await client.models.generateContent({
      model: "gemini-3.5-flash",
      contents: userPrompt,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            universeName: {
              type: Type.STRING,
              description: "A cool, stylized sci-fi name for this track/video universe.",
            },
            bpm: {
              type: Type.INTEGER,
              description: "Beats per minute for the synthesizer sequencer (integer between 75 and 140).",
            },
            key: {
              type: Type.STRING,
              description: "Musical tonic key (e.g., C, G, A, F#, Eb).",
            },
            scale: {
              type: Type.STRING,
              description: "Scale type: 'minor', 'major', 'pentatonic', 'alien' (whole-tone), 'phrygian'.",
            },
            vibeColor: {
              type: Type.STRING,
              description: "Primary neon hex code color (e.g., #00ff66 for slime green, #ff0055 for alien pink, #00f0ff for hyper-cyan).",
            },
            musicPreset: {
              type: Type.OBJECT,
              properties: {
                synthWaveform: { type: Type.STRING, description: "Waveform mode: 'sawtooth', 'triangle', 'sine', 'square'." },
                decay: { type: Type.NUMBER, description: "Filter envelope decay time in seconds (0.1 to 1.5)." },
                resonance: { type: Type.NUMBER, description: "Filter resonance depth (1 to 15)." },
                drumStyle: { type: Type.STRING, description: "Drum kick style: 'laser-heavy', 'cosmic-thud', 'space-cyber'." },
              },
              required: ["synthWaveform", "decay", "resonance", "drumStyle"],
            },
            storyboard: {
              type: Type.ARRAY,
              description: "Exactly 4 storyboard scenes that play sequentially in the video.",
              items: {
                type: Type.OBJECT,
                properties: {
                  sceneNumber: { type: Type.INTEGER },
                  title: { type: Type.STRING, description: "Vibrant title of this part of the music video." },
                  visualPrompt: { type: Type.STRING, description: "Highly detailed descriptive prompt to feed into the vector/canvas visualizer (e.g., black holes, neon alien faces, pulsing grids, futuristic hyperlanes)." },
                  lyricsLine: { type: Type.STRING, description: "Quirky alien lyrics/subtitles to overlay on this screen." },
                  colorAccent: { type: Type.STRING, description: "Vibrant neon hex color accent for this scene." },
                  particleDensity: { type: Type.INTEGER, description: "Number of active neon stars/particles in the space visualizer (50 to 500)." },
                  visualEffectMode: { type: Type.STRING, description: "Footage visual effect mode in this scene: 'orbit', 'bg-blend', 'glitch-ripple', 'center-mask'." },
                  matchingFootageCue: { type: Type.STRING, description: "Contextual instruction on what user upload belongs in this scene." },
                },
                required: ["sceneNumber", "title", "visualPrompt", "lyricsLine", "colorAccent", "particleDensity", "visualEffectMode", "matchingFootageCue"],
              },
            },
          },
          required: ["universeName", "bpm", "key", "scale", "vibeColor", "musicPreset", "storyboard"],
        },
      },
    });

    const bodyText = response.text;
    if (bodyText) {
      const parsed = JSON.parse(bodyText);
      return res.json(parsed);
    } else {
      throw new Error("Empty response from Gemini.");
    }
  } catch (error) {
    console.error("Gemini Generation Error:", error);
    // Graceful fallback structures so the application is completely bulletproof
    return res.json(getFallbackBlueprint(req.body.prompt || "Cybernetic Slime", req.body.currentGenre || "Synthwave"));
  }
});

// Sound engine default procedural presets creator
function getFallbackBlueprint(prompt: string, genre: string) {
  const bpm = Math.floor(Math.random() * 40) + 85; // 85 - 125
  const vibeHexs = ["#00ffcc", "#ff007f", "#39ff14", "#bc13fe", "#00ffff"];
  const selectedVibe = vibeHexs[Math.floor(Math.random() * vibeHexs.length)];

  return {
    universeName: `JO-ALIEN: ${prompt.toUpperCase()} SESSION`,
    bpm,
    key: "A",
    scale: "alien",
    vibeColor: selectedVibe,
    musicPreset: {
      synthWaveform: "sawtooth",
      decay: 0.6,
      resonance: 8.5,
      drumStyle: "space-cyber",
    },
    storyboard: [
      {
        sceneNumber: 1,
        title: "Hyper-drive Ignition",
        visualPrompt: `Cosmic galactic warp tunnels with neon green rays, rotating planetary coordinates. Inspired by ${prompt}`,
        lyricsLine: "WARPING THROUGH THE ATMOSPHERE... JO_ALIEN IS NEAR!",
        colorAccent: selectedVibe,
        particleDensity: 200,
        visualEffectMode: "orbit",
        matchingFootageCue: "High-contrast neon dancer or active light-trails photo"
      },
      {
        sceneNumber: 2,
        title: "Nebula Synapse",
        visualPrompt: `Abstract nebula cloud pulsating neon pink and turquoise wave beams. Inspired by ${prompt}`,
        lyricsLine: "MY SYNTAX CORRUPTS INTO CHROMATIC LIGHT...', SYNCING HEARTS IN 4K.'",
        colorAccent: "#ff007f",
        particleDensity: 350,
        visualEffectMode: "bg-blend",
        matchingFootageCue: "Vibrant abstract close-up photo or dynamic background video"
      },
      {
        sceneNumber: 3,
        title: "Slime Grid Rave",
        visualPrompt: `Rotating retro wireframe grid on an infinite horizon, geometric space structures. Inspired by ${prompt}`,
        lyricsLine: "AUTOTUNED GLITCHES IN THE SPACE-TIME FABRIC... CHUGGING COBALT SPARKS!",
        colorAccent: "#39ff14",
        particleDensity: 150,
        visualEffectMode: "glitch-ripple",
        matchingFootageCue: "Upbeat action sports shot or crazy neon avatar picture"
      },
      {
        sceneNumber: 4,
        title: "Black Hole Singularity",
        visualPrompt: `Supermassive black hole devouring iridescent cyan stars and cosmic space dust. Inspired by ${prompt}`,
        lyricsLine: "SINKING INTO THE COSMIC DISSOLVE... EXPORTING ETERNITY!",
        colorAccent: "#00ffff",
        particleDensity: 500,
        visualEffectMode: "center-mask",
        matchingFootageCue: "Stunning central portrait, face photo or core cosmic icon"
      },
    ],
  };
}

// Start Server Setup (Vite Middleware Setup)
async function start() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Jo_Alien's World] Full-stack Server listening on port ${PORT}`);
  });
}

start();
