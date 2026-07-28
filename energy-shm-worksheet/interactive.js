(function () {
  'use strict';

  // ================================================================
  // Plot layout constants (must match generate-graphs.js)
  // ================================================================
  var PL = 70, PR = 30, PT = 40, PB = 55;
  var PW = 620 - PL - PR;
  var PH = 400 - PT - PB;

  // ================================================================
  // Coordinate mapping helpers (for path generation)
  // ================================================================
  function sx(svg, val, d0, d1) {
    var vb = svg.viewBox.baseVal;
    return PL + (val - d0) / (d1 - d0) * (vb.width - PL - PR);
  }
  function sy(svg, val, d0, d1) {
    var vb = svg.viewBox.baseVal;
    return PT + (vb.height - PT - PB) - (val - d0) / (d1 - d0) * (vb.height - PT - PB);
  }

  // Standalone coordinate helpers (for axis drawing, no SVG needed)
  function sxSt(val, d0, d1) { return PL + (val - d0) / (d1 - d0) * PW; }
  function sySt(val, y0, y1) { return PT + PH - (val - y0) / (y1 - y0) * PH; }

  // ================================================================
  // Read data ranges from SVG dataset
  // ================================================================
  function getRange(svg) {
    return {
      x0: parseFloat(svg.dataset.x0) || -6,
      x1: parseFloat(svg.dataset.x1) || 6,
      y0: parseFloat(svg.dataset.y0) || -3,
      y1: parseFloat(svg.dataset.y1) || 28
    };
  }

  // ================================================================
  // Helpers
  // ================================================================
  function roundUpNice(val, step) {
    if (val <= 0) return step;
    return Math.ceil(val / step) * step;
  }
  function roundUpBoth(val, step) {
    var r = Math.ceil(val / step) * step;
    return r < step ? step : r;
  }

  // ================================================================
  // SVG axis drawing (mirrors generate-graphs.js)
  // ================================================================
  function arrowHeadSVG(id, color) {
    return '<marker id="' + id + '" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto"><path d="M0,0 L8,3 L0,6 Z" fill="' + color + '"/></marker>';
  }
  function lineSVG(x1, y1, x2, y2, stroke, width, dash) {
    var s = '<line x1="' + x1.toFixed(1) + '" y1="' + y1.toFixed(1) + '" x2="' + x2.toFixed(1) + '" y2="' + y2.toFixed(1) + '" stroke="' + stroke + '" stroke-width="' + width + '"';
    if (dash) s += ' stroke-dasharray="' + dash + '"';
    s += '/>';
    return s;
  }
  function textSVG(x, y, txt, size, anchor, color, weight) {
    var s = '<text x="' + x.toFixed(1) + '" y="' + y.toFixed(1) + '" font-size="' + size + '"';
    if (anchor) s += ' text-anchor="' + anchor + '"';
    if (color) s += ' fill="' + color + '"';
    if (weight) s += ' font-weight="' + weight + '"';
    s += ' font-family="Segoe UI, Helvetica Neue, Arial, sans-serif">' + txt + '</text>';
    return s;
  }

  function drawAxesStr(x0, x1, y0, y1, xStep, yStep, xUnit, yUnit) {
    var parts = [];
    var zeroX = (x0 <= 0 && x1 >= 0) ? sxSt(0, x0, x1) : PL;
    var zeroY = (y0 <= 0 && y1 >= 0) ? sySt(0, y0, y1) : PT + PH;

    // Grid lines
    for (var v = Math.ceil(x0 / xStep) * xStep; v <= x1; v += xStep) {
      if (Math.abs(v) < 1e-10) continue;
      parts.push(lineSVG(sxSt(v, x0, x1), PT, sxSt(v, x0, x1), PT + PH, '#e0e0e0', 0.5));
    }
    for (var v = Math.ceil(y0 / yStep) * yStep; v <= y1; v += yStep) {
      if (Math.abs(v) < 1e-10) continue;
      parts.push(lineSVG(PL, sySt(v, y0, y1), PL + PW, sySt(v, y0, y1), '#e0e0e0', 0.5));
    }

    // Axes
    parts.push(lineSVG(PL, zeroY, PL + PW, zeroY, '#333', 1.5));
    parts.push(lineSVG(zeroX, PT, zeroX, PT + PH, '#333', 1.5));

    // X ticks
    for (var v = Math.ceil(x0 / xStep) * xStep; v <= x1; v += xStep) {
      var xp = sxSt(v, x0, x1);
      if (xp < PL || xp > PL + PW) continue;
      parts.push(lineSVG(xp, zeroY - 4, xp, zeroY + 4, '#333', 1));
      var label = Math.abs(v) < 1e-10 ? 'O' : (Number.isInteger(v) ? v.toString() : v.toFixed(1));
      parts.push(textSVG(xp, zeroY + 18, label, 11, 'center', '#333'));
    }

    // Y ticks
    for (var v = Math.ceil(y0 / yStep) * yStep; v <= y1; v += yStep) {
      if (Math.abs(v) < 1e-10) continue;
      var yp = sySt(v, y0, y1);
      if (yp < PT || yp > PT + PH) continue;
      parts.push(lineSVG(zeroX - 4, yp, zeroX + 4, yp, '#333', 1));
      var label = Number.isInteger(v) ? v.toString() : v.toFixed(1);
      parts.push(textSVG(zeroX - 10, yp + 4, label, 11, 'end', '#333'));
    }

    // Axis labels
    parts.push(textSVG(PL + PW / 2, PT + PH + 40, xUnit, 12, 'center', '#333', 'bold'));
    parts.push(textSVG(PL - 8, PT + PH / 2, yUnit, 12, 'center', '#333', 'bold'));

    return parts.join('\n');
  }

  // ================================================================
  // Update SVG data range and redraw axes
  // ================================================================
  function setRangeAndAxes(svg, x0, x1, y0, y1, xStep, yStep, xUnit, yUnit) {
    svg.dataset.x0 = x0;
    svg.dataset.x1 = x1;
    svg.dataset.y0 = y0;
    svg.dataset.y1 = y1;
    var axesId = svg.id + '-axes';
    var axesG = document.getElementById(axesId);
    if (!axesG) return;
    // Fade out
    axesG.style.transition = 'opacity 0.1s ease';
    axesG.style.opacity = '0';
    var markup = drawAxesStr(x0, x1, y0, y1, xStep, yStep, xUnit, yUnit);
    setTimeout(function () {
      try {
        var parser = new DOMParser();
        var doc = parser.parseFromString('<svg xmlns="http://www.w3.org/2000/svg">' + markup + '</svg>', 'image/svg+xml');
        var nodes = doc.documentElement.childNodes;
        while (axesG.firstChild) axesG.removeChild(axesG.firstChild);
        for (var i = 0; i < nodes.length; i++) {
          axesG.appendChild(document.importNode(nodes[i], true));
        }
      } catch(e) {
        while (axesG.firstChild) axesG.removeChild(axesG.firstChild);
        var tmp = document.createElement('div');
        tmp.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg">' + markup + '</svg>';
        var svgNodes = tmp.querySelector('svg').childNodes;
        for (var i = 0; i < svgNodes.length; i++) {
          axesG.appendChild(document.importNode(svgNodes[i], true));
        }
      }
      // Fade in
      axesG.style.opacity = '1';
    }, 100);
  }

  // ================================================================
  // Generate SVG path string from numeric data array
  // ================================================================
  function genPath(svg, data) {
    var r = getRange(svg);
    if (!data || data.length < 2) return '';
    return data.map(function (p, i) {
      var x = sx(svg, p[0], r.x0, r.x1);
      var y = sy(svg, p[1], r.y0, r.y1);
      return (i === 0 ? 'M' : 'L') + x.toFixed(1) + ',' + y.toFixed(1);
    }).join(' ');
  }

  // ================================================================
  // Data generators
  // ================================================================
  var N = 100;

  function genEpData(x0, k) {
    var d = [];
    for (var i = 0; i <= N; i++) {
      var x = -x0 + 2 * x0 * i / N;
      d.push([x, 0.5 * k * x * x]);
    }
    return d;
  }

  function genEkData(x0, k) {
    var d = [], Emax = 0.5 * k * x0 * x0;
    for (var i = 0; i <= N; i++) {
      var x = -x0 + 2 * x0 * i / N;
      d.push([x, Emax - 0.5 * k * x * x]);
    }
    return d;
  }

  function genEtotData(x0, k) {
    var Emax = 0.5 * k * x0 * x0;
    return [[-x0, Emax], [x0, Emax]];
  }

  function genEpTimeData(x0, k, omega) {
    var d = [], Emax = 0.5 * k * x0 * x0;
    for (var i = 0; i <= N; i++) {
      var t = 3.4 * i / N;
      var s = Math.sin(omega * t);
      d.push([t, Emax * s * s]);
    }
    return d;
  }

  function genEkTimeData(x0, k, omega) {
    var d = [], Emax = 0.5 * k * x0 * x0;
    for (var i = 0; i <= N; i++) {
      var t = 3.4 * i / N;
      var c = Math.cos(omega * t);
      d.push([t, Emax * c * c]);
    }
    return d;
  }

  function genVxUpper(x0, omega) {
    var d = [];
    for (var i = 0; i <= N; i++) {
      var x = -x0 + 2 * x0 * i / N;
      d.push([x, omega * Math.sqrt(Math.max(0, x0 * x0 - x * x))]);
    }
    return d;
  }

  function genVxLower(x0, omega) {
    var d = [];
    for (var i = 0; i <= N; i++) {
      var x = x0 - 2 * x0 * i / N;
      d.push([x, -omega * Math.sqrt(Math.max(0, x0 * x0 - x * x))]);
    }
    return d;
  }

  function genDampedEnvelope(gamma) {
    var d = [];
    for (var i = 0; i <= N; i++) {
      var t = 10 * i / N;
      d.push([t, 25 * Math.exp(-gamma * t)]);
    }
    return d;
  }

  function genDampedOsc(gamma) {
    var d = [];
    for (var i = 0; i <= 200; i++) {
      var t = 10 * i / 200;
      var env = 25 * Math.exp(-gamma * t);
      d.push([t, env * (0.5 + 0.5 * Math.cos(8 * t))]);
    }
    return d;
  }

  function genPhaseX(x0, omega) {
    var d = [];
    for (var i = 0; i <= 150; i++) {
      var t = 6.4 * i / 150;
      d.push([t, x0 * Math.sin(omega * t)]);
    }
    return d;
  }

  function genPhaseV(x0, omega) {
    var d = [];
    for (var i = 0; i <= 150; i++) {
      var t = 6.4 * i / 150;
      d.push([t, omega * x0 * Math.cos(omega * t)]);
    }
    return d;
  }

  function genPhaseA(x0, omega) {
    var d = [];
    for (var i = 0; i <= 150; i++) {
      var t = 6.4 * i / 150;
      d.push([t, -omega * omega * x0 * Math.sin(omega * t)]);
    }
    return d;
  }

  function genResonanceCurve(gamma) {
    var d = [];
    for (var i = 0; i <= 120; i++) {
      var r = 4.2 * i / 120;
      d.push([r, 5 / Math.sqrt(Math.pow(1 - r * r, 2) + Math.pow(2 * gamma * r, 2))]);
    }
    return d;
  }

  // ================================================================
  // Axis configs per graph  (original defaults)
  // ================================================================
  var axisCfg = {
    graph1: { xStep: 2, yStep: 5, xUnit: 'displacement / cm', yUnit: 'energy / mJ' },
    graph2: { xStep: 0.5, yStep: 5, xUnit: 'time / s', yUnit: 'energy / mJ' },
    graph3: { xStep: 2, yStep: 4, xUnit: 'displacement / cm', yUnit: 'velocity / cm s\u207B\u00B9' },
    graph4: { xStep: 2, yStep: 5, xUnit: 'time / s', yUnit: 'energy / mJ' },
    graph5: { xStep: 2, yStep: 5, xUnit: 'displacement / cm', yUnit: 'kinetic energy / mJ' },
    graph6: { xStep: 2, yStep: 5, xUnit: 'time / s', yUnit: 'total energy / mJ' },
    graph7: { xStep: 1, yStep: 5, xUnit: 'time / s', yUnit: 'x, v, a / (cm, cm s\u207B\u00B9, cm s\u207B\u00B2)' },
    graph8: { xStep: 0.5, yStep: 1, xUnit: 'driving frequency / natural frequency', yUnit: 'amplitude' },
    graph9: { xStep: 5, yStep: 10, xUnit: 'x\u00B2 / cm\u00B2', yUnit: 'E_k / mJ' }
  };

  // ================================================================
  // Graph updaters with dynamic axis rescaling
  // ================================================================

  function updateGraph1(x0, k) {
    var svg = document.getElementById('graph1');
    if (!svg) return;
    var Emax = 0.5 * k * x0 * x0;
    var cfg = axisCfg.graph1;
    var r = getRange(svg);
    var y1 = Math.max(r.y1, roundUpBoth(Emax * 1.15, cfg.yStep));
    if (r.y1 !== y1) {
      setRangeAndAxes(svg, -6, 6, -3, y1, cfg.xStep, cfg.yStep, cfg.xUnit, cfg.yUnit);
    }
    setPath(svg, 'graph1-ep', genEpData(x0, k));
    setPath(svg, 'graph1-ek', genEkData(x0, k));
    setPath(svg, 'graph1-etot', genEtotData(x0, k));
  }

  function updateGraph2(x0, k, omega) {
    var svg = document.getElementById('graph2');
    if (!svg) return;
    var Emax = 0.5 * k * x0 * x0;
    var cfg = axisCfg.graph2;
    var r = getRange(svg);
    var y1 = Math.max(r.y1, roundUpBoth(Emax * 1.15, cfg.yStep));
    if (r.y1 !== y1) {
      setRangeAndAxes(svg, -0.3, 3.5, -3, y1, cfg.xStep, cfg.yStep, cfg.xUnit, cfg.yUnit);
    }
    setPath(svg, 'graph2-ep', genEpTimeData(x0, k, omega));
    setPath(svg, 'graph2-ek', genEkTimeData(x0, k, omega));
  }

  function updateGraph3(x0, omega) {
    var svg = document.getElementById('graph3');
    if (!svg) return;
    var vmax = omega * x0;
    var cfg = axisCfg.graph3;
    var r = getRange(svg);
    var y1 = Math.max(r.y1, roundUpBoth(vmax * 1.15, cfg.yStep));
    if (r.y1 !== y1) {
      setRangeAndAxes(svg, -6, 6, -y1, y1, cfg.xStep, cfg.yStep, cfg.xUnit, cfg.yUnit);
    }
    setPath(svg, 'graph3-up', genVxUpper(x0, omega));
    setPath(svg, 'graph3-low', genVxLower(x0, omega));
  }

  function updateGraph4(gamma) {
    var svg = document.getElementById('graph4');
    if (!svg) return;
    setPath(svg, 'graph4-env', genDampedEnvelope(gamma));
    setPath(svg, 'graph4-osc', genDampedOsc(gamma));
  }

  function updateGraph5(gamma) {
    var svg = document.getElementById('graph5');
    if (!svg) return;
    var x0 = 5, k = 2, Emax = 0.5 * k * x0 * x0;
    var n = 80;
    var theoretical = [], experimental = [];
    var lossFactor = Math.max(0.05, 1 - gamma * 0.35);
    for (var i = 0; i <= n; i++) {
      var x = -x0 + 2 * x0 * i / n;
      var ek = Emax - 0.5 * k * x * x;
      theoretical.push([x, ek]);
      experimental.push([x, ek * lossFactor]);
    }
    setPath(svg, 'graph5-theory', theoretical);
    setPath(svg, 'graph5-experiment', experimental);
  }

  function updateGraph6(gamma) {
    var svg = document.getElementById('graph6');
    if (!svg) return;
    setPath(svg, 'graph6-damped', genDampedEnvelope(gamma));
  }

  function updateGraph7(x0, omega) {
    var svg = document.getElementById('graph7');
    if (!svg) return;
    var maxAmp = Math.max(x0, omega * x0, omega * omega * x0);
    var cfg = axisCfg.graph7;
    var r = getRange(svg);
    var y1 = Math.max(r.y1, roundUpBoth(maxAmp * 1.15, cfg.yStep));
    if (r.y1 !== y1) {
      setRangeAndAxes(svg, -0.3, 6.5, -y1, y1, cfg.xStep, cfg.yStep, cfg.xUnit, cfg.yUnit);
    }
    setPath(svg, 'graph7-x', genPhaseX(x0, omega));
    setPath(svg, 'graph7-v', genPhaseV(x0, omega));
    setPath(svg, 'graph7-a', genPhaseA(x0, omega));
  }

  function updateGraph8(gamma) {
    var svg = document.getElementById('graph8');
    if (!svg) return;
    var gL = gamma * 0.5, gM = gamma * 1.3, gH = gamma * 2.7;
    var peakL = gL > 0.001 ? 5 / (2 * gL) : 50;
    var peakM = gM > 0.001 ? 5 / (2 * gM) : 50;
    var peakH = gH > 0.001 ? 5 / (2 * gH) : 50;
    var maxPeak = Math.max(peakL, peakM, peakH, 5.5);
    var cfg = axisCfg.graph8;
    var r = getRange(svg);
    var y1 = Math.min(Math.max(r.y1, roundUpBoth(maxPeak * 1.15, cfg.yStep)), 50);
    if (r.y1 !== y1) {
      setRangeAndAxes(svg, -0.3, 4.5, -0.5, y1, cfg.xStep, cfg.yStep, cfg.xUnit, cfg.yUnit);
    }
    setPath(svg, 'graph8-light', genResonanceCurve(gL));
    setPath(svg, 'graph8-medium', genResonanceCurve(gM));
    setPath(svg, 'graph8-heavy', genResonanceCurve(gH));
  }

  function updateGraph9(omega) {
    var svg = document.getElementById('graph9');
    if (!svg) return;
    var m = 0.050, x0sq = 0.0025;
    var Emax = 0.5 * m * omega * omega * x0sq * 1000;
    var n = 50;
    var theory = [];
    for (var i = 0; i <= n; i++) {
      var x2 = 25 * i / n;
      var ek = Emax * (1 - x2 / 25);
      theory.push([x2, Math.max(0, ek)]);
    }
    var cfg = axisCfg.graph9;
    var r = getRange(svg);
    var y1 = Math.max(r.y1, roundUpBoth(Emax * 1.15, cfg.yStep));
    if (r.y1 !== y1) {
      setRangeAndAxes(svg, -0.5, 26, -2, y1, cfg.xStep, cfg.yStep, cfg.xUnit, cfg.yUnit);
    }
    setPath(svg, 'graph9-theory', theory);
    var grad = -Emax / 25;
    var gradEl = document.getElementById('graph9-grad-lbl');
    if (gradEl) gradEl.textContent = 'Gradient = ' + grad.toFixed(2) + ' mJ cm\u207B\u00B2';
    var omegaEl = document.getElementById('graph9-omega-lbl');
    if (omegaEl) omegaEl.textContent = 'Fitted \u03C9 = ' + omega.toFixed(1) + ' rad s\u207B\u00B9';
  }

  function setPath(svg, id, data) {
    var el = document.getElementById(id);
    if (el) el.setAttribute('d', genPath(svg, data));
  }

  // ================================================================
  // Tooltip system
  // ================================================================
  var tooltipEl = null;
  var crosshairH = null;
  var crosshairV = null;

  function initTooltip() {
    tooltipEl = document.getElementById('g-tooltip');
    crosshairH = document.getElementById('g-crosshair-h');
    crosshairV = document.getElementById('g-crosshair-v');

    if (!tooltipEl) {
      tooltipEl = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      tooltipEl.setAttribute('id', 'g-tooltip');
      tooltipEl.setAttribute('font-size', '11');
      tooltipEl.setAttribute('fill', '#1a3a5c');
      tooltipEl.setAttribute('font-weight', 'bold');
      tooltipEl.setAttribute('font-family', 'Segoe UI, Helvetica Neue, Arial, sans-serif');
    }
    if (!crosshairH) {
      crosshairH = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      crosshairH.setAttribute('id', 'g-crosshair-h');
      crosshairH.setAttribute('stroke', '#c44536');
      crosshairH.setAttribute('stroke-width', '0.8');
      crosshairH.setAttribute('stroke-dasharray', '4,3');
    }
    if (!crosshairV) {
      crosshairV = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      crosshairV.setAttribute('id', 'g-crosshair-v');
      crosshairV.setAttribute('stroke', '#c44536');
      crosshairV.setAttribute('stroke-width', '0.8');
      crosshairV.setAttribute('stroke-dasharray', '4,3');
    }
  }

  function getDataPoint(svg, mx, my) {
    var r = getRange(svg);
    var vb = svg.viewBox.baseVal;
    var pw = vb.width - PL - PR, ph = vb.height - PT - PB;
    var dx = (mx - PL) / pw * (r.x1 - r.x0) + r.x0;
    var dy = (my - PT) / ph * (r.y1 - r.y0) + r.y0;
    dy = (r.y1 - r.y0) - dy + r.y0;
    return { x: dx, y: dy };
  }

  function setupTooltips() {
    initTooltip();
    var svgs = document.querySelectorAll('svg.graph-svg');
    svgs.forEach(function (svg) {
      var hitarea = svg.querySelector('.hitarea');
      if (!hitarea) return;

      hitarea.addEventListener('mousemove', function (e) {
        var rect = svg.getBoundingClientRect();
        var scaleX = svg.viewBox.baseVal.width / rect.width;
        var scaleY = svg.viewBox.baseVal.height / rect.height;
        var svgX = (e.clientX - rect.left) * scaleX;
        var svgY = (e.clientY - rect.top) * scaleY;

        var pt = getDataPoint(svg, svgX, svgY);

        if (crosshairH) {
          crosshairH.setAttribute('x1', PL.toString());
          crosshairH.setAttribute('x2', (PL + 500).toString());
          crosshairH.setAttribute('y1', svgY.toFixed(1));
          crosshairH.setAttribute('y2', svgY.toFixed(1));
          if (!svg.contains(crosshairH)) svg.appendChild(crosshairH);
        }
        if (crosshairV) {
          crosshairV.setAttribute('x1', svgX.toFixed(1));
          crosshairV.setAttribute('x2', svgX.toFixed(1));
          crosshairV.setAttribute('y1', PT.toString());
          crosshairV.setAttribute('y2', (PT + 300).toString());
          if (!svg.contains(crosshairV)) svg.appendChild(crosshairV);
        }

        if (tooltipEl) {
          var txt = 'x = ' + pt.x.toFixed(2) + ', y = ' + pt.y.toFixed(2);
          tooltipEl.setAttribute('x', (svgX + 10).toFixed(1));
          tooltipEl.setAttribute('y', (svgY - 10).toFixed(1));
          tooltipEl.textContent = txt;
          if (!svg.contains(tooltipEl)) svg.appendChild(tooltipEl);
        }
      });

      hitarea.addEventListener('mouseleave', function () {
        if (crosshairH && svg.contains(crosshairH)) svg.removeChild(crosshairH);
        if (crosshairV && svg.contains(crosshairV)) svg.removeChild(crosshairV);
        if (tooltipEl && svg.contains(tooltipEl)) svg.removeChild(tooltipEl);
      });
    });
  }

  // ================================================================
  // Legend toggle system
  // ================================================================
  function setupToggles() {
    document.querySelectorAll('.legend-toggle').forEach(function (el) {
      el.addEventListener('click', function () {
        var targetId = this.dataset.target;
        var target = document.getElementById(targetId);
        if (!target) return;
        var showed = target.style.display !== 'none';
        target.style.display = showed ? 'none' : '';
        this.classList.toggle('dimmed');
        var line = this.querySelector('.legend-line');
        if (line) {
          line.style.opacity = showed ? '0.3' : '1';
        }
      });
    });
  }

  // ================================================================
  // Shared state (avoids reading back from DOM where range-clamping
  // can corrupt values — notably Graph 9's ω slider range 10–45)
  // ================================================================
  var S = { x0: 5, omega: 2, gamma: 0.3 };

  function syncUI(param, val) {
    var fmt = param === 'gamma' ? val.toFixed(2) : val.toFixed(1);
    document.querySelectorAll('[data-display="' + param + '"]').forEach(function (el) {
      el.textContent = fmt;
    });
    document.querySelectorAll('.param-slider[data-param="' + param + '"]').forEach(function (s) {
      s.value = val;
    });
  }

  function updateAll() {
    updateGraph1(S.x0, 2);
    updateGraph2(S.x0, 2, S.omega);
    updateGraph3(S.x0, S.omega);
    updateGraph4(S.gamma);
    updateGraph5(S.gamma);
    updateGraph6(S.gamma);
    updateGraph7(S.x0, S.omega);
    updateGraph8(S.gamma);
    if (document.getElementById('graph9')) updateGraph9(S.omega);
  }

  function setupSliders() {
    document.querySelectorAll('.param-slider').forEach(function (slider) {
      slider.addEventListener('input', function () {
        var k = this.dataset.param;
        S[k] = parseFloat(this.value);
        syncUI(k, S[k]);
        updateAll();
      });
    });
  }

  // ================================================================
  // Zoom system — per-graph viewBox zoom with mouse wheel + buttons
  // ================================================================
  function setupZoom() {
    document.querySelectorAll('.graph-container').forEach(function (container) {
      var svg = container.querySelector('svg.graph-svg');
      if (!svg) return;

      // Store original viewBox
      var vb = svg.viewBox.baseVal;
      var orig = { x: vb.x, y: vb.y, w: vb.width, h: vb.height };
      svg._origVB = orig;

      // Create zoom toolbar
      var bar = document.createElement('div');
      bar.className = 'zoom-bar';

      var btnIn = document.createElement('button');
      btnIn.className = 'zoom-btn';
      btnIn.title = 'Zoom in';
      btnIn.textContent = '+';
      btnIn.addEventListener('click', function (e) { e.stopPropagation(); zoomSVG(svg, 1.3, null); });

      var btnOut = document.createElement('button');
      btnOut.className = 'zoom-btn';
      btnOut.title = 'Zoom out';
      btnOut.textContent = '\u2212';
      btnOut.addEventListener('click', function (e) { e.stopPropagation(); zoomSVG(svg, 1 / 1.3, null); });

      var btnReset = document.createElement('button');
      btnReset.className = 'zoom-btn zoom-btn-reset';
      btnReset.title = 'Reset zoom';
      btnReset.textContent = '\u292B';
      btnReset.addEventListener('click', function (e) { e.stopPropagation(); resetZoom(svg); });

      bar.appendChild(btnIn);
      bar.appendChild(btnOut);
      bar.appendChild(btnReset);
      container.appendChild(bar);

      // Mouse wheel zoom
      svg.addEventListener('wheel', function (e) {
        e.preventDefault();
        var rect = svg.getBoundingClientRect();
        var mx = e.clientX - rect.left;
        var my = e.clientY - rect.top;
        var scale = e.deltaY < 0 ? 1.15 : 1 / 1.15;
        zoomSVG(svg, scale, { x: mx, y: my });
      }, { passive: false });
    });
  }

  function zoomSVG(svg, factor, center) {
    var vb = svg.viewBox.baseVal;
    var w = vb.width, h = vb.height;
    var nw = w * factor, nh = h * factor;
    if (nw < 100 || nw > 3000) return;
    var cx, cy;
    if (center) {
      var rect = svg.getBoundingClientRect();
      var scaleX = w / rect.width, scaleY = h / rect.height;
      cx = center.x * scaleX + vb.x;
      cy = center.y * scaleY + vb.y;
    } else {
      cx = vb.x + w / 2;
      cy = vb.y + h / 2;
    }
    vb.x = cx - (cx - vb.x) * (nw / w);
    vb.y = cy - (cy - vb.y) * (nh / h);
    vb.width = nw;
    vb.height = nh;
  }

  function resetZoom(svg) {
    var orig = svg._origVB;
    if (!orig) return;
    var vb = svg.viewBox.baseVal;
    vb.x = orig.x;
    vb.y = orig.y;
    vb.width = orig.w;
    vb.height = orig.h;
  }

  // ================================================================
  // Public API (for workbook.js export)
  // ================================================================
  window.prepareGraphsForExport = function () {
    document.querySelectorAll('svg.graph-svg').forEach(function (svg) {
      resetZoom(svg);
      [].forEach.call(svg.querySelectorAll('#g-tooltip, [id^="g-crosshair-"]'), function (el) { el.remove(); });
    });
  };
  window.getS = function () { return S; };
  window.triggerFullRender = function () { updateAll(); };

  // ================================================================
  // Init
  // ================================================================
  function init() {
    setupToggles();
    setupTooltips();
    setupSliders();
    setupZoom();

    // Read initial values from first slider of each param
    var el;
    el = document.querySelector('.param-slider[data-param="x0"]');
    if (el) S.x0 = parseFloat(el.value);
    el = document.querySelector('.param-slider[data-param="omega"]');
    if (el) S.omega = parseFloat(el.value);
    el = document.querySelector('.param-slider[data-param="gamma"]');
    if (el) S.gamma = parseFloat(el.value);

    // Sync UI to state (this also sets Graph 9's slider, but the
    // clamped value there does NOT contaminate S)
    syncUI('x0', S.x0);
    syncUI('omega', S.omega);
    syncUI('gamma', S.gamma);

    // Force initial render with proper ranges
    updateAll();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
