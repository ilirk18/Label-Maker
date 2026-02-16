/**
 * Label Maker - Init: panel state (localStorage), panel order (drag), build presets, initial canvas state.
 */
const LabelMaker = window.LabelMaker;

const PANEL_STATE_KEY = 'labelMakerPanelState';
const PANEL_ORDER_KEY = 'labelMakerPanelOrder';
const PANEL_REORDER_ENABLED_KEY = 'labelMakerPanelReorderEnabled';
const THEME_KEY = 'ilirTheme';
const RIGHT_PANEL_TABS_KEY = 'labelMakerRightPanelTabsLayout';
const CONTROLS_WIDTH_KEY = 'labelMakerControlsWidth';
const LAYERS_PANEL_WIDTH_KEY = 'labelMakerLayersPanelWidth';
const CONTROLS_WIDTH_MIN = 200;
const CONTROLS_WIDTH_MAX = 480;
const LAYERS_WIDTH_MIN = 180;
const LAYERS_WIDTH_MAX = 420;

function savePanelState() {
  const panels = document.querySelectorAll('.controls .control-panel');
  const state = {};
  panels.forEach(function (el) {
    if (el.id) state[el.id] = el.hasAttribute('open');
  });
  try { localStorage.setItem(PANEL_STATE_KEY, JSON.stringify(state)); } catch (err) {}
}

function getPanelOrder() {
  const panels = document.querySelectorAll('.controls .control-panel');
  return Array.from(panels).map(function (el) { return el.id; }).filter(Boolean);
}

function savePanelOrder() {
  const order = getPanelOrder();
  try { localStorage.setItem(PANEL_ORDER_KEY, JSON.stringify(order)); } catch (err) {}
}

function restorePanelOrder() {
  try {
    const raw = localStorage.getItem(PANEL_ORDER_KEY);
    if (!raw) return;
    const order = JSON.parse(raw);
    if (!Array.isArray(order) || order.length === 0) return;
    const container = document.querySelector('.controls');
    const header = container && container.querySelector('.panel-header');
    if (!container || !header) return;
    const currentIds = new Set(getPanelOrder());
    const orderSet = new Set(order);
    if (orderSet.size !== order.length || !order.every(function (id) { return currentIds.has(id); })) return;
    let ref = header.nextSibling;
    order.forEach(function (id) {
      const el = document.getElementById(id);
      if (el) {
        container.insertBefore(el, ref);
        ref = el.nextSibling;
      }
    });
  } catch (err) {}
}

function restorePanelState() {
  try {
    const raw = localStorage.getItem(PANEL_STATE_KEY);
    if (!raw) return;
    const state = JSON.parse(raw);
    Object.keys(state).forEach(function (id) {
      const el = document.getElementById(id);
      if (el && state[id]) el.setAttribute('open', '');
      else if (el) el.removeAttribute('open');
    });
  } catch (err) {}
}

document.querySelectorAll('.controls .control-panel').forEach(function (panel) {
  panel.addEventListener('toggle', savePanelState);
});

function isPanelReorderEnabled() {
  try {
    const v = localStorage.getItem(PANEL_REORDER_ENABLED_KEY);
    return v === 'true';
  } catch (err) {
    return false;
  }
}

function setPanelReorderEnabled(enabled) {
  try {
    localStorage.setItem(PANEL_REORDER_ENABLED_KEY, enabled ? 'true' : 'false');
  } catch (err) {}
  const container = document.querySelector('.controls');
  if (container) {
    if (enabled) container.classList.add('panel-reorder-enabled');
    else container.classList.remove('panel-reorder-enabled');
  }
}

function getTheme() {
  try {
    const v = localStorage.getItem(THEME_KEY);
    return (v === 'light' || v === 'dark') ? v : 'dark';
  } catch (err) {
    return 'dark';
  }
}

function setTheme(theme) {
  try {
    localStorage.setItem(THEME_KEY, theme);
  } catch (err) {}
  document.body.classList.toggle('theme-light', theme === 'light');
  const fav = document.getElementById('favicon');
  if (fav && window.__labelMakerFaviconDark && window.__labelMakerFaviconLight) fav.href = theme === 'light' ? window.__labelMakerFaviconLight : window.__labelMakerFaviconDark;
  const themeSwitch = document.getElementById('themeSwitch');
  if (themeSwitch) {
    themeSwitch.setAttribute('aria-checked', theme === 'light');
    themeSwitch.setAttribute('aria-label', theme === 'light' ? 'Use dark theme' : 'Use light theme');
  }
}

