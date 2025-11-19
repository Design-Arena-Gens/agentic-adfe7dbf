'use client';

import {
  ForwardedRef,
  ReactNode,
  forwardRef,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState
} from "react";
import {
  Download,
  History,
  Layers,
  RefreshCcw,
  Rocket,
  Save,
  Share2,
  Sparkles,
  Target,
  Users,
  Wand2
} from "lucide-react";
import { toPng } from "html-to-image";
import { useLogoStore } from "./useLogoStore";
import { getPaletteById, palettes, Palette } from "./palettes";
import type {
  CampaignConfig,
  CampaignTone,
  LogoStructure,
  SavedLogo
} from "./useLogoStore";

interface LogoShape {
  id: string;
  form: "orb" | "beam" | "ring" | "triangle" | "spark";
  x: number;
  y: number;
  size: number;
  rotation: number;
  color: string;
  opacity: number;
  blur?: number;
  stroke?: string;
}

interface CoreMark {
  id: string;
  kind: "planet" | "wave" | "prism" | "portal" | "signal";
  layers: Array<{
    radius: number;
    stroke: string;
    fill: string;
    opacity: number;
  }>;
}

interface LogoVariant {
  id: string;
  palette: Palette;
  gradient: string;
  shapes: LogoShape[];
  core: CoreMark;
  structure: LogoStructure;
  typographyColor: string;
  taglineColor: string;
  accentGlow: string;
}

interface InsightPack {
  campaignHeadline: string;
  narrative: string;
  channelPlan: string[];
  ctaIdeas: string[];
  performanceHooks: string[];
}

const toneDescriptors: Record<CampaignTone, string[]> = {
  bold: ["impact", "velocity", "conversion"],
  playful: ["delight", "community", "shareability"],
  elegant: ["premium", "trust", "exclusivity"],
  futuristic: ["innovation", "immersive", "forward"],
  organic: ["authentic", "sustainable", "human"]
};

const structureIntros: Record<LogoStructure, string> = {
  "icon-left": "Split mark with icon driving instant recognition",
  "icon-top": "Stacked hero mark for vertical placements",
  "icon-overlay": "Immersive overlay lockup for Reels + Stories"
};

const createPrng = (seed: string) => {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i += 1) {
    h ^= seed.charCodeAt(i);
    h *= 16777619;
  }
  return () => {
    h += h << 13;
    h ^= h >>> 7;
    h += h << 3;
    h ^= h >>> 17;
    h += h << 5;
    return ((h >>> 0) % 10_000) / 10_000;
  };
};

const hashInput = (config: CampaignConfig, generationKey: string, index: number) =>
  `${config.brand}|${config.campaignGoal}|${config.tagline}|${config.keywords}|${config.audience}|${config.tone}|${generationKey}|${index}`;

const computeGradient = (palette: Palette, tone: CampaignTone, rand: () => number) => {
  const intensity = tone === "bold" || tone === "futuristic" ? 0.92 : 0.78;
  const angle = 110 + rand() * 80;
  const [a, b, c] = palette.swatch;
  return `linear-gradient(${angle}deg, ${hexWithAlpha(a, intensity)}, ${hexWithAlpha(b, intensity)}, ${hexWithAlpha(c, intensity * 0.88)})`;
};

