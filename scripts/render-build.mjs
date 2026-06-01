/**
 * Render.com build helper: optionally inject API_URL into production environment, then build.
 * Usage: API_URL=https://your-api.example.com npm run build:render
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

const ENV_FILE = 'src/environments/environment.prod.ts';
const apiUrl = process.env.API_URL?.trim();

if (apiUrl) {
  const content = readFileSync(ENV_FILE, 'utf8');
  const escaped = apiUrl.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
  const updated = content.replace(/apiUrl:\s*['"][^'"]*['"]/, `apiUrl: '${escaped}'`);
  if (updated === content) {
    console.warn(`[render-build] Could not find apiUrl in ${ENV_FILE}; building with existing value.`);
  } else {
    writeFileSync(ENV_FILE, updated);
    console.log(`[render-build] Set apiUrl to ${apiUrl}`);
  }
} else {
  console.log(`[render-build] API_URL not set; using apiUrl from ${ENV_FILE}`);
}

const result = spawnSync('npm', ['run', 'build'], { stdio: 'inherit', shell: true });
process.exit(result.status ?? 1);
