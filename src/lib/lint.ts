// lint.ts — the differentiator. src/lib/lint.ts
//
// A model told "only use these tokens" will mostly comply and quietly cheat at the
// edges — a #fff here, a 13px there. Prompting alone can't guarantee compliance, so
// this verifies it after the fact.
//
// The scan is declaration-aware rather than a blind regex sweep over the whole file:
// knowing the CSS property tells us which scale a value should have come from, which
// is what makes "nearest legal token" a useful suggestion instead of a guess.

import { allVars, cssVarName, type ScaleKey, type TokenSet } from "./tokens";

export type ViolationKind = "color" | "size" | "weight" | "arbitrary";

export interface Suggestion {
  cssVar: string;
  value: string;
  /** How far off the original was — px for sizes, RGB distance for colours. */
  distance: number;
}

export interface Violation {
  id: string;
  kind: ViolationKind;
  /** The offending literal, e.g. "#ffffff" or "13px". */
  raw: string;
  /** CSS property it appeared on, kebab-cased. Empty for Tailwind arbitraries. */
  property: string;
  index: number;
  line: number;
  suggestion: Suggestion | null;
  message: string;
}

/* ------------------------------------------------------ property routing -- */

// Deliberately excludes width/height/min-/max-. A card's 260px width is layout, not
// spacing, and there is no width scale to resolve it against — the "nearest" spacing
// token to 260px is 52px, so auto-fix would collapse the component to a fifth of its
// size while reporting 100% compliance. A linter whose fix breaks the artefact is
// worse than no linter.
const SPACE_PROPS = /^(padding|margin|gap|inset|top|right|bottom|left|row-gap|column-gap)/;
const RADIUS_PROPS = /border-radius$|^border-radius/;
const FONT_SIZE_PROPS = /^font-size$|^line-height$/;
const WEIGHT_PROPS = /^font-weight$/;
const COLOR_PROPS = /color$|^background$|^background-color$|^border$|^border-color$|^outline-color$|^fill$|^stroke$|^box-shadow$/;

function scaleForProperty(property: string): ScaleKey | null {
  if (COLOR_PROPS.test(property)) return "colors";
  if (RADIUS_PROPS.test(property)) return "radius";
  if (FONT_SIZE_PROPS.test(property)) return "fontSize";
  if (WEIGHT_PROPS.test(property)) return "fontWeight";
  if (SPACE_PROPS.test(property)) return "space";
  return null;
}

const kebab = (s: string) => s.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();

/* ------------------------------------------------------------- distances -- */

function parseHex(hex: string): [number, number, number] | null {
  let h = hex.replace("#", "").trim();
  if (h.length === 3 || h.length === 4) h = h.slice(0, 3).split("").map((c) => c + c).join("");
  if (h.length === 8) h = h.slice(0, 6);
  if (h.length !== 6 || !/^[0-9a-f]{6}$/i.test(h)) return null;
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16),
  ];
}

function parseRgbFn(value: string): [number, number, number] | null {
  const m = value.match(/rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)/i);
  if (!m) return null;
  return [Number(m[1]), Number(m[2]), Number(m[3])];
}

const toRgb = (value: string) =>
  value.startsWith("#") ? parseHex(value) : parseRgbFn(value);

function nearestColor(value: string, tokens: TokenSet): Suggestion | null {
  const rgb = toRgb(value);
  if (!rgb) return null;
  let best: Suggestion | null = null;
  for (const [key, tokenValue] of Object.entries(tokens.colors)) {
    const other = toRgb(tokenValue);
    if (!other) continue;
    const distance = Math.sqrt(
      (rgb[0] - other[0]) ** 2 + (rgb[1] - other[1]) ** 2 + (rgb[2] - other[2]) ** 2,
    );
    if (!best || distance < best.distance) {
      best = { cssVar: cssVarName("colors", key), value: tokenValue, distance: Math.round(distance) };
    }
  }
  return best;
}

const toPx = (value: string): number | null => {
  const m = value.match(/^(-?[\d.]+)(px|rem|em)?$/);
  if (!m) return null;
  const n = Number(m[1]);
  return m[2] === "rem" || m[2] === "em" ? n * 16 : n;
};

function nearestSize(value: string, tokens: TokenSet, scale: ScaleKey): Suggestion | null {
  const target = toPx(value);
  if (target === null) return null;
  let best: Suggestion | null = null;
  for (const [key, tokenValue] of Object.entries(tokens[scale])) {
    const other = toPx(tokenValue);
    if (other === null) continue;
    const distance = Math.abs(target - other);
    if (!best || distance < best.distance) {
      best = { cssVar: cssVarName(scale, key), value: tokenValue, distance };
    }
  }
  return best;
}

function nearestWeight(value: string, tokens: TokenSet): Suggestion | null {
  const target = Number(value);
  if (!Number.isFinite(target)) return null;
  let best: Suggestion | null = null;
  for (const [key, tokenValue] of Object.entries(tokens.fontWeight)) {
    const distance = Math.abs(target - Number(tokenValue));
    if (!best || distance < best.distance) {
      best = { cssVar: cssVarName("fontWeight", key), value: tokenValue, distance };
    }
  }
  return best;
}

/* ------------------------------------------------------------------ scan -- */

