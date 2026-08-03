// tokens.ts — the design token model. src/lib/tokens.ts
//
// Tokens are the contract between the designer and the model. They're serialised
// twice: once as CSS custom properties for the preview iframe, and once as a plain
// text listing for the prompt. Both come from this one source, so the model can
// never be told about a token the preview doesn't have.

export type Scale = Record<string, string>;

export interface TokenSet {
  id: string;
  name: string;
  colors: Scale;
  space: Scale;
  radius: Scale;
  fontSize: Scale;
  fontWeight: Scale;
  fontFamily: { sans: string; mono: string };
}

export type ScaleKey = "colors" | "space" | "radius" | "fontSize" | "fontWeight";

/** CSS custom property prefix per scale. */
export const PREFIX: Record<ScaleKey, string> = {
  colors: "color",
  space: "space",
  radius: "radius",
  fontSize: "text",
  fontWeight: "weight",
};

export const cssVarName = (scale: ScaleKey, key: string) => `--${PREFIX[scale]}-${key}`;

export const SCALES: ScaleKey[] = ["colors", "space", "radius", "fontSize", "fontWeight"];

/* --------------------------------------------------------------- presets -- */

export const PRESETS: TokenSet[] = [
  {
    id: "press",
    name: "Press",
    colors: {
      bg: "#F7F6F2",
      surface: "#FFFFFF",
      ink: "#1A1A17",
      muted: "#6B6A62",
      line: "#E0DFD7",
      accent: "#1F4E3D",
      "accent-ink": "#FFFFFF",
    },
    space: { "1": "4px", "2": "8px", "3": "12px", "4": "20px", "5": "32px", "6": "52px" },
    radius: { none: "0px", sm: "2px", md: "4px", lg: "8px", pill: "999px" },
    fontSize: { xs: "12px", sm: "14px", md: "16px", lg: "22px", xl: "32px" },
    fontWeight: { normal: "400", medium: "500", bold: "700" },
    fontFamily: {
      sans: "'Instrument Sans', system-ui, sans-serif",
      mono: "'JetBrains Mono', ui-monospace, monospace",
    },
  },
  {
    id: "console",
    name: "Console",
    colors: {
      bg: "#0E1116",
      surface: "#171C24",
      ink: "#E3E8F0",
      muted: "#7A8595",
      line: "#2A323D",
      accent: "#5EE9A4",
      "accent-ink": "#06120C",
    },
    space: { "1": "2px", "2": "6px", "3": "10px", "4": "16px", "5": "24px", "6": "40px" },
    radius: { none: "0px", sm: "2px", md: "3px", lg: "6px", pill: "999px" },
    fontSize: { xs: "11px", sm: "13px", md: "15px", lg: "20px", xl: "28px" },
    fontWeight: { normal: "400", medium: "500", bold: "600" },
    fontFamily: {
      sans: "'JetBrains Mono', ui-monospace, monospace",
      mono: "'JetBrains Mono', ui-monospace, monospace",
    },
  },
  {
    id: "bloom",
    name: "Bloom",
    colors: {
      bg: "#FDF2F6",
      surface: "#FFFFFF",
      ink: "#3B1F2B",
      muted: "#8C6B79",
      line: "#F2D9E3",
      accent: "#D4537E",
      "accent-ink": "#FFFFFF",
    },
    space: { "1": "6px", "2": "12px", "3": "18px", "4": "28px", "5": "44px", "6": "68px" },
    radius: { none: "0px", sm: "8px", md: "16px", lg: "28px", pill: "999px" },
    fontSize: { xs: "13px", sm: "15px", md: "17px", lg: "24px", xl: "38px" },
    fontWeight: { normal: "400", medium: "500", bold: "700" },
    fontFamily: {
      sans: "'Instrument Sans', system-ui, sans-serif",
      mono: "'JetBrains Mono', ui-monospace, monospace",
    },
  },
];

export const clonePreset = (id: string): TokenSet => {
  const found = PRESETS.find((p) => p.id === id) ?? PRESETS[0];
  return JSON.parse(JSON.stringify(found)) as TokenSet;
};

/* ----------------------------------------------------------- serialising -- */

/** Every token as a CSS custom property declaration block body. */
export function toCssVars(tokens: TokenSet): string {
  const lines: string[] = [];
  for (const scale of SCALES) {
    for (const [key, value] of Object.entries(tokens[scale])) {
      lines.push(`  ${cssVarName(scale, key)}: ${value};`);
    }
  }
  lines.push(`  --font-sans: ${tokens.fontFamily.sans};`);
  lines.push(`  --font-mono: ${tokens.fontFamily.mono};`);
  return lines.join("\n");
}

/** Flat list of every legal var name, for the prompt and the linter. */
export function allVars(tokens: TokenSet): { name: string; value: string; scale: ScaleKey }[] {
  const out: { name: string; value: string; scale: ScaleKey }[] = [];
  for (const scale of SCALES) {
    for (const [key, value] of Object.entries(tokens[scale])) {
      out.push({ name: cssVarName(scale, key), value, scale });
    }
  }
  return out;
}

/** Human-readable token listing injected into the prompt. */
export function toPromptListing(tokens: TokenSet): string {
  const section = (label: string, scale: ScaleKey) =>
    `${label}:\n` +
    Object.entries(tokens[scale])
      .map(([key, value]) => `  ${cssVarName(scale, key)} = ${value}`)
      .join("\n");

  return [
    section("Colours", "colors"),
    section("Spacing", "space"),
    section("Radii", "radius"),
    section("Font sizes", "fontSize"),
    section("Font weights", "fontWeight"),
    `Fonts:\n  --font-sans = ${tokens.fontFamily.sans}\n  --font-mono = ${tokens.fontFamily.mono}`,
  ].join("\n\n");
}
