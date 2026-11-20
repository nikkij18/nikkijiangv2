"use client";

import { useEffect, useRef } from "react";

/*
  A 3D ASCII lily bouquet.

  Tepals, leaves and stems are triangle meshes with per-vertex color; stamens are thin
  point strands. Every frame the model is rotated, perspective-projected onto a character
  grid, rasterized with a z-buffer, and lit per triangle. Each character gets its own
  shaded color, so the result reads like a dense, full-color image made of text.
*/

type V = [number, number, number];
type RGB = [number, number, number];

const add = (a: V, b: V): V => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const sub = (a: V, b: V): V => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const mul = (a: V, s: number): V => [a[0] * s, a[1] * s, a[2] * s];
const cross = (a: V, b: V): V => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const norm = (a: V): V => {
  const l = Math.hypot(a[0], a[1], a[2]) || 1;
  return [a[0] / l, a[1] / l, a[2] / l];
};
const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);
const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const mix = (a: RGB, b: RGB, t: number): RGB => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
const deg = (d: number) => (d * Math.PI) / 180;
const mul3 = (c: RGB, k: number): RGB => [c[0] * k, c[1] * k, c[2] * k];

const RAMP = "*#%%@@";
const ASPECT = 1.6; // character cell height / width
const BLOOM_END = 6.2;
const STEM_BOTTOM = -1.0; // where the cut stems end, well below the ribbon (at y = -0.24)
const TOP = 2.4; // highest point of the bouquet
const STEM_TIME = 1.2; // seconds for a stem to grow
const BUD_TIME = 0.45; // seconds a bud takes to swell
const OPEN_TIME = 2.6; // seconds for a lily to open
// When each lily starts opening (after its bud has swelled)
// Lilies open almost as soon as their bud has formed, in a quick ripple outward
const openAt = (L: { start: number }, i: number) => 0.06 * i + STEM_TIME + BUD_TIME * 0.5 + (L.start - 1) * 0.5;

// Lily color varieties: tepal body, tip, throat, spots
type Variety = { body: RGB; tip: RGB; throat: RGB; spot: RGB; spots: number };
const V_ = {
  crimson: { body: [205, 28, 48], tip: [225, 60, 70], throat: [120, 10, 25], spot: [70, 5, 15], spots: 0.1 },
  oxblood: { body: [125, 16, 34], tip: [150, 30, 45], throat: [80, 8, 20], spot: [40, 4, 10], spots: 0.06 },
  sgDeep: { body: [196, 22, 98], tip: [252, 220, 236], throat: [220, 238, 196], spot: [120, 10, 55], spots: 0.16 },
  sgSoft: { body: [232, 88, 156], tip: [255, 232, 242], throat: [226, 242, 204], spot: [165, 35, 90], spots: 0.12 },
  stargazer: { body: [214, 40, 118], tip: [252, 218, 236], throat: [222, 238, 196], spot: [150, 20, 70], spots: 0.14 },
  blossom: { body: [244, 175, 180], tip: [253, 225, 228], throat: [235, 240, 190], spot: [200, 80, 110], spots: 0.12 },
  white: { body: [244, 238, 228], tip: [255, 252, 246], throat: [214, 228, 140], spot: [190, 120, 90], spots: 0.04 },
  yellow: { body: [246, 200, 55], tip: [252, 226, 120], throat: [235, 140, 35], spot: [140, 60, 20], spots: 0.1 },
  gold: { body: [243, 159, 43], tip: [250, 196, 100], throat: [220, 100, 30], spot: [130, 45, 15], spots: 0.12 },
  pale: { body: [251, 206, 214], tip: [255, 238, 241], throat: [242, 244, 205], spot: [214, 110, 142], spots: 0.1 },
  shell: { body: [247, 186, 198], tip: [255, 226, 232], throat: [250, 236, 210], spot: [190, 80, 115], spots: 0.12 },
  peach: { body: [240, 168, 120], tip: [250, 210, 175], throat: [235, 200, 120], spot: [170, 80, 50], spots: 0.1 },
} satisfies Record<string, Variety>;

const STEM: RGB = [96, 150, 70];
const STEM_DARK: RGB = [60, 105, 45];
const LEAF: RGB = [117, 160, 79];
const FILAMENT: RGB = [210, 225, 170];
const ANTHER: RGB = [150, 60, 25];
const BUD: RGB = [170, 200, 110];
const RIBBON: RGB = [240, 150, 192];

