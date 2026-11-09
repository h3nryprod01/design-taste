// Tessel 75, a 75% gasket-mount keyboard, drawn with the Anatomy kit and taken apart in six assemblies.
// node templates/build/anatomy-keyboard.mjs  -> templates/build/kb.html (standalone figure, gitignored) and templates/depth-launch.html
// Needs the Anatomy kit (https://github.com/wheresryan22/anatomy, MIT). Default location: a clone next to this repo;
// override with ANATOMY_DIR=/path/to/anatomy.
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
const ANATOMY = process.env.ANATOMY_DIR ? join(process.env.ANATOMY_DIR, "kit/iso-kit.mjs") : fileURLToPath(new URL("../../../anatomy/kit/iso-kit.mjs", import.meta.url));
const k = await import(pathToFileURL(ANATOMY).href);

const HERE = dirname(fileURLToPath(import.meta.url));
const SPIKE = join(HERE, "..");

// ---------- truth: the model, in millimetres ----------
const U = 19.05; // key pitch
const KX0 = -8 * U; // 16u wide
const KY0 = -(6.25 * U) / 2; // 6 rows plus a 0.25u gap under the F-row
const rowY = (r) => KY0 + (r > 0 ? 0.25 * U : 0) + r * U;

const ONE = (ids) => ids.split(" ").map((id) => [id, id.toUpperCase(), 1, ""]);
const ROWS = [
  [["esc", "Esc", 1, "acc"], ...Array.from({ length: 12 }, (_, i) => [`f${i + 1}`, `F${i + 1}`, 1, ""]), ["del", "Del", 1, "mod"], ["ins", "Ins", 1, "mod"], ["prt", "Prt", 1, "mod"]],
  [...ONE("` 1 2 3 4 5 6 7 8 9 0 - ="), ["back", "Back", 2, "mod"], ["home", "Home", 1, "mod"]],
  [["tab", "Tab", 1.5, "mod"], ...ONE("q w e r t y u i o p [ ]"), ["\\", "\\", 1.5, "mod"], ["pgup", "PgUp", 1, "mod"]],
  [["caps", "Caps", 1.75, "mod"], ...ONE("a s d f g h j k l ; '"), ["enter", "Enter", 2.25, "acc"], ["pgdn", "PgDn", 1, "mod"]],
  [["shift", "Shift", 2.25, "mod"], ...ONE("z x c v b n m , . /"), ["rshift", "Shift", 1.75, "mod"], ["up", "↑", 1, "mod"], ["end", "End", 1, "mod"]],
  [["ctrl", "Ctrl", 1.25, "mod"], ["opt", "Opt", 1.25, "mod"], ["cmd", "Cmd", 1.25, "mod"], ["space", "", 6.25, ""], ["rcmd", "Cmd", 1, "mod"], ["fn", "Fn", 1, "mod"], ["rctrl", "Ctrl", 1, "mod"], ["left", "←", 1, "mod"], ["down", "↓", 1, "mod"], ["right", "→", 1, "mod"]],
];
const CAP_H = [9.4, 9.4, 7.9, 7.4, 8.0, 8.0]; // Cherry-style row heights R1 R1 R2 R3 R4 R4

const KEYS = [];
ROWS.forEach((row, r) => {
  let x = KX0;
  for (const [id, label, w, cls] of row) {
    KEYS.push({ id, label, w, cls, r, x0: x, y0: rowY(r), cx: x + (w * U) / 2, cy: rowY(r) + U / 2, stab: w >= 2 ? (w > 6 ? 50 : 11.95) : 0 });
    x += w * U;
  }
  if (Math.abs(x - (KX0 + 16 * U)) > 1e-6) throw new Error(`row ${r} is ${(x - KX0) / U}u, not 16u`);
});
if (KEYS.length !== 84) throw new Error(`expected 84 keys, got ${KEYS.length}`);

// heights (z, mm, 0 = underside of the case)
const Z = {
  foot: -2, rim: 23, floor: 4, shelf: 14.6, gasket: 16.1,
  weight: 7.5, foam0: 7.5, foam1: 11, pcb0: 11, pcb1: 12.6,
  post0: 9.3, plate0: 16.1, plate1: 17.6, house1: 24.2, stem1: 27.8, cap0: 25.2,
};
const TRAVEL = 4; // MX travel

// plans (floor rectangles, mm)
const CASE = { x: -168, y: -75, w: 336, d: 150, r: 9 };
const INNER = k.insetPlan({ x: KX0 - 7.5, y: KY0 - 7.5, w: 16 * U + 15, d: 6.25 * U + 15, r: 3 }, 0);
const PLATE = k.insetPlan(INNER, 0.8);
const PCB = k.insetPlan(INNER, 4.4);
const FOAM = k.insetPlan(INNER, 4.6);
const WEIGHT = { x: -110, y: -36, w: 220, d: 70, r: 3 };
const LABEL = { x: 52, y: 18, w: 46, d: 11, r: 1.2 };

// explode: one vertical move per assembly; the case is the base and stays
const MOVES = { caps: 262, switches: 196, plate: 146, pcb: 104, foam: 64, case: 0 };
const ORDER = ["caps", "switches", "plate", "pcb", "foam"]; // outside leaves first
const NAMES = { caps: "keycaps", switches: "switches", plate: "plate", pcb: "PCB", foam: "foam and case" };

// ---------- camera ----------
const W = 760;
const H = 540;
const AZ = 62;
const capTop = Z.cap0 + Math.max(...CAP_H);
const P = k.fitProjection([...k.boxCorners(CASE, Z.foot, Z.rim), ...k.boxCorners(CASE, Z.foot, capTop + MOVES.caps)], W, H, { pad: 22, azimuth: AZ, elevation: 24 });
const at = (p) => k.iso(p, P);
const S = (paths, style) => k.solidSvg(paths, style);
const L = (d, style) => k.lineSvg(d, style);
const Dots = (pts, style) => k.dotsSvg(pts, style);
const depth = (x, y, z = 0) => k.depthOf([x, y, z], P);
const r1 = (v) => Math.round(v * 10) / 10;

// assembled framing: the same aspect, zoomed on the assembled board
function boxOf(points) {
  const s = points.map(at);
  const xs = s.map((p) => p[0]);
  const ys = s.map((p) => p[1]);
  return [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)];
}
// content boxes in canvas units: the page frames them to the stage's own aspect at run time
const BOX_ASM = boxOf([...k.boxCorners(CASE, Z.foot, Z.rim), ...k.boxCorners(CASE, Z.foot, capTop)]).map(r1);
const BOX_APART = boxOf([...k.boxCorners(CASE, Z.foot, Z.rim), ...k.boxCorners(CASE, Z.foot, capTop + MOVES.caps)]).map(r1);

