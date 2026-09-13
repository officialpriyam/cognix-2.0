"use client";

import { useEffect } from "react";import { useTranslations } from "next-intl";
import Link from "next/link";
import { Button } from "ui/button";
import { appStore } from "@/app/store";
export function BackendStatusBanner() {
  const t = useTranslations("Info");
  const backendHealth = appStore((s) => s.backendHealth);

  useEffect(() => {
    if (backendHealth.kind !== "ok") {
      window.scrollTo({ top: 0, behavior: "instant" });
    }
  }, [backendHealth.kind]);

  if (backendHealth.kind === "ok") {
    return null;
  }

  const message =
    backendHealth.kind === "timeout"
      ? t("backendTimeoutMessage")
      : backendHealth.kind === "unreachable"
        ? t("backendUnreachableMessage")
        : backendHealth.kind === "notFound"
          ? t("backendNotFoundMessage")
          : t("backendError");
  const title =
    backendHealth.kind === "timeout" ? t("backendTimeoutTitle") :
    backendHealth.kind === "unreachable" ? t("backendUnreachableTitle") :
    backendHealth.kind === "notFound" ? t("backendNotFoundTitle") :
    t("backendErrorTitle");

  return (
    <div
      role="alert"
      aria-live="assertive"
      className="fixed top-0 z-50 w-full border-b bg-destructive/90 text-destructive text-sm shadow-lg"
    >
      <div className="mx-auto flex max-w-4xl flex-wrap items-center gap-3 px-4 py-2">
        <div className="flex items-center gap-2">
          <svg
            aria-hidden="true"
            className="size-5 shrink-0"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
            />
          </svg>
          <span className="font-medium">{title}</span>
        </div>
        <p className="flex-1 text-muted-foreground text-sm">{message}</p>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            asChild
            className="border-destructive/40 text-destructive hover:bg-destructive/10"
          >
            <Link href="/sign-in">Sign in</Link>
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              appStore.setState({ backendHealth: { kind: "ok" } });
            }}
          >
            Dismiss
          </Button>
        </div>
      </div>
    </div>
  );
}
