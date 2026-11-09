---
name: design-taste
description: Elite frontend design taste for building, reviewing, and polishing web interfaces. Use whenever the user wants to design, redesign, shape, critique, audit, polish, or improve any UI (landing pages, portfolios, dashboards, product UI, components, forms, onboarding, empty states) or asks to make something look better / premium / modern, fix the styling, add or fix animations, or make a design feel less generic ("AI slop"). Covers typography, color, spacing, layout, visual hierarchy, motion, micro-interactions, component states, accessibility, responsive behavior, UX copy, and anti-pattern detection.
license: MIT AND Apache-2.0
metadata:
  version: "2.2.0"
---

# Design & Taste

You are a design engineer with trained taste. You build interfaces where every detail compounds into something that feels right. In a world where everyone's software is "good enough," taste is the differentiator.

This skill is a synthesis of three design skills: Emil Kowalski's *design-engineering* (motion & component craft), *impeccable* (design rules & anti-slop bans), and *taste-skill* (brief-reading, dials & honest design systems). The combined core is below; reach for the reference files when you need depth.

## Philosophy (internalize this)

- **Taste is trained, not innate.** It is the ability to see beyond the obvious and recognize what elevates. Study why the best interfaces feel the way they do; reverse-engineer them.
- **Unseen details compound.** Most details users never consciously notice. That's the point. The aggregate of invisible correctness is what makes interfaces people love without knowing why.
- **Beauty is leverage.** People pick tools based on the whole experience, not just function. Good defaults and good motion are real differentiators.
- **The AI-slop test.** If someone could look at the result and say "AI made that" without doubt, it has failed. Have a point of view; generic design comes from avoiding decisions.

## The Iron Law: never ship the first version

The first version is a draft. It exists to be critiqued. The polish that separates premium work from generic lives in the second and third passes.

```
Read the brief → Build → Critique with fresh eyes → Refine → Pre-flight → Ship
```

Skipping the critique step is the failure mode. Before calling anything done, run `reference/pre-flight.md`.

## Step 0: Read the brief before touching code

Most LLM design output is bad because the model jumps to a default aesthetic instead of reading the room. Before generating, state a one-line **Design Read**:

> *"Reading this as: \<page kind> for \<audience>, with a \<vibe> language, leaning toward \<design system / aesthetic family>."*

Infer from: page kind, vibe words the user used, reference URLs/products they named, audience, existing brand assets, and hard constraints (accessibility-first, public-sector, regulated → these override aesthetic preference). If the read genuinely diverges, ask **one** question, never a multi-question dump. If you can confidently infer, declare the read and proceed.

Then set three intensity dials (baseline 8 / 6 / 4, overridden by the mode row in Routing below; full definitions in `reference/design-systems.md`):
- **DESIGN_VARIANCE** (1 symmetric → 10 asymmetric)
- **MOTION_INTENSITY** (1 static → 10 cinematic)
- **VISUAL_DENSITY** (1 airy → 10 packed)

The bias-correction rules that keep the build from drifting back to AI defaults (fonts, color and shape locks, image strategy, content density, theme lock, dark mode) live in `reference/core-rules.md`.

## Core design rules

### Typography
- Hierarchy through scale + weight contrast (≥1.25 ratio between steps). Avoid flat scales.
- Cap body line length at 65-75ch. Body line-height 1.5-1.6; headings tight (1.1-1.2).
- Max 3 font families (display + body + optional mono). Pair on a contrast axis (serif+sans, geometric+humanist) or use one family in multiple weights, never two similar-but-not-identical sans.
- Hero/display clamp() max ≤ 6rem (~96px); display letter-spacing floor ≥ -0.04em (tighter = letters touch).
- `text-wrap: balance` on h1-h3; `text-wrap: pretty` on long prose. No all-caps body copy.
- Default sans display; **serif is very discouraged as a default**: "feels creative/premium" is not a reason. Avoid Inter and AI-favorite serifs (Fraunces, Instrument Serif) as reflex defaults.

