"use client";

import { useEffect, useRef, useState } from "react";
import { classifyBackendError, classifyBackendResponse, type BackendHealth } from "@/lib/connectivity";

const PING_INTERVAL_MS = 30_000;
const PING_TIMEOUT_MS = 8_000;

function pingBackendAuthEndpoint(): Promise<BackendHealth> {
  const baseUrl =
    typeof window !== "undefined"
      ? window.__NEXT_DATA__?.props?.pageProps?.apiBaseUrl ?? process.env.NEXT_PUBLIC_API_URL ?? ""
      : "";
  const candidateUrls = [
    baseUrl,
    process.env.BETTER_AUTH_URL ?? "",
  ].filter(Boolean);

  return new Promise((resolve) => {
    const controller = new AbortController();
    const timer = setTimeout(() => {
      controller.abort();
    }, PING_TIMEOUT_MS);

    const attempts = candidateUrls.length
      ? candidateUrls.map((candidate) => `${candidate.replace(/\/+$/, "")}/api/auth/sign-in/email`)
      : [window.location.origin + "/api/auth/sign-in/email"];

    let settled = false;
    for (const url of attempts) {
      fetch(url, {
        method: "OPTIONS",
        headers: { Accept: "application/json" },
        signal: controller.signal,
        credentials: "include",
      })
        .then((res) => {
          if (settled) return;
          settled = true;
          clearTimeout(timer);
          if (res.status === 401 || res.status === 403) {
            resolve({ kind: "ok" });
            return;
          }
          resolve(classifyBackendResponse(res, ""));
        })
        .catch((err: unknown) => {
          if (settled) return;
          if (err instanceof DOMException && err.name === "AbortError") {
            return; // try next candidate if any
          }
          settled = true;
          clearTimeout(timer);
          resolve(classifyBackendError(err));
        });
    }
  });
}

interface UseBackendConnectivityReturn {
  backendHealth: BackendHealth;
  backendHealthy: boolean;
  backendMessage: string;
  /** Exposed for debugging / manual ping */
  ping: () => Promise<void>;
}

export function useBackendConnectivity(): UseBackendConnectivityReturn {
  const [backendHealth, setBackendHealth] = useState<BackendHealth>({ kind: "ok" });
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;

    let cancelled = false;

    const tick = async () => {
      try {
        const health = await pingBackendAuthEndpoint();
        if (!cancelled && mountedRef.current) {
          setBackendHealth(health);
        }
      } catch (err) {
        if (!cancelled && mountedRef.current) {
          const health = classifyBackendError(err);
          setBackendHealth(health);
        }
      }
    };

    tick();
    const interval = setInterval(tick, PING_INTERVAL_MS);

    return () => {
      cancelled = true;
      mountedRef.current = false;
      clearInterval(interval);
    };
  }, []);

  const ping = async () => {
    try {
      const health = await pingBackendAuthEndpoint();
      setBackendHealth(health);
    } catch (err) {
      setBackendHealth(classifyBackendError(err));
    }
  };

  const backendHealthy =
    backendHealth.kind === "ok";

  const backendMessage =
    backendHealth.kind === "ok" ? "" : backendHealth.message;

  return { backendHealth, backendHealthy, backendMessage, ping };
}
