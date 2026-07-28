// generate-graphs.js
// Generates 6 SVG physics graphs for the SHM Energy Interchange worksheet.
// Reads index.html.template, replaces placeholders with inline SVGs.
// Usage: node energy-shm-worksheet/generate-graphs.js

const fs = require('fs');
const path = require('path');

// ============================================================
// SVG Layout constants
// ============================================================
const W = 620;
const H = 400;
const ML = 70, MR = 30, MT = 40, MB = 55;
const PX = ML, PY = MT;
const PW = W - ML - MR;
const PH = H - MT - MB;

// ============================================================
// Coordinate mapping
// ============================================================
function sx(val, x0, x1) { return PX + (val - x0) / (x1 - x0) * PW; }
function sy(val, y0, y1) { return PY + PH - (val - y0) / (y1 - y0) * PH; }

// ============================================================
// Path generation from data array
// ============================================================
function genPath(data, x0, x1, y0, y1) {
  if (!data || data.length < 2) return '';
  return data.map((p, i) => {
    const x = sx(p[0], x0, x1);
    const y = sy(p[1], y0, y1);
    return (i === 0 ? 'M' : 'L') + x.toFixed(1) + ',' + y.toFixed(1);
  }).join(' ');
}

// ============================================================
// SVG helpers
// ============================================================
function arrowHead(id, color) {
  return '<marker id="' + id + '" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto"><path d="M0,0 L8,3 L0,6 Z" fill="' + color + '"/></marker>';
}

function line(x1, y1, x2, y2, stroke, width, dash) {
  let s = '<line x1="' + x1.toFixed(1) + '" y1="' + y1.toFixed(1) + '" x2="' + x2.toFixed(1) + '" y2="' + y2.toFixed(1) + '" stroke="' + stroke + '" stroke-width="' + width + '"';
  if (dash) s += ' stroke-dasharray="' + dash + '"';
  s += '/>';
  return s;
}

function textEl(x, y, txt, size, anchor, color, weight) {
  let s = '<text x="' + x.toFixed(1) + '" y="' + y.toFixed(1) + '" font-size="' + size + '"';
  if (anchor) s += ' text-anchor="' + anchor + '"';
  if (color) s += ' fill="' + color + '"';
  if (weight) s += ' font-weight="' + weight + '"';
  s += ' font-family="Segoe UI, Helvetica Neue, Arial, sans-serif">' + txt + '</text>';
  return s;
}

// ============================================================
// Axes drawing
// ============================================================
function drawAxes(x0, x1, y0, y1, xStep, yStep, xUnit, yUnit, title) {
  const parts = [];
  const zeroX = (x0 <= 0 && x1 >= 0) ? sx(0, x0, x1) : PX;
  const zeroY = (y0 <= 0 && y1 >= 0) ? sy(0, y0, y1) : PY + PH;

  // Grid lines (light)
  for (let v = Math.ceil(x0 / xStep) * xStep; v <= x1; v += xStep) {
    if (Math.abs(v) < 1e-10) continue;
    parts.push(line(sx(v, x0, x1), PY, sx(v, x0, x1), PY + PH, '#e0e0e0', 0.5));
  }
  for (let v = Math.ceil(y0 / yStep) * yStep; v <= y1; v += yStep) {
    if (Math.abs(v) < 1e-10) continue;
    parts.push(line(PX, sy(v, y0, y1), PX + PW, sy(v, y0, y1), '#e0e0e0', 0.5));
  }

  // Axes (with arrows)
  parts.push(line(PX, zeroY, PX + PW, zeroY, '#333', 1.5, null));  // x-axis
  parts.push(line(zeroX, PY, zeroX, PY + PH, '#333', 1.5, null));  // y-axis

  // X ticks
  for (let v = Math.ceil(x0 / xStep) * xStep; v <= x1; v += xStep) {
    const xp = sx(v, x0, x1);
    if (xp < PX || xp > PX + PW) continue;
    parts.push(line(xp, zeroY - 4, xp, zeroY + 4, '#333', 1));
    const label = Math.abs(v) < 1e-10 ? 'O' : (Number.isInteger(v) ? v.toString() : v.toFixed(1));
    parts.push(textEl(xp, zeroY + 18, label, 11, 'center', '#333'));
  }

  // Y ticks
  for (let v = Math.ceil(y0 / yStep) * yStep; v <= y1; v += yStep) {
    if (Math.abs(v) < 1e-10) continue;
    const yp = sy(v, y0, y1);
    if (yp < PY || yp > PY + PH) continue;
    parts.push(line(zeroX - 4, yp, zeroX + 4, yp, '#333', 1));
    const label = Number.isInteger(v) ? v.toString() : v.toFixed(1);
    parts.push(textEl(zeroX - 10, yp + 4, label, 11, 'end', '#333'));
  }

  // Axis labels
  parts.push(textEl(PX + PW / 2, PY + PH + 40, xUnit + ' ' + (xUnit ? '' : ''), 12, 'center', '#333', 'bold'));
  parts.push(textEl(ML - 8, PY + PH / 2, yUnit, 12, 'center', '#333', 'bold'));

  return parts.join('\n');
}

