// scripts/preflight.mjs
//
// Zero-dependency design-taste pre-flight scanner (Node 20+ ESM).
// Usage: node scripts/preflight.mjs <file-or-dir> [...more]
//
// HARD rules (any hit, any file -> exit 1): the em dash, `transition: all`,
// a `scale(0)` entry animation, `outline: none` / `outline: 0` / `outline:
// 0px` (or the Tailwind `outline-none`/`outline-hidden` spelling) whose
// `:focus-visible` escape hatch exists elsewhere in the file but not on the
// same selector base or class attribute, `z-index` whose literal matches the
// magic-number family `999`/`9999`/... (raw CSS or a Tailwind arbitrary
// value), a `scroll` event wired with `addEventListener`, gradient text
// (`background-clip: text` / `bg-clip-text`), a side-stripe `border-left` /
// `border-right` above 1px, a `repeating-linear-gradient`, an SVG
// `feTurbulence` filter, and a `cursor: url(...)` custom cursor.
//
// WARN rules (reported, never affect the exit code): a space-padded en dash
// used as a separator, more than 3 distinct `font-family` values, an
// uppercase-tracking micro-label count above ceil(sections / 3), `h-screen`
// / `100vh`, an `outline: none` hit with no `:focus-visible` escape hatch
// anywhere in the file at all, a `z-index` >= 1000 in a file that defines no
// `--z-` custom property and no `zIndex` token map (unprovable whether it is
// part of a documented scale), a pure `#000`/`#fff` literal, and a
// `fonts.googleapis.com` stylesheet link.
//
// ponytail: markdown (.md) and MDX (.mdx) files only run the two prose rules
// (em dash, en dash separator). The code-authoring rules are skipped for
// both, because this skill's own reference docs (and any project's MDX
// docs) legitimately show "here is the banned pattern" inside teaching
// examples (e.g. reference/motion.md's "Never animate from scale(0)"
// section) -- scanning those would self-flag the documentation that explains
// the ban. MDX is prose with embedded components, not authored application
// code, so it gets the same treatment as .md. Em dash and en dash bans are
// about copy the model writes, not authored CSS/JSX, so those two still
// apply everywhere, prose included. Upgrade path if a finer split is ever
// needed: parse fenced code blocks per language and exclude blocks that are
// explicitly a "wrong"/"bad" example.

import { readFileSync, readdirSync, statSync } from "node:fs";
import { extname, join } from "node:path";

const SCAN_EXTENSIONS = new Set([
  ".html",
  ".css",
  ".tsx",
  ".jsx",
  ".vue",
  ".svelte",
  ".md",
  ".scss",
  ".less",
  ".astro",
  ".ts",
  ".mdx",
]);
const SKIP_DIRS = new Set([".git", "node_modules", ".forge"]);

const EM_DASH = String.fromCharCode(0x2014);
const EN_DASH = String.fromCharCode(0x2013);
const EN_DASH_SEPARATOR = new RegExp(`[ \\t]${EN_DASH}[ \\t]`);
// HTML entities and JS/JSX escapes that render the em dash without the glyph.
const EM_DASH_ALIASES = /&mdash;|&#8212;|&#x2014;|\\u\{?2014\}?/i;

