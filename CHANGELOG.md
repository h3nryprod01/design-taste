# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [2.2.0] - 2026-11-09

### Added

- `templates/swiss-report.html`: a Swiss / brutalist annual-report page (Persuade, light) with a split-flap departure board, count-up figures, a monthly bar chart, a self-drawing network map and a word-by-word closing statement, all with reduced-motion fallbacks.
- `templates/depth-launch.html`: a dark product-launch page whose sticky section takes an isometric 75% keyboard (about 575 solids) apart in six layers on scroll, with captions, progress ticks and a live readout in step; a WebAudio switch-sound demo that also presses keys on the figure (mapped by `e.code`); a colourway picker with a view-transition reveal; a static layout for reduced motion or when GSAP fails to load. GSAP loads from cdnjs with SRI.
- `templates/depth-launch-lite.html`: the same page with a light CSS-3D keyboard.
- `templates/build/anatomy-keyboard.mjs`: generator for `depth-launch.html`, using the [Anatomy](https://github.com/wheresryan22/anatomy) kit (MIT) from a separate clone (`ANATOMY_DIR`).
- `docs/images/`: README screenshots of both templates (desktop and phone).
- README `Templates` section and a `Templates` pointer in `SKILL.md`.

### Fixed

- `scripts/preflight.mjs`: `SIDE_STRIPE_BORDER` no longer fires when the side border sits on the same line as a top or bottom border of the same weight (a grid cell edge, not an accent stripe). Two tests cover the negative and positive case.

## [2.1.0] - 2026-09-25

### Added

- Surface-mode register (Persuade / Operate / Read / Experience) replacing the landing-vs-React routing key. `SKILL.md`'s Routing table now keys on mode first and stack second, with a `Dials V/M/D` column per mode and a second table for orthogonal adds (React/Next stack, animation work, redesign, review).
- `reference/pre-flight.md`: `Addendum: Operate` (ported from impeccable's `reference/operate.md` and taste-skill 4.5 / 4.6 / 6.F), `Addendum: Read` and `Addendum: Experience` (design-taste originals seeded by impeccable's mode descriptions), alongside the renamed `Addendum: Persuade` (was Addendum A) and `Addendum: React / Next` (was Addendum B).
- Universal Core N/A rule: a box whose element does not exist on the surface is written `N/A` (with the missing element named in three words or fewer), never skipped or deleted.
- `scripts/preflight.mjs`: 8 new rules, `SCROLL_LISTENER`, `GRADIENT_TEXT`, `SIDE_STRIPE_BORDER`, `REPEATING_GRADIENT`, `FE_TURBULENCE`, `CURSOR_IMAGE` (HARD) and `PURE_BLACK_WHITE`, `GOOGLE_FONTS_LINK` (WARN); scans `.scss`, `.less`, `.astro`, `.ts` as code and `.mdx` as prose-only (same treatment as `.md`).
- `design-systems.md` §1.B: a "Product UI / dashboard (Operate)" dial preset (no upstream preset existed for it).
- Tests: routing-table shape and Load-cell coverage, Core self-containment, z-index semantics, outline semantics, and the 8 new scanner rules in `scripts/preflight.test.mjs` (17, up from 13), plus `scripts/preflight.gaps.test.mjs` with the five-brief routing contract, scanner edge cases, register order and NOTICE completeness (36 tests total).

### Changed

- Node floor raised from 20 to 22 (Node 20 reached end of life 2026-04-30); added `.nvmrc`. Tested on Node 22; the suite still passes on Node 20.
- `scripts/preflight.mjs` no longer follows symlinked files when walking a directory.
- `reference/design-systems.md`: US public-sector row and install command now point at `@uswds/uswds` (v3) instead of the superseded `uswds` package.
- `scripts/preflight.mjs` z-index semantics: hard-fails only the magic-number family (`999`, `9999`, ...) instead of any value `>= 999`; a scaled value `>= 1000` now warns only when the file defines no `--z-` custom property or `zIndex` map.
- `scripts/preflight.mjs` outline semantics: the `:focus-visible` escape hatch is evaluated per selector base or class attribute instead of file-wide; demoted to a warning (`OUTLINE_NONE_RING_NOT_IN_FILE`) when no ring exists anywhere in the file at all.
- `core-rules.md` 4.1: display default changed from `tracking-tighter leading-none` to `tracking-tight leading-[1.1]` (the file's own descender-clearance rule two lines below contradicted `leading-none`).
- Dark mode default stated identically in three places (`SKILL.md`, `core-rules.md` 8.C, the Core pre-flight box): dual-mode via `prefers-color-scheme` by default; a single locked mode needs a one-sentence scene justification (who, where, what light).
- `design-systems.md` 3.C: shadcn/ui projects may now keep `lucide-react` as their single icon family (the shadcn installer pulls it in by default).
- `design-systems.md` 5.A sticky-stack skeleton: the standalone `ScrollTrigger.create` call (`pin` / `pinSpacing` / `endTrigger` / `end`) is removed; it conflicted with the CSS `sticky top-0` already on the same element, which does the pinning alone now.
- `interaction-states.md` anchor-positioning snippet: added `position-try-fallbacks: --flip-above;` so the declared `@position-try` fallback is actually applied; rewrote the stale "Chrome 125+, Edge 125+" support line to "Chromium 125+, Safari 26+; verify Firefox before relying on it, and keep the fixed-position fallback below."
- `motion.md`: renamed the four numbered step headings ("1. Should this animate at all?", etc.) to non-numeric headings so they cannot be mistaken for section cites.
- `core-rules.md` 4.8 and 4.9 tagged "Persuade register only"; the Operate addendum states equal stat cards, dense tables and many labels are correct there.
- `scripts/upstream-drift.sh`: retargeted the impeccable tracking line from the deleted `reference/interaction-design.md` to `reference/craft-floor.md`, and added a fifth tracked line for `reference/operate.md` (now a direct content source); regenerated `scripts/upstream-snapshot.txt`.
- `NOTICE`: `SKILL.md` and `reference/pre-flight.md` now credit the Apache-2.0 passages ported from impeccable, with exact paths and commits; `reference/interaction-states.md` provenance pinned to `skill/reference/interaction-design.md@9ffd321`.
- `README.md`: license table now lists `SKILL.md` and `reference/pre-flight.md` (Addendum: Operate) under the Apache-2.0 row; the pre-flight structure line now names impeccable.

### Fixed

- `scripts/preflight.mjs` selector normaliser: `[^)]*` became `[^()]*` so an unclosed `:name(` on a very long line no longer scans quadratically (security scan finding, verified linear on a 10 MB line).
- `SKILL.md`'s motion rule contradicted `motion.md`'s own blur/clip-path craft and impeccable's craft-floor guidance ("animate only `transform` and `opacity`"). Now: "default to `transform` and `opacity`; `blur`, `clip-path` and `filter` are allowed when measured smooth; never animate `top`, `left`, `width`, `height`, `margin` or `padding`."
- Section index `§6` row relabelled to "Performance & accessibility guardrails" (matching upstream's section name); unported `§4.3` / `§4.7` / `§4.10` subsections now listed as "do not cite" instead of dangling.
- `design-systems.md` 11.D no longer cites the unported "Section 10 vocabulary".
- Routing no longer strands Universal Core boxes in files a row never loads: Core and every mode addendum are now self-contained file-path pointers with zero `Section N` cites, so every mode row's Load cell already covers everything Core needs.

## [2.0.0] - 2026-09-21

### Added
- `reference/core-rules.md`: ported taste-skill v2 sections that pre-flight already referenced but the skill never taught: 4.1 (Typography), 4.2 (Color Calibration), 4.4 (Materiality, Shadows, Cards), 4.8 (Image & Visual Asset Strategy), 4.9 (Content Density), 4.11 (Page Theme Lock), and 8 (Dark Mode Protocol).
- `reference/design-systems.md`: added the `5.A Sticky-Stack` heading, `5.D Forbidden Animation Patterns`, and `11. REDESIGN PROTOCOL` (11.A-11.F).
- `reference/pre-flight.md`: split the 62-box matrix into a universal `Pre-Flight: Universal Core` (~17 boxes) plus `Addendum A: Landing / Marketing Pages` and `Addendum B: React / Next`, so plain-HTML and non-React work no longer runs React-only boxes.
- `SKILL.md`: a `Routing` table (task type -> reference files -> pre-flight register) and a `Section index` mapping every section number to the file that owns it.
- `scripts/preflight.mjs` and `scripts/fixtures/{dirty,clean}.html`: a zero-dependency Node scanner for the mechanical failures (em dash, `transition: all`, missing `:focus-visible`, `z-index` scale, `scale(0)` entries, and more).
- `scripts/upstream-drift.sh` and `scripts/upstream-snapshot.txt`: report-only drift check against the four upstream files this skill ported or copied from.
- `.claude-plugin/plugin.json`: plugin manifest for marketplace discovery.
- `license` and `metadata.version` fields in the `SKILL.md` frontmatter.
- This `CHANGELOG.md`.

### Changed
- Removed every literal em dash (U+2014) from `SKILL.md`, `README.md`, `NOTICE`, and `reference/*.md`; the ban statements that used to print the character now name it as U+2014 (and U+2013 for the en-dash-as-separator case) instead.
- `reference/anti-slop.md`: the dangling link to an unshipped `brand.md` file now points at `core-rules.md` Section 4.2; "Codex-specific"/"codex" wording replaced with "AI" (this is a Claude skill).
- `reference/design-systems.md`: Section 3's default architecture is now conditional ("when the brief is a React/Next app") instead of an unconditional default; `7. DIAL DEFINITIONS` moved below the scroll-choreography section so the file reads 0,1,2,3,5,7,11,Install Commands.
- `reference/motion.md`: Core Philosophy trimmed to a one-line pointer at SKILL.md's own Philosophy section.
- `NOTICE` and `README.md`: structure diagram, license table, and reference-file list updated for `core-rules.md`.

### Fixed
- Every dangling "Section N" cite in the repo (taste-skill 4.1/4.2/4.4/4.8/4.9/4.11, 5.A, 5.D, 8, 11) now resolves to a real heading instead of a section the skill never ported.
- The `transition: all` contradiction between `design-systems.md`'s MOTION_INTENSITY dial and `pre-flight.md`'s own ban: the dial now recommends explicit `transform`/`opacity` transitions.

### Removed
- `reference/motion.md`'s duplicate `Review Format` and `Review Checklist` sections; `reference/pre-flight.md` remains the single home for both.

## [1.0.0] - 2026-05-31

Initial release: a merged synthesis of [emilkowalski/skill](https://github.com/emilkowalski/skill) (MIT), [pbakaus/impeccable](https://github.com/pbakaus/impeccable) (Apache-2.0), and [leonxlnx/taste-skill](https://github.com/leonxlnx/taste-skill) (MIT) into one `design-taste` skill for Claude Code and Cowork.