// ============================================================
// Graph 1: Energy vs Displacement
// ============================================================
function graphEnergyDisplacement() {
  const X0 = -6, X1 = 6, Y0 = -3, Y1 = 28;
  const xStep = 2, yStep = 5;

  // Data: Ep = x^2, Ek = 25 - x^2, Etot = 25 (when k=2, x0=5, so Emax=25)
  const n = 100;
  const epData = [], ekData = [];
  for (let i = 0; i <= n; i++) {
    const x = -5 + 10 * i / n;
    epData.push([x, x * x]);
    ekData.push([x, 25 - x * x]);
  }
  const etotData = [[-5, 25], [5, 25]];

  const epPath = genPath(epData, X0, X1, Y0, Y1);
  const ekPath = genPath(ekData, X0, X1, Y0, Y1);
  const etotPath = genPath(etotData, X0, X1, Y0, Y1);

  let svg = '<svg viewBox="0 0 ' + W + ' ' + H + '" xmlns="http://www.w3.org/2000/svg" style="font-family:Segoe UI,Helvetica Neue,Arial,sans-serif">\n';
  svg += '<rect width="' + W + '" height="' + H + '" fill="#fff" rx="4"/>\n';
  svg += '<!-- Graph 1: Energy vs Displacement -->\n';
  svg += '<defs>' + arrowHead('arr1', '#333') + '</defs>\n';
  svg += drawAxes(X0, X1, Y0, Y1, xStep, yStep, 'displacement / cm', 'energy / mJ', 'Energy vs Displacement');
  svg += '<!-- Ep curve -->\n';
  svg += '<path d="' + epPath + '" fill="none" stroke="#1a7a3a" stroke-width="2.5"/>\n';
  svg += '<!-- Ek curve -->\n';
  svg += '<path d="' + ekPath + '" fill="none" stroke="#c44536" stroke-width="2.5"/>\n';
  svg += '<!-- Etot curve -->\n';
  svg += '<path d="' + etotPath + '" fill="none" stroke="#2b6f9e" stroke-width="2" stroke-dasharray="6,3"/>\n';

  // Legend
  const lx = PX + 15, ly = PY + 18;
  svg += '<rect x="' + lx + '" y="' + (ly - 12) + '" width="160" height="64" fill="rgba(255,255,255,0.92)" stroke="#bbb" rx="3"/>\n';
  svg += line(lx + 8, ly, lx + 38, ly, '#1a7a3a', 2.5);
  svg += textEl(lx + 44, ly + 4, 'E_p = \u00BDkx\u00B2', 11, 'start', '#333');
  svg += line(lx + 8, ly + 20, lx + 38, ly + 20, '#c44536', 2.5);
  svg += textEl(lx + 44, ly + 24, 'E_k = \u00BDk(x\u2080\u00B2 \u2212 x\u00B2)', 11, 'start', '#333');
  svg += line(lx + 8, ly + 40, lx + 38, ly + 40, '#2b6f9e', 2);
  svg += '<line x1="' + (lx + 8) + '" y1="' + (ly + 40) + '" x2="' + (lx + 38) + '" y2="' + (ly + 40) + '" stroke="#2b6f9e" stroke-width="2" stroke-dasharray="6,3"/>\n';
  svg += textEl(lx + 44, ly + 44, 'E_total (constant)', 11, 'start', '#333');

  // Annotations: x0, -x0
  const x0px = sx(5, X0, X1);
  const nx0px = sx(-5, X0, X1);
  svg += line(x0px, sy(0, Y0, Y1), x0px, sy(25, Y0, Y1), '#999', 0.8, '3,2');
  svg += line(nx0px, sy(0, Y0, Y1), nx0px, sy(25, Y0, Y1), '#999', 0.8, '3,2');
  svg += textEl(x0px, sy(0, Y0, Y1) + 32, '+x\u2080', 11, 'center', '#666');
  svg += textEl(nx0px, sy(0, Y0, Y1) + 32, '\u2212x\u2080', 11, 'center', '#666');

  svg += '</svg>\n';
  return svg;
}