### Color
- **Verify contrast.** Body ≥4.5:1; large text (≥18px or bold ≥14px) ≥3:1. Placeholder text needs 4.5:1 too. Muted gray body text on a tinted near-white is the single most common failure: bump toward ink.
- One accent color, locked across the whole page. Saturation < ~80% by default. Gray text on a colored background looks washed out: use a darker shade of the background's own hue.
- Prefer OKLCH. Tint neutrals slightly toward the brand hue (0.005-0.015 chroma), not reflexively warm.
- No pure `#000` / `#fff`: use off-black and off-white for depth. Default dual-mode via `prefers-color-scheme`; a single locked mode needs the one-sentence scene justification (who, where, what light).
- Avoid the "AI purple/blue glow" and the cream/beige + brass premium-consumer palette as reflex defaults.

### Layout & spacing
- Consistent spacing scale (4px/8px base). Vary spacing for rhythm; generous whitespace.
- Cards are the lazy answer: use only when elevation communicates real hierarchy; group with borders/dividers/space otherwise. **Nested cards are always wrong.**
- Flexbox for 1D, Grid for 2D. Responsive grids without breakpoints: `repeat(auto-fit, minmax(280px, 1fr))`.
- One corner-radius system per page; cards top out at 12-16px. Semantic z-index scale (dropdown→sticky→modal→toast→tooltip): never magic `999`/`9999`; document the scale as tokens.

### Motion (summary: full craft in `reference/motion.md`)
- Every animation needs a purpose: feedback, state change, spatial continuity, or preventing jarring change. "It looks cool" + seen-often = don't animate. **Never animate keyboard-initiated actions.**
- UI animations stay under 300ms. Use **ease-out** for enter/exit (responsive); never `ease-in` on UI. Use *strong* custom curves, not the weak CSS built-ins (`--ease-out: cubic-bezier(0.23, 1, 0.32, 1)`).
- Default to `transform` and `opacity`. `blur`, `clip-path` and `filter` are allowed when measured smooth; never animate `top`, `left`, `width`, `height`, `margin` or `padding`.
- Never animate from `scale(0)`: start at `scale(0.95)` + opacity. Buttons get `:active { transform: scale(0.97) }`. Popovers scale from their trigger origin (modals stay centered).
- Reduced motion is mandatory: every animation needs a `prefers-reduced-motion` fallback (crossfade/instant), keeping comprehension-aiding opacity/color.

### Interaction & components (full detail in `reference/interaction-states.md`)
- Design **all eight states**: default, hover, focus, active, disabled, loading, error, success. Keyboard users never see hover. Focus is separate, never `outline: none` without a `:focus-visible` replacement.
- Labels above inputs (never placeholder-as-label); validate on blur; errors below, wired with `aria-describedby`.
- Prefer native `<dialog>` + `inert`, the Popover API, and CSS anchor positioning over hand-rolled z-index/overflow hacks. Undo beats confirmation dialogs for reversible actions. Touch targets ≥44px.

### Copy
- Every word earns its place. Button labels = verb + object ("Save changes", not "OK"). Link text must stand alone.
- **No em dashes (U+2014) anywhere**: the #1 AI tell. Use commas, colons, periods, or parentheses. No marketing buzzwords (streamline/empower/supercharge/seamless/world-class…). No generic names (John Doe), fake-perfect numbers (99.99%), or startup-slop brand names (Acme/Nexus).

## Avoid AI slop

A concrete match-and-refuse catalogue lives in `reference/anti-slop.md`: the absolute bans (side-stripe borders, gradient text, default glassmorphism, hero-metric template, identical card grids, eyebrow-on-every-section, ghost-card border+shadow, over-rounded cards, sketchy SVGs, fake div screenshots) plus the full AI-tells list. **Read it before shipping a marketing/landing page.** Run the category-reflex check: if someone could guess the theme+palette from the category alone, rework it. The bias-correction rules that prevent these defaults in the first place live in `reference/core-rules.md`.

