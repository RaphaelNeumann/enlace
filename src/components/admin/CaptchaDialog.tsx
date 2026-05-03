"use client";

import { TurnstileWidget } from "./TurnstileWidget";

export interface CaptchaDialogProps {
  siteKey: string;
  onCancel: () => void;
  /** Fired once the captcha returns a non-null token. */
  onToken: (token: string) => void;
}

/**
 * Modal that defers loading Cloudflare Turnstile until the moment the
 * guest actually tries to submit a form. The widget mounts when this
 * dialog mounts (so the SDK script is fetched lazily), the parent
 * receives the token via `onToken` and is expected to immediately fire
 * the actual submission.
 */
export function CaptchaDialog({ siteKey, onCancel, onToken }: CaptchaDialogProps) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Verificação anti-spam"
      // Stop propagation before cancelling — this dialog can be nested
      // inside another modal whose backdrop also closes on click; without
      // this, clicking the dark area here closes both.
      onClick={(e) => {
        e.stopPropagation();
        onCancel();
      }}
      className="fixed inset-0 z-[60] flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="max-w-sm w-full rounded p-6 space-y-3 text-center"
        style={{
          backgroundColor: "var(--color-card)",
          color: "var(--color-card-foreground)",
          fontFamily: "var(--font-caps)",
        }}
      >
        <h4 className="text-lg" style={{ color: "var(--color-primary)" }}>
          Verificação anti-spam
        </h4>
        <p className="text-sm opacity-80">
          Confirme rapidamente que você não é um robô para continuar.
        </p>
        <TurnstileWidget
          siteKey={siteKey}
          onToken={(t) => {
            if (t) onToken(t);
          }}
        />
        <button
          type="button"
          onClick={onCancel}
          className="rounded border px-3 py-1 text-sm"
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}