// Rule regexes cover raw CSS, JS style objects (React inline style / Motion
// props) and the Tailwind utility spelling, since .tsx/.jsx is where most of
// the target code is written.
const TRANSITION_ALL = /transition:\s*["']?all\b|transition-property:\s*all\b|\btransition-all\b/;
const SCALE_ZERO = /scale\(0\)|\bscale:\s*0(?![.\d])|\bscale-0\b/;
const OUTLINE_OFF = /outline:\s*["']?(none|0(?:px)?)\b|\boutline-(none|hidden)\b/;
const SCROLL_LISTENER = /addEventListener\(\s*["']scroll["']/;
const GRADIENT_TEXT = /background-clip:\s*text|-webkit-background-clip:\s*text|\bbg-clip-text\b/;
const SIDE_STRIPE_BORDER =
  /border-(?:left|right):\s*(?:[2-9]|\d{2,})px|\bborder-[lr]-(?:\[)?[2-8](?:px)?(?:\])?\b/;
// A side border paired with a top/bottom border of the same weight is a grid
// rule (cell edges in a Swiss / tabular layout), not an accent stripe.
// ponytail: same-line check only; a rule split across lines still fires.
const GRID_RULE_PAIR =
  /border-(?:top|bottom):\s*(?:[2-9]|\d{2,})px|\bborder-[tb]-(?:\[)?[2-8](?:px)?(?:\])?\b/;
const REPEATING_GRADIENT = /repeating-linear-gradient/;
const FE_TURBULENCE = /feTurbulence/;
const CURSOR_IMAGE = /cursor:\s*url\(/;
const PURE_BLACK_WHITE = /#(?:000000|ffffff|000|fff)\b/i;
const GOOGLE_FONTS_LINK = /fonts\.googleapis\.com/;
// File-wide signals that a z-index value is part of a documented scale.
const Z_CUSTOM_PROPERTY = /--z-[\w-]*/;
const Z_INDEX_MAP = /\bzIndex\s*[:=]\s*\{/;

function collectFiles(inputPaths) {
  const files = [];
  for (const p of inputPaths) {
    const stat = statSync(p);
    if (stat.isDirectory()) {
      for (const entry of readdirSync(p, { withFileTypes: true })) {
        const full = join(p, entry.name);
        if (entry.isSymbolicLink()) continue; // never follow links out of the scan root
        if (entry.isDirectory()) {
          if (SKIP_DIRS.has(entry.name)) continue;
          files.push(...collectFiles([full]));
        } else if (SCAN_EXTENSIONS.has(extname(entry.name))) {
          files.push(full);
        }
      }
    } else if (SCAN_EXTENSIONS.has(extname(p))) {
      files.push(p);
    }
  }
  return files;
}

function snippet(line) {
  return line.trim().slice(0, 80);
}

// Strips CSS pseudo-classes/elements (`:focus-visible`, `::before(...)`)
// from a selector so `.card:focus` and `.card:focus-visible` share the base
// `.card`.
function stripPseudo(selector) {
  return selector.replace(/::?[a-zA-Z-]+(\([^()]*\))?/g, "").trim();
}

// One base per comma-separated selector, so `a:focus, button:focus` ringed by
// separate `a:focus-visible` and `button:focus-visible` rules is clean.
function selectorBases(selectorList) {
  return stripPseudo(selectorList)
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

function checkFile(path) {
  const ext = extname(path);
  const content = readFileSync(path, "utf8");
  const lines = content.split("\n");
  const checkCode = ext !== ".md" && ext !== ".mdx";

  const hard = [];
  const warn = [];
  const outlineHits = []; // { n, snippet, bases }
  const ringBases = new Set(); // selector bases / class attrs that carry a focus-visible ring
  const zIndexWarnCandidates = []; // { n, snippet }
  const fontFamilies = new Set();
  let sectionCount = 0;
  let microLabelCount = 0;
  // Tracks the enclosing CSS selector list across multi-line rules. Flat
  // CSS only (one level of brace tracking): nested `&:focus` rules all reduce
  // to the base `&`, so a nested ring anywhere in the file whitelists every
  // nested `outline: none` (a miss, never a false failure).
  let currentCssSelectors = null;

  lines.forEach((line, idx) => {
    const n = idx + 1;
    const trimmed = line.trim();

    if (line.includes(EM_DASH) || EM_DASH_ALIASES.test(line)) {
      hard.push({ n, rule: "EM_DASH", snippet: snippet(line) });
    }
    if (EN_DASH_SEPARATOR.test(line)) {
      warn.push({ n, rule: "EN_DASH_SEPARATOR", snippet: snippet(line) });
    }

    if (!checkCode) return;

    if (TRANSITION_ALL.test(line)) {
      hard.push({ n, rule: "TRANSITION_ALL", snippet: snippet(line) });
    }
    if (SCALE_ZERO.test(line)) {
      hard.push({ n, rule: "SCALE_ZERO_ENTRY", snippet: snippet(line) });
    }
    if (SCROLL_LISTENER.test(line)) {
      hard.push({ n, rule: "SCROLL_LISTENER", snippet: snippet(line) });
    }
    if (GRADIENT_TEXT.test(line)) {
      hard.push({ n, rule: "GRADIENT_TEXT", snippet: snippet(line) });
    }
    if (SIDE_STRIPE_BORDER.test(line) && !GRID_RULE_PAIR.test(line)) {
      hard.push({ n, rule: "SIDE_STRIPE_BORDER", snippet: snippet(line) });
    }
    if (REPEATING_GRADIENT.test(line)) {
      hard.push({ n, rule: "REPEATING_GRADIENT", snippet: snippet(line) });
    }
    if (FE_TURBULENCE.test(line)) {
      hard.push({ n, rule: "FE_TURBULENCE", snippet: snippet(line) });
    }
    if (CURSOR_IMAGE.test(line)) {
      hard.push({ n, rule: "CURSOR_IMAGE", snippet: snippet(line) });
    }
    if (PURE_BLACK_WHITE.test(line)) {
      warn.push({ n, rule: "PURE_BLACK_WHITE", snippet: snippet(line) });
    }
    if (GOOGLE_FONTS_LINK.test(line)) {
      warn.push({ n, rule: "GOOGLE_FONTS_LINK", snippet: snippet(line) });
    }

    const zIndexMatch =
      line.match(/z-index:\s*(\d+)/) || line.match(/zIndex:\s*["']?(\d+)/) || line.match(/z-\[(\d+)/);
    if (zIndexMatch) {
      const digits = zIndexMatch[1];
      if (/^9{3,}$/.test(digits)) {
        hard.push({ n, rule: "Z_INDEX_999", snippet: snippet(line) });
      } else if (Number(digits) >= 1000) {
        zIndexWarnCandidates.push({ n, snippet: snippet(line) });
      }
    }

    // Selector-base tracking for the outline escape hatch: the literal
    // `class`/`className` attribute value on the same line (Tailwind/JSX),
    // else each comma-separated CSS selector with pseudo-classes stripped.
    const classMatch = line.match(/(?:class|className)\s*=\s*["']([^"']+)["']/);
    const openMatch = trimmed.match(/^([^{}]+)\{\s*$/);
    if (openMatch) currentCssSelectors = selectorBases(openMatch[1]);
    const inlineMatch = trimmed.match(/^([^{}]+)\{[^{}]*\}\s*$/);

    let bases;
    if (classMatch) bases = [classMatch[1]];
    else if (inlineMatch) bases = selectorBases(inlineMatch[1]);
    else bases = currentCssSelectors ?? [];

    const hasRing = /focus-visible/.test(line);
    // A ring on the same line (same element, or a one-line rule such as
    // `.card:focus:not(:focus-visible) { outline: none }`) is provably present.
    if (OUTLINE_OFF.test(line) && !hasRing) {
      outlineHits.push({ n, snippet: snippet(line), bases });
    }
    if (hasRing) {
      for (const b of bases) ringBases.add(b);
    }

    if (trimmed === "}") currentCssSelectors = null;

    const sectionTags = line.match(/<section[\s>]/gi);
    if (sectionTags) sectionCount += sectionTags.length;

    // First family only, unquoted, lowercased: `"Geist", sans-serif` and
    // `Geist` are the same family, not two.
    const fontMatch = line.match(/font-family:\s*["']?([^;}"']+)/);
    if (fontMatch) fontFamilies.add(fontMatch[1].split(",")[0].trim().toLowerCase());

    // ponytail: eyebrow heuristic is per-file and per-line. It sees Tailwind
    // class lists and one-line CSS rules only; a multi-line `.eyebrow {}` rule
    // reused across sections counts as zero, and a page composed from
    // per-component files never reaches the section threshold. Upgrade path:
    // count rendered instances from a built HTML page instead of source.
    const microLabel =
      (/uppercase/.test(line) && /tracking-/.test(line)) ||
      (/text-transform:\s*uppercase/.test(line) && /letter-spacing/.test(line));
    if (microLabel) microLabelCount += 1;

    if (line.includes("h-screen") || line.includes("100vh")) {
      warn.push({ n, rule: "VIEWPORT_UNIT", snippet: snippet(line) });
    }
  });

  if (checkCode) {
    for (const hit of outlineHits) {
      // Every base of the hit carries a ring somewhere in the file: clean.
      if (hit.bases.length > 0 && hit.bases.every((b) => ringBases.has(b))) continue;
      if (ringBases.size > 0) {
        // A ring exists somewhere in the file, just not on this base: provably unringed.
        hard.push({ n: hit.n, rule: "OUTLINE_NONE_NO_FOCUS_VISIBLE", snippet: hit.snippet });
      } else {
        // No focus-visible anywhere in the file: unprovable from this file alone.
        warn.push({ n: hit.n, rule: "OUTLINE_NONE_RING_NOT_IN_FILE", snippet: hit.snippet });
      }
    }
    if (
      zIndexWarnCandidates.length > 0 &&
      !Z_CUSTOM_PROPERTY.test(content) &&
      !Z_INDEX_MAP.test(content)
    ) {
      for (const c of zIndexWarnCandidates) {
        warn.push({ n: c.n, rule: "Z_INDEX_UNSCALED", snippet: c.snippet });
      }
    }
  }
  if (checkCode && fontFamilies.size > 3) {
    warn.push({ n: 0, rule: "FONT_FAMILY_COUNT", snippet: `${fontFamilies.size} distinct values` });
  }
  if (checkCode && sectionCount > 0 && microLabelCount > Math.ceil(sectionCount / 3)) {
    warn.push({
      n: 0,
      rule: "EYEBROW_COUNT",
      snippet: `${microLabelCount} labels across ${sectionCount} sections`,
    });
  }

  hard.sort((a, b) => a.n - b.n);
  warn.sort((a, b) => a.n - b.n);
  return { hard, warn };
}

function main() {
  const args = process.argv.slice(2);
  if (args.length === 0) {
    console.error("Usage: node scripts/preflight.mjs <file-or-dir> [...more]");
    process.exit(1);
  }

  const files = collectFiles(args);
  let hardTotal = 0;
  let warnTotal = 0;

  for (const file of files) {
    const { hard, warn } = checkFile(file);
    for (const v of hard) {
      console.log(`${file}:${v.n}  ${v.rule}  ${v.snippet}`);
    }
    for (const v of warn) {
      console.log(`${file}:${v.n}  WARN:${v.rule}  ${v.snippet}`);
    }
    hardTotal += hard.length;
    warnTotal += warn.length;
  }

  console.log(`\n${files.length} file(s) scanned, ${hardTotal} hard violation(s), ${warnTotal} warning(s).`);
  process.exit(hardTotal > 0 ? 1 : 0);
}

main();