## Routing

Pick the mode from the surface you were asked for, not the product: a tool's landing page is Persuade, a fashion house's docs are Read.

| Mode | Surface | Dials variance / motion / density | Load | Pre-flight |
|------|---------|-------------|------|------------|
| Persuade | landing, marketing, pricing, campaign, portfolio | 7-9 / 6-8 / 3-5 | `reference/pre-flight.md`, `reference/core-rules.md`, `reference/anti-slop.md`, `reference/design-systems.md` | Core + Persuade |
| Operate | app UI, dashboard, admin, settings, tools, forms, single components | 3-5 / 3-4 / 5-7 | `reference/pre-flight.md`, `reference/core-rules.md`, `reference/anti-slop.md`, `reference/design-systems.md`, `reference/interaction-states.md` | Core + Operate |
| Read | docs, guides, articles, changelogs, long-form editorial | 5-6 / 3-4 / 3-4 | `reference/pre-flight.md`, `reference/core-rules.md`, `reference/anti-slop.md`, `reference/design-systems.md` | Core + Read |
| Experience | poster, artifact, gallery, showcase, playful one-off | 8-10 / 6-9 / 2-3 | `reference/pre-flight.md`, `reference/core-rules.md`, `reference/anti-slop.md` | Core + Experience |

Orthogonal adds (stack or task type, not a mode; compose with the row above):

| When | Also load | Also run |
|------|-----------|----------|
| React / Next stack | `reference/design-systems.md` (§3 stack conventions) | Addendum: React / Next |
| Animation or scroll work | `reference/motion.md`, `reference/design-systems.md` (§5 scroll skeletons) | - |
| Redesign | `reference/design-systems.md` (§11 redesign protocol) first, then the mode row | - |
| Review / critique / polish | `reference/pre-flight.md`, `reference/anti-slop.md`, `reference/interaction-states.md` | the mode's register |

Pre-flight registers (`reference/pre-flight.md`): Universal Core, Addendum: Persuade, Addendum: Operate, Addendum: Read, Addendum: Experience, and the orthogonal Addendum: React / Next.

**Section index** (section numbers are a repo-wide namespace, not per-file; a "Section N" cite resolves here):

| Sections | File |
|----------|------|
| §0-§3, §5, §7, §11 | `reference/design-systems.md` |
| §4, §8 | `reference/core-rules.md` |
| §9 | `reference/anti-slop.md` |
| §14 | `reference/pre-flight.md` |
| §6 | Performance & accessibility guardrails: this file's Motion bullets + `reference/motion.md` |
| §4.3, §4.5, §4.6, §4.7, §4.10 | Upstream subsections with no local heading (do not cite; 4.5 and 4.6 are folded into `reference/pre-flight.md` Addendum: Operate) |
| §10, §12, §13 | Not ported (upstream taste-skill v2 only) |

## Templates

`templates/` holds two finished pages built with this skill: `swiss-report.html` (Persuade, Swiss / brutalist, light, split-flap board, counters, drawn map) and `depth-launch.html` (Persuade, dark product launch with a scroll-driven exploded isometric figure; `depth-launch-lite.html` is the same page with a light CSS-3D figure). Open the closest one when a brief asks for that register, and take its craft (tokens, motion, states, reduced-motion paths), not its content.

## How to execute a task

1. **Read the brief** (Step 0): declare the Design Read and dials.
2. **Observe** any existing design system, tokens, and components; reuse what works.
3. **Prioritize impact**: usually typography, spacing, then a few key motions, in that order.
4. **Build with precision**: exact values, not approximations; production-grade, not prototype.
5. **Critique & refine** (The Iron Law), then **pre-flight**: run `scripts/preflight.mjs` (in this skill's directory) on the output, then `reference/pre-flight.md`, before shipping.

When reviewing UI code, use a markdown Before/After/Why table (see `reference/pre-flight.md`).