setTheme(getTheme());

function getRightPanelTabsLayout() {
  try {
    const v = localStorage.getItem(RIGHT_PANEL_TABS_KEY);
    return (v === 'vertical' || v === 'horizontal') ? v : 'vertical';
  } catch (err) {
    return 'vertical';
  }
}

function setRightPanelTabsLayout(layout) {
  try {
    localStorage.setItem(RIGHT_PANEL_TABS_KEY, layout);
  } catch (err) {}
  const panel = document.getElementById('layersPanel');
  if (panel) panel.classList.toggle('tabs-layout-stacked', layout === 'vertical');
  const paneLayers = document.getElementById('paneLayers');
  const paneProperties = document.getElementById('paneProperties');
  if (layout === 'vertical') {
    if (paneLayers) paneLayers.classList.remove('hidden');
    if (paneProperties) paneProperties.classList.remove('hidden');
  } else {
    const activeTab = document.querySelector('.right-panel-tab.active');
    const tabName = activeTab ? activeTab.getAttribute('data-tab') : 'layers';
    if (paneLayers) paneLayers.classList.toggle('hidden', tabName !== 'layers');
    if (paneProperties) paneProperties.classList.toggle('hidden', tabName !== 'properties');
  }
}

setRightPanelTabsLayout(getRightPanelTabsLayout());

function getStoredPanelWidths() {
  try {
    const c = parseInt(localStorage.getItem(CONTROLS_WIDTH_KEY), 10);
    const l = parseInt(localStorage.getItem(LAYERS_PANEL_WIDTH_KEY), 10);
    return {
      controls: (!isNaN(c) && c >= CONTROLS_WIDTH_MIN && c <= CONTROLS_WIDTH_MAX) ? c : 260,
      layers: (!isNaN(l) && l >= LAYERS_WIDTH_MIN && l <= LAYERS_WIDTH_MAX) ? l : 220
    };
  } catch (e) {
    return { controls: 260, layers: 220 };
  }
}

function applyPanelWidths(controlsW, layersW) {
  if (controlsW != null) document.documentElement.style.setProperty('--controls-width', String(controlsW) + 'px');
  if (layersW != null) document.documentElement.style.setProperty('--layers-panel-width', String(layersW) + 'px');
}

function setupPanelResizers() {
  const resizerLeft = document.getElementById('resizerLeft');
  const resizerRight = document.getElementById('resizerRight');
  if (!resizerLeft || !resizerRight) return;

  const widths = getStoredPanelWidths();
  applyPanelWidths(widths.controls, widths.layers);

  function onLeftMove(e) {
    const dx = e.clientX - (resizerLeft._startX || 0);
    let w = Math.round((resizerLeft._startWidth || 260) + dx);
    w = Math.max(CONTROLS_WIDTH_MIN, Math.min(CONTROLS_WIDTH_MAX, w));
    applyPanelWidths(w, null);
  }

  function onLeftUp() {
    resizerLeft.classList.remove('resizing');
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
    document.removeEventListener('mousemove', onLeftMove);
    document.removeEventListener('mouseup', onLeftUp);
    const w = document.documentElement.style.getPropertyValue('--controls-width');
    if (w) try { localStorage.setItem(CONTROLS_WIDTH_KEY, parseInt(w, 10)); } catch (err) {}
  }

  resizerLeft.addEventListener('mousedown', function (e) {
    if (e.button !== 0) return;
    e.preventDefault();
    resizerLeft._startX = e.clientX;
    resizerLeft._startWidth = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--controls-width'), 10) || 260;
    resizerLeft.classList.add('resizing');
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    document.addEventListener('mousemove', onLeftMove);
    document.addEventListener('mouseup', onLeftUp);
  });

  function onRightMove(e) {
    const dx = e.clientX - (resizerRight._startX || 0);
    /* Right panel: drag resizer right → panel wider; left → narrower (subtract dx so direction matches left resizer) */
    let w = Math.round((resizerRight._startWidth || 220) - dx);
    w = Math.max(LAYERS_WIDTH_MIN, Math.min(LAYERS_WIDTH_MAX, w));
    applyPanelWidths(null, w);
  }

  function onRightUp() {
    resizerRight.classList.remove('resizing');
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
    document.removeEventListener('mousemove', onRightMove);
    document.removeEventListener('mouseup', onRightUp);
    const w = document.documentElement.style.getPropertyValue('--layers-panel-width');
    if (w) try { localStorage.setItem(LAYERS_PANEL_WIDTH_KEY, parseInt(w, 10)); } catch (err) {}
  }

  resizerRight.addEventListener('mousedown', function (e) {
    if (e.button !== 0) return;
    e.preventDefault();
    resizerRight._startX = e.clientX;
    resizerRight._startWidth = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--layers-panel-width'), 10) || 220;
    resizerRight.classList.add('resizing');
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    document.addEventListener('mousemove', onRightMove);
    document.addEventListener('mouseup', onRightUp);
  });
}

