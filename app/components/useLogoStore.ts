'use client';

import { nanoid } from "nanoid";
import { create } from "zustand";

export type CampaignTone = "bold" | "playful" | "elegant" | "futuristic" | "organic";
export type LogoStructure = "icon-left" | "icon-top" | "icon-overlay";

export interface CampaignConfig {
  brand: string;
  campaignGoal: string;
  audience: string;
  keywords: string;
  tagline: string;
  tone: CampaignTone;
  structure: LogoStructure;
  paletteId: string;
}

export interface SavedLogo {
  id: string;
  name: string;
  summary: string;
  paletteLabel: string;
  dataUrl: string;
  createdAt: number;
}

interface LogoStoreState {
  config: CampaignConfig;
  generationKey: string;
  history: SavedLogo[];
  setField: <K extends keyof CampaignConfig>(key: K, value: CampaignConfig[K]) => void;
  randomizeStructure: () => void;
  randomizeTone: () => void;
  regenerate: () => void;
  addHistoryEntry: (entry: Omit<SavedLogo, "id" | "createdAt">) => void;
}

const toneOptions: CampaignTone[] = ["bold", "playful", "elegant", "futuristic", "organic"];
const structureOptions: LogoStructure[] = ["icon-left", "icon-top", "icon-overlay"];

const randomFrom = <T,>(items: readonly T[]): T => {
  return items[Math.floor(Math.random() * items.length)];
};

export const useLogoStore = create<LogoStoreState>((set) => ({
  config: {
    brand: "Meta Horizon",
    campaignGoal: "Boost retention and community sign-ups",
    audience: "Gen Z creators exploring immersive storytelling",
    keywords: "immersive, social, collaborative",
    tagline: "Build worlds together",
    tone: "futuristic",
    structure: "icon-left",
    paletteId: "neo-nebula"
  },
  generationKey: nanoid(),
  history: [],
  setField: (key, value) =>
    set((state) => ({
      config: {
        ...state.config,
        [key]: value
      }
    })),
  randomizeStructure: () =>
    set((state) => ({
      config: {
        ...state.config,
        structure: randomFrom(structureOptions),
        paletteId: randomFrom([
          "neo-nebula",
          "sunset-reel",
          "hyper-growth",
          "sonic-wave",
          "velvet-noir"
        ])
      }
    })),
  randomizeTone: () =>
    set((state) => ({
      config: {
        ...state.config,
        tone: randomFrom(toneOptions)
      }
    })),
  regenerate: () =>
    set(() => ({
      generationKey: nanoid()
    })),
  addHistoryEntry: (entry) =>
    set((state) => ({
      history: [
        {
          id: nanoid(),
          createdAt: Date.now(),
          ...entry
        },
        ...state.history
      ].slice(0, 12)
    }))
}));