const DECLARATION = /([a-zA-Z][a-zA-Z0-9-]*)\s*:\s*(['"`]?)([^;\n{}]*?)\2\s*[,;\n}]/g;
const LITERAL = /#[0-9a-fA-F]{3,8}\b|rgba?\([^)]*\)|hsla?\([^)]*\)|-?[\d.]+(?:px|rem|em)\b/g;
const ARBITRARY = /\b[a-z-]+-\[[^\]]+\]/g;

const lineAt = (source: string, index: number) => source.slice(0, index).split("\n").length;

/** Zero-ish values are legal everywhere; flagging `0px` is noise, not signal. */
const isTrivial = (raw: string) => /^-?0(px|rem|em)?$/.test(raw) || raw === "0";

export function lintJsx(code: string, tokens: TokenSet): Violation[] {
  const violations: Violation[] = [];
  let counter = 0;
  const add = (v: Omit<Violation, "id" | "line">, index: number) => {
    violations.push({ ...v, id: `v${++counter}`, line: lineAt(code, index) });
  };

  // 1. CSS/JSX style declarations
  for (const match of code.matchAll(DECLARATION)) {
    const property = kebab(match[1]);
    const value = match[3];
    const valueStart = match.index! + match[0].indexOf(match[3]);
    if (!value || value.includes("var(--")) {
      // a declaration may mix tokens and literals: keep scanning the literals
    }
    const scale = scaleForProperty(property);

    for (const lit of value.matchAll(LITERAL)) {
      const raw = lit[0];
      if (isTrivial(raw)) continue;
      const index = valueStart + lit.index!;
      const isColor = raw.startsWith("#") || /^(rgb|hsl)/i.test(raw);

      if (isColor) {
        const suggestion = nearestColor(raw, tokens);
        add({
          kind: "color",
          raw,
          property,
          index,
          suggestion,
          message: `Hardcoded colour on ${property}`,
        }, index);
        continue;
      }

      // numeric literal — only meaningful if the property maps to a scale
      if (!scale || scale === "colors") continue;
      const suggestion = nearestSize(raw, tokens, scale);
      add({
        kind: "size",
        raw,
        property,
        index,
        suggestion,
        message: `Hardcoded ${scale === "radius" ? "radius" : scale === "fontSize" ? "font size" : "length"} on ${property}`,
      }, index);
    }

    // bare font-weight numbers carry no unit, so the literal scan misses them
    if (scale === "fontWeight" && /^\d{3}$/.test(value.trim()) && !value.includes("var(")) {
      const legal = Object.values(tokens.fontWeight).includes(value.trim());
      if (!legal) {
        add({
          kind: "weight",
          raw: value.trim(),
          property,
          index: valueStart,
          suggestion: nearestWeight(value.trim(), tokens),
          message: `Font weight outside the ramp`,
        }, valueStart);
      }
    }
  }

  // 2. Tailwind arbitrary values — bypass the token layer entirely
  for (const match of code.matchAll(ARBITRARY)) {
    const raw = match[0];
    const inner = raw.slice(raw.indexOf("[") + 1, -1);
    if (inner.startsWith("var(--")) continue;
    add({
      kind: "arbitrary",
      raw,
      property: "",
      index: match.index!,
      suggestion: null,
      message: "Arbitrary utility value sidesteps the token set",
    }, match.index!);
  }

  return violations.sort((a, b) => a.index - b.index);
}

/* ------------------------------------------------------------------- fix -- */

/**
 * Is this offset inside a string literal? Style objects mix quoted values
 * (`padding: '21px'`) with bare ones (`fontWeight: 650`). Replacing the bare kind
 * with an unquoted `var(...)` produces source that won't parse, so the fix has to
 * know which it's looking at. Odd quote count before the offset on the same line.
 */
function insideString(code: string, index: number): boolean {
  const lineStart = code.lastIndexOf("\n", Math.max(index - 1, 0)) + 1;
  let single = 0;
  let double = 0;
  let backtick = 0;
  for (let i = lineStart; i < index; i++) {
    const ch = code[i];
    if (code[i - 1] === "\\") continue;
    if (ch === "'") single++;
    else if (ch === '"') double++;
    else if (ch === "`") backtick++;
  }
  return single % 2 === 1 || double % 2 === 1 || backtick % 2 === 1;
}

export function applyFix(code: string, violation: Violation): string {
  if (!violation.suggestion) return code;
  const token = `var(${violation.suggestion.cssVar})`;
  const replacement = insideString(code, violation.index) ? token : `'${token}'`;
  const before = code.slice(0, violation.index);
  const after = code.slice(violation.index + violation.raw.length);
  return `${before}${replacement}${after}`;
}

/** Fix every violation that has a suggestion. Applied back-to-front so indices hold. */
export function applyAllFixes(code: string, violations: Violation[]): string {
  return [...violations]
    .filter((v) => v.suggestion)
    .sort((a, b) => b.index - a.index)
    .reduce((acc, v) => applyFix(acc, v), code);
}

/** Percentage of token-legal values, for the compliance readout. */
export function compliance(code: string, tokens: TokenSet, violations: Violation[]): number {
  const used = (code.match(/var\(--[a-z0-9-]+\)/gi) ?? []).filter((v) =>
    allVars(tokens).some((t) => v.includes(t.name)),
  ).length;
  const total = used + violations.length;
  return total === 0 ? 100 : Math.round((used / total) * 100);
}
