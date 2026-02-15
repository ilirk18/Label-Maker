/**
 * Label Maker - Tools: text, QR, barcode, shapes, line, SVG, image, duplicate, copy/paste.
 */
const LabelMaker = window.LabelMaker;
const canvas = LabelMaker.canvas;

  function addText() {
    const color = document.getElementById('textColor').value;
    const fontSize = parseInt(document.getElementById('fontSize').value, 10);
    const fontFamily = document.getElementById('fontFamily').value;
    const align = (document.getElementById('textAlign') && document.getElementById('textAlign').value) || 'left';
    const text = new fabric.IText('Edit me', {
      left: 50,
      top: 50,
      fill: color,
      fontSize: fontSize,
      fontFamily: fontFamily,
      textAlign: align
    });
    canvas.add(text);
    canvas.setActiveObject(text);
    LabelMaker.setSelectedTextObj(text);
    LabelMaker.debouncedUpdateLayersList();
    if (typeof text.enterEditing === 'function') {
      text.enterEditing();
      if (typeof text.selectAll === 'function') text.selectAll();
      canvas.renderAll();
    }
  }

  function addQRCode() {
    const qrText = document.getElementById('qrText').value;
    if (!qrText) return alert('Please enter QR content');
    const size = Math.max(40, Math.min(400, parseInt(document.getElementById('qrSize').value, 10) || 100));
    const errorLevel = (document.getElementById('qrErrorLevel') && document.getElementById('qrErrorLevel').value) || 'M';
    const margin = Math.max(0, Math.min(10, parseInt(document.getElementById('qrMargin').value, 10) || 1));
    const dark = (document.getElementById('qrDark') && document.getElementById('qrDark').value) || '#000000';
    const light = (document.getElementById('qrLight') && document.getElementById('qrLight').value) || '#ffffff';
    const darkHex = dark.length === 7 ? dark + 'ff' : dark;
    const lightHex = light.length === 7 ? light + 'ff' : light;
    const opts = { width: size, margin: margin, errorCorrectionLevel: errorLevel, color: { dark: darkHex, light: lightHex } };
    QRCode.toDataURL(qrText, opts, function (err, url) {
      if (err) return console.error(err);
      fabric.Image.fromURL(url, function (img) {
        img.set({ left: 150, top: 50, scaleX: 1, scaleY: 1 });
        canvas.add(img);
        LabelMaker.debouncedUpdateLayersList();
      });
    });
  }

  function addBarcode() {
    const data = document.getElementById('barcodeData').value.trim();
    if (!data) return alert('Please enter barcode data');
    const format = (document.getElementById('barcodeFormat') && document.getElementById('barcodeFormat').value) || 'CODE128';
    const width = Math.max(1, parseInt(document.getElementById('barcodeWidth').value, 10) || 2);
    const height = Math.max(20, parseInt(document.getElementById('barcodeHeight').value, 10) || 50);
    try {
      const c = document.createElement('canvas');
      JsBarcode(c, data, { format: format, width: width, height: height });
      const url = c.toDataURL('image/png');
      fabric.Image.fromURL(url, function (img) {
        img.set({ left: 80, top: 50 });
        img._barcode = true;
        canvas.add(img);
        LabelMaker.debouncedUpdateLayersList();
      });
    } catch (err) {
      alert('Barcode error: ' + (err.message || 'invalid data for format'));
    }
  }

  function addSVG() {
    const input = document.getElementById('svgUpload');
    if (!input.files.length) return alert('Please choose an SVG file');
    const reader = new FileReader();
    reader.onload = function (e) {
      try {
        fabric.loadSVGFromString(e.target.result, function (objects, options) {
          const obj = fabric.util.groupSVGElements(objects, options);
          obj.scaleToWidth(100);
          obj.scaleToHeight(100);
          obj.set({ left: 100, top: 100 });
          canvas.add(obj);
          canvas.renderAll();
          LabelMaker.debouncedUpdateLayersList();
        });
      } catch (err) {
        alert('Could not load SVG. The file may be invalid.');
        console.error(err);
      }
    };
    reader.readAsText(input.files[0]);
    input.value = '';
  }

  function addImage() {
    const input = document.getElementById('imageUpload');
    if (!input.files.length) return alert('Please choose an image file');
    const file = input.files[0];
    const url = URL.createObjectURL(file);
    fabric.Image.fromURL(url, function (img) {
      img.scaleToWidth(150);
      img.set({ left: 80, top: 50 });
      canvas.add(img);
      canvas.renderAll();
      LabelMaker.debouncedUpdateLayersList();
      URL.revokeObjectURL(url);
    }, { crossOrigin: 'anonymous' });
    input.value = '';
  }

  function addImageFromUrl() {
    const url = document.getElementById('imageUrl') && document.getElementById('imageUrl').value.trim();
    if (!url) return alert('Please enter an image URL');
    fabric.Image.fromURL(url, function (img) {
      img.scaleToWidth(150);
      img.set({ left: 80, top: 50 });
      canvas.add(img);
      canvas.renderAll();
      LabelMaker.debouncedUpdateLayersList();
    }, { crossOrigin: 'anonymous' });
  }

  /** Remove background via Python rembg server (run scripts/remove_bg_server.py first). */
  const REMOVE_BG_SERVER = 'http://localhost:5050';
  function addImageWithBackgroundRemoved() {
    const input = document.getElementById('imageUploadNoBg');
    if (!input || !input.files.length) {
      alert('Please choose an image file first.');
      return;
    }
    const file = input.files[0];
    const btn = document.getElementById('btnAddImageNoBg');
    if (btn) {
      btn.disabled = true;
      btn.textContent = 'Processing…';
    }
    const formData = new FormData();
    formData.append('file', file);
    fetch(REMOVE_BG_SERVER + '/remove-bg', {
      method: 'POST',
      body: formData
    })
      .then(function (res) {
        if (!res.ok) return res.json().then(function (body) { throw new Error(body.error || res.statusText); });
        return res.blob();
      })
      .then(function (blob) {
        const url = URL.createObjectURL(blob);
        fabric.Image.fromURL(url, function (img) {
          img.scaleToWidth(150);
          img.set({ left: 80, top: 50 });
          canvas.add(img);
          canvas.renderAll();
          LabelMaker.debouncedUpdateLayersList();
          URL.revokeObjectURL(url);
        }, { crossOrigin: 'anonymous' });
      })
      .catch(function (err) {
        alert('Remove background failed. Is the Python server running?\nRun: python scripts/remove_bg_server.py\n\n' + (err.message || err));
      })
      .finally(function () {
        if (btn) {
          btn.disabled = false;
          btn.textContent = 'Add image (no background)';
        }
        input.value = '';
      });
  }

  function getShapeFill() {
    const outlineOnly = document.getElementById('shapeOutlineOnly') && document.getElementById('shapeOutlineOnly').checked;
    if (outlineOnly) return 'transparent';
    return document.getElementById('shapeFill').value;
  }

  // -------- Photoshop/Illustrator-style shape tools: click-drag to draw --------
  let currentShapeTool = null;
  let _shapeDrawStart = null;
  let _shapePreview = null;
  let _shapeDrawing = false;

  const SHAPE_TOOL_BUTTONS = {
    rect: 'btnShapeRect',
    roundedRect: 'btnShapeRounded',
    circle: 'btnShapeCircle',
    ellipse: 'btnShapeEllipse',
    triangle: 'btnShapeTriangle',
    star: 'btnShapeStar',
    line: 'btnShapeLine'
  };

  function setShapeTool(tool) {
    currentShapeTool = tool;
    if (tool !== null) {
      panMode = false;
      eyedropperMode = false;
      if (typeof updateCanvasToolButtons === 'function') updateCanvasToolButtons('select');
    }
    document.querySelectorAll('[id^="btnShape"]').forEach(function (btn) {
      const id = btn.id;
      const isSelect = id === 'btnShapeSelect';
      const active = (tool === null && isSelect) || (tool && SHAPE_TOOL_BUTTONS[tool] === id);
      btn.classList.toggle('active', !!active);
    });
    const btnCanvasSelect = document.getElementById('btnCanvasSelect');
    if (btnCanvasSelect) btnCanvasSelect.classList.toggle('active', tool === null);
    canvas.selection = (tool === null);
    canvas.defaultCursor = tool ? 'crosshair' : 'default';
    canvas.hoverCursor = tool ? 'crosshair' : 'move';
    if (tool && canvas.isDrawingMode) {
      canvas.isDrawingMode = false;
      if (LabelMaker.setDrawingTool) LabelMaker.setDrawingTool('select');
    }
    if (tool === null && !panMode && !eyedropperMode && typeof updateCanvasToolButtons === 'function') updateCanvasToolButtons('select');
    updateCanvasAreaCursor();
    if (typeof LabelMaker.updatePropertiesPanel === 'function') LabelMaker.updatePropertiesPanel();
  }

  function getShapeToolStyle() {
    const fill = getShapeFill();
    const stroke = document.getElementById('shapeStroke').value;
    const strokeW = Math.max(0, parseInt(document.getElementById('shapeStrokeWidth').value, 10) || 0);
    return { fill: fill, stroke: stroke, strokeWidth: strokeW };
  }

  function createShapeFromBounds(tool, left, top, width, height) {
    if (width < 2) width = 2;
    if (height < 2) height = 2;
    const style = getShapeToolStyle();
    if (tool === 'rect') {
      return new fabric.Rect({ left: left, top: top, width: width, height: height, selectable: true, ...style });
    }
    if (tool === 'roundedRect') {
      const rx = Math.min(16, width / 4);
      const ry = Math.min(16, height / 4);
      return new fabric.Rect({ left: left, top: top, width: width, height: height, rx: rx, ry: ry, selectable: true, ...style });
    }
    if (tool === 'circle') {
      const r = Math.min(width, height) / 2;
      return new fabric.Circle({ left: left + width / 2, top: top + height / 2, radius: r, originX: 'center', originY: 'center', selectable: true, ...style });
    }
    if (tool === 'ellipse') {
      const rx = width / 2;
      const ry = height / 2;
      return new fabric.Ellipse({ left: left + rx, top: top + ry, rx: rx, ry: ry, originX: 'center', originY: 'center', selectable: true, ...style });
    }
    if (tool === 'triangle') {
      return new fabric.Triangle({ left: left, top: top, width: width, height: height, selectable: true, ...style });
    }
    if (tool === 'star') {
      const points = [
        { x: 50, y: 0 }, { x: 61, y: 35 }, { x: 98, y: 35 }, { x: 68, y: 57 }, { x: 79, y: 92 },
        { x: 50, y: 70 }, { x: 21, y: 92 }, { x: 32, y: 57 }, { x: 2, y: 35 }, { x: 39, y: 35 }
      ];
      const poly = new fabric.Polygon(points, { left: 0, top: 0, fill: style.fill, stroke: style.stroke, strokeWidth: style.strokeWidth });
      const br = poly.getBoundingRect();
      const scaleX = width / (br.width || 1);
      const scaleY = height / (br.height || 1);
      poly.set({ scaleX: scaleX, scaleY: scaleY, left: left, top: top, selectable: true });
      poly.setCoords();
      return poly;
    }
    return null;
  }

  function createLineFromPoints(x1, y1, x2, y2) {
    const color = document.getElementById('lineColor').value;
    const width = Math.max(1, parseInt(document.getElementById('lineWidth').value, 10) || 2);
    const arrow = (document.getElementById('lineArrow') && document.getElementById('lineArrow').value) || 'none';
    const line = new fabric.Line([x1, y1, x2, y2], { stroke: color, strokeWidth: width, selectable: true });
    if (arrow === 'none') return line;
    const angle = Math.atan2(y2 - y1, x2 - x1);
    const arrowLen = Math.min(15, width * 5);
    const parts = [line];
    if (arrow === 'end' || arrow === 'both') {
      const t = new fabric.Triangle({
        width: arrowLen * 2, height: arrowLen * 2, fill: color, left: x2, top: y2,
        originX: 'center', originY: 'center', angle: (angle * 180 / Math.PI)
      });
      parts.push(t);
    }
    if (arrow === 'start' || arrow === 'both') {
      const t = new fabric.Triangle({
        width: arrowLen * 2, height: arrowLen * 2, fill: color, left: x1, top: y1,
        originX: 'center', originY: 'center', angle: (angle + Math.PI) * 180 / Math.PI
      });
      parts.push(t);
    }
    return new fabric.Group(parts, { left: 0, top: 0, selectable: true });
  }

  function boundsFromTwoPoints(start, current, shiftKey, altKey) {
    let x1 = start.x;
    let y1 = start.y;
    let x2 = current.x;
    let y2 = current.y;
    if (altKey) {
      const cx = (x1 + x2) / 2;
      const cy = (y1 + y2) / 2;
      const w = Math.abs(x2 - x1);
      const h = Math.abs(y2 - y1);
      x1 = cx - w / 2;
      y1 = cy - h / 2;
      x2 = cx + w / 2;
      y2 = cy + h / 2;
    }
    let left = Math.min(x1, x2);
    let top = Math.min(y1, y2);
    let width = Math.abs(x2 - x1);
    let height = Math.abs(y2 - y1);
    if (shiftKey && currentShapeTool !== 'line') {
      const side = Math.max(width, height);
      width = side;
      height = side;
      if (altKey) {
        const cx = (start.x + current.x) / 2;
        const cy = (start.y + current.y) / 2;
        left = cx - side / 2;
        top = cy - side / 2;
      } else {
        left = x1 <= x2 ? x1 : x2 - side;
        top = y1 <= y2 ? y1 : y2 - side;
      }
    }
    return { left: left, top: top, width: width, height: height };
  }

  function linePointsWithShift(x1, y1, x2, y2, shiftKey) {
    if (!shiftKey) return { x1: x1, y1: y1, x2: x2, y2: y2 };
    const dx = x2 - x1;
    const dy = y2 - y1;
    const angle = Math.atan2(dy, dx);
    const snap = Math.PI / 4;
    const snapped = Math.round(angle / snap) * snap;
    const len = Math.sqrt(dx * dx + dy * dy);
    return {
      x1: x1, y1: y1,
      x2: x1 + len * Math.cos(snapped),
      y2: y1 + len * Math.sin(snapped)
    };
  }

  function createPreviewShape(tool, bounds) {
    const style = getShapeToolStyle();
    const previewStyle = { ...style, selectable: false, evented: false, opacity: 0.6, strokeDashArray: [4, 4] };
    if (tool === 'line') return null;
    const s = createShapeFromBounds(tool, bounds.left, bounds.top, bounds.width, bounds.height);
    if (!s) return null;
    s.set(previewStyle);
    return s;
  }

  function createPreviewLine(x1, y1, x2, y2) {
    const color = document.getElementById('lineColor').value;
    const width = Math.max(1, parseInt(document.getElementById('lineWidth').value, 10) || 2);
    return new fabric.Line([x1, y1, x2, y2], { stroke: color, strokeWidth: width, selectable: false, evented: false, opacity: 0.7, strokeDashArray: [6, 4] });
  }

  function getDrawingCanvasElement() {
    if (canvas.lowerCanvasEl && canvas.lowerCanvasEl.getContext) return canvas.lowerCanvasEl;
    if (canvas.upperCanvasEl && canvas.upperCanvasEl.getContext) return canvas.upperCanvasEl;
    const el = canvas.getElement ? canvas.getElement() : null;
    if (el && el.getContext) return el;
    if (el && el.tagName === 'DIV' && el.querySelector) {
      const c = el.querySelector('canvas');
      if (c && c.getContext) return c;
    }
    const byId = document.getElementById('labelCanvas');
    if (byId && byId.getContext) return byId;
    return null;
  }

  function sampleColorAtPointer(pointer) {
    const el = getDrawingCanvasElement();
    if (!el) return null;
    const x = Math.floor(pointer.x);
    const y = Math.floor(pointer.y);
    const w = canvas.getWidth();
    const h = canvas.getHeight();
    if (x < 0 || x >= w || y < 0 || y >= h) return null;
    try {
      const ctx = el.getContext('2d');
      if (!ctx) return null;
      const data = ctx.getImageData(x, y, 1, 1).data;
      const r = data[0];
      const g = data[1];
      const b = data[2];
      const a = data[3];
      if (a < 8) {
        const bg = canvas.backgroundColor;
        if (typeof bg === 'string' && bg.startsWith('#')) return bg;
        if (typeof bg === 'string' && bg.startsWith('rgb')) return bg;
        return '#ffffff';
      }
      return '#' + [r, g, b].map(function (c) { return c.toString(16).padStart(2, '0'); }).join('');
    } catch (err) {
      return null;
    }
  }

  function applyEyedropperColor(hex) {
    applySampledColorToFillStroke(hex);
    updateSampledColorDisplay(hex);
  }

  function updateSampledColorDisplay(hex) {
    const h = hex || '#000000';
    const circle = document.getElementById('sampledColorCircle');
    const hexEl = document.getElementById('sampledColorHex');
    const picker = document.getElementById('sampledColorPicker');
    if (circle) circle.style.backgroundColor = h;
    if (hexEl) hexEl.textContent = h.toUpperCase();
    if (picker) picker.value = h;
  }

  function applySampledColorToFillStroke(hex) {
    const shapeFill = document.getElementById('shapeFill');
    const shapeStroke = document.getElementById('shapeStroke');
    const textColor = document.getElementById('textColor');
    const lineColor = document.getElementById('lineColor');
    const drawColor = document.getElementById('drawColor');
    if (shapeFill) shapeFill.value = hex;
    if (shapeStroke) shapeStroke.value = hex;
    if (textColor) textColor.value = hex;
    if (lineColor) lineColor.value = hex;
    if (drawColor) drawColor.value = hex;
  }

  let eyedropperMode = false;
  let panMode = false;
  let panStart = null;
  let panX = 0;
  let panY = 0;
  const rulersLayout = document.querySelector('.canvas-rulers-layout');

  function updateCanvasAreaCursor() {
    const el = document.querySelector('.canvas-rulers-layout');
    if (!el) return;
    let c = 'default';
    if (panStart && panMode) c = 'grabbing';
    else if (panMode) c = 'grab';
    else if (eyedropperMode) c = 'crosshair';
    else if (currentDrawingTool && currentDrawingTool !== 'select') c = 'crosshair';
    else if (currentShapeTool) c = 'crosshair';
    else c = 'default';
    el.style.cursor = c;
  }

  function updateCanvasToolButtons(activeTool) {
    const btnSelect = document.getElementById('btnCanvasSelect');
    const btnPan = document.getElementById('btnCanvasPan');
    const btnEyedropper = document.getElementById('btnCanvasEyedropper');
    [btnSelect, btnPan, btnEyedropper].forEach(function (btn) {
      if (!btn) return;
      const isSelect = btn === btnSelect && activeTool === 'select';
      const isPan = btn === btnPan && activeTool === 'pan';
      const isEyedropper = btn === btnEyedropper && activeTool === 'eyedropper';
      btn.classList.toggle('active', isSelect || isPan || isEyedropper);
    });
  }

  function setEyedropperMode(on) {
    eyedropperMode = !!on;
    if (eyedropperMode) {
      setShapeTool(null);
      setDrawingTool('select');
      panMode = false;
      canvas.selection = false;
      canvas.defaultCursor = 'crosshair';
      canvas.hoverCursor = 'crosshair';
    }
    updateCanvasToolButtons(eyedropperMode ? 'eyedropper' : 'select');
    updateCanvasAreaCursor();
    if (typeof LabelMaker.updatePropertiesPanel === 'function') LabelMaker.updatePropertiesPanel();
  }

  function setPanTool(on) {
    panMode = !!on;
    if (panMode) {
      setShapeTool(null);
      setDrawingTool('select');
      eyedropperMode = false;
      canvas.selection = false;
      canvas.defaultCursor = 'grab';
      canvas.hoverCursor = 'grab';
    } else {
      canvas.selection = true;
      canvas.defaultCursor = currentShapeTool ? 'crosshair' : 'default';
      canvas.hoverCursor = currentShapeTool ? 'crosshair' : 'move';
    }
    updateCanvasToolButtons(panMode ? 'pan' : 'select');
    updateCanvasAreaCursor();
    if (typeof LabelMaker.updatePropertiesPanel === 'function') LabelMaker.updatePropertiesPanel();
  }

  function applyPanTransform() {
    if (rulersLayout) rulersLayout.style.transform = 'translate(' + panX + 'px, ' + panY + 'px)';
  }

  canvas.on('mouse:down', function (e) {
    if (eyedropperMode) {
      const pointer = canvas.getPointer(e.e);
      const hex = sampleColorAtPointer(pointer);
      if (hex) {
        applyEyedropperColor(hex);
      }
      setEyedropperMode(false);
      canvas.selection = true;
      canvas.defaultCursor = currentShapeTool ? 'crosshair' : 'default';
      canvas.hoverCursor = currentShapeTool ? 'crosshair' : 'move';
      updateCanvasToolButtons('select');
      updateCanvasAreaCursor();
      return;
    }
    if (panMode) {
      panStart = { clientX: e.e.clientX, clientY: e.e.clientY };
      if (canvas.defaultCursor === 'grab') canvas.defaultCursor = 'grabbing';
      if (canvas.hoverCursor === 'grab') canvas.hoverCursor = 'grabbing';
      updateCanvasAreaCursor();
      return;
    }
    if (e.e.altKey && !e.e.shiftKey) {
      const pointer = canvas.getPointer(e.e);
      const hex = sampleColorAtPointer(pointer);
      if (hex) applyEyedropperColor(hex);
      return;
    }
    if (currentShapeTool && !_shapeDrawing && !canvas.isDrawingMode) {
      const pointer = canvas.getPointer(e.e);
      _shapeDrawStart = { x: pointer.x, y: pointer.y };
      _shapeDrawing = true;
      if (_shapePreview) {
        canvas.remove(_shapePreview);
        _shapePreview = null;
      }
      if (currentShapeTool === 'line') {
        _shapePreview = createPreviewLine(pointer.x, pointer.y, pointer.x, pointer.y);
        if (_shapePreview) canvas.add(_shapePreview);
      }
      canvas.requestRenderAll();
    }
  });

  canvas.on('mouse:move', function (e) {
    if (panStart) {
      const dx = e.e.clientX - panStart.clientX;
      const dy = e.e.clientY - panStart.clientY;
      panStart.clientX = e.e.clientX;
      panStart.clientY = e.e.clientY;
      panX += dx;
      panY += dy;
      applyPanTransform();
      return;
    }
    if (!_shapeDrawing || !_shapeDrawStart) return;
    const pointer = canvas.getPointer(e.e);
    const shiftKey = e.e && e.e.shiftKey;
    const altKey = e.e && e.e.altKey;

    if (currentShapeTool === 'line') {
      const pts = linePointsWithShift(_shapeDrawStart.x, _shapeDrawStart.y, pointer.x, pointer.y, shiftKey);
      if (_shapePreview && _shapePreview.type === 'line') {
        _shapePreview.set({ x1: pts.x1, y1: pts.y1, x2: pts.x2, y2: pts.y2 });
      }
    } else {
      const bounds = boundsFromTwoPoints(_shapeDrawStart, pointer, shiftKey, altKey);
      if (_shapePreview) canvas.remove(_shapePreview);
      _shapePreview = createPreviewShape(currentShapeTool, bounds);
      if (_shapePreview) canvas.add(_shapePreview);
    }
    canvas.requestRenderAll();
  });

  canvas.on('mouse:up', function (e) {
    if (panStart) {
      panStart = null;
      if (panMode) {
        canvas.defaultCursor = 'grab';
        canvas.hoverCursor = 'grab';
      }
      updateCanvasAreaCursor();
      return;
    }
    if (!_shapeDrawing || !_shapeDrawStart) return;
    const pointer = canvas.getPointer(e.e);
    const shiftKey = e.e && e.e.shiftKey;
    const altKey = e.e && e.e.altKey;

    if (_shapePreview) {
      canvas.remove(_shapePreview);
      _shapePreview = null;
    }

    if (currentShapeTool === 'line') {
      const pts = linePointsWithShift(_shapeDrawStart.x, _shapeDrawStart.y, pointer.x, pointer.y, shiftKey);
      const dist = Math.sqrt(Math.pow(pts.x2 - pts.x1, 2) + Math.pow(pts.y2 - pts.y1, 2));
      if (dist >= 2) {
        const obj = createLineFromPoints(pts.x1, pts.y1, pts.x2, pts.y2);
        canvas.add(obj);
        canvas.setActiveObject(obj);
        LabelMaker.saveState();
        LabelMaker.debouncedUpdateLayersList();
      }
    } else {
      const bounds = boundsFromTwoPoints(_shapeDrawStart, pointer, shiftKey, altKey);
      if (bounds.width >= 2 && bounds.height >= 2) {
        const obj = createShapeFromBounds(currentShapeTool, bounds.left, bounds.top, bounds.width, bounds.height);
        if (obj) {
          canvas.add(obj);
          canvas.setActiveObject(obj);
          LabelMaker.saveState();
          LabelMaker.debouncedUpdateLayersList();
        }
      }
    }

    _shapeDrawing = false;
    _shapeDrawStart = null;
    canvas.requestRenderAll();
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && _shapeDrawing) {
      e.preventDefault();
      if (_shapePreview) {
        canvas.remove(_shapePreview);
        _shapePreview = null;
      }
      _shapeDrawing = false;
      _shapeDrawStart = null;
      canvas.requestRenderAll();
    }
  });

  function isShapeDrawing() {
    return _shapeDrawing;
  }

  function addLine() {
    const color = document.getElementById('lineColor').value;
    const width = Math.max(1, parseInt(document.getElementById('lineWidth').value, 10) || 2);
    const arrow = (document.getElementById('lineArrow') && document.getElementById('lineArrow').value) || 'none';
    const x1 = 50;
    const y1 = 100;
    const x2 = 200;
    const y2 = 100;
    const line = new fabric.Line([x1, y1, x2, y2], { stroke: color, strokeWidth: width, selectable: true });
    if (arrow === 'none') {
      canvas.add(line);
      LabelMaker.debouncedUpdateLayersList();
      return;
    }
    const angle = Math.atan2(y2 - y1, x2 - x1);
    const arrowLen = Math.min(15, width * 5);
    const headAngle = Math.PI / 6;
    const parts = [line];
    if (arrow === 'end' || arrow === 'both') {
      const t = new fabric.Triangle({
        width: arrowLen * 2,
        height: arrowLen * 2,
        fill: color,
        left: x2,
        top: y2,
        originX: 'center',
        originY: 'center',
        angle: (angle * 180 / Math.PI)
      });
      parts.push(t);
    }
    if (arrow === 'start' || arrow === 'both') {
      const t = new fabric.Triangle({
        width: arrowLen * 2,
        height: arrowLen * 2,
        fill: color,
        left: x1,
        top: y1,
        originX: 'center',
        originY: 'center',
        angle: (angle + Math.PI) * 180 / Math.PI
      });
      parts.push(t);
    }
    const group = new fabric.Group(parts, { left: 0, top: 0, selectable: true });
    group.set({ left: 80, top: 50 });
    canvas.add(group);
    LabelMaker.debouncedUpdateLayersList();
  }

  function addRectangle() {
    const fill = getShapeFill();
    const stroke = document.getElementById('shapeStroke').value;
    const strokeW = Math.max(0, parseInt(document.getElementById('shapeStrokeWidth').value, 10) || 0);
    const rect = new fabric.Rect({ left: 80, top: 50, width: 120, height: 80, fill: fill, stroke: stroke, strokeWidth: strokeW });
    canvas.add(rect);
    canvas.setActiveObject(rect);
    LabelMaker.debouncedUpdateLayersList();
  }

  function addCircle() {
    const fill = getShapeFill();
    const stroke = document.getElementById('shapeStroke').value;
    const strokeW = Math.max(0, parseInt(document.getElementById('shapeStrokeWidth').value, 10) || 0);
    const circle = new fabric.Circle({ left: 80, top: 50, radius: 50, fill: fill, stroke: stroke, strokeWidth: strokeW });
    canvas.add(circle);
    canvas.setActiveObject(circle);
    LabelMaker.debouncedUpdateLayersList();
  }

  function addEllipse() {
    const fill = getShapeFill();
    const stroke = document.getElementById('shapeStroke').value;
    const strokeW = Math.max(0, parseInt(document.getElementById('shapeStrokeWidth').value, 10) || 0);
    const ellipse = new fabric.Ellipse({ left: 80, top: 50, rx: 60, ry: 35, fill: fill, stroke: stroke, strokeWidth: strokeW });
    canvas.add(ellipse);
    canvas.setActiveObject(ellipse);
    LabelMaker.debouncedUpdateLayersList();
  }

  function addRoundedRect() {
    const fill = getShapeFill();
    const stroke = document.getElementById('shapeStroke').value;
    const strokeW = Math.max(0, parseInt(document.getElementById('shapeStrokeWidth').value, 10) || 0);
    const rect = new fabric.Rect({ left: 80, top: 50, width: 120, height: 80, rx: 16, ry: 16, fill: fill, stroke: stroke, strokeWidth: strokeW });
    canvas.add(rect);
    canvas.setActiveObject(rect);
    LabelMaker.debouncedUpdateLayersList();
  }

  function addTriangle() {
    const fill = getShapeFill();
    const stroke = document.getElementById('shapeStroke').value;
    const strokeW = Math.max(0, parseInt(document.getElementById('shapeStrokeWidth').value, 10) || 0);
    const tri = new fabric.Triangle({ left: 80, top: 50, width: 100, height: 90, fill: fill, stroke: stroke, strokeWidth: strokeW });
    canvas.add(tri);
    canvas.setActiveObject(tri);
    LabelMaker.debouncedUpdateLayersList();
  }

  function addStar() {
    const fill = getShapeFill();
    const stroke = document.getElementById('shapeStroke').value;
    const strokeW = Math.max(0, parseInt(document.getElementById('shapeStrokeWidth').value, 10) || 0);
    const star = new fabric.Polygon([
      { x: 50, y: 0 }, { x: 61, y: 35 }, { x: 98, y: 35 }, { x: 68, y: 57 }, { x: 79, y: 92 },
      { x: 50, y: 70 }, { x: 21, y: 92 }, { x: 32, y: 57 }, { x: 2, y: 35 }, { x: 39, y: 35 }
    ], { left: 80, top: 50, fill: fill, stroke: stroke, strokeWidth: strokeW });
    canvas.add(star);
    canvas.setActiveObject(star);
    LabelMaker.debouncedUpdateLayersList();
  }

  function addCallout() {
    const fill = getShapeFill();
    const stroke = document.getElementById('shapeStroke').value;
    const strokeW = Math.max(0, parseInt(document.getElementById('shapeStrokeWidth').value, 10) || 0);
    const rect = new fabric.Rect({ left: 0, top: 0, width: 140, height: 70, rx: 8, ry: 8, fill: fill, stroke: stroke, strokeWidth: strokeW });
    const tail = new fabric.Triangle({ width: 24, height: 20, fill: fill, stroke: stroke, strokeWidth: strokeW, left: 58, top: 70, angle: 180 });
    const group = new fabric.Group([rect, tail], { left: 80, top: 40, selectable: true });
    group.userDefinedName = 'Callout';
    canvas.add(group);
    canvas.setActiveObject(group);
    LabelMaker.debouncedUpdateLayersList();
  }

  function addTable() {
    const rows = Math.max(1, Math.min(20, parseInt(document.getElementById('tableRows')?.value, 10) || 3));
    const cols = Math.max(1, Math.min(20, parseInt(document.getElementById('tableCols')?.value, 10) || 4));
    const cellW = Math.max(8, parseInt(document.getElementById('tableCellW')?.value, 10) || 40);
    const cellH = Math.max(8, parseInt(document.getElementById('tableCellH')?.value, 10) || 24);
    const fill = getShapeFill();
    const stroke = document.getElementById('shapeStroke').value;
    const strokeW = Math.max(0, parseInt(document.getElementById('shapeStrokeWidth').value, 10) || 0);
    const cells = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const rect = new fabric.Rect({
          left: c * cellW,
          top: r * cellH,
          width: cellW,
          height: cellH,
          fill: fill,
          stroke: stroke,
          strokeWidth: strokeW
        });
        cells.push(rect);
      }
    }
    const group = new fabric.Group(cells, { left: 50, top: 50, selectable: true });
    group.userDefinedName = 'Table';
    canvas.add(group);
    canvas.setActiveObject(group);
    LabelMaker.debouncedUpdateLayersList();
  }

  function addDatePlaceholder() {
    const color = document.getElementById('textColor').value;
    const fontSize = parseInt(document.getElementById('fontSize').value, 10);
    const fontFamily = document.getElementById('fontFamily').value;
    const d = new Date();
    const str = d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
    const text = new fabric.IText(str, {
      left: 50,
      top: 50,
      fill: color,
      fontSize: fontSize,
      fontFamily: fontFamily
    });
    text.userDefinedName = 'Date';
    canvas.add(text);
    canvas.setActiveObject(text);
    LabelMaker.setSelectedTextObj(text);
    LabelMaker.debouncedUpdateLayersList();
  }

  function groupSelected() {
    const active = canvas.getActiveObject();
    if (!active) return alert('Select two or more objects (Shift+click).');
    if (active.type !== 'activeSelection') return alert('Select multiple objects: hold Shift and click each object.');
    const group = active.toGroup();
    group.userDefinedName = 'Group';
    canvas.requestRenderAll();
    LabelMaker.debouncedUpdateLayersList();
  }

  function ungroupSelected() {
    const active = canvas.getActiveObject();
    if (!active) return alert('Select a group first.');
    if (active.type !== 'group') return alert('Selected object is not a group.');
    const items = active.getObjects();
    if (typeof active._restoreObjectsState === 'function') active._restoreObjectsState();
    canvas.remove(active);
    items.forEach(function (item) {
      item.setCoords && item.setCoords();
      canvas.add(item);
    });
    canvas.discardActiveObject();
    canvas.requestRenderAll();
    LabelMaker.debouncedUpdateLayersList();
  }

  function duplicateWithOffset() {
    const active = canvas.getActiveObject();
    if (!active) return alert('Select an object first.');
    const offsetX = 20;
    const offsetY = 20;
    const inputX = document.getElementById('duplicateOffsetX');
    const inputY = document.getElementById('duplicateOffsetY');
    const dx = (inputX && !isNaN(parseInt(inputX.value, 10))) ? parseInt(inputX.value, 10) : offsetX;
    const dy = (inputY && !isNaN(parseInt(inputY.value, 10))) ? parseInt(inputY.value, 10) : offsetY;
    if (active.type === 'activeSelection') {
      active.clone(function (cloned) {
        cloned.set({ left: (active.left || 0) + dx, top: (active.top || 0) + dy });
        cloned.canvas = canvas;
        cloned.setCoords();
        canvas.add(cloned);
        canvas.setActiveObject(cloned);
        LabelMaker.debouncedUpdateLayersList();
      }, ['userDefinedName']);
      return;
    }
    active.clone(function (cloned) {
      cloned.set({ left: (active.left || 0) + dx, top: (active.top || 0) + dy });
      canvas.add(cloned);
      canvas.setActiveObject(cloned);
      LabelMaker.debouncedUpdateLayersList();
    });
  }

  function duplicateSelected() {
    const active = canvas.getActiveObject();
    if (!active) return alert('Select an object first (e.g. from canvas or Layers).');
    if (active.type === 'activeSelection') {
      active.clone(function (cloned) {
        cloned.set({ left: (active.left || 0) + 20, top: (active.top || 0) + 20 });
        cloned.canvas = canvas;
        cloned.setCoords();
        canvas.add(cloned);
        canvas.setActiveObject(cloned);
        LabelMaker.debouncedUpdateLayersList();
      }, ['userDefinedName']);
      return;
    }
    active.clone(function (cloned) {
      cloned.set({ left: (active.left || 0) + 20, top: (active.top || 0) + 20 });
      canvas.add(cloned);
      canvas.setActiveObject(cloned);
      LabelMaker.debouncedUpdateLayersList();
    });
  }

  let clipboardObject = null;
  function copySelected() {
    const active = canvas.getActiveObject();
    if (!active) return;
    clipboardObject = active.toObject(['userDefinedName']);
  }

  function pasteFromClipboard() {
    if (!clipboardObject) return;
    fabric.util.enlivenObjects([clipboardObject], function (objs) {
      const o = objs[0];
      if (!o) return;
      o.set({ left: (o.left || 0) + 20, top: (o.top || 0) + 20 });
      canvas.add(o);
      canvas.setActiveObject(o);
      canvas.renderAll();
      LabelMaker.debouncedUpdateLayersList();
    });
  }

  function deleteSelected() {
    const active = canvas.getActiveObject();
    if (!active) return;
    if (active.type === 'activeSelection') {
      active.getObjects().forEach(function (o) { canvas.remove(o); });
      canvas.discardActiveObject();
    } else {
      canvas.remove(active);
    }
    canvas.requestRenderAll();
    LabelMaker.debouncedUpdateLayersList();
  }

  function cutSelected() {
    const active = canvas.getActiveObject();
    if (!active) return;
    copySelected();
    deleteSelected();
  }

  function bringSelectedToFront() {
    const active = canvas.getActiveObject();
    if (!active) return;
    active.bringToFront();
    canvas.requestRenderAll();
  }

  function sendSelectedToBack() {
    const active = canvas.getActiveObject();
    if (!active) return;
    active.sendToBack();
    canvas.requestRenderAll();
  }

  function bringSelectedForward() {
    const active = canvas.getActiveObject();
    if (!active) return;
    active.bringForward();
    canvas.requestRenderAll();
  }

  function sendSelectedBackward() {
    const active = canvas.getActiveObject();
    if (!active) return;
    active.sendBackwards();
    canvas.requestRenderAll();
  }

  // -------- Pencil & brush (freehand draw) --------
  let currentDrawingTool = 'select';

  function getDrawColor() {
    const el = document.getElementById('drawColor');
    return (el && el.value) ? el.value : '#000000';
  }

  function getDrawSize() {
    const el = document.getElementById('drawSize');
    const v = parseInt(el && el.value, 10);
    return (el && !isNaN(v) && v >= 1) ? Math.min(50, v) : 2;
  }

  function applyDrawBrushSettings() {
    if (!canvas.freeDrawingBrush) return;
    canvas.freeDrawingBrush.color = getDrawColor();
    canvas.freeDrawingBrush.width = getDrawSize();
  }

  function setDrawingTool(mode) {
    currentDrawingTool = mode;
    const btnPencil = document.getElementById('btnToolPencil');
    const btnBrush = document.getElementById('btnToolBrush');
    const btnSpray = document.getElementById('btnToolSpray');
    const btnEraser = document.getElementById('btnToolEraser');
    const btnSelect = document.getElementById('btnToolSelect') || document.getElementById('btnCanvasSelect');
    if (btnPencil) btnPencil.classList.toggle('active', mode === 'pencil');
    if (btnBrush) btnBrush.classList.toggle('active', mode === 'brush');
    if (btnSpray) btnSpray.classList.toggle('active', mode === 'spray');
    if (btnEraser) btnEraser.classList.toggle('active', mode === 'eraser');
    if (btnSelect) btnSelect.classList.toggle('active', mode === 'select');

    updateCanvasAreaCursor();
    if (typeof LabelMaker.updatePropertiesPanel === 'function') LabelMaker.updatePropertiesPanel();

    if (mode === 'select') {
      panMode = false;
      eyedropperMode = false;
      canvas.isDrawingMode = false;
      canvas.defaultCursor = currentShapeTool ? 'crosshair' : 'default';
      canvas.hoverCursor = currentShapeTool ? 'crosshair' : 'move';
      canvas.selection = (currentShapeTool === null);
      if (typeof updateCanvasToolButtons === 'function') updateCanvasToolButtons('select');
      return;
    }
    panMode = false;
    eyedropperMode = false;
    if (typeof updateCanvasToolButtons === 'function') updateCanvasToolButtons('select');
    setShapeTool(null);

    canvas.isDrawingMode = true;
    canvas.defaultCursor = 'crosshair';
    canvas.hoverCursor = 'crosshair';

    if (mode === 'pencil') {
      if (!(canvas.freeDrawingBrush instanceof fabric.PencilBrush)) {
        canvas.freeDrawingBrush = new fabric.PencilBrush(canvas);
      }
      applyDrawBrushSettings();
    } else if (mode === 'brush') {
      if (!(canvas.freeDrawingBrush instanceof fabric.CircleBrush)) {
        canvas.freeDrawingBrush = new fabric.CircleBrush(canvas);
      }
      applyDrawBrushSettings();
    } else if (mode === 'spray' && typeof fabric.SprayBrush !== 'undefined') {
      if (!(canvas.freeDrawingBrush instanceof fabric.SprayBrush)) {
        canvas.freeDrawingBrush = new fabric.SprayBrush(canvas);
      }
      applyDrawBrushSettings();
    } else if (mode === 'eraser') {
      if (!(canvas.freeDrawingBrush instanceof fabric.CircleBrush)) {
        canvas.freeDrawingBrush = new fabric.CircleBrush(canvas);
      }
      canvas.freeDrawingBrush.color = canvas.backgroundColor || '#ffffff';
      canvas.freeDrawingBrush.width = Math.min(30, getDrawSize() * 3);
    } else if (mode === 'spray') {
      if (!(canvas.freeDrawingBrush instanceof fabric.CircleBrush)) {
        canvas.freeDrawingBrush = new fabric.CircleBrush(canvas);
      }
      applyDrawBrushSettings();
    }
    if (mode !== 'eraser') applyDrawBrushSettings();
  }

  document.getElementById('drawColor').addEventListener('input', function () {
    if (currentDrawingTool === 'pencil' || currentDrawingTool === 'brush' || currentDrawingTool === 'spray') applyDrawBrushSettings();
  });
  document.getElementById('drawSize').addEventListener('input', function () {
    if (currentDrawingTool === 'pencil' || currentDrawingTool === 'brush' || currentDrawingTool === 'spray') applyDrawBrushSettings();
    if (currentDrawingTool === 'eraser' && canvas.freeDrawingBrush) {
      canvas.freeDrawingBrush.color = canvas.backgroundColor || '#ffffff';
      canvas.freeDrawingBrush.width = Math.min(30, getDrawSize() * 3);
    }
  });

  canvas.on('path:created', function () {
    LabelMaker.debouncedUpdateLayersList();
  });

  LabelMaker.setDrawingTool = setDrawingTool;
  LabelMaker.setShapeTool = setShapeTool;
  LabelMaker.setPanTool = setPanTool;
  const btnEyedropperEl = document.getElementById('btnCanvasEyedropper');
  if (btnEyedropperEl) {
    btnEyedropperEl.addEventListener('click', function () {
      setEyedropperMode(true);
    });
  }

  const sampledColorPickerEl = document.getElementById('sampledColorPicker');
  if (sampledColorPickerEl) {
    sampledColorPickerEl.addEventListener('input', function () {
      const hex = this.value;
      updateSampledColorDisplay(hex);
      applySampledColorToFillStroke(hex);
    });
    sampledColorPickerEl.addEventListener('change', function () {
      const hex = this.value;
      updateSampledColorDisplay(hex);
      applySampledColorToFillStroke(hex);
    });
  }

  const initialFill = document.getElementById('shapeFill') && document.getElementById('shapeFill').value;
  if (initialFill) updateSampledColorDisplay(initialFill);

  LabelMaker.setEyedropperMode = setEyedropperMode;
  LabelMaker.updateSampledColorDisplay = updateSampledColorDisplay;
  LabelMaker.updateCanvasToolButtons = updateCanvasToolButtons;
  LabelMaker.updateCanvasAreaCursor = updateCanvasAreaCursor;
  LabelMaker.currentShapeTool = function () { return currentShapeTool; };
  LabelMaker.isShapeDrawing = isShapeDrawing;

  /** Returns active tool key for Properties panel: 'text' | 'shape' | 'line' | 'draw' | 'eyedropper' | null */
  function getActiveTool() {
    if (panMode) return null;
    if (eyedropperMode) return 'eyedropper';
    if (currentDrawingTool && currentDrawingTool !== 'select') return 'draw';
    if (currentShapeTool === 'line') return 'line';
    if (currentShapeTool) return 'shape';
    return 'text';
  }
  LabelMaker.getActiveTool = getActiveTool;

  updateCanvasAreaCursor();

  LabelMaker.addText = addText;
  LabelMaker.addQRCode = addQRCode;
  LabelMaker.addBarcode = addBarcode;
  LabelMaker.addSVG = addSVG;
  LabelMaker.addImage = addImage;
  LabelMaker.addImageFromUrl = addImageFromUrl;
  LabelMaker.addImageWithBackgroundRemoved = addImageWithBackgroundRemoved;
  LabelMaker.addLine = addLine;
  LabelMaker.addRectangle = addRectangle;
  LabelMaker.addCircle = addCircle;
  LabelMaker.addRoundedRect = addRoundedRect;
  LabelMaker.addTriangle = addTriangle;
  LabelMaker.addStar = addStar;
  LabelMaker.addEllipse = addEllipse;
  LabelMaker.addCallout = addCallout;
  LabelMaker.addTable = addTable;
  LabelMaker.addDatePlaceholder = addDatePlaceholder;
  LabelMaker.groupSelected = groupSelected;
  LabelMaker.ungroupSelected = ungroupSelected;
  LabelMaker.duplicateSelected = duplicateSelected;
  LabelMaker.duplicateWithOffset = duplicateWithOffset;
  LabelMaker.copySelected = copySelected;
  LabelMaker.pasteFromClipboard = pasteFromClipboard;
  LabelMaker.deleteSelected = deleteSelected;
  LabelMaker.cutSelected = cutSelected;
  LabelMaker.bringSelectedToFront = bringSelectedToFront;
  LabelMaker.sendSelectedToBack = sendSelectedToBack;
  LabelMaker.bringSelectedForward = bringSelectedForward;
  LabelMaker.sendSelectedBackward = sendSelectedBackward;

