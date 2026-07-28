(function () {
  'use strict';

  // ================================================================
  // Plot layout constants (must match generate-graphs.js)
  // ================================================================
  var PL = 70, PR = 30, PT = 40, PB = 55;

  // ================================================================
  // Coordinate mapping helpers
  // ================================================================
  function sx(svg, val, d0, d1) {
    var vb = svg.viewBox.baseVal;
    return PL + (val - d0) / (d1 - d0) * (vb.width - PL - PR);
  }
  function sy(svg, val, d0, d1) {
    var vb = svg.viewBox.baseVal;
    return PT + (vb.height - PT - PB) - (val - d0) / (d1 - d0) * (vb.height - PT - PB);
  }

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
  // Data generators  (unitless: x0 = 5, k = 2, Emax = 25)
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

  // ================================================================
  // Additional data generators for Graph 7 (phase) and Graph 8 (resonance)
  // ================================================================

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
  // Graph updaters
  // ================================================================
  function updateGraph1(x0, k) {
    var svg = document.getElementById('graph1');
    if (!svg) return;
    setPath(svg, 'graph1-ep', genEpData(x0, k));
    setPath(svg, 'graph1-ek', genEkData(x0, k));
    setPath(svg, 'graph1-etot', genEtotData(x0, k));
    updateAnnotation(svg, 'graph1-x0-lbl', '+x\u2080', 5, x0);
    updateAnnotation(svg, 'graph1-nx0-lbl', '\u2212x\u2080', -5, -x0);
  }

  function updateGraph2(x0, k, omega) {
    var svg = document.getElementById('graph2');
    if (!svg) return;
    setPath(svg, 'graph2-ep', genEpTimeData(x0, k, omega));
    setPath(svg, 'graph2-ek', genEkTimeData(x0, k, omega));
    var T = 2 * Math.PI / omega;
    updateAnnotation(svg, 'graph2-T4', 'T/4', 0.785, T / 4);
    updateAnnotation(svg, 'graph2-T2', 'T/2', 1.57, T / 2);
  }

  function updateGraph3(x0, omega) {
    var svg = document.getElementById('graph3');
    if (!svg) return;
    setPath(svg, 'graph3-up', genVxUpper(x0, omega));
    setPath(svg, 'graph3-low', genVxLower(x0, omega));
    var vmax = omega * x0;
    updateAnnotation(svg, 'graph3-x0-lbl', '+x\u2080', 5, x0);
    updateAnnotation(svg, 'graph3-nx0-lbl', '\u2212x\u2080', -5, -x0);
    updateAnnotation(svg, 'graph3-vmax-lbl', '+\u03C9x\u2080', 0, vmax);
    updateAnnotation(svg, 'graph3-vmin-lbl', '\u2212\u03C9x\u2080', 0, -vmax);
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
    setPath(svg, 'graph7-x', genPhaseX(x0, omega));
    setPath(svg, 'graph7-v', genPhaseV(x0, omega));
    setPath(svg, 'graph7-a', genPhaseA(x0, omega));
  }

  function updateGraph8(gamma) {
    var svg = document.getElementById('graph8');
    if (!svg) return;
    // Three damping levels proportional to gamma slider
    var gL = gamma * 0.5, gM = gamma * 1.3, gH = gamma * 2.7;
    setPath(svg, 'graph8-light', genResonanceCurve(gL));
    setPath(svg, 'graph8-medium', genResonanceCurve(gM));
    setPath(svg, 'graph8-heavy', genResonanceCurve(gH));
  }

  function updateGraph9(omega) {
    var svg = document.getElementById('graph9');
    if (!svg) return;
    // Theoretical: Ek = Emax - ½mω²·x², where Emax = ½mω²x₀²
    // m = 0.050 kg, x₀² = 25 cm² = 0.0025 m²
    // Emax (mJ) = 0.5 * 0.050 * ω² * 0.0025 * 1000 = 0.0625 ω²
    // Gradient = -0.0625 ω² / 25  (mJ per cm²) = -0.0025 ω²
    var m = 0.050, x0sq = 0.0025;
    var Emax = 0.5 * m * omega * omega * x0sq * 1000; // in mJ
    var n = 50;
    var theory = [];
    for (var i = 0; i <= n; i++) {
      var x2 = 25 * i / n;
      var ek = Emax * (1 - x2 / 25);
      theory.push([x2, Math.max(0, ek)]);
    }
    setPath(svg, 'graph9-theory', theory);

    // Update annotation text
    var grad = -Emax / 25;
    var gradEl = svg.getElementById('graph9-grad-lbl');
    if (gradEl) gradEl.textContent = 'Gradient = ' + grad.toFixed(2) + ' mJ cm\u207B\u00B2';
    var omegaEl = svg.getElementById('graph9-omega-lbl');
    if (omegaEl) omegaEl.textContent = 'Fitted \u03C9 = ' + omega.toFixed(1) + ' rad s\u207B\u00B9';
  }

  function setPath(svg, id, data) {
    var el = svg.getElementById(id);
    if (el) el.setAttribute('d', genPath(svg, data));
  }

  function updateAnnotation(svg, id, label, xDefault, newVal) {
    var el = svg.getElementById(id);
    if (el) {
      var r = getRange(svg);
      var xPos = sx(svg, xDefault === 0 ? 0 : (xDefault > 0 ? xDefault : -xDefault), r.x0, r.x1);
      el.textContent = label;
      // Update position based on new axis limits
    }
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
    dy = (r.y1 - r.y0) - dy + r.y0; // invert
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

        // Crosshairs
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

        // Tooltip
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
        // Also dim the legend line
        var line = this.querySelector('.legend-line');
        if (line) {
          line.style.opacity = showed ? '0.3' : '1';
        }
      });
    });
  }

  // ================================================================
  // Sliders
  // ================================================================
  function setupSliders() {
    // Damping slider
    var gammaSlider = document.getElementById('gamma-slider');
    var gammaDisplay = document.getElementById('gamma-value');
    if (gammaSlider) {
      gammaSlider.addEventListener('input', function () {
        var g = parseFloat(this.value);
        if (gammaDisplay) gammaDisplay.textContent = g.toFixed(2);
        updateGraph4(g);
        updateGraph5(g);
        updateGraph6(g);
        updateGraph8(g);
      });
    }

    // Amplitude slider
    var x0Slider = document.getElementById('x0-slider');
    var x0Display = document.getElementById('x0-value');
    if (x0Slider) {
      x0Slider.addEventListener('input', function () {
        var x0 = parseFloat(this.value);
        if (x0Display) x0Display.textContent = x0.toFixed(1);
        var omega = omegaSlider ? parseFloat(omegaSlider.value) : 2;
        updateGraph1(x0, 2);
        updateGraph2(x0, 2, omega);
        updateGraph3(x0, omega);
        updateGraph7(x0, omega);
      });
    }

    // Angular frequency slider
    var omegaSlider = document.getElementById('omega-slider');
    var omegaDisplay = document.getElementById('omega-value');
    if (omegaSlider) {
      omegaSlider.addEventListener('input', function () {
        var omega = parseFloat(this.value);
        if (omegaDisplay) omegaDisplay.textContent = omega.toFixed(1);
        var x0 = x0Slider ? parseFloat(x0Slider.value) : 5;
        updateGraph2(x0, 2, omega);
        updateGraph3(x0, omega);
        updateGraph7(x0, omega);
        updateGraph9(omega);
      });
    }
  }

  // ================================================================
  // Initialization
  // ================================================================
  function init() {
    setupToggles();
    setupTooltips();
    setupSliders();

    // Force initial render to match sliders
    var x0Slider = document.getElementById('x0-slider');
    var gammaSlider = document.getElementById('gamma-slider');
    var omegaSlider = document.getElementById('omega-slider');

    var x0 = x0Slider ? parseFloat(x0Slider.value) : 5;
    var gamma = gammaSlider ? parseFloat(gammaSlider.value) : 0.3;
    var omega = omegaSlider ? parseFloat(omegaSlider.value) : 2;

    updateGraph1(x0, 2);
    updateGraph2(x0, 2, omega);
    updateGraph3(x0, omega);
    updateGraph4(gamma);
    updateGraph5(gamma);
    updateGraph6(gamma);
    updateGraph7(x0, omega);
    updateGraph8(gamma);
    updateGraph9(omega);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
