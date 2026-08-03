// App.tsx — src/App.tsx

import { useCallback, useEffect, useMemo, useState } from "react";
import { LintPanel } from "./components/LintPanel";
import { Preview } from "./components/Preview";
import { TokenEditor } from "./components/TokenEditor";
import { applyAllFixes, applyFix, compliance, lintJsx, type Violation } from "./lib/lint";
import { generateComponent } from "./lib/generate";
import { clonePreset, type TokenSet } from "./lib/tokens";
import "./styles/app.css";

const SHELF_KEY = "forge:shelf";
const EXAMPLES = [
  "a pricing card with a plan name, price, three features and a call to action",
  "a newsletter signup with an email field and a frequency toggle",
  "an empty state for a project list, with an icon slot and a primary button",
];

interface Saved {
  id: string;
  label: string;
  code: string;
  tokenId: string;
}

const loadShelf = (): Saved[] => {
  try {
    const raw = localStorage.getItem(SHELF_KEY);
    return raw ? (JSON.parse(raw) as Saved[]) : [];
  } catch {
    return [];
  }
};

export default function App() {
  const [tokens, setTokens] = useState<TokenSet>(() => clonePreset("press"));
  const [prompt, setPrompt] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<"tokens" | "code">("tokens");
  const [shelf, setShelf] = useState<Saved[]>(loadShelf);

  const violations = useMemo(() => (code ? lintJsx(code, tokens) : []), [code, tokens]);
  const score = useMemo(
    () => (code ? compliance(code, tokens, violations) : 100),
    [code, tokens, violations],
  );

  useEffect(() => {
    try {
      localStorage.setItem(SHELF_KEY, JSON.stringify(shelf.slice(-24)));
    } catch {
      /* storage full or disabled — the shelf is a convenience, not a requirement */
    }
  }, [shelf]);

  const run = useCallback(
    async (instruction: string, iterate: boolean) => {
      if (!instruction.trim() || busy) return;
      setBusy(true);
      setError(null);
      try {
        const next = await generateComponent({
          prompt: instruction,
          tokens,
          apiKey: apiKey.trim() || undefined,
          previous: iterate ? code : undefined,
        });
        setCode(next);
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
      } finally {
        setBusy(false);
      }
    },
    [apiKey, busy, code, tokens],
  );

  const fix = (violation: Violation) => setCode((current) => applyFix(current, violation));
  const fixAll = () => setCode((current) => applyAllFixes(current, lintJsx(current, tokens)));

  const save = () => {
    if (!code) return;
    setShelf((prev) => [
      ...prev,
      {
        id: `c${Date.now()}`,
        label: prompt.trim().slice(0, 44) || "component",
        code,
        tokenId: tokens.id,
      },
    ]);
  };

  return (
    <div className="app">
      <header className="masthead">
        <div className="brand">
          <h1>Token Forge</h1>
          <p>Components generated inside a design system, not next to one.</p>
        </div>
        <input
          className="key"
          type="password"
          placeholder="sk-ant-… (optional, uses the demo key if blank)"
          value={apiKey}
          spellCheck={false}
          onChange={(e) => setApiKey(e.target.value)}
          aria-label="Anthropic API key"
        />
      </header>

      <div className="composer">
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Describe a component…"
          rows={2}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
              e.preventDefault();
              void run(prompt, false);
            }
          }}
        />
        <div className="composer-actions">
          <button className="btn primary" disabled={busy || !prompt.trim()} onClick={() => void run(prompt, false)}>
            {busy ? "generating…" : "generate"}
          </button>
          <button className="btn" disabled={busy || !code || !prompt.trim()} onClick={() => void run(prompt, true)}>
            revise
          </button>
          <button className="btn" disabled={!code} onClick={save}>
            save
          </button>
        </div>
      </div>

      {!code && (
        <ul className="examples">
          {EXAMPLES.map((example) => (
            <li key={example}>
              <button onClick={() => { setPrompt(example); void run(example, false); }}>{example}</button>
            </li>
          ))}
        </ul>
      )}

      {error && <p className="alert" role="alert">{error}</p>}

      <main className="grid">
        <section className="pane pane-left">
          <div className="pane-tabs" role="tablist">
            <button role="tab" aria-selected={tab === "tokens"} className={tab === "tokens" ? "is-on" : ""} onClick={() => setTab("tokens")}>
              tokens
            </button>
            <button role="tab" aria-selected={tab === "code"} className={tab === "code" ? "is-on" : ""} onClick={() => setTab("code")}>
              source
            </button>
          </div>
          <div className="pane-body">
            {tab === "tokens" ? (
              <TokenEditor
                tokens={tokens}
                onChange={setTokens}
                onPreset={(id) => setTokens(clonePreset(id))}
              />
            ) : (
              <textarea
                className="source"
                value={code}
                spellCheck={false}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Generated source appears here and stays editable."
              />
            )}
          </div>
        </section>

        <section className="pane pane-stage">
          <Preview code={code} tokens={tokens} />
        </section>

        <section className="pane pane-right">
          <LintPanel
            violations={violations}
            score={score}
            hasCode={Boolean(code)}
            onFix={fix}
            onFixAll={fixAll}
          />

          {shelf.length > 0 && (
            <div className="shelf">
              <h3>saved</h3>
              <ul>
                {shelf.slice().reverse().map((item) => (
                  <li key={item.id}>
                    <button onClick={() => setCode(item.code)}>{item.label}</button>
                    <button
                      className="shelf-drop"
                      aria-label={`Remove ${item.label}`}
                      onClick={() => setShelf((prev) => prev.filter((s) => s.id !== item.id))}
                    >
                      ×
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
