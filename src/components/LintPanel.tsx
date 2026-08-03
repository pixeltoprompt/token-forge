// LintPanel.tsx — src/components/LintPanel.tsx

import type { Violation } from "../lib/lint";

interface LintPanelProps {
  violations: Violation[];
  score: number;
  hasCode: boolean;
  onFix: (violation: Violation) => void;
  onFixAll: () => void;
}

export function LintPanel({ violations, score, hasCode, onFix, onFixAll }: LintPanelProps) {
  const fixable = violations.filter((v) => v.suggestion).length;

  if (!hasCode) {
    return <p className="lint-idle">Compliance is checked after the first generation.</p>;
  }

  return (
    <div className="lint">
      <header className="lint-head">
        <div className={`score ${violations.length === 0 ? "is-clean" : ""}`}>
          <strong>{score}%</strong>
          <span>token compliance</span>
        </div>
        {fixable > 0 && (
          <button className="btn-fix-all" onClick={onFixAll}>
            fix all {fixable}
          </button>
        )}
      </header>

      {violations.length === 0 ? (
        <p className="lint-clean">
          Every value traces back to a token. Swap the theme and the component follows.
        </p>
      ) : (
        <ul className="lint-list">
          {violations.map((violation) => (
            <li key={violation.id} className={`lint-row is-${violation.kind}`}>
              <div className="lint-row-head">
                <code className="lint-raw">{violation.raw}</code>
                <span className="lint-line">line {violation.line}</span>
              </div>
              <p className="lint-msg">{violation.message}</p>
              {violation.suggestion ? (
                <button className="lint-fix" onClick={() => onFix(violation)}>
                  <span className="lint-fix-label">use</span>
                  <code>var({violation.suggestion.cssVar})</code>
                  {violation.suggestion.distance > 0 && (
                    <span className="lint-delta">
                      {violation.kind === "color"
                        ? `Δ${violation.suggestion.distance}`
                        : `${violation.suggestion.distance}px off`}
                    </span>
                  )}
                </button>
              ) : (
                <p className="lint-manual">No equivalent token — rewrite this by hand.</p>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
