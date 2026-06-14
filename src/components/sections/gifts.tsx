"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import type { Gift } from "@/lib/gifts/db";
import type { Locale } from "@/lib/hero/format-date";
import { publicUrl } from "@/lib/storage/supabase";
import { MercadoPagoWalletButton } from "@/components/admin/MercadoPagoWalletButton";
import { CaptchaDialog } from "@/components/admin/CaptchaDialog";

export interface GiftsSectionProps {
  gifts: Gift[];
  locale?: Locale;
  pixBrCodeMap: Record<string, { brCode: string; svg: string } | null>;
  pixKey: string | null;
  pixRecipient: string | null;
  hasMercadoPago: boolean;
  mercadoPagoPublicKey: string | null;
  turnstileSiteKey: string | null;
  supabaseProjectUrl?: string;
  createMpCheckoutAction: (
    giftId: string,
    amountCents?: number | null,
  ) => Promise<
    | { ok: true; preferenceId: string; url: string }
    | { ok: false; error: string }
  >;
  submitMessageAction: (
    giftId: string | null,
    senderName: string,
    message: string,
    turnstileToken?: string | null,
  ) => Promise<{ ok: true } | { ok: false; error: string }>;
  recomputePixAction: (
    giftId: string,
    amountCents: number | null,
  ) => Promise<{ ok: true; brCode: string; svg: string } | { ok: false; error: string }>;
}

function pickText(pt: string, en: string | null, locale: Locale): string {
  return locale === "en" && en ? en : pt;
}

function PencilIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      width="11"
      height="11"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4z" />
    </svg>
  );
}

