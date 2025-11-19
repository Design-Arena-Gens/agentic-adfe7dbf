export interface Palette {
  id: string;
  name: string;
  caption: string;
  swatch: [string, string, string];
  typography: string;
  accent: string;
  shapes: string[];
  background: string;
}

export const palettes: Palette[] = [
  {
    id: "neo-nebula",
    name: "Neo Nebula",
    caption: "Metaverse energy with electric gradients",
    swatch: ["#3A0CA3", "#7209B7", "#B5179E"],
    typography: "#F8F9FF",
    accent: "#4CC9F0",
    shapes: ["#4361EE", "#4CC9F0", "#F72585"],
    background: "linear-gradient(135deg, rgba(67,97,238,0.95), rgba(247,37,133,0.95))"
  },
  {
    id: "sunset-reel",
    name: "Sunset Reel",
    caption: "Warm gradients for Instagram-first launches",
    swatch: ["#F72585", "#FF9E00", "#FFB703"],
    typography: "#FFEFEF",
    accent: "#3A0CA3",
    shapes: ["#F72585", "#FB8500", "#FFB703"],
    background: "linear-gradient(150deg, rgba(247, 37, 133, 0.88), rgba(251, 133, 0, 0.94))"
  },
  {
    id: "hyper-growth",
    name: "Hyper Growth",
    caption: "Performance-optimized green velocity",
    swatch: ["#00F5A0", "#00D9F5", "#0085FF"],
    typography: "#F2FFFB",
    accent: "#0CECDD",
    shapes: ["#00F5A0", "#00B4D8", "#0077B6"],
    background: "linear-gradient(155deg, rgba(0, 213, 255, 0.85), rgba(0, 245, 160, 0.85))"
  },
  {
    id: "sonic-wave",
    name: "Sonic Wave",
    caption: "Creator vibes with audio-reactive motion",
    swatch: ["#7209B7", "#560BAD", "#4361EE"],
    typography: "#EEF4FF",
    accent: "#4CC9F0",
    shapes: ["#F72585", "#4895EF", "#3F37C9"],
    background: "linear-gradient(140deg, rgba(86, 11, 173, 0.9), rgba(67, 97, 238, 0.95))"
  },
  {
    id: "velvet-noir",
    name: "Velvet Noir",
    caption: "Luxury commerce with cinematic contrast",
    swatch: ["#0B132B", "#1C2541", "#3A506B"],
    typography: "#F7FFF7",
    accent: "#5BC0BE",
    shapes: ["#0B132B", "#5BC0BE", "#3A506B"],
    background: "linear-gradient(180deg, rgba(11, 19, 43, 0.92), rgba(58, 80, 107, 0.88))"
  }
];

export const getPaletteById = (id: string): Palette => {
  return palettes.find((palette) => palette.id === id) ?? palettes[0];
};
