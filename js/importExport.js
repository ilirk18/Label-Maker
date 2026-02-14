/**
 * Label Maker - Import/Export: open, save, load, export (PNG/PDF/XML/ZPL), print, clear, new.
 */
const LabelMaker = window.LabelMaker;
const canvas = LabelMaker.canvas;

  function getExportFilename(ext) {
    const raw = document.getElementById('exportFilename');
    const name = (raw && raw.value.trim()) ? raw.value.trim() : 'label';
    return name.replace(/\.(png|xml|zpl|pdf|json)$/i, '') + (ext ? '.' + ext : '');
  }

  function exportCanvasToZPL(canvasObj, filename) {
    const c = canvasObj || canvas;
    filename = filename || getExportFilename('zpl');
    const img = new Image();
    img.src = c.toDataURL({ format: 'png', multiplier: 1 });
    img.onload = function () {
      const width = img.width;
      const height = img.height;
      const rowBytes = Math.ceil(width / 8);
      const totalBytes = rowBytes * height;
      const offCanvas = document.createElement('canvas');
      offCanvas.width = width;
      offCanvas.height = height;
      const ctx = offCanvas.getContext('2d');
      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, width, height);
      let zplData = '';
      for (let y = 0; y < height; y++) {
        let row = '';
        for (let x = 0; x < width; x += 8) {
          let byte = 0;
          for (let b = 0; b < 8; b++) {
            const px = x + b;
            if (px < width) {
              const i = (y * width + px) * 4;
              const avg = (imageData.data[i] + imageData.data[i + 1] + imageData.data[i + 2]) / 3;
              byte |= (avg < 128 ? 1 : 0) << (7 - b);
            }
          }
          row += byte.toString(16).padStart(2, '0').toUpperCase();
        }
        zplData += row;
      }
      const zplCode = '^XA\n^FO0,0^GFA,' + totalBytes + ',' + totalBytes + ',' + rowBytes + ',' + zplData + '\n^XZ';
      const blob = new Blob([zplCode], { type: 'text/plain' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);
    };
  }

  function exportAsImage() {
    const scale = parseInt(document.getElementById('exportScale') && document.getElementById('exportScale').value, 10) || 1;
    const mult = Math.max(1, Math.min(3, scale));
    const dataURL = canvas.toDataURL({ format: 'png', quality: 1, multiplier: mult });
    const link = document.createElement('a');
    link.download = getExportFilename('png');
    link.href = dataURL;
    link.click();
  }

  function printCanvas() {
    const dataURL = canvas.toDataURL({ format: 'png', quality: 1 });
    const w = window.open('', '_blank');
    w.document.write('<html><head><title>Print</title></head><body style="margin:0;display:flex;justify-content:center;align-items:center;min-height:100vh;"><img src="' + dataURL + '" style="max-width:100%;height:auto;" /></body></html>');
    w.document.close();
    w.focus();
    w.onload = function () { w.print(); w.close(); };
  }

  function clearCanvas() {
    if (!confirm('Remove all objects from the canvas?')) return;
    canvas.clear();
    canvas.setBackgroundColor(document.getElementById('bgColorPicker').value || '#ffffff', canvas.renderAll.bind(canvas));
    canvas.renderAll();
    LabelMaker.debouncedUpdateLayersList();
    LabelMaker.updateEmptyState();
    LabelMaker.saveState();
  }

  function newDesign() {
    if (!confirm('Start a new design? Unsaved changes will be lost.')) return;
    canvas.clear();
    canvas.setBackgroundColor('#ffffff', canvas.renderAll.bind(canvas));
    document.getElementById('bgColorPicker').value = '#ffffff';
    document.getElementById('labelWidth').value = 400;
    document.getElementById('labelHeight').value = 200;
    document.getElementById('labelPreset').value = 'custom';
    canvas.setWidth(400);
    canvas.setHeight(200);
    canvas.renderAll();
    LabelMaker.applyCanvasZoom();
    LabelMaker.debouncedUpdateLayersList();
    LabelMaker.updateEmptyState();
    LabelMaker.saveState();
  }

  function exportAsPDF() {
    const w = canvas.getWidth();
    const h = canvas.getHeight();
    const dataURL = canvas.toDataURL({ format: 'png', quality: 1 });
    try {
      const { jsPDF } = window.jspdf;
      const pdf = new jsPDF({ unit: 'px', format: [w, h], hotfixes: ['px_scaling'] });
      pdf.addImage(dataURL, 'PNG', 0, 0, w, h);
      pdf.save(getExportFilename('pdf'));
    } catch (err) {
      alert('PDF export failed. Make sure the script loaded.');
      console.error(err);
    }
  }

  function saveDesignAsJSON() {
    const json = canvas.toJSON(['userDefinedName']);
    const bg = canvas.backgroundColor || '#ffffff';
    const design = { version: 1, canvas: json, backgroundColor: bg, width: canvas.getWidth(), height: canvas.getHeight() };
    const blob = new Blob([JSON.stringify(design, null, 2)], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = getExportFilename('json');
    link.click();
    URL.revokeObjectURL(link.href);
  }

  function loadDesignFromJSON() {
    const input = document.getElementById('jsonImport');
    if (!input.files.length) return alert('Choose a design file (.json).');
    const file = input.files[0];
    const reader = new FileReader();
    reader.onload = function () {
      try {
        const design = JSON.parse(reader.result);
        const canvasData = design.canvas || design;
        const bg = design.backgroundColor || '#ffffff';
        const w = design.width || canvas.getWidth();
        const h = design.height || canvas.getHeight();
        LabelMaker.setRestoring(true);
        canvas.loadFromJSON(canvasData, function () {
          canvas.setBackgroundColor(bg, canvas.renderAll.bind(canvas));
          canvas.setWidth(w);
          canvas.setHeight(h);
          document.getElementById('labelWidth').value = w;
          document.getElementById('labelHeight').value = h;
          const presetEl = document.getElementById('labelPreset');
          if (presetEl) presetEl.value = 'custom';
          canvas.renderAll();
          LabelMaker.applyCanvasZoom();
          LabelMaker.setSelectedTextObj(null);
          LabelMaker.updateLayersList();
          LabelMaker.updateEmptyState();
          LabelMaker.setRestoring(false);
          LabelMaker.saveState();
        });
      } catch (err) {
        alert('Could not load design file.');
        console.error(err);
      }
    };
    reader.readAsText(file);
    input.value = '';
  }

  function getFileExtension(file) {
    const name = file.name || '';
    const i = name.lastIndexOf('.');
    return i >= 0 ? name.substring(i + 1).toLowerCase() : '';
  }

  function getTextContent(el, tag) {
    const n = el.querySelector(tag);
    return n ? n.textContent.trim() : '';
  }

  function openAsJSON(file) {
    const reader = new FileReader();
    reader.onload = function () {
      try {
        const design = JSON.parse(reader.result);
        const canvasData = design.canvas || design;
        const bg = design.backgroundColor || '#ffffff';
        const w = design.width || canvas.getWidth();
        const h = design.height || canvas.getHeight();
        LabelMaker.setRestoring(true);
        canvas.loadFromJSON(canvasData, function () {
          canvas.setBackgroundColor(bg, canvas.renderAll.bind(canvas));
          canvas.setWidth(w);
          canvas.setHeight(h);
          document.getElementById('labelWidth').value = w;
          document.getElementById('labelHeight').value = h;
          const presetEl = document.getElementById('labelPreset');
          if (presetEl) presetEl.value = 'custom';
          canvas.renderAll();
          LabelMaker.applyCanvasZoom();
          LabelMaker.setSelectedTextObj(null);
          LabelMaker.updateLayersList();
          LabelMaker.updateEmptyState();
          LabelMaker.setRestoring(false);
          LabelMaker.saveState();
        });
      } catch (err) {
        alert('Could not load JSON file.');
        console.error(err);
      }
    };
    reader.readAsText(file);
  }

  function finishOpenXML() {
    canvas.renderAll();
    LabelMaker.debouncedUpdateLayersList();
    LabelMaker.updateEmptyState();
    LabelMaker.saveState();
  }

  function openAsXML(file) {
    const reader = new FileReader();
    reader.onload = function (e) {
      try {
        const parser = new DOMParser();
        const doc = parser.parseFromString(e.target.result, 'text/xml');
        const label = doc.querySelector('label');
        if (!label) { alert('Invalid label XML.'); return; }
        canvas.clear();
        canvas.setBackgroundColor(document.getElementById('bgColorPicker').value || '#ffffff', canvas.renderAll.bind(canvas));
        const objectEls = label.querySelectorAll('object');
        let done = 0;
        const total = objectEls.length;
        if (total === 0) { finishOpenXML(); return; }
        objectEls.forEach(function (objEl) {
          const type = objEl.getAttribute('type');
          const left = parseFloat(getTextContent(objEl, 'left')) || 0;
          const top = parseFloat(getTextContent(objEl, 'top')) || 0;
          if (type === 'i-text') {
            const text = getTextContent(objEl, 'text') || 'Text';
            const fontSize = parseInt(getTextContent(objEl, 'fontSize'), 10) || 20;
            const fill = getTextContent(objEl, 'fill') || '#000000';
            const fontFamily = getTextContent(objEl, 'fontFamily') || 'Arial';
            const textObj = new fabric.IText(text, { left: left, top: top, fill: fill, fontSize: fontSize, fontFamily: fontFamily });
            canvas.add(textObj);
            done++;
            if (done === total) finishOpenXML();
          } else if (type === 'line') {
            const x1 = parseFloat(getTextContent(objEl, 'x1')) || 0;
            const y1 = parseFloat(getTextContent(objEl, 'y1')) || 0;
            const x2 = parseFloat(getTextContent(objEl, 'x2')) || 0;
            const y2 = parseFloat(getTextContent(objEl, 'y2')) || 0;
            const stroke = getTextContent(objEl, 'stroke') || '#000000';
            const strokeWidth = parseInt(getTextContent(objEl, 'strokeWidth'), 10) || 2;
            const line = new fabric.Line([x1, y1, x2, y2], { stroke: stroke, strokeWidth: strokeWidth, selectable: true });
            canvas.add(line);
            done++;
            if (done === total) finishOpenXML();
          } else if (type === 'image') {
            const src = getTextContent(objEl, 'src');
            const scaleX = parseFloat(getTextContent(objEl, 'scaleX')) || 1;
            const scaleY = parseFloat(getTextContent(objEl, 'scaleY')) || 1;
            if (!src) { done++; if (done === total) finishOpenXML(); return; }
            fabric.Image.fromURL(src, function (img) {
              img.set({ left: left, top: top, scaleX: scaleX, scaleY: scaleY });
              canvas.add(img);
              done++;
              if (done === total) finishOpenXML();
            }, { crossOrigin: 'anonymous' });
          } else if (type === 'group') {
            const svg = getTextContent(objEl, 'svg');
            if (!svg) { done++; if (done === total) finishOpenXML(); return; }
            fabric.loadSVGFromString(svg, function (objects, options) {
              const group = fabric.util.groupSVGElements(objects, options);
              group.set({ left: left, top: top });
              canvas.add(group);
              done++;
              if (done === total) finishOpenXML();
            });
          } else { done++; if (done === total) finishOpenXML(); }
        });
      } catch (err) {
        alert('Could not read XML file.');
        console.error(err);
      }
    };
    reader.readAsText(file);
  }

  function openAsImage(file) {
    const reader = new FileReader();
    reader.onload = function () {
      const dataURL = reader.result;
      const img = new Image();
      img.onload = function () {
        const w = img.width;
        const h = img.height;
        canvas.clear();
        canvas.setBackgroundColor('#ffffff', canvas.renderAll.bind(canvas));
        canvas.setWidth(w);
        canvas.setHeight(h);
        document.getElementById('labelWidth').value = w;
        document.getElementById('labelHeight').value = h;
        const presetEl = document.getElementById('labelPreset');
        if (presetEl) presetEl.value = 'custom';
        fabric.Image.fromURL(dataURL, function (fabricImg) {
          fabricImg.set({ left: 0, top: 0 });
          canvas.add(fabricImg);
          canvas.renderAll();
          LabelMaker.applyCanvasZoom();
          LabelMaker.debouncedUpdateLayersList();
          LabelMaker.updateEmptyState();
          LabelMaker.saveState();
        });
      };
      img.onerror = function () { alert('Could not load image.'); };
      img.src = dataURL;
    };
    reader.readAsDataURL(file);
  }

  function openAsSVG(file) {
    const reader = new FileReader();
    reader.onload = function (e) {
      const svgString = e.target.result;
      try {
        fabric.loadSVGFromString(svgString, function (objects, options) {
          const group = fabric.util.groupSVGElements(objects, options);
          const bounds = group.getBoundingRect();
          const w = Math.max(400, Math.ceil(bounds.width + bounds.left + 20));
          const h = Math.max(200, Math.ceil(bounds.height + bounds.top + 20));
          canvas.clear();
          canvas.setBackgroundColor('#ffffff', canvas.renderAll.bind(canvas));
          canvas.setWidth(w);
          canvas.setHeight(h);
          document.getElementById('labelWidth').value = w;
          document.getElementById('labelHeight').value = h;
          const presetEl = document.getElementById('labelPreset');
          if (presetEl) presetEl.value = 'custom';
          canvas.add(group);
          canvas.renderAll();
          LabelMaker.applyCanvasZoom();
          LabelMaker.debouncedUpdateLayersList();
          LabelMaker.updateEmptyState();
          LabelMaker.saveState();
        });
      } catch (err) {
        alert('Could not load SVG file.');
        console.error(err);
      }
    };
    reader.readAsText(file);
  }

  function openAsMD(file) {
    const reader = new FileReader();
    reader.onload = function (e) {
      const text = e.target.result;
      canvas.clear();
      canvas.setBackgroundColor('#ffffff', canvas.renderAll.bind(canvas));
      const lines = text.split(/\r?\n/);
      let maxW = 0;
      let y = 20;
      const fontSize = 14;
      lines.forEach(function (line) {
        const t = new fabric.IText(line || ' ', { left: 20, top: y, fontSize: fontSize, fontFamily: 'Arial', fill: '#000000' });
        canvas.add(t);
        const w = t.getBoundingRect().width;
        if (w > maxW) maxW = w;
        y += fontSize * 1.5;
      });
      const cw = Math.max(400, Math.ceil(maxW + 60));
      const ch = Math.max(200, Math.ceil(y + 20));
      canvas.setWidth(cw);
      canvas.setHeight(ch);
      document.getElementById('labelWidth').value = cw;
      document.getElementById('labelHeight').value = ch;
      const presetEl = document.getElementById('labelPreset');
      if (presetEl) presetEl.value = 'custom';
      canvas.renderAll();
      LabelMaker.applyCanvasZoom();
      LabelMaker.debouncedUpdateLayersList();
      LabelMaker.updateEmptyState();
      LabelMaker.saveState();
    };
    reader.readAsText(file);
  }

  function openAsPDF(file) {
    if (typeof pdfjsLib === 'undefined') { alert('PDF support not loaded.'); return; }
    const reader = new FileReader();
    reader.onload = function (e) {
      const arrayBuffer = e.target.result;
      pdfjsLib.getDocument(arrayBuffer).promise.then(function (pdf) {
        return pdf.getPage(1);
      }).then(function (page) {
        const scale = 2;
        const viewport = page.getViewport({ scale: scale });
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = viewport.width;
        tempCanvas.height = viewport.height;
        const ctx = tempCanvas.getContext('2d');
        return page.render({ canvasContext: ctx, viewport: viewport }).promise.then(function () {
          return tempCanvas.toDataURL('image/png');
        });
      }).then(function (dataURL) {
        const img = new Image();
        img.onload = function () {
          const w = img.width;
          const h = img.height;
          canvas.clear();
          canvas.setBackgroundColor('#ffffff', canvas.renderAll.bind(canvas));
          canvas.setWidth(w);
          canvas.setHeight(h);
          document.getElementById('labelWidth').value = w;
          document.getElementById('labelHeight').value = h;
          const presetEl = document.getElementById('labelPreset');
          if (presetEl) presetEl.value = 'custom';
          fabric.Image.fromURL(dataURL, function (fabricImg) {
            fabricImg.set({ left: 0, top: 0 });
            canvas.add(fabricImg);
            canvas.renderAll();
            LabelMaker.applyCanvasZoom();
            LabelMaker.debouncedUpdateLayersList();
            LabelMaker.updateEmptyState();
            LabelMaker.saveState();
          });
        };
        img.src = dataURL;
      }).catch(function (err) {
        alert('Could not load PDF.');
        console.error(err);
      });
    };
    reader.readAsArrayBuffer(file);
  }

  function openFile(file) {
    if (!file) return;
    const ext = getFileExtension(file);
    if (ext === 'json') return openAsJSON(file);
    if (ext === 'xml') return openAsXML(file);
    if (['png', 'jpg', 'jpeg', 'gif', 'webp'].indexOf(ext) >= 0) return openAsImage(file);
    if (ext === 'svg') return openAsSVG(file);
    if (ext === 'md' || ext === 'markdown' || file.type === 'text/markdown') return openAsMD(file);
    if (ext === 'pdf') return openAsPDF(file);
    alert('Unsupported file type: .' + ext + '. Use JSON, XML, PNG, JPG, SVG, MD, or PDF.');
  }

  function exportAsXML() {
    const objects = canvas.getObjects();
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n<label>\n';
    objects.forEach(function (obj) {
      xml += '  <object type="' + obj.type + '">\n';
      xml += '    <left>' + obj.left + '</left>\n';
      xml += '    <top>' + obj.top + '</top>\n';
      if (obj.type === 'i-text') {
        xml += '    <text><![CDATA[' + obj.text + ']]></text>\n';
        xml += '    <fontSize>' + obj.fontSize + '</fontSize>\n';
        xml += '    <fill>' + obj.fill + '</fill>\n';
        xml += '    <fontFamily>' + (obj.fontFamily || 'Arial') + '</fontFamily>\n';
      } else if (obj.type === 'line') {
        xml += '    <x1>' + obj.x1 + '</x1>\n';
        xml += '    <y1>' + obj.y1 + '</y1>\n';
        xml += '    <x2>' + obj.x2 + '</x2>\n';
        xml += '    <y2>' + obj.y2 + '</y2>\n';
        xml += '    <stroke>' + obj.stroke + '</stroke>\n';
        xml += '    <strokeWidth>' + obj.strokeWidth + '</strokeWidth>\n';
      } else if (obj.type === 'image') {
        const src = (obj._originalElement && obj._originalElement.src) ? obj._originalElement.src : (obj.toDataURL ? obj.toDataURL() : '');
        xml += '    <src><![CDATA[' + src + ']]></src>\n';
        xml += '    <scaleX>' + obj.scaleX + '</scaleX>\n';
        xml += '    <scaleY>' + obj.scaleY + '</scaleY>\n';
      } else if (obj.type === 'group' && obj.toSVG) {
        xml += '    <svg><![CDATA[' + obj.toSVG() + ']]></svg>\n';
      }
      xml += '  </object>\n';
    });
    xml += '</label>';
    const blob = new Blob([xml], { type: 'application/xml' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = getExportFilename('xml');
    link.click();
    URL.revokeObjectURL(link.href);
  }

  function importFromXML() {
    const input = document.getElementById('xmlImport');
    if (!input.files.length) return alert('Please choose an XML file');
    const file = input.files[0];
    const reader = new FileReader();
    reader.onload = function (e) {
      try {
        const parser = new DOMParser();
        const doc = parser.parseFromString(e.target.result, 'text/xml');
        const label = doc.querySelector('label');
        if (!label) return alert('Invalid label XML.');
        const objectEls = label.querySelectorAll('object');
        let done = 0;
        const total = objectEls.length;
        if (total === 0) return alert('No objects in file.');
        objectEls.forEach(function (objEl) {
          const type = objEl.getAttribute('type');
          const left = parseFloat(getTextContent(objEl, 'left')) || 0;
          const top = parseFloat(getTextContent(objEl, 'top')) || 0;
          if (type === 'i-text') {
            const text = getTextContent(objEl, 'text') || 'Text';
            const fontSize = parseInt(getTextContent(objEl, 'fontSize'), 10) || 20;
            const fill = getTextContent(objEl, 'fill') || '#000000';
            const fontFamily = getTextContent(objEl, 'fontFamily') || 'Arial';
            const textObj = new fabric.IText(text, { left: left, top: top, fill: fill, fontSize: fontSize, fontFamily: fontFamily });
            canvas.add(textObj);
            done++;
            if (done === total) finishImport();
          } else if (type === 'line') {
            const x1 = parseFloat(getTextContent(objEl, 'x1')) || 0;
            const y1 = parseFloat(getTextContent(objEl, 'y1')) || 0;
            const x2 = parseFloat(getTextContent(objEl, 'x2')) || 0;
            const y2 = parseFloat(getTextContent(objEl, 'y2')) || 0;
            const stroke = getTextContent(objEl, 'stroke') || '#000000';
            const strokeWidth = parseInt(getTextContent(objEl, 'strokeWidth'), 10) || 2;
            const line = new fabric.Line([x1, y1, x2, y2], { stroke: stroke, strokeWidth: strokeWidth, selectable: true });
            canvas.add(line);
            done++;
            if (done === total) finishImport();
          } else if (type === 'image') {
            const src = getTextContent(objEl, 'src');
            const scaleX = parseFloat(getTextContent(objEl, 'scaleX')) || 1;
            const scaleY = parseFloat(getTextContent(objEl, 'scaleY')) || 1;
            if (!src) { done++; if (done === total) finishImport(); return; }
            fabric.Image.fromURL(src, function (img) {
              img.set({ left: left, top: top, scaleX: scaleX, scaleY: scaleY });
              canvas.add(img);
              done++;
              if (done === total) finishImport();
            }, { crossOrigin: 'anonymous' });
          } else if (type === 'group') {
            const svg = getTextContent(objEl, 'svg');
            if (!svg) { done++; if (done === total) finishImport(); return; }
            fabric.loadSVGFromString(svg, function (objects, options) {
              const group = fabric.util.groupSVGElements(objects, options);
              group.set({ left: left, top: top });
              canvas.add(group);
              done++;
              if (done === total) finishImport();
            });
          } else { done++; if (done === total) finishImport(); }
        });
      } catch (err) {
        alert('Could not read XML file.');
        console.error(err);
      }
    };
    reader.readAsText(file);
    input.value = '';

    function finishImport() {
      canvas.renderAll();
      LabelMaker.debouncedUpdateLayersList();
    }
  }

  if (typeof pdfjsLib !== 'undefined') {
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js';
  }

  document.getElementById('openFileInput').addEventListener('change', function () {
    if (this.files.length) openFile(this.files[0]);
    this.value = '';
  });

  document.getElementById('jsonImport').addEventListener('change', function () {
    if (this.files.length) loadDesignFromJSON();
  });

window.getExportFilename = getExportFilename;
window.exportCanvasToZPL = function () { exportCanvasToZPL(); };
window.exportAsImage = exportAsImage;
window.printCanvas = printCanvas;
window.clearCanvas = clearCanvas;
window.newDesign = newDesign;
window.exportAsPDF = exportAsPDF;
window.saveDesignAsJSON = saveDesignAsJSON;
window.loadDesignFromJSON = loadDesignFromJSON;
window.importFromXML = importFromXML;
window.exportAsXML = exportAsXML;

export {};