// ============================================================
// Graph 2: Energy vs Time
// ============================================================
function graphEnergyTime() {
  const X0 = -0.3, X1 = 3.5, Y0 = -3, Y1 = 28;
  const xStep = 0.5, yStep = 5;

  // Ep(t) = 25*sin^2(2t), Ek(t) = 25*cos^2(2t), T = pi = 3.14
  const n = 120;
  const epData = [], ekData = [];
  for (let i = 0; i <= n; i++) {
    const t = 3.2 * i / n;
    const s = Math.sin(2 * t);
    const c = Math.cos(2 * t);
    epData.push([t, 25 * s * s]);
    ekData.push([t, 25 * c * c]);
  }

  const epPath = genPath(epData, X0, X1, Y0, Y1);
  const ekPath = genPath(ekData, X0, X1, Y0, Y1);

  let svg = '<svg viewBox="0 0 ' + W + ' ' + H + '" xmlns="http://www.w3.org/2000/svg" style="font-family:Segoe UI,Helvetica Neue,Arial,sans-serif">\n';
  svg += '<rect width="' + W + '" height="' + H + '" fill="#fff" rx="4"/>\n';
  svg += '<!-- Graph 2: Energy vs Time -->\n';
  svg += '<defs>' + arrowHead('arr2', '#333') + '</defs>\n';
  svg += drawAxes(X0, X1, Y0, Y1, xStep, yStep, 'time / s', 'energy / mJ', 'Energy vs Time');
  svg += '<path d="' + epPath + '" fill="none" stroke="#1a7a3a" stroke-width="2.5"/>\n';
  svg += '<path d="' + ekPath + '" fill="none" stroke="#c44536" stroke-width="2.5"/>\n';

  // Legend
  const lx = PX + 15, ly = PY + 18;
  svg += '<rect x="' + lx + '" y="' + (ly - 12) + '" width="160" height="44" fill="rgba(255,255,255,0.92)" stroke="#bbb" rx="3"/>\n';
  svg += line(lx + 8, ly, lx + 38, ly, '#1a7a3a', 2.5);
  svg += textEl(lx + 44, ly + 4, 'E_p = \u00BDkx\u2080\u00B2 sin\u00B2(\u03C9t)', 11, 'start', '#333');
  svg += line(lx + 8, ly + 20, lx + 38, ly + 20, '#c44536', 2.5);
  svg += textEl(lx + 44, ly + 24, 'E_k = \u00BDkx\u2080\u00B2 cos\u00B2(\u03C9t)', 11, 'start', '#333');

  // Annotations: T/4, T/2
  const t4 = sx(0.785, X0, X1), t2 = sx(1.57, X0, X1);
  svg += line(t4, PY, t4, PY + PH, '#999', 0.8, '3,2');
  svg += line(t2, PY, t2, PY + PH, '#999', 0.8, '3,2');
  svg += textEl(t4, PY + PH + 18, 'T/4', 10, 'center', '#666');
  svg += textEl(t2, PY + PH + 18, 'T/2', 10, 'center', '#666');

  svg += '</svg>\n';
  return svg;
}

