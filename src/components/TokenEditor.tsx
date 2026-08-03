// TokenEditor.tsx — src/components/TokenEditor.tsx

import { PRESETS, SCALES, cssVarName, type ScaleKey, type TokenSet } from "../lib/tokens";

const LABEL: Record<ScaleKey, string> = {
  colors: "colour",
  space: "spacing",
  radius: "radius",
  fontSize: "type scale",
  fontWeight: "weight",
};

interface TokenEditorProps {
  tokens: TokenSet;
  onChange: (tokens: TokenSet) => void;
  onPreset: (id: string) => void;
}

export function TokenEditor({ tokens, onChange, onPreset }: TokenEditorProps) {
  const setValue = (scale: ScaleKey, key: string, value: string) => {
    onChange({ ...tokens, [scale]: { ...tokens[scale], [key]: value } });
  };

  return (
    <div className="tokens">
      <div className="tokens-presets" role="group" aria-label="Theme presets">
        {PRESETS.map((preset) => (
          <button
            key={preset.id}
            className={`preset ${tokens.id === preset.id ? "is-on" : ""}`}
            onClick={() => onPreset(preset.id)}
          >
            <span className="preset-chips" aria-hidden>
              {["bg", "accent", "ink"].map((k) => (
                <i key={k} style={{ background: preset.colors[k] }} />
              ))}
            </span>
            {preset.name}
          </button>
        ))}
      </div>

      {SCALES.map((scale) => (
        <section key={scale} className="tokens-group">
          <h3>{LABEL[scale]}</h3>
          <ul>
            {Object.entries(tokens[scale]).map(([key, value]) => (
              <li key={key}>
                <label htmlFor={`${scale}-${key}`} title={cssVarName(scale, key)}>
                  {key}
                </label>
                {scale === "colors" ? (
                  <span className="swatch-field">
                    <input
                      type="color"
                      aria-label={`${key} colour`}
                      value={/^#[0-9a-f]{6}$/i.test(value) ? value : "#000000"}
                      onChange={(e) => setValue(scale, key, e.target.value.toUpperCase())}
                    />
                    <input
                      id={`${scale}-${key}`}
                      type="text"
                      value={value}
                      spellCheck={false}
                      onChange={(e) => setValue(scale, key, e.target.value)}
                    />
                  </span>
                ) : (
                  <input
                    id={`${scale}-${key}`}
                    type="text"
                    value={value}
                    spellCheck={false}
                    onChange={(e) => setValue(scale, key, e.target.value)}
                  />
                )}
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