setupPanelResizers();

restorePanelOrder();

function setupPanelDragReorder() {
  const container = document.querySelector('.controls');
  if (!container) return;
  const panels = container.querySelectorAll('.control-panel');
  panels.forEach(function (panel) {
    if (!panel.id) return;
    const summary = panel.querySelector('.panel-summary');
    if (!summary) return;
    let dragHandle = summary.querySelector('.panel-drag-handle');
    if (!dragHandle) {
      dragHandle = document.createElement('span');
      dragHandle.className = 'panel-drag-handle';
      dragHandle.setAttribute('draggable', 'true');
      dragHandle.title = 'Drag to reorder panels';
      dragHandle.textContent = '\u22EE';
      dragHandle.setAttribute('aria-label', 'Drag to reorder');
      summary.insertBefore(dragHandle, summary.firstChild);
    }
    dragHandle.addEventListener('dragstart', function (e) {
      if (!container.classList.contains('panel-reorder-enabled')) return;
      e.dataTransfer.setData('text/plain', panel.id);
      e.dataTransfer.effectAllowed = 'move';
      panel.classList.add('panel-dragging');
    });
    dragHandle.addEventListener('dragend', function () {
      panel.classList.remove('panel-dragging');
      container.querySelectorAll('.control-panel').forEach(function (p) { p.classList.remove('panel-drag-over'); });
    });
  });
  container.addEventListener('dragover', function (e) {
    if (!container.classList.contains('panel-reorder-enabled')) return;
    const id = e.dataTransfer.getData('text/plain');
    if (!id) return;
    const targetPanel = e.target.closest('.control-panel');
    if (!targetPanel || targetPanel.id === id) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    container.querySelectorAll('.control-panel').forEach(function (p) { p.classList.remove('panel-drag-over'); });
    targetPanel.classList.add('panel-drag-over');
  });
  container.addEventListener('drop', function (e) {
    if (!container.classList.contains('panel-reorder-enabled')) return;
    const id = e.dataTransfer.getData('text/plain');
    if (!id) return;
    const targetPanel = e.target.closest('.control-panel');
    if (!targetPanel || targetPanel.id === id) return;
    e.preventDefault();
    const sourcePanel = document.getElementById(id);
    if (!sourcePanel) return;
    container.querySelectorAll('.control-panel').forEach(function (p) { p.classList.remove('panel-drag-over'); });
    container.insertBefore(sourcePanel, targetPanel);
    savePanelOrder();
  });
  container.addEventListener('dragleave', function (e) {
    if (!e.target.closest('.controls')) {
      container.querySelectorAll('.control-panel').forEach(function (p) { p.classList.remove('panel-drag-over'); });
    }
  });
}

setupPanelDragReorder();

if (isPanelReorderEnabled()) {
  const c = document.querySelector('.controls');
  if (c) c.classList.add('panel-reorder-enabled');
}

/* Only one section open at a time (accordion) */
function setupControlsAccordion() {
  const controls = document.querySelector('.controls');
  if (!controls) return;
  controls.addEventListener('toggle', function (e) {
    if (e.target.tagName !== 'DETAILS' || !e.target.open) return;
    const panels = controls.querySelectorAll('details.control-panel');
    panels.forEach(function (d) {
      if (d !== e.target) d.removeAttribute('open');
    });
  });
}
setupControlsAccordion();

