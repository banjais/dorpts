// scripts/add-authorized-domain.ts
// Adds a domain to Firebase Authentication's authorized domains list via the
// Identity Toolkit Admin API. Needed because Firebase only auto-authorizes
// <project-id>.firebaseapp.com and <project-id>.web.app (the default Hosting
// site) — additional Hosting sites (e.g. "dorpts" -> dorpts.web.app) and any
// non-Firebase host (e.g. Cloudflare Pages' dorpts.pages.dev) must be added
// manually or the Google sign-in redirect will fail with auth/unauthorized-domain.
//
// Usage: tsx scripts/add-authorized-domain.ts <domain> [domain2 ...]
// Requires FIREBASE_SERVICE_ACCOUNT env var (full service-account JSON string)
// or FIREBASE_SERVICE_ACCOUNT_PATH pointing to a service-account JSON file.

import fetch from "node-fetch";
import { google } from "googleapis";
import { readFileSync } from "fs";
import path from "path";
import dotenv from "dotenv";

dotenv.config();

function loadServiceAccount(): any {
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    return JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  }
  const p = process.env.FIREBASE_SERVICE_ACCOUNT_PATH || path.resolve(__dirname, "serviceAccount.json");
  try {
    return JSON.parse(readFileSync(p, "utf8"));
  } catch (e) {
    console.error("No FIREBASE_SERVICE_ACCOUNT env var and failed to read service account file at", p, e);
    process.exit(1);
  }
}

const serviceAccount = loadServiceAccount();

async function getAccessToken(): Promise<string> {
  const jwt = new google.auth.JWT(
    serviceAccount.client_email,
    undefined,
    serviceAccount.private_key,
    ["https://www.googleapis.com/auth/cloud-platform"]
  );
  const tokenResponse = await jwt.authorize();
  return tokenResponse.access_token as string;
}

async function addAuthorizedDomains(newDomains: string[]) {
  const projectId = serviceAccount.project_id;
  const token = await getAccessToken();
  const configUrl = `https://identitytoolkit.googleapis.com/admin/v2/projects/${projectId}/config`;

  const getRes = await fetch(configUrl, { headers: { Authorization: `Bearer ${token}` } });
  if (!getRes.ok) {
    console.error("Failed to fetch config:", await getRes.text());
    process.exit(1);
  }
  const config = await getRes.json();
  const existing: string[] = config.authorizedDomains || [];

  const toAdd = newDomains.filter(d => !existing.includes(d));
  if (toAdd.length === 0) {
    console.log("All requested domains are already authorized:", newDomains);
    return;
  }

  const merged = [...existing, ...toAdd];
  const patchRes = await fetch(`${configUrl}?updateMask=authorizedDomains`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ authorizedDomains: merged }),
  });

  if (!patchRes.ok) {
    console.error("Failed to update authorized domains:", await patchRes.text());
    process.exit(1);
  }

  console.log(`Added: ${toAdd.join(", ")}`);
  console.log("Full authorized domain list is now:", merged);
}

const args = process.argv.slice(2);
if (args.length < 1) {
  console.error("Usage: tsx scripts/add-authorized-domain.ts <domain> [domain2 ...]");
  console.error("Example: tsx scripts/add-authorized-domain.ts dorpts.web.app dorpts.pages.dev");
  process.exit(1);
}
addAuthorizedDomains(args).catch(e => {
  console.error(e);
  process.exit(1);
});
