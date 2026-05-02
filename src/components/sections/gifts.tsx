"use client";

import { useState, useTransition } from "react";
import type { Gift } from "@/lib/gifts/db";
import type { Locale } from "@/lib/hero/format-date";
import { publicUrl } from "@/lib/storage/supabase";

export interface GiftsSectionProps {
  gifts: Gift[];
  locale?: Locale;
  pixBrCodeMap: Record<string, { brCode: string; svg: string } | null>;
  pixKey: string | null;
  pixRecipient: string | null;
  hasMercadoPago: boolean;
  supabaseProjectUrl?: string;
  createMpCheckoutAction: (giftId: string) => Promise<{ ok: true; url: string } | { ok: false; error: string }>;
  submitMessageAction: (
    giftId: string | null,
    senderName: string,
    message: string,
  ) => Promise<{ ok: true } | { ok: false; error: string }>;
}

function pickText(pt: string, en: string | null, locale: Locale): string {
  return locale === "en" && en ? en : pt;
}

function formatBrl(cents: number | null): string {
  if (cents == null) return "";
  return (cents / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export function GiftsSection(props: GiftsSectionProps) {
  const { gifts, locale = "pt", pixBrCodeMap, pixKey, hasMercadoPago, supabaseProjectUrl, createMpCheckoutAction, submitMessageAction } = props;
  const visible = gifts.filter((g) => g.isVisible);
  const [openId, setOpenId] = useState<string | null>(null);
  if (visible.length === 0) return null;
  const open = visible.find((g) => g.id === openId) ?? null;
  return (
    <section className="py-20 px-6" aria-labelledby="gifts-heading">
      <h2
        id="gifts-heading"
        className="text-4xl text-center mb-10"
        style={{ fontFamily: "var(--font-display)", color: "var(--color-primary)" }}
      >
        {locale === "pt" ? "Lista de presentes" : "Gift catalog"}
      </h2>
      <div className="mx-auto max-w-4xl grid grid-cols-2 md:grid-cols-3 gap-4">
        {visible.map((g) => {
          const photo = g.photoStoragePath && supabaseProjectUrl
            ? publicUrl({ projectUrl: supabaseProjectUrl, bucket: "gifts", path: g.photoStoragePath })
            : null;
          return (
            <button
              key={g.id}
              type="button"
              onClick={() => setOpenId(g.id)}
              className="rounded p-3 border text-center"
              style={{
                borderColor: "color-mix(in srgb, var(--color-primary) 30%, transparent)",
                backgroundColor: "var(--color-card)",
                color: "var(--color-card-foreground)",
              }}
            >
              {photo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={photo} alt={pickText(g.titlePt, g.titleEn, locale)} className="w-full aspect-square object-cover rounded mb-2" />
              ) : (
                <div className="w-full aspect-square rounded mb-2" style={{ backgroundColor: "var(--color-muted)" }} />
              )}
              <p className="text-sm font-medium">{pickText(g.titlePt, g.titleEn, locale)}</p>
              {g.suggestedAmountCents != null ? (
                <p className="text-xs opacity-70">{formatBrl(g.suggestedAmountCents)}</p>
              ) : null}
            </button>
          );
        })}
      </div>
      {open ? (
        <GiftDialog
          gift={open}
          locale={locale}
          pixBrCode={pixBrCodeMap[open.id]}
          pixKey={pixKey}
          hasMercadoPago={hasMercadoPago}
          onClose={() => setOpenId(null)}
          createMpCheckoutAction={createMpCheckoutAction}
          submitMessageAction={submitMessageAction}
        />
      ) : null}
    </section>
  );
}

interface GiftDialogProps {
  gift: Gift;
  locale: Locale;
  pixBrCode: { brCode: string; svg: string } | null | undefined;
  pixKey: string | null;
  hasMercadoPago: boolean;
  onClose: () => void;
  createMpCheckoutAction: GiftsSectionProps["createMpCheckoutAction"];
  submitMessageAction: GiftsSectionProps["submitMessageAction"];
}

function GiftDialog({ gift, locale, pixBrCode, pixKey, hasMercadoPago, onClose, createMpCheckoutAction, submitMessageAction }: GiftDialogProps) {
  const [pending, startTransition] = useTransition();
  const [mpError, setMpError] = useState<string | null>(null);
  const [copyState, setCopyState] = useState<"idle" | "copied">("idle");
  const [msgState, setMsgState] = useState<"idle" | "sent" | "error">("idle");
  const [msgError, setMsgError] = useState<string | null>(null);

  function copyPixCode() {
    if (!pixBrCode) return;
    navigator.clipboard?.writeText(pixBrCode.brCode).then(
      () => {
        setCopyState("copied");
        setTimeout(() => setCopyState("idle"), 2000);
      },
      () => undefined,
    );
  }

  function openMp() {
    setMpError(null);
    startTransition(async () => {
      const r = await createMpCheckoutAction(gift.id);
      if (r.ok) window.open(r.url, "_blank", "noopener,noreferrer");
      else setMpError(r.error);
    });
  }

  function sendMessage(form: HTMLFormElement) {
    const fd = new FormData(form);
    const senderName = String(fd.get("senderName") ?? "").trim();
    const message = String(fd.get("message") ?? "").trim();
    if (!senderName || !message) {
      setMsgState("error");
      setMsgError("Preencha nome e mensagem.");
      return;
    }
    startTransition(async () => {
      const r = await submitMessageAction(gift.id, senderName, message);
      if (r.ok) {
        setMsgState("sent");
        form.reset();
      } else {
        setMsgState("error");
        setMsgError(r.error);
      }
    });
  }

  const showAmount = gift.suggestedAmountCents != null;
  const amountLabel = showAmount ? formatBrl(gift.suggestedAmountCents) : "";
  return (
    <div
      role="dialog"
      aria-modal="true"
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="max-w-md w-full rounded p-6 max-h-[90vh] overflow-y-auto space-y-4"
        style={{ backgroundColor: "var(--color-card)", color: "var(--color-card-foreground)" }}
      >
        <button type="button" onClick={onClose} aria-label="Fechar" className="float-right text-sm opacity-70">✕</button>
        <h3 className="text-2xl" style={{ fontFamily: "var(--font-display)", color: "var(--color-primary)" }}>
          {pickText(gift.titlePt, gift.titleEn, locale)}
        </h3>
        {gift.descriptionPt ? (
          <p className="text-sm whitespace-pre-line opacity-90">
            {pickText(gift.descriptionPt, gift.descriptionEn, locale)}
          </p>
        ) : null}
        {pixBrCode && pixKey ? (
          <div className="space-y-2 border-t pt-4">
            <p className="text-xs uppercase tracking-widest opacity-70">PIX</p>
            <div
              className="mx-auto w-48 h-48 flex items-center justify-center"
              dangerouslySetInnerHTML={{ __html: pixBrCode.svg }}
            />
            <p className="text-xs opacity-70 break-all">Chave: {pixKey}</p>
            {showAmount ? <p className="text-sm">Valor sugerido: {amountLabel}</p> : null}
            <button type="button" onClick={copyPixCode} className="rounded border px-3 py-1 text-sm">
              {copyState === "copied" ? "Copiado!" : "Copiar código PIX"}
            </button>
          </div>
        ) : null}
        {hasMercadoPago && showAmount ? (
          <div className="space-y-2 border-t pt-4">
            <p className="text-xs uppercase tracking-widest opacity-70">Cartão</p>
            <p className="text-sm">Valor: {amountLabel}</p>
            <button
              type="button"
              onClick={openMp}
              disabled={pending}
              className="rounded border px-3 py-2 text-sm"
              style={{ borderColor: "var(--color-primary)", color: "var(--color-primary)" }}
            >
              {pending ? "Abrindo..." : "Pagar com cartão"}
            </button>
            {mpError ? <p className="text-xs" style={{ color: "var(--color-accent)" }}>{mpError}</p> : null}
          </div>
        ) : null}
        {gift.externalUrl ? (
          <p className="border-t pt-4">
            <a
              href={gift.externalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm underline"
            >
              Abrir loja externa
            </a>
          </p>
        ) : null}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            sendMessage(e.currentTarget);
          }}
          className="space-y-2 border-t pt-4"
        >
          <p className="text-xs uppercase tracking-widest opacity-70">Mensagem para os noivos</p>
          <input
            name="senderName"
            placeholder="Seu nome"
            required
            className="w-full rounded border px-3 py-2 text-sm"
          />
          <textarea
            name="message"
            placeholder="Sua mensagem..."
            rows={3}
            maxLength={500}
            required
            className="w-full rounded border px-3 py-2 text-sm"
          />
          <button
            type="submit"
            disabled={pending}
            className="rounded border px-3 py-1 text-sm"
          >
            {pending ? "Enviando..." : "Enviar mensagem"}
          </button>
          {msgState === "sent" ? (
            <p className="text-xs opacity-70">Mensagem enviada. Obrigada!</p>
          ) : null}
          {msgState === "error" && msgError ? (
            <p className="text-xs" style={{ color: "var(--color-accent)" }}>{msgError}</p>
          ) : null}
        </form>
      </div>
    </div>
  );
}
