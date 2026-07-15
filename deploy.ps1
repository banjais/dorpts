# Deploy script: clean -> rebuild -> git push -> Cloudflare Pages + Firebase hosting.
# Pushing to GitHub auto-triggers the GitHub Actions workflow (also deploys both hosts).
# Usage:  .\deploy.ps1 "Optional commit message"
param(
  [string]$Message = "Update"
)

$ErrorActionPreference = "Stop"

function Run($cmd, $desc) {
  Write-Host "==> $desc" -ForegroundColor Cyan
  Invoke-Expression $cmd
  if ($LASTEXITCODE -ne 0) { throw "$desc failed (exit $LASTEXITCODE)" }
}

# 1. Clean previous build
Run "npm run clean" "Cleaning previous build"

# 2. Rebuild from scratch
Run "npm run build" "Building project"

# 3. Stage + commit any changes
Run "git add -A" "Staging changes"
$status = git status --porcelain
if ($status) {
  Run "git commit -m `"$Message`"" "Committing"
} else {
  Write-Host "==> No source changes to commit" -ForegroundColor Yellow
}

# 4. Push to GitHub (auto-triggers GitHub Actions: Cloudflare + Firebase hosting)
Run "git push origin master" "Pushing to GitHub"

# 5. Deploy to Cloudflare Pages (Wrangler)
Run "npx wrangler pages deploy dist --project-name=dorpts --commit-dirty=true" "Deploying to Cloudflare Pages"

# 6. Deploy to Firebase Hosting (Spark ok)
Run "npx firebase deploy --only hosting --project dor-progress" "Deploying to Firebase Hosting"

Write-Host "==> Deploy complete" -ForegroundColor Green
