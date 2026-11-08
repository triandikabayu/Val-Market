"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

interface PasteUrlDialogProps {
  open: boolean;
  onSubmit: (url: string) => Promise<"ok" | "invalid">;
  onClose: () => void;
}

export function PasteUrlDialog({ open, onSubmit, onClose }: PasteUrlDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [url, setUrl] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      dialog.showModal();
      setUrl("");
      setError(null);
      dialog.querySelector("input")?.focus();
    }
    if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  if (!open) return null;

  const submit = async () => {
    if (submitting) return;
    setSubmitting(true);
    setError(null);
    const result = await onSubmit(url);
    setSubmitting(false);
    if (result === "ok") {
      dialogRef.current?.close();
    } else {
      setError(
        "That URL doesn't contain a token. Copy the FULL address right after the sign-in page redirects you.",
      );
    }
  };

  return (
    <dialog
      ref={dialogRef}
      className="two-fa fixed m-auto w-[min(92vw,480px)] border border-line bg-surface p-6 text-ink shadow-[0_8px_24px_rgba(15,25,35,0.6)] backdrop:bg-black/70"
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        if (e.target === dialogRef.current) onClose();
      }}
    >
      <h2 className="font-display text-2xl uppercase tracking-wide">
        Paste sign-in URL
      </h2>
      <p className="mt-2 text-sm leading-relaxed text-ink-muted">
        After signing in, your browser lands on a
        playvalorant.com&nbsp;page. Copy its full address from the address
        bar and paste it here.
      </p>
      <form
        className="mt-5"
        onSubmit={(e) => {
          e.preventDefault();
          void submit();
        }}
      >
        <Input
          id="redirect-url"
          label="Redirect URL"
          placeholder="https://playvalorant.com/opt_in#access_token=..."
          autoFocus
          spellCheck={false}
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          error={error ?? undefined}
          className="[&_input]:font-mono [&_input]:text-xs"
        />
        <div className="mt-6 flex gap-3">
          <Button type="submit" loading={submitting} className="flex-1">
            Complete sign-in
          </Button>
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </form>
    </dialog>
  );
}
