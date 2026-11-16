// Review E4 (2026-11-16): write version.json (the commit and date of the code being deployed), read by the viewer for
// the PNG text chunks, the FITS headers and the performance table. The site has no build step, so a page cannot know
// its own commit: run this after merging into main and commit the result ("Stamp version <hash>"); the stamp commit
// changes only version.json, so the code is that of the stamped commit.
// Usage (from dev/): node scripts/stamp.mjs   -> ../version.json
import { execSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const git = (/** @type {string} */ a) => execSync(`git ${a}`, { cwd: root, encoding: 'utf8' }).trim();
const commit = git('rev-parse HEAD');
const v = { commit, short: commit.slice(0, 7), date: git('log -1 --format=%cI'), branch: git('rev-parse --abbrev-ref HEAD') };
writeFileSync(resolve(root, 'version.json'), JSON.stringify(v, null, 1) + '\n');
console.log(`version.json: ${v.short} (${v.date}, ${v.branch})`);