// ============================================================
// Graph 3: Velocity vs Displacement (ellipse)
// ============================================================
function graphVelocityDisplacement() {
  const X0 = -6, X1 = 6, Y0 = -12, Y1 = 12;
  const xStep = 2, yStep = 4;

  // v = +/- omega * sqrt(x0^2 - x^2), omega=2, x0=5
  const n = 80;
  const upper = [], lower = [];
  for (let i = 0; i <= n; i++) {
    const x = -5 + 10 * i / n;
    const v = 2 * Math.sqrt(25 - x * x);
    upper.push([x, v]);
  }
  for (let i = 0; i <= n; i++) {
    const x = 5 - 10 * i / n;
    const v = -2 * Math.sqrt(25 - x * x);
    lower.push([x, v]);
  }

  const upPath = genPath(upper, X0, X1, Y0, Y1);
  const lowPath = genPath(lower, X0, X1, Y0, Y1);

  let svg = '<svg viewBox="0 0 ' + W + ' ' + H + '" xmlns="http://www.w3.org/2000/svg" style="font-family:Segoe UI,Helvetica Neue,Arial,sans-serif">\n';
  svg += '<rect width="' + W + '" height="' + H + '" fill="#fff" rx="4"/>\n';
  svg += '<!-- Graph 3: Velocity vs Displacement -->\n';
  svg += '<defs>' + arrowHead('arr3', '#333') + '</defs>\n';
  svg += drawAxes(X0, X1, Y0, Y1, xStep, yStep, 'displacement / cm', 'velocity / cm s\u207B\u00B9', 'Velocity vs Displacement');
  svg += '<path d="' + upPath + '" fill="none" stroke="#2b6f9e" stroke-width="2.5"/>\n';
  svg += '<path d="' + lowPath + '" fill="none" stroke="#2b6f9e" stroke-width="2.5"/>\n';

  // Direction arrows on ellipse
  const ax1 = sx(0, X0, X1), ay1 = sy(10, Y0, Y1);
  const ax2 = sx(3, X0, X1), ay2 = sy(8, Y0, Y1);
  svg += '<polygon points="' + (ax1-5) + ',' + (ay1-2) + ' ' + ax1 + ',' + (ay1-8) + ' ' + (ax1+5) + ',' + (ay1-2) + '" fill="#2b6f9e"/>\n';
  svg += '<polygon points="' + (ax2-2) + ',' + (ay2-5) + ' ' + (ax2-8) + ',' + ay2 + ' ' + (ax2-2) + ',' + (ay2+5) + '" fill="#c44536"/>\n';

  // Legend
  const lx = PX + 15, ly = PY + 18;
  svg += '<rect x="' + lx + '" y="' + (ly - 12) + '" width="170" height="44" fill="rgba(255,255,255,0.92)" stroke="#bbb" rx="3"/>\n';
  svg += line(lx + 8, ly, lx + 38, ly, '#2b6f9e', 2.5);
  svg += textEl(lx + 44, ly + 4, 'v = +\u03C9\u221A(x\u2080\u00B2 \u2212 x\u00B2)', 11, 'start', '#333');
  svg += line(lx + 8, ly + 20, lx + 38, ly + 20, '#c44536', 2.5);
  svg += textEl(lx + 44, ly + 24, 'v = \u2212\u03C9\u221A(x\u2080\u00B2 \u2212 x\u00B2)', 11, 'start', '#333');

  // Annotations
  const x0px = sx(5, X0, X1), nx0px = sx(-5, X0, X1);
  svg += textEl(x0px, sy(0, Y0, Y1) + 28, '+x\u2080', 11, 'center', '#666');
  svg += textEl(nx0px, sy(0, Y0, Y1) + 28, '\u2212x\u2080', 11, 'center', '#666');
  svg += textEl(sx(0, X0, X1), sy(10, Y0, Y1) - 10, '+\u03C9x\u2080', 11, 'center', '#666');
  svg += textEl(sx(0, X0, X1), sy(-10, Y0, Y1) + 18, '\u2212\u03C9x\u2080', 11, 'center', '#666');

  svg += '</svg>\n';
  return svg;
}