// ---------- helpers ----------
const plan = (cx, cy, w, d, r) => ({ x: cx - w / 2, y: cy - d / 2, w, d, r });
const byRowThenX = (a, b) => a.r - b.r || a.x - b.x;
const holeSvg = (d) => `<path class="kb-hole" d="${d}"/>` + L(d, { tone: "lo" });
const screw = (x, y, z, r = 1.7) => L(k.ring(x, y, r, z, P, 14), { tone: "lo" }) + Dots([at([x, y, z])], { size: 0.45 });

// faces on the case cavity: quads of an inner wall from z0 to z1, shaded by facing
function cavityWalls(ring, z0, z1) {
  const [vx, vy] = k.towardViewer(P);
  const { sinA, cosA } = k.cameraOf(P);
  const sides = [[], [], [], []];
  const cx = ring.reduce((s, p) => s + p[0], 0) / ring.length;
  const cy = ring.reduce((s, p) => s + p[1], 0) / ring.length;
  const floorEdge = [];
  ring.forEach(([ax, ay], i) => {
    const [bx, by] = ring[(i + 1) % ring.length];
    const len = Math.hypot(bx - ax, by - ay) || 1;
    let [nx, ny] = [(by - ay) / len, -(bx - ax) / len]; // inward normal of the wall face
    if (nx * (cx - (ax + bx) / 2) + ny * (cy - (ay + by) / 2) < 0) [nx, ny] = [-nx, -ny];
    if (nx * vx + ny * vy <= 1e-9) return; // face turned away
    const lit = (nx * -sinA + ny * cosA + 1) / 2;
    sides[Math.min(3, Math.max(0, Math.floor(lit * 4)))].push(k.pathOf([at([ax, ay, z1]), at([bx, by, z1]), at([bx, by, z0]), at([ax, ay, z0])], true));
    floorEdge.push([[ax, ay], [bx, by]]);
  });
  const edge = floorEdge.map(([a, b]) => k.pathOf([at([...a, z0]), at([...b, z0])])).join("");
  return sides.map((d, s) => (d.length ? `<path class="iso-shade" data-shade="${s}" d="${d.join("")}"/>` : "")).join("") + L(edge, { tone: "faint" });
}
const onWall = (y) => k.sideMatrix([0, y], 0, P, "left");
const flatIn = (x0, z0, x1, z1, r) => k.pathOf(k.roundedPlan({ x: x0, y: z0, w: x1 - x0, d: z1 - z0, r }, 4).map(([u, z]) => [u, -z]), true);

// ---------- case (static) ----------
const caseSolid = () => S(k.slabOf(CASE, 0, Z.rim, P, 8, 1.2), { tone: "mid", className: "kb-case", inner: L(k.sideSeam(CASE, 2.4, P, 8), { tone: "faint" }) });
const OPEN = k.planOutline(INNER, Z.rim, P, 4);

const SHELVES = [];
for (const x of [-120, -40, 40, 120]) {
  SHELVES.push(plan(x, INNER.y + 1.8, 18, 3.6, 0.6));
  SHELVES.push(plan(x, INNER.y + INNER.d - 1.8, 18, 3.6, 0.6));
}
for (const y of [-26, 26]) {
  SHELVES.push(plan(INNER.x + 1.8, y, 3.6, 18, 0.6));
  SHELVES.push(plan(INNER.x + INNER.w - 1.8, y, 3.6, 18, 0.6));
}
const BOSSES = [[-140, -50], [140, -50], [-140, 50], [140, 50], [0, -52], [0, 52]];
const USB_X = -108;

function caseBack() {
  const out = [`<path class="iso-halo" d="${k.haloOf(CASE, Z.foot, 22, P)}"/>`];
  const feet = k.corners(CASE, 20).sort((a, b) => depth(...a) - depth(...b));
  for (const [x, y] of feet) out.push(S(k.cylinder(x, y, 7, Z.foot, 2, P, 28), { tone: "lo" }));
  out.push(caseSolid());
  // the milled tub, seen through its opening
  const cav = [`<path class="kb-void" d="${OPEN}"/>`];
  cav.push(`<g class="kb-cavity">${cavityWalls(k.ringOf(INNER, 4), Z.floor, Z.rim)}</g>`);
  cav.push(`<path class="iso-top kb-floor" d="${k.planOutline(INNER, Z.floor, P, 4)}"/>`);
  // USB-C opening through the back wall, on its inner face
  const port = flatIn(USB_X - 6.2, 12.2, USB_X + 6.2, 16.4, 2.1);
  cav.push(`<g transform="${onWall(INNER.y)}"><path class="kb-hole" d="${port}"/><path class="iso-line" data-tone="lo" d="${port}"/><path class="iso-line" data-tone="faint" d="${flatIn(USB_X - 7.4, 11, USB_X + 7.4, 17.6, 3.2)}"/></g>`);
  // floor parts, far to near
  const items = [];
  for (const s of SHELVES) {
    const gasket = k.insetPlan(s, 0.3);
    items.push({ d: depth(s.x + s.w / 2, s.y + s.d / 2), svg: S(k.slabOf(s, Z.floor, Z.shelf - Z.floor, P, 2), { tone: "lo" }) + S(k.slabOf(gasket, Z.shelf, Z.gasket - Z.shelf, P, 2), { tone: "lo", className: "kb-gasket" }) + Dots(k.dotGrid(gasket.x + 1.4, gasket.y + 1, Math.max(1, Math.floor((gasket.w - 1.4) / 2.2)), Math.max(1, Math.floor((gasket.d - 1) / 2.2)), 2.2, Z.gasket, P), { size: 0.22, tone: "faint" }) });
  }
  for (const [x, y] of BOSSES) items.push({ d: depth(x, y), svg: S(k.cylinder(x, y, 3.4, Z.floor, Z.weight - Z.floor, P, 20, 0.4), { tone: "mid" }) + screw(x, y, Z.weight, 1.8) });
  const wTop = Z.weight;
  const weightDetail = [
    L(k.planOutline(k.insetPlan(WEIGHT, 4), wTop, P, 3), { tone: "faint" }),
    ...k.corners(WEIGHT, 8).map(([x, y]) => screw(x, y, wTop)),
    L(k.planOutline(LABEL, wTop, P, 3), { tone: "lo" }),
    L(k.planOutline(k.insetPlan(LABEL, 1.1), wTop, P, 3), { tone: "faint" }),
    k.faceTextSvg(k.topMatrix([LABEL.x + 3, LABEL.y + 6.6], wTop, P), "TESSEL 75", { size: 4, tone: "mid" }),
    L(k.lineOnTop([LABEL.x + 3, LABEL.y + 8.6], [LABEL.x + 26, LABEL.y + 8.6], wTop, P), { tone: "lo", free: true }),
    Dots([at([LABEL.x + LABEL.w - 3, LABEL.y + 3, wTop]), at([LABEL.x + LABEL.w - 3, LABEL.y + LABEL.d - 3, wTop])], { size: 0.4 }),
  ].join("");
  items.push({ d: depth(0, 0), svg: S(k.slabOf(WEIGHT, Z.floor, Z.weight - Z.floor, P, 4, 0.8), { tone: "mid", className: "kb-brass", inner: L(k.sideSeam(WEIGHT, Z.floor + 1.2, P, 4), { tone: "faint" }) }) + weightDetail });
  items.sort((a, b) => a.d - b.d);
  cav.push(...items.map((i) => i.svg));
  out.push(`<clipPath id="kb-open"><path d="${OPEN}"/></clipPath><g clip-path="url(#kb-open)">${cav.join("")}</g>`);
  return out.join("");
}

