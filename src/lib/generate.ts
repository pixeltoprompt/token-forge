// generate.ts — talking to the model. src/lib/generate.ts
//
// Two transports: a Vercel function holding the deployment's key (so the live demo
// works for visitors), or the user's own key sent straight from the browser. The key
// is never persisted — it lives in React state for the session and nowhere else.

import { toPromptListing, type TokenSet } from "./tokens";

export const MODEL = "claude-sonnet-5";

export interface GenerateArgs {
  prompt: string;
  tokens: TokenSet;
  apiKey?: string;
  previous?: string;
  signal?: AbortSignal;
}

function systemPrompt(tokens: TokenSet): string {
  return `You write single React components for a design system with a fixed token set.

THE ONLY VALUES YOU MAY USE
${toPromptListing(tokens)}

RULES
1. Every colour, spacing, radius, font size and font weight must be written as var(--token-name) from the list above. Never write a hex code, an rgb() value, or a raw px/rem number.
2. Style with a plain inline style object. No Tailwind, no CSS-in-JS libraries, no imports.
3. Return exactly one function component. No imports, no exports, no markdown fences, no commentary.
4. The component takes no required props and renders meaningful placeholder content.
5. Use semantic HTML and include accessible labels where a control needs one.
6. 0 is allowed as a bare value, and so is a hairline width inside a border shorthand (border: '1px solid var(--color-line)'). Everything else must be a token.

Example of the expected shape:

function PriceCard() {
  return (
    <div style={{
      background: 'var(--color-surface)',
      padding: 'var(--space-4)',
      borderRadius: 'var(--radius-lg)',
      border: '1px solid var(--color-line)',
      fontFamily: 'var(--font-sans)',
      color: 'var(--color-ink)'
    }}>
      <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--weight-bold)', margin: 0 }}>Starter</h3>
    </div>
  );
}

Respond with the component source and nothing else.`;
}

/** Strip fences and prose the model may have wrapped around the component. */
export function extractComponent(raw: string): string {
  let code = raw.trim();
  const fence = code.match(/```(?:jsx?|tsx?|javascript)?\s*\n([\s\S]*?)```/);
  if (fence) code = fence[1];
  const start = code.search(/(?:export\s+default\s+)?(?:function|const)\s+[A-Z]/);
  if (start > 0) code = code.slice(start);
  return code
    .replace(/^export\s+default\s+/m, "")
    .replace(/^import[^\n]*\n/gm, "")
    .trim();
}

/** The component's name, so the harness knows what to render. */
export function componentName(code: string): string {
  return (
    code.match(/function\s+([A-Z][A-Za-z0-9_]*)/)?.[1] ??
    code.match(/(?:const|let|var)\s+([A-Z][A-Za-z0-9_]*)\s*=/)?.[1] ??
    "Component"
  );
}

interface AnthropicResponse {
  content?: { type: string; text?: string }[];
  error?: { message?: string };
}

export async function generateComponent({
  prompt,
  tokens,
  apiKey,
  previous,
  signal,
}: GenerateArgs): Promise<string> {
  const user = previous
    ? `Here is the current component:\n\n${previous}\n\nChange it: ${prompt}`
    : prompt;

  const body = {
    model: MODEL,
    max_tokens: 2000,
    system: systemPrompt(tokens),
    messages: [{ role: "user", content: user }],
  };

  const direct = Boolean(apiKey);
  const response = await fetch(direct ? "https://api.anthropic.com/v1/messages" : "/api/generate", {
    method: "POST",
    signal,
    headers: direct
      ? {
          "content-type": "application/json",
          "x-api-key": apiKey!,
          "anthropic-version": "2023-06-01",
          "anthropic-dangerous-direct-browser-access": "true",
        }
      : { "content-type": "application/json" },
    body: JSON.stringify(body),
  });

  const data = (await response.json().catch(() => ({}))) as AnthropicResponse;

  if (!response.ok) {
    const detail = data?.error?.message ?? `Request failed (${response.status})`;
    if (response.status === 401) throw new Error("That API key was rejected.");
    if (response.status === 429) throw new Error("Rate limited — wait a moment and retry.");
    throw new Error(detail);
  }

  const text = (data.content ?? [])
    .filter((block) => block.type === "text")
    .map((block) => block.text ?? "")
    .join("");

  const code = extractComponent(text);
  if (!code) throw new Error("The model returned no component code.");
  return code;
}
