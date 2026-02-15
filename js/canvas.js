/**
 * Label Maker - Canvas: resize, presets, grid, zoom, align, opacity.
 */
const LabelMaker = window.LabelMaker;
const canvas = LabelMaker.canvas;

  const MIN_CANVAS = 100;
  const MAX_CANVAS = 2000;

  const LABEL_PRESET_GROUPS = [
    { group: 'Custom', items: [{ value: 'custom', label: 'Custom (no change)' }] },
    { group: 'Square & small', items: [
      { value: '48x48', label: '0.5″ × 0.5″', w: 48, h: 48 },
      { value: '96x96', label: '1″ × 1″', w: 96, h: 96 },
      { value: '144x144', label: '1.5″ × 1.5″', w: 144, h: 144 },
      { value: '192x192', label: '2″ × 2″', w: 192, h: 192 },
      { value: '288x288', label: '3″ × 3″', w: 288, h: 288 },
      { value: '384x384', label: '4″ × 4″', w: 384, h: 384 },
      { value: '480x480', label: '5″ × 5″', w: 480, h: 480 }
    ]},
    { group: 'Avery & address (1–2″ height)', items: [
      { value: '252x96', label: 'Avery 5160 — 2.63″ × 1″', w: 252, h: 96 },
      { value: '96x252', label: 'Avery 5260 — 1″ × 2.63″', w: 96, h: 252 },
      { value: '168x48', label: 'Avery 5161 — 1.75″ × 0.5″', w: 168, h: 48 },
      { value: '48x168', label: 'Avery 5162 — 0.5″ × 1.75″', w: 48, h: 168 },
      { value: '192x96', label: '2″ × 1″', w: 192, h: 96 },
      { value: '96x192', label: '1″ × 2″', w: 96, h: 192 },
      { value: '96x288', label: '1″ × 3″', w: 96, h: 288 },
      { value: '48x96', label: '0.5″ × 1″', w: 48, h: 96 },
      { value: '48x144', label: '0.5″ × 1.5″', w: 48, h: 144 },
      { value: '96x48', label: '1″ × 0.5″', w: 96, h: 48 },
      { value: '144x48', label: '1.5″ × 0.5″', w: 144, h: 48 },
      { value: '192x144', label: '2″ × 1.5″', w: 192, h: 144 }
    ]},
    { group: 'Standard rectangular', items: [
      { value: '192x288', label: '2″ × 3″', w: 192, h: 288 },
      { value: '192x384', label: '2″ × 4″ (Avery 5163)', w: 192, h: 384 },
      { value: '128x384', label: 'Avery 5164 — 1.33″ × 4″', w: 128, h: 384 },
      { value: '288x192', label: '3″ × 2″', w: 288, h: 192 },
      { value: '288x384', label: '3″ × 4″', w: 288, h: 384 },
      { value: '288x480', label: '3″ × 5″', w: 288, h: 480 },
      { value: '384x192', label: '4″ × 2″', w: 384, h: 192 },
      { value: '384x288', label: '4″ × 3″', w: 384, h: 288 },
      { value: '384x480', label: '4″ × 5″', w: 384, h: 480 },
      { value: '384x576', label: '4″ × 6″ (photo / shipping)', w: 384, h: 576 },
      { value: '480x288', label: '5″ × 3″', w: 480, h: 288 },
      { value: '480x384', label: '5″ × 4″', w: 480, h: 384 },
      { value: '480x672', label: '5″ × 7″', w: 480, h: 672 },
      { value: '576x384', label: '6″ × 4″', w: 576, h: 384 }
    ]},
    { group: 'Name badges & cards', items: [
      { value: '216x336', label: 'Name badge — 2.25″ × 3.5″', w: 216, h: 336 },
      { value: '240x336', label: '2.5″ × 3.5″', w: 240, h: 336 },
      { value: '336x216', label: '3.5″ × 2.25″', w: 336, h: 216 },
      { value: '336x192', label: '3.5″ × 2″', w: 336, h: 192 },
      { value: '336x480', label: 'Business card — 3.5″ × 5″', w: 336, h: 480 },
      { value: '408x528', label: '4.25″ × 5.5″ (half letter)', w: 408, h: 528 }
    ]},
    { group: 'Large & sheet', items: [
      { value: '816x1056', label: 'Letter — 8.5″ × 11″', w: 816, h: 1056 },
      { value: '672x816', label: '7″ × 8.5″', w: 672, h: 816 },
      { value: '576x768', label: '6″ × 8″', w: 576, h: 768 }
    ]},
    { group: 'Metric (mm → px @ 96 DPI)', items: [
      { value: '94x189', label: '25 × 50 mm', w: 94, h: 189 },
      { value: '189x94', label: '50 × 25 mm', w: 189, h: 94 },
      { value: '113x189', label: '30 × 50 mm', w: 113, h: 189 },
      { value: '151x227', label: '40 × 60 mm', w: 151, h: 227 },
      { value: '189x302', label: '50 × 80 mm', w: 189, h: 302 },
      { value: '189x378', label: '50 × 100 mm', w: 189, h: 378 },
      { value: '280x397', label: 'A6 — 74 × 105 mm', w: 280, h: 397 },
      { value: '397x559', label: 'A5 — 105 × 148 mm', w: 397, h: 559 }
    ]}
  ];

  const LABEL_PRESETS = {};
  LABEL_PRESET_GROUPS.forEach(function (g) {
    g.items.forEach(function (it) {
      if (it.w != null && it.h != null) LABEL_PRESETS[it.value] = { w: it.w, h: it.h };
    });
  });

  function resizeCanvas() {
    let width = parseInt(document.getElementById('labelWidth').value, 10);
    let height = parseInt(document.getElementById('labelHeight').value, 10);
    if (isNaN(width) || isNaN(height) || width < MIN_CANVAS || height < MIN_CANVAS) {
      alert('Width and height must be at least ' + MIN_CANVAS + ' px.');
      return;
    }
    if (width > MAX_CANVAS || height > MAX_CANVAS) {
      alert('Width and height cannot exceed ' + MAX_CANVAS + ' px.');
      return;
    }
    width = Math.min(MAX_CANVAS, Math.max(MIN_CANVAS, width));
    height = Math.min(MAX_CANVAS, Math.max(MIN_CANVAS, height));
    document.getElementById('labelWidth').value = width;
    document.getElementById('labelHeight').value = height;
    canvas.setWidth(width);
    canvas.setHeight(height);
    canvas.renderAll();
    applyCanvasZoom();
    updateGridOverlay();
    updateRulers();
    LabelMaker.saveState();
  }

  function buildLabelPresetSelect() {
    const sel = document.getElementById('labelPreset');
    if (!sel) return;
    sel.innerHTML = '';
    LABEL_PRESET_GROUPS.forEach(function (g) {
      const optgroup = document.createElement('optgroup');
      optgroup.label = g.group;
      g.items.forEach(function (it) {
        const opt = document.createElement('option');
        opt.value = it.value;
        opt.textContent = it.label;
        optgroup.appendChild(opt);
      });
      sel.appendChild(optgroup);
    });
  }

  function applyLabelPreset() {
    const sel = document.getElementById('labelPreset');
    const val = sel && sel.value;
    if (!val || val === 'custom') return;
    const p = LABEL_PRESETS[val];
    if (!p) return;
    document.getElementById('labelWidth').value = p.w;
    document.getElementById('labelHeight').value = p.h;
    canvas.setWidth(p.w);
    canvas.setHeight(p.h);
    canvas.renderAll();
    applyCanvasZoom();
    LabelMaker.saveState();
  }

  function getGridSize() {
    const el = document.getElementById('gridSize');
    const v = parseInt(el && el.value, 10);
    return (el && !isNaN(v) && v >= 2) ? v : 10;
  }

  function snapToGrid(obj) {
    const g = getGridSize();
    const left = Math.round((obj.left || 0) / g) * g;
    const top = Math.round((obj.top || 0) / g) * g;
    obj.set({ left: left, top: top });
    if (obj.type === 'activeSelection') {
      obj.getObjects().forEach(function (o) {
        const l = Math.round((o.left || 0) / g) * g;
        const t = Math.round((o.top || 0) / g) * g;
        o.set({ left: l, top: t });
      });
    }
  }

  const guideState = { horizontal: [], vertical: [] };

  function updateGuidesVisibility() {
    const container = document.getElementById('canvasGuides');
    const showEl = document.getElementById('showGuides');
    if (!container || !showEl) return;
    const show = showEl.checked;
    container.classList.toggle('visible', show);
    container.setAttribute('aria-hidden', show ? 'false' : 'true');
  }

  function renderGuideLines() {
    const container = document.getElementById('canvasGuides');
    if (!container) return;
    container.innerHTML = '';
    guideState.horizontal.forEach(function (y, i) {
      const div = document.createElement('div');
      div.className = 'canvas-guide-line horizontal';
      div.style.top = y + 'px';
      div.dataset.type = 'h';
      div.dataset.index = String(i);
      div.setAttribute('aria-label', 'Horizontal guide');
      container.appendChild(div);
    });
    guideState.vertical.forEach(function (x, i) {
      const div = document.createElement('div');
      div.className = 'canvas-guide-line vertical';
      div.style.left = x + 'px';
      div.dataset.type = 'v';
      div.dataset.index = String(i);
      div.setAttribute('aria-label', 'Vertical guide');
      container.appendChild(div);
    });
    setupGuideDragListeners(container);
  }

  function setupGuideDragListeners(container) {
    if (!container) return;
    let dragging = null;
    let startY, startX;
    const inner = document.getElementById('canvasZoomInner');
    function toCanvasCoords(clientX, clientY) {
      if (!inner) return { x: 0, y: 0 };
      const rect = inner.getBoundingClientRect();
      const scaleX = inner.offsetWidth / rect.width;
      const scaleY = inner.offsetHeight / rect.height;
      return {
        x: (clientX - rect.left) * scaleX,
        y: (clientY - rect.top) * scaleY
      };
    }
    container.addEventListener('mousedown', function (e) {
      const line = e.target.closest('.canvas-guide-line');
      if (!line) return;
      e.preventDefault();
      const type = line.dataset.type;
      const index = parseInt(line.dataset.index, 10);
      if (type === 'h') {
        dragging = { type: 'h', index };
        startY = parseFloat(line.style.top) || 0;
      } else {
        dragging = { type: 'v', index };
        startX = parseFloat(line.style.left) || 0;
      }
    });
    document.addEventListener('mousemove', function (e) {
      if (!dragging) return;
      const coords = toCanvasCoords(e.clientX, e.clientY);
      if (dragging.type === 'h') {
        guideState.horizontal[dragging.index] = Math.round(coords.y);
      } else {
        guideState.vertical[dragging.index] = Math.round(coords.x);
      }
      renderGuideLines();
    });
    document.addEventListener('mouseup', function () {
      dragging = null;
    });
  }

  function addGuide(type) {
    const w = canvas.getWidth();
    const h = canvas.getHeight();
    if (type === 'h') {
      guideState.horizontal.push(Math.round(h / 2));
    } else {
      guideState.vertical.push(Math.round(w / 2));
    }
    updateGuidesVisibility();
    renderGuideLines();
  }

  function updateGridOverlay() {
    const overlay = document.getElementById('canvasGridOverlay');
    const showEl = document.getElementById('showGrid');
    if (!overlay || !showEl) return;
    const show = showEl.checked;
    overlay.classList.toggle('visible', show);
    overlay.setAttribute('aria-hidden', show ? 'false' : 'true');
    if (!show) return;
    const g = getGridSize();
    const size = Math.max(2, g);
    overlay.style.backgroundImage = [
      'linear-gradient(to right, rgba(128,128,128,0.35) 1px, transparent 1px)',
      'linear-gradient(to bottom, rgba(128,128,128,0.35) 1px, transparent 1px)'
    ].join(', ');
    overlay.style.backgroundSize = size + 'px ' + size + 'px';
  }

  function updateRulers() {
    const rulerH = document.getElementById('rulerHorizontal');
    const rulerV = document.getElementById('rulerVertical');
    if (!rulerH || !rulerV) return;
    const sel = document.getElementById('canvasZoom');
    const zoomVal = parseInt(sel && sel.value, 10) || 100;
    const zoom = zoomVal / 100;
    const w = canvas.getWidth();
    const h = canvas.getHeight();
    const displayW = Math.round(w * zoom);
    const displayH = Math.round(h * zoom);
    rulerH.style.width = displayW + 'px';
    rulerV.style.height = displayH + 'px';

    function buildHorizontalRuler() {
      rulerH.innerHTML = '';
      const step = 10;
      const majorStep = 50;
      for (let x = 0; x <= w; x += step) {
        const leftPx = (x * zoom).toFixed(1);
        const isMajor = x % majorStep === 0;
        const tick = document.createElement('span');
        tick.className = 'ruler-tick' + (isMajor ? ' ruler-tick-major' : '');
        tick.style.left = leftPx + 'px';
        if (isMajor) {
          const label = document.createElement('span');
          label.className = 'ruler-label';
          label.textContent = String(x);
          label.style.left = leftPx + 'px';
          rulerH.appendChild(label);
        }
        rulerH.appendChild(tick);
      }
    }

    function buildVerticalRuler() {
      rulerV.innerHTML = '';
      const step = 10;
      const majorStep = 50;
      for (let y = 0; y <= h; y += step) {
        const topPx = (y * zoom).toFixed(1);
        const isMajor = y % majorStep === 0;
        const tick = document.createElement('span');
        tick.className = 'ruler-tick' + (isMajor ? ' ruler-tick-major' : '');
        tick.style.top = topPx + 'px';
        if (isMajor) {
          const label = document.createElement('span');
          label.className = 'ruler-label';
          label.textContent = String(y);
          label.style.top = topPx + 'px';
          rulerV.appendChild(label);
        }
        rulerV.appendChild(tick);
      }
    }

    buildHorizontalRuler();
    buildVerticalRuler();
  }

  function applyCanvasZoom() {
    const sel = document.getElementById('canvasZoom');
    const val = parseInt(sel && sel.value, 10) || 100;
    const zoom = val / 100;
    const w = canvas.getWidth();
    const h = canvas.getHeight();
    const wrap = document.getElementById('canvasZoomWrap');
    const inner = document.getElementById('canvasZoomInner');
    if (wrap) {
      wrap.style.width = Math.round(w * zoom) + 'px';
      wrap.style.height = Math.round(h * zoom) + 'px';
    }
    if (inner) {
      inner.style.width = w + 'px';
      inner.style.height = h + 'px';
      inner.style.transform = 'scale(' + zoom + ')';
    }
    updateGridOverlay();
    updateRulers();
  }

  function alignObjects(how) {
    const active = canvas.getActiveObject();
    if (!active) return;
    const obj = active.type === 'activeSelection' ? active : null;
    const items = obj ? obj.getObjects() : (active ? [active] : []);
    if (items.length === 0) return;
    const bounds = obj ? obj.getBoundingRect() : active.getBoundingRect();
    const left = bounds.left;
    const top = bounds.top;
    const width = bounds.width;
    const height = bounds.height;
    items.forEach(function (o) {
      const oBounds = o.getBoundingRect();
      const oW = oBounds.width;
      const oH = oBounds.height;
      let newLeft = o.left;
      let newTop = o.top;
      if (how === 'left') newLeft = left;
      else if (how === 'center') newLeft = left + (width - oW) / 2;
      else if (how === 'right') newLeft = left + width - oW;
      else if (how === 'top') newTop = top;
      else if (how === 'middle') newTop = top + (height - oH) / 2;
      else if (how === 'bottom') newTop = top + height - oH;
      o.set({ left: newLeft, top: newTop });
    });
    if (obj) obj.setCoords();
    canvas.renderAll();
    LabelMaker.debouncedUpdateLayersList();
  }

  function updateOpacityControl() {
    const active = canvas.getActiveObject();
    const slider = document.getElementById('objectOpacity');
    const label = document.getElementById('opacityValue');
    if (!slider || !label) return;
    if (!active) {
      slider.value = 100;
      label.textContent = '100';
      return;
    }
    const op = (active.opacity != null ? active.opacity : 1) * 100;
    slider.value = Math.round(op);
    label.textContent = Math.round(op);
  }

  function setObjectOpacity(value) {
    const active = canvas.getActiveObject();
    if (!active) return;
    const v = Math.max(0, Math.min(100, parseInt(value, 10))) / 100;
    if (active.type === 'activeSelection') {
      active.getObjects().forEach(function (o) { o.set('opacity', v); });
    } else {
      active.set('opacity', v);
    }
    canvas.renderAll();
    if (document.getElementById('opacityValue')) document.getElementById('opacityValue').textContent = Math.round(v * 100);
  }

  document.getElementById('labelPreset').addEventListener('change', function () {
    if (this.value !== 'custom') {
      applyLabelPreset();
      try { localStorage.setItem('labelMakerLastPreset', this.value); } catch (err) {}
    }
  });

  function applyLockAspectRatioToSelection() {
    /* Lock aspect ratio is enforced in object:scaling via enforceLockAspectRatio using the checkbox state. */
  }

  function enforceLockAspectRatio(e) {
    const lockEl = document.getElementById('lockAspectRatio');
    if (!lockEl || !lockEl.checked) return;
    const obj = e.target;
    obj.set('scaleY', obj.scaleX || 1);
  }

  canvas.on('object:modified', function (e) {
    if (document.getElementById('snapToGrid') && document.getElementById('snapToGrid').checked) {
      snapToGrid(e.target);
      canvas.renderAll();
    }
  });

  canvas.on('object:scaling', enforceLockAspectRatio);

  const ZOOM_OPTIONS = [50, 75, 100, 125, 150, 200];

  function getCurrentZoomValue() {
    const sel = document.getElementById('canvasZoom');
    return parseInt(sel && sel.value, 10) || 100;
  }

  function setZoomValue(val) {
    const sel = document.getElementById('canvasZoom');
    if (!sel) return;
    const v = ZOOM_OPTIONS.indexOf(val) >= 0 ? val : 100;
    sel.value = String(v);
    applyCanvasZoom();
  }

  function zoomIn() {
    const cur = getCurrentZoomValue();
    const idx = ZOOM_OPTIONS.indexOf(cur);
    const next = idx < ZOOM_OPTIONS.length - 1 ? ZOOM_OPTIONS[idx + 1] : cur;
    setZoomValue(next);
  }

  function zoomOut() {
    const cur = getCurrentZoomValue();
    const idx = ZOOM_OPTIONS.indexOf(cur);
    const next = idx > 0 ? ZOOM_OPTIONS[idx - 1] : cur;
    setZoomValue(next);
  }

  function zoomReset() {
    setZoomValue(100);
  }

  document.getElementById('canvasZoom').addEventListener('change', applyCanvasZoom);
  document.getElementById('showGrid')?.addEventListener('change', updateGridOverlay);
  document.getElementById('gridSize')?.addEventListener('change', updateGridOverlay);
  document.getElementById('gridSize')?.addEventListener('input', updateGridOverlay);
  document.getElementById('showGuides')?.addEventListener('change', function () {
    updateGuidesVisibility();
    renderGuideLines();
  });
  document.getElementById('btnAddGuideH')?.addEventListener('click', function () { addGuide('h'); });
  document.getElementById('btnAddGuideV')?.addEventListener('click', function () { addGuide('v'); });
  document.getElementById('objectOpacity').addEventListener('input', function () {
    setObjectOpacity(this.value);
  });
  document.getElementById('bgColorPicker').addEventListener('input', function () {
    canvas.setBackgroundColor(this.value, canvas.renderAll.bind(canvas));
  });

  LabelMaker.resizeCanvas = resizeCanvas;
  LabelMaker.buildLabelPresetSelect = buildLabelPresetSelect;
  LabelMaker.applyLabelPreset = applyLabelPreset;
  LabelMaker.applyCanvasZoom = applyCanvasZoom;
  LabelMaker.zoomIn = zoomIn;
  LabelMaker.zoomOut = zoomOut;
  LabelMaker.zoomReset = zoomReset;
  LabelMaker.updateGridOverlay = updateGridOverlay;
  LabelMaker.updateRulers = updateRulers;
  LabelMaker.updateGuidesVisibility = updateGuidesVisibility;
  LabelMaker.renderGuideLines = renderGuideLines;
  LabelMaker.addGuide = addGuide;
  LabelMaker.applyLockAspectRatioToSelection = applyLockAspectRatioToSelection;
  LabelMaker.LABEL_PRESETS = LABEL_PRESETS;
  LabelMaker.updateOpacityControl = updateOpacityControl;
  LabelMaker.setObjectOpacity = setObjectOpacity;
  LabelMaker.alignObjects = alignObjects;

window.resizeCanvas = resizeCanvas;
window.alignObjects = alignObjects;

export {};
