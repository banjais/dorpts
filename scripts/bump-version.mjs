import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const target = path.join(__dirname, '..', 'src', 'constants', 'appTitles.ts');

const content = readFileSync(target, 'utf8');
const match = content.match(/export const APP_VERSION = '(.*?)';/);
if (!match) {
  console.error('APP_VERSION not found in appTitles.ts');
  process.exit(1);
}

const current = match[1];
const parts = current.split('.').map(Number);
parts[2] = (parts[2] || 0) + 1;
const newVersion = parts.join('.');

const newContent = content.replace(
  /export const APP_VERSION = '.*?';/,
  `export const APP_VERSION = '${newVersion}';`
);

writeFileSync(target, newContent, 'utf8');
console.log(`Bumped APP_VERSION: ${current} -> ${newVersion}`);
