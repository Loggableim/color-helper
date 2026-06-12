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

const ENDPOINTS = [
  'https://yandex.com/indexnow',
  'https://api.indexnow.org/indexnow',
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
      } else {
        console.error(`✗ HTTP ${resp.status} — ${body.slice(0, 200)}`);
        failCount++;
      }
    } catch (err) {
      console.error(`✗ Network error: ${err.message}`);
      failCount++;
    }
  }
}

console.log(`\n${'='.repeat(50)}`);
console.log(`✓ Successful batches: ${successCount}`);
console.log(`✗ Failed batches: ${failCount}`);
console.log(`📊 Total URLs submitted: ${successCount > 0 ? urls.length : 0}`);
console.log(`${'='.repeat(50)}`);

process.exit(failCount > 0 ? 1 : 0);
