import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createApiApp } from "./firebase-functions/src/api";

dotenv.config();

async function startServer() {
  const app = createApiApp();
  const PORT = 3000;

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*all", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

// Only start listening when run directly (not when imported by the Firebase Function)
if (!process.env.K_SERVICE && !process.env.FUNCTION_TARGET) {
  startServer();
}
