# Anti-Slop Catalogue

The single highest-value asset across all three source skills: a concrete list of the patterns that make an interface scream "an AI made this." If you can look at the result and say "AI made that" without doubt, it failed. Match-and-refuse: if you are about to write any of these, rewrite the element with different structure.

---

## Part 1 — Absolute Bans (from impeccable)

Match-and-refuse. If you're about to write any of these, rewrite the element with different structure.

- **Side-stripe borders.** `border-left` or `border-right` greater than 1px as a colored accent on cards, list items, callouts, or alerts. Never intentional. Rewrite with full borders, background tints, leading numbers/icons, or nothing.
- **Gradient text.** `background-clip: text` combined with a gradient background. Decorative, never meaningful. Use a single solid color. Emphasis via weight or size.
- **Glassmorphism as default.** Blurs and glass cards used decoratively. Rare and purposeful, or nothing.
- **The hero-metric template.** Big number, small label, supporting stats, gradient accent. SaaS cliché.
- **Identical card grids.** Same-sized cards with icon + heading + text, repeated endlessly.
- **Tiny uppercase tracked eyebrow above every section.** The 2023-era kicker (small all-caps text with wide tracking, "ABOUT" "PROCESS" "PRICING" above each heading) is now the saturated AI scaffold; it appears on 55-95% of generations regardless of brief, which is the definition of a tell. One named kicker as a deliberate brand system is voice; an eyebrow on every section is AI grammar. Choose a different cadence.
- **Numbered section markers as default scaffolding (01 / 02 / 03).** Putting `01 · About / 02 · Process / 03 · Pricing` above every section is the eyebrow trope one tier deeper: reach for it because "landing pages do this" and you're scaffolding by reflex. Numbers earn their place when the section actually IS a sequence (a real 3-step process, an ordered flow, a typed timeline) and the order carries information the reader needs. One deliberate numbered sequence on one page is voice; numbered eyebrows on every section across the site is AI grammar.
- **Text that overflows its container.** Long heading words plus large clamp scales plus narrow grids cause headline overflow on tablet/mobile. Test the heading copy at every breakpoint; if it overflows, reduce the clamp max or rewrite the copy. The viewport is part of the design.

**Codex-specific defects** (your most-frequent giveaways; refuse-and-rewrite):

- **`border: 1px solid X` + `box-shadow: 0 Npx Mpx ...` with M ≥ 16px** on the same element. The "ghost-card" pattern: 1px border plus soft wide drop shadow on buttons and cards. Don't pair them. Pick one (a single solid border at the brand color, OR a defined shadow at no more than 8px blur), never both as decoration.
- **`border-radius: 32px+` on cards / sections / inputs.** You over-round. Cards top out at 12–16px; full-pill is fine for tags/buttons. Picking 24/28/32/40px on a card is the codex tell; no brand wants "insanely rounded".
- **Hand-drawn / sketchy SVG illustrations.** Class names like `loose-sketch`, `*-sketch`, `doodle`, `wavy`; `feTurbulence` / `feDisplacementMap` "paper grain" filters; 5-to-30 path crude scenes meant to depict a tangible subject (an otter, a table-and-fork, an album cover). All of these read as amateurish, not whimsical. If you can't render the scene with real assets, ship no illustration. Don't attempt sketchy SVG as a fallback.
- **`repeating-linear-gradient(...)` stripe backgrounds.** Diagonal stripes in `body:before` or section backgrounds are pure codex decoration. Don't.
- **"X theater" / "actually X" / "not just X, it's Y" copy.** "Productivity theater", "engagement theater", "growth theater": instant AI slop. Choose a specific noun, not a meta-criticism phrase.

### The AI slop test

If someone could look at this interface and say "AI made that" without doubt, it's failed. Cross-register failures are the absolute bans above. Register-specific failures live in each reference.

**Category-reflex check.** Run at two altitudes; the second one catches what the first one misses.