const hexWithAlpha = (hex: string, alpha: number) => {
  const clean = hex.replace("#", "");
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha.toFixed(2)})`;
};

const generateShapes = (
  palette: Palette,
  rand: () => number,
  structure: LogoStructure,
  tone: CampaignTone
): LogoShape[] => {
  const forms: LogoShape["form"][] = ["orb", "beam", "ring", "triangle", "spark"];
  const shapeCount = 4 + Math.floor(rand() * 4);
  const arr: LogoShape[] = [];
  for (let i = 0; i < shapeCount; i += 1) {
    const form = forms[Math.floor(rand() * forms.length)];
    const xBase = structure === "icon-left" ? rand() * 52 : rand() * 72;
    const yBase = structure === "icon-top" ? rand() * 42 : rand() * 72;
    const size = 32 + rand() * (tone === "bold" ? 64 : 52);
    arr.push({
      id: `${form}-${i}`,
      form,
      x: xBase,
      y: yBase,
      size,
      rotation: rand() * 360,
      color: palette.shapes[Math.floor(rand() * palette.shapes.length)],
      opacity: 0.25 + rand() * 0.55,
      blur: form === "orb" ? 8 + rand() * 16 : form === "spark" ? 0 : undefined,
      stroke: form === "ring" ? palette.typography : undefined
    });
  }
  return arr;
};

const generateCoreMark = (palette: Palette, rand: () => number): CoreMark => {
  const options: CoreMark["kind"][] = ["planet", "wave", "prism", "portal", "signal"];
  const kind = options[Math.floor(rand() * options.length)];
  const layerCount = 2 + Math.floor(rand() * 3);
  const layers = Array.from({ length: layerCount }, (_, idx) => {
    const radius = 26 - idx * (6 + rand() * 5);
    const fillIndex = Math.floor(rand() * palette.shapes.length);
    return {
      radius,
      stroke: hexWithAlpha(palette.accent, 0.52 - idx * 0.09),
      fill: hexWithAlpha(palette.shapes[fillIndex], 0.78 - idx * 0.12),
      opacity: 0.68 - idx * 0.12
    };
  });

  return {
    id: `${kind}-${layers.length}`,
    kind,
    layers
  };
};

const deriveNarrative = (config: CampaignConfig): InsightPack => {
  const descriptor = toneDescriptors[config.tone];
  const hooks = config.keywords
    .split(/[,\n]/)
    .map((k) => k.trim())
    .filter(Boolean);
  const topHooks = hooks.slice(0, 3);
  const headline = `${config.brand || "Campaign"} – Meta-ready logo concepts to drive ${descriptor[0]}`;
  const narrative = `Position the launch around ${descriptor.join(", ")} to captivate ${config.audience.toLowerCase() || "your core audience"}. \n` +
    `Lean into ${topHooks.join(", ") || "your signature strengths"} with motion-first storytelling across Meta surfaces.`;

  const channelPlan = [
    "Reels hook with animated logo pulse",
    "Stories sticker pack with campaign CTA",
    "Feed carousel showcasing logo lockups + testimonials"
  ];

  const ctaIdeas = [
    `"${config.tagline || "Launch now"}" hero CTA across placements`,
    "Swipe-up mini-site with variant selector",
    "Lead gen ad featuring brand-safe colorways"
  ];

  const performanceHooks = [
    `${descriptor[1]} via responsive logo crops tailored for Meta surfaces`,
    `${descriptor[2]} with shoppable CTA overlays for IG & FB`,
    `${descriptor[0]} unlocked by consistent gradient storytelling`
  ];

  return {
    campaignHeadline: headline,
    narrative,
    channelPlan,
    ctaIdeas,
    performanceHooks
  };
};

const LogoTile = forwardRef(function LogoTile(
  {
    variant,
    config,
    active
  }: {
    variant: LogoVariant;
    config: CampaignConfig;
    active: boolean;
  },
  ref: ForwardedRef<HTMLDivElement>
) {
  const orientationClass =
    variant.structure === "icon-top"
      ? {
          flexDirection: "column" as const,
          alignItems: "center" as const,
          textAlign: "center" as const,
          gap: "18px"
        }
      : variant.structure === "icon-overlay"
      ? {
          flexDirection: "column" as const,
          alignItems: "flex-start" as const,
          gap: "14px"
        }
      : {
          flexDirection: "row" as const,
          alignItems: "center" as const,
          gap: "18px"
        };

  const brand = config.brand || "Meta Campaign";
  const tagline = config.tagline || "Designing attention";

  return (
    <div
      className="logo-card"
      ref={ref}
      style={{
        border: active ? "1px solid rgba(255,255,255,0.35)" : undefined,
        boxShadow: active
          ? "0 0 0 1px rgba(255,255,255,0.15), 0 18px 48px rgba(0,0,0,0.45)"
          : undefined
      }}
    >
      <div
        className="logo-preview-box"
        style={{
          background: variant.gradient,
          boxShadow: `0 22px 60px rgba(0,0,0,0.45), inset 0 0 0 1px rgba(255,255,255,0.12)`
        }}
      >
        <div
          style={{
            display: "flex",
            width: "100%",
            height: "100%",
            padding: "18px",
            borderRadius: "14px",
            background: hexWithAlpha(variant.palette.accent, 0.16),
            backdropFilter: "blur(18px)",
            boxShadow: "0 12px 24px rgba(0,0,0,0.24)",
            ...orientationClass
          }}
        >
          <div className="logo-preview-icon">
            <div
              style={{
                position: "absolute",
                inset: "auto",
                width: "100%",
                height: "100%",
                filter: "blur(28px)",
                opacity: 0.65,
                background: variant.accentGlow
              }}
            />
            <svg
              viewBox="0 0 120 120"
              style={{
                width: "100%",
                height: "100%"
              }}
            >
              {variant.shapes.map((shape) => {
                switch (shape.form) {
                  case "orb":
                    return (
                      <circle
                        key={shape.id}
                        cx={shape.x + 30}
                        cy={shape.y + 30}
                        r={shape.size / 3}
                        fill={shape.color}
                        opacity={shape.opacity}
                        filter={shape.blur ? `blur(${shape.blur})` : undefined}
                      />
                    );
                  case "beam":
                    return (
                      <rect
                        key={shape.id}
                        x={shape.x}
                        y={shape.y}
                        width={shape.size * 1.6}
                        height={shape.size / 6}
                        rx={shape.size / 12}
                        fill={shape.color}
                        opacity={shape.opacity}
                        transform={`rotate(${shape.rotation} ${shape.x + shape.size * 0.8} ${shape.y + shape.size / 12})`}
                      />
                    );
                  case "ring":
                    return (
                      <circle
                        key={shape.id}
                        cx={shape.x + 40}
                        cy={shape.y + 40}
                        r={shape.size / 2.2}
                        fill="transparent"
                        stroke={shape.stroke || shape.color}
                        strokeWidth={Math.max(2, shape.size / 12)}
                        opacity={shape.opacity}
                      />
                    );
                  case "triangle": {
                    const size = shape.size;
                    const points = `${shape.x},${shape.y + size} ${shape.x + size / 2},${shape.y} ${shape.x + size},${shape.y + size}`;
                    return (
                      <polygon
                        key={shape.id}
                        points={points}
                        fill={shape.color}
                        opacity={shape.opacity}
                        transform={`rotate(${shape.rotation} ${shape.x + size / 2} ${shape.y + size / 2})`}
                      />
                    );
                  }
                  case "spark":
                    return (
                      <path
                        key={shape.id}
                        d="M60 10 L68 40 L98 48 L68 56 L60 86 L52 56 L22 48 L52 40 Z"
                        fill={shape.color}
                        opacity={shape.opacity}
                        transform={`scale(${shape.size / 100}) rotate(${shape.rotation} 60 50)`}
                      />
                    );
                  default:
                    return null;
                }
              })}

              {variant.core.layers.map((layer, idx) => (
                <circle
                  key={`${variant.core.id}-${idx}`}
                  cx={60}
                  cy={60}
                  r={Math.max(10, layer.radius)}
                  fill={layer.fill}
                  stroke={layer.stroke}
                  strokeWidth={idx === 0 ? 2 : 1}
                  opacity={layer.opacity}
                />
              ))}
            </svg>
          </div>

          <div className="logo-preview-content">
            <div className="logo-preview-text" style={{ color: variant.typographyColor }}>
              {brand}
            </div>
            <div className="logo-preview-tagline" style={{ color: variant.taglineColor }}>
              {tagline}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

const variantFrom = (
  config: CampaignConfig,
  generationKey: string,
  palette: Palette,
  index: number
): LogoVariant => {
  const rand = createPrng(hashInput(config, generationKey, index));
  const gradient = computeGradient(palette, config.tone, rand);
  const shapes = generateShapes(palette, rand, config.structure, config.tone);
  const core = generateCoreMark(palette, rand);
  const typographyColor = palette.typography;
  const taglineColor = hexWithAlpha(palette.typography, 0.86);
  const accentGlow = palette.background;

  return {
    id: `${palette.id}-${index}`,
    palette,
    gradient,
    shapes,
    core,
    structure: config.structure,
    typographyColor,
    taglineColor,
    accentGlow
  };
};

const useVariants = (config: CampaignConfig, generationKey: string) =>
  useMemo(() => {
    const palette = getPaletteById(config.paletteId);
    return [0, 1, 2].map((index) => variantFrom(config, generationKey, palette, index));
  }, [config, generationKey]);

const MetaPlaybook = ({ insights }: { insights: InsightPack }) => {
  return (
    <div className="card stack-24" style={{ background: "rgba(19,22,40,0.85)" }}>
      <div>
        <span className="badge">
          <Sparkles size={14} /> Meta Strategy Pulse
        </span>
        <h2 style={{ margin: "12px 0 8px", fontSize: "26px", letterSpacing: "0.02em" }}>
          {insights.campaignHeadline}
        </h2>
        <p style={{ opacity: 0.78, lineHeight: 1.6, whiteSpace: "pre-line" }}>{insights.narrative}</p>
      </div>
      <div className="preview-grid">
        <InsightCard icon={<Rocket size={18} />} title="Channel Plan" items={insights.channelPlan} />
        <InsightCard icon={<Target size={18} />} title="CTA Arsenal" items={insights.ctaIdeas} />
        <InsightCard icon={<Users size={18} />} title="Performance Hooks" items={insights.performanceHooks} />
      </div>
    </div>
  );
};

const InsightCard = ({
  icon,
  title,
  items
}: {
  icon: ReactNode;
  title: string;
  items: string[];
}) => (
  <div className="card" style={{ background: "rgba(17, 20, 35, 0.72)", gap: "10px" }}>
    <header style={{ display: "flex", alignItems: "center", gap: "10px" }}>
      <div
        style={{
          width: 32,
          height: 32,
          display: "grid",
          placeItems: "center",
          borderRadius: 12,
          background: "rgba(88,101,242,0.18)",
          color: "#CAD4FF"
        }}
      >
        {icon}
      </div>
      <span style={{ fontWeight: 600, letterSpacing: "0.02em" }}>{title}</span>
    </header>
    <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: "8px" }}>
      {items.map((item) => (
        <li
          key={item}
          style={{
            background: "rgba(255,255,255,0.06)",
            borderRadius: 12,
            padding: "12px 14px",
            border: "1px solid rgba(255,255,255,0.1)",
            fontSize: 14,
            lineHeight: 1.5,
            color: "rgba(243,244,255,0.86)"
          }}
        >
          {item}
        </li>
      ))}
    </ul>
  </div>
);

const ControlPanel = () => {
  const { config, setField } = useLogoStore();
  return (
    <div className="card stack-24" style={{ background: "rgba(16,18,33,0.85)" }}>
      <div>
        <span className="badge">
          <Layers size={14} /> Campaign Inputs
        </span>
        <h2 style={{ margin: "12px 0", fontSize: "22px", letterSpacing: "0.03em" }}>
          Define the brand signature
        </h2>
      </div>
      <div className="stack-24">
        <fieldset className="form-grid">
          <div>
            <label htmlFor="brand">Brand / Experience</label>
            <input
              id="brand"
              value={config.brand}
              placeholder="Meta Horizon"
              onChange={(event) => setField("brand", event.target.value)}
            />
          </div>
          <div>
            <label htmlFor="tagline">Tagline / Promise</label>
            <input
              id="tagline"
              value={config.tagline}
              placeholder="Build worlds together"
              onChange={(event) => setField("tagline", event.target.value)}
            />
          </div>
        </fieldset>
        <fieldset>
          <label htmlFor="goal">Campaign Goal</label>
          <textarea
            id="goal"
            value={config.campaignGoal}
            placeholder="Drive retention and new creator sign-ups"
            onChange={(event) => setField("campaignGoal", event.target.value)}
          />
        </fieldset>
        <fieldset>
          <label htmlFor="audience">Primary Audience</label>
          <textarea
            id="audience"
            value={config.audience}
            placeholder="Next-gen creators exploring immersive storytelling"
            onChange={(event) => setField("audience", event.target.value)}
          />
        </fieldset>
        <fieldset>
          <label htmlFor="keywords">Keywords & Energy (comma separated)</label>
          <textarea
            id="keywords"
            value={config.keywords}
            placeholder="immersive, collaborative, social, futurism"
            onChange={(event) => setField("keywords", event.target.value)}
          />
        </fieldset>
        <fieldset>
          <label>Logo Tone</label>
          <div className="tabs">
            {(["bold", "playful", "elegant", "futuristic", "organic"] as CampaignTone[]).map((tone) => (
              <button
                key={tone}
                className={tone === config.tone ? "active" : ""}
                type="button"
                onClick={() => setField("tone", tone)}
              >
                {tone}
              </button>
            ))}
          </div>
        </fieldset>
        <fieldset>
          <label>Lockup Structure</label>
          <div className="tabs">
            {(["icon-left", "icon-top", "icon-overlay"] as LogoStructure[]).map((structure) => (
              <button
                key={structure}
                className={structure === config.structure ? "active" : ""}
                type="button"
                onClick={() => setField("structure", structure)}
              >
                {structure.replace("icon-", "Icon ")}
              </button>
            ))}
          </div>
        </fieldset>
        <fieldset>
          <label>Palette</label>
          <div className="palette-grid">
            {palettes.map((palette) => (
              <button
                key={palette.id}
                type="button"
                className={`palette-swatch${palette.id === config.paletteId ? " active" : ""}`}
                style={{ background: palette.background }}
                onClick={() => setField("paletteId", palette.id)}
              >
                <span>{palette.name.split(" ")[0]}</span>
              </button>
            ))}
          </div>
        </fieldset>
      </div>
    </div>
  );
};

const HistoryDeck = ({ history }: { history: SavedLogo[] }) => (
  <div className="card stack-24" style={{ background: "rgba(15,16,30,0.78)" }}>
    <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <div>
        <span className="badge">
          <History size={14} /> Deck
        </span>
        <h2 style={{ margin: "12px 0 0", fontSize: 20, letterSpacing: "0.02em" }}>
          Saved logo concepts
        </h2>
      </div>
    </header>
    {history.length === 0 ? (
      <div className="empty-state">
        <strong>No saved variants yet</strong>
        Craft a concept you love and save it here for stakeholder share-outs.
      </div>
    ) : (
      <div className="logo-wall">
        {history.map((logo) => (
          <article key={logo.id} className="history-card">
            <header>
              <div>
                <strong>{logo.name}</strong>
                <div style={{ fontSize: 12, opacity: 0.7 }}>{logo.paletteLabel}</div>
              </div>
              <time style={{ fontSize: 12, opacity: 0.5 }}>
                {new Date(logo.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </time>
            </header>
            <img
              src={logo.dataUrl}
              alt={`${logo.name} logo concept`}
              style={{ width: "100%", borderRadius: 14, border: "1px solid rgba(255,255,255,0.12)" }}
            />
            <p style={{ fontSize: 13, opacity: 0.75, lineHeight: 1.5 }}>{logo.summary}</p>
            <div className="logo-actions">
              <button className="secondary-button" type="button" onClick={() => navigator.clipboard.writeText(logo.dataUrl)}>
                <Share2 size={16} /> Copy URL
              </button>
              <a
                className="secondary-button"
                href={logo.dataUrl}
                download={`${logo.name.replace(/\s+/g, "-").toLowerCase()}-meta-logo.png`}
              >
                <Download size={16} /> PNG
              </a>
            </div>
          </article>
        ))}
      </div>
    )}
  </div>
);

export const LogoAgent = () => {
  const { config, generationKey, regenerate, history, addHistoryEntry } = useLogoStore();
  const variants = useVariants(config, generationKey);
  const [active, setActive] = useState(variants[0]?.id ?? "");
  const containerRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const insights = useMemo(() => deriveNarrative(config), [config]);

  useEffect(() => {
    if (!variants.find((variant) => variant.id === active)) {
      setActive(variants[0]?.id ?? "");
    }
  }, [variants, active]);

  const handleDownload = useCallback(
    async (id: string) => {
      const node = containerRefs.current[id];
      if (!node) return;
      const dataUrl = await toPng(node, { cacheBust: true, pixelRatio: 2 });
      const link = document.createElement("a");
      link.download = `${config.brand || "meta-logo"}.png`;
      link.href = dataUrl;
      link.click();
    },
    [config.brand]
  );

  const handleSave = useCallback(
    async (id: string) => {
      const node = containerRefs.current[id];
      const variant = variants.find((item) => item.id === id);
      if (!node || !variant) return;
      const dataUrl = await toPng(node, { cacheBust: true, pixelRatio: 2 });
      addHistoryEntry({
        name: config.brand || "Meta Concept",
        summary: `${structureIntros[variant.structure]} using ${variant.palette.name}. CTA: ${config.tagline || "Launch now"}.`,
        paletteLabel: variant.palette.name,
        dataUrl
      });
    },
    [addHistoryEntry, config.brand, config.tagline, variants]
  );

  const attachRef = useCallback(
    (id: string) => (node: HTMLDivElement | null) => {
      containerRefs.current[id] = node;
    },
    []
  );

  return (
    <main className="stack-32">
      <header className="card" style={{ background: "rgba(20,23,42,0.85)", gap: "18px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 24 }}>
          <div>
            <span className="badge">
              <Sparkles size={14} /> Meta Logo Agent
            </span>
            <h1 style={{ margin: "14px 0 6px", fontSize: 34, letterSpacing: "0.02em" }}>
              Generate logo systems for every Meta touchpoint
            </h1>
            <p style={{ opacity: 0.77, lineHeight: 1.6 }}>
              Feed in your campaign inputs and capture export-ready logo marks engineered for Feed, Stories, and Reels.
            </p>
          </div>
          <button className="primary-button" type="button" onClick={regenerate}>
            <RefreshCcw size={16} />
            Pulse Variants
          </button>
        </div>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <div className="secondary-button" style={{ cursor: "default" }}>
            <Rocket size={16} /> {config.campaignGoal || "Define KPI"}
          </div>
          <div className="secondary-button" style={{ cursor: "default" }}>
            <Users size={16} /> {config.audience || "Audience insight"}
          </div>
          <div className="secondary-button" style={{ cursor: "default" }}>
            <Target size={16} /> {config.keywords.split(",").slice(0, 3).join(" · ") || "Add keywords"}
          </div>
        </div>
      </header>

      <div className="two-col">
        <ControlPanel />

        <div className="stack-24">
          <div className="card stack-24" style={{ background: "rgba(18,20,36,0.82)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <span className="badge">
                  <Wand2 size={14} /> Logo Lab
                </span>
                <h2 style={{ margin: "12px 0 0", fontSize: 24, letterSpacing: "0.02em" }}>Concept explorations</h2>
              </div>
              <div className="tabs">
                {variants.map((variant) => (
                  <button
                    key={variant.id}
                    className={variant.id === active ? "active" : ""}
                    type="button"
                    onClick={() => setActive(variant.id)}
                  >
                    {variant.palette.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="preview-grid">
              {variants.map((variant) => (
                <div
                  key={variant.id}
                  style={{ display: "flex", flexDirection: "column", gap: 14, cursor: "pointer" }}
                  role="button"
                  tabIndex={0}
                  onClick={() => setActive(variant.id)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      setActive(variant.id);
                    }
                  }}
                >
                  <LogoTile
                    ref={attachRef(variant.id)}
                    variant={variant}
                    config={config}
                    active={variant.id === active}
                  />
                  <div className="logo-actions">
                    <button className="primary-button" type="button" onClick={() => handleSave(variant.id)}>
                      <Save size={16} /> Save to Deck
                    </button>
                    <button className="secondary-button" type="button" onClick={() => handleDownload(variant.id)}>
                      <Download size={16} /> Download
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <MetaPlaybook insights={insights} />
        </div>
      </div>

      <HistoryDeck history={history} />
    </main>
  );
};
