// api/generate.ts — Vercel serverless function.
//
// Exists so the deployed demo works for someone who doesn't own an API key. The key
// stays in an env var and never reaches the browser. The cap is per warm instance,
// not global, so treat it as a speed bump rather than a real budget control — set a
// spend limit on the key in the Anthropic console too.

export const config = { runtime: "nodejs" };

const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 8;
const MAX_PROMPT = 4000;

let windowStart = Date.now();
let count = 0;

function overCap(): boolean {
  const now = Date.now();
  if (now - windowStart > WINDOW_MS) {
    windowStart = now;
    count = 0;
  }
  count += 1;
  return count > MAX_PER_WINDOW;
}

export default async function handler(request: Request): Promise<Response> {
  if (request.method !== "POST") {
    return Response.json({ error: { message: "POST only" } }, { status: 405 });
  }

  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) {
    return Response.json(
      { error: { message: "No demo key configured. Paste your own key in the field above." } },
      { status: 501 },
    );
  }

  if (overCap()) {
    return Response.json(
      { error: { message: "Demo quota reached — paste your own API key to keep going." } },
      { status: 429 },
    );
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return Response.json({ error: { message: "Malformed JSON" } }, { status: 400 });
  }

  const messages = body.messages as { role: string; content: string }[] | undefined;
  const size = JSON.stringify(messages ?? "").length;
  if (!messages?.length || size > MAX_PROMPT) {
    return Response.json({ error: { message: "Prompt missing or too long" } }, { status: 400 });
  }

  const upstream = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": key,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: body.model,
      max_tokens: Math.min(Number(body.max_tokens) || 2000, 2000),
      system: body.system,
      messages,
    }),
  });

  const text = await upstream.text();
  return new Response(text, {
    status: upstream.status,
    headers: { "content-type": "application/json" },
  });
}
