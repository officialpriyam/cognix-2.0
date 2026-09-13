/** @module connectivity */
import { toast } from "sonner";

// ---------------------------------------------------------------------------
// Classifications
// ---------------------------------------------------------------------------

export type BackendHealth =
  | { kind: "ok" }
  | { kind: "unreachable"; message: string }
  | { kind: "timeout"; message: string }
  | { kind: "serverError"; status: number; message: string }
  | { kind: "notFound"; message: string };

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function isNetworkError(err: unknown): boolean {
  return (
    err instanceof TypeError ||
    err instanceof DOMException ||
    (typeof err === "object" && err !== null && "type" in err &&
      (err as Record<string, unknown>).type === "error" &&
      /failed|abort|network/i.test(String((err as Record<string, unknown>).message || "").toLowerCase()))
  );
}

function isAbort(err: unknown): boolean {
  return err instanceof DOMException && err.name === "AbortError";
}

export function classifyBackendResponse(
  res: Response,
  bodyText: string
): BackendHealth {
  // 404 on the auth endpoint usually means the route isn't mounted / baseURL wrong
  if (res.status === 404) {
    return {
      kind: "notFound",
      message:
        "The authentication service couldn't be found. This usually means the backend URL is misconfigured.",
    };
  }

  if (res.status >= 500) {
    let message = "The backend server encountered an error.";
    try {
      const json = JSON.parse(bodyText);
      if (json.message) message = String(json.message);
    } catch {
      /* use default */
    }
    return { kind: "serverError", status: res.status, message };
  }

  // Any other non-2xx is treated as a backend problem, not an auth problem
  let message = `Backend responded with ${res.status}.`;
  try {
    const json = JSON.parse(bodyText);
    if (json.message) message = String(json.message);
  } catch {
    /* use default */
  }
  return { kind: "serverError", status: res.status, message };
}

export function classifyBackendError(err: unknown): BackendHealth {
  if (isAbort(err)) {
    return {
      kind: "timeout",
      message: "The backend is not responding. Please try again in a moment.",
    };
  }

  if (isNetworkError(err)) {
    return {
      kind: "unreachable",
      message:
        "We couldn't connect to the backend. This usually means the service is temporarily down — please try again shortly.",
    };
  }

  // Fallback: unknown error
  const message =
    err instanceof Error ? err.message : "An unexpected error occurred.";
  return { kind: "unreachable", message };
}

// ---------------------------------------------------------------------------
// Logging helper
// ---------------------------------------------------------------------------

export function logBackendProblem(health: BackendHealth): void {
  switch (health.kind) {
    case "ok":
      return;
    case "unreachable":
    case "timeout": {
      console.warn("Backend unreachable or timed out:", health.message);
      toast.error(health.message);
      break;
    }
    case "notFound": {
      console.warn("Backend endpoint not found:", health.message);
      toast.error(health.message);
      break;
    }
    case "serverError": {
      console.error(`Backend error ${health.status}:`, health.message);
      toast.error(health.message);
      break;
    }
  }
}
