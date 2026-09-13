"use client";

import { useBackendConnectivity } from "@/hooks/useBackendConnectivity";

export function BackendConnectivityInit() {
  useBackendConnectivity();
  return null;
}