window.addText = addText;
window.addQRCode = addQRCode;
window.addBarcode = addBarcode;
window.addSVG = addSVG;
window.addImage = addImage;
window.addImageFromUrl = addImageFromUrl;
window.addImageWithBackgroundRemoved = addImageWithBackgroundRemoved;
window.addLine = addLine;
window.addRectangle = addRectangle;
window.addCircle = addCircle;
window.addRoundedRect = addRoundedRect;
window.addTriangle = addTriangle;
window.addStar = addStar;
window.addEllipse = addEllipse;
window.addCallout = addCallout;
window.addTable = addTable;
window.addDatePlaceholder = addDatePlaceholder;
window.groupSelected = groupSelected;
window.ungroupSelected = ungroupSelected;
window.duplicateWithOffset = duplicateWithOffset;
window.duplicateSelected = duplicateSelected;
window.deleteSelected = deleteSelected;
window.cutSelected = cutSelected;
window.bringSelectedToFront = bringSelectedToFront;
window.sendSelectedToBack = sendSelectedToBack;
window.bringSelectedForward = bringSelectedForward;
window.sendSelectedBackward = sendSelectedBackward;
window.setDrawingTool = setDrawingTool;
window.setShapeTool = setShapeTool;
window.setPanTool = setPanTool;
window.setEyedropperMode = setEyedropperMode;
window.updateCanvasToolButtons = updateCanvasToolButtons;

export {};
