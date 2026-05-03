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

function rsvpHrefFromEnv(): string {
  const token = process.env.RSVP_ACCESS_TOKEN?.trim();
  return token ? `/rsvp/${token}` : "/rsvp";
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
  const supabaseProjectUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? undefined;
  const rsvpHref = rsvpHrefFromEnv();
  const pixKey = process.env.PIX_KEY?.trim() ?? null;
  const pixRecipient = process.env.PIX_RECIPIENT_NAME?.trim() ?? null;
  // Only PIX_KEY is strictly required by the BR-Code spec — the generator
  // falls back to "BRASIL" / "RECIPIENT" when city/name are missing.
  const pixCity = process.env.PIX_CITY?.trim() || "BRASIL";
  const hasMercadoPago = Boolean(process.env.MERCADO_PAGO_ACCESS_TOKEN?.trim());
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
      {settings.showHero ? (
        <Hero settings={settings} locale="pt" supabaseProjectUrl={supabaseProjectUrl} />
      ) : null}
      {settings.showCeremonyReception ? (
        <Programacao
          cards={programacao}
          locale="pt"
          rsvpHref={rsvpHref}
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
          gifts={gifts}
          locale="pt"
          pixBrCodeMap={pixBrCodeMap}
          pixKey={pixKey}
          pixRecipient={pixRecipient}
          hasMercadoPago={hasMercadoPago}
          supabaseProjectUrl={supabaseProjectUrl}
          createMpCheckoutAction={createGiftCheckoutAction}
          submitMessageAction={submitGiftMessageAction}
          recomputePixAction={recomputePixBrCodeAction}
        />
      ) : null}
      {settings.showTips ? <TipsSection categories={tipCategories} locale="pt" /> : null}
      {settings.showPhotoGallery ? (
        <PhotoGallerySection photos={photos} locale="pt" supabaseProjectUrl={supabaseProjectUrl} />
      ) : null}
      {settings.showFaq ? <FaqSection entries={faq} locale="pt" /> : null}

      <SiteFooter
        closingText="Te esperamos!"
        coupleNames={coupleNames}
        year={new Date().getFullYear()}
      />
    </main>
  );
}