function setupSettingsPanel() {
  const reorderBtn = document.getElementById('settingPanelReorderBtn');
  const layoutBtn = document.getElementById('rightPanelLayoutBtn');
  const themeSwitch = document.getElementById('themeSwitch');
  const controls = document.querySelector('.controls');
  if (!controls) return;

  function updateReorderBtnState() {
    if (!reorderBtn) return;
    const enabled = isPanelReorderEnabled();
    const iconLock = reorderBtn.querySelector('.icon-lock');
    const iconUnlock = reorderBtn.querySelector('.icon-unlock');
    if (enabled) {
      reorderBtn.title = 'Lock panel order';
      reorderBtn.setAttribute('aria-label', 'Lock panel order');
      if (iconLock) iconLock.classList.add('hidden');
      if (iconUnlock) iconUnlock.classList.remove('hidden');
    } else {
      reorderBtn.title = 'Allow drag to reorder panels';
      reorderBtn.setAttribute('aria-label', 'Allow drag to reorder panels');
      if (iconLock) iconLock.classList.remove('hidden');
      if (iconUnlock) iconUnlock.classList.add('hidden');
    }
  }
  updateReorderBtnState();

  if (reorderBtn) {
    reorderBtn.addEventListener('click', function () {
      setPanelReorderEnabled(!isPanelReorderEnabled());
      updateReorderBtnState();
    });
  }

  function updateThemeSwitch() {
    const t = getTheme();
    if (themeSwitch) {
      themeSwitch.setAttribute('aria-checked', t === 'light');
      themeSwitch.setAttribute('aria-label', t === 'light' ? 'Use dark theme' : 'Use light theme');
    }
  }
  updateThemeSwitch();

  if (themeSwitch) {
    themeSwitch.addEventListener('click', function () {
      const next = getTheme() === 'light' ? 'dark' : 'light';
      setTheme(next);
      updateThemeSwitch();
    });
  }

  if (layoutBtn) {
    function updateLayoutBtnState() {
      const layout = getRightPanelTabsLayout();
      const iconH = layoutBtn.querySelector('.icon-layout-h');
      const iconV = layoutBtn.querySelector('.icon-layout-v');
      if (layout === 'horizontal') {
        layoutBtn.title = 'Switch to stacked layout';
        if (iconH) iconH.classList.add('hidden');
        if (iconV) iconV.classList.remove('hidden');
      } else {
        layoutBtn.title = 'Switch to side by side';
        if (iconH) iconH.classList.remove('hidden');
        if (iconV) iconV.classList.add('hidden');
      }
    }
    updateLayoutBtnState();
    layoutBtn.addEventListener('click', function () {
      const next = getRightPanelTabsLayout() === 'horizontal' ? 'vertical' : 'horizontal';
      setRightPanelTabsLayout(next);
      updateLayoutBtnState();
    });
  }
}

setupSettingsPanel();

LabelMaker.buildLabelPresetSelect();
let lastPreset = '';
try { lastPreset = localStorage.getItem('labelMakerLastPreset') || ''; } catch (err) {}
if (lastPreset && LabelMaker.LABEL_PRESETS && LabelMaker.LABEL_PRESETS[lastPreset]) {
  const sel = document.getElementById('labelPreset');
  if (sel) { sel.value = lastPreset; LabelMaker.applyLabelPreset(); }
}
LabelMaker.saveState();
LabelMaker.updateLayersList();
LabelMaker.updateEmptyState();
LabelMaker.updatePropertiesPanel();
if (LabelMaker.updateSelectionDependentButtons) LabelMaker.updateSelectionDependentButtons();
/* Default to Select tool and sync toolbar state */
if (LabelMaker.setShapeTool) LabelMaker.setShapeTool(null);
if (LabelMaker.setDrawingTool) LabelMaker.setDrawingTool('select');
if (typeof window.updateCanvasToolButtons === 'function') window.updateCanvasToolButtons('select');
LabelMaker.updatePropertiesPanel();
restorePanelState();
LabelMaker.applyCanvasZoom();
if (LabelMaker.updateRulers) LabelMaker.updateRulers();

function setupWelcomeModal() {
  const WELCOME_DISMISSED_KEY = 'labelMakerWelcomeDismissed';
  const modal = document.getElementById('welcomeModal');
  const btn = document.getElementById('welcomeModalBtn');
  const checkbox = document.getElementById('welcomeModalDontShowAgain');
  const backdrop = modal && modal.querySelector('.welcome-modal-backdrop');
  if (!modal || !btn) return;

  try {
    if (localStorage.getItem(WELCOME_DISMISSED_KEY) === 'true') {
      modal.classList.add('hidden');
      return;
    }
  } catch (e) {}

  function close() {
    modal.classList.add('hidden');
    try {
      if (checkbox && checkbox.checked) localStorage.setItem(WELCOME_DISMISSED_KEY, 'true');
    } catch (e) {}
  }

  btn.addEventListener('click', close);
  if (backdrop) backdrop.addEventListener('click', close);
}

setupWelcomeModal();

export {};