function formatBrl(cents: number | null): string {
  if (cents == null) return "";
  return (cents / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export function GiftsSection(props: GiftsSectionProps) {
  const { gifts, locale = "pt", pixBrCodeMap, pixKey, hasMercadoPago, mercadoPagoPublicKey, turnstileSiteKey, supabaseProjectUrl, createMpCheckoutAction, submitMessageAction, recomputePixAction } = props;
  const visible = gifts.filter((g) => g.isVisible);
  const [openId, setOpenId] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const touchStartX = useRef<number | null>(null);
  if (visible.length === 0) return null;
  const open = visible.find((g) => g.id === openId) ?? null;
  // Gallery: show 6 cards per page; arrows (desktop) / swipe (mobile) page through.
  const pageSize = 8;
  const pageCount = Math.ceil(visible.length / pageSize);
  const current = Math.min(page, pageCount - 1);
  const pageItems = visible.slice(current * pageSize, current * pageSize + pageSize);
  const goTo = (p: number) => setPage(Math.max(0, Math.min(pageCount - 1, p)));
  function resolvePhoto(rawPath: string | null | undefined): string | null {
    const path = rawPath?.trim();
    if (!path) return null;
    if (/^https?:\/\//.test(path)) return path;
    if (!supabaseProjectUrl) return null;
    return publicUrl({ projectUrl: supabaseProjectUrl, bucket: "gifts", path });
  }
  return (
    <section className="py-20 px-6" aria-labelledby="gifts-heading">
      <h2
        id="gifts-heading"
        className="text-7xl md:text-8xl text-center mb-4"
        style={{ fontFamily: "var(--font-display)", color: "var(--color-primary)" }}
      >
        {locale === "pt" ? "Lista de presentes" : "Gift catalog"}
      </h2>
      <p className="text-center text-base opacity-70 mb-10 max-w-xl mx-auto">
        {locale === "pt"
          ? "Os valores são apenas sugestões — sinta-se à vontade para alterá-los."
          : "The amounts are only suggestions — feel free to change them."}
      </p>
      <div className="mx-auto max-w-3xl">
        <div
          className="relative"
          onTouchStart={(e) => {
            touchStartX.current = e.changedTouches[0].clientX;
          }}
          onTouchEnd={(e) => {
            if (touchStartX.current == null) return;
            const dx = e.changedTouches[0].clientX - touchStartX.current;
            touchStartX.current = null;
            if (Math.abs(dx) > 40) goTo(current + (dx < 0 ? 1 : -1));
          }}
        >
          {pageCount > 1 ? (
            <button
              type="button"
              onClick={() => goTo(current - 1)}
              disabled={current === 0}
              aria-label={locale === "pt" ? "Anteriores" : "Previous"}
              className="hidden md:flex absolute -left-5 top-1/2 -translate-y-1/2 z-10 h-10 w-10 items-center justify-center rounded-full border text-2xl leading-none disabled:opacity-30"
              style={{
                borderColor: "color-mix(in srgb, var(--color-primary) 30%, transparent)",
                backgroundColor: "var(--color-card)",
                color: "var(--color-primary)",
              }}
            >
              ‹
            </button>
          ) : null}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {pageItems.map((g) => {
              const photo = resolvePhoto(g.photoStoragePath);
              return (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => setOpenId(g.id)}
                  className="rounded p-2 border text-center"
                  style={{
                    borderColor: "color-mix(in srgb, var(--color-primary) 30%, transparent)",
                    backgroundColor: "var(--color-card)",
                    color: "var(--color-card-foreground)",
                  }}
                >
                  {g.iconSvg ? (
                    <div
                      className="w-full aspect-square rounded mb-2 flex items-center justify-center overflow-hidden [&>svg]:max-w-full [&>svg]:max-h-full"
                      aria-hidden="true"
                      dangerouslySetInnerHTML={{ __html: g.iconSvg }}
                    />
                  ) : photo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={photo} alt={pickText(g.titlePt, g.titleEn, locale)} className="w-full aspect-square object-cover rounded mb-2" />
                  ) : (
                    <div className="w-full aspect-square rounded mb-2" style={{ backgroundColor: "var(--color-muted)" }} />
                  )}
                  <p className="text-xs font-medium leading-tight">{pickText(g.titlePt, g.titleEn, locale)}</p>
                  {g.suggestedAmountCents != null ? (
                    <p className="text-sm font-semibold opacity-90">{formatBrl(g.suggestedAmountCents)}</p>
                  ) : null}
                </button>
              );
            })}
          </div>
          {pageCount > 1 ? (
            <button
              type="button"
              onClick={() => goTo(current + 1)}
              disabled={current === pageCount - 1}
              aria-label={locale === "pt" ? "Próximos" : "Next"}
              className="hidden md:flex absolute -right-5 top-1/2 -translate-y-1/2 z-10 h-10 w-10 items-center justify-center rounded-full border text-2xl leading-none disabled:opacity-30"
              style={{
                borderColor: "color-mix(in srgb, var(--color-primary) 30%, transparent)",
                backgroundColor: "var(--color-card)",
                color: "var(--color-primary)",
              }}
            >
              ›
            </button>
          ) : null}
        </div>
        {pageCount > 1 ? (
          <div className="flex justify-center items-center gap-2 mt-6">
            {Array.from({ length: pageCount }).map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => goTo(i)}
                aria-label={`${locale === "pt" ? "Página" : "Page"} ${i + 1}`}
                aria-current={i === current}
                className="h-2.5 rounded-full transition-all"
                style={{
                  width: i === current ? "1.5rem" : "0.625rem",
                  backgroundColor:
                    i === current
                      ? "var(--color-primary)"
                      : "color-mix(in srgb, var(--color-primary) 35%, transparent)",
                }}
              />
            ))}
          </div>
        ) : null}
      </div>
      {open ? (
        <GiftDialog
          gift={open}
          locale={locale}
          pixBrCode={pixBrCodeMap[open.id]}
          pixKey={pixKey}
          hasMercadoPago={hasMercadoPago}
          mercadoPagoPublicKey={mercadoPagoPublicKey}
          turnstileSiteKey={turnstileSiteKey}
          onClose={() => setOpenId(null)}
          createMpCheckoutAction={createMpCheckoutAction}
          submitMessageAction={submitMessageAction}
          recomputePixAction={recomputePixAction}
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
  mercadoPagoPublicKey: string | null;
  turnstileSiteKey: string | null;
  onClose: () => void;
  createMpCheckoutAction: GiftsSectionProps["createMpCheckoutAction"];
  submitMessageAction: GiftsSectionProps["submitMessageAction"];
  recomputePixAction: GiftsSectionProps["recomputePixAction"];
}

function GiftDialog({ gift, locale, pixBrCode, pixKey, hasMercadoPago, mercadoPagoPublicKey, turnstileSiteKey, onClose, createMpCheckoutAction, submitMessageAction, recomputePixAction }: GiftDialogProps) {
  const [pending, startTransition] = useTransition();
  const [mpError, setMpError] = useState<string | null>(null);
  const [copyState, setCopyState] = useState<"idle" | "copied">("idle");
  const [msgState, setMsgState] = useState<"idle" | "sent" | "error">("idle");
  const [msgError, setMsgError] = useState<string | null>(null);
  const [currentPix, setCurrentPix] = useState(pixBrCode ?? null);
  const [currentAmountCents, setCurrentAmountCents] = useState<number | null>(
    gift.suggestedAmountCents ?? null,
  );
  const [editOpen, setEditOpen] = useState(false);
  const [mpPreferenceId, setMpPreferenceId] = useState<string | null>(null);
  const [captchaOpen, setCaptchaOpen] = useState(false);
  // The guest fills the form, clicks send → we stash the values and open
  // the captcha dialog. After the captcha returns a token we replay the
  // submission. State is reset on success/failure so each new attempt
  // re-prompts the captcha.
  const [pendingMessage, setPendingMessage] = useState<{ senderName: string; message: string } | null>(null);

  function copyPixCode() {
    if (!currentPix) return;
    navigator.clipboard?.writeText(currentPix.brCode).then(
      () => {
        setCopyState("copied");
        setTimeout(() => setCopyState("idle"), 2000);
      },
      () => undefined,
    );
  }

  // Whenever the (re-)computed amount changes and Mercado Pago is configured,
  // create/refresh a checkout preference so the Wallet Brick renders with
  // the same value the guest sees in the dialog (PIX edits flow into MP).
  useEffect(() => {
    if (!hasMercadoPago || !mercadoPagoPublicKey || currentAmountCents == null) {
      setMpPreferenceId(null);
      return;
    }
    let cancelled = false;
    setMpError(null);
    // Don't null the preferenceId here: that would unmount the Wallet button
    // mid-refresh and race the async brick creation against a removed container
    // ("Could not find the Brick container ID"). Keep the current button shown
    // and swap to the new preferenceId once it arrives — the button re-creates
    // the brick in its (stable) container when preferenceId changes.
    (async () => {
      const r = await createMpCheckoutAction(gift.id, currentAmountCents);
      if (cancelled) return;
      if (r.ok) setMpPreferenceId(r.preferenceId);
      else setMpError(r.error);
    })();
    return () => {
      cancelled = true;
    };
  }, [hasMercadoPago, mercadoPagoPublicKey, currentAmountCents, gift.id, createMpCheckoutAction]);

  function sendMessage(form: HTMLFormElement) {
    const fd = new FormData(form);
    const senderName = String(fd.get("senderName") ?? "").trim();
    const message = String(fd.get("message") ?? "").trim();
    if (!senderName || !message) {
      setMsgState("error");
      setMsgError("Preencha nome e mensagem.");
      return;
    }
    setMsgState("idle");
    setMsgError(null);
    if (turnstileSiteKey) {
      // Defer the captcha to a dedicated dialog — the SDK script is only
      // fetched when the guest is actually about to send a message.
      setPendingMessage({ senderName, message });
      setCaptchaOpen(true);
      return;
    }
    submitMessage(senderName, message, null, form);
  }

  function submitMessage(
    senderName: string,
    message: string,
    token: string | null,
    form: HTMLFormElement | null,
  ) {
    startTransition(async () => {
      const r = await submitMessageAction(gift.id, senderName, message, token);
      if (r.ok) {
        setMsgState("sent");
        form?.reset();
      } else {
        setMsgState("error");
        setMsgError(r.error);
      }
    });
  }

  const showAmount = currentAmountCents != null;
  const amountLabel = showAmount ? formatBrl(currentAmountCents) : "";
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
        className="max-w-md w-full rounded p-6 max-h-[90vh] overflow-y-auto space-y-2"
        style={{
          backgroundColor: "var(--color-card)",
          color: "var(--color-card-foreground)",
          // Apply Cinzel to every text node inside the dialog (title + body
          // copy + form fields) — owner asked for a single typeface here.
          fontFamily: "var(--font-caps)",
        }}
      >
        <button type="button" onClick={onClose} aria-label="Fechar" className="float-right text-sm opacity-70">✕</button>
        <h3 className="text-2xl text-center" style={{ color: "var(--color-primary)" }}>
          {pickText(gift.titlePt, gift.titleEn, locale)}
        </h3>
        {gift.descriptionPt ? (
          <p className="text-sm whitespace-pre-line opacity-90">
            {pickText(gift.descriptionPt, gift.descriptionEn, locale)}
          </p>
        ) : null}
        {currentPix && pixKey ? (
          <>
            <div className="border-t pt-2 text-center">
              {showAmount ? (
                <>
                  <p className="text-sm">
                    Valor sugerido: <strong className="font-semibold">{amountLabel}</strong>
                  </p>
                  {gift.allowAmountOverride ? (
                    <p>
                      <button
                        type="button"
                        onClick={() => setEditOpen(true)}
                        className="text-xs inline-flex items-center gap-1"
                      >
                        (<PencilIcon />
                        alterar)
                      </button>
                    </p>
                  ) : null}
                </>
              ) : gift.allowAmountOverride ? (
                <p>
                  <button
                    type="button"
                    onClick={() => setEditOpen(true)}
                    className="text-xs inline-flex items-center gap-1"
                  >
                    (<PencilIcon />
                    definir um valor)
                  </button>
                </p>
              ) : null}
            </div>
            <div className="space-y-2 text-center">
              <p className="text-base font-semibold uppercase tracking-widest opacity-80">PIX</p>
              <button
                type="button"
                onClick={copyPixCode}
                className="mx-auto block rounded border px-3 py-1 text-sm"
              >
                {copyState === "copied" ? "Copiado!" : "Copiar código PIX"}
              </button>
              <div
                className="mx-auto w-48 h-48 flex items-center justify-center"
                dangerouslySetInnerHTML={{ __html: currentPix.svg }}
              />
              <p className="text-xs opacity-70 break-all">Chave: {pixKey}</p>
            </div>
          </>
        ) : null}
        {hasMercadoPago && mercadoPagoPublicKey && showAmount ? (
          <div className="space-y-2 text-center">
            <p className="text-base font-semibold uppercase tracking-widest opacity-80">
              Cartão
            </p>
            {mpPreferenceId ? (
              <MercadoPagoWalletButton
                publicKey={mercadoPagoPublicKey}
                preferenceId={mpPreferenceId}
                onError={setMpError}
              />
            ) : !mpError ? (
              <p className="text-xs opacity-60">Carregando Mercado Pago...</p>
            ) : null}
            {mpError ? <p className="text-xs" style={{ color: "var(--color-accent)" }}>{mpError}</p> : null}
          </div>
        ) : null}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            sendMessage(e.currentTarget);
          }}
          className="space-y-2 border-t pt-2 mt-1"
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
      {captchaOpen && turnstileSiteKey && pendingMessage ? (
        <CaptchaDialog
          siteKey={turnstileSiteKey}
          onCancel={() => {
            setCaptchaOpen(false);
            setPendingMessage(null);
          }}
          onToken={(token) => {
            setCaptchaOpen(false);
            const data = pendingMessage;
            setPendingMessage(null);
            if (data) submitMessage(data.senderName, data.message, token, null);
          }}
        />
      ) : null}
      {editOpen ? (
        <EditAmountDialog
          initialCents={currentAmountCents ?? gift.suggestedAmountCents ?? 10000}
          pending={pending}
          onCancel={() => setEditOpen(false)}
          onConfirm={(newCents) => {
            startTransition(async () => {
              const r = await recomputePixAction(gift.id, newCents);
              if (r.ok) {
                setCurrentPix({ brCode: r.brCode, svg: r.svg });
                setCurrentAmountCents(newCents);
                setEditOpen(false);
              }
            });
          }}
        />
      ) : null}
    </div>
  );
}

