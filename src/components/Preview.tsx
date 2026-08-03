// Preview.tsx — src/components/Preview.tsx
//
// The component runs in a sandboxed iframe, compiled by Babel standalone. Sandboxing
// matters: this is model-authored code executing in the page, and `sandbox="allow-scripts"`
// without allow-same-origin denies it access to this document, localStorage and cookies.
//
// The important behaviour is what does NOT reload. Token edits are pushed over
// postMessage and applied to the iframe's :root, so the component re-themes without
// remounting — no flash, no lost state, and it proves the JSX is genuinely bound to
// variables rather than baked values.

import { useEffect, useMemo, useRef, useState } from "react";
import { componentName } from "../lib/generate";
import { toCssVars, type TokenSet } from "../lib/tokens";

const REACT_CDN = "https://unpkg.com/react@18/umd/react.production.min.js";
const REACT_DOM_CDN = "https://unpkg.com/react-dom@18/umd/react-dom.production.min.js";
const BABEL_CDN = "https://unpkg.com/@babel/standalone@7/babel.min.js";

interface PreviewProps {
  code: string;
  tokens: TokenSet;
}

function harness(code: string, tokens: TokenSet): string {
  const name = componentName(code);
  return `<!doctype html>
<html>
<head>
<meta charset="utf-8">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Instrument+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">
<style>
:root {
${toCssVars(tokens)}
}
* { box-sizing: border-box; }
html, body { margin: 0; }
body {
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: 32px;
  background: var(--color-bg);
  color: var(--color-ink);
  font-family: var(--font-sans);
}
#err {
  display: none;
  max-width: 520px;
  font: 12px/1.6 ui-monospace, monospace;
  color: #B42318;
  background: #FEF3F2;
  border: 1px solid #FDA29B;
  border-radius: 6px;
  padding: 12px 14px;
  white-space: pre-wrap;
}
</style>
</head>
<body>
<div id="root"></div>
<pre id="err"></pre>
<script src="${REACT_CDN}"></script>
<script src="${REACT_DOM_CDN}"></script>
<script src="${BABEL_CDN}"></script>
<script>
  window.addEventListener('message', function (event) {
    var data = event.data || {};
    if (data.type === 'tokens' && typeof data.css === 'string') {
      var sheet = document.getElementById('token-sheet');
      if (!sheet) {
        sheet = document.createElement('style');
        sheet.id = 'token-sheet';
        document.head.appendChild(sheet);
      }
      sheet.textContent = ':root {\\n' + data.css + '\\n}';
    }
  });

  function fail(message) {
    var box = document.getElementById('err');
    box.style.display = 'block';
    box.textContent = String(message);
    parent.postMessage({ type: 'preview-error', message: String(message) }, '*');
  }

  window.onerror = function (message) { fail(message); return true; };

  try {
    var source = ${JSON.stringify(code)};
    var compiled = Babel.transform(source + '\\nwindow.__Component = ${name};', {
      presets: [['react', { runtime: 'classic' }]]
    }).code;
    (0, eval)(compiled);
    if (typeof window.__Component !== 'function') throw new Error('No component named ${name} was defined.');
    ReactDOM.createRoot(document.getElementById('root')).render(
      React.createElement(window.__Component)
    );
    parent.postMessage({ type: 'preview-ok' }, '*');
  } catch (error) {
    fail((error && error.message) || error);
  }
</script>
</body>
</html>`;
}

export function Preview({ code, tokens }: PreviewProps) {
  const frame = useRef<HTMLIFrameElement>(null);
  const [error, setError] = useState<string | null>(null);

  // Only the code goes into srcDoc. Tokens deliberately stay out of this memo —
  // including them would reload the frame on every colour tweak, which is exactly
  // the thing this design avoids.
  const doc = useMemo(() => (code ? harness(code, tokens) : ""), [code]);

  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      const data = event.data as { type?: string; message?: string };
      if (data?.type === "preview-error") setError(data.message ?? "Unknown error");
      if (data?.type === "preview-ok") setError(null);
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  useEffect(() => {
    frame.current?.contentWindow?.postMessage({ type: "tokens", css: toCssVars(tokens) }, "*");
  }, [tokens]);

  if (!code) {
    return (
      <div className="preview is-empty">
        <p>Describe a component and it renders here, wired to your tokens.</p>
      </div>
    );
  }

  return (
    <div className="preview">
      <iframe
        ref={frame}
        title="Component preview"
        className="preview-frame"
        sandbox="allow-scripts"
        srcDoc={doc}
        onLoad={() =>
          frame.current?.contentWindow?.postMessage(
            { type: "tokens", css: toCssVars(tokens) },
            "*",
          )
        }
      />
      {error && (
        <p className="preview-error" role="status">
          {error}
        </p>
      )}
    </div>
  );
}
