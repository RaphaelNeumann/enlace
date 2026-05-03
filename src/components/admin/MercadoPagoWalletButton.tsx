"use client";

import { useEffect, useId, useRef, useState } from "react";

type WalletInstance = { unmount: () => void };
type BricksBuilder = {
  create: (
    name: "wallet",
    containerId: string,
    settings: {
      initialization: { preferenceId: string; redirectMode?: "self" | "blank" | "modal" };
      customization?: Record<string, unknown>;
      callbacks?: {
        onReady?: () => void;
        onSubmit?: () => void;
        onError?: (err: unknown) => void;
      };
    },
  ) => Promise<WalletInstance>;
};
type MercadoPagoCtor = new (
  publicKey: string,
  options?: { locale?: string },
) => { bricks: () => BricksBuilder };

declare global {
  interface Window {
    MercadoPago?: MercadoPagoCtor;
  }
}

const SDK_URL = "https://sdk.mercadopago.com/js/v2";
let sdkPromise: Promise<void> | null = null;

function loadSdk(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.MercadoPago) return Promise.resolve();
  if (sdkPromise) return sdkPromise;
  sdkPromise = new Promise<void>((resolve, reject) => {
    const existing = document.querySelector(
      `script[src="${SDK_URL}"]`,
    ) as HTMLScriptElement | null;
    if (existing) {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener(
        "error",
        () => reject(new Error("MP SDK load error")),
        { once: true },
      );
      return;
    }
    const script = document.createElement("script");
    script.src = SDK_URL;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("MP SDK load error"));
    document.head.appendChild(script);
  });
  return sdkPromise;
}

export interface MercadoPagoWalletButtonProps {
  publicKey: string;
  preferenceId: string;
  /** Re-mount the brick when this value changes (e.g. amount edited). */
  resetKey?: string | number;
  onError?: (message: string) => void;
}

export function MercadoPagoWalletButton({
  publicKey,
  preferenceId,
  resetKey,
  onError,
}: MercadoPagoWalletButtonProps) {
  const containerId = useId().replace(/[:]/g, "_");
  const walletRef = useRef<WalletInstance | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setReady(false);
    (async () => {
      try {
        await loadSdk();
        if (cancelled) return;
        if (!window.MercadoPago) throw new Error("MP SDK não carregou");
        const mp = new window.MercadoPago(publicKey, { locale: "pt-BR" });
        const bricks = mp.bricks();
        walletRef.current?.unmount();
        const instance = await bricks.create("wallet", containerId, {
          initialization: { preferenceId, redirectMode: "blank" },
          customization: {
            theme: "default",
            customStyle: {
              hideValueProp: true,
              buttonHeight: "56px",
              borderRadius: "6px",
              verticalPadding: "16px",
              horizontalPadding: "32px",
            },
          },
          callbacks: {
            onReady: () => {
              if (!cancelled) setReady(true);
            },
            onError: (err) => {
              const m = err instanceof Error ? err.message : "Erro no Mercado Pago";
              onError?.(m);
            },
          },
        });
        walletRef.current = instance;
      } catch (err) {
        const m = err instanceof Error ? err.message : "Erro ao carregar Mercado Pago";
        onError?.(m);
      }
    })();
    return () => {
      cancelled = true;
      walletRef.current?.unmount();
      walletRef.current = null;
    };
  }, [publicKey, preferenceId, containerId, resetKey, onError]);

  return (
    <div className="space-y-2">
      <div className="w-full flex justify-center">
        <div id={containerId} />
      </div>
      {!ready ? (
        <p className="text-xs opacity-60">Carregando Mercado Pago...</p>
      ) : null}
    </div>
  );
}
