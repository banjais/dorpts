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

// 4. Deploy to Cloudflare Pages (production) -> https://dorpts.pages.dev
// project's production_branch is "main" (no Git integration); --branch main targets production
// (without it, wrangler deploys to the local git branch as a Preview and dorpts.pages.dev 404s)
console.log('[3/5] Deploying to Cloudflare Pages (production)...');
try {
  const output = execSync('npx wrangler pages deploy dist --project-name dorpts --branch main', { 
    cwd: root, 
    shell: true,
    encoding: 'utf8',
    stdio: ['pipe', 'pipe', 'pipe']
  });
  const filtered = output.split('\n').filter(line => !line.includes('.pages.dev')).join('\n');
  if (filtered.trim()) console.log(filtered);
} catch (e) {
  console.error('Command failed: npx wrangler pages deploy dist --project-name dorpts --branch main');
  process.exit(e.status || 1);
}

// 5. Deploy Firebase Hosting (static only) -> https://dorpts.web.app
// .firebaserc sets default project "dor-progress"; firebase.json "target":"dorpts" + target mapping
// deploy to the named site "dorpts" (-> dorpts.web.app), NOT the default dor-progress.web.app site
console.log('[4/5] Deploying to Firebase Hosting (static only)...');
run('npx firebase deploy --only hosting --project dor-progress');

console.log('\n[5/5] Deployment complete.');
console.log('  Cloudflare Pages : https://dorpts.pages.dev');
console.log('  Firebase Hosting  : https://dorpts.web.app');
