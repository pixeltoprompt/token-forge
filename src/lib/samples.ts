// samples.ts — src/lib/samples.ts
//
// Canned components so the app is fully explorable with no API key. This is not a
// fake API call — nothing pretends to be generated, and the UI labels it plainly.
// It exists because the linter, the auto-fix and the theme swap are the interesting
// parts, and none of them need a model to demonstrate.
//
// Each sample ships with deliberate violations, because a sample that scores 100%
// would show the linter doing nothing.

export interface Sample {
  id: string;
  label: string;
  keywords: string[];
  code: string;
}

export const SAMPLES: Sample[] = [
  {
    id: "pricing",
    label: "pricing card",
    keywords: ["pricing", "price", "plan", "card", "tier", "subscription"],
    code: `function PriceCard() {
  return (
    <div style={{
      width: '260px',
      background: '#FFFFFF',
      padding: '21px',
      borderRadius: 'var(--radius-lg)',
      border: '1px solid var(--color-line)',
      fontFamily: 'var(--font-sans)',
      color: 'var(--color-ink)'
    }}>
      <p style={{
        margin: 0,
        fontSize: 'var(--text-xs)',
        color: 'var(--color-muted)',
        letterSpacing: '0.08em',
        textTransform: 'uppercase'
      }}>Starter</p>
      <p style={{ margin: '8px 0 0', fontSize: '34px', fontWeight: 650 }}>
        $12
        <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-muted)' }}> / month</span>
      </p>
      <ul style={{
        listStyle: 'none',
        margin: 'var(--space-4) 0',
        padding: 0,
        display: 'grid',
        gap: 'var(--space-2)',
        fontSize: 'var(--text-sm)'
      }}>
        <li>Up to 3 projects</li>
        <li>Community support</li>
        <li>1 GB of storage</li>
      </ul>
      <button style={{
        width: '100%',
        padding: 'var(--space-3)',
        background: 'var(--color-accent)',
        color: 'var(--color-accent-ink)',
        border: 'none',
        borderRadius: 'var(--radius-md)',
        fontFamily: 'var(--font-sans)',
        fontSize: 'var(--text-sm)',
        fontWeight: 'var(--weight-medium)',
        cursor: 'pointer'
      }}>Choose Starter</button>
    </div>
  );
}`,
  },
  {
    id: "signup",
    label: "newsletter signup",
    keywords: ["newsletter", "signup", "sign up", "email", "subscribe", "form", "toggle"],
    code: `function NewsletterSignup() {
  return (
    <form style={{
      width: '320px',
      background: 'var(--color-surface)',
      padding: 'var(--space-4)',
      borderRadius: 'var(--radius-lg)',
      border: '1px solid #E0DFD7',
      fontFamily: 'var(--font-sans)',
      color: 'var(--color-ink)'
    }}>
      <h3 style={{ margin: 0, fontSize: 'var(--text-lg)', fontWeight: 'var(--weight-bold)' }}>
        Field notes
      </h3>
      <p style={{ margin: '6px 0 var(--space-4)', fontSize: 'var(--text-sm)', color: 'var(--color-muted)' }}>
        Occasional writing on design systems.
      </p>
      <label htmlFor="email" style={{ display: 'block', fontSize: 'var(--text-xs)', marginBottom: 'var(--space-1)' }}>
        Email address
      </label>
      <input
        id="email"
        type="email"
        placeholder="you@studio.com"
        style={{
          width: '100%',
          padding: 'var(--space-2)',
          border: '1px solid var(--color-line)',
          borderRadius: 'var(--radius-sm)',
          fontFamily: 'var(--font-sans)',
          fontSize: '15px',
          color: 'var(--color-ink)'
        }}
      />
      <div style={{ display: 'flex', gap: 'var(--space-2)', margin: 'var(--space-3) 0' }}>
        {['Weekly', 'Monthly'].map(function (option, index) {
          return (
            <label key={option} style={{
              flex: 1,
              padding: 'var(--space-2)',
              textAlign: 'center',
              border: '1px solid var(--color-line)',
              borderRadius: 'var(--radius-sm)',
              background: index === 0 ? 'var(--color-bg)' : 'transparent',
              fontSize: 'var(--text-sm)',
              cursor: 'pointer'
            }}>
              <input type="radio" name="cadence" defaultChecked={index === 0} style={{ marginRight: 'var(--space-1)' }} />
              {option}
            </label>
          );
        })}
      </div>
      <button type="submit" style={{
        width: '100%',
        padding: 'var(--space-3)',
        background: 'var(--color-accent)',
        color: 'var(--color-accent-ink)',
        border: 'none',
        borderRadius: 'var(--radius-md)',
        fontFamily: 'var(--font-sans)',
        fontSize: 'var(--text-sm)',
        fontWeight: 'var(--weight-medium)',
        cursor: 'pointer'
      }}>Subscribe</button>
    </form>
  );
}`,
  },
  {
    id: "empty",
    label: "empty state",
    keywords: ["empty", "state", "placeholder", "nothing", "blank", "list"],
    code: `function EmptyState() {
  return (
    <div style={{
      width: '340px',
      textAlign: 'center',
      background: 'var(--color-surface)',
      padding: '44px',
      borderRadius: 'var(--radius-lg)',
      border: '1px dashed var(--color-line)',
      fontFamily: 'var(--font-sans)',
      color: 'var(--color-ink)'
    }}>
      <div style={{
        width: '48px',
        height: '48px',
        margin: '0 auto var(--space-3)',
        borderRadius: 'var(--radius-pill)',
        background: 'var(--color-bg)',
        border: '1px solid var(--color-line)'
      }} />
      <h3 style={{ margin: 0, fontSize: 'var(--text-md)', fontWeight: 'var(--weight-medium)' }}>
        No projects yet
      </h3>
      <p style={{
        margin: 'var(--space-2) 0 var(--space-4)',
        fontSize: 'var(--text-sm)',
        color: 'rgb(107, 106, 98)',
        lineHeight: 1.5
      }}>
        Your first project will show up here once you create one.
      </p>
      <button style={{
        padding: 'var(--space-2) var(--space-4)',
        background: 'var(--color-accent)',
        color: 'var(--color-accent-ink)',
        border: 'none',
        borderRadius: 'var(--radius-md)',
        fontFamily: 'var(--font-sans)',
        fontSize: 'var(--text-sm)',
        fontWeight: 'var(--weight-medium)',
        cursor: 'pointer'
      }}>New project</button>
    </div>
  );
}`,
  },
];

/** Best sample for a prompt, by keyword overlap. Falls back to the first. */
export function pickSample(prompt: string): Sample {
  const words = prompt.toLowerCase();
  let best = SAMPLES[0];
  let bestScore = 0;
  for (const sample of SAMPLES) {
    const score = sample.keywords.filter((k) => words.includes(k)).length;
    if (score > bestScore) {
      best = sample;
      bestScore = score;
    }
  }
  return best;
}
