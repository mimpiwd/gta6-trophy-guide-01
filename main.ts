// Leonida Trophy Guide — hand-in program for the GTA 6 trophy guide bounty.
// It runs on Node 22 with only the standard library. The guide itself is a
// folder of plain static files: app/index.html at the root, its stylesheet,
// its tracker script, and app/data/trophies.json with all 55 trophies. No
// build step, nothing fetched from the network: a static server can serve
// app/ as-is and the page works with the network off.
//
// What this program does: it takes app/ and screenshots/ from the folder
// next to this file, copies them into the output folder, and writes
// dossier.json there — the summary the judge reads, built by the vendored
// make.fun library (vendor/makefun-frontend.ts, which must stay untouched:
// the scorer rebuilds the dossier from its own copy and compares bytes).
// Outside the grader, MAKEFUN_OUTPUT_DIR stands in for /output:
//   MAKEFUN_OUTPUT_DIR=/tmp/gta6-out node main.ts

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-frontend.ts';

const repoRoot = fileURLToPath(new URL('.', import.meta.url));
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(outputDir, { recursive: true });
cpSync(join(repoRoot, 'app'), join(outputDir, 'app'), { recursive: true });
mkdirSync(join(outputDir, 'screenshots'), { recursive: true });
if (existsSync(join(repoRoot, 'screenshots'))) {
  cpSync(join(repoRoot, 'screenshots'), join(outputDir, 'screenshots'), { recursive: true });
}

// Caps matching the scorer: at most 4 screenshots, each at most 256 KiB;
// app/ at most 993 files and directories and 48 MiB; the dossier text at
// most 160 KiB. Anything past those limits is refused by buildDossier.
const dossierText = buildDossier(outputDir, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 50331648,
});
writeFileSync(join(outputDir, 'dossier.json'), dossierText);
