// Vice Cover Maker for gta6-cover-art-01 (Node 22, standard library only).
// The entry is the app/ folder beside this file: plain static files a desktop
// browser opens offline, no build step and no network request. This program
// hands the entry in: it copies app/ and screenshots/ into the output
// directory and writes dossier.json there with the vendored make.fun
// library, so the judge can read the app from the dossier alone.
//
// Try it locally with `node serve.ts` (http://localhost:8080), then hand it
// in with `mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts`. Outside the
// grader, MAKEFUN_OUTPUT_DIR stands in for /output.

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-app.ts';

const repo = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(out, { recursive: true });
cpSync(join(repo, 'app'), join(out, 'app'), { recursive: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });
if (existsSync(join(repo, 'screenshots'))) {
  cpSync(join(repo, 'screenshots'), join(out, 'screenshots'), { recursive: true });
}

// The scorer's caps from the gate: the text budget shapes the dossier's
// bytes, and the rest refuse an entry the scorer would refuse (more than 4
// screenshots or one over 256 KiB; app/ over 993 files or 48 MiB in all, or a
// path under app/ over 1000 bytes).
writeFileSync(
  join(out, 'dossier.json'),
  buildDossier(out, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    app_max_files: 993,
    app_max_bytes: 50331648,
    app_path_max_bytes: 1000,
  }),
);
