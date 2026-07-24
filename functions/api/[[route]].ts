// Cloudflare Pages Function — handles /api/* on the edge (free tier).
// Secrets are read from context.env, set via
// `wrangler pages secret put KEY` (never committed).

interface Env {
  GEMINI_API_KEY?: string;
  RESEND_API_KEY?: string;
  APP_NAME?: string;
}

// ---------------------------------------------------------------------------
// Email OTP via Resend SDK
// ---------------------------------------------------------------------------

import { Resend } from 'resend';

async function sendOTPEmail(env: Env, to: string, otp: string): Promise<void> {
  const apiKey = env.RESEND_API_KEY || process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error('Email service not configured on server');
  }

  const appName = env.APP_NAME || 'DORPTS';
  const resendClient = new Resend(apiKey);

  const { error } = await resendClient.emails.send({
    from: `${appName} <noreply@dorpts.app>`,
    to,
    subject: `${appName} - Your Login Code`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 20px; text-align: center;">
        <div style="background: #0099DA; color: white; padding: 16px 24px; border-radius: 12px 12px 0 0; font-size: 18px; font-weight: bold;">
          ${appName}
        </div>
        <div style="background: #f8fafc; padding: 24px; border-radius: 0 0 12px 12px; border: 1px solid #e2e8f0; border-top: none;">
          <p style="color: #334155; font-size: 14px; margin-bottom: 16px;">Your verification code is:</p>
          <div style="background: white; border: 2px dashed #0099DA; border-radius: 8px; padding: 16px; font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #0099DA;">
            ${otp}
          </div>
          <p style="color: #64748b; font-size: 12px; margin-top: 16px;">This code expires in 10 minutes. Do not share it with anyone.</p>
        </div>
      </div>
    `,
  });

  if (error) {
    throw new Error(error.message || 'Failed to send OTP email');
  }
}

// ---------------------------------------------------------------------------
// Local fallbacks (used when GEMINI_API_KEY is missing or the API fails)
// ---------------------------------------------------------------------------

function detectAnomaliesLocally(indicators: any[], historicalData: any[]): any[] {
  const anomalies: any[] = [];
  const sortedHistory = [...(historicalData || [])].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  for (const ind of indicators) {
    const curVal = ind.annualProgress || 0;
    const targetVal = ind.annualTarget || 0;
    const unit = ind.unit || "";
    const nameEn = ind.nameEn || ind.name || "";
    const nameNp = ind.name || ind.nameEn || "";

    if (curVal < 0 || targetVal < 0) {
      anomalies.push({
        indicatorId: ind.id,
        indicatorName: nameEn,
        type: "inconsistent",
        severity: "high",
        currentValue: curVal,
        previousValue: null,
        explanationEn: `Negative value detected for ${nameEn} (Progress: ${curVal}, Target: ${targetVal}). This is physically impossible.`,
        explanationNp: `${nameNp} मा नकारात्मक मान फेला पर्यो (प्रगति: ${curVal}, लक्ष्य: ${targetVal})। यो असम्भव छ।`,
      });
      continue;
    }

    if (targetVal === 0 && curVal > 0) {
      anomalies.push({
        indicatorId: ind.id,
        indicatorName: nameEn,
        type: "inconsistent",
        severity: "medium",
        currentValue: curVal,
        previousValue: null,
        explanationEn: `Positive progress (${curVal} ${unit}) reported with a zero annual target.`,
        explanationNp: `शून्य वार्षिक लक्ष्य हुँदा पनि सकारात्मक प्रगति (${curVal} ${unit}) दर्ता भएको छ।`,
      });
    }

    if (targetVal > 0 && curVal > targetVal * 1.5) {
      anomalies.push({
        indicatorId: ind.id,
        indicatorName: nameEn,
        type: "exceeds_target",
        severity: "medium",
        currentValue: curVal,
        previousValue: null,
        explanationEn: `Progress of ${curVal} ${unit} exceeds the annual target of ${targetVal} ${unit} by over 150% (achievement: ${((curVal / targetVal) * 100).toFixed(0)}%).`,
        explanationNp: `प्रगति ${curVal} ${unit} ले वार्षिक लक्ष्य ${targetVal} ${unit} लाई १५०% भन्दा बढी नाघेको छ (प्रगति: ${((curVal / targetVal) * 100).toFixed(0)}%)।`,
      });
    }

    let previousVal: number | null = null;
    let lastSnapshotDate = "";

    for (const snapshot of sortedHistory) {
      const histInd = snapshot.indicators?.find((h: any) => h.id === ind.id);
      if (histInd) {
        const histVal = histInd.annualProgress || 0;
        if (curVal < histVal) {
          anomalies.push({
            indicatorId: ind.id,
            indicatorName: nameEn,
            type: "drop",
            severity: "high",
            currentValue: curVal,
            previousValue: histVal,
            explanationEn: `Progress dropped from ${histVal} ${unit} in ${snapshot.date} to ${curVal} ${unit} currently. Cumulative progress should not decrease.`,
            explanationNp: `प्रगति ${snapshot.date} मा ${histVal} ${unit} बाट घटेर हाल ${curVal} ${unit} मा पुगेको छ। संचयी प्रगति घट्नु हुँदैन।`,
          });
          break;
        }
        previousVal = histVal;
        lastSnapshotDate = snapshot.date;
      }
    }

    if (previousVal !== null) {
      const spikeThreshold = targetVal > 0 ? targetVal : previousVal > 0 ? previousVal : 10;
      const diff = curVal - previousVal;
      if (diff > spikeThreshold) {
        anomalies.push({
          indicatorId: ind.id,
          indicatorName: nameEn,
          type: "spike",
          severity: "high",
          currentValue: curVal,
          previousValue: previousVal,
          explanationEn: `Sudden progress surge from ${previousVal} ${unit} (${lastSnapshotDate}) to ${curVal} ${unit} currently (increase of ${diff} ${unit}).`,
          explanationNp: `प्रगतिमा अचानक तीव्र वृद्धि: ${previousVal} ${unit} (${lastSnapshotDate}) बाट बढेर हाल ${curVal} ${unit} पुगेको छ (${diff} ${unit} को वृद्धि)।`,
        });
      }
    }
  }

  return anomalies;
}

function generateLocalReportSummary(indicators: any[], language: string): string {
  const isNepali = language === "ne";
  const total = indicators.length;
  let active = 0;
  let aheadCount = 0;
  let behindCount = 0;

  indicators.forEach((ind) => {
    const progress = ind.annualProgress || 0;
    const target = ind.annualTarget || 0;
    if (target > 0) {
      const pct = (progress / target) * 100;
      if (pct >= 100) aheadCount++;
      else if (pct < 50) behindCount++;
    }
    if (progress > 0) active++;
  });

  if (isNepali) {
    return `कार्यकारी सारांश प्रतिवेदन (सडक विभाग प्रणाली):\n\n१. समष्टिगत स्थिति: विश्लेषण गरिएका कुल ${total} विकास सूचकहरू मध्ये ${active} वटामा प्रगति दर्ता भएको छ। यस मध्ये ${aheadCount} सूचकहरूले निर्धारित वार्षिक लक्ष्य हासिल गरेका वा नाघेका छन्, जबकि ${behindCount} वटा सूचकहरूमा प्रगति सुस्त (५०% भन्दा कम) देखिएको छ।\n\n२. मुख्य उपलब्धिहरू: सडक पूर्वाधार र राष्ट्रिय गौरवका आयोजनाहरूमा निरन्तर प्रगति भइरहेको छ।\n\n३. जोखिम र चुनौतीहरू: कूल ${behindCount} सूचकहरू अझै पनि निर्धारित लक्ष्यभन्दा निकै पछाडि छन्।\n\n४. आगामी कार्यदिशा: निर्धारित लक्ष्यहरू समयमै पूरा गर्न दोस्रो चौमासिक समीक्षा तीव्र पार्नुपर्दछ।`;
  }
  return `Executive Summary Report (Department of Roads Audit):\n\n1. Overall Status: Out of the ${total} analyzed development indicators, ${active} are actively recording progress. Notably, ${aheadCount} indicators have met or exceeded their annual targets, while ${behindCount} indicators are significantly lagging behind (below 50% target achievement).\n\n2. Key Achievements: Strategic road networks and national pride highway projects continue to demonstrate steady growth.\n\n3. Critical Risks & Challenges: There are ${behindCount} high-priority indicators currently lagging behind schedule.\n\n4. Strategic Recommendations: Accelerate second-trimester reviews and strengthen site-level supervision.`;
}

function handleLocalChatFallback(message: string): { text: string; functionCalls: any[] } {
  const msgLower = message.toLowerCase();
  const functionCalls: any[] = [];
  let text = "I am the Department of Roads AI Assistant. I can help you navigate or generate reports.";

  if (msgLower.includes("dashboard") || msgLower.includes("गृहपृष्ठ") || msgLower.includes("ड्यास") || msgLower.includes("home")) {
    functionCalls.push({ name: "open_page", args: { page: "dashboard" } });
    text = "Opening the main Dashboard view for you.";
  } else if (msgLower.includes("setting") || msgLower.includes("सेटिङ") || msgLower.includes("थिम") || msgLower.includes("theme")) {
    functionCalls.push({ name: "open_page", args: { page: "settings" } });
    text = "Navigating to System Settings and Customizations.";
  } else if (msgLower.includes("data") || msgLower.includes("सङ्ग्रह") || msgLower.includes("डाटा") || msgLower.includes("तालिका") || msgLower.includes("table")) {
    functionCalls.push({ name: "open_page", args: { page: "data" } });
    text = "Switching to the Data Indicators view.";
  } else if (msgLower.includes("report") || msgLower.includes("प्रतिवेदन") || msgLower.includes("विवरण")) {
    functionCalls.push({ name: "open_page", args: { page: "reports" } });
    text = "Opening the Reports Generator view.";
  }
  if (msgLower.includes("print") || msgLower.includes("मुद्रण") || msgLower.includes("छाप")) {
    functionCalls.push({ name: "print_screen", args: {} });
    text = "Initiating the print dialog for your current screen view.";
  }
  if (msgLower.includes("volume") || msgLower.includes("आवाज") || msgLower.includes("म्युट") || msgLower.includes("mute") || msgLower.includes("sound")) {
    const enable = !msgLower.includes("off") && !msgLower.includes("mute") && !msgLower.includes("म्युट") && !msgLower.includes("बन्द");
    functionCalls.push({ name: "set_volume", args: { enabled: enable } });
    text = `Adjusting system sound settings. Volume is now ${enable ? "enabled" : "disabled"}.`;
  }
  if (msgLower.includes("menu") || msgLower.includes("मेनु") || msgLower.includes("सूची") || msgLower.includes("navigation")) {
    functionCalls.push({ name: "show_menu", args: {} });
    text = "Displaying the application navigation menu.";
  }
  if (functionCalls.length === 0) {
    if (msgLower.includes("hello") || msgLower.includes("hi") || msgLower.includes("नमस्ते")) {
      text = "Namaste! I am the Department of Roads Assistant. How can I help you today?";
    } else if (msgLower.includes("help") || msgLower.includes("मद्दत") || msgLower.includes("के गर्न")) {
      text = "I can assist you with navigating the system! Try saying: 'Open Settings', 'Go to Data Table', 'Generate a Report', or 'Print this page'.";
    } else {
      text = "Thank you for your message. I am the Department of Roads digital assistant. Let me know what you would like to do!";
    }
  }
  return { text, functionCalls };
}

// ---------------------------------------------------------------------------
// Gemini REST helper (edge-safe, no SDK)
// ---------------------------------------------------------------------------

async function geminiGenerate(env: Env, body: any): Promise<any> {
  const key = env.GEMINI_API_KEY;
  if (!key) throw new Error("no-key");
  const r = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${key}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }
  );
  return r.json();
}

function partsText(data: any): string {
  const parts = data?.candidates?.[0]?.content?.parts || [];
  return parts.map((p: any) => p.text || "").join("");
}

// ---------------------------------------------------------------------------
// Router
// ---------------------------------------------------------------------------

function withCors(res) {
  res.headers.set("Access-Control-Allow-Origin", "*");
  res.headers.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
  return res;
}

export async function onRequest(context: { request: Request; env: Env }) {
  const { request, env } = context;
  const url = new URL(request.url);
  const path = url.pathname;
  const method = request.method;

  if (method === "OPTIONS") {
    return withCors(new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    }));
  }

  if (path === "/api/health" && method === "GET") {
    return withCors(Response.json({ status: "ok" }));
  }

  if (path === "/api/ai/report-summary" && method === "POST") {
    const { indicators, language } = await request.json();
    if (!Array.isArray(indicators)) {
      return withCors(Response.json({ error: "Indicators array is required" }, { status: 400 }));
    }
    try {
      const isNepali = language === "ne";
      const prompt = `You are an expert data analyst working for the Department of Roads, Government of Nepal.
Analyze the following road development and infrastructure indicators:
${JSON.stringify(
  indicators.map((ind: any) => ({
    name: ind.nameEn,
    nameNp: ind.name,
    category: ind.category,
    weight: ind.weight,
    unit: ind.unit,
    annualTarget: ind.annualTarget,
    annualProgress: ind.annualProgress,
    achievementPercent: ind.annualTarget > 0 ? ((ind.annualProgress / ind.annualTarget) * 100).toFixed(1) : 0,
  }))
)}

Write a concise, highly professional executive summary of the indicators' progress, key highlights, and any critical risks or areas needing attention.
Please write the response in ${isNepali ? "Nepali (नेपाली)" : "English"}.
Keep the output elegant, objective, and nicely formatted in standard paragraphs or subtle bullet points. Do not include markdown headers (like # or ##) or excessive symbols. Keep it under 250 words.`;
      const data = await geminiGenerate(env, {
        contents: [{ role: "user", parts: [{ text: prompt }] }],
      });
      return withCors(Response.json({ summary: partsText(data) }));
    } catch {
      return withCors(Response.json({ summary: generateLocalReportSummary(indicators, language) }));
    }
  }

  if (path === "/api/ai/detect-anomalies" && method === "POST") {
    const { indicators, historicalData } = await request.json();
    if (!Array.isArray(indicators)) {
      return withCors(Response.json({ error: "Indicators array is required" }, { status: 400 }));
    }
    try {
      const prompt = `You are a professional auditor and senior data scientist for the Department of Roads, Government of Nepal.
Your task is to analyze the current indicators and compare them with the provided historical snapshots to detect data anomalies.

Anomalies to look for:
1. Progress Drops: Cumulative indicators should NOT decrease over time.
2. Progress Spikes: A massive or sudden increase compared to the last historical snapshot.
3. Over-achievement/Exceeds Target: Progress exceeding target by over 150%.
4. Data Inconsistencies: Impossible physical quantities (negative values, zero target with positive progress).

Current Indicators:
${JSON.stringify(
  indicators.map((ind: any) => ({
    id: ind.id,
    nameEn: ind.nameEn,
    nameNp: ind.name,
    annualProgress: ind.annualProgress,
    annualTarget: ind.annualTarget,
    unit: ind.unit,
  }))
)}

Historical Snapshots:
${JSON.stringify(historicalData)}

Analyze each active indicator and generate an array of detected anomalies. If no anomalies are detected, return an empty array.
Keep explanationEn and explanationNp concise, precise, and highly professional. Include actual figures in explanations.`;
      const data = await geminiGenerate(env, {
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: {
            type: "OBJECT",
            properties: {
              anomalies: {
                type: "ARRAY",
                items: {
                  type: "OBJECT",
                  properties: {
                    indicatorId: { type: "STRING" },
                    indicatorName: { type: "STRING" },
                    type: { type: "STRING" },
                    severity: { type: "STRING" },
                    currentValue: { type: "NUMBER" },
                    previousValue: { type: "NUMBER", nullable: true },
                    explanationEn: { type: "STRING" },
                    explanationNp: { type: "STRING" },
                  },
                  required: ["indicatorId", "indicatorName", "type", "severity", "currentValue", "explanationEn", "explanationNp"],
                },
              },
            },
            required: ["anomalies"],
          },
        },
      });
      let parsed: any = {};
      try {
        parsed = JSON.parse(partsText(data) || "{}");
      } catch {
        parsed = {};
      }
      return withCors(Response.json({ anomalies: parsed.anomalies || [] }));
    } catch {
      return withCors(Response.json({ anomalies: detectAnomaliesLocally(indicators, historicalData) }));
    }
  }

  if (path === "/api/ai/chat" && method === "POST") {
    const { message, history } = await request.json();
    try {
      const functionDeclarations = [
        { name: "open_page", description: "Opens a specific page or view in the application (e.g. settings, dashboard, data).", parameters: { type: "OBJECT", properties: { page: { type: "STRING" } }, required: ["page"] } },
        { name: "make_report", description: "Generate a report (comprehensive, short, comparison).", parameters: { type: "OBJECT", properties: { type: { type: "STRING" } }, required: ["type"] } },
        { name: "print_screen", description: "Trigger the print dialog for the current view.", parameters: { type: "OBJECT", properties: {} } },
        { name: "show_menu", description: "Shows or opens the application menu, navigation, or view switcher.", parameters: { type: "OBJECT", properties: {} } },
        { name: "set_volume", description: "Enable or disable volume/audio feedback.", parameters: { type: "OBJECT", properties: { enabled: { type: "BOOLEAN" } }, required: ["enabled"] } },
      ];
      const contents = [
        ...(history || []).map((h: any) => ({ role: h.role || "user", parts: [{ text: h.text || "" }] })),
        { role: "user", parts: [{ text: message }] },
      ];
      const data = await geminiGenerate(env, {
        contents,
        systemInstruction: {
          parts: [{ text: "You are an AI assistant for a dashboard application. You can answer questions, and perform actions like opening pages, printing, generating reports, showing menus, and changing volume. Use tools to perform actions when asked." }],
        },
        tools: [{ functionDeclarations }],
      });
      const parts = data?.candidates?.[0]?.content?.parts || [];
      const text = parts.map((p: any) => p.text || "").join("");
      const functionCalls = parts.map((p: any) => p.functionCall).filter(Boolean);
      return withCors(Response.json({ text, functionCalls }));
    } catch {
      return withCors(Response.json(handleLocalChatFallback(message)));
    }
  }

  const sheetsMatch = path.match(/^\/api\/sheets\/([^/]+)\/(.+)$/);

  // Auth: send OTP email
  if (path === '/api/auth/send-otp' && method === 'POST') {
    try {
      const { email, otp } = await request.json();
      if (!email || !otp || typeof email !== 'string' || typeof otp !== 'string') {
        return withCors(Response.json({ error: 'Email and OTP required' }, { status: 400 }));
      }
      await sendOTPEmail(env, email, otp);
      return withCors(Response.json({ success: true }));
    } catch (error: any) {
      return withCors(Response.json({ error: error.message || 'Failed to send OTP' }, { status: 500 }));
    }
  }

  const sheetsRoute = path.match(/^\/api\/sheets\/([^/]+)\/(.+)$/);
  if (sheetsRoute && method === "GET") {
    const auth = request.headers.get("authorization");
    if (!auth) return withCors(Response.json({ error: "Unauthorized" }, { status: 401 }));
    const spreadsheetId = decodeURIComponent(sheetsRoute[1]);
    const range = sheetsRoute[2];
    const r = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}`, {
      headers: { Authorization: auth },
    });
    return withCors(Response.json(await r.json()));
  }

  const metaMatch = path.match(/^\/api\/sheets-meta\/([^/]+)$/);
  if (metaMatch && method === "GET") {
    const auth = request.headers.get("authorization");
    if (!auth) return withCors(Response.json({ error: "Unauthorized" }, { status: 401 }));
    const spreadsheetId = decodeURIComponent(metaMatch[1]);
    const r = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?fields=sheets.properties`, {
      headers: { Authorization: auth },
    });
    return withCors(Response.json(await r.json()));
  }

  return withCors(new Response("Not Found", { status: 404 }));
}

