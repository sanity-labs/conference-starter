# Accessibility

## Contrast contract

WCAG 2.2 AA targets: 4.5:1 for normal text, 3:1 for large text (≥18pt / 14pt bold). The starter aims for 7:1 (AAA) on primary reading text.

### Token pairings (light + dark mode)

| Text token | Safe surfaces | Unsafe pairing |
|---|---|---|
| `text-primary` | any surface (19.3:1 / 19.3:1) | — |
| `text-secondary` | any surface (10.5:1 / 13.5:1) | — |
| `text-muted` | `surface` ONLY (7.1:1 / 9.0:1) | `surface-muted`, `surface-alt` — drops below 5:1 for small text in dark mode |
| `text-on-muted` (→ secondary) | `surface-muted`, `surface-alt` | — |
| `text-accent` (blue-600 / blue-400) | `surface`, `surface-alt`, `surface-muted` (4.5:1+) | small-text on deep-tinted surfaces |

### The rule

**If the parent has `bg-surface-muted` or `bg-surface-alt`, use `text-text-on-muted` instead of `text-text-muted`.**

`text-on-muted` is an alias over `text-secondary` — it stays AA across every surface, including dark mode, while communicating the intent ("muted-looking text that's on a tinted background").

Why this exists: `text-muted` is tuned for 7:1 on pure `surface`. When it lands on `surface-muted` (`neutral-100` in light, `neutral-800` in dark), contrast drops to ~4.9:1 — still technically AA for normal text, but close to the floor and fails for small text in dark mode.

## Known safe patterns

- Session-type chips (`/`, `/sessions/[slug]`, related sessions): `bg-surface-muted text-text-on-muted` ✓
- Schedule break/social slots: `bg-surface-muted text-text-on-muted` ✓
- Venue amenity pills: `bg-surface-muted text-text-on-muted` ✓
- Concierge chat: all semantic tokens, no hardcoded grays ✓
- TrackBadge: filled `track.color` background with YIQ-computed text color ✓
- Buttons: `.btn-primary` uses `text-primary` as background + `surface` as foreground → 19.3:1 ✓

## Known red flags to watch for

1. **Hardcoded Tailwind palette classes in components** — `text-gray-400`, `text-slate-500`, `bg-gray-900`, etc. These bypass the semantic tokens and won't theme in dark mode. Migrate to `text-text-*` / `bg-surface-*`.
2. **`text-red-500` on any background** — Tailwind red-500 fails AA for small text on light surfaces. Use `text-red-700` or a semantic `text-error` token if/when one is added.
3. **`opacity-*` or color with alpha on text** — opacity changes contrast unpredictably against any non-white background. Prefer picking a lower-contrast token.
4. **Inline hex in `style={{color: …}}`** — only track color in `TrackBadge`, computed via YIQ. Anywhere else is a smell.
5. **`placeholder:text-gray-*`** — placeholder text has the same contrast requirements as body text. Use `placeholder:text-text-muted`.

## How to check

1. **Token-pair grep before committing**:
   ```
   rg -n 'bg-surface-muted.*text-text-muted|text-text-muted.*bg-surface-muted' apps/web/src
   rg -n 'text-(gray|slate|zinc|neutral)-\\d+' apps/web/src
   rg -n 'text-red-[345]00' apps/web/src
   ```
   All three should return zero hits.
2. **Browser DevTools Accessibility panel** — pick a text node, check "Contrast" field.
3. **Manual dark-mode toggle** — click the footer toggle, verify all text is still readable on every surface.
4. **axe DevTools extension** — one-click full-page scan; zero violations is the target.

## What to do if you find a new violation

- Prefer fixing at the token layer (tune `text-muted` or add a new role token) over patching individual components.
- When introducing a new surface (e.g., `--color-surface-accent`), introduce its partner text token (`--color-text-on-accent`) at the same time. Don't ship one without the other.
- Run the grep commands above and sweep every existing usage in the same commit — low-contrast usually recurs in siblings (session-type chips in 3 different pages was a single pattern, not three bugs).