// ============================================================
// Graph 4: Damped Energy Envelope
// ============================================================
function graphDampedEnergy() {
  const X0 = -0.3, X1 = 10, Y0 = -3, Y1 = 28;
  const xStep = 2, yStep = 5;

  // E(t) = 25*exp(-0.3*t)
  const n = 100;
  const data = [];
  for (let i = 0; i <= n; i++) {
    const t = 10 * i / n;
    data.push([t, 25 * Math.exp(-0.3 * t)]);
  }
  const path = genPath(data, X0, X1, Y0, Y1);

  let svg = '<svg viewBox="0 0 ' + W + ' ' + H + '" xmlns="http://www.w3.org/2000/svg" style="font-family:Segoe UI,Helvetica Neue,Arial,sans-serif">\n';
  svg += '<rect width="' + W + '" height="' + H + '" fill="#fff" rx="4"/>\n';
  svg += '<!-- Graph 4: Damped Energy Envelope -->\n';
  svg += '<defs>' + arrowHead('arr4', '#333') + '</defs>\n';
  svg += drawAxes(X0, X1, Y0, Y1, xStep, yStep, 'time / s', 'energy / mJ', 'Damped Oscillation \u2014 Energy Envelope');
  svg += '<path d="' + path + '" fill="none" stroke="#c44536" stroke-width="2.5"/>\n';
  svg += '<path d="' + path.replace('M', 'M') + '" fill="none" stroke="#c44536" stroke-width="1" stroke-dasharray="2,2" opacity="0.3"/>\n';

  // Add an oscillating signal beneath the envelope (visual hint)
  const oscData = [];
  for (let i = 0; i <= 200; i++) {
    const t = 10 * i / 200;
    const env = 25 * Math.exp(-0.3 * t);
    oscData.push([t, env * (0.5 + 0.5 * Math.cos(8 * t))]);
  }
  const oscPath = genPath(oscData, X0, X1, Y0, Y1);
  svg += '<path d="' + oscPath + '" fill="none" stroke="#2b6f9e" stroke-width="1.2" opacity="0.5"/>\n';

  // Legend
  const lx = PX + 15, ly = PY + 18;
  svg += '<rect x="' + lx + '" y="' + (ly - 12) + '" width="195" height="60" fill="rgba(255,255,255,0.92)" stroke="#bbb" rx="3"/>\n';
  svg += line(lx + 8, ly, lx + 38, ly, '#c44536', 2.5);
  svg += textEl(lx + 44, ly + 4, 'E\u209C\u2092\u209C(t) = E\u2080 e\u207B\u03B3\u1D57  (envelope)', 11, 'start', '#333');
  svg += line(lx + 8, ly + 20, lx + 38, ly + 20, '#2b6f9e', 1.5);
  svg += textEl(lx + 44, ly + 24, 'Instantaneous E (oscillatory)', 11, 'start', '#333');
  svg += textEl(lx + 8, ly + 40, '\u03B3 = damping coefficient', 10, 'start', '#888');

  svg += '</svg>\n';
  return svg;
}

