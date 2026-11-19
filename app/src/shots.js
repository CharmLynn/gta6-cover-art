// Fixed scenes for screenshots: ?shot=cover shows the exported cover alone,
// ?shot=editor the editor with a photo loaded, ?shot=portrait a tall cover
// and ?shot=neon a neon-graded one. `photo` picks the sample
// (samples/<photo>.jpg) and `caption` the words. window.__shotReady is set
// by main.js once painted.
export async function runShot(shot, query, api) {
  const { load, state } = api;
  const photo = query.get('photo') ?? 'pier';
  const caption = query.get('caption') ?? 'SUNSET HEIST';
  const subcaption = query.get('subcaption') ?? 'VICE CITY';

  if (shot === 'cover') {
    document.body.classList.add('shot-cover');
    state.size = '1920x1080';
    state.layout = 'feature';
    state.grade = 'sunset';
    state.onePhoto = true;
  } else if (shot === 'portrait') {
    document.body.classList.add('shot-cover');
    state.size = '1080x1350';
    state.layout = 'grid';
    state.grade = 'sunset';
    state.onePhoto = false;
  } else if (shot === 'neon') {
    document.body.classList.add('shot-cover');
    state.size = '1080x1080';
    state.layout = 'grid';
    state.grade = 'neon';
    state.onePhoto = false;
  } else {
    // editor: the controls stay visible, panel 0 selected.
    state.size = '1080x1080';
    state.layout = 'feature';
    state.grade = 'sunset';
    state.onePhoto = true;
  }

  state.caption = caption;
  state.subcaption = subcaption;
  state.photos[0] = await load(`samples/${photo}.jpg`);
  state.photos[1] = await load(`samples/${photo === 'pier' ? 'boulevard' : 'pier'}.jpg`);
  state.photos[2] = state.photos[0];
  // Give the panels distinct crops so the grid reads as several shots.
  state.panels[0] = { slot: 0, zoom: 1.1, panX: 0, panY: -0.1 };
  state.panels[1] = { slot: 1, zoom: 1.4, panX: 0.2, panY: 0 };
  state.panels[2] = { slot: 0, zoom: 1.25, panX: 0.1, panY: 0 };
  state.panels[3] = { slot: 1, zoom: 1.2, panX: 0, panY: 0.15 };
  // Keep the words in sync with the controls for the editor shot.
  const captionInput = document.getElementById('caption');
  if (captionInput) captionInput.value = caption;
  const subInput = document.getElementById('subcaption');
  if (subInput) subInput.value = subcaption;
  if (shot === 'editor') {
    api.setSelected(0);
    api.redraw(0);
  } else {
    api.redraw(-1);
  }
}
