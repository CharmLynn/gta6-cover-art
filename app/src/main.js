// Wires the Vice Cover Maker editor: photo slots, per-panel crop, caption,
// grade and layout, a live preview you can drag and scroll, and PNG export
// in the three common post sizes. A `?shot=` query sets up a fixed scene for
// a screenshot instead (./shots.js).
import { createState, drawPoster, panelCount, panelRects } from './poster.js';
import { runShot } from './shots.js';

const canvas = document.getElementById('poster');
const status = document.getElementById('status');
const state = createState();
let selected = 0;

const SIZES = {
  '1080x1080': [1080, 1080],
  '1080x1350': [1080, 1350],
  '1920x1080': [1920, 1080],
};

/** Loads an image from a URL, resolving once it can be drawn. */
export function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

function resizePreview() {
  const [w, h] = SIZES[state.size] ?? SIZES['1080x1080'];
  canvas.width = w;
  canvas.height = h;
}

function redraw() {
  resizePreview();
  drawPoster(canvas, state, selected);
  syncPanelRows();
}

/** Builds one control row per panel: slot, zoom and pan sliders. */
function buildPanelRows() {
  const list = document.getElementById('panels');
  list.innerHTML = '';
  for (let i = 0; i < 4; i++) {
    const row = document.createElement('div');
    row.className = 'panel-row';
    row.dataset.index = i;
    row.innerHTML = `
      <button type="button" class="panel-pick">Panel ${i + 1}</button>
      <label>Photo
        <select class="slot">
          <option value="0">A</option>
          <option value="1">B</option>
          <option value="2">C</option>
        </select>
      </label>
      <label>Zoom <input class="zoom" type="range" min="1" max="3" step="0.05" value="1"></label>
      <label>Pan X <input class="panx" type="range" min="-0.5" max="0.5" step="0.01" value="0"></label>
      <label>Pan Y <input class="pany" type="range" min="-0.5" max="0.5" step="0.01" value="0"></label>`;
    row.querySelector('.panel-pick').addEventListener('click', () => {
      selected = i;
      redraw();
    });
    row.querySelector('.slot').addEventListener('change', (e) => {
      state.panels[i].slot = Number(e.target.value);
      redraw();
    });
    row.querySelector('.zoom').addEventListener('input', (e) => {
      state.panels[i].zoom = Number(e.target.value);
      redraw();
    });
    row.querySelector('.panx').addEventListener('input', (e) => {
      state.panels[i].panX = Number(e.target.value);
      redraw();
    });
    row.querySelector('.pany').addEventListener('input', (e) => {
      state.panels[i].panY = Number(e.target.value);
      redraw();
    });
    list.appendChild(row);
  }
}

/** Keeps the panel rows in step with the state (selection, visibility). */
function syncPanelRows() {
  const count = panelCount(state);
  document.querySelectorAll('.panel-row').forEach((row) => {
    const i = Number(row.dataset.index);
    row.classList.toggle('hidden', i >= count);
    row.classList.toggle('selected', i === selected);
    row.querySelector('.slot').value = String(state.panels[i].slot);
    row.querySelector('.zoom').value = String(state.panels[i].zoom);
    row.querySelector('.panx').value = String(state.panels[i].panX);
    row.querySelector('.pany').value = String(state.panels[i].panY);
  });
  document.getElementById('one-photo').checked = state.onePhoto;
}

/** Which panel, if any, a point on the preview canvas falls in. */
function panelAt(clientX, clientY) {
  const r = canvas.getBoundingClientRect();
  const x = (clientX - r.left) * (canvas.width / r.width);
  const y = (clientY - r.top) * (canvas.height / r.height);
  const rects = panelRects(canvas, state);
  for (let i = 0; i < panelCount(state); i++) {
    const p = rects[i];
    if (x >= p.x && x <= p.x + p.w && y >= p.y && y <= p.y + p.h) return i;
  }
  return -1;
}