// ============================================================
// Graph 5: HOTS — Experimental systematic error on Ek(x)
// ============================================================
function graphHOTSExperimental() {
  const X0 = -6, X1 = 6, Y0 = -3, Y1 = 28;
  const xStep = 2, yStep = 5;

  const n = 80;
  const theoretical = [], experimental = [];
  for (let i = 0; i <= n; i++) {
    const x = -5 + 10 * i / n;
    const ek = 25 - x * x;
    theoretical.push([x, ek]);
    // Experimental: 92% of theoretical with slight asymmetry (hysteresis-like)
    const loss = 0.92 + 0.03 * Math.sin(x * 0.5);
    experimental.push([x, ek * loss]);
  }

  const thPath = genPath(theoretical, X0, X1, Y0, Y1);
  const exPath = genPath(experimental, X0, X1, Y0, Y1);

  // Error bars at selected points
  let errBars = '';
  const errPoints = [-4, -2, 0, 2, 4];
  errPoints.forEach(x => {
    const ek = 25 - x * x;
    const ex = ek * 0.92;
    const err = ek * 0.04;
    const xp = sx(x, X0, X1);
    const yp = sy(ex, Y0, Y1);
    errBars += line(xp, yp - 6, xp, yp + 6, '#c44536', 1.2);
    errBars += line(xp - 3, yp - 6, xp + 3, yp - 6, '#c44536', 1);
    errBars += line(xp - 3, yp + 6, xp + 3, yp + 6, '#c44536', 1);
  });

  let svg = '<svg viewBox="0 0 ' + W + ' ' + H + '" xmlns="http://www.w3.org/2000/svg" style="font-family:Segoe UI,Helvetica Neue,Arial,sans-serif">\n';
  svg += '<rect width="' + W + '" height="' + H + '" fill="#fff" rx="4"/>\n';
  svg += '<!-- Graph 5: HOTS Experimental Error -->\n';
  svg += '<defs>' + arrowHead('arr5', '#333') + '</defs>\n';
  svg += drawAxes(X0, X1, Y0, Y1, xStep, yStep, 'displacement / cm', 'kinetic energy / mJ', 'HOTS: Experimental vs Theoretical E_k');
  svg += '<path d="' + thPath + '" fill="none" stroke="#2b6f9e" stroke-width="2" stroke-dasharray="6,3"/>\n';
  svg += '<path d="' + exPath + '" fill="none" stroke="#c44536" stroke-width="2.5"/>\n';
  svg += errBars;

  // Legend
  const lx = PX + 15, ly = PY + 18;
  svg += '<rect x="' + lx + '" y="' + (ly - 12) + '" width="180" height="60" fill="rgba(255,255,255,0.92)" stroke="#bbb" rx="3"/>\n';
  svg += line(lx + 8, ly, lx + 38, ly, '#2b6f9e', 2);
  svg += '<line x1="' + (lx + 8) + '" y1="' + ly + '" x2="' + (lx + 38) + '" y2="' + ly + '" stroke="#2b6f9e" stroke-width="2" stroke-dasharray="6,3"/>\n';
  svg += textEl(lx + 44, ly + 4, 'Theoretical E_k', 11, 'start', '#333');
  svg += line(lx + 8, ly + 20, lx + 38, ly + 20, '#c44536', 2.5);
  svg += textEl(lx + 44, ly + 24, 'Experimental E_k (with error bars)', 11, 'start', '#333');
  svg += textEl(lx + 8, ly + 40, 'Systematic loss ~8%, uncertainty shown', 10, 'start', '#888');

  svg += '</svg>\n';
  return svg;
}

