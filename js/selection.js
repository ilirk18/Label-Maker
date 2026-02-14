/**
 * Label Maker - Selection & text controls: selection events, left-panel text controls, keyboard shortcuts.
 */
const LabelMaker = window.LabelMaker;
const canvas = LabelMaker.canvas;

  function updateTextControls(e) {
    const obj = e.selected[0];
    if (obj && obj.type === 'i-text') {
      LabelMaker.setSelectedTextObj(obj);
      document.getElementById('textColor').value = obj.fill || '#000000';
      document.getElementById('fontSize').value = obj.fontSize || 20;
      const fontSelect = document.getElementById('fontFamily');
      if (fontSelect) fontSelect.value = obj.fontFamily || 'Arial';
      const alignSelect = document.getElementById('textAlign');
      if (alignSelect) alignSelect.value = obj.textAlign || 'left';
      const btnBold = document.getElementById('btnBold');
      const btnItalic = document.getElementById('btnItalic');
      if (btnBold) btnBold.classList.toggle('active', obj.fontWeight === 'bold');
      if (btnItalic) btnItalic.classList.toggle('active', obj.fontStyle === 'italic');
    } else {
      LabelMaker.setSelectedTextObj(null);
      clearTextControls();
    }
    LabelMaker.updateOpacityControl();
  }

  function clearTextControls() {
    document.getElementById('textColor').value = '#000000';
    document.getElementById('fontSize').value = 20;
    const fontSelect = document.getElementById('fontFamily');
    if (fontSelect) fontSelect.value = 'Arial';
    const alignSelect = document.getElementById('textAlign');
    if (alignSelect) alignSelect.value = 'left';
    const btnBold = document.getElementById('btnBold');
    const btnItalic = document.getElementById('btnItalic');
    if (btnBold) btnBold.classList.remove('active');
    if (btnItalic) btnItalic.classList.remove('active');
  }

  function setTextBold() {
    const selectedTextObj = LabelMaker.getSelectedTextObj();
    if (!selectedTextObj) return;
    selectedTextObj.set('fontWeight', selectedTextObj.fontWeight === 'bold' ? 'normal' : 'bold');
    canvas.renderAll();
    LabelMaker.saveState();
    if (document.getElementById('btnBold')) document.getElementById('btnBold').classList.toggle('active', selectedTextObj.fontWeight === 'bold');
  }

  function setTextItalic() {
    const selectedTextObj = LabelMaker.getSelectedTextObj();
    if (!selectedTextObj) return;
    selectedTextObj.set('fontStyle', selectedTextObj.fontStyle === 'italic' ? 'normal' : 'italic');
    canvas.renderAll();
    LabelMaker.saveState();
    if (document.getElementById('btnItalic')) document.getElementById('btnItalic').classList.toggle('active', selectedTextObj.fontStyle === 'italic');
  }

  function selectAll() {
    const objects = canvas.getObjects();
    if (objects.length === 0) return;
    if (objects.length === 1) {
      canvas.setActiveObject(objects[0]);
    } else {
      const selection = new fabric.ActiveSelection(objects, { canvas: canvas });
      canvas.setActiveObject(selection);
    }
    canvas.requestRenderAll();
    updateSelectionDependentButtons();
    LabelMaker.highlightSelectedLayer();
    LabelMaker.updatePropertiesPanel();
    LabelMaker.updateOpacityControl();
  }

  function updateSelectionDependentButtons() {
    const active = canvas.getActiveObject();
    const hasSelection = !!active;
    const isGroup = hasSelection && active.type === 'group';
    document.querySelectorAll('#panel-select .btn-requires-selection').forEach(function (el) {
      el.disabled = !hasSelection;
    });
    document.querySelectorAll('#panel-select .btn-requires-group').forEach(function (el) {
      el.disabled = !isGroup;
    });
    document.querySelectorAll('#panel-select .input-requires-selection').forEach(function (el) {
      el.disabled = !hasSelection;
    });
  }

  canvas.on('selection:created', function (e) {
    updateTextControls(e);
    updateSelectionDependentButtons();
    LabelMaker.highlightSelectedLayer();
    LabelMaker.updatePropertiesPanel();
    if (LabelMaker.applyLockAspectRatioToSelection) LabelMaker.applyLockAspectRatioToSelection();
  });

  canvas.on('selection:updated', function (e) {
    updateTextControls(e);
    updateSelectionDependentButtons();
    LabelMaker.highlightSelectedLayer();
    LabelMaker.updatePropertiesPanel();
    if (LabelMaker.applyLockAspectRatioToSelection) LabelMaker.applyLockAspectRatioToSelection();
  });

  canvas.on('selection:cleared', function () {
    LabelMaker.setSelectedTextObj(null);
    clearTextControls();
    LabelMaker.updateOpacityControl();
    updateSelectionDependentButtons();
    LabelMaker.highlightSelectedLayer();
    LabelMaker.updatePropertiesPanel();
  });

  document.getElementById('textColor').addEventListener('input', function () {
    const selectedTextObj = LabelMaker.getSelectedTextObj();
    if (selectedTextObj) {
      selectedTextObj.set('fill', document.getElementById('textColor').value);
      canvas.renderAll();
      LabelMaker.saveState();
    }
  });

  document.getElementById('fontSize').addEventListener('input', function () {
    const selectedTextObj = LabelMaker.getSelectedTextObj();
    if (selectedTextObj) {
      selectedTextObj.set('fontSize', parseInt(document.getElementById('fontSize').value, 10));
      canvas.renderAll();
      LabelMaker.saveState();
    }
  });

  document.getElementById('fontFamily').addEventListener('change', function () {
    const selectedTextObj = LabelMaker.getSelectedTextObj();
    if (selectedTextObj) {
      selectedTextObj.set('fontFamily', document.getElementById('fontFamily').value);
      canvas.renderAll();
      LabelMaker.saveState();
    }
  });

  document.getElementById('textAlign').addEventListener('change', function () {
    const selectedTextObj = LabelMaker.getSelectedTextObj();
    if (selectedTextObj) {
      selectedTextObj.set('textAlign', this.value);
      canvas.renderAll();
      LabelMaker.saveState();
    }
  });

  document.addEventListener('keydown', function (e) {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable) return;
    const key = e.key.toLowerCase();

    if (e.key === 'Escape') {
      if (LabelMaker.isShapeDrawing && LabelMaker.isShapeDrawing()) return;
      const active = canvas.getActiveObject();
      if (active) {
        e.preventDefault();
        canvas.discardActiveObject();
        canvas.requestRenderAll();
        if (LabelMaker.updateLayersList) LabelMaker.updateLayersList();
      }
      return;
    }

    if ((key === 'v') && !e.ctrlKey && !e.metaKey) {
      e.preventDefault();
      if (LabelMaker.setShapeTool) LabelMaker.setShapeTool(null);
      if (LabelMaker.setDrawingTool) LabelMaker.setDrawingTool('select');
      if (LabelMaker.updateCanvasToolButtons) LabelMaker.updateCanvasToolButtons('select');
      return;
    }

    if (!e.ctrlKey && !e.metaKey && !e.altKey) {
      if (key === 't') {
        e.preventDefault();
        if (LabelMaker.addText) LabelMaker.addText();
        return;
      }
      if (key === 'r') {
        e.preventDefault();
        if (LabelMaker.setShapeTool) LabelMaker.setShapeTool('rect');
        if (LabelMaker.setDrawingTool) LabelMaker.setDrawingTool('select');
        if (LabelMaker.updateCanvasToolButtons) LabelMaker.updateCanvasToolButtons('select');
        return;
      }
      if (key === 'l') {
        e.preventDefault();
        if (LabelMaker.setShapeTool) LabelMaker.setShapeTool('line');
        if (LabelMaker.setDrawingTool) LabelMaker.setDrawingTool('select');
        if (LabelMaker.updateCanvasToolButtons) LabelMaker.updateCanvasToolButtons('select');
        return;
      }
      if (key === 'p') {
        e.preventDefault();
        if (LabelMaker.setDrawingTool) LabelMaker.setDrawingTool('pencil');
        return;
      }
      if (key === 'e') {
        e.preventDefault();
        if (LabelMaker.setEyedropperMode) LabelMaker.setEyedropperMode(true);
        return;
      }
    }

    if (e.key === 'Delete' || e.key === 'Backspace') {
      const active = canvas.getActiveObject();
      if (active) {
        e.preventDefault();
        if (active.type === 'activeSelection') {
          active.getObjects().forEach(function (o) { canvas.remove(o); });
          canvas.discardActiveObject();
        } else {
          canvas.remove(active);
        }
        LabelMaker.debouncedUpdateLayersList();
      }
      return;
    }

    if (e.ctrlKey || e.metaKey) {
      if (e.key === 'z') {
        e.preventDefault();
        if (e.shiftKey) LabelMaker.redo();
        else LabelMaker.undo();
      } else if (e.key === 'y' || (e.shiftKey && e.key === 'Z')) {
        e.preventDefault();
        LabelMaker.redo();
      } else if (e.key === 'a') {
        e.preventDefault();
        if (LabelMaker.selectAll) LabelMaker.selectAll();
      } else if (e.key === 'd') {
        e.preventDefault();
        LabelMaker.duplicateSelected();
      } else if (e.key === 'c') {
        e.preventDefault();
        LabelMaker.copySelected();
      } else if (e.key === 'v') {
        e.preventDefault();
        LabelMaker.pasteFromClipboard();
      } else if (e.key === 'g') {
        e.preventDefault();
        if (e.shiftKey && LabelMaker.ungroupSelected) LabelMaker.ungroupSelected();
        else if (LabelMaker.groupSelected) LabelMaker.groupSelected();
      } else if (e.key === '=' || e.key === '+') {
        e.preventDefault();
        if (LabelMaker.zoomIn) LabelMaker.zoomIn();
      } else if (e.key === '-') {
        e.preventDefault();
        if (LabelMaker.zoomOut) LabelMaker.zoomOut();
      } else if (e.key === '0') {
        e.preventDefault();
        if (LabelMaker.zoomReset) LabelMaker.zoomReset();
      }
    }
  });

  LabelMaker.updateTextControls = updateTextControls;
  LabelMaker.clearTextControls = clearTextControls;
  LabelMaker.updateSelectionDependentButtons = updateSelectionDependentButtons;
  LabelMaker.selectAll = selectAll;

window.setTextBold = setTextBold;
window.setTextItalic = setTextItalic;
window.undo = LabelMaker.undo;
window.redo = LabelMaker.redo;

export {};