const RIBBON_LIGHT: RGB = [252, 214, 232];
const RIBBON_DARK: RGB = [190, 80, 135];
const RIBBON_EDGE: RGB = [120, 30, 75];

// Right-hand bow loop outline (x, y relative to the knot); mirrored for the left loop.
// The upper-outer corner is peaked so the loops read as a bow, not a pair of circles.
const BOW_OUTLINE: [number, number][] = [
  [0.02, -0.02], [0.1, -0.075], [0.2, -0.07], [0.26, 0.0], [0.28, 0.1], [0.285, 0.16],
  [0.25, 0.155], [0.16, 0.12], [0.07, 0.06],
];
const BOW_CENTER: [number, number] = [0.165, 0.05]; // middle of the loop's opening
const BOW_HOLE = 0.52; // size of the opening, as a share of the loop
function bowOutline(u: number): [number, number] {
  // closed Catmull-Rom through BOW_OUTLINE
  const n = BOW_OUTLINE.length;
  const f = (u % 1) * n;
  const i = Math.floor(f), t = f - i;
  const P = (k: number) => BOW_OUTLINE[(k + n) % n];
  const p0 = P(i - 1), p1 = P(i), p2 = P(i + 1), p3 = P(i + 2);
  const cr = (a: number, b: number, c: number, d: number) =>
    0.5 * (2 * b + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t * t + (-a + 3 * b - 3 * c + d) * t * t * t);
  return [cr(p0[0], p1[0], p2[0], p3[0]), cr(p0[1], p1[1], p2[1], p3[1])];
}

type Lily = { at: V; axis: V; len: number; start: number; spin: number; v: Variety; bud?: boolean };

const UP: V = [0, 1, 0];
function ring(n: number, y: number, r: number, lift: number, offset: number, len: number, varieties: Variety[], t0: number): Lily[] {
  return Array.from({ length: n }, (_, k) => {
    const a = deg(offset + (360 / n) * k);
    const dir: V = [Math.cos(a), 0, Math.sin(a)];
    return {
      at: [dir[0] * r, y, dir[2] * r],
      axis: norm(add(dir, mul(UP, lift))),
      len: len * (0.94 + 0.12 * ((k * 37) % 5) / 4),
      start: t0 + k * 0.17,
      spin: (k * 23) % 60,
      v: varieties[k % varieties.length],
    };
  });
}

const LILIES: Lily[] = [
  { at: [0, 1.66, 0], axis: [0.05, 1, 0.1], len: 0.64, start: 1.0, spin: 10, v: V_.pale },
  ...ring(5, 1.36, 0.52, 1.4, 10, 0.6, [V_.white, V_.stargazer, V_.crimson, V_.shell, V_.yellow], 1.2),
  ...ring(7, 0.92, 0.74, 0.25, 35, 0.6, [V_.pale, V_.oxblood, V_.blossom, V_.white, V_.gold, V_.sgSoft, V_.shell], 1.6),
  ...ring(5, 0.6, 0.56, -0.25, 70, 0.5, [V_.blossom, V_.white, V_.stargazer, V_.crimson, V_.pale], 2.2),
  // buds poking out of the dome
  { at: [-0.35, 2.0, 0.25], axis: [-0.3, 1, 0.2], len: 0.34, start: 0, spin: 0, v: V_.sgSoft, bud: true },
  { at: [0.55, 1.85, -0.3], axis: [0.5, 1, -0.3], len: 0.3, start: 0, spin: 0, v: V_.stargazer, bud: true },
  { at: [0.1, 1.9, -0.55], axis: [0.1, 1, -0.6], len: 0.3, start: 0, spin: 0, v: V_.sgSoft, bud: true },
];

const LEAVES = Array.from({ length: 14 }, (_, k) => {
  const a = deg(k * 26 + 12);
  return { y: 0.1 + (k % 3) * 0.1, dir: [Math.cos(a), 0.45 - (k % 3) * 0.12, Math.sin(a)] as V, len: 0.5 + (k % 3) * 0.1 };
});

function hash(a: number, b: number, c: number) {
  let n = (a * 374761393 + b * 668265263 + c * 1440662683) | 0;
  n = Math.imul(n ^ (n >>> 13), 1274126177);
  return ((n ^ (n >>> 16)) >>> 0) / 4294967296;
}

function basis(axis: V): [V, V] {
  const a = norm(axis);
  const ref: V = Math.abs(a[1]) > 0.9 ? [1, 0, 0] : [0, 1, 0];
  const b1 = norm(cross(a, ref));
  return [b1, cross(a, b1)];
}

