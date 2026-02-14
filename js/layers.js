/**
 * Label Maker - Layers panel: list, highlight, reorder, delete.
 */
const LabelMaker = window.LabelMaker;
const canvas = LabelMaker.canvas;

  let layersListTimeout;
  function debouncedUpdateLayersList() {
    clearTimeout(layersListTimeout);
    layersListTimeout = setTimeout(updateLayersList, 80);
  }

  function updateLayersList() {
    const layersList = document.getElementById('layersList');
    if (!layersList) return;
    layersList.innerHTML = '';
    const objects = canvas.getObjects().slice().reverse();

    objects.forEach((obj) => {
      const li = document.createElement('li');
      li.classList.add('layer-item');
      li._fabricObject = obj;

      let displayName = 'Unknown Object';
      if (obj.type === 'i-text') {
        displayName = 'Text: "' + (obj.text || '').substring(0, 20) + (obj.text && obj.text.length > 20 ? '...' : '') + '"';
      } else if (obj.type === 'image') {
        displayName = obj.userDefinedName || (obj._barcode ? 'Barcode' : 'QR Code');
      } else if (obj.type === 'group') {
        displayName = obj.userDefinedName || 'SVG';
      } else if (obj.type === 'line') {
        displayName = obj.userDefinedName || 'Line';
      } else if (obj.type === 'rect') {
        displayName = obj.userDefinedName || 'Rectangle';
      } else if (obj.type === 'circle') {
        displayName = obj.userDefinedName || 'Circle';
      } else if (obj.type === 'ellipse') {
        displayName = obj.userDefinedName || 'Ellipse';
      } else if (obj.type === 'triangle') {
        displayName = obj.userDefinedName || 'Triangle';
    } else if (obj.type === 'polygon') {
      displayName = obj.userDefinedName || 'Star';
    } else if (obj.type === 'path') {
      displayName = obj.userDefinedName || 'Path';
    } else if (obj.type === 'image' && obj._barcode) {
      displayName = obj.userDefinedName || 'Barcode';
    }
      const currentName = obj.userDefinedName || displayName;

      const nameSpan = document.createElement('span');
      nameSpan.textContent = currentName;
      nameSpan.classList.add('layer-name');
      li.appendChild(nameSpan);

      nameSpan.addEventListener('click', function (e) {
        e.stopPropagation();
        if (nameSpan.querySelector('input.edit-name')) return;
        const input = document.createElement('input');
        input.type = 'text';
        input.value = obj.userDefinedName || nameSpan.textContent;
        input.classList.add('edit-name');
        nameSpan.innerHTML = '';
        nameSpan.appendChild(input);
        input.focus();
        input.select();
        const saveName = () => {
          const newName = input.value.trim();
          if (newName) {
            obj.userDefinedName = newName;
            nameSpan.textContent = newName;
          } else {
            nameSpan.textContent = obj.userDefinedName || displayName;
          }
          if (input.parentNode) nameSpan.removeChild(input);
        };
        input.addEventListener('keypress', function (ev) { if (ev.key === 'Enter') saveName(); });
        input.addEventListener('blur', saveName);
      });

      li.addEventListener('click', () => {
        canvas.setActiveObject(obj);
        canvas.renderAll();
        if (LabelMaker.highlightSelectedLayer) LabelMaker.highlightSelectedLayer();
      });

      const deleteButton = document.createElement('button');
      deleteButton.textContent = 'X';
      deleteButton.classList.add('delete-btn');
      deleteButton.title = 'Delete layer';
      deleteButton.addEventListener('click', (e) => {
        e.stopPropagation();
        canvas.remove(obj);
        debouncedUpdateLayersList();
      });
      li.appendChild(deleteButton);

      const bringForwardButton = document.createElement('button');
      bringForwardButton.textContent = '↑';
      bringForwardButton.classList.add('layer-move-btn');
      bringForwardButton.title = 'Bring forward';
      bringForwardButton.addEventListener('click', (e) => {
        e.stopPropagation();
        canvas.bringForward(obj);
        canvas.requestRenderAll();
        debouncedUpdateLayersList();
      });
      li.appendChild(bringForwardButton);

      const sendBackwardButton = document.createElement('button');
      sendBackwardButton.textContent = '↓';
      sendBackwardButton.classList.add('layer-move-btn');
      sendBackwardButton.title = 'Send backward';
      sendBackwardButton.addEventListener('click', (e) => {
        e.stopPropagation();
        canvas.sendBackwards(obj);
        canvas.requestRenderAll();
        debouncedUpdateLayersList();
      });
      li.appendChild(sendBackwardButton);

      layersList.appendChild(li);
    });
    if (LabelMaker.highlightSelectedLayer) LabelMaker.highlightSelectedLayer();
    updateEmptyState();
  }

  function updateEmptyState() {
    const hint = document.getElementById('canvasEmptyHint');
    if (!hint) return;
    hint.style.display = canvas.getObjects().length === 0 ? 'block' : 'none';
  }

  function highlightSelectedLayer() {
    const active = canvas.getActiveObject();
    const layersList = document.getElementById('layersList');
    if (!layersList) return;
    Array.from(layersList.children).forEach(li => li.classList.remove('selected'));
    if (!active) return;
    const objects = canvas.getObjects();
    const toHighlight = active.type === 'activeSelection' ? active.getObjects() : [active];
    toHighlight.forEach(function (obj) {
      const idx = objects.indexOf(obj);
      if (idx === -1) return;
      const reversedIndex = objects.length - 1 - idx;
      const layerItem = layersList.children[reversedIndex];
      if (layerItem) layerItem.classList.add('selected');
    });
  }

  canvas.on('object:added', debouncedUpdateLayersList);
  canvas.on('object:removed', debouncedUpdateLayersList);
  canvas.on('object:modified', debouncedUpdateLayersList);
  canvas.on('selection:cleared', debouncedUpdateLayersList);
  canvas.on('selection:created', debouncedUpdateLayersList);
  canvas.on('selection:updated', debouncedUpdateLayersList);

  LabelMaker.updateLayersList = updateLayersList;
  LabelMaker.updateEmptyState = updateEmptyState;
  LabelMaker.debouncedUpdateLayersList = debouncedUpdateLayersList;
  LabelMaker.highlightSelectedLayer = highlightSelectedLayer;

export {};
