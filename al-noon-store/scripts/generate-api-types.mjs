/**
 * Generate TypeScript types from OpenAPI spec.
 * 1. Tries http://localhost:4000/api-docs/spec.json (BE must be running).
 * 2. If that fails, uses local spec.json.
 * Usage: node scripts/generate-api-types.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SPEC_URL = 'http://localhost:4000/api-docs/spec.json';
const OUTPUT = path.resolve(__dirname, '../src/app/core/types/api.schema.ts');

async function main() {
  let spec;
  try {
    const res = await fetch(SPEC_URL);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    spec = await res.json();
    console.log('Fetched spec from', SPEC_URL);
  } catch (e) {
    console.warn('Could not fetch from BE:', e.message);
    const localPath = path.resolve(__dirname, '../spec.json');
    if (!fs.existsSync(localPath)) {
      console.error('No local spec.json found. Start the BE or add spec.json.');
      process.exit(1);
    }
    spec = JSON.parse(fs.readFileSync(localPath, 'utf8'));
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
  console.error(err);
  process.exit(1);
});
