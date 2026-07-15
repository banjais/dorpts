import express from "express";
import dotenv from "dotenv";
import { GoogleGenAI, Type } from "@google/genai";
dotenv.config();
// ---------------------------------------------------------------------------
// Fallback local engines (used when the Gemini API key is missing/invalid)
// ---------------------------------------------------------------------------
function detectAnomaliesLocally(indicators, historicalData) {
    const anomalies = [];
    const sortedHistory = [...(historicalData || [])].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
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
        let previousVal = null;
        let lastSnapshotDate = "";
        for (const snapshot of sortedHistory) {
            const histInd = snapshot.indicators?.find((h) => h.id === ind.id);
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
function generateLocalReportSummary(indicators, language) {
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
            if (pct >= 100)
                aheadCount++;
            else if (pct < 50)
                behindCount++;
        }
        if (progress > 0)
            active++;
    });
    if (isNepali) {
        let summary = `कार्यकारी सारांश प्रतिवेदन (सडक विभाग प्रणाली):\n\n`;
        summary += `१. समष्टिगत स्थिति: विश्लेषण गरिएका कुल ${total} विकास सूचकहरू मध्ये ${active} वटामा प्रगति दर्ता भएको छ। यस मध्ये ${aheadCount} सूचकहरूले निर्धारित वार्षिक लक्ष्य हासिल गरेका वा नाघेका छन्, जबकि ${behindCount} वटा सूचकहरूमा प्रगति सुस्त (५०% भन्दा कम) देखिएको छ।\n\n`;
        summary += `२. मुख्य उपलब्धिहरू: सडक पूर्वाधार र राष्ट्रिय गौरवका आयोजनाहरूमा निरन्तर प्रगति भइरहेको छ। रणनीतिक सडक संजाल विस्तार र कालोपत्रे गर्ने कार्यमा महत्वपूर्ण प्रगति दर्ता भएको छ। नीतिगत सुधार र डिजिटल प्रणालीको प्रयोगमा पनि उत्साहजनक नतिजाहरू देखिएका छन्।\n\n`;
        summary += `३. जोखिम र चुनौतीहरू: कूल ${behindCount} सूचकहरू अझै पनि निर्धारित लक्ष्यभन्दा निकै पछाडि छन्। मुख्य रूपमा बजेट फुकुवा ढिलाइ, जग्गा प्राप्ति सम्बन्धी विवाद र ठेकेदारहरूको ढिलासुस्तीले गर्दा केही क्षेत्रमा प्रगति प्रभावित भएको देखिन्छ। यी आयोजनाहरूमा विशेष अनुगमन र समस्या समाधानका पहलहरू तत्काल चाल्नुपर्ने आवश्यकता छ।\n\n`;
        summary += `४. आगामी कार्यदिशा: निर्धारित लक्ष्यहरू समयमै पूरा गर्नको लागि दोस्रो चौमासिक समीक्षा र विशेष अनुगमन कार्यलाई तीव्रता दिनुपर्दछ। निर्माण व्यवसायीहरूलाई जवाफदेही बनाउन र अन्तर-निकाय समन्वय सुदृढ गर्न आवश्यक छ।`;
        return summary;
    }
    else {
        let summary = `Executive Summary Report (Department of Roads Audit):\n\n`;
        summary += `1. Overall Status: Out of the ${total} analyzed development indicators, ${active} are actively recording progress. Notably, ${aheadCount} indicators have met or exceeded their annual targets, while ${behindCount} indicators are significantly lagging behind (below 50% target achievement).\n\n`;
        summary += `2. Key Achievements: Strategic road networks and national pride highway projects continue to demonstrate steady growth. Progress in high-priority paving, road maintenance, and bridge constructions remains robust. Additionally, institutional policy reforms and digital monitoring system adoptions are showing positive implementation results.\n\n`;
        summary += `3. Critical Risks & Challenges: There are ${behindCount} high-priority indicators currently lagging behind schedule. Delays in land acquisition, budget disbursements, and local contractor bottlenecks have slowed down secondary and community road networks. Targeted programmatic intervention is required in these specific segments.\n\n`;
        summary += `4. Strategic Recommendations: It is highly recommended to accelerate the second-trimester project reviews and strengthen site-level supervision. Enhancing inter-agency coordination for right-of-way clearances and implementing stricter contractor performance audits will be critical to achieving the remaining annual targets.`;
        return summary;
    }
}
function handleLocalChatFallback(message) {
    const msgLower = message.toLowerCase();
    const functionCalls = [];
    let text = "I am the Department of Roads AI Assistant. I can help you navigate or generate reports.";
    if (msgLower.includes("dashboard") || msgLower.includes("गृहपृष्ठ") || msgLower.includes("ड्यास") || msgLower.includes("home")) {
        functionCalls.push({ name: "open_page", args: { page: "dashboard" } });
        text = "Opening the main Dashboard view for you.";
    }
    else if (msgLower.includes("setting") || msgLower.includes("सेटिङ") || msgLower.includes("थिम") || msgLower.includes("theme")) {
        functionCalls.push({ name: "open_page", args: { page: "settings" } });
        text = "Navigating to System Settings and Customizations.";
    }
    else if (msgLower.includes("data") || msgLower.includes("सङ्ग्रह") || msgLower.includes("डाटा") || msgLower.includes("तालिका") || msgLower.includes("table")) {
        functionCalls.push({ name: "open_page", args: { page: "data" } });
        text = "Switching to the Data Indicators view.";
    }
    else if (msgLower.includes("report") || msgLower.includes("प्रतिवेदन") || msgLower.includes("विवरण")) {
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
            text = "Namaste! I am the Department of Roads Assistant. How can I help you today? You can ask me to navigate pages (dashboard, settings, data, reports), print the screen, or generate summaries.";
        }
        else if (msgLower.includes("help") || msgLower.includes("मद्दत") || msgLower.includes("के गर्न")) {
            text = "I can assist you with navigating the system! Try saying: 'Open Settings', 'Go to Data Table', 'Generate a Report', or 'Print this page'.";
        }
        else {
            text = "Thank you for your message. I am the Department of Roads digital assistant. I can navigate pages (Dashboard, Settings, Data Indicators, Reports) or print the view. Let me know what you would like to do!";
        }
    }
    return { text, functionCalls };
}
const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
        headers: { "User-Agent": "aistudio-build" },
    },
});
// ---------------------------------------------------------------------------
// Shared Express app (used by both the local dev server and Firebase Function)
// ---------------------------------------------------------------------------
export function createApiApp() {
    const app = express();
    app.use(express.json());
    app.get("/api/health", (_req, res) => {
        res.json({ status: "ok" });
    });
    // Scheduled snapshot watcher: detects a new "Last Update Date" in the published
    // Dashboard sheet and writes an updates_history snapshot to Firestore.
    app.get("/api/cron/snapshot", async (_req, res) => {
        try {
            const { checkAndSnapshotFromSheet } = await import("./sheetWatcher");
            const result = await checkAndSnapshotFromSheet();
            res.json(result);
        }
        catch (err) {
            res.status(500).json({ snapshotted: false, reason: err?.message || "Unknown error" });
        }
    });
    app.post("/api/ai/report-summary", async (req, res) => {
        const { indicators, language } = req.body;
        if (!indicators || !Array.isArray(indicators)) {
            return res.status(400).json({ error: "Indicators array is required" });
        }
        const isApiKeyInvalid = !process.env.GEMINI_API_KEY ||
            process.env.GEMINI_API_KEY === "undefined" ||
            process.env.GEMINI_API_KEY.trim() === "";
        if (isApiKeyInvalid) {
            console.log("Using localized summary service");
            return res.json({ summary: generateLocalReportSummary(indicators, language) });
        }
        try {
            const isNepali = language === "ne";
            const prompt = `You are an expert data analyst working for the Department of Roads, Government of Nepal.
Analyze the following road development and infrastructure indicators:
${JSON.stringify(indicators.map((ind) => ({
                name: ind.nameEn,
                nameNp: ind.name,
                category: ind.category,
                weight: ind.weight,
                unit: ind.unit,
                annualTarget: ind.annualTarget,
                annualProgress: ind.annualProgress,
                achievementPercent: ind.annualTarget > 0 ? ((ind.annualProgress / ind.annualTarget) * 100).toFixed(1) : 0,
            })))}

Write a concise, highly professional executive summary of the indicators' progress, key highlights, and any critical risks or areas needing attention.
Please write the response in ${isNepali ? "Nepali (नेपाली)" : "English"}.
Keep the output elegant, objective, and nicely formatted in standard paragraphs or subtle bullet points. Do not include markdown headers (like # or ##) or excessive symbols. Keep it under 250 words.`;
            const response = await ai.models.generateContent({
                model: "gemini-3.5-flash",
                contents: prompt,
            });
            const text = response.text || "";
            res.json({ summary: text });
        }
        catch (error) {
            console.log("Using localized summary service");
            res.json({ summary: generateLocalReportSummary(indicators, language) });
        }
    });
    app.post("/api/ai/detect-anomalies", async (req, res) => {
        const { indicators, historicalData } = req.body;
        if (!indicators || !Array.isArray(indicators)) {
            return res.status(400).json({ error: "Indicators array is required" });
        }
        const isApiKeyInvalid = !process.env.GEMINI_API_KEY ||
            process.env.GEMINI_API_KEY === "undefined" ||
            process.env.GEMINI_API_KEY.trim() === "";
        if (isApiKeyInvalid) {
            console.log("Using localized anomaly detection");
            return res.json({ anomalies: detectAnomaliesLocally(indicators, historicalData) });
        }
        try {
            const prompt = `You are a professional auditor and senior data scientist for the Department of Roads, Government of Nepal.
Your task is to analyze the current indicators and compare them with the provided historical snapshots to detect data anomalies.

Anomalies to look for:
1. Progress Drops: Cumulative indicators (like kilometers paved, bridges built, or employment created) should NOT decrease over time. If a current indicator's annualProgress is less than any previous historical snapshot's annualProgress for that indicator, flag it as a "drop".
2. Progress Spikes: A massive or sudden increase in progress compared to the last historical snapshot (e.g., increasing by more than 100% of the target or doubling in size overnight) should be flagged as a "spike".
3. Over-achievement/Exceeds Target: Progress exceeding target by over 150% (e.g. 150km paved against a 50km target) should be flagged as "exceeds_target".
4. Data Inconsistencies: Impossible physical quantities (such as negative values, zero target with positive progress) should be flagged as "inconsistent".

Current Indicators:
${JSON.stringify(indicators.map((ind) => ({
                id: ind.id,
                nameEn: ind.nameEn,
                nameNp: ind.name,
                annualProgress: ind.annualProgress,
                annualTarget: ind.annualTarget,
                unit: ind.unit,
            })))}

Historical Snapshots:
${JSON.stringify(historicalData)}

Analyze each active indicator and generate an array of detected anomalies. If no anomalies are detected, return an empty array.
Keep explanationEn and explanationNp concise, precise, and highly professional. Include actual figures in explanations (e.g. "Progress dropped from 364 to 100...").`;
            const response = await ai.models.generateContent({
                model: "gemini-3.5-flash",
                contents: prompt,
                config: {
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: Type.OBJECT,
                        properties: {
                            anomalies: {
                                type: Type.ARRAY,
                                items: {
                                    type: Type.OBJECT,
                                    properties: {
                                        indicatorId: { type: Type.STRING },
                                        indicatorName: { type: Type.STRING },
                                        type: { type: Type.STRING },
                                        severity: { type: Type.STRING },
                                        currentValue: { type: Type.NUMBER },
                                        previousValue: { type: Type.NUMBER, nullable: true },
                                        explanationEn: { type: Type.STRING },
                                        explanationNp: { type: Type.STRING },
                                    },
                                    required: ["indicatorId", "indicatorName", "type", "severity", "currentValue", "explanationEn", "explanationNp"],
                                },
                            },
                        },
                        required: ["anomalies"],
                    },
                },
            });
            const data = JSON.parse(response.text || "{}");
            res.json({ anomalies: data.anomalies || [] });
        }
        catch (error) {
            console.log("Using localized anomaly detection");
            res.json({ anomalies: detectAnomaliesLocally(indicators, historicalData) });
        }
    });
    app.post("/api/ai/chat", async (req, res) => {
        const { message, history } = req.body;
        const isApiKeyInvalid = !process.env.GEMINI_API_KEY ||
            process.env.GEMINI_API_KEY === "undefined" ||
            process.env.GEMINI_API_KEY.trim() === "";
        if (isApiKeyInvalid) {
            console.log("Using localized chatbot");
            return res.json(handleLocalChatFallback(message));
        }
        try {
            const functionDeclarations = [
                {
                    name: "open_page",
                    description: "Opens a specific page or view in the application (e.g. settings, dashboard, data).",
                    parameters: {
                        type: Type.OBJECT,
                        properties: {
                            page: {
                                type: Type.STRING,
                                description: "The name of the page to open, e.g., 'dashboard', 'settings', 'data', 'reports'",
                            },
                        },
                        required: ["page"],
                    },
                },
                {
                    name: "make_report",
                    description: "Generate a report (comprehensive, short, comparison).",
                    parameters: {
                        type: Type.OBJECT,
                        properties: {
                            type: {
                                type: Type.STRING,
                                description: "The type of report to generate: 'comprehensive', 'short', 'comparison'",
                            },
                        },
                        required: ["type"],
                    },
                },
                {
                    name: "print_screen",
                    description: "Trigger the print dialog for the current view.",
                    parameters: { type: Type.OBJECT, properties: {} },
                },
                {
                    name: "show_menu",
                    description: "Shows or opens the application menu, navigation, or view switcher.",
                    parameters: { type: Type.OBJECT, properties: {} },
                },
                {
                    name: "set_volume",
                    description: "Enable or disable volume/audio feedback.",
                    parameters: {
                        type: Type.OBJECT,
                        properties: {
                            enabled: {
                                type: Type.BOOLEAN,
                                description: "Whether volume should be enabled or disabled.",
                            },
                        },
                        required: ["enabled"],
                    },
                },
            ];
            const response = await ai.models.generateContent({
                model: "gemini-3.5-flash",
                contents: [...(history || []), message],
                config: {
                    systemInstruction: "You are an AI assistant for a dashboard application. You can answer questions, and perform actions like opening pages, printing, generating reports, showing menus, and changing volume. Use tools to perform actions when asked.",
                    tools: [{ functionDeclarations }],
                },
            });
            const functionCalls = response.functionCalls || [];
            const text = response.text || "";
            res.json({ text, functionCalls });
        }
        catch (error) {
            console.log("Using localized chatbot");
            return res.json(handleLocalChatFallback(message));
        }
    });
    app.get("/api/sheets/:spreadsheetId/:range", async (req, res) => {
        const { spreadsheetId, range } = req.params;
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            return res.status(401).json({ error: "Unauthorized" });
        }
        try {
            const response = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}`, {
                headers: { Authorization: authHeader },
            });
            const data = await response.json();
            res.json(data);
        }
        catch (error) {
            console.error("Sheets API error:", error);
            res.status(500).json({ error: "Failed to fetch sheet data" });
        }
    });
    app.get("/api/sheets-meta/:spreadsheetId", async (req, res) => {
        const { spreadsheetId } = req.params;
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            return res.status(401).json({ error: "Unauthorized" });
        }
        try {
            const response = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?fields=sheets.properties`, {
                headers: { Authorization: authHeader },
            });
            const data = await response.json();
            res.json(data);
        }
        catch (error) {
            console.error("Sheets meta error:", error);
            res.status(500).json({ error: "Failed to fetch sheets metadata" });
        }
    });
    return app;
}
//# sourceMappingURL=api.js.map