- **First-order:** if someone could guess the theme + palette from the category alone, it's the first training-data reflex. Rework the scene sentence and color strategy until the answer isn't obvious from the domain.
- **Second-order:** if someone could guess the aesthetic family from category-plus-anti-references ("AI workflow tool that's not SaaS-cream → editorial-typographic", "fintech that's not navy-and-gold → terminal-native dark mode"), it's the trap one tier deeper. The first reflex was avoided; the second wasn't. Rework until both answers are not obvious. The brand register's [reflex-reject aesthetic lanes](reference/brand.md) list catches the currently-saturated families.


---

## Part 2 — AI Tells (from taste-skill)

Avoid these signatures unless the brief explicitly asks for them.

### 9.A Visual & CSS
* **NO neon / outer glows** by default. Use inner borders or subtle tinted shadows.
* **NO pure black (`#000000`).** Off-black, zinc-950, or charcoal.
* **NO oversaturated accents.** Desaturate to blend with neutrals.
* **NO excessive gradient text** for large headers.
* **NO custom mouse cursors.** Outdated, accessibility-hostile, perf-hostile.

### 9.B Typography
* **AVOID Inter as default.** See Section 4.1. Override path exists.
* **NO oversized H1s** that just scream. Control hierarchy with weight + color, not raw scale.
* **Serif constraints:** Serif for editorial / luxury / publication. Not for dashboards.

### 9.C Layout & Spacing
* **Mathematically perfect** padding and margins. No floating elements with awkward gaps.
* **NO 3-column equal feature cards.** The generic "three identical cards horizontally" feature row is banned. Use 2-column zig-zag, asymmetric grid, scroll-pinned, or horizontal-scroll alternative.

### 9.D Content & Data ("Jane Doe" Effect)
* **NO generic names.** "John Doe", "Sarah Chan", "Jack Su" → use creative, realistic, locale-appropriate names.
* **NO generic avatars.** No SVG "egg" or Lucide user icons → use believable photo placeholders or specific styling.
* **NO fake-perfect numbers.** Avoid `99.99%`, `50%`, `1234567`. Use organic, messy data (`47.2%`, `+1 (312) 847-1928`).
* **NO startup-slop brand names.** "Acme", "Nexus", "SmartFlow", "Cloudly" → invent contextual, premium names that sound real.
* **NO filler verbs.** "Elevate", "Seamless", "Unleash", "Next-Gen", "Revolutionize" → concrete verbs only.

### 9.E External Resources & Components
* **NO hand-rolled SVG icons.** Use Phosphor / HugeIcons / Radix / Tabler. Lucide on explicit request only.
* **Hand-rolled decorative SVGs strongly discouraged** as default (see Section 4.8).
* **NO div-based fake screenshots.** Never build a fake product UI out of `<div>` rectangles to simulate a screenshot. Use real images, generated images, or skip the preview.
* **NO broken Unsplash links.** Use `https://picsum.photos/seed/{descriptive-string}/{w}/{h}`, or generated photo placeholders, or actual assets.
* **shadcn/ui customization:** Allowed, but NEVER in default state. Customize radii, colors, shadows, typography to the project aesthetic.
* **Production-Ready Cleanliness:** Code visually clean, memorable, meticulously refined.

### 9.F Production-Test Tells (banned outright)

These patterns came out of real LLM-generated landing-page tests. They are the signatures the model defaults to when it tries to "look designed." Treat them as hard bans unless the brief explicitly calls for one.

**Hero & top-of-page**
* **NO version labels in the hero.** `V0.6`, `v2.0`, `BETA`, `INVITE-ONLY PREVIEW`, `EARLY ACCESS`, `ALPHA` - banned as default eyebrows. Only acceptable when the brief is explicitly about a product launch / preview status.
* **NO "Brand · No. 01"-style sub-eyebrows.** "Marrow · No. 01 · The 6-quart" type micro-meta lines. Skip them.

**Section numbering & micro-labels**
* **NO section-number eyebrows.** `00 / INDEX`, `001 · Capabilities`, `002 · Featured commission`, `06 · how it works`, `05 · The honest table` - banned. Eyebrows should name the topic in plain language, not enumerate.
* **NO `01 / 4`-style pagination on images or bento tiles.** If the user can count, they don't need the label.
* **NO `Scroll · 001 Capabilities`-style scroll cues.** A simple arrow or "Scroll" is enough; no section-number prefix.
* **NO "Index of Work, 2018 - 2026"-style range labels** as eyebrows. Just say what the section is.

