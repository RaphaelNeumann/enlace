import { getSiteSettings } from "@/lib/site-settings/get";
import { getDressCode } from "@/lib/dress-code/db";
import { getStoryContent } from "@/lib/story/db";
import { listProgramacao } from "@/lib/programacao/db";
import { listFaq } from "@/lib/faq/db";
import { listVisibleCategoriesWithTips } from "@/lib/tips/db";
import { listGifts } from "@/lib/gifts/db";
import { listPhotos } from "@/lib/photos/db";
import { Hero } from "@/components/sections/hero";
import { PhotoGallerySection } from "@/components/sections/photo-gallery";
import { Programacao } from "@/components/sections/programacao";
import { DressCodeSection } from "@/components/sections/dress-code";
import { Story } from "@/components/sections/story";
import { FaqSection } from "@/components/sections/faq";
import { TipsSection } from "@/components/sections/tips";
import { GiftsSection } from "@/components/sections/gifts";
import { renderPix } from "@/lib/pix/render";
import {
  createGiftCheckoutAction,
  submitGiftMessageAction,
  recomputePixBrCodeAction,
} from "@/app/api/gifts/checkout/actions";
import { SiteFooter, formatCoupleNames } from "@/components/site-footer";
import { PublicNav } from "@/components/PublicNav";

// Fisher-Yates shuffle. Runs per request on the server (the page is dynamic),
// so the gift catalog is shown in a fresh random order on every load. Shuffling
// here (not on the client) keeps server and client markup in sync — the client
// receives the already-shuffled array as a prop.
function shuffle<T>(items: readonly T[]): T[] {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default async function HomePage() {
  const [settings, programacao, dress, story, faq, tipCategories, gifts, photos] =
    await Promise.all([
      getSiteSettings(),
      listProgramacao(),
      getDressCode(),
      getStoryContent(),
      listFaq({ onlyVisible: true }),
      listVisibleCategoriesWithTips(),
      listGifts({ onlyVisible: true }),
      listPhotos({ onlyVisible: true }),
    ]);
  const coupleNames = formatCoupleNames({
    partner1Name: settings.partner1Name,
    partner2Name: settings.partner2Name,
    partnersOrder: settings.partnersOrder,
  });
  const showTipsSection = settings.showTips && tipCategories.length > 0;
  const showFaqSection = settings.showFaq && faq.length > 0;
  // Links for the floating public nav — only sections that are actually shown.
  const navItems = [
    settings.showCeremonyReception && programacao.length > 0
      ? { href: "#programacao-heading", label: "Programação" }
      : null,
    settings.showDressCode ? { href: "#dress-code-heading", label: "Traje" } : null,
    settings.showStory ? { href: "#story-heading", label: "Nossa história" } : null,
    settings.showGifts && gifts.length > 0
      ? { href: "#gifts-heading", label: "Presentes" }
      : null,
    showTipsSection ? { href: "#tips-heading", label: "Dicas" } : null,
    showFaqSection ? { href: "#faq-heading", label: "FAQ" } : null,
    settings.showPhotoGallery && photos.length > 0
      ? { href: "#gallery-heading", label: "Galeria" }
      : null,
  ].filter((i): i is { href: string; label: string } => i !== null);
  const supabaseProjectUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? undefined;
  const pixKey = process.env.PIX_KEY?.trim() ?? null;
  const pixRecipient = process.env.PIX_RECIPIENT_NAME?.trim() ?? null;
  // Only PIX_KEY is strictly required by the BR-Code spec — the generator
  // falls back to "BRASIL" / "RECIPIENT" when city/name are missing.
  const pixCity = process.env.PIX_CITY?.trim() || "BRASIL";
  const hasMercadoPago = Boolean(process.env.MERCADO_PAGO_ACCESS_TOKEN?.trim());
  const mercadoPagoPublicKey =
    process.env.NEXT_PUBLIC_MERCADO_PAGO_PUBLIC_KEY?.trim() || null;
  const turnstileSiteKey =
    process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim() || null;
  const pixBrCodeMap: Record<string, ReturnType<typeof renderPix> | null> = {};
  if (pixKey) {
    for (const g of gifts) {
      pixBrCodeMap[g.id] = renderPix({
        pixKey,
        recipientName: pixRecipient ?? "",
        city: pixCity,
        amountCents: g.suggestedAmountCents ?? undefined,
      });
    }
  } else {
    for (const g of gifts) pixBrCodeMap[g.id] = null;
  }
  return (
    <main className="flex-1">
      <PublicNav items={navItems} brand={coupleNames} />
      {settings.showHero ? (
        <Hero settings={settings} locale="pt" supabaseProjectUrl={supabaseProjectUrl} />
      ) : null}
      {settings.showCeremonyReception ? (
        <Programacao
          cards={programacao}
          locale="pt"
          supabaseProjectUrl={supabaseProjectUrl}
        />
      ) : null}
      {settings.showDressCode ? (
        <DressCodeSection content={dress} locale="pt" supabaseProjectUrl={supabaseProjectUrl} />
      ) : null}
      {settings.showStory ? (
        <Story content={story} locale="pt" supabaseProjectUrl={supabaseProjectUrl} />
      ) : null}
      {settings.showGifts ? (
        <GiftsSection
          gifts={shuffle(gifts)}
          locale="pt"
          pixBrCodeMap={pixBrCodeMap}
          pixKey={pixKey}
          pixRecipient={pixRecipient}
          hasMercadoPago={hasMercadoPago}
          mercadoPagoPublicKey={mercadoPagoPublicKey}
          turnstileSiteKey={turnstileSiteKey}
          supabaseProjectUrl={supabaseProjectUrl}
          createMpCheckoutAction={createGiftCheckoutAction}
          submitMessageAction={submitGiftMessageAction}
          recomputePixAction={recomputePixBrCodeAction}
        />
      ) : null}
      {(showTipsSection || showFaqSection) ? (
        // Tips and FAQ share a single sage-tinted band (the tint Programação
        // and Nossa História also use) so they read as one section. space-y
        // separates the two sub-sections when both are shown.
        <section
          className="py-20 px-6 space-y-20"
          style={{
            backgroundColor: "color-mix(in srgb, #7c8150 55%, transparent)",
          }}
        >
          {showTipsSection ? (
            <TipsSection categories={tipCategories} locale="pt" />
          ) : null}
          {showFaqSection ? <FaqSection entries={faq} locale="pt" /> : null}
        </section>
      ) : null}
      {settings.showPhotoGallery ? (
        <PhotoGallerySection photos={photos} locale="pt" supabaseProjectUrl={supabaseProjectUrl} />
      ) : null}

      <SiteFooter
        closingText="Te esperamos!"
        coupleNames={coupleNames}
        year={new Date().getFullYear()}
      />
    </main>
  );
}
