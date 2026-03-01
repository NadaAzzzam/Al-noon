/**
 * Generate TypeScript types from OpenAPI spec.
 * 1. Tries http://localhost:4000/api-docs/spec.json (BE must be running).
 * 2. If that fails, uses local spec.json.
 * 3. If SILENT=1: skip when neither works (for prebuild); otherwise exit 1.
 * When fetching from BE, saves spec.json locally for next time.
 * Usage: node scripts/generate-api-types.mjs
 *        SILENT=1 node scripts/generate-api-types.mjs  (no fail)
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SPEC_URL = 'http://localhost:4000/api-docs/spec.json';
const SPEC_LOCAL = path.resolve(__dirname, '../spec.json');
const OUTPUT = path.resolve(__dirname, '../src/app/core/types/api.schema.ts');
const SILENT = process.env.SILENT === '1' || process.argv.includes('--silent');

async function main() {
  let spec;
  try {
    const res = await fetch(SPEC_URL);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    spec = await res.json();
    console.log('Fetched spec from', SPEC_URL);
    fs.writeFileSync(SPEC_LOCAL, JSON.stringify(spec, null, 2), 'utf8');
    console.log('Saved spec.json for offline use');
  } catch (e) {
    console.warn('Could not fetch from BE:', e.message);
    if (!fs.existsSync(SPEC_LOCAL)) {
      if (SILENT) {
        console.warn('No spec.json. Skipping type generation. Run: npm run sync:api');
        process.exit(0);
      }
      console.error('No local spec.json. Start the BE or run: npm run sync:api');
      process.exit(1);
    }
    spec = JSON.parse(fs.readFileSync(SPEC_LOCAL, 'utf8'));
    console.log('Using local spec.json');
  }

  const { default: openapiTS, astToString, COMMENT_HEADER } = await import('openapi-typescript');
  const nodes = await openapiTS(spec, {});
  const out = COMMENT_HEADER + astToString(nodes);
  fs.mkdirSync(path.dirname(OUTPUT), { recursive: true });
  fs.writeFileSync(OUTPUT, out, 'utf8');
  console.log('Written', OUTPUT);
}

main().catch((err) => {
  if (SILENT) {
    console.warn('generate-api-types failed:', err.message);
    process.exit(0);
  }
  console.error(err);
  process.exit(1);
});