const TIE_Y = -0.24; // height of the ribbon
const TIE_U = 0.4; // share of the stem below the ribbon

// Each stem runs straight up the tied bundle to the ribbon, then curves out to its flower.
function stemCurve(i: number, u: number) {
  const L = LILIES[i];
  const flat = Math.hypot(L.at[0], L.at[2]) || 1;
  const d: V = [L.at[0] / flat, 0, L.at[2] / flat];
  const p0: V = [d[0] * 0.075, STEM_BOTTOM, d[2] * 0.075]; // cut ends splay slightly
  const pt: V = [d[0] * 0.05, TIE_Y, d[2] * 0.05];
  if (u <= TIE_U) {
    const k = u / TIE_U;
    return { p: add(p0, mul(sub(pt, p0), k)), d: norm(sub(pt, p0)) };
  }
  const v = (u - TIE_U) / (1 - TIE_U);
  const p1: V = [d[0] * 0.06, Math.min(0.25, L.at[1] - 0.45), d[2] * 0.06];
  const p2 = sub(L.at, mul(norm(L.axis), 0.03));
  const m = 1 - v;
  const p = add(add(mul(pt, m * m), mul(p1, 2 * m * v)), mul(p2, v * v));
  const dd = add(mul(sub(p1, pt), 2 * m), mul(sub(p2, p1), 2 * v));
  return { p, d: norm(dd) };
}

class Builder {
  pos: number[] = [];
  col: number[] = [];
  tri: number[] = [];
  sPos: number[] = [];
  sNrm: number[] = [];
  sCol: number[] = [];

  // A (nu+1) x (ns+1) vertex grid stitched into triangles.
  surface(nu: number, ns: number, f: (u: number, s: number, ui: number, si: number) => { p: V; c: RGB }) {
    const base = this.pos.length / 3;
    for (let ui = 0; ui <= nu; ui++)
      for (let si = 0; si <= ns; si++) {
        const { p, c } = f(ui / nu, si / ns, ui, si);
        this.pos.push(p[0], p[1], p[2]);
        this.col.push(c[0], c[1], c[2]);
      }
    const w = ns + 1;
    for (let ui = 0; ui < nu; ui++)
      for (let si = 0; si < ns; si++) {
        const a = base + ui * w + si, b = a + 1, c = a + w, d = c + 1;
        this.tri.push(a, c, b, b, c, d);
      }
  }

  strand(p: V, n: V, c: RGB) {
    this.sPos.push(p[0], p[1], p[2]);
    this.sNrm.push(n[0], n[1], n[2]);
    this.sCol.push(c[0], c[1], c[2]);
  }

  done(): Model {
    return {
      pos: new Float32Array(this.pos),
      col: new Float32Array(this.col),
      tri: new Uint32Array(this.tri),
      sPos: new Float32Array(this.sPos),
      sNrm: new Float32Array(this.sNrm),
      sCol: new Float32Array(this.sCol),
    };
  }
}

type Model = {
  pos: Float32Array;
  col: Float32Array;
  tri: Uint32Array;
  sPos: Float32Array;
  sNrm: Float32Array;
  sCol: Float32Array;
};