function caseFront() {
  const big = `M-400 -400H${W + 400}V${H + 400}H-400Z`;
  return [
    `<clipPath id="kb-wall"><path clip-rule="evenodd" d="${big}${OPEN}"/></clipPath>`,
    `<g clip-path="url(#kb-wall)">${caseSolid()}</g>`,
    L(OPEN, { tone: "lo" }),
    L(k.planOutline(k.insetPlan(INNER, -1.1), Z.rim, P, 4), { tone: "faint" }),
  ].join("");
}

// ---------- foam ----------
function foam() {
  const g = 7;
  const cols = Math.floor((FOAM.w - 6) / g) + 1;
  const rows = Math.floor((FOAM.d - 6) / g) + 1;
  return S(k.slabOf(FOAM, Z.foam0, Z.foam1 - Z.foam0, P, 3), { tone: "lo", className: "kb-foam" }) +
    Dots(k.dotGrid(FOAM.x + 3, FOAM.y + 3, cols, rows, g, Z.foam1, P), { size: 0.3, tone: "faint" });
}

// ---------- PCB ----------
const space = KEYS.find((key) => key.id === "space");
const MCU = plan(space.cx - 30, space.cy + 1, 7, 7, 0.4);
const XTAL = plan(space.cx - 19, space.cy - 2.6, 3.2, 2.5, 0.3);
const RADIO = plan(space.cx + 30, space.cy, 18, 12, 0.6);
const CAN = plan(space.cx + 27.5, space.cy, 11.5, 9.6, 0.5);
const ANT = plan(space.cx + 36, space.cy, 3, 8, 0.3);
const USBC = plan(USB_X, PCB.y + 2.3, 8.9, 7.4, 1.2);
const ESD = plan(USB_X + 12, PCB.y + 5, 3, 2, 0.3);

function pcb() {
  const top = Z.pcb1;
  const out = [S(k.slabOf(PCB, Z.pcb0, Z.pcb1 - Z.pcb0, P, 3, 0.4), { tone: "mid", className: "kb-pcb" })];
  const silk = [];
  const holes = [];
  for (const key of KEYS) {
    silk.push(k.planOutline(plan(key.cx, key.cy, 14.4, 14.4, 0.4), top, P, 2));
    holes.push(k.ring(key.cx, key.cy, 2, top, P, 16), k.ring(key.cx - 3.81, key.cy - 2.54, 0.8, top, P, 10), k.ring(key.cx + 2.54, key.cy - 5.08, 0.8, top, P, 10));
    if (key.stab) for (const s of [-1, 1]) holes.push(k.ring(key.cx + s * key.stab, key.cy - 0.7, 1.6, top, P, 12), k.ring(key.cx + s * key.stab, key.cy + 7.2, 2, top, P, 14));
  }
  out.push(L(silk.join(""), { tone: "faint" }), L(holes.join(""), { tone: "lo" }));
  // traces from the MCU to the radio module, each ending on a pad dot
  const traces = [];
  const pads = [];
  for (let i = 0; i < 4; i++) {
    const y = MCU.y + 1.4 + i * 1.4;
    const a = [MCU.x + MCU.w, y];
    const b = [RADIO.x, RADIO.y + 3 + i * 2];
    traces.push(k.onTop([a, [a[0] + 8 + i * 1.2, y], [a[0] + 8 + i * 1.2, b[1]], b], top, P));
    pads.push(at([...a, top]), at([...b, top]));
  }
  out.push(L(traces.join(""), { tone: "faint" }), Dots(pads, { size: 0.35, tone: "lo" }));
  const comp = [];
  const mcuPins = [];
  for (let i = 0; i < 7; i++) {
    const t = MCU.x + 0.8 + i * 0.9;
    mcuPins.push(at([t, MCU.y + MCU.d + 0.35, top]), at([MCU.x + MCU.w + 0.35, MCU.y + 0.8 + i * 0.9, top]));
  }
  comp.push({ p: MCU, svg: Dots(mcuPins, { size: 0.22, tone: "mid" }) + S(k.slabOf(MCU, top, 0.9, P, 2, 0.3), { tone: "hi", className: "kb-chip" }) + Dots([at([MCU.x + 1.2, MCU.y + 1.2, top + 0.9])], { size: 0.35, tone: "mid" }) });
  comp.push({ p: XTAL, svg: S(k.slabOf(XTAL, top, 0.8, P, 2), { tone: "mid" }) });
  comp.push({ p: RADIO, svg: S(k.slabOf(RADIO, top, 0.8, P, 2, 0.3), { tone: "mid", className: "kb-pcb" }) + S(k.slabOf(CAN, top + 0.8, 1.6, P, 2, 0.5), { tone: "hi", inner: L(k.sideSeam(CAN, top + 1.6, P, 2), { tone: "faint" }) }) + S(k.slabOf(ANT, top + 0.8, 0.7, P, 2), { tone: "mid" }) });
  comp.push({ p: ESD, svg: S(k.slabOf(ESD, top, 0.6, P, 2), { tone: "mid" }) });
  comp.push({ p: USBC, svg: S(k.slabOf(USBC, top, 3.26, P, 3, 0.4), { tone: "hi", inner: L(k.sideSeam(USBC, top + 1.4, P, 3), { tone: "faint" }) }) + Dots([at([USBC.x + 1.6, USBC.y + USBC.d - 1.4, top + 3.26]), at([USBC.x + USBC.w - 1.6, USBC.y + USBC.d - 1.4, top + 3.26])], { size: 0.35 }) });
  comp.sort((a, b) => depth(a.p.x + a.p.w / 2, a.p.y + a.p.d / 2) - depth(b.p.x + b.p.w / 2, b.p.y + b.p.d / 2));
  out.push(...comp.map((c) => c.svg));
  return out.join("");
}

