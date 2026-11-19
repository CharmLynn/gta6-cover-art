// Renders a GTA-style multi-panel poster onto a canvas. The poster is a title
// band with a big caption, a panel grid of photos with a colour grade, and a
// footer strip with a sub-caption. Every photo is drawn cover-fit with its
// own zoom and pan, so one photo can fill several panels at different crops
// or each panel can hold a different photo.

export function createState() {
  return {
    layout: 'feature', // 'feature' (one tall panel + two stacked) or 'grid' (2 x 2)
    grade: 'sunset', // 'sunset', 'neon' or 'original'
    caption: 'SUNSET HEIST',
    subcaption: 'VICE CITY',
    size: '1080x1080',
    onePhoto: true,
    photos: [null, null, null], // one image per slot A, B, C
    panels: [
      { slot: 0, zoom: 1, panX: 0, panY: 0 },
      { slot: 0, zoom: 1, panX: 0, panY: 0 },
      { slot: 0, zoom: 1, panX: 0, panY: 0 },
      { slot: 0, zoom: 1, panX: 0, panY: 0 },
    ],
  };
}

/** How many panels the layout shows. */
export function panelCount(state) {
  return state.layout === 'grid' ? 4 : 3;
}

/** The rectangles of the panels, in canvas pixels, for the current layout. */
export function panelRects(canvas, state) {
  const w = canvas.width;
  const h = canvas.height;
  const titleH = h * 0.17;
  const footH = h * 0.05;
  const m = w * 0.02;
  const g = w * 0.008;
  const top = titleH + m;
  const bottom = h - footH - m;
  const pw = w - 2 * m;
  const ph = bottom - top;
  if (state.layout === 'grid') {
    const cw = (pw - g) / 2;
    const ch = (ph - g) / 2;
    return [
      { x: m, y: top, w: cw, h: ch },
      { x: m + cw + g, y: top, w: cw, h: ch },
      { x: m, y: top + ch + g, w: cw, h: ch },
      { x: m + cw + g, y: top + ch + g, w: cw, h: ch },
    ];
  }
  const leftW = pw * 0.58 - g / 2;
  const rightW = pw - leftW - g;
  const halfH = (ph - g) / 2;
  return [
    { x: m, y: top, w: leftW, h: ph },
    { x: m + leftW + g, y: top, w: rightW, h: halfH },
    { x: m + leftW + g, y: top + halfH + g, w: rightW, h: halfH },
  ];
}

