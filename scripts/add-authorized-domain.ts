// scripts/add-authorized-domain.ts
import fetch from 'node-fetch';
import { google } from 'googleapis';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

dotenv.config();

const serviceAccountStr = process.env.FIREBASE_SERVICE_ACCOUNT;
if (!serviceAccountStr) {
  console.error('FIREBASE_SERVICE_ACCOUNT env var not set');
  process.exit(1);
}
const serviceAccount = JSON.parse(serviceAccountStr);

async function getAccessToken(): Promise<string> {
  const jwt = new google.auth.JWT(
    serviceAccount.client_email,
    undefined,
    serviceAccount.private_key,
    ['https://www.googleapis.com/auth/cloud-platform']
  );
  const tokenResponse = await jwt.authorize();
  return tokenResponse.access_token as string;
}

async function addAuthorizedDomain(domain: string) {
  const projectId = serviceAccount.project_id;
  const token = await getAccessToken();
  const configUrl = `https://identitytoolkit.googleapis.com/admin/v2/projects/${projectId}/config`;

  const getRes = await fetch(configUrl, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!getRes.ok) {
    console.error('Failed to fetch config:', await getRes.text());
    process.exit(1);
  }
  const config = await getRes.json();
  const domains: string[] = config.authorizedDomains || [];

  if (domains.includes(domain)) {
    console.log(`Domain ${domain} already authorized`);
    return;
  }

  const newDomains = [...domains, domain];
  const patchRes = await fetch(`${configUrl}?updateMask=authorizedDomains`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ authorizedDomains: newDomains }),
  });

  if (!patchRes.ok) {
    console.error('Failed to update authorized domains:', await patchRes.text());
    process.exit(1);
  }

  console.log(`Domain ${domain} added successfully. Updated list:`, newDomains);
}

const args = process.argv.slice(2);
if (args.length !== 1) {
  console.error('Usage: ts-node scripts/add-authorized-domain.ts <domain>');
  process.exit(1);
}
addAuthorizedDomain(args[0]).catch((e) => {
  console.error(e);
  process.exit(1);
});
import dotenv from "dotenv";
import path from "path";
import { readFileSync } from "fs";

dotenv.config();

// Load service account JSON either from a file path or from the env variable (if it contains the full JSON).
const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH || path.resolve(__dirname, "serviceAccount.json");
let serviceAccount;
try {
  const raw = readFileSync(serviceAccountPath, "utf8");
  serviceAccount = JSON.parse(raw);
} catch (e) {
  console.error("Failed to read service account JSON from", serviceAccountPath, e);
  process.exit(1);
}

import dotenv from "dotenv";
dotenv.config();
// Adds an authorized domain to Firebase Authentication using the Identity Toolkit API.
// Requires FIREBASE_SERVICE_ACCOUNT env var containing a service account JSON.

import fetch from "node-fetch";
import { google } from "googleapis";

const serviceAccountStr = process.env.FIREBASE_SERVICE_ACCOUNT;
if (!serviceAccountStr) {
  console.error("FIREBASE_SERVICE_ACCOUNT env var not set");
  process.exit(1);
}
const serviceAccount = JSON.parse(serviceAccountStr);

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

async function addAuthorizedDomain(domain: string) {
  const projectId = serviceAccount.project_id;
  const token = await getAccessToken();
  const configUrl = `https://identitytoolkit.googleapis.com/admin/v2/projects/${projectId}/config`;
  const getRes = await fetch(configUrl, { headers: { Authorization: `Bearer ${token}` } });
  if (!getRes.ok) {
    console.error("Failed to fetch config:", await getRes.text());
    process.exit(1);
  }
  const config = await getRes.json();
  const domains: string[] = config.authorizedDomains || [];
  if (domains.includes(domain)) {
    console.log(`Domain ${domain} already authorized`);
    return;
  }
  const newDomains = [...domains, domain];
  const patchRes = await fetch(`${configUrl}?updateMask=authorizedDomains`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ authorizedDomains: newDomains }),
  });
  if (!patchRes.ok) {
    console.error("Failed to update authorized domains:", await patchRes.text());
    process.exit(1);
  }
  console.log(`Domain ${domain} added successfully. Updated list:`, newDomains);
}

const args = process.argv.slice(2);
if (args.length !== 1) {
  console.error("Usage: tsx scripts/add-authorized-domain.ts <domain>");
  process.exit(1);
}
addAuthorizedDomain(args[0]).catch(e => { console.error(e); process.exit(1); });
