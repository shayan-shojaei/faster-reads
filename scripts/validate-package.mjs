import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const root = new URL('..', import.meta.url).pathname;
const output = join(root, '.output');
const extensionDirectory = join(output, 'chrome-mv3');
const packageJson = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
const versionMetadata = JSON.parse(readFileSync(join(root, 'docs/version.json'), 'utf8'));
const manifest = JSON.parse(readFileSync(join(extensionDirectory, 'manifest.json'), 'utf8'));

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

assert(manifest.version === packageJson.version, 'Manifest and package versions differ.');
assert(
  versionMetadata.version === packageJson.version,
  'Pages metadata and package versions differ.',
);
assert(!manifest.host_permissions, 'Release manifest must not contain required host permissions.');
assert(
  Array.isArray(manifest.content_scripts) && manifest.content_scripts.length === 0,
  'Content scripts must use runtime registration.',
);
assert(manifest.key, 'Release manifest must include the stable public key.');
for (const size of ['16', '32', '48', '128']) {
  const iconPath = manifest.icons?.[size];
  assert(iconPath && existsSync(join(extensionDirectory, iconPath)), `Missing ${size}px icon.`);
}

const zipName = readdirSync(output).find((name) => name.endsWith('-chrome.zip'));
assert(zipName, 'WXT Chrome ZIP was not generated.');
const entries = execFileSync('unzip', ['-Z1', join(output, zipName)], { encoding: 'utf8' })
  .trim()
  .split('\n');
assert(entries.includes('manifest.json'), 'ZIP must contain manifest.json at its root.');
const forbidden = entries.filter((entry) =>
  /(^|\/)(src|tests?|node_modules)\/|\.(map|ts|tsx|pem|key)$/.test(entry),
);
assert(!forbidden.length, `ZIP contains forbidden files: ${forbidden.join(', ')}`);

console.log(`Validated ${zipName} (${entries.length} files).`);
