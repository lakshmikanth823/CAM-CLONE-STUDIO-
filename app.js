/* ==========================================================================
   CAMCLONE STUDIO - CORE APPLICATION JS ENGINE
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  // --- APPLICATION STATE ---
  const state = {
    activeTab: 'academy',
    
    // Simulator Settings
    sensorCrop: 1.0, // Crop factor (1.0 = FF, 1.5 = APS-C, 2.0 = M43)
    focalLength: 50,  // in mm
    focusDistance: 3.0, // in meters
    apertureIdx: 3,   // index in apertures array
    shutterIdx: 6,    // index in shutters array
    isoIdx: 2,        // index in ISOs array
    showGrid: false,
    autoExposure: false,
    
    // Webcam Clone Lab
    webcamStream: null,
    webcamActive: false,
    capturedFrames: [null, null, null, null], // array of offscreen canvas/image elements
    cloneMethod: 'split', // 'split' or 'brush'
    splitRatio: 0.5,      // 0.0 to 1.0
    activeBrushSlot: 2,   // slot index currently being brushed (2, 3, or 4)
    brushSize: 40,
    brushSoftness: 50,
    isDrawing: false,
    brushMode: 'paint',   // 'paint' or 'erase'
    brushMasks: [null, null, null, null], // canvases holding the black/white alpha masks for layers 1, 2, 3
    activeFilter: 'none',
    onionSkinEnabled: false,

    // Math Visualizer Settings
    math: {
      x: 2.5,
      y: -1.5,
      z: 8.0,
      focal: 50
    }
  };

  // --- DATA CONSTANTS ---
  const apertures = [1.2, 1.8, 2.8, 4.0, 5.6, 8.0, 11, 16, 22];
  const apertureLabels = ['f/1.2', 'f/1.8', 'f/2.8', 'f/4.0', 'f/5.6', 'f/8.0', 'f/11', 'f/16', 'f/22'];
  
  const shutters = [1/4000, 1/2000, 1/1000, 1/500, 1/250, 1/125, 1/60, 1/30, 1/15, 1/8, 1/4, 1/2, 1];
  const shutterLabels = ['1/4000', '1/2000', '1/1000', '1/500', '1/250', '1/125', '1/60', '1/30', '1/15', '1/8', '1/4', '1/2', '1"'];

  const isos = [100, 200, 400, 800, 1600, 3200, 6400, 12800];

  // Base Ambient Exposure Value of the virtual scene
  const SCENE_AMBIENT_EV = 10.5; 

  // Photo gallery roll array
  const photoGallery = [];

  // --- HTML DOM ELEMENT REFERENCES ---
  const dom = {
    // Navigation
    navBtns: document.querySelectorAll('.nav-btn'),
    tabPanes: document.querySelectorAll('.tab-pane'),
    
    // Tab 1: Simulator View
    simCanvas: document.getElementById('simulator-canvas'),
    hudAperture: document.getElementById('hud-aperture'),
    hudShutter: document.getElementById('hud-shutter'),
    hudIso: document.getElementById('hud-iso'),
    hudFocal: document.getElementById('hud-focal'),
    hudExposureNeedle: document.getElementById('hud-exposure-needle'),
    exposureOverlayDark: document.getElementById('exposure-overlay-dark'),
    exposureOverlayBright: document.getElementById('exposure-overlay-bright'),
    viewfinderGrid: document.getElementById('viewfinder-grid'),
    focusBeep: document.getElementById('focus-beep'),
    cameraRoll: document.getElementById('camera-roll'),
    
    // Tab 1: Simulator Controls
    sensorBtns: document.querySelectorAll('.sensor-btn'),
    sensorBadge: document.getElementById('sensor-badge'),
    focalLengthRange: document.getElementById('focal-length-range'),
    valFocal: document.getElementById('val-focal'),
    focusDistanceRange: document.getElementById('focus-distance-range'),
    valFocus: document.getElementById('val-focus'),
    apertureRange: document.getElementById('aperture-range'),
    valAperture: document.getElementById('val-aperture'),
    shutterRange: document.getElementById('shutter-range'),
    valShutter: document.getElementById('val-shutter'),
    isoRange: document.getElementById('iso-range'),
    valIso: document.getElementById('val-iso'),
    apertureLabelsDiv: document.getElementById('aperture-labels'),
    shutterLabelsDiv: document.getElementById('shutter-labels'),
    isoLabelsDiv: document.getElementById('iso-labels'),
    toggleGridBtn: document.getElementById('toggle-grid-btn'),
    shutterTriggerBtn: document.getElementById('shutter-trigger-btn'),
    autoExposureBtn: document.getElementById('auto-exposure-btn'),

    // Tab 2: Webcam Clone Lab
    cloneCanvas: document.getElementById('clone-canvas'),
    webcamStream: document.getElementById('webcam-stream'),
    webcamStatusDot: document.querySelector('#webcam-status-indicator .status-dot'),
    webcamStatusText: document.getElementById('webcam-status-text'),
    shotSlots: document.querySelectorAll('.shot-slot'),
    captureButtons: document.querySelectorAll('.capture-slot-btn'),
    onionSkinToggle: document.getElementById('onion-skin-toggle'),
    methodBtns: document.querySelectorAll('.method-btn'),
    splitModeControls: document.getElementById('split-mode-controls'),
    brushModeControls: document.getElementById('brush-mode-controls'),
    splitRatioRange: document.getElementById('split-ratio-range'),
    brushLayersList: document.getElementById('brush-layers-list'),
    brushLayerBtns: document.querySelectorAll('.brush-layer-btn'),
    brushPaintBtn: document.getElementById('brush-paint-btn'),
    brushEraseBtn: document.getElementById('brush-erase-btn'),
    brushSizeRange: document.getElementById('brush-size-range'),
    valBrushSize: document.getElementById('val-brush-size'),
    brushHardnessRange: document.getElementById('brush-hardness-range'),
    valBrushHardness: document.getElementById('val-brush-hardness'),
    brushRing: document.getElementById('brush-ring'),
    filterBtns: document.querySelectorAll('.filter-btn'),
    clearCloneBtn: document.getElementById('clear-clone-btn'),
    downloadCloneBtn: document.getElementById('download-clone-btn'),

    // Tab 3: Math Visualizer
    mathSandboxCanvas: document.getElementById('math-sandbox-canvas'),
    mathX: document.getElementById('math-x'),
    valMathX: document.getElementById('val-math-x'),
    mathY: document.getElementById('math-y'),
    valMathY: document.getElementById('val-math-y'),
    mathZ: document.getElementById('math-z'),
    valMathZ: document.getElementById('val-math-z'),
    mathFocal: document.getElementById('math-focal'),
    valMathF: document.getElementById('val-math-f'),
    mathCalcXExpr: document.getElementById('math-calc-x-expr'),
    mathCalcXRes: document.getElementById('math-calc-x-res'),
    mathCalcYExpr: document.getElementById('math-calc-y-expr'),
    mathCalcYRes: document.getElementById('math-calc-y-res'),
    mathPixelU: document.getElementById('math-pixel-u'),
    mathPixelV: document.getElementById('math-pixel-v')
  };

  // --- AUDIO SYNTHESIZER (WEB AUDIO API) ---
  function playShutterSound() {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      
      // Step 1: Mechanical "Ch" Click
      const bufferSize = audioCtx.sampleRate * 0.15; // 150ms
      const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      
      const whiteNoise = audioCtx.createBufferSource();
      whiteNoise.buffer = buffer;
      
      const filter = audioCtx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1000, audioCtx.currentTime);
      filter.Q.setValueAtTime(3, audioCtx.currentTime);
      
      const gainNode = audioCtx.createGain();
      gainNode.gain.setValueAtTime(0.5, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.12);
      
      whiteNoise.connect(filter);
      filter.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      
      whiteNoise.start();
      
      // Step 2: Metallic "Click"
      const osc = audioCtx.createOscillator();
      const oscGain = audioCtx.createGain();
      
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(1200, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(100, audioCtx.currentTime + 0.08);
      
      oscGain.gain.setValueAtTime(0.2, audioCtx.currentTime);
      oscGain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.08);
      
      osc.connect(oscGain);
      oscGain.connect(audioCtx.destination);
      
      osc.start();
      osc.stop(audioCtx.currentTime + 0.08);
    } catch (e) {
      console.warn("Web Audio API not fully supported or blocked by user gesture:", e);
    }
  }

  // --- INITIALIZE UI LABELS ---
  function initUILabels() {
    // Generate Aperture range ticks
    dom.apertureLabelsDiv.innerHTML = apertureLabels.map((lbl, idx) => `<span>${lbl}</span>`).join('');
    // Generate Shutter range ticks
    dom.shutterLabelsDiv.innerHTML = shutterLabels.map((lbl, idx) => `<span>${lbl}</span>`).join('');
    // Generate ISO range ticks
    dom.isoLabelsDiv.innerHTML = isos.map(iso => `<span>${iso}</span>`).join('');
  }
  initUILabels();

  // --- REUSABLE TAB SWITCHER ---
  function switchTab(tabId) {
    state.activeTab = tabId;
    
    // Switch active nav buttons
    dom.navBtns.forEach(b => {
      b.classList.toggle('active', b.getAttribute('data-tab') === tabId);
    });
    
    // Switch active panels
    dom.tabPanes.forEach(pane => {
      pane.classList.toggle('active', pane.id === `${tabId}-tab`);
    });

    // Special initializations on tab switch
    if (tabId === 'clone-lab') {
      initWebcam();
    } else if (tabId === 'math-visualizer') {
      renderMathVisualizer();
    }
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // --- GENERAL NAVIGATION ---
  dom.navBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const tabId = btn.getAttribute('data-tab');
      switchTab(tabId);
    });
  });

  // ==========================================================================
  // MODULE 1: INTERACTIVE CAMERA SIMULATOR ENGINE
  // ==========================================================================
  const simCtx = dom.simCanvas.getContext('2d');
  
  // Dynamic Scene Elements
  const scene = {
    // Foreground: Flower pot at 1.5m
    foreground: {
      distance: 1.5,
      color: '#ff3b30',
      draw: (ctx) => {
        // Draw standard pot
        ctx.fillStyle = '#c05c3c';
        ctx.beginPath();
        ctx.moveTo(100, 380);
        ctx.lineTo(130, 380);
        ctx.lineTo(125, 450);
        ctx.lineTo(105, 450);
        ctx.closePath();
        ctx.fill();
        // Flower stems
        ctx.strokeStyle = '#2d6a4f';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(115, 380);
        ctx.quadraticCurveTo(100, 340, 110, 300);
        ctx.stroke();
        // Red Flower blossom
        ctx.fillStyle = '#ff3b30';
        ctx.beginPath();
        ctx.arc(110, 300, 16, 0, Math.PI*2);
        ctx.fill();
        ctx.fillStyle = '#ffd60a';
        ctx.beginPath();
        ctx.arc(110, 300, 6, 0, Math.PI*2);
        ctx.fill();
      }
    },
    // Midground: Rotating Windmill pinwheel at 3.0m
    midground: {
      distance: 3.0,
      angle: 0,
      draw: (ctx, motionBlurFactor) => {
        const cx = 400;
        const cy = 250;
        
        // Pinwheel Stand
        ctx.fillStyle = '#8e8e93';
        ctx.fillRect(cx - 3, cy, 6, 200);

        // Render blades. If Shutter speed is slow, we draw multiple stacked blades to create a realistic motion blur!
        const blurSubdivisions = Math.max(1, Math.round(motionBlurFactor * 25));
        const alpha = Math.max(0.1, 1 / blurSubdivisions);
        
        for (let s = 0; s < blurSubdivisions; s++) {
          const frameAngle = scene.midground.angle - (s * (motionBlurFactor * 0.45) / blurSubdivisions);
          ctx.save();
          ctx.translate(cx, cy);
          ctx.rotate(frameAngle);
          
          // Draw 4 colorful blades
          const colors = ['#007aff', '#ffd60a', '#34c759', '#ff3b30'];
          for (let i = 0; i < 4; i++) {
            ctx.rotate(Math.PI / 2);
            ctx.fillStyle = colors[i];
            ctx.globalAlpha = alpha;
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.quadraticCurveTo(20, -35, 10, -70);
            ctx.quadraticCurveTo(0, -50, 0, 0);
            ctx.closePath();
            ctx.fill();
          }
          ctx.restore();
        }
        
        // Pinwheel center pin
        ctx.fillStyle = '#f0f2f5';
        ctx.beginPath();
        ctx.arc(cx, cy, 8, 0, Math.PI*2);
        ctx.fill();
        ctx.fillStyle = '#1c1c1e';
        ctx.beginPath();
        ctx.arc(cx, cy, 3, 0, Math.PI*2);
        ctx.fill();
      }
    },
    // Background: Mountain & Sky at 25.0m
    background: {
      distance: 25.0,
      draw: (ctx) => {
        // Sky Gradient
        const skyGrad = ctx.createLinearGradient(0, 0, 0, 300);
        skyGrad.addColorStop(0, '#101726');
        skyGrad.addColorStop(1, '#2c3e6b');
        ctx.fillStyle = skyGrad;
        ctx.fillRect(0, 0, 800, 500);

        // Distant Glowing Sun
        ctx.fillStyle = 'rgba(255, 230, 100, 0.2)';
        ctx.beginPath();
        ctx.arc(600, 120, 90, 0, Math.PI*2);
        ctx.fill();
        ctx.fillStyle = 'rgba(255, 230, 100, 0.6)';
        ctx.beginPath();
        ctx.arc(600, 120, 50, 0, Math.PI*2);
        ctx.fill();

        // Background mountains
        ctx.fillStyle = '#1c2230';
        ctx.beginPath();
        ctx.moveTo(0, 320);
        ctx.lineTo(200, 180);
        ctx.lineTo(450, 350);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = '#151a24';
        ctx.beginPath();
        ctx.moveTo(250, 350);
        ctx.lineTo(550, 140);
        ctx.lineTo(800, 330);
        ctx.closePath();
        ctx.fill();

        // Ambient ground plane
        ctx.fillStyle = '#0f121a';
        ctx.fillRect(0, 350, 800, 150);
      }
    }
  };

  // --- CALCULATION FORMULAS ---
  function calculateExposure() {
    const N = apertures[state.apertureIdx];
    const t = shutters[state.shutterIdx];
    const ISO = isos[state.isoIdx];
    
    // EV formula: EV = log2(N^2 / t)
    const EV_camera = Math.log2(Math.pow(N, 2) / t);
    
    // Adjusted EV for ISO: Higher ISO lowers required ambient light
    // EV_iso = EV_camera - log2(ISO/100)
    const EV_settings = EV_camera - Math.log2(ISO / 100);
    
    // EV Difference
    const exposureDiff = SCENE_AMBIENT_EV - EV_settings;
    return exposureDiff; // 0 is perfect exposure, negative is dark, positive is overexposed
  }

  function getBlurAmount(layerDistance) {
    const D_f = state.focusDistance;
    const f = state.focalLength * state.sensorCrop; // cropped focal length
    const N = apertures[state.apertureIdx];
    
    // Hyperfocal/CoC formula simplified:
    // Blur is proportional to Aperture diameter (f / N) and mismatch in focus
    const mismatch = Math.abs(1 / layerDistance - 1 / D_f);
    
    // Blur coefficient scaled for premium visual effect on canvas
    const baseBlur = mismatch * (Math.pow(f, 1.8) / N) * 0.12;
    return Math.min(25, baseBlur); // cap at 25px blur
  }

  // --- SIMULATOR RENDER LOOP ---
  let lastTime = 0;
  function updateAndRenderSimulator(time) {
    if (state.activeTab !== 'simulator') {
      requestAnimationFrame(updateAndRenderSimulator);
      return;
    }
    
    const delta = time - lastTime;
    lastTime = time;
    
    // Spin pinwheel (independent of shutter speed, but shutter speed will blur it!)
    scene.midground.angle += 0.003 * delta;

    // Calculate settings
    const currentAperture = apertures[state.apertureIdx];
    const currentShutter = shutters[state.shutterIdx];
    const currentISO = isos[state.isoIdx];
    const expDiff = calculateExposure();

    // 1. Clear simulator Canvas
    simCtx.clearRect(0, 0, 800, 500);

    // 2. Compute Blur values for each layer
    const bgBlur = getBlurAmount(scene.background.distance);
    const mgBlur = getBlurAmount(scene.midground.distance);
    const fgBlur = getBlurAmount(scene.foreground.distance);

    // Compute shutter speed motion blur factor
    // slower shutter speed = more frame trails (shutter speed 1s = huge blur, 1/4000s = 0 blur)
    const motionBlurFactor = Math.min(1.0, currentShutter * 0.8);

    // Render layers into offscreen or apply direct blur using canvas context filter
    // Standard fast method: apply ctx.filter
    
    // Draw Background
    simCtx.save();
    if (bgBlur > 0.5) simCtx.filter = `blur(${bgBlur.toFixed(1)}px)`;
    scene.background.draw(simCtx);
    simCtx.restore();

    // Draw Midground (windmill)
    simCtx.save();
    if (mgBlur > 0.5) simCtx.filter = `blur(${mgBlur.toFixed(1)}px)`;
    scene.midground.draw(simCtx, motionBlurFactor);
    simCtx.restore();

    // Draw Foreground
    simCtx.save();
    if (fgBlur > 0.5) simCtx.filter = `blur(${fgBlur.toFixed(1)}px)`;
    scene.foreground.draw(simCtx);
    simCtx.restore();

    // 3. Apply Exposure Correction (Brightness & Contrast)
    // Scale: expDiff is -3 (too dark) to +3 (too bright)
    const imgData = simCtx.getImageData(0, 0, 800, 500);
    const data = imgData.data;
    
    // Brightness offset
    const brightnessScale = Math.pow(2, expDiff); // standard light scale
    
    // ISO grain density
    const grainIntensity = (currentISO / 12800) * 45; // max 45 intensity noise

    for (let i = 0; i < data.length; i += 4) {
      // Apply brightness
      let r = data[i] * brightnessScale;
      let g = data[i+1] * brightnessScale;
      let b = data[i+2] * brightnessScale;
      
      // Apply ISO Grain
      if (grainIntensity > 0) {
        const noise = (Math.random() - 0.5) * grainIntensity;
        r += noise;
        g += noise;
        b += noise;
      }

      // Clamp values
      data[i] = Math.max(0, Math.min(255, r));
      data[i+1] = Math.max(0, Math.min(255, g));
      data[i+2] = Math.max(0, Math.min(255, b));
    }
    simCtx.putImageData(imgData, 0, 0);

    // 4. Update HUD and Exposure warning overlays
    dom.hudAperture.innerText = currentAperture;
    dom.hudShutter.innerText = shutterLabels[state.shutterIdx];
    dom.hudIso.innerText = currentISO;
    dom.hudFocal.innerText = state.focalLength;

    // Exposure warning displays
    if (expDiff < -2.0) {
      dom.exposureOverlayDark.classList.add('visible');
      dom.exposureOverlayBright.classList.remove('visible');
    } else if (expDiff > 2.0) {
      dom.exposureOverlayBright.classList.add('visible');
      dom.exposureOverlayDark.classList.remove('visible');
    } else {
      dom.exposureOverlayDark.classList.remove('visible');
      dom.exposureOverlayBright.classList.remove('visible');
    }

    // Needle mapping (-3 EV = left 0%, 0 EV = 50%, +3 EV = 100%)
    const needlePct = Math.max(0, Math.min(100, (expDiff + 3) / 6 * 100));
    dom.hudExposureNeedle.style.left = `${needlePct}%`;

    requestAnimationFrame(updateAndRenderSimulator);
  }
  requestAnimationFrame(updateAndRenderSimulator);

  // --- AUTOMATIC EXPOSURE (AE LOCK) ---
  function runAutoExposure() {
    // Tries to adjust ISO or shutter speed to lock perfectly at EV difference of ~0.
    // Goal: SCENE_AMBIENT_EV = EV_camera - log2(ISO / 100)
    // We adjust shutter speed or ISO to match exposure.
    let bestShutterIdx = state.shutterIdx;
    let bestIsoIdx = state.isoIdx;
    let minDiff = 999;

    for (let s = 0; s < shutters.length; s++) {
      for (let i = 0; i < isos.length; i++) {
        const N = apertures[state.apertureIdx];
        const t = shutters[s];
        const ISO = isos[i];
        const EV_settings = Math.log2(Math.pow(N, 2) / t) - Math.log2(ISO / 100);
        const diff = Math.abs(SCENE_AMBIENT_EV - EV_settings);
        if (diff < minDiff) {
          minDiff = diff;
          bestShutterIdx = s;
          bestIsoIdx = i;
        }
      }
    }
    
    state.shutterIdx = bestShutterIdx;
    state.isoIdx = bestIsoIdx;
    
    dom.shutterRange.value = bestShutterIdx;
    dom.isoRange.value = bestIsoIdx;
    
    dom.valShutter.innerText = shutterLabels[bestShutterIdx];
    dom.valIso.innerText = isos[bestIsoIdx];

    // Trigger visual beep
    triggerFocusBeep();
  }

  function triggerFocusBeep() {
    dom.focusBeep.classList.add('beep');
    setTimeout(() => dom.focusBeep.classList.remove('beep'), 400);
  }

  // --- EVENT LISTENERS FOR SIMULATOR CONTROLS ---
  
  // Sensor Size Buttons
  dom.sensorBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      dom.sensorBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.sensorCrop = parseFloat(btn.getAttribute('data-crop'));
      dom.sensorBadge.innerText = `${btn.getAttribute('data-name')} (${state.sensorCrop}x)`;
    });
  });

  // Focal Length Slider
  dom.focalLengthRange.addEventListener('input', (e) => {
    state.focalLength = parseInt(e.target.value);
    dom.valFocal.innerText = state.focalLength;
  });

  // Focus Distance Slider
  dom.focusDistanceRange.addEventListener('input', (e) => {
    state.focusDistance = parseFloat(e.target.value);
    dom.valFocus.innerText = state.focusDistance.toFixed(1);
  });

  // Aperture Range Slider
  dom.apertureRange.addEventListener('input', (e) => {
    state.apertureIdx = parseInt(e.target.value);
    dom.valAperture.innerText = apertures[state.apertureIdx];
    if (state.autoExposure) runAutoExposure();
  });

  // Shutter Range Slider
  dom.shutterRange.addEventListener('input', (e) => {
    state.shutterIdx = parseInt(e.target.value);
    dom.valShutter.innerText = shutterLabels[state.shutterIdx];
  });

  // ISO Range Slider
  dom.isoRange.addEventListener('input', (e) => {
    state.isoIdx = parseInt(e.target.value);
    dom.valIso.innerText = isos[state.isoIdx];
  });

  // Grid Lines Toggle
  dom.toggleGridBtn.addEventListener('click', () => {
    state.showGrid = !state.showGrid;
    dom.toggleGridBtn.classList.toggle('active', state.showGrid);
    dom.viewfinderGrid.classList.toggle('hidden', !state.showGrid);
  });

  // Auto Exposure Toggle
  dom.autoExposureBtn.addEventListener('click', () => {
    state.autoExposure = !state.autoExposure;
    dom.autoExposureBtn.classList.toggle('active', state.autoExposure);
    if (state.autoExposure) {
      runAutoExposure();
    }
  });

  // Capture Trigger (Shutter Button)
  dom.shutterTriggerBtn.addEventListener('click', () => {
    playShutterSound();
    
    // Add rapid screen flash class to canvas
    dom.simCanvas.style.filter = 'brightness(5.0) contrast(0.5)';
    setTimeout(() => {
      dom.simCanvas.style.filter = '';
    }, 120);

    // Save current canvas representation to roll
    const photoDataUrl = dom.simCanvas.toDataURL('image/jpeg', 0.9);
    savePhotoToRoll(photoDataUrl);
  });

  function savePhotoToRoll(dataUrl) {
    // Limit to last 6 photos
    if (photoGallery.length >= 6) {
      photoGallery.shift();
    }

    const info = `f/${apertures[state.apertureIdx]} | ${shutterLabels[state.shutterIdx]}s | ISO ${isos[state.isoIdx]}`;
    photoGallery.push({ src: dataUrl, meta: info });
    
    renderCameraRoll();
  }

  function renderCameraRoll() {
    dom.cameraRoll.innerHTML = '';
    if (photoGallery.length === 0) {
      dom.cameraRoll.innerHTML = '<div class="empty-roll-msg">Snap photos using the shutter button!</div>';
      return;
    }

    photoGallery.slice().reverse().forEach((photo, idx) => {
      const card = document.createElement('div');
      card.className = 'snapped-photo-card';
      
      const img = document.createElement('img');
      img.src = photo.src;
      img.alt = 'Snapped Roll Frame';
      
      const tag = document.createElement('div');
      tag.className = 'hud-tag';
      tag.innerText = photo.meta;
      
      card.appendChild(img);
      card.appendChild(tag);
      
      // Let user click to download the photo!
      card.addEventListener('click', () => {
        const link = document.createElement('a');
        link.download = `CamClone-Snap-${idx+1}.jpg`;
        link.href = photo.src;
        link.click();
      });

      dom.cameraRoll.appendChild(card);
    });
  }


  // ==========================================================================
  // MODULE 2: WEBCAM CLONE LAB ENGINE
  // ==========================================================================
  const cloneCtx = dom.cloneCanvas.getContext('2d');
  let animationFrameId = null;

  // Offscreen canvases to store original snapshots
  const offscreenFrames = [
    document.createElement('canvas'),
    document.createElement('canvas'),
    document.createElement('canvas'),
    document.createElement('canvas')
  ];
  const offscreenCtxs = offscreenFrames.map(f => f.getContext('2d'));

  // Initialize offscreen frame canvas sizes
  offscreenFrames.forEach(f => {
    f.width = 720;
    f.height = 480;
  });

  // Setup brush masks (Alpha canvas tracking drawing strokes)
  // Mask is drawing solid white on transparent background
  state.brushMasks = [
    document.createElement('canvas'), // Mask for Slot 2
    document.createElement('canvas'), // Mask for Slot 3
    document.createElement('canvas')  // Mask for Slot 4
  ];
  const maskCtxs = state.brushMasks.map(m => m.getContext('2d'));
  state.brushMasks.forEach(m => {
    m.width = 720;
    m.height = 480;
    const mCtx = m.getContext('2d');
    mCtx.clearRect(0, 0, 720, 480);
  });

  // Fallback Dynamic Canvas Loop (Mock video stream if webcam lacks permission)
  const demoFallback = {
    x: 100,
    y: 240,
    dx: 3.5,
    dy: 2,
    angle: 0,
    render: (ctx, width, height) => {
      // Draw grid interior lab environment
      ctx.fillStyle = '#0f1115';
      ctx.fillRect(0, 0, width, height);

      // Grid guides
      ctx.strokeStyle = '#1d212a';
      ctx.lineWidth = 1;
      for (let x = 0; x < width; x += 40) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, height); ctx.stroke();
      }
      for (let y = 0; y < height; y += 40) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke();
      }

      // Render a dancing, futuristic android/hologram character that serves as our subject!
      ctx.save();
      ctx.translate(demoFallback.x, demoFallback.y);
      
      // Hologram glow
      const glowGrad = ctx.createRadialGradient(0, 0, 10, 0, 0, 70);
      glowGrad.addColorStop(0, 'rgba(88, 86, 214, 0.4)');
      glowGrad.addColorStop(1, 'rgba(88, 86, 214, 0)');
      ctx.fillStyle = glowGrad;
      ctx.beginPath();
      ctx.arc(0, 0, 70, 0, Math.PI*2);
      ctx.fill();

      // Head
      ctx.fillStyle = '#5856d6';
      ctx.beginPath();
      ctx.arc(0, -50, 15, 0, Math.PI*2);
      ctx.fill();
      // Neon eye visor
      ctx.fillStyle = '#ff6b00';
      ctx.fillRect(-10, -54, 20, 5);

      // Body torso
      ctx.fillStyle = '#007aff';
      ctx.beginPath();
      ctx.moveTo(-20, -30);
      ctx.lineTo(20, -30);
      ctx.lineTo(15, 20);
      ctx.lineTo(-15, 20);
      ctx.closePath();
      ctx.fill();

      // Floating particles
      demoFallback.angle += 0.05;
      ctx.fillStyle = '#34c759';
      for (let p = 0; p < 3; p++) {
        const px = Math.sin(demoFallback.angle + p) * 35;
        const py = Math.cos(demoFallback.angle + p) * 35 - 15;
        ctx.beginPath();
        ctx.arc(px, py, 4, 0, Math.PI*2);
        ctx.fill();
      }
      ctx.restore();

      // Subject motion
      demoFallback.x += demoFallback.dx;
      demoFallback.y += demoFallback.dy;

      if (demoFallback.x < 50 || demoFallback.x > width - 50) demoFallback.dx *= -1;
      if (demoFallback.y < 80 || demoFallback.y > height - 80) demoFallback.dy *= -1;

      // Instruction instructions Overlay watermark text
      ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.font = '14px JetBrains Mono';
      ctx.fillText("WEBCAM DEMO SIMULATOR ACTIVE", 20, 40);
    }
  };

  // --- ACTIVATE WEBCAM ---
  function initWebcam() {
    if (state.webcamActive) return;

    dom.webcamStatusText.innerText = "Connecting camera...";
    dom.webcamStatusDot.className = "status-dot warning";

    navigator.mediaDevices.getUserMedia({ video: { width: 720, height: 480 } })
      .then(stream => {
        state.webcamStream = stream;
        dom.webcamStream.srcObject = stream;
        state.webcamActive = true;
        
        dom.webcamStatusText.innerText = "Webcam Live";
        dom.webcamStatusDot.className = "status-dot success";

        // Spin up drawing loops
        startCloneLabRenderLoop();
      })
      .catch(err => {
        console.warn("Webcam access denied or unavailable. Loading interactive sandbox fallback demo:", err);
        state.webcamActive = false;
        
        dom.webcamStatusText.innerText = "Demo Engine Active (No Webcam)";
        dom.webcamStatusDot.className = "status-dot warning";

        startCloneLabRenderLoop();
      });
  }

  // --- DRAWING LOOP ---
  function startCloneLabRenderLoop() {
    if (animationFrameId) cancelAnimationFrame(animationFrameId);
    
    function render() {
      if (state.activeTab !== 'clone-lab') {
        animationFrameId = requestAnimationFrame(render);
        return;
      }

      const w = 720;
      const h = 480;

      // 1. Fetch current stream frame
      let currentFrameSource = null;
      if (state.webcamActive && dom.webcamStream.readyState === dom.webcamStream.HAVE_ENOUGH_DATA) {
        currentFrameSource = dom.webcamStream;
      } else {
        // Draw demo loop into an offscreen scratchpad
        const scratchCanvas = offscreenFrames[0]; // Reuse slot 0 offscreen scratchpad briefly
        const scratchCtx = scratchCanvas.getContext('2d');
        demoFallback.render(scratchCtx, w, h);
        currentFrameSource = scratchCanvas;
      }

      // 2. Perform Blending based on method
      cloneCtx.clearRect(0, 0, w, h);

      if (state.cloneMethod === 'split') {
        // --- SPLIT MODE BLENDING ---
        // Draws Slot 1 (Base Frame) on left, current feed (or Slot 2 if taken) on right
        const splitX = state.splitRatio * w;

        // Draw Base Frame
        if (state.capturedFrames[0]) {
          cloneCtx.drawImage(state.capturedFrames[0], 0, 0);
        } else {
          // Draw live source as base
          cloneCtx.drawImage(currentFrameSource, 0, 0);
        }

        // Draw Right/Clone section
        cloneCtx.save();
        cloneCtx.beginPath();
        cloneCtx.rect(splitX, 0, w - splitX, h);
        cloneCtx.clip();
        
        if (state.capturedFrames[1]) {
          cloneCtx.drawImage(state.capturedFrames[1], 0, 0);
        } else {
          cloneCtx.drawImage(currentFrameSource, 0, 0);
        }
        ctxSplitLineDraw(cloneCtx, splitX, h);
        cloneCtx.restore();

      } else {
        // --- BRUSH MASKING MODE ---
        // Base: Slot 1
        if (state.capturedFrames[0]) {
          cloneCtx.drawImage(state.capturedFrames[0], 0, 0);
        } else {
          cloneCtx.drawImage(currentFrameSource, 0, 0);
        }

        // Overlay each clone layer (2, 3, 4) masked by their brush masks
        for (let l = 1; l < 4; l++) {
          if (state.capturedFrames[l]) {
            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = w;
            tempCanvas.height = h;
            const tempCtx = tempCanvas.getContext('2d');

            // Draw mask
            tempCtx.drawImage(state.brushMasks[l - 1], 0, 0);

            // Blend source frame inside mask
            tempCtx.globalCompositeOperation = 'source-in';
            tempCtx.drawImage(state.capturedFrames[l], 0, 0);

            // Draw masked composite onto main canvas
            cloneCtx.drawImage(tempCanvas, 0, 0);
          }
        }
      }

      // 3. Draw Onion Skin overlay if enabled
      if (state.onionSkinEnabled) {
        cloneCtx.save();
        cloneCtx.globalAlpha = 0.3;
        cloneCtx.drawImage(currentFrameSource, 0, 0);
        cloneCtx.restore();
      }

      // 4. Apply Vintage Color Filters
      applyActiveFilters(cloneCtx, w, h);

      animationFrameId = requestAnimationFrame(render);
    }
    
    animationFrameId = requestAnimationFrame(render);
  }

  // Draw vertical split guidelines
  function ctxSplitLineDraw(ctx, x, h) {
    ctx.strokeStyle = varColorHex('--accent-orange');
    ctx.lineWidth = 2;
    ctx.shadowColor = 'rgba(255, 107, 0, 0.5)';
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, h);
    ctx.stroke();
    ctx.shadowBlur = 0; // reset
  }

  function varColorHex(varName) {
    return getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
  }

  // Apply filters on canvas
  function applyActiveFilters(ctx, w, h) {
    if (state.activeFilter === 'none') return;

    const imgData = ctx.getImageData(0, 0, w, h);
    const d = imgData.data;

    for (let i = 0; i < d.length; i += 4) {
      let r = d[i];
      let g = d[i+1];
      let b = d[i+2];

      if (state.activeFilter === 'warm-vintage') {
        // Kodak Warm Gold emulation
        d[i] = r * 1.15 + 10;
        d[i+1] = g * 1.05 + 5;
        d[i+2] = b * 0.85;
      } else if (state.activeFilter === 'monochrome-high') {
        // High contrast silver halide mono
        const gray = 0.299*r + 0.587*g + 0.114*b;
        // high contrast curve
        const factor = 1.3;
        const contrastVal = factor * (gray - 128) + 128;
        d[i] = d[i+1] = d[i+2] = Math.max(0, Math.min(255, contrastVal));
      } else if (state.activeFilter === 'faded-instant') {
        // Cyberpunk style teal & indigo
        d[i] = r * 0.8 + 15;
        d[i+1] = g * 0.9 + 5;
        d[i+2] = b * 1.25 + 25;
      } else if (state.activeFilter === 'dramatic-cool') {
        // Polar Faded instant
        d[i] = r * 0.95;
        d[i+1] = g * 1.05 + 10;
        d[i+2] = b * 1.15 + 15;
        // Fade blacks
        d[i] = d[i] * 0.9 + 20;
        d[i+1] = d[i+1] * 0.9 + 20;
        d[i+2] = d[i+2] * 0.9 + 20;
      }
    }
    ctx.putImageData(imgData, 0, 0);
  }

  // --- ACTION: TAKE SNAPSHOT FOR SLOTS ---
  dom.captureButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const slotNum = parseInt(btn.getAttribute('data-slot'));
      const idx = slotNum - 1;

      // Click Sound
      playShutterSound();

      // Capture current camera stream source
      const w = 720;
      const h = 480;
      const targetCtx = offscreenCtxs[idx];

      if (state.webcamActive && dom.webcamStream.readyState === dom.webcamStream.HAVE_ENOUGH_DATA) {
        targetCtx.drawImage(dom.webcamStream, 0, 0, w, h);
      } else {
        // Draw the demo fallback animation
        demoFallback.render(targetCtx, w, h);
      }

      // Mark slot filled
      const slotDiv = document.getElementById(`slot-${slotNum}`);
      slotDiv.classList.remove('empty');
      slotDiv.classList.add('filled');
      
      // Put thumbnail inside slot
      const thumb = slotDiv.querySelector('.slot-thumb');
      thumb.innerHTML = `<span class="slot-num">${slotNum}</span>`;
      const canvasThumb = document.createElement('canvas');
      canvasThumb.width = 90;
      canvasThumb.height = 60;
      const thumbCtx = canvasThumb.getContext('2d');
      thumbCtx.drawImage(offscreenFrames[idx], 0, 0, 90, 60);
      thumb.appendChild(canvasThumb);

      state.capturedFrames[idx] = offscreenFrames[idx];

      // Enable next slot in chain
      if (slotNum < 4) {
        const nextNum = slotNum + 1;
        const nextSlot = document.getElementById(`slot-${nextNum}`);
        const nextBtn = nextSlot.querySelector('.capture-slot-btn');
        
        nextSlot.classList.add('active');
        nextBtn.removeAttribute('disabled');
        
        // Also enable Brush layer buttons
        if (state.cloneMethod === 'brush') {
          const brushBtn = document.querySelector(`.brush-layer-btn[data-brush-slot="${nextNum}"]`);
          if (brushBtn) brushBtn.removeAttribute('disabled');
        }
      }
    });
  });

  // --- CLONE METHOD TAB TOGGLE ---
  dom.methodBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      dom.methodBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const method = btn.getAttribute('data-method');
      state.cloneMethod = method;

      if (method === 'split') {
        dom.splitModeControls.classList.remove('hidden-element');
        dom.brushModeControls.classList.add('hidden-element');
      } else {
        dom.splitModeControls.classList.add('hidden-element');
        dom.brushModeControls.classList.remove('hidden-element');

        // Unlock already captured layers for brushing
        for (let l = 2; l <= 4; l++) {
          const bBtn = document.querySelector(`.brush-layer-btn[data-brush-slot="${l}"]`);
          if (state.capturedFrames[l - 1]) {
            bBtn.removeAttribute('disabled');
          }
        }
      }
    });
  });

  // Split Ratio Slider
  dom.splitRatioRange.addEventListener('input', (e) => {
    state.splitRatio = parseInt(e.target.value) / 100;
  });

  // Onion skin toggler
  dom.onionSkinToggle.addEventListener('change', (e) => {
    state.onionSkinEnabled = e.target.checked;
  });

  // Vintage Filter selector
  dom.filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      dom.filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.activeFilter = btn.getAttribute('data-filter');
    });
  });

  // --- BRUSH PAINT TRACKING ---
  const bCanvas = dom.cloneCanvas;
  
  // Update hover cursor circle size
  function updateBrushCursor(e) {
    if (state.cloneMethod !== 'brush') {
      dom.brushRing.style.display = 'none';
      return;
    }

    const rect = bCanvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    dom.brushRing.style.display = 'block';
    dom.brushRing.style.width = `${state.brushSize}px`;
    dom.brushRing.style.height = `${state.brushSize}px`;
    dom.brushRing.style.left = `${e.clientX}px`;
    dom.brushRing.style.top = `${e.clientY}px`;
  }

  bCanvas.addEventListener('mousemove', (e) => {
    updateBrushCursor(e);
    if (!state.isDrawing || state.cloneMethod !== 'brush') return;

    // Draw on active brush mask canvas
    const maskIdx = state.activeBrushSlot - 2; // Slot 2 = Mask index 0
    const mCtx = maskCtxs[maskIdx];
    if (!mCtx) return;

    const rect = bCanvas.getBoundingClientRect();
    // Translate mouse coordinates to canvas absolute pixels (720x480)
    const x = (e.clientX - rect.left) / rect.width * 720;
    const y = (e.clientY - rect.top) / rect.height * 480;

    mCtx.save();
    
    // Brush softening using radial gradients
    const radius = state.brushSize / 2;
    const gradient = mCtx.createRadialGradient(x, y, radius * (1 - state.brushHardnessRange.value/100), x, y, radius);
    
    if (state.brushMode === 'paint') {
      mCtx.globalCompositeOperation = 'source-over';
      gradient.addColorStop(0, 'rgba(255, 255, 255, 1.0)');
      gradient.addColorStop(1, 'rgba(255, 255, 255, 0.0)');
    } else {
      mCtx.globalCompositeOperation = 'destination-out';
      gradient.addColorStop(0, 'rgba(0, 0, 0, 1.0)');
      gradient.addColorStop(1, 'rgba(0, 0, 0, 0.0)');
    }

    mCtx.fillStyle = gradient;
    mCtx.beginPath();
    mCtx.arc(x, y, radius, 0, Math.PI*2);
    mCtx.fill();
    mCtx.restore();
  });

  bCanvas.addEventListener('mousedown', () => {
    state.isDrawing = true;
  });

  window.addEventListener('mouseup', () => {
    state.isDrawing = false;
  });

  bCanvas.addEventListener('mouseenter', (e) => {
    updateBrushCursor(e);
  });

  bCanvas.addEventListener('mouseleave', () => {
    dom.brushRing.style.display = 'none';
  });

  // Select layer to brush
  dom.brushLayerBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      dom.brushLayerBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.activeBrushSlot = parseInt(btn.getAttribute('data-brush-slot'));
    });
  });

  // Brush paint/erase toggles
  dom.brushPaintBtn.addEventListener('click', () => {
    state.brushMode = 'paint';
    dom.brushPaintBtn.classList.add('btn-toggle-active');
    dom.brushEraseBtn.classList.remove('btn-toggle-active');
  });

  dom.brushEraseBtn.addEventListener('click', () => {
    state.brushMode = 'erase';
    dom.brushEraseBtn.classList.add('btn-toggle-active');
    dom.brushPaintBtn.classList.remove('btn-toggle-active');
  });

  // Brush sliders
  dom.brushSizeRange.addEventListener('input', (e) => {
    state.brushSize = parseInt(e.target.value);
    dom.valBrushSize.innerText = state.brushSize;
  });

  dom.brushHardnessRange.addEventListener('input', (e) => {
    dom.valBrushHardness.innerText = e.target.value;
  });

  // --- REBUILD/RESET COMPOSITE ---
  dom.clearCloneBtn.addEventListener('click', () => {
    state.capturedFrames = [null, null, null, null];
    
    // Clear masks
    state.brushMasks.forEach(m => {
      const mCtx = m.getContext('2d');
      mCtx.clearRect(0, 0, 720, 480);
    });

    // Reset Slots
    dom.shotSlots.forEach((slot, idx) => {
      slot.classList.remove('filled');
      slot.classList.add('empty');
      
      const num = idx + 1;
      const thumb = slot.querySelector('.slot-thumb');
      thumb.innerHTML = `<span class="slot-num">${num}</span><span class="slot-label">${num === 1 ? 'Base Frame' : 'Clone ' + String.fromCharCode(64 + idx)}</span>`;
      
      const btn = slot.querySelector('.capture-slot-btn');
      if (num > 1) {
        slot.classList.remove('active');
        btn.setAttribute('disabled', 'true');
      } else {
        slot.classList.add('active');
        btn.removeAttribute('disabled');
      }
    });

    // Lock brush layer buttons
    dom.brushLayerBtns.forEach((btn, idx) => {
      if (idx > 0) btn.setAttribute('disabled', 'true');
    });

    // Reset active indicators
    const baseActiveBrush = document.querySelector('.brush-layer-btn[data-brush-slot="2"]');
    dom.brushLayerBtns.forEach(b => b.classList.remove('active'));
    baseActiveBrush.classList.add('active');
    state.activeBrushSlot = 2;

    triggerFocusBeep();
  });

  // --- EXPORT MASTER IMAGE ---
  dom.downloadCloneBtn.addEventListener('click', () => {
    const dataUrl = dom.cloneCanvas.toDataURL('image/jpeg', 0.95);
    const link = document.createElement('a');
    link.download = `CamClone-MasterComposite-${Date.now()}.jpg`;
    link.href = dataUrl;
    link.click();
  });


  // ==========================================================================
  // MODULE 3: PHYSICS & MATH VISUALIZER ENGINE
  // ==========================================================================
  const mathCtx = dom.mathSandboxCanvas.getContext('2d');

  function renderMathVisualizer() {
    if (state.activeTab !== 'math-visualizer') return;

    const w = dom.mathSandboxCanvas.width;
    const h = dom.mathSandboxCanvas.height;

    // 1. Compute Pinhole Mathematical Projection
    // x_proj = f * X / Z
    // y_proj = f * Y / Z
    const f = state.math.focal;
    const X = state.math.x;
    const Y = state.math.y;
    const Z = state.math.z;

    const xProj = f * X / Z;
    const yProj = f * Y / Z;

    // Intrinsic matrix shifts (Center principal points)
    const u0 = w / 2;
    const v0 = h / 2;
    // Scale projection coordinates to fit on 400x280 pixels elegantly
    const pixelScale = 8.5; // pixel calibration scale factor
    const u = Math.round(u0 + (xProj * pixelScale));
    const v = Math.round(v0 - (yProj * pixelScale)); // subtract since Y is inverted in graphics

    // Update text calculations
    dom.mathCalcXExpr.innerText = `${f} * ${X.toFixed(1)} / ${Z.toFixed(1)}`;
    dom.mathCalcXRes.innerText = xProj.toFixed(2);
    dom.mathCalcYExpr.innerText = `${f} * (${Y.toFixed(1)}) / ${Z.toFixed(1)}`;
    dom.mathCalcYRes.innerText = yProj.toFixed(2);
    dom.mathPixelU.innerText = u;
    dom.mathPixelV.innerText = v;

    // 2. Draw Interactive Sandbox Diagram
    mathCtx.clearRect(0, 0, w, h);

    // Draw background grid
    mathCtx.strokeStyle = '#11141c';
    mathCtx.lineWidth = 1;
    for (let i = 0; i < w; i += 20) {
      mathCtx.beginPath(); mathCtx.moveTo(i, 0); mathCtx.lineTo(i, h); mathCtx.stroke();
    }
    for (let j = 0; j < h; j += 20) {
      mathCtx.beginPath(); mathCtx.moveTo(0, j); mathCtx.lineTo(w, j); mathCtx.stroke();
    }

    // Draw coordinate axes
    mathCtx.strokeStyle = '#3e4452';
    mathCtx.lineWidth = 1.5;
    // X Axis
    mathCtx.beginPath(); mathCtx.moveTo(20, h/2); mathCtx.lineTo(w - 20, h/2); mathCtx.stroke();
    // Y Axis
    mathCtx.beginPath(); mathCtx.moveTo(w/2, 20); mathCtx.lineTo(w/2, h - 20); mathCtx.stroke();

    // Axis labels
    mathCtx.fillStyle = '#8e8e93';
    mathCtx.font = '10px JetBrains Mono';
    mathCtx.fillText("+X (Right)", w - 75, h/2 - 6);
    mathCtx.fillText("-Y (Down)", w/2 + 6, h - 25);

    // Draw digital sensor boundary
    mathCtx.strokeStyle = 'rgba(255, 107, 0, 0.4)';
    mathCtx.lineWidth = 2;
    mathCtx.strokeRect(40, 30, w - 80, h - 60);
    mathCtx.fillStyle = 'rgba(255, 107, 0, 0.03)';
    mathCtx.fillRect(40, 30, w - 80, h - 60);
    mathCtx.fillStyle = 'rgba(255, 107, 0, 0.6)';
    mathCtx.fillText("SENSOR BOUNDARY", 50, 45);

    // Draw optical center principal point
    mathCtx.fillStyle = '#ff9500';
    mathCtx.beginPath();
    mathCtx.arc(u0, v0, 3, 0, Math.PI*2);
    mathCtx.fill();
    mathCtx.fillText("u₀, v₀", u0 + 6, v0 + 12);

    // Draw projected pixel point (u, v)
    // Draw crosshair tracking the projection
    mathCtx.strokeStyle = 'rgba(52, 199, 89, 0.3)';
    mathCtx.lineWidth = 1.5;
    // horiz projection line
    mathCtx.beginPath(); mathCtx.moveTo(40, v); mathCtx.lineTo(w-40, v); mathCtx.stroke();
    // vert projection line
    mathCtx.beginPath(); mathCtx.moveTo(u, 30); mathCtx.lineTo(u, h-30); mathCtx.stroke();

    // The projected Point
    mathCtx.fillStyle = '#34c759';
    mathCtx.shadowColor = '#34c759';
    mathCtx.shadowBlur = 10;
    mathCtx.beginPath();
    mathCtx.arc(u, v, 6, 0, Math.PI*2);
    mathCtx.fill();
    mathCtx.shadowBlur = 0; // reset

    mathCtx.fillStyle = '#fff';
    mathCtx.font = '11px JetBrains Mono';
    mathCtx.fillText(`Projected: (${u}px, ${v}px)`, u + 10, v - 10);
  }

  // Bind sandbox sliders
  dom.mathX.addEventListener('input', (e) => {
    state.math.x = parseFloat(e.target.value);
    dom.valMathX.innerText = state.math.x.toFixed(1);
    renderMathVisualizer();
  });

  dom.mathY.addEventListener('input', (e) => {
    state.math.y = parseFloat(e.target.value);
    dom.valMathY.innerText = state.math.y.toFixed(1);
    renderMathVisualizer();
  });

  dom.mathZ.addEventListener('input', (e) => {
    state.math.z = parseFloat(e.target.value);
    dom.valMathZ.innerText = state.math.z.toFixed(1);
    renderMathVisualizer();
  });

  dom.mathFocal.addEventListener('input', (e) => {
    state.math.focal = parseInt(e.target.value);
    dom.valMathF.innerText = state.math.focal;
    renderMathVisualizer();
  });

  // ==========================================================================
  // MODULE 4: LEARNCAMERA ACADEMY & INTERACTIVE ENGINE
  // ==========================================================================
  
  // Reusable camera configuration helper
  function applyCameraSettings(cfg) {
    if (cfg.apertureIdx !== undefined) {
      state.apertureIdx = cfg.apertureIdx;
      dom.apertureRange.value = cfg.apertureIdx;
      dom.valAperture.innerText = apertures[cfg.apertureIdx];
    }
    if (cfg.shutterIdx !== undefined) {
      state.shutterIdx = cfg.shutterIdx;
      dom.shutterRange.value = cfg.shutterIdx;
      dom.valShutter.innerText = shutterLabels[cfg.shutterIdx];
    }
    if (cfg.isoIdx !== undefined) {
      state.isoIdx = cfg.isoIdx;
      dom.isoRange.value = cfg.isoIdx;
      dom.valIso.innerText = isos[cfg.isoIdx];
    }
    if (cfg.focalLength !== undefined) {
      state.focalLength = cfg.focalLength;
      dom.focalLengthRange.value = cfg.focalLength;
      dom.valFocal.innerText = cfg.focalLength;
    }
    if (cfg.focusDistance !== undefined) {
      state.focusDistance = cfg.focusDistance;
      dom.focusDistanceRange.value = cfg.focusDistance;
      dom.valFocus.innerText = cfg.focusDistance.toFixed(1);
    }
    if (cfg.sensorCrop !== undefined) {
      state.sensorCrop = cfg.sensorCrop;
      dom.sensorBtns.forEach(b => {
        const match = parseFloat(b.getAttribute('data-crop')) === cfg.sensorCrop;
        b.classList.toggle('active', match);
        if (match) dom.sensorBadge.innerText = `${b.getAttribute('data-name')} (${cfg.sensorCrop}x)`;
      });
    }
    triggerFocusBeep();
  }

  // 1. Academy Subtabs Switching
  const pillBtns = document.querySelectorAll('.academy-nav-pills .pill-btn');
  const subPanes = document.querySelectorAll('.academy-subpane');

  pillBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const subtab = btn.getAttribute('data-subtab');
      pillBtns.forEach(b => b.classList.toggle('active', b === btn));
      subPanes.forEach(p => {
        p.classList.toggle('active', p.id === `subtab-${subtab}`);
      });
    });
  });

  // 2. Scenario Presets
  const presetMap = {
    'portrait': {
      apertureIdx: 1, // f/1.8
      shutterIdx: 4,  // 1/250s
      isoIdx: 0,      // ISO 100
      focalLength: 85,
      focusDistance: 1.5,
      sensorCrop: 1.0
    },
    'sports': {
      apertureIdx: 2, // f/2.8
      shutterIdx: 2,  // 1/1000s
      isoIdx: 3,      // ISO 800
      focalLength: 135,
      focusDistance: 3.0,
      sensorCrop: 1.0
    },
    'night': {
      apertureIdx: 0, // f/1.2
      shutterIdx: 8,  // 1/15s
      isoIdx: 5,      // ISO 3200
      focalLength: 24,
      focusDistance: 10.0,
      sensorCrop: 1.0
    },
    'street': {
      apertureIdx: 5, // f/8.0
      shutterIdx: 4,  // 1/250s
      isoIdx: 2,      // ISO 400
      focalLength: 35,
      focusDistance: 3.0,
      sensorCrop: 1.0
    },
    'landscape': {
      apertureIdx: 6, // f/11
      shutterIdx: 5,  // 1/125s
      isoIdx: 1,      // ISO 200
      focalLength: 24,
      focusDistance: 10.0,
      sensorCrop: 1.0
    },
    'motion-art': {
      apertureIdx: 7, // f/16
      shutterIdx: 9,  // 1/8s
      isoIdx: 0,      // ISO 100
      focalLength: 50,
      focusDistance: 3.0,
      sensorCrop: 1.0
    }
  };

  document.querySelectorAll('.preset-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const pKey = btn.getAttribute('data-preset');
      const cfg = presetMap[pKey];
      if (cfg) {
        applyCameraSettings(cfg);
        switchTab('simulator');
      }
    });
  });

  // 3. Lesson "Try in Simulator" Actions
  const lessonActions = {
    'aperture': () => {
      applyCameraSettings({
        apertureIdx: 1, // f/1.8 (creamy bokeh)
        focusDistance: 1.5, // focus on foreground pot
        shutterIdx: 5,  // 1/125s
        isoIdx: 1       // ISO 200
      });
      runAutoExposure();
      switchTab('simulator');
    },
    'shutter': () => {
      applyCameraSettings({
        shutterIdx: 1,  // 1/2000s (freeze pinwheel)
        apertureIdx: 2, // f/2.8
        isoIdx: 4       // ISO 1600
      });
      runAutoExposure();
      switchTab('simulator');
    },
    'iso': () => {
      applyCameraSettings({
        isoIdx: 6,      // ISO 6400 (visible noise)
        apertureIdx: 5, // f/8.0
        shutterIdx: 2   // 1/1000s
      });
      runAutoExposure();
      switchTab('simulator');
    },
    'triangle': () => {
      state.autoExposure = true;
      dom.autoExposureBtn.classList.add('active');
      runAutoExposure();
      switchTab('simulator');
    },
    'focal': () => {
      applyCameraSettings({
        focalLength: 150, // Telephoto compression
        apertureIdx: 2
      });
      runAutoExposure();
      switchTab('simulator');
    },
    'crop': () => {
      applyCameraSettings({
        sensorCrop: 1.5, // APS-C 1.5x
        focalLength: 50
      });
      switchTab('simulator');
    }
  };

  document.querySelectorAll('.apply-lesson-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const lessonKey = btn.getAttribute('data-lesson');
      if (lessonActions[lessonKey]) {
        lessonActions[lessonKey]();
      }
    });
  });

  // 4. Challenges & Missions Verification Engine
  const completedMissions = new Set();
  const completedCountEl = document.getElementById('completed-count');

  document.querySelectorAll('.jump-to-sim-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      switchTab('simulator');
    });
  });

  document.querySelectorAll('.verify-challenge-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const missionId = parseInt(btn.getAttribute('data-challenge'));
      const card = document.getElementById(`challenge-${missionId}`);
      const indicator = card.querySelector('.status-indicator');
      const expErr = Math.abs(calculateExposure());
      const currentShutter = shutters[state.shutterIdx];
      const currentAperture = apertures[state.apertureIdx];
      const currentISO = isos[state.isoIdx];

      let isPassed = false;
      let feedback = '';

      if (missionId === 1) {
        // Shutter >= 1/500s (shutter <= 0.002) and expErr <= 0.6
        if (currentShutter <= 0.002 && expErr <= 0.6) {
          isPassed = true;
        } else {
          feedback = `Current shutter: ${shutterLabels[state.shutterIdx]}s (Need 1/500s or faster), Exposure Error: ${expErr.toFixed(2)} EV`;
        }
      } else if (missionId === 2) {
        // Aperture <= f/2.0 and focus <= 2.0m and expErr <= 0.6
        if (currentAperture <= 2.0 && state.focusDistance <= 2.0 && expErr <= 0.6) {
          isPassed = true;
        } else {
          feedback = `Aperture: f/${currentAperture} (Need f/2.0 or wider), Focus: ${state.focusDistance.toFixed(1)}m, Exposure Error: ${expErr.toFixed(2)} EV`;
        }
      } else if (missionId === 3) {
        // Aperture >= f/11 and focal <= 35 and expErr <= 0.6
        if (currentAperture >= 11 && state.focalLength <= 35 && expErr <= 0.6) {
          isPassed = true;
        } else {
          feedback = `Aperture: f/${currentAperture} (Need f/11 or narrower), Focal: ${state.focalLength}mm (Need <= 35mm), Exposure Error: ${expErr.toFixed(2)} EV`;
        }
      } else if (missionId === 4) {
        // ISO >= 1600 and shutter <= 1/60s and expErr <= 0.6
        if (currentISO >= 1600 && currentShutter <= 1/60 && expErr <= 0.6) {
          isPassed = true;
        } else {
          feedback = `ISO: ${currentISO} (Need >= 1600), Shutter: ${shutterLabels[state.shutterIdx]}s, Exposure Error: ${expErr.toFixed(2)} EV`;
        }
      }

      if (isPassed) {
        completedMissions.add(missionId);
        card.classList.add('completed');
        indicator.innerText = 'PASSED ✓';
        btn.innerText = 'Completed ✓';
        btn.setAttribute('disabled', 'true');
        playShutterSound();
        triggerFocusBeep();
      } else {
        indicator.innerText = 'TRY AGAIN';
        alert(`Mission ${missionId} Check Failed:\n${feedback}\n\nAdjust your settings in the Camera Simulator and verify again!`);
      }

      if (completedCountEl) {
        completedCountEl.innerText = completedMissions.size;
      }
    });
  });

  // 5. Interactive Quiz Questions & Engine
  const quizData = [
    {
      q: "1. What optical effect happens when you open the aperture from f/8 to f/1.8?",
      options: [
        "The background becomes blurrier (shallower depth of field)",
        "The entire image becomes darker",
        "Motion blur increases drastically",
        "The focal length doubles"
      ],
      correct: 0,
      explanation: "Lower f-number represents a wider physical diaphragm opening, allowing more light and creating a narrower plane of focus (shallow depth of field/bokeh)."
    },
    {
      q: "2. Which shutter speed is best suited to freeze high-speed athletic movements or spinning wheels?",
      options: [
        "1/15s",
        "1/60s",
        "1/1000s",
        "1 full second"
      ],
      correct: 2,
      explanation: "Shutter speeds of 1/500s, 1/1000s, or 1/4000s open and close so quickly that movement across the sensor is frozen in crisp detail."
    },
    {
      q: "3. What is the primary drawback of using very high ISO settings (e.g. ISO 6400 or 12800)?",
      options: [
        "The lens physically overheats",
        "Digital sensor grain/noise increases and dynamic range is reduced",
        "The shutter speed is forced to stay at 1 second",
        "The depth of field becomes infinite"
      ],
      correct: 1,
      explanation: "ISO increases sensor electronic gain; amplifying faint light also amplifies background sensor noise, resulting in visible luminance and chroma grain."
    },
    {
      q: "4. If you attach a 50mm lens onto an APS-C crop sensor camera (1.5x crop factor), what is the 35mm equivalent field of view?",
      options: [
        "33mm",
        "50mm",
        "75mm",
        "100mm"
      ],
      correct: 2,
      explanation: "Equivalent field of view = Physical Focal Length &times; Crop Factor = 50mm &times; 1.5 = 75mm."
    },
    {
      q: "5. In the pinhole camera projection formula u = f * (X / Z), what happens as the subject distance Z increases?",
      options: [
        "The projected image size on the sensor shrinks",
        "The projected image flips upside down",
        "The lens focal length automatically expands",
        "The exposure becomes infinitely bright"
      ],
      correct: 0,
      explanation: "Because Z is in the denominator (perspective division), increasing distance from the optical center causes the coordinates on the sensor plane to diminish, making distant objects appear smaller."
    }
  ];

  const quizListEl = document.getElementById('quiz-list');
  const quizScoreEl = document.getElementById('quiz-score-val');
  let quizAnswers = {};

  function renderQuiz() {
    if (!quizListEl) return;
    quizListEl.innerHTML = '';
    quizAnswers = {};
    if (quizScoreEl) quizScoreEl.innerText = '0';

    quizData.forEach((item, qIdx) => {
      const qCard = document.createElement('div');
      qCard.className = 'quiz-q-card';

      const title = document.createElement('div');
      title.className = 'quiz-q-title';
      title.innerText = item.q;
      qCard.appendChild(title);

      const optGrid = document.createElement('div');
      optGrid.className = 'quiz-options';

      item.options.forEach((optText, optIdx) => {
        const optBtn = document.createElement('button');
        optBtn.className = 'quiz-opt-btn';
        optBtn.innerText = optText;

        optBtn.addEventListener('click', () => {
          if (quizAnswers[qIdx] !== undefined) return; // already answered
          quizAnswers[qIdx] = optIdx;

          const allBtns = optGrid.querySelectorAll('.quiz-opt-btn');
          allBtns.forEach((b, bIdx) => {
            b.setAttribute('disabled', 'true');
            if (bIdx === item.correct) {
              b.classList.add('correct');
            } else if (bIdx === optIdx) {
              b.classList.add('wrong');
            }
          });

          // Show explanation
          const expDiv = document.createElement('div');
          expDiv.className = 'quiz-explanation';
          expDiv.innerHTML = `<strong>${optIdx === item.correct ? '✓ Correct!' : '✗ Incorrect.'}</strong> ${item.explanation}`;
          qCard.appendChild(expDiv);

          // Update Score
          updateQuizScore();
        });

        optGrid.appendChild(optBtn);
      });

      qCard.appendChild(optGrid);
      quizListEl.appendChild(qCard);
    });
  }

  function updateQuizScore() {
    let score = 0;
    quizData.forEach((item, idx) => {
      if (quizAnswers[idx] === item.correct) score++;
    });
    if (quizScoreEl) quizScoreEl.innerText = score;
    if (Object.keys(quizAnswers).length === quizData.length) {
      triggerFocusBeep();
    }
  }

  const resetQuizBtn = document.getElementById('reset-quiz-btn');
  if (resetQuizBtn) {
    resetQuizBtn.addEventListener('click', () => {
      renderQuiz();
    });
  }

  renderQuiz();

  // 6. Progressive Web App (PWA) Service Worker Registration
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./sw.js')
        .then(reg => {
          console.log('[LearnCamera] ServiceWorker registered with scope:', reg.scope);
        })
        .catch(err => {
          console.warn('[LearnCamera] ServiceWorker registration failed:', err);
        });
    });
  }
});