// ---------------------------------------------------------------------------
// Superadmin API endpoints
// ---------------------------------------------------------------------------

// POST /api/superadmin/notifications/send
if (path === '/api/superadmin/notifications/send' && method === 'POST') {
  const auth = request.headers.get('authorization');
  if (!auth) return withCors(Response.json({ error: 'Unauthorized' }, { status: 401 }));

  try {
    const token = auth.replace('Bearer ', '');
    const sessionRes = await fetch(`${url.origin}/api/verify-session`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const session = await sessionRes.json();
    if (session.role !== 'superadmin') {
      return withCors(Response.json({ error: 'Forbidden' }, { status: 403 }));
    }

    const { message, recipients } = await request.json();
    if (!message || typeof message !== 'string') {
      return withCors(Response.json({ error: 'Message is required' }, { status: 400 }));
    }

    const appName = env.APP_NAME || 'DORPTS';
    const apiKey = env.RESEND_API_KEY || process.env.RESEND_API_KEY;
    if (!apiKey) {
      return withCors(Response.json({ error: 'Email service not configured' }, { status: 500 }));
    }

    const resendClient = new Resend(apiKey);
    const targetEmails = recipients && Array.isArray(recipients) && recipients.length > 0
      ? recipients
      : (session.adminEmails || []);

    const sendPromises = targetEmails.map((email: string) =>
      resendClient.emails.send({
        from: `${appName} <noreply@dorpts.app>`,
        to: email,
        subject: `${appName} - Announcement from Superadmin`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: #0099DA; color: white; padding: 16px 24px; border-radius: 12px 12px 0 0; font-size: 18px; font-weight: bold;">
              ${appName}
            </div>
            <div style="background: #f8fafc; padding: 24px; border-radius: 0 0 12px 12px; border: 1px solid #e2e8f0; border-top: none;">
              <p style="color: #334155; font-size: 14px; line-height: 1.6;">${message.replace(/\n/g, '<br>')}</p>
              <p style="color: #64748b; font-size: 12px; margin-top: 16px;">Sent by: ${session.email}</p>
            </div>
          </div>
        `,
      })
    );

    await Promise.all(sendPromises);

    return withCors(Response.json({ success: true, sentTo: targetEmails.length }));
  } catch (error: any) {
    return withCors(Response.json({ error: error.message || 'Failed to send notifications' }, { status: 500 }));
  }
}
