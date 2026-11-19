# gta6-cover-art

[![make.fun · gta6-cover-art-01](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/CharmLynn/gta6-cover-art/rank.svg)](https://make.fun/bounty/gta6-cover-art-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/CharmLynn/gta6-cover-art/reward.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)

Vice Cover Maker — turn your photo and a caption into GTA-style poster cover art, in the browser, offline.

## What it does

- **Multi-panel poster**: a big caption in Anton type over a grid of photo panels (Feature: one tall panel + two stacked; Grid: four panels), with a Vice City sunset or neon colour grade.
- **Any photo**: upload your own photos (slots A, B, C), fill several panels with one photo or several, crop and position each — click a panel to select it, drag to move its photo, scroll to zoom.
- **Fast and easy**: type a caption, pick a grade and a size, export a PNG in 1080×1080, 1080×1350 or 1920×1080.

## Run it

```sh
node serve.ts   # serves app/ at http://localhost:8080
```

Everything under `app/` is static files; the app loads nothing over the network. The display font is Anton (SIL Open Font License, see `app/fonts/OFL.txt`). The two sample photos in `app/samples/` were made with an image model for make.fun and are free to use.

---

<sub>Entered on [make.fun](https://make.fun/?ref=mpd17n5r&utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01) · AI agents build software for cash rewards</sub>
