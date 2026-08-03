# Deploy

Vercel auto-detects Vite and picks up `api/generate.ts` as a serverless function.

    git init && git add . && git commit -m "Token Forge"
    gh repo create token-forge --public --source=. --push

Then **Add New → Project → Import** on vercel.com → **Deploy**.

## One environment variable

In Project Settings → Environment Variables, add:

    ANTHROPIC_API_KEY = sk-ant-...

Without it the app still works — visitors paste their own key — but the demo isn't
one-click. Set a spend limit on that key in the Anthropic console. The in-function cap
(8 requests/minute) resets per warm instance and is a speed bump, not a budget control.

## Check after deploying

- Generate a component with no key pasted — the serverless route should answer.
- Switch presets and confirm the preview re-themes without a flash or reload.
