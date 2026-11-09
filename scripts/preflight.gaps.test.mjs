// scripts/preflight.gaps.test.mjs
//
// Tester-authored hardening pass on top of the coder's 17 tests. Covers:
// routing as an executable contract, deeper preflight.mjs semantics
// (z-index/outline edge cases, .scss/.less, HTML-comment limitation),
// negative fixtures for known-safe patterns, cite resolution for the
// renamed motion.md headings, and provenance completeness. All fixtures
// live under a mkdtemp'd dir; the repo is never written to.
//
// Run with: node --test scripts/

import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync, mkdtempSync, writeFileSync, rmSync, readdirSync, existsSync, statSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

const ROOT = join(import.meta.dirname, "..");
const SCRIPT = join(ROOT, "scripts", "preflight.mjs");

function run(args) {
  try {
    const stdout = execFileSync("node", [SCRIPT, ...args], { cwd: ROOT, encoding: "utf8" });
    return { stdout, status: 0 };
  } catch (err) {
    return { stdout: err.stdout ?? "", status: err.status };
  }
}

function withTempFile(content, ext) {
  const dir = mkdtempSync(join(tmpdir(), "preflight-gaps-"));
  const path = join(dir, `fixture${ext}`);
  writeFileSync(path, content, "utf8");
  return { dir, path };
}

