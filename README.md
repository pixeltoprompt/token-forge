# Token Forge

Generate React components that are *inside* a design system rather than next to one.

**[Live demo →](https://your-url.vercel.app)**

Describe a component. The model receives your token set as a hard constraint, returns
JSX, and a linter verifies every value traces back to a token — flagging anything that
doesn't and offering the nearest legal replacement.

Then switch themes. The component re-themes with no regeneration, because the values
were never baked in.

## Why the linter exists

A model told "only use these tokens" mostly complies and quietly cheats at the edges —
a `#fff` here, a `13px` there. Prompting can't guarantee compliance, so this verifies it
after the fact. Violations are detected per CSS declaration, which is what makes
"nearest token" a real suggestion instead of a guess: `21px` on `padding` resolves
against the spacing scale, `#F7F6F1` on `background` resolves against the palette by RGB
distance.

## Run it

    npm install
    npm run dev

Paste an Anthropic API key in the header, or deploy with `ANTHROPIC_API_KEY` set and the
serverless function in `api/` handles it so visitors don't need one.

## Notes

Generated components execute in an iframe with `sandbox="allow-scripts"` and no
`allow-same-origin`, so model-authored code can't reach this document, its storage or
its cookies. Token edits reach the preview over `postMessage` and are applied to
`:root` — the frame never reloads, which is why theme swaps don't remount the component.