// ---------- plate ----------
function plate() {
  const top = Z.plate1;
  const out = [S(k.slabOf(PLATE, Z.plate0, Z.plate1 - Z.plate0, P, 4, 0.5), { tone: "mid", className: "kb-fr4" })];
  const cut = [];
  for (const key of KEYS) {
    cut.push(k.planOutline(plan(key.cx, key.cy, 14, 14, 0.5), top, P, 2));
    if (key.stab) for (const s of [-1, 1]) cut.push(k.planOutline(plan(key.cx + s * key.stab, key.cy + 0.6, 6.8, 12.3, 0.6), top, P, 2));
  }
  // flex cuts: slots between rows, with bridges
  const a = KX0 + 12;
  const b = KX0 + 16 * U - 12;
  const bridge = 7;
  const len = (b - a - bridge * 3) / 4;
  for (let r = 0; r < 5; r++) {
    const y = r === 0 ? (rowY(0) + U + rowY(1)) / 2 : rowY(r + 1);
    // stagger the bridges row to row, so the plate flexes evenly
    for (let s = a - (r % 2 ? (len + bridge) / 2 : 0); s < b; s += len + bridge) {
      const x0 = Math.max(s, a);
      const x1 = Math.min(s + len, b);
      if (x1 - x0 > 10) cut.push(k.planOutline({ x: x0, y: y - 0.6, w: x1 - x0, d: 1.2, r: 0.6 }, top, P, 3));
    }
  }
  out.push(holeSvg(cut.join("")));
  return out.join("");
}

// ---------- switches ----------

function switchPins() {
  return [...KEYS].sort((a, b) => a.r - b.r || a.cx - b.cx).map((key) => S(k.cylinder(key.cx, key.cy, 1.9, Z.post0, Z.pcb1 - Z.post0, P, 12), { tone: "lo" })).join("");
}

function switchBottoms() {
  const out = [];
  for (let r = 0; r < 6; r++) {
    const items = [];
    const wires = [];
    for (const key of KEYS.filter((k2) => k2.r === r)) {
      items.push({ x: key.cx, svg: S(k.slabOf(plan(key.cx, key.cy, 13.8, 13.8, 0.8), Z.pcb1, Z.plate1 - Z.pcb1, P, 2), { tone: "lo" }) });
      if (!key.stab) continue;
      for (const s of [-1, 1]) items.push({ x: key.cx + s * key.stab, svg: S(k.slabOf(plan(key.cx + s * key.stab, key.cy + 0.6, 6.4, 12, 0.6), 12.9, Z.plate1 - 12.9, P, 2), { tone: "lo" }) });
      const xa = key.cx - key.stab;
      const xb = key.cx + key.stab;
      const yf = key.cy + 6.6;
      const zw = 14;
      wires.push(L(k.pathOf([[xa, yf, zw], [xa, yf + 1.6, zw], [xb, yf + 1.6, zw], [xb, yf, zw]].map(at)), { tone: "mid", className: "kb-wire" }) + Dots([at([xa, yf, zw]), at([xb, yf, zw])], { size: 0.55, tone: "mid" }));
    }
    items.sort((a, b) => a.x - b.x);
    out.push(...items.map((i) => i.svg), ...wires);
  }
  return out.join("");
}

function switchTops() {
  const out = [];
  for (let r = 0; r < 6; r++) {
    const items = [];
    for (const key of KEYS.filter((k2) => k2.r === r)) {
      const house = plan(key.cx, key.cy, 14.6, 14.6, 1.6);
      const led = { x: key.cx - 2.7, y: key.cy + 4.3, w: 5.4, d: 2.1, r: 0.5 };
      items.push({
        x: key.cx,
        svg: S(k.slabOf(house, Z.plate1, Z.house1 - Z.plate1, P, 3, 0.5), { tone: "mid", className: "kb-house" }) +
          L(k.planOutline(led, Z.house1, P, 2), { tone: "faint" }) +
          // the stem cross as three bars: back half of the y bar, the x bar, front half of the y bar
          [plan(key.cx, key.cy - 1.33, 1.2, 1.46, 0.2), plan(key.cx, key.cy, 4.1, 1.2, 0.2), plan(key.cx, key.cy + 1.33, 1.2, 1.46, 0.2)].map((b) => S(k.slabOf(b, Z.house1, Z.stem1 - Z.house1, P, 1), { tone: "mid", className: "kb-stem" })).join(""),
      });
      if (!key.stab) continue;
      for (const s of [-1, 1]) {
        const sx = key.cx + s * key.stab;
        items.push({ x: sx, svg: S(k.slabOf(plan(sx, key.cy + 0.6, 7.6, 13, 0.8), Z.plate1, 2.6, P, 2, 0.4), { tone: "mid" }) + S(k.slabOf(plan(sx, key.cy - 0.4, 4.2, 4.6, 0.5), Z.plate1 + 2.6, 2.4, P, 2), { tone: "mid", className: "kb-stem" }) });
      }
    }
    items.sort((a, b) => a.x - b.x);
    out.push(...items.map((i) => i.svg));
  }
  return out.join("");
}

// ---------- keycaps ----------
function keycaps() {
  return KEYS.map((key, index) => ({ key, index }))
    .sort((a, b) => a.key.r - b.key.r || a.key.cx - b.key.cx)
    .map(({ key, index }) => {
      const p = { x: key.x0 + 0.45, y: key.y0 + 0.45, w: key.w * U - 0.9, d: U - 0.9, r: 1.6 };
      const top = Z.cap0 + CAP_H[key.r];
      const cls = `kc${key.cls ? ` kc-${key.cls}` : ""}`;
      const parts = [S(k.slabOf(p, Z.cap0, CAP_H[key.r], P, 3, 0.6), { tone: "hi", lit: key.cls === "acc", className: cls, crease: "faint" })];
      parts.push(L(k.planOutline(k.insetPlan(p, 2.4), top, P, 3), { tone: "faint" }));
      if (key.label) parts.push(`<g class="kb-legend">${k.faceTextSvg(k.topMatrix([p.x + 3.4, p.y + 6.6], top, P), key.label, { size: key.label.length > 3 ? 2.9 : 3.4, tone: "mid" })}</g>`);
      if (key.id === "f" || key.id === "j") parts.push(L(k.planOutline({ x: key.cx - 2.6, y: p.y + p.d - 5.4, w: 5.2, d: 0.9, r: 0.45 }, top, P, 2), { tone: "mid" }));
      return `<g class="kb-key" data-key="${index}">${parts.join("")}</g>`;
    })
    .join("");
}