interface EditAmountDialogProps {
  initialCents: number;
  pending: boolean;
  onCancel: () => void;
  onConfirm: (cents: number) => void;
}

function EditAmountDialog({ initialCents, pending, onCancel, onConfirm }: EditAmountDialogProps) {
  const [value, setValue] = useState((initialCents / 100).toFixed(2));
  const [error, setError] = useState<string | null>(null);
  function submit() {
    const n = Number(value.replace(",", "."));
    if (!Number.isFinite(n) || n <= 0) {
      setError("Informe um valor maior que zero.");
      return;
    }
    onConfirm(Math.round(n * 100));
  }
  return (
    <div
      role="dialog"
      aria-modal="true"
      // Stop propagation BEFORE running onCancel so the click never
      // reaches the parent GiftDialog's backdrop (which would close the
      // whole thing). Without this, any click on the dark area here
      // closes both dialogs.
      onClick={(e) => {
        e.stopPropagation();
        onCancel();
      }}
      className="fixed inset-0 z-[60] flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="max-w-sm w-full rounded p-6 space-y-3"
        style={{
          backgroundColor: "var(--color-card)",
          color: "var(--color-card-foreground)",
          fontFamily: "var(--font-caps)",
        }}
      >
        <h4 className="text-lg" style={{ color: "var(--color-primary)" }}>
          Alterar valor
        </h4>
        <label className="block text-sm space-y-1">
          <span>Valor (R$)</span>
          <input
            type="number"
            inputMode="decimal"
            min="0"
            step="0.01"
            value={value}
            onChange={(e) => {
              setValue(e.currentTarget.value);
              setError(null);
            }}
            className="w-full rounded border px-3 py-2 text-sm"
            autoFocus
          />
        </label>
        {error ? (
          <p className="text-xs" style={{ color: "var(--color-accent)" }}>{error}</p>
        ) : null}
        <div className="flex gap-2 justify-end pt-1">
          <button
            type="button"
            onClick={onCancel}
            className="rounded border px-3 py-1 text-sm"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={pending}
            className="rounded border px-3 py-1 text-sm"
            style={{ borderColor: "var(--color-primary)", color: "var(--color-primary)" }}
          >
            {pending ? "Atualizando..." : "Atualizar"}
          </button>
        </div>
      </div>
    </div>
  );
}