// ============================================================
// Graph 6: HOTS — Damped vs Undamped comparison
// ============================================================
function graphHOTSDamping() {
  const X0 = -0.3, X1 = 10, Y0 = -3, Y1 = 28;
  const xStep = 2, yStep = 5;

  // Undamped: E = 25 (constant)
  // Damped: E = 25*exp(-0.2*t)
  const n = 100;
  const dampedData = [];
  for (let i = 0; i <= n; i++) {
    const t = 10 * i / n;
    dampedData.push([t, 25 * Math.exp(-0.2 * t)]);
  }
  const dampedPath = genPath(dampedData, X0, X1, Y0, Y1);

  let svg = '<svg viewBox="0 0 ' + W + ' ' + H + '" xmlns="http://www.w3.org/2000/svg" style="font-family:Segoe UI,Helvetica Neue,Arial,sans-serif">\n';
  svg += '<rect width="' + W + '" height="' + H + '" fill="#fff" rx="4"/>\n';
  svg += '<!-- Graph 6: HOTS Damped vs Undamped -->\n';
  svg += '<defs>' + arrowHead('arr6', '#333') + '</defs>\n';
  svg += drawAxes(X0, X1, Y0, Y1, xStep, yStep, 'time / s', 'total energy / mJ', 'HOTS: Effect of Damping on Total Energy');

  // Undamped: horizontal line at y=25
  const undampedPath = genPath([[0, 25], [10, 25]], X0, X1, Y0, Y1);
  svg += '<path d="' + undampedPath + '" fill="none" stroke="#2b6f9e" stroke-width="2" stroke-dasharray="8,4"/>\n';
  svg += '<path d="' + dampedPath + '" fill="none" stroke="#c44536" stroke-width="2.5"/>\n';

  // Shaded area between curves (optional — show energy loss)
  const shadeData = [];
  for (let i = 0; i <= 100; i++) {
    const t = 10 * i / 100;
    const damped = 25 * Math.exp(-0.2 * t);
    shadeData.push([t, damped]);
  }
  const shadeStr = shadeData.map((p, i) => {
    const x = sx(p[0], X0, X1);
    const y = sy(p[1], Y0, Y1);
    return (i === 0 ? 'M' : 'L') + x.toFixed(1) + ',' + y.toFixed(1);
  }).join(' ');
  const undampedEnd = sx(10, X0, X1);
  const dampedEnd = sy(25 * Math.exp(-2), Y0, Y1);
  svg += '<path d="' + shadeStr + 'L' + undampedEnd.toFixed(1) + ',' + sy(25, Y0, Y1).toFixed(1) + ' Z" fill="rgba(196,69,54,0.08)"/>\n';

  // Legend
  const lx = PX + 15, ly = PY + 18;
  svg += '<rect x="' + lx + '" y="' + (ly - 12) + '" width="230" height="60" fill="rgba(255,255,255,0.92)" stroke="#bbb" rx="3"/>\n';
  svg += line(lx + 8, ly, lx + 38, ly, '#2b6f9e', 2);
  svg += '<line x1="' + (lx + 8) + '" y1="' + ly + '" x2="' + (lx + 38) + '" y2="' + ly + '" stroke="#2b6f9e" stroke-width="2" stroke-dasharray="8,4"/>\n';
  svg += textEl(lx + 44, ly + 4, 'Undamped: E_total = constant', 11, 'start', '#333');
  svg += line(lx + 8, ly + 20, lx + 38, ly + 20, '#c44536', 2.5);
  svg += textEl(lx + 44, ly + 24, 'Lightly damped: E_total decays', 11, 'start', '#333');
  svg += textEl(lx + 8, ly + 40, 'Shaded region = energy dissipated to surroundings', 10, 'start', '#888');

  // Annotations
  svg += textEl(sx(2, X0, X1), sy(20, Y0, Y1), 'Energy loss', 10, 'start', '#888');
  svg += textEl(sx(2, X0, X1), sy(17, Y0, Y1), 'per cycle \u2193', 10, 'start', '#888');

  svg += '</svg>\n';
  return svg;
}

// ============================================================
// Main: generate all SVGs, replace in template, write output
// ============================================================
function main() {
  const graphs = {
    'GRAPH_ENERGY_DISPLACEMENT': graphEnergyDisplacement(),
    'GRAPH_ENERGY_TIME': graphEnergyTime(),
    'GRAPH_VELOCITY_DISPLACEMENT': graphVelocityDisplacement(),
    'GRAPH_DAMPED_ENERGY': graphDampedEnergy(),
    'GRAPH_HOTS_EXPERIMENTAL': graphHOTSExperimental(),
    'GRAPH_HOTS_DAMPING': graphHOTSDamping()
  };

  const templatePath = path.join(__dirname, 'index.html.template');
  const outputPath = path.join(__dirname, 'index.html');

  if (!fs.existsSync(templatePath)) {
    console.error('Template not found at ' + templatePath);
    process.exit(1);
  }

  let html = fs.readFileSync(templatePath, 'utf-8');

  for (const [key, svg] of Object.entries(graphs)) {
    const pattern = new RegExp('\\{\\{' + key + '\\}\\}', 'g');
    if (!pattern.test(html)) {
      console.warn('Warning: placeholder {{' + key + '}} not found in template');
    }
    html = html.replace(pattern, svg);
  }

  // Check for any remaining un-replaced placeholders
  const remaining = html.match(/\{\{[A-Z_]+\}\}/g);
  if (remaining) {
    console.warn('Warning: un-replaced placeholders: ' + remaining.join(', '));
  }

  fs.writeFileSync(outputPath, html, 'utf-8');
  console.log('Successfully generated ' + outputPath);
  console.log('Graphs generated: ' + Object.keys(graphs).length);
}

main();