**Separators & dots**
* **The middle-dot (`·`) is rationed.** Maximum 1 per line in metadata strips. Do NOT use it as the default separator for everything ("foo · bar · baz · qux · quux"). If you need a separator family, prefer line breaks, hairlines, or columns.
* **NO decorative colored status dots on every list/nav/badge.** A colored dot before "ONE Q4 SLOT OPEN" or before every nav link, or every task row - banned by default. Acceptable only when the dot conveys actual semantic state (a server status, an availability flag) and is used sparingly.

**Em-dashes & typography flourishes**
* **NO em-dash (`—`) as a design element OR anywhere else.** See Section 9.G below for the complete, non-negotiable ban. The em-dash character is forbidden in headlines, eyebrows, pills, body copy, quotes, attribution, captions, button text, and alt text. Use the regular hyphen (`-`).
* **NO `<br>`-broken-and-italicized headlines** as a default "design move." "for thirty\<br\>*years.*" type splits. Headlines should read naturally first, get clever only when the brief demands it.
* **NO vertical rotated text** ("INDEX OF WORK, 2018 - 2026" rotated 90°). Agency-portfolio cliché. Use it only when the brief is explicitly agency / Awwwards / experimental AND it serves a real composition purpose.
* **NO crosshair / hairline grid lines as decoration.** Vertical and horizontal lines drawn just to make the page "feel designed" - banned. Use them only when they organize real content.

**Fake product previews**
* **NO div-based fake product UI in the hero** (fake task list, fake terminal, fake dashboard built from styled divs). It is the #1 LLM-design Tell. Use a real screenshot, a generated image, a real component preview, or none at all.
* **NO fake version footers** ("v0.6.2-rc.1", "last sync 4s ago · main") inside fake screenshots. Adds nothing, screams AI.

**Marketing-copy Tells**
* **NO "Quietly in use at" / "Quietly trusted by"** social-proof headers. Use natural language: "Trusted by", "Used at", "Customers include", or skip the heading entirely if the logos speak.
* **NO "From the field" / "Field notes" / "Currently on the bench" / "On our desks" / "Loose plates" style poetic labels** on quote, blog, or sidebar sections. Reads as performative-craftsman. Use plain functional labels ("Testimonials", "Latest writing", "Now working on") or skip the label.
* **NO "We respect the French ones"-style** mock-humble industry-references in body copy. Cute and AI-y.
* **NO weather / locale strips** ("LIS 14:23 · 18°C") in headers/footers unless the brief is explicitly about a place / time-zone-distributed studio.
* **NO micro-meta-sentences under eyebrows.** Sentences like *"Each of these is a feature we ship today, not a roadmap promise. The list will stay short on purpose."* sitting under a section heading are clutter. Eyebrow + Headline + Body is enough.
* **NO generic step labels.** "Stage 1 / Stage 2 / Stage 3", "Step 1 / Step 2 / Step 3", "Phase 01 / Phase 02 / Phase 03", "Pass One / Pass Two / Pass Three". Banned. The actual step content is the label. If you must show progression, use the verb-noun directly ("Install", "Configure", "Ship") not "Stage 1: Install".

**Pills, labels and version stamps**
* **NO pills/labels/tags overlaid on images.** No `<span>` overlays on photos with tags like `Brand · 02`, `PLATE · BRAND`, `Field notes - journal`. Either let the image speak alone, or add a caption directly below (outside the image).
* **NO photo-credit captions as decoration.** Strings like `Field study no. 12 · Ines Caetano`, `Plate 03 · House archive`, `Frame XII · 35mm` under stock/picsum images are pretentious. Photo credit is allowed ONLY when there is a real photographer being credited for a real photo (with permission). Otherwise: skip the caption or use a one-line functional caption ("The 6-quart, in Sage.").
* **NO version footers on marketing pages.** Footer strings like `v1.4.2`, `Build 0048`, `last sync 4s ago · main` are CLI / devtool fixtures, not landing-page content. Banned on marketing/landing/portfolio pages.
* **NO "Reservation 412 of 800"-style live-stock counters** as decoration. Only if the brief is explicitly a limited-run waitlist with real data.

