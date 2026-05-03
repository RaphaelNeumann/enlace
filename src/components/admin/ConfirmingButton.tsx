"use client";

import { useState, useTransition } from "react";

export interface ConfirmingButtonProps {
  /** Server Action invoked after the user confirms. */
  action: () => Promise<void> | void;
  /** Modal heading (e.g. "Apagar item?"). */
  confirmTitle: string;
  /** Optional secondary line in the modal. */
  confirmDescription?: string;
  /** Visible button label (e.g. "Apagar"). */
  buttonLabel: string;
  /** Modal confirm-button label (defaults to "Confirmar"). */
  confirmLabel?: string;
  /** Visual treatment of the trigger button. */
  variant?: "default" | "danger";
  className?: string;
}

export function ConfirmingButton({
  action,
  confirmTitle,
  confirmDescription,
  buttonLabel,
  confirmLabel = "Confirmar",
  variant = "default",
  className,
}: ConfirmingButtonProps) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  function onConfirm() {
    startTransition(async () => {
      try {
        await action();
      } finally {
        setOpen(false);
      }
    });
  }

  const triggerStyle =
    variant === "danger"
      ? { color: "var(--color-accent)", borderColor: "var(--color-accent)" }
      : undefined;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={
          className ?? "rounded border px-3 py-1 text-sm" + (variant === "danger" ? " opacity-90" : "")
        }
        style={triggerStyle}
      >
        {buttonLabel}
      </button>
      {open ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirming-button-heading"
          onClick={() => !pending && setOpen(false)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: "rgba(0,0,0,0.45)" }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="max-w-sm w-full rounded p-6 space-y-4"
            style={{ backgroundColor: "var(--color-card)", color: "var(--color-card-foreground)" }}
          >
            <h2 id="confirming-button-heading" className="text-lg font-medium">
              {confirmTitle}
            </h2>
            {confirmDescription ? (
              <p className="text-sm opacity-80">{confirmDescription}</p>
            ) : null}
            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => setOpen(false)}
                disabled={pending}
                className="rounded border px-3 py-1 text-sm"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={onConfirm}
                disabled={pending}
                className="rounded border px-3 py-1 text-sm"
                style={
                  variant === "danger"
                    ? { borderColor: "var(--color-accent)", color: "var(--color-accent)" }
                    : { borderColor: "var(--color-primary)", color: "var(--color-primary)" }
                }
              >
                {pending ? "..." : confirmLabel}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