let drag = null;
canvas.addEventListener('pointerdown', (e) => {
  const i = panelAt(e.clientX, e.clientY);
  if (i < 0) return;
  selected = i;
  const rects = panelRects(canvas, state);
  drag = { x: e.clientX, y: e.clientY, panX: state.panels[i].panX, panY: state.panels[i].panY, rect: rects[i] };
  canvas.setPointerCapture(e.pointerId);
  redraw();
});
canvas.addEventListener('pointermove', (e) => {
  if (!drag) return;
  const r = canvas.getBoundingClientRect();
  const scaleX = canvas.width / r.width;
  const scaleY = canvas.height / r.height;
  const panel = state.panels[selected];
  const photo = state.photos[state.onePhoto ? 0 : panel.slot];
  if (!photo) return;
  const rect = drag.rect;
  const cover = Math.max(rect.w / photo.naturalWidth, rect.h / photo.naturalHeight) * panel.zoom;
  const overflowX = photo.naturalWidth * cover - rect.w;
  const overflowY = photo.naturalHeight * cover - rect.h;
  if (overflowX > 0) {
    panel.panX = Math.max(-0.5, Math.min(0.5, drag.panX + ((e.clientX - drag.x) * scaleX) / overflowX));
  }
  if (overflowY > 0) {
    panel.panY = Math.max(-0.5, Math.min(0.5, drag.panY + ((e.clientY - drag.y) * scaleY) / overflowY));
  }
  redraw();
});
canvas.addEventListener('pointerup', () => { drag = null; });
canvas.addEventListener('wheel', (e) => {
  e.preventDefault();
  const panel = state.panels[selected];
  panel.zoom = Math.max(1, Math.min(3, panel.zoom - Math.sign(e.deltaY) * 0.1));
  redraw();
}, { passive: false });

/** Photo slot inputs and sample buttons. */
['a', 'b', 'c'].forEach((letter, i) => {
  document.getElementById(`photo-${letter}`).addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    state.photos[i] = await loadImage(URL.createObjectURL(file));
    redraw();
  });
});
document.getElementById('sample-pier').addEventListener('click', async () => {
  state.photos[0] = await loadImage('samples/pier.jpg');
  redraw();
});
document.getElementById('sample-boulevard').addEventListener('click', async () => {
  state.photos[1] = await loadImage('samples/boulevard.jpg');
  redraw();
});
document.getElementById('one-photo').addEventListener('change', (e) => {
  state.onePhoto = e.target.checked;
  redraw();
});

/** Caption, grade, layout and size. */
document.getElementById('caption').addEventListener('input', (e) => {
  state.caption = e.target.value;
  redraw();
});
document.getElementById('subcaption').addEventListener('input', (e) => {
  state.subcaption = e.target.value;
  redraw();
});
document.querySelectorAll('input[name="grade"]').forEach((radio) => {
  radio.addEventListener('change', () => {
    state.grade = radio.value;
    redraw();
  });
});
document.querySelectorAll('input[name="layout"]').forEach((radio) => {
  radio.addEventListener('change', () => {
    state.layout = radio.value;
    if (selected >= panelCount(state)) selected = 0;
    redraw();
  });
});
document.getElementById('size').addEventListener('change', (e) => {
  state.size = e.target.value;
  redraw();
});

/** Export: draw the poster at the exact post size and download it as a PNG. */
document.getElementById('export').addEventListener('click', () => {
  const [w, h] = SIZES[state.size] ?? SIZES['1080x1080'];
  const off = document.createElement('canvas');
  off.width = w;
  off.height = h;
  drawPoster(off, state, -1);
  off.toBlob((blob) => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `cover-${state.size}.png`;
    a.click();
    status.textContent = `Saved cover-${state.size}.png`;
  }, 'image/png');
});

buildPanelRows();

const params = new URLSearchParams(location.search);
const shot = params.get('shot');
if (shot) {
  // A fixed scene for a screenshot: load the samples, set the words, then
  // paint once and tell the screenshot runner the page is ready.
  document.fonts.load('100px Anton').finally(async () => {
    await runShot(shot, params, {
      load: loadImage,
      state,
      redraw: (highlight = -1) => { resizePreview(); drawPoster(canvas, state, highlight); },
      setSelected: (i) => { selected = i; },
    });
    requestAnimationFrame(() => requestAnimationFrame(() => { window.__shotReady = true; }));
  });
} else {
  document.fonts.load('100px Anton').finally(() => redraw());
}
