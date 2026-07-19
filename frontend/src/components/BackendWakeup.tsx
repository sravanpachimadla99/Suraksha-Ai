"use client";

import { useEffect } from "react";
import { BACKEND_URL } from "../lib/api";

/**
 * BackendWakeup - Silently pings the Render backend on page load
 * to warm it up before users try to use features.
 * Render free tier sleeps after 15 min of inactivity.
 */
export default function BackendWakeup() {
  useEffect(() => {
    const warmup = async () => {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 60000);
        await fetch(`${BACKEND_URL}/health`, {
          signal: controller.signal,
          cache: "no-store",
        });
        clearTimeout(timeout);
        console.log("[SurakshaAI] Backend is awake.");
      } catch {
        // Silent fail — user will get error at feature level if backend is unreachable
      }
    };
    warmup();
  }, []);

  return null;
}
