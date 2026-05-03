"use client";

import { useRef, useState, useTransition } from "react";

export interface ConfirmingFormProps {
  /** Server Action passed to <form action>. */
  action: (formData: FormData) => void | Promise<void>;
  /** Modal heading (e.g. "Salvar alterações?"). */
  confirmTitle: string;
  /** Optional secondary line in the modal. */
  confirmDescription?: string;
  /** Submit button label (defaults to "Salvar"). */
  submitLabel?: string;
  /** Confirm button label inside the modal (defaults to "Confirmar"). */
  confirmLabel?: string;
  className?: string;
  children: React.ReactNode;
}

export function ConfirmingForm({
  action,
  confirmTitle,
  confirmDescription,
  submitLabel = "Salvar",
  confirmLabel = "Confirmar",
  className,
  children,
}: ConfirmingFormProps) {
  const formRef = useRef<HTMLFormElement | null>(null);
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  function onSubmitClick(e: React.MouseEvent<HTMLButtonElement>) {
    e.preventDefault();
    if (formRef.current && !formRef.current.checkValidity()) {
      formRef.current.reportValidity();
      return;
    }
    setOpen(true);
  }

  function confirmAndSubmit() {
    if (!formRef.current) return;
    const formData = new FormData(formRef.current);
    startTransition(async () => {
      try {
        await action(formData);
      } finally {
        setOpen(false);
      }
    });
  }

  return (
    <>
      <form ref={formRef} className={className} onSubmit={(e) => e.preventDefault()}>
        {children}
        <button
          type="submit"
          onClick={onSubmitClick}
          className="rounded border px-4 py-2 text-sm uppercase tracking-wider"
        >
          {submitLabel}
        </button>
      </form>
      {open ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirming-form-heading"
          onClick={() => !pending && setOpen(false)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: "rgba(0,0,0,0.45)" }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="max-w-sm w-full rounded p-6 space-y-4"
            style={{ backgroundColor: "var(--color-card)", color: "var(--color-card-foreground)" }}
          >
            <h2 id="confirming-form-heading" className="text-lg font-medium">
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
                onClick={confirmAndSubmit}
                disabled={pending}
                className="rounded border px-3 py-1 text-sm"
                style={{
                  borderColor: "var(--color-primary)",
                  color: "var(--color-primary)",
                }}
              >
                {pending ? "Salvando..." : confirmLabel}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