**Decoration text strips**
* **NO decoration text strip at hero bottom.** Patterns like `BRAND. MOTION. SPATIAL.`, `TYPE / FORM / MOTION`, `DESIGN · BUILD · SHIP`, `ESTD. 2018 · LISBON · BRAND. MOTION. SPATIAL.` as a small mono-caps strip across the bottom of the hero are an agency-portfolio cliché. Banned by default. Only acceptable when the strip carries real, navigable links (sticky bottom nav) or real status info (cookie banner, build info on a docs site).
* **NO floating top-right sub-text in section headings.** Pattern: section has a giant left-aligned headline; in the top-right corner of the same section header there is a small explainer paragraph floating with no clear alignment to anything else. That floater is the Tell. Either put the sub-text directly under the headline, or build a clean 2-column header (left: headline, right: aligned body), but not a tiny corner paragraph.

**Lists, dividers and scoring**
* **NO `border-t` + `border-b` on every row of a long list / spec table.** Pick one (bottom-border between rows OR top-border above the group) and use it sparsely. A 10-row spec table with hairlines under each row is the laziest layout - see Section 4.9 for alternative UI components.
* **NO scoring/progress bars with filled background tracks** as comparison visuals. If you need to show "X out of Y" comparisons, prefer a number + small icon, or a tiny inline bar WITHOUT a background track. Big filled `bg-zinc-200` tracks with a partial fill on top are dashboard-UI clutter on a landing page.

**Locale, time, scroll cues**
* **Locale / city-name / time / weather strips are banned for 99% of briefs.** "Lisbon, working with founders" in the hero, "1200-690 Lisbon, Portugal" in the footer, "Lisbon 14:23 · 18°C" in the nav. These are agency-portfolio decoration tells. Allowed ONLY when: the brief explicitly describes a globally-distributed studio with timezone-relevant work, OR a travel-focused brand, OR a real-world physical venue. A single contact-address mention in the footer is fine; an atmospheric locale strip is not.
* **Scroll cues are banned.** `Scroll`, `↓ scroll`, `Scroll to explore`, `Scroll to walk through it`, animated mouse-wheel icons. If the user has not scrolled yet, they are looking at the hero. They know what scroll is. The bottom of the viewport does not need a label.
* **ZERO decorative status dots by default.** A coloured dot before nav items, before list rows, before badges, before status labels is a Tell. Only acceptable when conveying real semantic state (a live indicator on actual server status, a live availability flag) and limited to one per page section.

### 9.G EM-DASH BAN (the single most-violated Tell)

**Em-dash (`—`) is COMPLETELY banned.** It is the LLM's signature stylistic crutch and it is the #1 visual Tell in production tests. There is no "limited use" allowance, no "natural language frequency" allowance, no "in body copy is fine" allowance. None.

* **Banned in headlines.** Use a period or a comma.
* **Banned in eyebrows / labels / pills / button text / image captions / nav items.** Replace with line breaks, columns, or hairlines.
* **Banned in body copy.** Restructure the sentence: two sentences with a period, OR a comma, OR parentheses, OR a colon.
* **Banned in quote attribution.** Use a normal hyphen with spaces (` - `) or a line break + smaller-weight name.
* **Banned in en-dash form too (`–`) when used as a separator.** Date ranges (`2018-2026`) use a hyphen. Number ranges (`€40-80k`) use a hyphen.

The ONLY permitted dash characters on the page are:
* Regular hyphen `-` (for compound words, ranges, line dividers in markup)
* Minus sign in math (`-5°C`)

If your output contains a single `—` or `–` anywhere visible to the user, the output fails the Pre-Flight Check and must be rewritten.

This rule is non-negotiable. The agent has historically ignored em-dash limits when phrased as "use sparingly." The phrasing here is binary: zero em-dashes.