// ---------- assemble the painter's chunks ----------
// Each chunk is a horizontal layer of one assembly. Stacked layers are separated by horizontal planes, so the
// lower one is painted first; the key is the chunk's bottom (the plate uses its top, since switch housings pass
// through it) and it rises with the chunk. The case front (the tub outside its opening) is a fixed key at the rim:
// layers below the rim are drawn under it, layers lifted clear of it are drawn over it.
const CHUNKS = [
  { id: "case-back", piece: "case", key: -1000, top: Z.rim, svg: caseBack() },
  { id: "foam", piece: "foam", key: Z.foam0, top: Z.foam1, svg: foam() },
  { id: "pcb", piece: "pcb", key: Z.pcb0, top: Z.pcb1 + 3.26, svg: pcb() },
  { id: "sw-bottom", piece: "switches", key: Z.pcb1, top: Z.plate1, svg: switchBottoms() },
  { id: "plate", piece: "plate", key: Z.plate1, top: Z.plate1, svg: plate() },
  { id: "sw-top", piece: "switches", key: Z.plate1 + 0.05, top: Z.stem1, svg: switchTops() },
  { id: "case-front", piece: "case", key: Z.rim, top: Z.rim, svg: caseFront() },
  { id: "caps", piece: "caps", key: Z.cap0, top: capTop, svg: keycaps() },
];
const UP = k.axisVector(P, [0, 0, 1]);
// One <svg> per chunk, stacked in a canvas. Each is promoted to its own compositor layer and moves with a CSS
// translate3d, the painter's order is the layers' z-index, and the zoom is a CSS scale on the canvas, so a frame of
// the explode repaints nothing.
const layers = CHUNKS.map((c, i) => `<svg xmlns="http://www.w3.org/2000/svg" class="iso-svg kb-layer" viewBox="0 0 ${W} ${H}" aria-hidden="true" style="z-index:${i + 1}" data-chunk="${c.id}" data-piece="${c.piece}" data-k="${c.key}" data-m="${MOVES[c.piece]}" data-top="${r1(c.top)}">${c.svg}</svg>`).join("");

const LABEL_TEXT = "Tessel 75, a 75 percent gasket-mount keyboard, seen from the front right: 84 sculpted keycaps with Esc and Enter lit, linear switches with stabilisers under Space, Enter, left Shift and Backspace, an FR4 plate with switch cutouts and flex-cut slots, a PCB with hot-swap footprints, a USB-C receptacle, a controller chip and a radio module, a poron foam sheet, and a milled aluminium tub with twelve gasket points, screw bosses, a brass weight and rubber feet.";
const figure = `<div class="kb-stage"><div class="kb-canvas" role="img" aria-label="${LABEL_TEXT}">${layers}</div></div>`;

const stack0 = r1(capTop - Z.foot);
const card = k.plateHtml({ fig: "Fig 1", title: "Tessel 75 · six layers", hint: "Scroll to take it apart", readout: `assembled · ${stack0.toFixed(1)} mm`, body: figure });

const stabs = KEYS.filter((key) => key.stab).length;
const DETAIL = {
  caps: `keycaps · ${KEYS.length} caps`,
  switches: `switches · ${KEYS.length} + ${stabs * 2} stabiliser housings`,
  plate: `plate · FR4, ${r1(Z.plate1 - Z.plate0)} mm`,
  pcb: `PCB · ${r1(Z.pcb1 - Z.pcb0)} mm, ${KEYS.length} footprints`,
  foam: `foam and case · ${r1(Z.foam1 - Z.foam0)} mm poron, ${SHELVES.length} gaskets`,
};

const FIG_CSS = `
.kb-fig{--anatomy-card:oklch(18% .009 255);--anatomy-paper:oklch(18% .009 255);--anatomy-page:transparent;--anatomy-mono:"Geist Mono",ui-monospace,monospace;color:var(--anatomy-text)}
.kb-fig .iso-figure{margin:0}
.kb-fig .iso-plate{box-shadow:0 0 0 1px oklch(100% 0 0 / .1);border-radius:14px;padding:46px 20px}
.kb-fig .iso-plate-corner[data-corner="readout"]{color:var(--accent,#f0b84a)}
.kb-stage{position:relative;aspect-ratio:${W}/${H};overflow:hidden;contain:layout paint}
.kb-canvas{position:absolute;left:0;top:0;width:${W}px;height:${H}px;transform-origin:0 0;will-change:transform}
.kb-layer{position:absolute;inset:0;width:100%!important;height:100%!important;overflow:visible;will-change:transform;transition:opacity .45s var(--anatomy-ease),filter .45s var(--anatomy-ease)}
.kb-stage[data-focus] .kb-layer:not([data-on]){opacity:.38}
.kb-stage[data-focus] .kb-layer[data-on]{filter:brightness(1.25) saturate(1.15)}
@media (max-width:560px){.kb-stage{aspect-ratio:10/11}.kb-fig .iso-plate-corner{font-size:9.5px}}
.kb-void{fill:var(--anatomy-shade-0)}
.kb-hole{fill:var(--anatomy-shade-0);stroke:none}
.kb-floor{fill:color-mix(in oklab,var(--case,oklch(32% .008 255)) 30%,var(--anatomy-shade-1))}
.kb-cavity .iso-shade{fill:color-mix(in oklab,var(--case,oklch(32% .008 255)) 26%,var(--anatomy-shade-0))}
.kb-wire{stroke-width:.9px}
.kb-legend .iso-face-text{font-family:"Geist",system-ui,sans-serif;letter-spacing:0;fill:color-mix(in oklab,var(--legend,oklch(25% .01 255)) 80%,transparent)}
.kc{--c:var(--cap,oklch(90% .006 90))}
.kc-mod{--c:var(--cap-mod,oklch(62% .01 255))}
.kc-acc{--c:var(--cap-accent,oklch(80% .145 72))}
.kc>.iso-fill,.kc>.iso-shade[data-shade="1"]{fill:color-mix(in oklab,var(--c) 52%,var(--anatomy-paper))}
.kc>.iso-shade[data-shade="0"]{fill:color-mix(in oklab,var(--c) 42%,var(--anatomy-paper))}
.kc>.iso-shade[data-shade="2"]{fill:color-mix(in oklab,var(--c) 62%,var(--anatomy-paper))}
.kc>.iso-shade[data-shade="3"]{fill:color-mix(in oklab,var(--c) 70%,var(--anatomy-paper))}
.kc>.iso-top{fill:color-mix(in oklab,var(--c) 82%,var(--anatomy-paper))}
.kc-acc[data-lit]>.iso-top{fill:var(--c)}.kc-acc[data-lit]>.iso-shade,.kc-acc[data-lit]>.iso-fill{fill:color-mix(in oklab,var(--c) 62%,var(--anatomy-paper))}
.kb-case>.iso-fill,.kb-case>.iso-shade[data-shade="1"]{fill:color-mix(in oklab,var(--case,oklch(32% .008 255)) 55%,var(--anatomy-paper))}
.kb-case>.iso-shade[data-shade="0"]{fill:color-mix(in oklab,var(--case,oklch(32% .008 255)) 44%,var(--anatomy-paper))}
.kb-case>.iso-shade[data-shade="2"]{fill:color-mix(in oklab,var(--case,oklch(32% .008 255)) 66%,var(--anatomy-paper))}
.kb-case>.iso-shade[data-shade="3"]{fill:color-mix(in oklab,var(--case,oklch(32% .008 255)) 76%,var(--anatomy-paper))}
.kb-case>.iso-top{fill:color-mix(in oklab,var(--case-hi,oklch(44% .008 255)) 80%,var(--anatomy-paper))}
.kb-brass>.iso-top{fill:oklch(34% .03 80)}.kb-brass>.iso-shade{fill:oklch(27% .025 80)}
.kb-gasket>.iso-top,.kb-gasket>.iso-shade{fill:oklch(26% .02 25)}
.kb-foam>.iso-top{fill:oklch(25% .025 25)}.kb-foam>.iso-shade{fill:oklch(21% .02 25)}
.kb-pcb>.iso-top{fill:oklch(27% .045 160)}.kb-pcb>.iso-shade{fill:oklch(22% .04 160)}
.kb-fr4>.iso-top{fill:oklch(33% .03 95)}.kb-fr4>.iso-shade{fill:oklch(26% .025 95)}
.kb-stem>.iso-top{fill:oklch(55% .17 28)}.kb-stem>.iso-shade{fill:oklch(42% .14 28)}
`;

