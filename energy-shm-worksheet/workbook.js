(function () {
  'use strict';

  // ================================================================
  //  Workbook generator — builds a print-optimised learner workbook
  //  from the existing page content. No external dependencies for
  //  the HTML itself; PDF uses html2pdf.js from CDN.
  // ================================================================

  // ──────────────────────────────────────────────────────────────
  //  HTML / CSS templates
  // ──────────────────────────────────────────────────────────────

  var workbookCSS = [
    '*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }',
    'body { font-family: "Segoe UI", "Helvetica Neue", Arial, sans-serif; font-size: 11pt; line-height: 1.6; color: #1f2328; max-width: 210mm; margin: 0 auto; padding: 0; }',

    /* Cover page */
    '.cover-page { text-align: center; padding: 4cm 2cm; page-break-after: always; }',
    '.cover-page h1 { font-size: 22pt; color: #1a3a5c; margin-bottom: 0.5cm; }',
    '.cover-page .subj { font-size: 14pt; color: #2b6f9e; margin-bottom: 0.3cm; }',
    '.cover-page .ref { font-size: 10pt; color: #636c76; margin-bottom: 2cm; }',
    '.cover-page .field { margin-top: 1cm; text-align: left; max-width: 10cm; margin-left: auto; margin-right: auto; }',
    '.cover-page .field label { display: block; font-size: 10pt; color: #636c76; margin-bottom: 0.1cm; }',
    '.cover-page .field .line { border-bottom: 1px solid #333; height: 0.8cm; margin-bottom: 0.5cm; }',

    /* Section headers */
    'h2 { font-size: 14pt; color: #1a3a5c; border-bottom: 2px solid #2b6f9e; padding-bottom: 0.15cm; margin: 0.6cm 0 0.3cm; }',
    'h3 { font-size: 12pt; color: #2b6f9e; margin: 0.4cm 0 0.2cm; }',
    'h4 { font-size: 11pt; color: #1a3a5c; margin: 0.3cm 0 0.15cm; }',

    /* Content blocks */
    'p { margin: 0.15cm 0; }',
    'ul, ol { margin: 0.15cm 0; padding-left: 1.2cm; }',
    'li { margin: 0.08cm 0; }',

    /* Derivation */
    '.derivation-step { padding: 0.2cm 0.3cm; margin: 0.15cm 0; border-left: 3px solid #2b6f9e; background: #f8fafc; }',
    '.step-num { font-weight: 700; color: #2b6f9e; margin-right: 0.3cm; }',
    '.prompt { font-style: italic; color: #636c76; font-size: 0.9rem; display: block; }',
    '.result { font-weight: 600; display: block; margin-top: 0.05cm; }',
    '.final-formula { text-align: center; font-size: 1.15rem; font-weight: 700; color: #1a3a5c; padding: 0.4cm; margin: 0.3cm 0; background: #eaf3fb; border: 1px solid #2b6f9e; }',

    /* Graphs */
    '.graph-container { text-align: center; margin: 0.4cm 0; page-break-inside: avoid; }',
    '.graph-container svg { max-width: 100%; height: auto; }',
    '.graph-container .caption { font-size: 9pt; color: #636c76; font-style: italic; margin-top: 0.1cm; }',
    '.graph-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0.5cm; }',

    /* Example */
    '.example-box { background: #f7fafc; border: 1px solid #d0d7de; padding: 0.3cm 0.4cm; margin: 0.3cm 0; }',

    /* Questions */
    '.question { margin: 0.4cm 0; page-break-inside: avoid; }',
    '.q-header { font-weight: 700; color: #1a3a5c; font-size: 11pt; }',
    '.q-context { font-style: italic; font-size: 10pt; color: #636c76; }',
    '.q-part { margin: 0.2cm 0 0.2cm 0.6cm; }',
    '.q-part .marks { font-size: 9pt; color: #c44536; font-weight: 700; }',
    '.cmd-word { font-weight: 700; color: #c44536; }',

    /* Answer space */
    '.answer-space { min-height: 3cm; border-bottom: 1px dashed #ccc; margin: 0.2cm 0 0.5cm; }',

    /* Data table */
    '.data-table { border-collapse: collapse; margin: 0.3cm auto; font-size: 10pt; }',
    '.data-table th { background: #1a3a5c; color: #fff; padding: 0.2cm 0.4cm; text-align: center; }',
    '.data-table td { padding: 0.15cm 0.4cm; border: 1px solid #d0d7de; text-align: center; }',
    '.data-table tr:nth-child(even) { background: #f0f4f8; }',

    /* Mark scheme appendix */
    '.mark-scheme { background: #f8f9fa; border: 1px solid #dee2e6; padding: 0.2cm 0.4cm; margin: 0.2cm 0; font-size: 10pt; }',
    '.ms-header { font-weight: 700; color: #218838; }',
    '.ms-point { margin: 0.1cm 0; padding-left: 0.4cm; border-left: 2px solid #adb5bd; }',
    '.ms-total { font-weight: 700; color: #1a3a5c; }',
    '.appendix { page-break-before: always; }',

    /* Summary table */
    '.summary-table { border-collapse: collapse; margin: 0.3cm auto; font-size: 10pt; width: 100%; }',
    '.summary-table th { background: #1a3a5c; color: #fff; padding: 0.2cm 0.3cm; }',
    '.summary-table td { padding: 0.15cm 0.3cm; border: 1px solid #d0d7de; }',

    /* Print */
    '@media print {',
    '  body { font-size: 10pt; }',
    '  .cover-page { padding: 3cm 2cm; }',
    '  h2 { margin-top: 0.4cm; }',
    '  .graph-grid { page-break-inside: avoid; }',
    '}'
  ].join('\n');

  // ──────────────────────────────────────────────────────────────
  //  Content extraction helpers
  // ──────────────────────────────────────────────────────────────

  function getSvgHTML(id) {
    var el = document.getElementById(id);
    return el ? el.outerHTML : '<p>[Graph unavailable]</p>';
  }

  // ──────────────────────────────────────────────────────────────
  //  Build full workbook HTML
  // ──────────────────────────────────────────────────────────────

  function buildHTML() {
    var svg1   = getSvgHTML('graph1');
    var svg2   = getSvgHTML('graph2');
    var svg3   = getSvgHTML('graph3');
    var svg4   = getSvgHTML('graph4');
    var svg5   = getSvgHTML('graph5');
    var svg6   = getSvgHTML('graph6');
    var svg7   = getSvgHTML('graph7');
    var svg8   = getSvgHTML('graph8');
    var gridSvg = document.querySelector('.graph-container svg');
    var q5grid = gridSvg && document.contains(gridSvg) ? gridSvg.outerHTML : '';

    return '<!DOCTYPE html>\n<html lang="en">\n<head>\n<meta charset="UTF-8">\n<title>SHM — Comprehensive Workbook</title>\n<style>\n' + workbookCSS + '\n</style>\n</head>\n<body>\n' +
      coverPage() +
      '<div class="content">' +
      learningObjectives() +
      shmDefinition() +
      kinematicsSection(svg7) +
      periodFormulas() +
      socraticDerivation() +
      keyGraphs(svg1, svg2, svg3, svg4, svg5, svg6, svg8) +
      dampingSection() +
      workedExample() +
      '<div class="appendix"></div>' +
      questionsSection(q5grid) +
      markSchemeAppendix() +
      summaryEquations() +
      '</div>\n</body>\n</html>';
  }

  // ──────────────────────────────────────────────────────────────
  //  Cover page
  // ──────────────────────────────────────────────────────────────

  function coverPage() {
    return '<div class="cover-page">' +
      '<h1>Simple Harmonic Motion<br>Comprehensive Worksheet</h1>' +
      '<p class="subj">Cambridge International AS &amp; A Level Physics &mdash; 9702/4</p>' +
      '<p class="ref">Syllabus ref: 17.1 &middot; 17.2 &middot; 17.3 &middot; 17.4</p>' +
      '<div class="field"><label>Student name:</label><div class="line"></div></div>' +
      '<div class="field"><label>Date:</label><div class="line"></div></div>' +
      '</div>';
  }

  // ──────────────────────────────────────────────────────────────
  //  Learning objectives
  // ──────────────────────────────────────────────────────────────

  function learningObjectives() {
    return '<h2>Learning Objectives</h2>' +
      '<ul>' +
      '<li>define simple harmonic motion as a \u221D \u2212x and state the defining equation a = \u2212\u03C9\u00B2x</li>' +
      '<li>use the equations x = x\u2080 sin(\u03C9t), v = \u03C9x\u2080 cos(\u03C9t) and a = \u2212\u03C9\u00B2x\u2080 sin(\u03C9t)</li>' +
      '<li>derive the velocity\u2013displacement relation v = \u00B1\u03C9\u221A(x\u2080\u00B2 \u2212 x\u00B2) using conservation of energy</li>' +
      '<li>sketch and interpret graphs of x, v and a against time, showing phase relationships</li>' +
      '<li>sketch and interpret graphs of E\u2096, E\u209A and E\u209C\u2092\u209C against displacement and time</li>' +
      '<li>derive the period equations T = 2\u03C0\u221A(m/k) and T = 2\u03C0\u221A(L/g)</li>' +
      '<li>evaluate the effect of damping on amplitude, energy and resonance sharpness</li>' +
      '<li>analyse experimental data to determine SHM parameters from position, velocity and energy measurements</li>' +
      '</ul>';
  }

  // ──────────────────────────────────────────────────────────────
  //  SHM definition
  // ──────────────────────────────────────────────────────────────

  function shmDefinition() {
    return '<h2>1. Definition and Conditions for SHM</h2>' +
      '<p>A body executes <strong>simple harmonic motion</strong> if its acceleration is directly proportional to its displacement from a fixed point and directed towards that point:</p>' +
      '<div class="final-formula">a \u221D \u2212x \u00A0\u00A0\u21D2\u00A0\u00A0 a = \u2212\u03C9\u00B2x</div>' +
      '<p>where \u03C9 is the <strong>angular frequency</strong> (in rad s\u207B\u00B9). The negative sign indicates acceleration always acts towards the equilibrium position.</p>' +
      '<h3>Conditions</h3>' +
      '<ul>' +
      '<li>A restoring force (or torque) proportional to displacement from equilibrium.</li>' +
      '<li>No energy loss (ideal case); in practice, light damping may be present.</li>' +
      '<li>The system must have inertia to overshoot the equilibrium position.</li>' +
      '</ul>';
  }

  // ──────────────────────────────────────────────────────────────
  //  Kinematics of SHM
  // ──────────────────────────────────────────────────────────────

  function kinematicsSection(phaseSvg) {
    return '<h2>2. Kinematics of SHM</h2>' +
      '<p>For SHM starting at equilibrium (x = 0, t = 0):</p>' +
      '<table class="summary-table">' +
      '<tr><th>Quantity</th><th>Equation</th><th>Phase</th></tr>' +
      '<tr><td>Displacement</td><td>x = x\u2080 sin(\u03C9t)</td><td>Reference</td></tr>' +
      '<tr><td>Velocity</td><td>v = \u03C9x\u2080 cos(\u03C9t)</td><td>Leads x by \u00BC cycle</td></tr>' +
      '<tr><td>Acceleration</td><td>a = \u2212\u03C9\u00B2x\u2080 sin(\u03C9t)</td><td>Antiphase with x</td></tr>' +
      '</table>' +
      '<p><strong>Key relationships:</strong></p>' +
      '<ul>' +
      '<li>v<sub>max</sub> = \u03C9x\u2080 (occurs at x = 0)</li>' +
      '<li>a<sub>max</sub> = \u03C9\u00B2x\u2080 (occurs at x = \u00B1x\u2080)</li>' +
      '<li>Velocity lags acceleration by \u00BC cycle and leads displacement by \u00BC cycle.</li>' +
      '</ul>' +
      '<div class="graph-container">' + phaseSvg + '<p class="caption">Fig. 7: Phase relationship between x, v and a in SHM.</p></div>';
  }

  // ──────────────────────────────────────────────────────────────
  //  Period of oscillation
  // ──────────────────────────────────────────────────────────────

  function periodFormulas() {
    return '<h2>3. Period of Oscillation</h2>' +
      '<p>The period <em>T</em> of an SHM oscillator depends on the physical properties of the system:</p>' +
      '<h3>3.1 Mass\u2013Spring System</h3>' +
      '<div class="final-formula">T = 2\u03C0\u221A(m/k)</div>' +
      '<p>Derivation: From F = \u2212kx and F = ma, we get a = \u2212(k/m)x. Comparing with a = \u2212\u03C9\u00B2x gives \u03C9 = \u221A(k/m). Since T = 2\u03C0/\u03C9, we obtain T = 2\u03C0\u221A(m/k).</p>' +
      '<ul><li><strong>Independent of amplitude</strong> (isochronous oscillator).</li>' +
      '<li>Increasing mass \u2192 longer period; increasing spring constant \u2192 shorter period.</li></ul>' +

      '<h3>3.2 Simple Pendulum (small-angle approximation)</h3>' +
      '<div class="final-formula">T = 2\u03C0\u221A(L/g)</div>' +
      '<p>Derivation: Restoring torque \u03C4 = \u2212mgL sin\u03B8. For small \u03B8, sin\u03B8 \u2248 \u03B8. Using \u03C4 = I\u03B1 and I = mL\u00B2 gives \u03B1 = \u2212(g/L)\u03B8, so \u03C9 = \u221A(g/L) and T = 2\u03C0\u221A(L/g).</p>' +
      '<ul><li>Valid only for small amplitudes (\u03B8 < 10\u00B0).</li>' +
      '<li>Period independent of mass and amplitude.</li>' +
      '<li>Larger amplitudes \u2192 period slightly longer than formula predicts.</li></ul>';
  }

  // ──────────────────────────────────────────────────────────────
  //  Socratic derivation
  // ──────────────────────────────────────────────────────────────

  function socraticDerivation() {
    return '<h2>4. Socratic Derivation: v = \u00B1\u03C9\u221A(x\u2080\u00B2 \u2212 x\u00B2)</h2>' +
      '<p>We shall derive the velocity\u2013displacement relation for a particle executing SHM using the principle of conservation of mechanical energy. Consider a mass\u2013spring system with spring constant <em>k</em> and mass <em>m</em>, oscillating with amplitude x\u2080.</p>' +

      '<div class="derivation-step"><span class="step-num">Step 1</span><span class="prompt">\u25C4 Write the total mechanical energy of the system at an arbitrary displacement <em>x</em> where the particle has velocity <em>v</em>.</span><span class="result">E\u209C\u2092\u209C = \u00BDmv\u00B2 + \u00BDkx\u00B2</span></div>' +
      '<div class="derivation-step"><span class="step-num">Step 2</span><span class="prompt">\u25C4 What is the velocity at the maximum displacement x = x\u2080? Hence write E\u209C\u2092\u209C in terms of <em>k</em> and x\u2080 only.</span><span class="result">At x = x\u2080, v = 0 \u21D2 E\u209C\u2092\u209C = \u00BDkx\u2080\u00B2</span></div>' +
      '<div class="derivation-step"><span class="step-num">Step 3</span><span class="prompt">\u25C4 Energy is conserved. Equate the two expressions for E\u209C\u2092\u209C.</span><span class="result">\u00BDmv\u00B2 + \u00BDkx\u00B2 = \u00BDkx\u2080\u00B2</span></div>' +
      '<div class="derivation-step"><span class="step-num">Step 4</span><span class="prompt">\u25C4 Multiply through by 2 and rearrange to isolate the term containing v\u00B2.</span><span class="result">mv\u00B2 = kx\u2080\u00B2 \u2212 kx\u00B2 = k(x\u2080\u00B2 \u2212 x\u00B2)</span></div>' +
      '<div class="derivation-step"><span class="step-num">Step 5</span><span class="prompt">\u25C4 Divide by <em>m</em> to obtain an expression for v\u00B2.</span><span class="result">v\u00B2 = (<em>k</em>/<em>m</em>)(x\u2080\u00B2 \u2212 x\u00B2)</span></div>' +
      '<div class="derivation-step"><span class="step-num">Step 6</span><span class="prompt">\u25C4 Recall the defining relation for angular frequency in SHM: \u03C9\u00B2 = <em>k</em>/<em>m</em>. Substitute and take the square root.</span><span class="result">v\u00B2 = \u03C9\u00B2(x\u2080\u00B2 \u2212 x\u00B2) \u21D2 v = \u00B1\u03C9\u221A(x\u2080\u00B2 \u2212 x\u00B2)</span></div>' +
      '<div class="final-formula">v = \u00B1\u03C9\u221A(x\u2080\u00B2 \u2212 x\u00B2)</div>';
  }

  // ──────────────────────────────────────────────────────────────
  //  Key graphs
  // ──────────────────────────────────────────────────────────────

  function keyGraphs(s1, s2, s3, s4, s5, s6, s8) {
    return '<h2>5. Key Graphical Representations</h2>' +
      '<div class="graph-grid">' +
        '<div class="graph-container">' + s1 + '<p class="caption">Fig. 1: Energy vs displacement. E\u209A follows a parabolic curve, E\u2096 is an inverted parabola, and E\u209C\u2092\u209C remains constant.</p></div>' +
        '<div class="graph-container">' + s2 + '<p class="caption">Fig. 2: Energy vs time. E\u209A and E\u2096 oscillate at twice the frequency of the displacement.</p></div>' +
        '<div class="graph-container">' + s3 + '<p class="caption">Fig. 3: Velocity vs displacement. The elliptical locus confirms v = \u00B1\u03C9\u221A(x\u2080\u00B2 \u2212 x\u00B2).</p></div>' +
        '<div class="graph-container">' + s4 + '<p class="caption">Fig. 4: Damped oscillation \u2014 energy envelope decays as E(t) = E\u2080e\u207B\u03B3\u1D57.</p></div>' +
        '<div class="graph-container">' + s5 + '<p class="caption">Fig. 5: Comparison of undamped and lightly damped total energy.</p></div>' +
        '<div class="graph-container">' + s6 + '<p class="caption">Fig. 6: HOTS \u2014 experimental vs theoretical E\u2096 with systematic error.</p></div>' +
        '<div class="graph-container">' + s8 + '<p class="caption">Fig. 8: Resonance curves for light, medium and heavy damping.</p></div>' +
      '</div>' +
      '<h3>Key Observations</h3>' +
      '<ul>' +
      '<li>Energy conservation: E\u2096 + E\u209A is constant at every displacement.</li>' +
      '<li>Phase relationship: maximum E\u2096 occurs at equilibrium (x = 0); maximum E\u209A occurs at turning points.</li>' +
      '<li>Frequency doubling: both E\u2096 and E\u209A complete two cycles per oscillation period.</li>' +
      '<li>Velocity\u2013displacement ellipse: area enclosed is proportional to total energy.</li>' +
      '<li>Damping: energy dissipated to surroundings causes amplitude and total energy to decay.</li>' +
      '<li>Resonance: lighter damping gives a sharper, taller peak at the natural frequency.</li>' +
      '</ul>';
  }

  // ──────────────────────────────────────────────────────────────
  //  Damping and resonance
  // ──────────────────────────────────────────────────────────────

  function dampingSection() {
    return '<h2>6. Damping, Forced Oscillations and Resonance</h2>' +
      '<h3>6.1 Light, Critical and Heavy Damping</h3>' +
      '<ul>' +
      '<li><strong>Light damping:</strong> amplitude decays exponentially over many oscillations; system oscillates before stopping.</li>' +
      '<li><strong>Critical damping:</strong> returns to equilibrium in the shortest possible time without oscillating.</li>' +
      '<li><strong>Heavy damping:</strong> returns to equilibrium slowly without oscillating.</li>' +
      '</ul>' +
      '<h3>6.2 Resonance and Energy Transfer</h3>' +
      '<ul>' +
      '<li>At resonance, driving frequency matches natural frequency \u2192 amplitude is maximum.</li>' +
      '<li>Lighter damping gives a sharper, taller resonance peak at a frequency closer to f\u2080.</li>' +
      '<li>Driving force is in phase with velocity at resonance; work done by the driver is always positive.</li>' +
      '</ul>' +
      '<h3>6.3 Applications of Resonance</h3>' +
      '<table class="summary-table">' +
      '<tr><th>Useful resonance</th><th>Example</th><th>Harmful resonance</th><th>Example</th></tr>' +
      '<tr><td>Microwave ovens</td><td>Water molecules resonate at ~2.45 GHz</td><td>Bridge oscillations</td><td>Tacoma Narrows (1940)</td></tr>' +
      '<tr><td>Musical instruments</td><td>Strings/air columns resonate at harmonics</td><td>Engine vibration</td><td>Dampers absorb resonant frequencies</td></tr>' +
      '<tr><td>MR and NMR</td><td>Nuclei resonate in magnetic field</td><td>Building in earthquakes</td><td>Tuned mass dampers used in skyscrapers</td></tr>' +
      '</table>' +
      '<h3>6.4 Effect of Damping on Resonance</h3>' +
      '<ul>' +
      '<li>Increasing damping reduces the amplitude at resonance.</li>' +
      '<li>The resonance peak broadens and shifts to slightly lower frequency.</li>' +
      '<li>At very high damping, the resonance peak disappears entirely.</li>' +
      '</ul>';
  }

  // ──────────────────────────────────────────────────────────────
  //  Worked example
  // ──────────────────────────────────────────────────────────────

  function workedExample() {
    return '<h2>7. Worked Example</h2>' +
      '<div class="example-box">' +
      '<p><strong>Problem:</strong> A 200 g mass oscillates on a spring of spring constant 50 N m\u207B\u00B9 with amplitude 4.0 cm. Determine:</p>' +
      '<p>(a) the total mechanical energy of the system;<br>(b) the speed when displacement is 2.0 cm;<br>(c) E\u2096 and E\u209A at this displacement.</p>' +
      '<p><strong>Solution:</strong></p>' +
      '<p><strong>(a)</strong> E\u209C\u2092\u209C = \u00BDkx\u2080\u00B2 = \u00BD \u00D7 50 \u00D7 (0.040)\u00B2 = <strong>4.0 \u00D7 10\u207B\u00B2 J = 40 mJ</strong></p>' +
      '<p><strong>(b)</strong> \u03C9 = \u221A(k/m) = \u221A(50/0.200) = 15.81 rad s\u207B\u00B9. At x = 0.020 m: v = 15.81 \u00D7 \u221A(0.040\u00B2 \u2212 0.020\u00B2) = <strong>0.548 m s\u207B\u00B9</strong></p>' +
      '<p><strong>(c)</strong> E\u209A = \u00BDkx\u00B2 = \u00BD \u00D7 50 \u00D7 0.020\u00B2 = <strong>10 mJ</strong>. E\u2096 = E\u209C\u2092\u209C \u2212 E\u209A = <strong>30 mJ</strong>.</p>' +
      '</div>' +
      '<div class="answer-space"></div>';
  }

  // ──────────────────────────────────────────────────────────────
  //  Questions (with answer spaces)
  // ──────────────────────────────────────────────────────────────

  function questionsSection(q5grid) {
    return '<h2>8. Practice Questions</h2>' +
      q1() + q2() + q3() + q4() + q5(q5grid) + q6() + q7();
  }

  function q1() {
    return '<div class="question">' +
      '<p class="q-header">Question 1 \u2014 Graphical Analysis of Experimental Error [7]</p>' +
      '<p class="q-context">A student investigates energy conservation in a mass\u2013spring system using a motion sensor. The experimental E\u2096\u2013x plot lies ~8% below the theoretical curve, with error bars of \u00B14%. The discrepancy is largest near x = 0.</p>' +
      '<div class="q-part"><span class="cmd-word">(a)</span> Describe the difference between the theoretical and experimental E\u2096 curves. Explain whether the discrepancy is within experimental uncertainty. <span class="marks">[2]</span></div><div class="answer-space" style="min-height:3.5cm;"></div>' +
      '<div class="q-part"><span class="cmd-word">(b)</span> Suggest one physical cause for the systematic energy loss. <span class="marks">[2]</span></div><div class="answer-space" style="min-height:3cm;"></div>' +
      '<div class="q-part"><span class="cmd-word">(c)</span> Evaluate how the experimental E\u209C\u2092\u209C would appear. Sketch the graph. <span class="marks">[3]</span></div><div class="answer-space" style="min-height:4cm;"></div>' +
      '</div>';
  }

  function q2() {
    return '<div class="question">' +
      '<p class="q-header">Question 2 \u2014 Evaluating Experimental Limitations [7]</p>' +
      '<p class="q-context">A student uses a motion sensor (\u00B10.2 cm) and force sensor (\u00B10.01 N) with m = 0.200 \u00B1 0.001 kg, \u03C9 = 5.0 \u00B1 0.1 rad s\u207B\u00B9, x\u2080 = 5.0 \u00B1 0.1 cm.</p>' +
      '<div class="q-part"><span class="cmd-word">(a)</span> Calculate the percentage uncertainty in E\u2096 at equilibrium. State E\u2096 with its absolute uncertainty. <span class="marks">[3]</span></div><div class="answer-space" style="min-height:4cm;"></div>' +
      '<div class="q-part"><span class="cmd-word">(b)</span> Explain why apparent total energy may increase near turning points. <span class="marks">[2]</span></div><div class="answer-space" style="min-height:3cm;"></div>' +
      '<div class="q-part"><span class="cmd-word">(c)</span> Evaluate whether a 50 Hz logger can reliably measure maximum E\u2096 for T = 0.80 s. <span class="marks">[2]</span></div><div class="answer-space" style="min-height:3cm;"></div>' +
      '</div>';
  }

  function q3() {
    return '<div class="question">' +
      '<p class="q-header">Question 3 \u2014 Predicting the Effect of Damping [7]</p>' +
      '<p class="q-context">A mass\u2013spring system oscillates in a viscous fluid with light damping. Initial amplitude x\u2080, initial total energy E\u2080 = \u00BDkx\u2080\u00B2.</p>' +
      '<div class="q-part"><span class="cmd-word">(a)</span> Sketch E\u209C\u2092\u209C against t for undamped and lightly damped cases. Label E\u2080 and three successive maxima. <span class="marks">[3]</span></div><div class="answer-space" style="min-height:4cm;"></div>' +
      '<div class="q-part"><span class="cmd-word">(b)</span> Explain why amplitude decays exponentially rather than linearly. <span class="marks">[2]</span></div><div class="answer-space" style="min-height:3cm;"></div>' +
      '<div class="q-part"><span class="cmd-word">(c)</span> Predict how resonance frequency changes as damping increases. <span class="marks">[2]</span></div><div class="answer-space" style="min-height:3cm;"></div>' +
      '</div>';
  }

  function q4() {
    return '<div class="question">' +
      '<p class="q-header">Question 4 \u2014 Comparing Energy in Different SHM Systems [7]</p>' +
      '<p class="q-context">Compare: (i) mass\u2013spring on frictionless surface, (ii) simple pendulum at small angle.</p>' +
      '<div class="q-part"><span class="cmd-word">(a)</span> State the forms of energy at max displacement and equilibrium for each. Tabulate. <span class="marks">[2]</span></div><div class="answer-space" style="min-height:3cm;"></div>' +
      '<div class="q-part"><span class="cmd-word">(b)</span> Explain why the pendulum is only approximately SHM for small angles. <span class="marks">[2]</span></div><div class="answer-space" style="min-height:3cm;"></div>' +
      '<div class="q-part"><span class="cmd-word">(c)</span> Discuss whether total mechanical energy is conserved in a real pendulum. What evidence would you look for? <span class="marks">[3]</span></div><div class="answer-space" style="min-height:3.5cm;"></div>' +
      '</div>';
  }

  function q5(grid) {
    var tableHTML = '<table class="data-table"><tr><th>x / cm</th><td>0.0</td><td>1.0</td><td>2.0</td><td>3.0</td><td>4.0</td><td>5.0</td></tr><tr><th>E\u2096 / mJ</th><td>45.0</td><td>42.8</td><td>36.0</td><td>24.5</td><td>8.0</td><td>0.0</td></tr></table>';

    return '<div class="question">' +
      '<p class="q-header">Question 5 \u2014 Data Evaluation and Determination of Parameters [8]</p>' +
      '<p class="q-context">A student records E\u2096 of a 50 g mass at various displacements. Data:</p>' +
      tableHTML +
      '<div class="q-part"><span class="cmd-word">(a)</span> Plot E\u2096 against x\u00B2 and determine x\u2080 and \u03C9. <span class="marks">[4]</span></div><div class="answer-space" style="min-height:6cm;"><p style="color:#999;font-size:9pt;">[Use the grid on the next page or a separate sheet]</p></div>' +
      '<div class="q-part"><span class="cmd-word">(b)</span> Estimate total energy and spring constant k. <span class="marks">[2]</span></div><div class="answer-space" style="min-height:2.5cm;"></div>' +
      '<div class="q-part"><span class="cmd-word">(c)</span> Explain how results differ if spring mass (20 g) is non-negligible. Is calculated \u03C9 overestimated or underestimated? <span class="marks">[2]</span></div><div class="answer-space" style="min-height:3cm;"></div>' +
      '</div>';
  }

  function q6() {
    return '<div class="question">' +
      '<p class="q-header">Question 6 \u2014 Resonance Curve Analysis [7]</p>' +
      '<p class="q-context">A student investigates the amplitude of a driven oscillator at various driving frequencies. The system has a natural frequency f\u2080 = 2.0 Hz. Three trials are conducted with increasing levels of damping (light, medium, heavy).</p>' +
      '<div class="q-part"><span class="cmd-word">(a)</span> Sketch the three resonance curves (amplitude against driving frequency) on the same axes. Label f\u2080 and indicate the peak amplitude for each case. <span class="marks">[3]</span></div><div class="answer-space" style="min-height:4cm;"></div>' +
      '<div class="q-part"><span class="cmd-word">(b)</span> Explain why the resonance peak for light damping is sharper and taller than for heavy damping. Refer to energy transfer in your answer. <span class="marks">[2]</span></div><div class="answer-space" style="min-height:3cm;"></div>' +
      '<div class="q-part"><span class="cmd-word">(c)</span> Predict what would happen to the resonance frequency if the mass of the oscillator were doubled. Justify your answer. <span class="marks">[2]</span></div><div class="answer-space" style="min-height:3cm;"></div>' +
      '</div>';
  }

  function q7() {
    var table = '<table class="data-table"><tr><th>t / s</th><td>0.00</td><td>0.26</td><td>0.52</td><td>0.79</td><td>1.05</td><td>1.31</td></tr><tr><th>x / cm</th><td>0.00</td><td>2.83</td><td>4.00</td><td>2.83</td><td>0.00</td><td>\u22122.83</td></tr><tr><th>v / cm s\u207B\u00B9</th><td>12.00</td><td>8.49</td><td>0.00</td><td>\u22128.49</td><td>\u221212.00</td><td>\u22128.49</td></tr></table>';

    return '<div class="question">' +
      '<p class="q-header">Question 7 \u2014 Phase Relationships in SHM [7]</p>' +
      '<p class="q-context">A particle executes SHM according to x = (4.0 cm) sin(3.0t). A student measures displacement and velocity simultaneously and records:</p>' +
      table +
      '<div class="q-part"><span class="cmd-word">(a)</span> Verify that the data are consistent with v = \u03C9x\u2080 cos(\u03C9t). Determine \u03C9 and x\u2080 from the data. <span class="marks">[3]</span></div><div class="answer-space" style="min-height:3.5cm;"></div>' +
      '<div class="q-part"><span class="cmd-word">(b)</span> Calculate the acceleration at t = 0.52 s and state its direction. <span class="marks">[2]</span></div><div class="answer-space" style="min-height:2.5cm;"></div>' +
      '<div class="q-part"><span class="cmd-word">(c)</span> Sketch the acceleration\u2013time graph for the first complete cycle. On the same axes, sketch the displacement\u2013time graph and indicate the phase difference between them. <span class="marks">[2]</span></div><div class="answer-space" style="min-height:4cm;"></div>' +
      '</div>';
  }

  // ──────────────────────────────────────────────────────────────
  //  Mark scheme appendix
  // ──────────────────────────────────────────────────────────────

  function markSchemeAppendix() {
    return '<h2>9. Mark Scheme Appendix</h2>' +
      '<p style="font-size:10pt;color:#636c76;">Cambridge 9702 convention: M1/A1/B1. M = method, A = answer, B = independent mark.</p>' +
      '<h3>Question 1 [7]</h3>' +
      '<div class="mark-scheme"><div class="ms-point">(a) M1: Experimental curve consistently below theoretical at all displacements. A1: Error bars (\u00B14%) smaller than deviation (~8%) \u2192 systematic error present. [2]</div>' +
      '<div class="ms-point">(b) M1: Energy loss due to damping (air resistance / internal friction). A1: Mechanical energy converted to thermal energy. [2]</div>' +
      '<div class="ms-point">(c) M1: E\u209C\u2092\u209C not constant — decreases over time. A1: Sketch showing step-like or monotonic decay. A1: E\u209C\u2092\u209C = E\u2096 + E\u209A; low E\u2096 gives E\u209C\u2092\u209C below \u00BDkx\u2080\u00B2. [3]</div><p class="ms-total">Total: [7]</p></div>' +

      '<h3>Question 2 [7]</h3>' +
      '<div class="mark-scheme"><div class="ms-point">(a) M1: v = \u03C9x\u2080 = 0.250 m s\u207B\u00B9; E\u2096 = 6.25 mJ; \u0394v/v = 0.04, \u0394(v\u00B2)/v\u00B2 = 0.08. A1: \u0394E\u2096/E\u2096 = 0.085 = 8.5%. A1: \u0394E\u2096 = 0.53 mJ; E\u2096 = (6.25 \u00B1 0.53) mJ. [3]</div>' +
      '<div class="ms-point">(b) M1: Turning points: v \u2248 0 but displacement reading may lag. A1: Non-simultaneous measurements cause E\u209C\u2092\u209C = E\u2096 + E\u209A to appear > initial. [2]</div>' +
      '<div class="ms-point">(c) M1: T = 0.80 s gives f = 1.25 Hz; 50 / 1.25 = 40 samples/period. A1: ~9\u00B0 intervals sufficient to resolve E\u2096 max to ~1%. Reliable. [2]</div><p class="ms-total">Total: [7]</p></div>' +

      '<h3>Question 3 [7]</h3>' +
      '<div class="mark-scheme"><div class="ms-point">(a) B1: Undamped: horizontal line at E\u2080. B1: Damped: decaying curve from E\u2080. B1: Three decreasing maxima on exponential envelope. [3]</div>' +
      '<div class="ms-point">(b) M1: Energy lost per cycle \u221D energy stored (force \u221D velocity). A1: dE/dt \u221D \u2212E \u2192 E(t) = E\u2080e\u207B\u03B3\u1D57; A(t) = A\u2080e\u207B\u03B3\u1D57/\u00B2. [2]</div>' +
      '<div class="ms-point">(c) M1: Resonance frequency decreases slightly. A1: Damping reduces effective restoring force; peak shifts to lower frequencies, broadens. [2]</div><p class="ms-total">Total: [7]</p></div>' +

      '<h3>Question 4 [7]</h3>' +
      '<div class="mark-scheme"><div class="ms-point">(a) B1: Mass\u2013spring: max disp \u2192 elastic PE; equilibrium \u2192 KE. B1: Pendulum: max disp \u2192 gravitational PE; equilibrium \u2192 KE. [2]</div>' +
      '<div class="ms-point">(b) M1: F = \u2212mg sin\u03B8. A1: For small \u03B8, sin\u03B8 \u2248 \u03B8 \u2192 F \u2248 \u2212(mg/L)x \u2192 SHM. Deviates for larger \u03B8. [2]</div>' +
      '<div class="ms-point">(c) M1: Not strictly conserved due to air resistance and pivot friction. B1: Amplitude decreases over time. B1: Energy dissipated as thermal energy. [3]</div><p class="ms-total">Total: [7]</p></div>' +

      '<h3>Question 5 [8]</h3>' +
      '<div class="mark-scheme"><div class="ms-point">(a) M1: x\u00B2 values: 0, 1, 4, 9, 16, 25 cm\u00B2. Plot (x\u00B2, E\u2096). A1: Best-fit straight line. M1: x-intercept = x\u2080\u00B2 = 25 \u2192 x\u2080 = 5.0 cm. A1: Gradient = \u2212\u00BDm\u03C9\u00B2 = \u221218 J m\u207B\u00B2 \u2192 \u03C9\u00B2 = 720 \u2192 \u03C9 = 26.8 rad s\u207B\u00B9. [4]</div>' +
      '<div class="ms-point">(b) M1: E\u209C\u2092\u209C = E\u2096(x=0) = 45.0 mJ. A1: k = m\u03C9\u00B2 = 36 N m\u207B\u00B9. [2]</div>' +
      '<div class="ms-point">(c) M1: Spring mass adds to inertia. A1: \u03C9 = \u221A(k/m_eff), larger m_eff \u2192 smaller \u03C9. The calculated value is an overestimate. [2]</div><p class="ms-total">Total: [8]</p></div>' +

      '<h3>Question 6 [7]</h3>' +
      '<div class="mark-scheme"><div class="ms-point">(a) B1: Three curves with peaks at approximately f\u2080 (or slightly below for heavier damping). B1: Light damping curve has tallest, narrowest peak; heavy damping has shortest, widest. B1: f\u2080 marked at 2.0 Hz on frequency axis. [3]</div>' +
      '<div class="ms-point">(b) M1: With light damping, less energy is dissipated per cycle, so the oscillator can store more energy and reach larger amplitude. A1: The driving force does positive work near resonance; with less damping, energy accumulates, producing a taller peak. [2]</div>' +
      '<div class="ms-point">(c) M1: For a mass\u2013spring system, f\u2080 = (1/2\u03C0)\u221A(k/m). A1: Doubling mass reduces f\u2080 by a factor of \u221A2 (to approximately 1.4 Hz). [2]</div><p class="ms-total">Total: [7]</p></div>' +

      '<h3>Question 7 [7]</h3>' +
      '<div class="mark-scheme"><div class="ms-point">(a) M1: From data, maximum x = 4.0 cm = x\u2080. v<sub>max</sub> = 12.0 cm s\u207B\u00B9 at t = 0 (x = 0). A1: \u03C9 = v<sub>max</sub>/x\u2080 = 12.0/4.0 = 3.0 rad s\u207B\u00B9. M1: At t = 0.26 s, \u03C9t = 0.78 rad; predicted x = 4.0 sin(0.78) = 2.81 cm, v = 12.0 cos(0.78) = 8.56 cm s\u207B\u00B9. Both within rounding of measured values. [3]</div>' +
      '<div class="ms-point">(b) M1: a = \u2212\u03C9\u00B2x = \u2212(3.0)\u00B2 \u00D7 4.0 = \u221236 cm s\u207B\u00B2 (or \u22120.36 m s\u207B\u00B2). A1: Negative sign means acceleration is directed towards equilibrium (downwards/leftwards). [2]</div>' +
      '<div class="ms-point">(c) M1: a\u2013t graph is a sine wave with opposite sign to x\u2013t graph. A1: Acceleration is antiphase (phase difference of \u03C0 radians or 180\u00B0) with displacement. [2]</div><p class="ms-total">Total: [7]</p></div>';
  }

  // ──────────────────────────────────────────────────────────────
  //  Summary
  // ──────────────────────────────────────────────────────────────

  function summaryEquations() {
    return '<h2>10. Summary of Key Equations</h2>' +
      '<table class="summary-table">' +
      '<tr><th>Quantity</th><th>Equation</th><th>Notes</th></tr>' +
      '<tr><td>Definition of SHM</td><td>a = \u2212\u03C9\u00B2x</td><td>Acceleration \u221D \u2212displacement</td></tr>' +
      '<tr><td>Displacement</td><td>x = x\u2080 sin(\u03C9t)</td><td>Or x = x\u2080 cos(\u03C9t)</td></tr>' +
      '<tr><td>Velocity</td><td>v = \u03C9x\u2080 cos(\u03C9t)</td><td>Leads x by T/4</td></tr>' +
      '<tr><td>Acceleration</td><td>a = \u2212\u03C9\u00B2x\u2080 sin(\u03C9t)</td><td>Antiphase with x</td></tr>' +
      '<tr><td>Velocity\u2013displacement</td><td>v = \u00B1\u03C9\u221A(x\u2080\u00B2 \u2212 x\u00B2)</td><td>From energy conservation</td></tr>' +
      '<tr><td>Total energy</td><td>E\u209C\u2092\u209C = \u00BDkx\u2080\u00B2</td><td>Constant in ideal SHM</td></tr>' +
      '<tr><td>Kinetic energy</td><td>E\u2096 = \u00BDm\u03C9\u00B2(x\u2080\u00B2 \u2212 x\u00B2)</td><td>Maximum at x = 0</td></tr>' +
      '<tr><td>Potential energy</td><td>E\u209A = \u00BDkx\u00B2</td><td>Maximum at x = \u00B1x\u2080</td></tr>' +
      '<tr><td>Angular frequency</td><td>\u03C9 = 2\u03C0f = \u221A(k/m)</td><td>Mass\u2013spring system</td></tr>' +
      '<tr><td>Period (spring)</td><td>T = 2\u03C0\u221A(m/k)</td><td>Independent of amplitude</td></tr>' +
      '<tr><td>Period (pendulum)</td><td>T = 2\u03C0\u221A(L/g)</td><td>Small-angle approx.</td></tr>' +
      '<tr><td>Damped energy</td><td>E(t) = E\u2080e\u207B\u03B3\u1D57</td><td>\u03B3 = damping constant</td></tr>' +
      '</table>';
  }

  // ──────────────────────────────────────────────────────────────
  //  Public API
  // ──────────────────────────────────────────────────────────────

  var API = {
    /** Generate the full workbook HTML string */
    generateHTML: buildHTML,

    /** Preview in new tab */
    preview: function () {
      var html = buildHTML();
      var win = window.open('', '_blank');
      if (!win) {
        alert('Please allow pop-ups for this site to preview the workbook.');
        return;
      }
      win.document.write(html);
      win.document.close();
      win.focus();
    },

    /** Download as DOCX (Word-compatible HTML) */
    downloadDOCX: function () {
      var html = buildHTML();
      var blob = new Blob([html], { type: 'application/msword' });
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href = url;
      a.download = 'shm-energy-interchange-workbook.doc';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(function () { URL.revokeObjectURL(url); }, 5000);
    }
  };

  window.Workbook = API;
})();
