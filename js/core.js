/**
 * Label Maker - Core: canvas instance, undo/redo, shared state.
 * Other modules add to LabelMaker and use LabelMaker.canvas, LabelMaker.saveState, etc.
 */
const canvas = new fabric.Canvas('labelCanvas');
canvas.selectionKey = 'shiftKey';

let selectedTextObj = null;
let isRestoring = false;
let history = [];
let currentHistoryIndex = -1;
const MAX_HISTORY = 50;

function updateUndoRedoButtons() {
  const btnUndo = document.getElementById('btnUndo');
  const btnRedo = document.getElementById('btnRedo');
  if (btnUndo) btnUndo.disabled = currentHistoryIndex <= 0;
  if (btnRedo) btnRedo.disabled = currentHistoryIndex >= history.length - 1;
}

function saveState() {
  if (isRestoring) return;
  const json = canvas.toJSON(['userDefinedName']);
  const bg = canvas.backgroundColor || '#ffffff';
  const state = { json, bg };
  if (currentHistoryIndex < history.length - 1) {
    history = history.slice(0, currentHistoryIndex + 1);
  }
  history.push(state);
  if (history.length > MAX_HISTORY) {
    history.shift();
    currentHistoryIndex = history.length - 1;
  } else {
    currentHistoryIndex = history.length - 1;
  }
  updateUndoRedoButtons();
}

function restoreState(state) {
  isRestoring = true;
  selectedTextObj = null;
  canvas.loadFromJSON(state.json, function () {
    canvas.setBackgroundColor(state.bg, canvas.renderAll.bind(canvas));
    canvas.renderAll();
    if (typeof window.LabelMaker.updateLayersList === 'function') window.LabelMaker.updateLayersList();
    isRestoring = false;
    updateUndoRedoButtons();
    if (typeof window.LabelMaker.updatePropertiesPanel === 'function') window.LabelMaker.updatePropertiesPanel();
  });
}

function undo() {
  if (currentHistoryIndex <= 0) return;
  currentHistoryIndex--;
  restoreState(history[currentHistoryIndex]);
}

function redo() {
  if (currentHistoryIndex >= history.length - 1) return;
  currentHistoryIndex++;
  restoreState(history[currentHistoryIndex]);
}

canvas.on('object:added', saveState);
canvas.on('object:modified', saveState);
canvas.on('object:removed', saveState);

canvas.setBackgroundColor('#ffffff', canvas.renderAll.bind(canvas));

window.LabelMaker = window.LabelMaker || {};
window.LabelMaker.canvas = canvas;
window.LabelMaker.saveState = saveState;
window.LabelMaker.restoreState = restoreState;
window.LabelMaker.undo = undo;
window.LabelMaker.redo = redo;
window.LabelMaker.updateUndoRedoButtons = updateUndoRedoButtons;
window.LabelMaker.isRestoring = function () { return isRestoring; };
window.LabelMaker.setRestoring = function (v) { isRestoring = v; };
window.LabelMaker.getSelectedTextObj = function () { return selectedTextObj; };
window.LabelMaker.setSelectedTextObj = function (v) { selectedTextObj = v; };
window.LabelMaker.history = function () { return history; };
window.LabelMaker.currentHistoryIndex = function () { return currentHistoryIndex; };

export {};