/** Draws one photo cover-fit into a rectangle, with zoom and pan. */
function drawPhoto(ctx, photo, rect, panel) {
  if (!photo) {
    const grad = ctx.createLinearGradient(rect.x, rect.y, rect.x + rect.w, rect.y + rect.h);
    grad.addColorStop(0, '#3a1c5c');
    grad.addColorStop(1, '#160a26');
    ctx.fillStyle = grad;
    ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.font = `400 ${Math.round(rect.h * 0.2)}px Anton, 'Arial Black', sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('+', rect.x + rect.w / 2, rect.y + rect.h / 2);
    return;
  }
  const iw = photo.naturalWidth;
  const ih = photo.naturalHeight;
  const scale = Math.max(rect.w / iw, rect.h / ih) * panel.zoom;
  const dw = iw * scale;
  const dh = ih * scale;
  const dx = rect.x + (rect.w - dw) / 2 + panel.panX * (dw - rect.w);
  const dy = rect.y + (rect.h - dh) / 2 + panel.panY * (dh - rect.h);
  ctx.drawImage(photo, dx, dy, dw, dh);
}

/** The colour grade over a panel: a warm sunset, a neon duotone, or nothing. */
function gradePanel(ctx, rect, grade) {
  if (grade === 'original') {
    const vig = ctx.createLinearGradient(0, rect.y + rect.h * 0.6, 0, rect.y + rect.h);
    vig.addColorStop(0, 'rgba(0,0,0,0)');
    vig.addColorStop(1, 'rgba(0,0,0,0.28)');
    ctx.fillStyle = vig;
    ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
    return;
  }
  const overlay = grade === 'sunset'
    ? ['rgba(255,140,60,0.55)', 'rgba(255,60,140,0.55)']
    : ['rgba(0,229,255,0.5)', 'rgba(255,0,200,0.5)'];
  const grad = ctx.createLinearGradient(rect.x, rect.y, rect.x + rect.w, rect.y + rect.h);
  grad.addColorStop(0, overlay[0]);
  grad.addColorStop(1, overlay[1]);
  ctx.save();
  ctx.globalCompositeOperation = 'overlay';
  ctx.fillStyle = grad;
  ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
  ctx.restore();
  const warm = ctx.createLinearGradient(0, rect.y, 0, rect.y + rect.h);
  if (grade === 'sunset') {
    warm.addColorStop(0, 'rgba(255,170,40,0)');
    warm.addColorStop(1, 'rgba(200,30,110,0.22)');
  } else {
    warm.addColorStop(0, 'rgba(0,180,255,0)');
    warm.addColorStop(1, 'rgba(120,0,180,0.22)');
  }
  ctx.fillStyle = warm;
  ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
}

/** Draws the whole poster. `highlight` is the index of the panel to outline
 *  (the editor's selection), or -1 for a clean export. */
export function drawPoster(canvas, state, highlight = -1) {
  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;
  ctx.fillStyle = '#12081f';
  ctx.fillRect(0, 0, w, h);

  // Title band: the caption in huge Anton capitals, white on black outline.
  const titleH = h * 0.17;
  const text = (state.caption || '').trim().toUpperCase();
  if (text) {
    let size = titleH * 0.62;
    ctx.font = `400 ${size}px Anton, 'Arial Black', sans-serif`;
    while (ctx.measureText(text).width > w * 0.92 && size > 12) {
      size -= 2;
      ctx.font = `400 ${size}px Anton, 'Arial Black', sans-serif`;
    }
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.lineJoin = 'round';
    ctx.lineWidth = Math.max(2, size * 0.09);
    ctx.strokeStyle = '#0a0512';
    ctx.shadowColor = 'rgba(0,0,0,0.55)';
    ctx.shadowBlur = size * 0.12;
    ctx.shadowOffsetY = size * 0.03;
    ctx.strokeText(text, w / 2, titleH * 0.52);
    ctx.fillStyle = '#ffffff';
    ctx.fillText(text, w / 2, titleH * 0.52);
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;
  }
  // Gradient rule under the caption.
  const rule = ctx.createLinearGradient(0, 0, w, 0);
  if (state.grade === 'neon') {
    rule.addColorStop(0, '#00e5ff');
    rule.addColorStop(0.5, '#ff00c8');
    rule.addColorStop(1, '#00e5ff');
  } else {
    rule.addColorStop(0, '#ffd23e');
    rule.addColorStop(0.5, '#ff5e3a');
    rule.addColorStop(1, '#c81e78');
  }
  ctx.fillStyle = rule;
  ctx.fillRect(w * 0.06, titleH - Math.max(3, h * 0.006), w * 0.88, Math.max(3, h * 0.006));

  // Panels.
  const rects = panelRects(canvas, state);
  const count = panelCount(state);
  for (let i = 0; i < count; i++) {
    const rect = rects[i];
    const panel = state.panels[i];
    const slot = state.onePhoto ? 0 : panel.slot;
    ctx.save();
    ctx.beginPath();
    ctx.rect(rect.x, rect.y, rect.w, rect.h);
    ctx.clip();
    drawPhoto(ctx, state.photos[slot], rect, panel);
    gradePanel(ctx, rect, state.grade);
    ctx.restore();
    ctx.lineWidth = Math.max(2, w * 0.002);
    ctx.strokeStyle = 'rgba(255,255,255,0.92)';
    ctx.strokeRect(rect.x, rect.y, rect.w, rect.h);
    if (i === highlight) {
      ctx.save();
      ctx.setLineDash([w * 0.012, w * 0.008]);
      ctx.lineWidth = Math.max(3, w * 0.004);
      ctx.strokeStyle = '#00e5ff';
      ctx.strokeRect(rect.x - 3, rect.y - 3, rect.w + 6, rect.h + 6);
      ctx.restore();
    }
  }

  // Footer strip: the sub-caption, letterspaced.
  const sub = (state.subcaption || '').trim().toUpperCase();
  if (sub) {
    const footH = h * 0.05;
    let size = footH * 0.52;
    ctx.font = `400 ${size}px Anton, 'Arial Black', sans-serif`;
    while (ctx.measureText(sub).width > w * 0.9 && size > 10) {
      size -= 1;
      ctx.font = `400 ${size}px Anton, 'Arial Black', sans-serif`;
    }
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = state.grade === 'neon' ? '#7df9ff' : '#ff7ab8';
    try { ctx.letterSpacing = `${Math.round(size * 0.18)}px`; } catch { /* older canvas */ }
    ctx.fillText(sub, w / 2, h - footH / 2);
    try { ctx.letterSpacing = '0px'; } catch { /* older canvas */ }
  }
}
