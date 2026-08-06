// One-command deploy: clean -> build -> commit+push to GitHub -> Cloudflare Pages -> Firebase Hosting (static only)
// Run with: npm run deploy
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const root = __dirname;

function run(cmd, { allowFail = false } = {}) {
  console.log('\n>>> ' + cmd);
  try {
    execSync(cmd, { stdio: 'inherit', cwd: root, shell: true });
  } catch (e) {
    if (!allowFail) {
      console.error('Command failed: ' + cmd);
      process.exit(e.status || 1);
    }
  }
}

// 1. Clean build artifacts
console.log('[1/5] Cleaning build artifacts...');
fs.rmSync(path.join(root, 'dist'), { recursive: true, force: true });
try { fs.rmSync(path.join(root, 'server.js'), { force: true }); } catch (_) {}

// 2. Build (prebuild hook auto-bumps APP_VERSION in src/constants/appTitles.ts)
run('npm run build');

// 3. Commit (with version bump) and push to GitHub
const vFile = path.join(root, 'src', 'constants', 'appTitles.ts');
const vText = fs.readFileSync(vFile, 'utf8');
const vMatch = vText.match(/APP_VERSION\s*=\s*['"]([^'"]+)['"]/);
const version = vMatch ? vMatch[1] : '0.0.0';
console.log('[2/5] Committing and pushing to GitHub (v' + version + ')...');
run('git add -A');
run('git commit -m "chore: release build v' + version + ' [skip ci]"', { allowFail: true });
run('git push');

// 4. Deploy to Cloudflare Pages -> https://dorpts.pages.dev
console.log('[3/5] Deploying to Cloudflare Pages...');
run('npx wrangler pages deploy dist --project-name dorpts');

// 5. Deploy Firebase Hosting (static only) -> https://dorpts.web.app
console.log('[4/5] Deploying to Firebase Hosting (static only)...');
run('npx firebase deploy --only hosting');

console.log('\n[5/5] Deployment complete.');
console.log('  Cloudflare Pages : https://dorpts.pages.dev');
console.log('  Firebase Hosting  : https://dorpts.web.app');
