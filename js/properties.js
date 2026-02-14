/**
 * Label Maker - Properties panel: tabs, object properties, all property input handlers.
 */
const LabelMaker = window.LabelMaker;
const canvas = LabelMaker.canvas;

  function switchRightPanelTab(tabName) {
    document.querySelectorAll('.right-panel-tab').forEach(function (btn) {
      const isActive = btn.getAttribute('data-tab') === tabName;
      btn.classList.toggle('active', isActive);
      btn.setAttribute('aria-pressed', isActive ? 'true' : 'false');
    });
    const layersPanel = document.getElementById('layersPanel');
    const isStacked = layersPanel && layersPanel.classList.contains('tabs-layout-stacked');
    const paneLayers = document.getElementById('paneLayers');
    const paneProperties = document.getElementById('paneProperties');
    if (isStacked) {
      if (paneLayers) paneLayers.classList.remove('hidden');
      if (paneProperties) paneProperties.classList.remove('hidden');
    } else {
      if (paneLayers) paneLayers.classList.toggle('hidden', tabName !== 'layers');
      if (paneProperties) paneProperties.classList.toggle('hidden', tabName !== 'properties');
    }
  }

  function hasFillAndStroke(type) {
    return ['rect', 'circle', 'ellipse', 'triangle', 'polygon', 'i-text', 'line'].indexOf(type) !== -1;
  }

  function setPropValue(id, value) {
    const el = document.getElementById(id);
    if (!el) return;
    if (el.type === 'checkbox') el.checked = !!value;
    else el.value = value;
  }

  function updatePropertiesPanel() {
    const emptyEl = document.querySelector('.properties-empty');
    const fieldsEl = document.getElementById('propertiesFields');
    if (!emptyEl || !fieldsEl) return;
    const obj = canvas.getActiveObject();
    if (!obj || (canvas.getActiveObjects && canvas.getActiveObjects().length > 1)) {
      emptyEl.classList.remove('hidden');
      fieldsEl.classList.add('hidden');
      return;
    }
    emptyEl.classList.add('hidden');
    fieldsEl.classList.remove('hidden');
    const type = obj.type || '';
    document.querySelectorAll('.prop-section').forEach(function (section) {
      let show = false;
      if (section.classList.contains('prop-section-transform')) show = true;
      else if (section.classList.contains('prop-section-fill')) show = hasFillAndStroke(type);
      else if (section.classList.contains('prop-section-text')) show = type === 'i-text';
      else if (section.classList.contains('prop-section-rect')) show = type === 'rect';
      else if (section.classList.contains('prop-section-circle')) show = type === 'circle';
      else if (section.classList.contains('prop-section-ellipse')) show = type === 'ellipse';
      else if (section.classList.contains('prop-section-image')) show = type === 'image';
      else if (section.classList.contains('prop-section-line')) show = type === 'line';
      section.classList.toggle('hidden', !show);
    });
    const left = Math.round(obj.left);
    const top = Math.round(obj.top);
    const w = Math.round((obj.width * (obj.scaleX || 1)) || 0);
    const h = Math.round((obj.height * (obj.scaleY || 1)) || 0);
    const angle = Math.round(obj.angle || 0);
    const opacity = Math.round((obj.opacity ?? 1) * 100);
    setPropValue('propLeft', left);
    setPropValue('propTop', top);
    setPropValue('propWidth', w);
    setPropValue('propHeight', h);
    setPropValue('propAngle', angle);
    setPropValue('propOpacity', opacity);
    const flipX = document.getElementById('propFlipX');
    const flipY = document.getElementById('propFlipY');
    if (flipX) flipX.checked = !!obj.flipX;
    if (flipY) flipY.checked = !!obj.flipY;
    const fill = (typeof obj.fill === 'string') ? obj.fill : '#000000';
    const stroke = (typeof obj.stroke === 'string') ? obj.stroke : '#000000';
    setPropValue('propFill', fill);
    setPropValue('propStroke', stroke);
    setPropValue('propStrokeWidth', Math.round(obj.strokeWidth || 0));
    setPropValue('propFontFamily', obj.fontFamily || 'Arial');
    setPropValue('propFontSize', Math.round(obj.fontSize || 20));
    const propBold = document.getElementById('propBold');
    const propItalic = document.getElementById('propItalic');
    if (propBold) propBold.checked = obj.fontWeight === 'bold';
    if (propItalic) propItalic.checked = obj.fontStyle === 'italic';
    setPropValue('propTextAlign', obj.textAlign || 'left');
    setPropValue('propRx', Math.round(obj.rx || 0));
    setPropValue('propRy', Math.round(obj.ry || 0));
    if (type === 'ellipse') {
      setPropValue('propEllipseRx', Math.round(obj.rx || 0));
      setPropValue('propEllipseRy', Math.round(obj.ry || 0));
    }
    if (type === 'image') {
      const grayscaleEl = document.getElementById('propImageGrayscale');
      const brightnessEl = document.getElementById('propImageBrightness');
      const filters = obj.filters || [];
      function isGrayscale(f) { return f && (f.type === 'Grayscale' || (f.constructor && f.constructor.type === 'Grayscale')); }
      function isBrightness(f) { return f && (f.type === 'Brightness' || (f.constructor && f.constructor.type === 'Brightness')); }
      const hasGrayscale = filters.some(isGrayscale);
      let brightnessVal = 0;
      const brightnessFilter = filters.find(isBrightness);
      if (brightnessFilter && brightnessFilter.brightness != null) brightnessVal = Math.round(brightnessFilter.brightness * 100);
      if (grayscaleEl) grayscaleEl.checked = !!hasGrayscale;
      if (brightnessEl) brightnessEl.value = brightnessVal;
    }
    const radius = obj.radius != null ? Math.round(obj.radius) : Math.round((obj.width * (obj.scaleX || 1)) / 2);
    setPropValue('propRadius', radius);
    const x1 = obj.x1 != null ? Math.round(obj.x1) : 0;
    const y1 = obj.y1 != null ? Math.round(obj.y1) : 0;
    const x2 = obj.x2 != null ? Math.round(obj.x2) : 0;
    const y2 = obj.y2 != null ? Math.round(obj.y2) : 0;
    setPropValue('propLineX1', x1);
    setPropValue('propLineY1', y1);
    setPropValue('propLineX2', x2);
    setPropValue('propLineY2', y2);
  }

  function applyPropertyFromInput(value, setter) {
    const obj = canvas.getActiveObject();
    if (!obj) return;
    const num = typeof value === 'number' ? value : parseFloat(value);
    if (isNaN(num)) return;
    setter(obj, num);
    canvas.renderAll();
    LabelMaker.saveState();
  }

  function syncTextControlsFromSelection() {
    const obj = canvas.getActiveObject();
    if (obj && obj.type === 'i-text') LabelMaker.updateTextControls({ selected: [obj] });
  }

  document.querySelectorAll('.right-panel-tab').forEach(function (btn) {
    btn.addEventListener('click', function () { switchRightPanelTab(this.getAttribute('data-tab')); });
  });

  canvas.on('object:modified', function () { updatePropertiesPanel(); });

  ['propLeft', 'propTop', 'propAngle'].forEach(function (id) {
    const el = document.getElementById(id);
    if (!el) return;
    const key = id === 'propLeft' ? 'left' : id === 'propTop' ? 'top' : 'angle';
    el.addEventListener('change', function () { applyPropertyFromInput(this.value, function (o, v) { o.set(key, v); }); });
  });
  document.getElementById('propWidth')?.addEventListener('change', function () {
    const obj = canvas.getActiveObject();
    if (!obj) return;
    const v = parseFloat(this.value);
    if (isNaN(v) || v <= 0) return;
    obj.set('scaleX', v / (obj.width || 1));
    canvas.renderAll();
    LabelMaker.saveState();
  });
  document.getElementById('propHeight')?.addEventListener('change', function () {
    const obj = canvas.getActiveObject();
    if (!obj) return;
    const v = parseFloat(this.value);
    if (isNaN(v) || v <= 0) return;
    obj.set('scaleY', v / (obj.height || 1));
    canvas.renderAll();
    LabelMaker.saveState();
  });
  document.getElementById('propOpacity')?.addEventListener('change', function () {
    const obj = canvas.getActiveObject();
    if (!obj) return;
    const v = parseFloat(this.value);
    if (isNaN(v)) return;
    obj.set('opacity', Math.max(0, Math.min(1, v / 100)));
    canvas.renderAll();
    LabelMaker.saveState();
    LabelMaker.updateOpacityControl();
  });
  document.getElementById('propFlipX')?.addEventListener('change', function () {
    const obj = canvas.getActiveObject();
    if (!obj) return;
    obj.set('flipX', this.checked);
    canvas.renderAll();
    LabelMaker.saveState();
  });
  document.getElementById('propFlipY')?.addEventListener('change', function () {
    const obj = canvas.getActiveObject();
    if (!obj) return;
    obj.set('flipY', this.checked);
    canvas.renderAll();
    LabelMaker.saveState();
  });
  document.getElementById('propFill')?.addEventListener('input', function () {
    const obj = canvas.getActiveObject();
    if (!obj) return;
    obj.set('fill', this.value);
    canvas.renderAll();
    LabelMaker.saveState();
    if (obj.type === 'i-text') syncTextControlsFromSelection();
  });
  document.getElementById('propStroke')?.addEventListener('input', function () {
    const obj = canvas.getActiveObject();
    if (!obj) return;
    obj.set('stroke', this.value);
    canvas.renderAll();
    LabelMaker.saveState();
  });
  document.getElementById('propStrokeWidth')?.addEventListener('change', function () {
    const obj = canvas.getActiveObject();
    if (!obj) return;
    const v = Math.max(0, parseFloat(this.value));
    if (isNaN(v)) return;
    obj.set('strokeWidth', v);
    canvas.renderAll();
    LabelMaker.saveState();
  });
  ['propFontFamily', 'propFontSize', 'propBold', 'propItalic', 'propTextAlign'].forEach(function (id) {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener('change', function () {
      const obj = canvas.getActiveObject();
      if (!obj || obj.type !== 'i-text') return;
      if (id === 'propFontFamily') obj.set('fontFamily', this.value);
      else if (id === 'propFontSize') obj.set('fontSize', parseInt(this.value, 10) || 20);
      else if (id === 'propBold') obj.set('fontWeight', this.checked ? 'bold' : 'normal');
      else if (id === 'propItalic') obj.set('fontStyle', this.checked ? 'italic' : 'normal');
      else if (id === 'propTextAlign') obj.set('textAlign', this.value);
      canvas.renderAll();
      LabelMaker.saveState();
      syncTextControlsFromSelection();
    });
  });
  document.getElementById('propRx')?.addEventListener('change', function () {
    const obj = canvas.getActiveObject();
    if (!obj || obj.type !== 'rect') return;
    const v = Math.max(0, parseFloat(this.value));
    if (isNaN(v)) return;
    obj.set('rx', v);
    canvas.renderAll();
    LabelMaker.saveState();
  });
  document.getElementById('propRy')?.addEventListener('change', function () {
    const obj = canvas.getActiveObject();
    if (!obj || obj.type !== 'rect') return;
    const v = Math.max(0, parseFloat(this.value));
    if (isNaN(v)) return;
    obj.set('ry', v);
    canvas.renderAll();
    LabelMaker.saveState();
  });
  document.getElementById('propRadius')?.addEventListener('change', function () {
    const obj = canvas.getActiveObject();
    if (!obj || obj.type !== 'circle') return;
    const v = parseFloat(this.value);
    if (isNaN(v) || v < 1) return;
    obj.set('radius', v);
    canvas.renderAll();
    LabelMaker.saveState();
  });
  document.getElementById('propEllipseRx')?.addEventListener('change', function () {
    const obj = canvas.getActiveObject();
    if (!obj || obj.type !== 'ellipse') return;
    const v = Math.max(1, parseFloat(this.value));
    if (isNaN(v)) return;
    obj.set('rx', v);
    canvas.renderAll();
    LabelMaker.saveState();
  });
  document.getElementById('propEllipseRy')?.addEventListener('change', function () {
    const obj = canvas.getActiveObject();
    if (!obj || obj.type !== 'ellipse') return;
    const v = Math.max(1, parseFloat(this.value));
    if (isNaN(v)) return;
    obj.set('ry', v);
    canvas.renderAll();
    LabelMaker.saveState();
  });
  function isGrayscaleFilter(f) { return f && (f.type === 'Grayscale' || (f.constructor && f.constructor.type === 'Grayscale')); }
  function isBrightnessFilter(f) { return f && (f.type === 'Brightness' || (f.constructor && f.constructor.type === 'Brightness')); }
  document.getElementById('propImageGrayscale')?.addEventListener('change', function () {
    const obj = canvas.getActiveObject();
    if (!obj || obj.type !== 'image') return;
    const filters = obj.filters || [];
    let grayscale = filters.find(isGrayscaleFilter);
    if (this.checked) {
      if (!grayscale && typeof fabric !== 'undefined' && fabric.Image && fabric.Image.filters && fabric.Image.filters.Grayscale) {
        grayscale = new fabric.Image.filters.Grayscale();
        filters.push(grayscale);
        obj.filters = filters;
      }
    } else {
      obj.filters = filters.filter(function (f) { return !isGrayscaleFilter(f); });
    }
    if (typeof obj.applyFilters === 'function') obj.applyFilters();
    canvas.renderAll();
    LabelMaker.saveState();
  });
  document.getElementById('propImageBrightness')?.addEventListener('change', function () {
    const obj = canvas.getActiveObject();
    if (!obj || obj.type !== 'image') return;
    const v = Math.max(-100, Math.min(100, parseFloat(this.value)));
    if (isNaN(v)) return;
    const amount = v / 100;
    const filters = obj.filters || [];
    let brightness = filters.find(isBrightnessFilter);
    if (amount !== 0) {
      if (!brightness && typeof fabric !== 'undefined' && fabric.Image && fabric.Image.filters && fabric.Image.filters.Brightness) {
        brightness = new fabric.Image.filters.Brightness({ brightness: amount });
        filters.push(brightness);
        obj.filters = filters;
      } else if (brightness) brightness.brightness = amount;
    } else {
      obj.filters = filters.filter(function (f) { return !isBrightnessFilter(f); });
    }
    if (typeof obj.applyFilters === 'function') obj.applyFilters();
    canvas.renderAll();
    LabelMaker.saveState();
  });
  [
    { id: 'propLineX1', key: 'x1' },
    { id: 'propLineY1', key: 'y1' },
    { id: 'propLineX2', key: 'x2' },
    { id: 'propLineY2', key: 'y2' }
  ].forEach(function (item) {
    const el = document.getElementById(item.id);
    if (!el) return;
    const key = item.key;
    el.addEventListener('change', function () {
      const obj = canvas.getActiveObject();
      if (!obj || obj.type !== 'line') return;
      const v = parseFloat(this.value);
      if (isNaN(v)) return;
      obj.set(key, v);
      canvas.renderAll();
      LabelMaker.saveState();
    });
  });

LabelMaker.switchRightPanelTab = switchRightPanelTab;
LabelMaker.updatePropertiesPanel = updatePropertiesPanel;

export {};