function buildModel(t: number): Model {
  const B = new Builder();
  const grow = LILIES.map((_, i) => easeInOut(clamp((t - 0.06 * i) / STEM_TIME)));

  // Stems: thin tubes
  LILIES.forEach((_, i) => {
    const g = grow[i];
    if (g <= 0.01) return;
    B.surface(30, 5, (u, s) => {
      const { p, d } = stemCurve(i, u * g);
      const [b1, b2] = basis(d);
      const a = s * Math.PI * 2;
      const n = add(mul(b1, Math.cos(a)), mul(b2, Math.sin(a)));
      return { p: add(p, mul(n, 0.018)), c: mix(STEM, STEM_DARK, (i % 3) / 3) };
    });
  });

  // Leaves: long lances that arch out and droop from the bundle
  LEAVES.forEach((l, li) => {
    const g = easeOut(clamp((t - 0.5 - li * 0.06) / 1.1));
    if (g <= 0.01) return;
    const out = norm(l.dir);
    const base: V = [out[0] * 0.05, l.y, out[2] * 0.05];
    const side = norm(cross(out, UP));
    const len = l.len * g;
    B.surface(22, 4, (u, sv) => {
      const s = sv * 2 - 1;
      const c = add(add(base, mul(out, u * len)), [0, -0.55 * u * u * len, 0]);
      const w = 0.06 * Math.pow(Math.sin(Math.PI * Math.min(u, 0.97)), 0.7) + 0.002;
      const dir = norm(add(out, [0, -1.1 * u, 0]));
      const n = norm(cross(dir, side));
      return {
        p: add(add(c, mul(side, s * w)), mul(n, -s * s * w * 0.5)),
        c: mix(LEAF, STEM_DARK, Math.abs(s) * 0.6),
      };
    });
  });

  // Ribbon tied around the stem bundle: band, bow loops, and two tails
  const tie = easeOut(clamp((t - 1.0) / 1.0));
  if (tie > 0.01) {
    const Y = TIE_Y;
    B.surface(3, 48, (u, sv) => {
      const th = sv * Math.PI * 2;
      const r = 0.1;
      return { p: [Math.cos(th) * r, Y - 0.05 + u * 0.1, Math.sin(th) * r], c: RIBBON };
    });
    // Knot
    B.surface(6, 16, (u, sv) => {
      const th = sv * Math.PI * 2;
      const r = u * tie;
      return {
        p: [Math.cos(th) * 0.06 * r, Y + 0.01 + Math.sin(th) * 0.065 * r, 0.2 + 0.03 * (1 - u)],
        c: u > 0.8 ? RIBBON_EDGE : mix(RIBBON_DARK, RIBBON, 0.4),
      };
    });
    for (const sgn of [-1, 1]) {
      // Loop: a hollow band of ribbon with crisp inner and outer edges and a peaked upper-outer corner
      const c = BOW_CENTER;
      B.surface(BOW_OUTLINE.length * 5, 6, (u, sv) => {
        const o = bowOutline(u);
        const k = lerp(BOW_HOLE, 1, sv); // sv = 0 is the inside edge of the loop, 1 the outside
        const x = (c[0] + (o[0] - c[0]) * k) * tie, y = (c[1] + (o[1] - c[1]) * k) * tie;
        const fold = Math.max(0, 1 - Math.hypot(x, y) / 0.09); // shadow where it gathers into the knot
        let col = mix(RIBBON, RIBBON_LIGHT, clamp(y / 0.16) * 0.55);
        col = mix(col, RIBBON_DARK, fold * 0.7);
        if (sv > 0.8) col = RIBBON_EDGE; // outer edge
        else if (sv < 0.2) col = mix(RIBBON_EDGE, RIBBON_DARK, 0.3); // inner edge, in the loop's shadow
        return { p: [sgn * x, Y + y, 0.125 + 0.02 * Math.sin(Math.PI * sv) - 0.03 * (x / 0.27)], c: col };
      });
      // Tail: flat, facing out, with a V-notched end
      B.surface(14, 4, (u, sv) => {
        const uu = u * tie;
        const s2 = sv * 2 - 1;
        const notch = u > 0.85 ? (1 - Math.abs(s2)) * 0.05 * ((u - 0.85) / 0.15) : 0;
        const x = sgn * (0.03 + 0.11 * uu) + s2 * 0.05;
        const y = Y - 0.04 - 0.3 * uu + notch;
        const z = 0.125 + 0.03 * Math.sin(uu * 5);
        return { p: [x, y, z], c: Math.abs(s2) > 0.75 ? RIBBON_EDGE : mix(RIBBON, RIBBON_DARK, uu * 0.45) };
      });
    }
  }

  // Lilies
  LILIES.forEach((L, i) => {
    if (grow[i] < 0.98) return;
    const A = norm(L.axis);
    const [B1, B2] = basis(A);
    // Bud stage: a closed green bud swells and blushes, then the tepals open
    const swell = easeInOut(clamp((t - (0.06 * i + STEM_TIME)) / BUD_TIME));
    const b = L.bud ? 0 : easeOut(clamp((t - openAt(L, i)) / OPEN_TIME)); // fast start: little time spent closed
    const green = L.bud ? 1 : 1 - clamp(b / 0.22); // how bud-like the coloring still is
    const v = L.v;

    // Opening: tepals flare from the throat, then curve back at the tips
    const a0 = lerp(3, 30, b);
    const a1 = lerp(6, 100, b);
    const len = L.len * (b > 0 ? lerp(0.55, 1, b) : lerp(0.22, L.bud ? 0.7 : 0.55, swell));

    for (let k = 0; k < 6; k++) {
      const petal = k % 2 === 1; // three broad petals, three narrow sepals
      const phi = deg(L.spin + k * 60);
      const R = add(mul(B1, Math.cos(phi)), mul(B2, Math.sin(phi)));
      const T = add(mul(B1, -Math.sin(phi)), mul(B2, Math.cos(phi)));
      const tl = len * (petal ? 0.96 : 1.03);
      const tw = L.len * (b > 0 ? lerp(0.1, petal ? 0.36 : 0.27, b) : lerp(0.05, 0.1, swell));
      const NU = 26;

      // Integrate the curved centerline once, then sweep across it
      const center: V[] = [];
      const dirs: V[] = [];
      let c: V = add(L.at, mul(R, 0.025));
      for (let ui = 0; ui <= NU; ui++) {
        const u = ui / NU;
        const alpha = deg(a0 + (a1 - a0) * Math.pow(u, 1.8));
        const d = norm(add(mul(A, Math.cos(alpha)), mul(R, Math.sin(alpha))));
        if (ui > 0) c = add(c, mul(d, tl / NU));
        center.push(c);
        dirs.push(d);
      }

      B.surface(NU, 8, (u, sv, ui, si) => {
        const s = sv * 2 - 1;
        const as = Math.abs(s);
        const d = dirs[ui];
        const n = norm(cross(d, T));
        // club-shaped bud (widest near the top) relaxing into a tapered tepal
        const budShape = Math.pow(Math.sin(Math.PI * Math.min(Math.pow(u, 1.45), 0.985)), 0.55);
        // open tepal: narrow claw, widest ~40% out, then a long straight taper to a sharp point
        const openShape = u < 0.4 ? 0.3 + 0.7 * Math.sin((Math.PI / 2) * (u / 0.4)) : Math.pow((1 - u) / 0.6, 0.85);
        const w = tw * lerp(budShape, openShape, b) + 0.002;
        const ruffle = as > 0.55 ? Math.sin(u * 24 + k * 2) * (petal ? 0.022 : 0.012) * b * as : 0;
        const keel = (1 - as) * 0.02; // raised midrib, cupped sides
        const p = add(add(center[ui], mul(T, s * w)), mul(n, -s * s * w * 0.45 + ruffle + keel));

        // open coloring
        let col: RGB = mix(v.throat, v.body, clamp((u - 0.04) / 0.3));
        col = mix(col, v.tip, clamp((u - 0.6) / 0.4) * 0.65);
        // deepest color down the center, fading to a pale edge (like a Stargazer)
        if (as < 0.38 && u > 0.1 && u < 0.85) col = mix(col, mul3(v.body, 0.85), (1 - as / 0.38) * 0.6 * clamp((u - 0.1) * 4));
        if (as > 0.38) col = mix(col, v.tip, Math.pow((as - 0.38) / 0.62, 0.8) * 0.92);
        if (u > 0.72) col = mix(col, v.tip, ((u - 0.72) / 0.28) * 0.6); // pale tips
        if (as > 0.95) col = mix(col, [40, 12, 30], 0.35); // thin outline separates overlapping tepals
        if (green < 0.5 && u > 0.12 && u < 0.6 && as < 0.8 && hash(i * 7 + k, ui, si) < v.spots * 2.2 * (1.1 - u)) col = v.spot;
        // bud coloring: green at the base, blushing toward the flower color as it swells
        if (green > 0) {
          let budCol = mix(BUD, v.body, clamp((u - 0.25) * 1.5) * (0.25 + 0.6 * swell));
          if (as > 0.85) budCol = mix(budCol, STEM_DARK, 0.5); // seams between closed tepals
          col = mix(col, budCol, green);
        }
        return { p, c: col };
      });
    }

    // Stamens and pistil
    const st = clamp((b - 0.55) / 0.45);
    if (!L.bud && st > 0) {
      for (let k = 0; k < 7; k++) {
        const pistil = k === 6;
        const phi = deg(L.spin + 30 + k * 60);
        const R = add(mul(B1, Math.cos(phi)), mul(B2, Math.sin(phi)));
        const fl = L.len * (pistil ? 0.85 : 0.75) * st;
        let c: V = L.at;
        for (let ui = 1; ui <= 40; ui++) {
          const u = ui / 40;
          const d = norm(add(A, mul(R, pistil ? 0.04 : 0.15 + 0.6 * u * u)));
          c = add(c, mul(d, fl / 40));
          B.strand(c, R, FILAMENT);
        }
        if (st > 0.75) {
          const T = cross(A, R);
          for (let a = -5; a <= 5; a++)
            for (let h = 0; h < 3; h++) B.strand(add(add(c, mul(T, a * 0.005)), mul(A, h * 0.006)), R, pistil ? BUD : ANTHER);
        }
      }
    }
  });

  return B.done();
}