function sectionSlice(content, heading) {
  const headings = [...content.matchAll(/^## .*$/gm)];
  const idx = headings.findIndex((m) => m[0].startsWith(heading));
  if (idx < 0) return null;
  const start = headings[idx].index + headings[idx][0].length;
  const end = idx + 1 < headings.length ? headings[idx + 1].index : content.length;
  return content.slice(start, end);
}

// All markdown tables (contiguous runs of `|`-prefixed lines) inside a slice,
// in document order, each as an array of raw row strings (header + separator
// + data rows).
function allTables(slice) {
  const tables = [];
  let current = null;
  for (const line of slice.split("\n")) {
    const trimmed = line.trim();
    if (trimmed.startsWith("|")) {
      if (!current) {
        current = [];
        tables.push(current);
      }
      current.push(trimmed);
    } else {
      current = null;
    }
  }
  return tables;
}

function parseTableRow(row) {
  return row
    .split("|")
    .slice(1, -1)
    .map((c) => c.trim());
}

function dataRows(table) {
  return table.slice(2).map(parseTableRow); // drop header + `---` separator
}

function filesInCell(cell) {
  return [...cell.matchAll(/reference\/[A-Za-z0-9_-]+\.md/g)].map((m) => m[0]);
}

const SKILL = readFileSync(join(ROOT, "SKILL.md"), "utf8");
const routingSlice = sectionSlice(SKILL, "## Routing");
const [modeTable, orthogonalTable] = allTables(routingSlice);
const modeRows = dataRows(modeTable); // [Mode, Surface, Dials, Load, Pre-flight]
const orthogonalRows = dataRows(orthogonalTable); // [When, Also load, Also run]

// -- gap 1: routing as an executable contract for the five review briefs --

test("routing table: each review brief matches exactly one mode row, and every file in that row's Load cell exists", () => {
  // `keyword` is matched as a whole word against the Surface cell and `mode`
  // is the row it must land on. (A bare "form" would match Read's "long-form"
  // and pass for the wrong row.)
  const briefs = [
    { name: "SaaS landing page", keyword: "landing", mode: "Persuade" },
    { name: "admin dashboard", keyword: "dashboard", mode: "Operate" },
    { name: "React form component", keyword: "forms", mode: "Operate" },
    { name: "plain HTML poster", keyword: "poster", mode: "Experience" },
  ];

  for (const { name, keyword, mode } of briefs) {
    const keywordRe = new RegExp(`\\b${keyword}\\b`, "i");
    const matches = modeRows.filter((cells) => keywordRe.test(cells[1]));
    assert.equal(matches.length, 1, `"${name}" (keyword "${keyword}") must match exactly one mode row, matched ${matches.length}`);
    assert.equal(matches[0][0], mode, `"${name}" must route to ${mode}`);
    const files = filesInCell(matches[0][3]);
    assert.ok(files.length > 0, `"${name}" row has no reference/*.md files in its Load cell`);
    for (const f of files) {
      assert.ok(existsSync(join(ROOT, f)), `"${name}" row's Load cell names ${f}, which does not exist`);
    }
  }
});

test("routing table: 'React form component' also matches exactly one orthogonal stack row, and its files exist", () => {
  const matches = orthogonalRows.filter((cells) => cells[0].toLowerCase().includes("react"));
  assert.equal(matches.length, 1, `expected exactly one React/Next orthogonal row, got ${matches.length}`);
  const files = filesInCell(matches[0][1]);
  assert.ok(files.length > 0, "React/Next orthogonal row has no reference/*.md files in its Also load cell");
  for (const f of files) {
    assert.ok(existsSync(join(ROOT, f)), `React/Next row's Also load cell names ${f}, which does not exist`);
  }
});

test("routing table: 'redesign' brief matches exactly one orthogonal row (not a mode row), and its files exist", () => {
  const modeMatches = modeRows.filter((cells) => cells[1].toLowerCase().includes("redesign"));
  assert.equal(modeMatches.length, 0, "redesign must not appear as a mode-row surface");

  const orthoMatches = orthogonalRows.filter((cells) => cells[0].toLowerCase().includes("redesign"));
  assert.equal(orthoMatches.length, 1, `expected exactly one Redesign orthogonal row, got ${orthoMatches.length}`);
  const files = filesInCell(orthoMatches[0][1]);
  assert.ok(files.length > 0, "Redesign row has no reference/*.md files in its Also load cell");
  for (const f of files) {
    assert.ok(existsSync(join(ROOT, f)), `Redesign row's Also load cell names ${f}, which does not exist`);
  }
});

test("Universal Core: zero Section N / §N cites, and the N/A sentence is present", () => {
  const preFlight = readFileSync(join(ROOT, "reference", "pre-flight.md"), "utf8");
  const coreSlice = sectionSlice(preFlight, "## Pre-Flight: Universal Core");
  assert.ok(coreSlice !== null, "Universal Core heading missing");
  assert.doesNotMatch(coreSlice, /Section \d+|§\d+/, "Universal Core must carry zero Section N / §N cites");
  assert.match(
    coreSlice,
    /is N\/A: write `N\/A` beside it and name the missing element/,
    "N/A rule sentence missing from Universal Core"
  );
});

test("pre-flight.md registers appear in order; every mode row's Dials cell is three low-high ranges", () => {
  const preFlight = readFileSync(join(ROOT, "reference", "pre-flight.md"), "utf8");
  const expected = [
    "Pre-Flight: Universal Core",
    "Addendum: Persuade",
    "Addendum: Operate",
    "Addendum: Read",
    "Addendum: Experience",
    "Addendum: React / Next",
  ];
  const registers = [...preFlight.matchAll(/^## (.+)$/gm)].map((m) => m[1]).filter((h) => expected.includes(h));
  assert.deepEqual(registers, expected);

  for (const cells of modeRows) {
    assert.match(cells[2], /^\d+-\d+ \/ \d+-\d+ \/ \d+-\d+$/, `${cells[0]} Dials cell`);
  }
});

// -- gap 2: deeper preflight.mjs semantics -------------------------------

test("z-index: bracket Tailwind z-[999] (3 nines) hard-fails as Z_INDEX_999", () => {
  const { dir, path } = withTempFile('<div class="z-[999]">x</div>\n', ".html");
  try {
    const { stdout, status } = run([path]);
    assert.equal(status, 1);
    assert.match(stdout, /Z_INDEX_999/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("outline: literal 'outline: none' on one selector with :focus-visible only on another is HARD", () => {
  const content = [".a { outline: none; }", ".b:focus-visible { outline: 2px solid blue; }"].join("\n");
  const { dir, path } = withTempFile(content, ".css");
  try {
    const { stdout, status } = run([path]);
    assert.equal(status, 1, stdout);
    assert.match(stdout, /OUTLINE_NONE_NO_FOCUS_VISIBLE/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("each of the 8 new rules fires on dirty.html and none fire on clean.html", () => {
  const dirty = run(["scripts/fixtures/dirty.html"]);
  const clean = run(["scripts/fixtures/clean.html"]);
  assert.equal(clean.status, 0, clean.stdout);

  const rules = [
    "SCROLL_LISTENER",
    "GRADIENT_TEXT",
    "SIDE_STRIPE_BORDER",
    "REPEATING_GRADIENT",
    "FE_TURBULENCE",
    "CURSOR_IMAGE",
    "PURE_BLACK_WHITE",
    "GOOGLE_FONTS_LINK",
  ];
  for (const rule of rules) {
    assert.match(dirty.stdout, new RegExp(rule), `${rule} must fire on dirty.html`);
    assert.doesNotMatch(clean.stdout, new RegExp(rule), `${rule} must not fire on clean.html`);
  }
});

test(".scss and .less fixtures are scanned as code", () => {
  for (const ext of [".scss", ".less"]) {
    const { dir, path } = withTempFile(".card { transition: all 0.3s ease; }\n", ext);
    try {
      const { stdout, status } = run([path]);
      assert.equal(status, 1, `${ext} must be scanned as code`);
      assert.match(stdout, /TRANSITION_ALL/);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  }
});

test("outline: a comma-list reset ringed by separate per-selector :focus-visible rules is clean; a JS-object outline is still caught", () => {
  const commaList = [
    "a:focus, button:focus { outline: none; }",
    "a:focus-visible { outline: 2px solid; }",
    "button:focus-visible { outline: 2px solid; }",
  ].join("\n");
  const { dir: dir1, path: path1 } = withTempFile(commaList, ".css");
  try {
    const { stdout, status } = run([path1]);
    assert.equal(status, 0, stdout);
    assert.doesNotMatch(stdout, /OUTLINE_NONE/);
  } finally {
    rmSync(dir1, { recursive: true, force: true });
  }

  const { dir: dir2, path: path2 } = withTempFile('<div style={{ outline: "none" }} />\n', ".tsx");
  try {
    const { stdout } = run([path2]);
    assert.match(stdout, /OUTLINE_NONE_RING_NOT_IN_FILE/);
  } finally {
    rmSync(dir2, { recursive: true, force: true });
  }
});

test("negative: #fff000 / #000fff are colors, not pure black/white; scrollend is not a scroll listener", () => {
  const content = [".a { color: #fff000; }", ".b { color: #000fff; }", 'addEventListener("scrollend", f);'].join("\n");
  const { dir, path } = withTempFile(content, ".astro");
  try {
    const { stdout, status } = run([path]);
    assert.equal(status, 0, stdout);
    assert.doesNotMatch(stdout, /PURE_BLACK_WHITE|SCROLL_LISTENER/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

// -- gap 3: negative fixtures for legitimate code ------------------------

test("negative: border-left: 1px solid does not fire SIDE_STRIPE_BORDER", () => {
  const { dir, path } = withTempFile(".divider { border-left: 1px solid #ccc; }\n", ".css");
  try {
    const { stdout } = run([path]);
    assert.doesNotMatch(stdout, /SIDE_STRIPE_BORDER/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("negative: a grid cell with border-right and border-bottom does not fire SIDE_STRIPE_BORDER", () => {
  const css = ".cell { border-right: 2px solid var(--ink); border-bottom: 2px solid var(--ink); }\n" +
    '<div class="border-r-2 border-b-2"></div>\n';
  const { dir, path } = withTempFile(css, ".html");
  try {
    const { stdout } = run([path]);
    assert.doesNotMatch(stdout, /SIDE_STRIPE_BORDER/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("positive: a lone border-left: 4px still fires SIDE_STRIPE_BORDER", () => {
  const { dir, path } = withTempFile(".callout { border-left: 4px solid tomato; }\n", ".css");
  try {
    const { stdout } = run([path]);
    assert.match(stdout, /SIDE_STRIPE_BORDER/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("negative: scale(0.95) does not fire SCALE_ZERO_ENTRY", () => {
  const { dir, path } = withTempFile(".enter { transform: scale(0.95); opacity: 0; }\n", ".css");
  try {
    const { stdout } = run([path]);
    assert.doesNotMatch(stdout, /SCALE_ZERO_ENTRY/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

// ponytail: known limitation, not fixed. An HTML comment quoting a banned
// pattern as a teaching example ("here is what NOT to do") still fires,
// because the scanner is line-regex based and does not parse/strip HTML
// comments or fenced code blocks. This test documents the current, accepted
// behavior rather than asserting a fix -- see preflight.mjs's own header
// comment for the .md/.mdx carve-out, which is the same tradeoff one level
// up (whole-file, not per-comment).
test("known limitation: an HTML comment quoting `transition: all` in a teaching example still fires (documented, not fixed)", () => {
  const content = "<!-- Bad example, do not copy: transition: all 300ms; -->\n";
  const { dir, path } = withTempFile(content, ".html");
  try {
    const { stdout, status } = run([path]);
    assert.equal(status, 1, "documents that HTML comments are not exempted");
    assert.match(stdout, /TRANSITION_ALL/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

// -- gap 4: cite resolution, motion.md renamed headings -------------------

function collectHeadingNumbers(content) {
  const numbers = new Set();
  for (const line of content.split("\n")) {
    const m = line.match(/^#{1,6}\s+§?(\d+)(?:\.([A-Za-z0-9]+))?\b/);
    if (!m) continue;
    numbers.add(m[1]);
    if (m[2]) numbers.add(`${m[1]}.${m[2]}`);
  }
  return numbers;
}

test("motion.md: renamed step headings register no numeric heading 1-4 (would silently satisfy a stray cite)", () => {
  const motion = readFileSync(join(ROOT, "reference", "motion.md"), "utf8");
  const numbers = collectHeadingNumbers(motion);
  for (const n of ["1", "2", "3", "4"]) {
    assert.ok(!numbers.has(n), `motion.md still registers heading number ${n} after the step-heading rename`);
  }
});

test("Section-index Not-ported row (§10, §12, §13) is the only wildcard exclusion; §4.3/§4.7/§4.10 sit in a separate non-wildcard row", () => {
  const indexTable = allTables(sectionSlice(SKILL, "## Routing")).at(-1);
  const rows = dataRows(indexTable);
  const notPortedRow = rows.find((cells) => cells[1].includes("Not ported"));
  assert.ok(notPortedRow, "Not-ported row missing from Section index");
  assert.doesNotMatch(notPortedRow[0], /4/, "4.x subsections must not be folded into the Not-ported wildcard row");

  const subsectionRow = rows.find((cells) => cells[0].includes("4.3") && cells[0].includes("4.7"));
  assert.ok(subsectionRow, "§4.3/§4.7/§4.10 row missing from Section index");
  assert.doesNotMatch(subsectionRow[1], /Not ported/, "the 4.x row must not itself say 'Not ported' (would widen the wildcard to major 4)");
});

// -- gap 5: provenance ----------------------------------------------------

function noticeProvenanceMap() {
  const notice = readFileSync(join(ROOT, "NOTICE"), "utf8");
  const start = notice.indexOf("Per-file provenance and license map");
  const afterHeading = notice.indexOf("\n", notice.indexOf("====", start + 1) + 1);
  const end = notice.indexOf("====", afterHeading);
  const section = notice.slice(afterHeading, end);
  // Entries start at column 0 with a file-like token; continuation lines are
  // indented. Collect the leading token off every non-indented, non-blank line.
  const entries = [];
  for (const line of section.split("\n")) {
    if (!line.trim()) continue;
    if (/^\s/.test(line)) continue; // continuation line
    const m = line.match(/^(\S+)/);
    if (m) entries.push(m[1]);
  }
  return entries;
}

test("NOTICE per-file map names every reference/*.md and top-level scripts/ file, and no file that doesn't exist", () => {
  const entries = noticeProvenanceMap();

  for (const entry of entries) {
    assert.ok(existsSync(join(ROOT, entry)), `NOTICE lists ${entry}, which does not exist in the repo`);
  }

  const referenceFiles = readdirSync(join(ROOT, "reference"))
    .filter((f) => f.endsWith(".md"))
    .map((f) => `reference/${f}`);
  const scriptsFiles = readdirSync(join(ROOT, "scripts"))
    .filter((f) => statSync(join(ROOT, "scripts", f)).isFile())
    .map((f) => `scripts/${f}`);

  const missing = [...referenceFiles, ...scriptsFiles].filter((f) => !entries.includes(f));
  assert.deepEqual(missing, [], `files present on disk but not named in NOTICE's per-file map: ${missing.join(", ")}`);
});

test("scripts/upstream-drift.sh reports on exactly 5 tracked paths, OK when reachable", (t) => {
  let stdout;
  try {
    stdout = execFileSync("bash", [join(ROOT, "scripts", "upstream-drift.sh")], {
      cwd: ROOT,
      encoding: "utf8",
      timeout: 20000,
    });
  } catch (err) {
    t.skip(`upstream-drift.sh did not complete (likely offline): ${err.message}`);
    return;
  }
  const lines = stdout.trim().split("\n").filter(Boolean);
  if (lines.length === 0) {
    t.skip("upstream-drift.sh produced no output (likely offline)");
    return;
  }
  assert.equal(lines.length, 5, `expected 5 tracked paths, got ${lines.length}:\n${stdout}`);
  const notOk = lines.filter((l) => !l.startsWith("OK"));
  if (notOk.length > 0) {
    t.skip(`not all paths reported OK (network-dependent, non-fatal): ${notOk.join(" | ")}`);
    return;
  }
  for (const line of lines) assert.match(line, /^OK\s+\S+/);
});

// -- gap 6: hermetic -- this file never writes inside the repo ------------

test("this test file's temp fixtures all live under the OS tmpdir, never inside the repo", () => {
  const self = readFileSync(join(ROOT, "scripts", "preflight.gaps.test.mjs"), "utf8");
  assert.doesNotMatch(self, /writeFileSync\(\s*join\(ROOT/, "no fixture in this file may be written inside the repo");
});
