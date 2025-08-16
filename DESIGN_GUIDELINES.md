### Agora Space UI Design Language (v1)

— For internal use by engineering and design. This document defines the visual language, tokens, and component rules used across the app. All implementations MUST conform to these rules.

#### 1. Brand Tone
- **Mood**: calm sci‑fi, grounded, precise. No neon/arcade. Minimal glow only for focus.
- **Shapes**: soft rectangles with consistent radius; no hexagons/trapezoids.
- **Surface**: layered dark neutrals; warm right-side tint.

#### 2. Typography
- **Families**:
  - Display: Rajdhani (caps-friendly). CSS var: `--font-display`.
  - Text: Geist Sans. CSS var: `--font-sans`.
  - Mono: Geist Mono (code/diagnostic only). Use sparingly.
- **Pairing rule**: Max 2 families per screen (Display + Text). Mono only for technical readouts.
- **Scale (px)**: 12, 14, 16, 20, 24, 32, 40, 56 (line-height 1.25–1.4). Headings in caps with +0.12em letterspacing.

#### 3. Color System (tokens)
- Text: `--foreground`, muted `--text-muted`.
- Surfaces: `--surface-1`, `--surface-2` (cards/inner panels).
- Accents: `--accent-olive` (primary), `--accent-amber` (secondary).
- Borders: `--border-soft` (1px). No inner glows.
- Background: `--bg-left` → `--bg-right` gradient + `poster-grid` lines.

#### 4. Spacing / Radius / Elevation
- Spacing grid: 4px base. Allowed steps: 4/8/12/16/24/32.
- Radius: `--radius-sm` 8, `--radius-md` 12, `--radius-lg` 16. Use consistently.
- Elevation: shadow only, levels
  - L1: 0 6px 20px rgba(0,0,0,.35)
  - L2: 0 12px 40px rgba(0,0,0,.45)

#### 5. Motion
- Durations: 120ms (tap), 200ms (major). No infinite decorative animations in production UI. Ping/bounce prohibited.

#### 6. Iconography
- Size: 16/20/24, stroke 1.5. Color follows text color of parent. No mixed color icons.

#### 7. Components
- Card: `poster-card` on `--surface-1/2`, `energy-border` with 1px `--border-soft`.
- Button:
  - Primary: `accent-btn` (olive/amber gradient subtle), uppercase, bold.
  - Quiet: `accent-btn--quiet` neutral surface with same radius/border.
  - States: hover translateY(-1px), disabled 60% opacity, focus ring via outline.
- Headline: `headline` uses `--font-display`, caps, letter-spacing.
- Badge: `badge` neutral and `badge--accent` for key status. No glowing pills.
- Chat bubble: same surface/border across roles; role is indicated via small label only.
- Status panel: one consistent style; no mixed colors per row.
- Modal: `poster-card` over 70% black scrim.

#### 8. Content Rules
- English labels in caps; Chinese正文常规大小写。技术标签才用 Mono。
- Copy style: short, functional. No role‑play jargon.

#### 9. Responsive
- Max width 1024 for shell; content gutter 16/24 on mobile/desktop.

#### 10. Engineering Mapping
- Use CSS variables in `globals.css` for all tokens.
- Use only classes: `poster-card`, `accent-btn`, `accent-btn--quiet`, `headline`, `badge`, `badge--accent`, `energy-border`, `poster-grid`.
- Remove: cyber-grid, particles, holographic, neon-text, scanning lines.