// Widest horizontal reach of the full bouquet from its spin axis, in model units.
// The bouquet only spins about the vertical axis, so this bounds its silhouette at every angle.
let reachCache = 0;
function bouquetReach() {
  if (reachCache) return reachCache;
  const m = buildModel(BLOOM_END);
  for (const arr of [m.pos, m.sPos])
    for (let i = 0; i < arr.length; i += 3) reachCache = Math.max(reachCache, Math.hypot(arr[i], arr[i + 2]));
  return reachCache;
}

export default function Bouquet3D({
  className,
  onReach,
}: {
  className?: string;
  /** Called with the bouquet's widest half-width in CSS pixels, whenever the canvas is laid out. */
  onReach?: (px: number) => void;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  const onReachRef = useRef(onReach);
  useEffect(() => {
    onReachRef.current = onReach;
  });

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let cols = 0, rows = 0, cw = 0, ch = 0, font = 0, S = 0, cx = 0, cy = 0, W = 0, H = 0;
    let zbuf = new Float32Array(0);
    let glyph = new Uint8Array(0);
    let rgb = new Uint8Array(0);
    let filled = new Uint8Array(0);
    let sx = new Float32Array(0), sy = new Float32Array(0), sz = new Float32Array(0);
    let cxs = new Float32Array(0), cys = new Float32Array(0), czs = new Float32Array(0);
    let raf = 0;
    let start = 0;
    let cached: Model | null = null;
    const light = norm([-0.45, 0.6, 0.8]);
    const styleCache = new Map<number, string>();

    function layout() {
      const rect = canvas!.getBoundingClientRect();
      W = rect.width;
      H = rect.height;
      const dpr = window.devicePixelRatio || 1;
      canvas!.width = Math.round(W * dpr);
      canvas!.height = Math.round(H * dpr);
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
      cw = Math.max(3.4, Math.min(4.6, W / 175));
      ch = cw * ASPECT;
      font = cw / 0.56;
      cols = Math.floor(W / cw);
      rows = Math.floor(H / ch);
      // Bouquet spans about x ±1.4 and y STEM_BOTTOM..TOP
      S = Math.min(cols / 2.75, (rows * ASPECT) / (TOP - STEM_BOTTOM + 0.05));
      cx = cols / 2;
      cy = rows / 2;
      zbuf = new Float32Array(cols * rows);
      glyph = new Uint8Array(cols * rows);
      rgb = new Uint8Array(cols * rows * 3);
      filled = new Uint8Array(cols * rows);
      onReachRef.current?.(bouquetReach() * S * cw);
    }

    function shade(idx: number, z: number, ndl: number, r: number, g: number, b: number) {
      const depth = clamp((z + 1.5) / 2.2, 0.62, 1);
      const l = (0.4 + 0.85 * ndl) * depth;
      const spec = Math.pow(ndl, 12) * 0.3;
      rgb[idx * 3] = Math.min(255, r * l + 255 * spec);
      rgb[idx * 3 + 1] = Math.min(255, g * l + 255 * spec);
      rgb[idx * 3 + 2] = Math.min(255, b * l + 255 * spec);
      glyph[idx] = Math.min(RAMP.length - 1, (clamp((l - 0.3) / 0.9) * RAMP.length) | 0);
      filled[idx] = 1;
    }

    function render(t: number, angle: number, tiltDeg: number) {
      const m = t >= BLOOM_END ? (cached ??= buildModel(BLOOM_END)) : buildModel(t);
      zbuf.fill(-1e9);
      filled.fill(0);

      const cosA = Math.cos(angle), sinA = Math.sin(angle);
      const tilt = deg(tiltDeg);
      const cosT = Math.cos(tilt), sinT = Math.sin(tilt);
      const D = 6;
      const yc = (TOP + STEM_BOTTOM) / 2;

      // Transform vertices: camera space (cxs, cys, czs) and screen (sx, sy, sz)
      const nv = m.pos.length / 3;
      if (sx.length < nv) {
        sx = new Float32Array(nv); sy = new Float32Array(nv); sz = new Float32Array(nv);
        cxs = new Float32Array(nv); cys = new Float32Array(nv); czs = new Float32Array(nv);
      }
      for (let i = 0; i < nv; i++) {
        const j = i * 3;
        const x1 = m.pos[j] * cosA + m.pos[j + 2] * sinA;
        const z1 = -m.pos[j] * sinA + m.pos[j + 2] * cosA;
        const y1 = m.pos[j + 1] - yc;
        const y2 = y1 * cosT - z1 * sinT;
        const z2 = y1 * sinT + z1 * cosT;
        cxs[i] = x1; cys[i] = y2; czs[i] = z2;
        const f = D / (D - z2);
        sx[i] = cx + x1 * f * S;
        sy[i] = cy - (y2 * f * S) / ASPECT;
        sz[i] = z2;
      }

      // Rasterize triangles
      const tri = m.tri, col = m.col;
      for (let k = 0; k < tri.length; k += 3) {
        const a = tri[k], b = tri[k + 1], c = tri[k + 2];
        const ax = sx[a], ay = sy[a], bx = sx[b], by = sy[b], qx = sx[c], qy = sy[c];
        const area = (bx - ax) * (qy - ay) - (by - ay) * (qx - ax);
        if (Math.abs(area) < 1e-6) continue;
        const minX = Math.max(0, Math.floor(Math.min(ax, bx, qx)));
        const maxX = Math.min(cols - 1, Math.ceil(Math.max(ax, bx, qx)));
        const minY = Math.max(0, Math.floor(Math.min(ay, by, qy)));
        const maxY = Math.min(rows - 1, Math.ceil(Math.max(ay, by, qy)));
        if (minX > maxX || minY > maxY) continue;

        // flat normal in camera space, two-sided
        const ux = cxs[b] - cxs[a], uy = cys[b] - cys[a], uz = czs[b] - czs[a];
        const vx = cxs[c] - cxs[a], vy = cys[c] - cys[a], vz = czs[c] - czs[a];
        let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
        const nl = Math.hypot(nx, ny, nz) || 1;
        nx /= nl; ny /= nl; nz /= nl;
        const ndl = Math.abs(nx * light[0] + ny * light[1] + nz * light[2]);

        const inv = 1 / area;
        for (let r = minY; r <= maxY; r++) {
          const py = r + 0.5;
          for (let q = minX; q <= maxX; q++) {
            const px = q + 0.5;
            const w0 = ((bx - px) * (qy - py) - (by - py) * (qx - px)) * inv;
            const w1 = ((qx - px) * (ay - py) - (qy - py) * (ax - px)) * inv;
            const w2 = 1 - w0 - w1;
            if (w0 < 0 || w1 < 0 || w2 < 0) continue;
            const z = w0 * sz[a] + w1 * sz[b] + w2 * sz[c];
            const idx = r * cols + q;
            if (z <= zbuf[idx]) continue;
            zbuf[idx] = z;
            const R = w0 * col[a * 3] + w1 * col[b * 3] + w2 * col[c * 3];
            const G = w0 * col[a * 3 + 1] + w1 * col[b * 3 + 1] + w2 * col[c * 3 + 1];
            const Bc = w0 * col[a * 3 + 2] + w1 * col[b * 3 + 2] + w2 * col[c * 3 + 2];
            shade(idx, z, ndl, R, G, Bc);
          }
        }
      }

      // Strands (stamens, anthers)
      const sp = m.sPos, sn = m.sNrm, sc = m.sCol;
      for (let i = 0; i < sp.length; i += 3) {
        const x1 = sp[i] * cosA + sp[i + 2] * sinA;
        const z1 = -sp[i] * sinA + sp[i + 2] * cosA;
        const y1 = sp[i + 1] - yc;
        const y2 = y1 * cosT - z1 * sinT;
        const z2 = y1 * sinT + z1 * cosT + 0.01;
        const f = D / (D - z2);
        const q = (cx + x1 * f * S) | 0;
        const r = (cy - (y2 * f * S) / ASPECT) | 0;
        if (q < 0 || r < 0 || q >= cols || r >= rows) continue;
        const idx = r * cols + q;
        if (z2 <= zbuf[idx]) continue;
        zbuf[idx] = z2;
        const nx = sn[i] * cosA + sn[i + 2] * sinA;
        const nz1 = -sn[i] * sinA + sn[i + 2] * cosA;
        const ny = sn[i + 1] * cosT - nz1 * sinT;
        const nz = sn[i + 1] * sinT + nz1 * cosT;
        shade(idx, z2, 0.4 + 0.6 * Math.abs(nx * light[0] + ny * light[1] + nz * light[2]), sc[i], sc[i + 1], sc[i + 2]);
      }

      ctx!.clearRect(0, 0, W, H);
      // Opaque backing behind every drawn cell, so the bouquet hides what's behind it (the name)
      ctx!.fillStyle = "#000";
      for (let idx = 0; idx < filled.length; idx++) {
        if (!filled[idx]) continue;
        const q = idx % cols, row = (idx / cols) | 0;
        let run = 1;
        while (q + run < cols && filled[idx + run]) run++;
        ctx!.fillRect(q * cw - 0.5, row * ch - 0.5, run * cw + 1, ch + 1);
        idx += run - 1;
      }
      ctx!.font = `bold ${font}px ui-monospace, "SF Mono", Menlo, Consolas, monospace`;
      ctx!.textAlign = "center";
      ctx!.textBaseline = "middle";
      let last = -1;
      for (let idx = 0; idx < filled.length; idx++) {
        if (!filled[idx]) continue;
        const r = rgb[idx * 3] & 0xf8, g = rgb[idx * 3 + 1] & 0xf8, b = rgb[idx * 3 + 2] & 0xf8;
        const key = (r << 16) | (g << 8) | b;
        if (key !== last) {
          let st = styleCache.get(key);
          if (!st) {
            st = `rgb(${r},${g},${b})`;
            styleCache.set(key, st);
          }
          ctx!.fillStyle = st;
          last = key;
        }
        const q = idx % cols, row = (idx / cols) | 0;
        ctx!.fillText(RAMP[glyph[idx]], (q + 0.5) * cw, (row + 0.5) * ch);
      }
    }

    // Rotation: spins on its own, and can be grabbed and turned (with momentum) or tilted.
    const BASE_TILT = -18;
    const autoVel = reduce ? 0 : 0.12; // rad/s
    let angle = 0.3, vel = autoVel, tilt = BASE_TILT;
    let dragging = false, lastX = 0, lastY = 0, lastMove = 0;
    let prev = 0;

    function frame(now: number) {
      if (!start) start = prev = now;
      const dt = Math.min(0.05, (now - prev) / 1000);
      prev = now;
      const t = reduce ? BLOOM_END : (now - start) / 1000;
      if (!dragging) {
        angle += vel * dt;
        vel += (autoVel - vel) * (1 - Math.exp(-dt * 1.6)); // momentum eases back to the idle spin
        tilt += (BASE_TILT - tilt) * (1 - Math.exp(-dt * 3)); // tilt springs back
      }
      render(t, angle, tilt);
      raf = requestAnimationFrame(frame);
    }

    const onDown = (e: PointerEvent) => {
      dragging = true;
      lastX = e.clientX;
      lastY = e.clientY;
      lastMove = performance.now();
      vel = 0;
      canvas.setPointerCapture(e.pointerId);
      canvas.classList.add("is-grabbing");
    };
    const onMove = (e: PointerEvent) => {
      if (!dragging) return;
      const now = performance.now();
      const dt = Math.max(0.008, (now - lastMove) / 1000);
      const da = (e.clientX - lastX) * 0.012;
      angle += da;
      vel = vel * 0.5 + (da / dt) * 0.5;
      tilt = clamp(tilt - (e.clientY - lastY) * 0.25, -60, 25);
      lastX = e.clientX;
      lastY = e.clientY;
      lastMove = now;
    };
    const onUp = (e: PointerEvent) => {
      if (!dragging) return;
      dragging = false;
      if (performance.now() - lastMove > 80) vel = 0; // released after holding still: no fling
      vel = clamp(vel, -9, 9);
      canvas.releasePointerCapture?.(e.pointerId);
      canvas.classList.remove("is-grabbing");
    };
    canvas.addEventListener("pointerdown", onDown);
    canvas.addEventListener("pointermove", onMove);
    canvas.addEventListener("pointerup", onUp);
    canvas.addEventListener("pointercancel", onUp);

    layout();
    raf = requestAnimationFrame(frame);

    const ro = new ResizeObserver(() => layout());
    ro.observe(canvas);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      canvas.removeEventListener("pointerdown", onDown);
      canvas.removeEventListener("pointermove", onMove);
      canvas.removeEventListener("pointerup", onUp);
      canvas.removeEventListener("pointercancel", onUp);
    };
  }, []);

  return <canvas ref={ref} className={className} aria-hidden="true" />;
}
