import { onRequest } from "firebase-functions/v1/https";
import { createApiApp } from "./api";

// Firebase Cloud Function (v1, compatible with the free Spark plan in us-central1).
const app = createApiApp();

export const api = onRequest((req, res) => {
  app(req, res);
});
