"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { PasteUrlDialog } from "@/components/auth/PasteUrlDialog";
import { PrivacyNote } from "@/components/auth/PrivacyNote";
import { Wordmark } from "@/components/Wordmark";
import { Button } from "@/components/ui/Button";
import { DisclaimerFooter } from "@/components/ui/DisclaimerFooter";
import {
  completeSignInFromUrl,
  signInWithRiot,
} from "@/lib/riot/auth";
import { useSession } from "@/lib/session";

const ERROR_MESSAGES: Record<string, string> = {
  bad_credentials: "Sign-in was rejected. Try again.",
  rate_limited: "Too many attempts. Wait a few minutes and try again.",
  network: "Can't reach Riot's servers. Check your connection.",
  unknown: "Sign-in failed unexpectedly. Try again in a minute.",
};

// the Riot-window path needs the native multi-webview API — desktop only
const IS_MOBILE = /Android|iPhone|iPad/i.test(
  typeof navigator === "undefined" ? "" : navigator.userAgent,
);

export default function LoginPage() {
  const router = useRouter();
  const { setSession } = useSession();

  const [submitting, setSubmitting] = useState<"window" | "browser" | null>(
    null,
  );
  const [error, setError] = useState<{ code: string; detail?: string } | null>(
    null,
  );
  const [pasteOpen, setPasteOpen] = useState(false);

  const afterOutcome = (
    outcome: Awaited<ReturnType<typeof signInWithRiot>>,
  ): void => {
    if (outcome.status === "ok") {
      setSession(outcome.session);
      router.replace("/store");
      return;
    }
    if (outcome.status === "mfa") {
      return;
    }
    setError({ code: outcome.code, detail: outcome.detail });
  };

  const onWindowSignIn = async () => {
    if (submitting) return;
    setSubmitting("window");
    setError(null);
    afterOutcome(await signInWithRiot());
    setSubmitting(null);
  };

  const onMobileSignIn = async () => {
    if (submitting) return;
    setSubmitting("browser");
    const { authorizeUrl } = await import("@/lib/riot/auth");
    const { openUrl } = await import("@tauri-apps/plugin-opener");
    await openUrl(authorizeUrl());
    setSubmitting(null);
    setPasteOpen(true);
  };

  const onPasteSubmit = async (url: string): Promise<"ok" | "invalid"> => {
    const outcome = await completeSignInFromUrl(url);
    if (outcome.status === "ok") {
      setSession(outcome.session);
      router.replace("/store");
      return "ok";
    }
    return "invalid";
  };

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="px-4 py-5">
        <Wordmark />
      </header>

      <main className="flex flex-1 items-start justify-center px-4 sm:items-center">
        <div className="w-full max-w-[400px]">
          <h1 className="font-display text-4xl uppercase leading-[1.05] tracking-wide text-ink">
            Sign in
          </h1>
          <p className="mt-2 text-base text-ink-muted">
            Check today&apos;s Valorant store without launching the game.
          </p>

          {error && (
            <p role="alert" className="mt-6 text-sm text-danger">
              {ERROR_MESSAGES[error.code] ?? ERROR_MESSAGES.unknown}
              {error.detail ? ` (Riot: ${error.detail})` : ""}
            </p>
          )}

          <Button
            onClick={IS_MOBILE ? onMobileSignIn : onWindowSignIn}
            loading={submitting !== null}
            className="mt-6 w-full"
          >
            {submitting === "window"
              ? "Waiting for Riot"
              : submitting === "browser"
                ? "Opening Riot sign-in"
                : "Sign in with Riot"}
          </Button>

          {!IS_MOBILE && (
            <p className="mt-3 text-xs leading-relaxed text-ink-muted">
              Opens Riot&apos;s official sign-in page — Google, Facebook,
              Apple, Xbox, and PlayStation accounts all work there.
            </p>
          )}

          <div className="mt-6">
            <PrivacyNote />
          </div>
        </div>
      </main>

      <div className="mt-10">
        <DisclaimerFooter />
      </div>

      {IS_MOBILE && (
        <PasteUrlDialog
          open={pasteOpen}
          onSubmit={onPasteSubmit}
          onClose={() => setPasteOpen(false)}
        />
      )}
    </div>
  );
}