// ---------- live behaviour (needs no kit function, so the kit is not inlined) ----------
const PAD = 22;
const CODES = { Backquote: "`", Minus: "-", Equal: "=", BracketLeft: "[", BracketRight: "]", Backslash: "\\", Semicolon: ";", Quote: "'", Comma: ",", Period: ".", Slash: "/", Escape: "esc", Delete: "del", Insert: "ins", PrintScreen: "prt", Backspace: "back", Home: "home", Tab: "tab", PageUp: "pgup", CapsLock: "caps", Enter: "enter", NumpadEnter: "enter", PageDown: "pgdn", ShiftLeft: "shift", ShiftRight: "rshift", ArrowUp: "up", End: "end", ControlLeft: "ctrl", AltLeft: "opt", MetaLeft: "cmd", Space: "space", MetaRight: "rcmd", AltRight: "fn", ControlRight: "rctrl", ArrowLeft: "left", ArrowDown: "down", ArrowRight: "right" };
const DATA = { W, H, pad: PAD, up: UP, boxA: BOX_ASM, boxB: BOX_APART, order: ORDER, detail: DETAIL, foot: Z.foot, travel: TRAVEL, stack0, spring: { stiffness: 64, damping: 16, substeps: 4, window: 0.76, lag: 0.06 }, keys: KEYS.map((key) => key.id), codes: CODES };
const LIVE = `
const D = ${JSON.stringify(DATA)};
const fig = document.querySelector("[data-kb]");
const stage = fig.querySelector(".kb-stage");
const canvas = stage.querySelector(".kb-canvas");
const readout = fig.querySelector("[data-readout]");
const still = matchMedia("(prefers-reduced-motion: reduce)");
const nodes = [...canvas.children].map((el) => ({ el, piece: el.dataset.piece, k: +el.dataset.k, dz: +el.dataset.m, top: +el.dataset.top, shown: "", z: el.style.zIndex }));
const piece = { case: { x: 0, v: 0, target: 0 } };
D.order.forEach((id) => (piece[id] = { x: 0, v: 0, target: 0 }));
const drive = { x: 0, v: 0 };
let want = 0, focus = -1, frame = 0, last = 0, visible = true, shownCanvas = "", u = 1, sw = 1, frames = null;
const keyEls = [...canvas.querySelectorAll("[data-key]")];
const press = new Map();
const down = [-D.up[0] * D.travel, -D.up[1] * D.travel];
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const smooth = (v) => v * v * (3 - 2 * v);

// frame a content box to the stage's aspect, in canvas units
function frameOf([x0, y0, x1, y1], aspect) {
  let w = x1 - x0 + D.pad * 2, h = y1 - y0 + D.pad * 2;
  if (w / h > aspect) h = w / aspect; else w = h * aspect;
  return [(x0 + x1) / 2 - w / 2, (y0 + y1) / 2 - h / 2, w, h];
}
function layout() {
  const r = stage.getBoundingClientRect();
  if (!r.width || !r.height) return;
  sw = r.width;
  const aspect = r.width / r.height;
  frames = [frameOf(D.boxA, aspect), frameOf(D.boxB, aspect)];
  u = sw / frames[0][2]; // canvas px per unit at the assembled zoom, so the layers raster sharp there
  canvas.style.width = (D.W * u).toFixed(1) + "px";
  canvas.style.height = (D.H * u).toFixed(1) + "px";
  for (const n of nodes) n.shown = "";
  shownCanvas = "";
  place();
}
function place() {
  if (!frames) return;
  for (const n of nodes) {
    const s = piece[n.piece].x * n.dz * u;
    const text = s ? "translate3d(" + (D.up[0] * s).toFixed(2) + "px," + (D.up[1] * s).toFixed(2) + "px,0)" : "none";
    if (text !== n.shown) { n.shown = text; n.el.style.transform = text; }
  }
  const keyOf = (n) => n.k + n.dz * piece[n.piece].x;
  [...nodes].sort((a, b) => keyOf(a) - keyOf(b)).forEach((n, i) => { const z = String(i + 1); if (n.z !== z) { n.z = z; n.el.style.zIndex = z; } });
  const e = smooth(clamp(Math.max(...D.order.map((id) => piece[id].x))));
  const R = frames[0].map((v, i) => v + (frames[1][i] - v) * e);
  const s = sw / R[2] / u;
  const text = "translate3d(" + (-R[0] * u * s).toFixed(2) + "px," + (-R[1] * u * s).toFixed(2) + "px,0) scale(" + s.toFixed(4) + ")";
  if (text !== shownCanvas) { shownCanvas = text; canvas.style.transform = text; }
}
function say() {
  const all = D.order.map((id) => piece[id].x);
  const moving = D.order.some((id) => Math.abs(piece[id].x - piece[id].target) > 0.002);
  let text;
  if (all.every((x) => x < 0.002)) text = "assembled \\u00b7 " + D.stack0.toFixed(1) + " mm";
  else if (focus >= 0) text = D.detail[D.order[focus]];
  else if (moving) text = D.order.some((id) => piece[id].target > piece[id].x) ? "taking apart" : "closing up";
  else text = "apart \\u00b7 6 layers";
  if (readout && readout.textContent !== text) readout.textContent = text;
}
function settle(s, target, dt, seconds, calm) {
  if (calm) { s.x = target; s.v = 0; return false; }
  const w = 1 / seconds;
  for (let i = 0; i < 4; i++) { const h = dt / 4; s.v += (w * w * (target - s.x) - 2 * w * s.v) * h; s.x += s.v * h; }
  if (Math.abs(target - s.x) < 1e-4 && Math.abs(s.v) < 1e-4) { s.x = target; s.v = 0; return false; }
  return true;
}
function springTo(s, dt, calm) {
  const c = D.spring;
  if (calm) { s.x = s.target; s.v = 0; return false; }
  for (let i = 0; i < c.substeps; i++) { const h = dt / c.substeps; s.v += ((s.target - s.x) * c.stiffness - s.v * c.damping) * h; s.x += s.v * h; }
  if (Math.abs(s.target - s.x) < 2e-4 && Math.abs(s.v) < 2e-4) { s.x = s.target; s.v = 0; return false; }
  return true;
}
function tick(now) {
  const dt = last ? Math.min((now - last) / 1000, 1 / 30) : 1 / 60;
  last = now;
  const calm = still.matches;
  let busy = settle(drive, want, dt, 0.22, calm);
  D.order.forEach((id, i) => {
    const s = piece[id];
    s.target = clamp((drive.x - i * D.spring.lag) / D.spring.window);
    if (springTo(s, dt, calm)) busy = true;
  });
  for (const [i, p] of press) {
    p.held = Math.max(0, p.held - dt);
    const goal = p.held > 0 ? 1 : 0;
    p.at = calm ? goal : p.at + (goal - p.at) * (1 - Math.exp(-dt / (goal ? 0.022 : 0.07)));
    if (Math.abs(goal - p.at) < 0.01) p.at = goal;
    const el = keyEls[i];
    if (p.at) el.setAttribute("transform", "translate(" + (down[0] * p.at).toFixed(2) + " " + (down[1] * p.at).toFixed(2) + ")");
    else { el.removeAttribute("transform"); press.delete(i); }
    busy = true;
  }
  place();
  say();
  frame = busy && visible ? requestAnimationFrame(tick) : 0;
}
function run() { if (!frame && visible) { last = 0; frame = requestAnimationFrame(tick); } }
const ALIAS = { escape: "esc", " ": "space", spacebar: "space", backspace: "back", delete: "del", insert: "ins", printscreen: "prt", pageup: "pgup", pagedown: "pgdn", capslock: "caps", control: "ctrl", alt: "opt", meta: "cmd", arrowup: "up", arrowdown: "down", arrowleft: "left", arrowright: "right", return: "enter" };
window.kbKeyId = (code) => {
  code = String(code || "");
  if (/^Key[A-Z]$/.test(code)) return code.slice(3).toLowerCase();
  if (/^Digit[0-9]$/.test(code)) return code.slice(5);
  if (/^F([1-9]|1[0-2])$/.test(code)) return code.toLowerCase();
  return D.codes[code] || null;
};
// kbExplode(t) eases there; kbExplode(t, true) jumps (static layouts)
window.kbExplode = (t, now) => {
  want = clamp(+t || 0);
  if (now) { drive.x = want; drive.v = 0; D.order.forEach((id, i) => { const s = piece[id]; s.x = s.target = clamp((want - i * D.spring.lag) / D.spring.window); s.v = 0; }); place(); say(); }
  run();
};
window.kbFocus = (i) => {
  const next = i === null || i === undefined || i < 0 ? -1 : Math.min(D.order.length - 1, Math.floor(i));
  if (next === focus) return;
  focus = next;
  const on = focus >= 0 ? D.order[focus] : null;
  for (const n of nodes) (on && (n.piece === on || (on === "foam" && n.piece === "case"))) ? n.el.setAttribute("data-on", "") : n.el.removeAttribute("data-on");
  on ? stage.setAttribute("data-focus", "") : stage.removeAttribute("data-focus");
  say();
};
// press one keycap; returns true only when the key exists and the figure is on screen
window.kbPress = (label) => {
  if (!visible) return false;
  let id = String(label || "").toLowerCase();
  id = ALIAS[id] || id;
  const i = D.keys.indexOf(id);
  if (i < 0) return false;
  const p = press.get(i) || { at: 0, held: 0 };
  p.held = 0.09;
  press.set(i, p);
  run();
  return true;
};
new IntersectionObserver((entries) => { visible = entries[entries.length - 1].isIntersecting; if (visible) run(); }, { rootMargin: "120px 0px" }).observe(stage);
new ResizeObserver(layout).observe(stage);
layout();
say();
`;

