import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
// --- Config -----------------------------------------------------------------
const SPREADSHEET_ID = "1ohBXufi7WEvKVAdMavbM5ZQfWnjxveFxgR0FJZf4EJM";
const DASHBOARD_CSV = `https://docs.google.com/spreadsheets/d/e/2PACX-1vQElDgCZtxw83cOi2p7MPCASAVlt1jFC0QnEW3LagOZeu4ecVCKcqrG9M2IumCgeyi4vgvhYTSn2mTl/pub?output=csv&gid=0`;
// --- Firebase Admin (lazy init) ---------------------------------------------
let adminApp = null;
function getAdminApp() {
    if (adminApp)
        return adminApp;
    if (getApps().length > 0) {
        adminApp = getApps()[0];
        return adminApp;
    }
    const projectId = process.env.GCLOUD_PROJECT || process.env.FIREBASE_PROJECT_ID || "dor-progress";
    // Use Application Default Credentials (Cloud Functions / service account).
    adminApp = initializeApp({ projectId, credential: cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT || "{}")) });
    return adminApp;
}
// --- Lightweight CSV row parser (handles quoted fields) ----------------------
function parseCSVLine(line) {
    const result = [];
    let cur = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
        const ch = line[i];
        if (ch === '"') {
            if (inQuotes && line[i + 1] === '"') {
                cur += '"';
                i++;
            }
            else {
                inQuotes = !inQuotes;
            }
        }
        else if (ch === "," && !inQuotes) {
            result.push(cur);
            cur = "";
        }
        else {
            cur += ch;
        }
    }
    result.push(cur);
    return result;
}
// Minimal parser focused on what the snapshot needs: indicator rows + sheet metadata.
function parsePublishedDashboard(csv) {
    const lines = csv
        .split("\n")
        .map((l) => l.trim())
        .filter((l) => l.length > 0);
    let lastUpdateDate;
    let nextUpdateDate;
    let totalWeight = 0;
    let totalWeightProgress = 0;
    const indicators = [];
    for (const line of lines) {
        const full = line.replace(/"/g, "");
        if (full.includes("Last Update Date:")) {
            const m = full.match(/Last Update Date:\s*([0-9/]+)/i);
            if (m)
                lastUpdateDate = m[1];
            continue;
        }
        if (full.includes("Next Update Date:")) {
            const m = full.match(/Next Update Date:\s*([0-9/]+)/i);
            if (m)
                nextUpdateDate = m[1];
            continue;
        }
        if (full.includes("कुल भार") && full.includes("प्रगति")) {
            const mm = full.match(/\d+/);
            if (mm)
                totalWeightProgress = parseInt(mm[0], 10);
            continue;
        }
        // Indicator rows look like: name, sdg, period, weight, unit, baseline, totalTarget, totalProgress, annualTarget, annualProgress, ...
        const cols = parseCSVLine(line);
        if (cols.length >= 10 && cols[0] && !/^(कुल|Total|Last Update|Next Update)/i.test(cols[0])) {
            const name = cols[0].trim();
            const idMatch = name.match(/^(.*?)\s*[-\s]+\d+/);
            const id = (idMatch ? idMatch[1] : name).trim().replace(/\s+/g, "-").toLowerCase();
            const num = (s) => {
                const v = parseFloat(String(s).replace(/,/g, ""));
                return isNaN(v) ? 0 : v;
            };
            indicators.push({
                id,
                name,
                nameEn: name,
                sdg: cols[1] || "-",
                period: cols[2] || "मासिक",
                weight: num(cols[3]) || 5,
                unit: cols[4] || "",
                baseline: cols[5] || "-",
                totalTarget: num(cols[6]),
                totalProgress: num(cols[7]),
                annualTarget: num(cols[8]),
                annualProgress: num(cols[9]),
                category: "Administration",
                updatedAt: "",
                updatedBy: "",
            });
        }
    }
    return {
        indicators,
        metadata: { lastUpdateDate, nextUpdateDate, totalWeight, totalWeightProgress },
    };
}
// --- Core watcher -----------------------------------------------------------
export async function checkAndSnapshotFromSheet() {
    try {
        const res = await fetch(DASHBOARD_CSV);
        if (!res.ok)
            return { snapshotted: false, reason: `Dashboard fetch failed: ${res.status}` };
        const csv = await res.text();
        const { indicators, metadata } = parsePublishedDashboard(csv);
        if (!metadata.lastUpdateDate) {
            return { snapshotted: false, reason: "No Last Update Date found in sheet" };
        }
        if (indicators.length === 0) {
            return { snapshotted: false, reason: "No indicators parsed from sheet" };
        }
        const db = getFirestore(getAdminApp());
        const docId = metadata.lastUpdateDate.replace(/\//g, "-");
        const ref = db.collection("updates_history").doc(docId);
        const existing = await ref.get();
        if (existing.exists) {
            return { snapshotted: false, lastUpdateDate: metadata.lastUpdateDate, reason: "Snapshot already exists for this date" };
        }
        await ref.set({
            id: docId,
            lastUpdateDate: metadata.lastUpdateDate,
            createdAt: new Date().toISOString(),
            indicators: indicators.map((ind) => ({
                id: ind.id,
                name: ind.name,
                nameEn: ind.nameEn,
                sdg: ind.sdg,
                period: ind.period,
                weight: ind.weight,
                unit: ind.unit,
                baseline: ind.baseline,
                totalTarget: ind.totalTarget,
                totalProgress: ind.totalProgress,
                annualTarget: ind.annualTarget,
                annualProgress: ind.annualProgress,
                category: ind.category,
                updatedAt: ind.updatedAt || "",
                updatedBy: ind.updatedBy || "",
            })),
            metadata: {
                lastUpdateDate: metadata.lastUpdateDate,
                nextUpdateDate: metadata.nextUpdateDate || "",
                totalWeight: metadata.totalWeight || 0,
                totalWeightProgress: metadata.totalWeightProgress || 0,
            },
        });
        return { snapshotted: true, lastUpdateDate: metadata.lastUpdateDate };
    }
    catch (err) {
        return { snapshotted: false, reason: err?.message || "Unknown error" };
    }
}
//# sourceMappingURL=sheetWatcher.js.map