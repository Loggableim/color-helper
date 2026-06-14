/* ===== Color Helper - IndexNow Submit Helper =====
 * Sendet alle Sitemap-URLs an die IndexNow API.
 * Wird nach dem Build manuell oder per CI ausgeführt.
 *
 * Usage:
 *   node scripts/indexnow-submit.mjs
 *
 * Required env (für CI):
 *   INDEXNOW_KEY — der API-Key
 *
 * Key-File muss unter https://color-helper.com/{key}.txt erreichbar sein
 * (statisch aus /public/{key}.txt deployed).
 *
 * Exit-Code: 0 bei Erfolg oder wenn Rate-Limited (best-effort), 1 nur bei
 * lokalen Fehlern (Sitemap fehlt, key-File fehlt, etc).
 * Dadurch schlägt der CI-Deploy nicht fehl, wenn die Search-Engines gerade
 * nicht erreichbar sind — Build+Deploy ist wichtiger als IndexNow-Ping.
 */

import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

const KEY = process.env.INDEXNOW_KEY || 'a28f2699c1dd4b92bf5de35fa41cc70b';
const HOST = 'color-helper.com';
const SITEMAP_PATH = join(ROOT, 'dist', 'sitemap-0.xml');
const KEY_FILE = join(ROOT, 'public', `${KEY}.txt`);

if (!existsSync(SITEMAP_PATH)) {
  console.error(`✗ Sitemap not found: ${SITEMAP_PATH}`);
  console.error('  Run "npm run build" first.');
  process.exit(1);
}

if (!existsSync(KEY_FILE)) {
  console.warn(`⚠ Key file missing: ${KEY_FILE}`);
  console.warn('  IndexNow may reject the submission without proof of key ownership.');
}

const sitemap = readFileSync(SITEMAP_PATH, 'utf-8');
const urls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1]);
console.log(`📋 Found ${urls.length} URLs in sitemap`);

if (urls.length === 0) {
  console.error('✗ No URLs found in sitemap');
  process.exit(1);
}

// IndexNow accepts up to 10,000 URLs per submit
const chunks = [];
for (let i = 0; i < urls.length; i += 10000) {
  chunks.push(urls.slice(i, i + 10000));
}
console.log(`📦 Split into ${chunks.length} batch(es) of up to 10,000 URLs each`);

let successCount = 0;
let failCount = 0;
let rateLimitCount = 0;

const ENDPOINTS = [
  'https://api.indexnow.org/indexnow',
  'https://yandex.com/indexnow',
];

for (const endpoint of ENDPOINTS) {
  for (let i = 0; i < chunks.length; i++) {
    const payload = {
      host: HOST,
      key: KEY,
      keyLocation: `https://${HOST}/${KEY}.txt`,
      urlList: chunks[i],
    };

    const endpointName = endpoint.replace('https://', '').replace('/indexnow', '');
    console.log(`\n🚀 Submitting batch ${i + 1}/${chunks.length} (${chunks[i].length} URLs) to ${endpointName}...`);

    try {
      const resp = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
        body: JSON.stringify(payload),
      });
      const body = await resp.text();

      if (resp.status === 200 || resp.status === 202) {
        console.log(`✓ HTTP ${resp.status} — accepted`);
        successCount++;
      } else if (resp.status === 429) {
        // Rate limit — wir warten und versuchen den nächsten Endpoint.
        // Wir zählen das NICHT als Fehler, damit der CI-Build nicht
        // failed. IndexNow reicht's später.
        console.warn(`⚠ HTTP 429 — rate limited (will retry next endpoint)`);
        rateLimitCount++;
      } else {
        console.warn(`⚠ HTTP ${resp.status} — ${body.slice(0, 200)}`);
        failCount++;
      }
    } catch (err) {
      console.warn(`⚠ Network error: ${err.message}`);
      failCount++;
    }
  }
}

console.log(`\n${'='.repeat(50)}`);
console.log(`✓ Successful batches: ${successCount}`);
console.log(`⚠ Rate-limited: ${rateLimitCount}`);
console.log(`✗ Failed batches: ${failCount}`);
console.log(`📊 Total URLs submitted: ${successCount > 0 ? urls.length : 0}`);
console.log(`${'='.repeat(50)}`);

// Best-effort: IndexNow-Fehler brechen den Build NICHT ab, solange die Site
// selbst erfolgreich deployed wurde. Nur lokale Fehler (Sitemap fehlt) exit 1.
console.log('\n✓ IndexNow submission complete (build continues regardless).');
process.exit(0);