// ---------- write the standalone figure ----------
const standalone = k.pageHtml({
  title: "Tessel 75 anatomy",
  theme: "dark",
  width: 1000,
  body: `<style>${FIG_CSS}</style><div class="kb-fig" data-kb>${card}</div>`,
  script: LIVE,
});
writeFileSync(join(HERE, "kb.html"), standalone);

// ---------- write the landing page v2 ----------
const SRI = {
  gsap: "sha384-g4NTh/Iv5PPU4xPyhEWqPcwtNXOvdaDI8LLnyYfyNZOjKJeYQyjzQ9X5275eBjpt",
  st: "sha384-Z3REaz79l2IaAZqJsSABtTbhjgOUYyV3p90XNnAPCSHg3EMTz1fouunq9WZRtj3d",
};
let page = readFileSync(join(SPIKE, "depth-launch-lite.html"), "utf8");
const swap = (from, to) => {
  if (!page.includes(from)) throw new Error("missing in page: " + from.slice(0, 80));
  page = page.replace(from, to);
};
const cut = (start, end, to) => {
  const a = page.indexOf(start);
  const b = page.indexOf(end, a);
  if (a < 0 || b < 0) throw new Error("missing block: " + start.slice(0, 60));
  page = page.slice(0, a) + to + page.slice(b);
};
// CSS: the CSS-3D stage goes, the Anatomy card comes in
cut("/* 3D stage */", ".captions{", `/* Exploded view: Anatomy figure */
.explode{height:420vh;position:relative}
.stage{position:sticky;top:0;height:100svh;display:grid;grid-template-rows:auto auto;align-content:center;justify-items:center;gap:8px;padding:72px 16px 20px;overflow:hidden}
.kb-fig{width:min(100%,1000px,calc((100svh - 330px) * 1.41 + 40px))}
${k.ISO_CSS}
${FIG_CSS}
`);
swap(".captions{position:absolute;inset:auto 0 max(28px,6svh);display:grid;place-items:center;pointer-events:none}", ".captions{position:relative;display:grid;place-items:center;pointer-events:none;min-height:118px;width:100%;margin-top:10px}");
swap("@media (prefers-reduced-motion:reduce){", `@media (max-width:560px){.stage{align-content:start;padding-top:84px}.stage .progress{display:none}.stage .captions{min-height:132px}}
/* static layout: reduced motion, or the scroll library failed to load */
.kb-static .explode{height:auto}
.kb-static .stage{position:relative;height:auto;padding-bottom:64px}
.kb-static .stage .captions{gap:36px;margin-top:28px;min-height:0}
.kb-static .stage .cap{grid-area:auto;opacity:1;transform:none}
.kb-static .stage .progress{display:none}
@media (prefers-reduced-motion:reduce){`);
// markup: the figure replaces the CSS-3D keyboard
cut('<div class="kb" id="kb" aria-hidden="true">', '<div class="captions">', `<div class="kb-fig iso" data-theme="dark" data-kb>${card}</div>\n    `);
// script: the figure's live code, before the page script; GSAP with SRI
swap('<script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js"></script>\n<script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/ScrollTrigger.min.js"></script>',
  `<script>(() => {\n${LIVE.replace(/<\/(script)/gi, "<\\/$1")}\n})();</script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js" integrity="${SRI.gsap}" crossorigin="anonymous"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/ScrollTrigger.min.js" integrity="${SRI.st}" crossorigin="anonymous"></script>`);
swap(`document.querySelectorAll('.l-pcb .keys, .l-plate .keys, .l-switch .keys').forEach(el => fill(el, false));
fill(document.querySelector('.l-caps .keys'), true);
`, "");
cut("/* Exploded view */", "/* Sound: synthesized switch press */", `/* Exploded view: the scroll timeline drives the Anatomy figure */
const caps = [...document.querySelectorAll('.cap')];
const ticks = [...document.querySelectorAll('.progress i')];
const kbState = { t: 0 };
const toFigure = () => window.kbExplode(kbState.t);
const stepAt = (time) => (time < .3 ? -1 : Math.min(4, Math.floor((time - .3) / .45)));

if (reduce || !(window.gsap && window.ScrollTrigger)) {
  /* static: the figure rests apart and every caption shows under it */
  document.documentElement.classList.add('kb-static');
  const hint = document.querySelector('.kb-fig [data-corner="hint"]');
  if (hint) hint.textContent = 'Six layers, apart';
  window.kbExplode(1, true);
} else {
  gsap.registerPlugin(ScrollTrigger);
  const tl = gsap.timeline({
    onUpdate() {
      const step = stepAt(this.time());
      window.kbFocus(this.time() > 2.45 ? -1 : step);
      ticks.forEach((t, i) => t.classList.toggle('on', i <= step));
    },
    scrollTrigger: { trigger: '#explode', start: 'top top', end: 'bottom bottom', scrub: true } });
  tl.to(kbState, { t: 1, duration: 1, ease: 'power2.inOut', onUpdate: toFigure }, 0);
  caps.forEach((c, i) => {
    const at = .35 + i * .45;
    tl.fromTo(c, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: .15, ease: 'power2.out' }, at);
    if (i < caps.length - 1) tl.to(c, { opacity: 0, y: -10, duration: .12, ease: 'power2.in' }, at + .28);
  });
  tl.to(kbState, { t: 0, duration: .8, ease: 'power3.inOut', onUpdate: toFigure }, 2.55);
}

`);
swap("pad.addEventListener('pointerdown', e => { if (e.target.closest('button')) press(); });", "pad.addEventListener('pointerdown', e => { const b = e.target.closest('button'); if (b) { press(); window.kbPress(b.dataset.key); } });\npad.addEventListener('click', e => { const b = e.target.closest('button'); if (b && e.detail === 0) { press(); window.kbPress(b.dataset.key); } }); /* keyboard activation of a focused pad key */");
cut("addEventListener('keydown', e => {", "\nconst toggle =", `/* physical keys by position (e.code), so any layout maps to the same keycap */
addEventListener('keydown', e => {
  if (e.repeat || e.metaKey || e.ctrlKey) return;
  const el = document.activeElement;
  if (el && el.closest('input,textarea,select,[contenteditable]')) return;
  if (el && el.closest('button') && /^(Space|Enter|NumpadEnter)$/.test(e.code)) return; /* the focused button handles it */
  if (/^(Space|Tab|Arrow|Page|Home|End)/.test(e.code)) return; /* page navigation keys scroll, they do not type */
  const id = window.kbKeyId(e.code);
  if (!id) return;
  const sec = document.getElementById('sound').getBoundingClientRect();
  const b = sec.top > innerHeight || sec.bottom < 0 ? null : pad.querySelector(\`[data-key="\${CSS.escape(id)}"]\`);
  const shown = window.kbPress(id);
  if (b) b.classList.add('down');
  if (b || shown) press();
});
addEventListener('keyup', e => { const id = window.kbKeyId(e.code); if (id) pad.querySelector(\`[data-key="\${CSS.escape(id)}"]\`)?.classList.remove('down'); });
`);
swap("movePill(toggle.querySelector('[aria-pressed=\"true\"]'));\n", "movePill(toggle.querySelector('[aria-pressed=\"true\"]'));\ndocument.fonts?.ready.then(() => movePill(toggle.querySelector('[aria-pressed=\"true\"]')));\n");
swap("res.textContent = 'Reserved. Check your email.';", "res.textContent = 'Reserved for the March batch.';");
if (/—/.test(page)) throw new Error("em dash in page");
writeFileSync(join(SPIKE, "depth-launch.html"), page);

const solids = (standalone.match(/class="iso-solid/g) || []).length;
const paths = (standalone.match(/<path/g) || []).length;
console.log(`wrote kb.html ${(standalone.length / 1024).toFixed(0)} KB and depth-launch.html ${(page.length / 1024).toFixed(0)} KB; ${KEYS.length} keys, ${solids} solids, ${paths} paths, assembled stack ${stack0} mm`);
