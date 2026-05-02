import { getSiteSettings } from "@/lib/site-settings/get";
import { Hero } from "@/components/sections/hero";
import { SiteFooter, formatCoupleNames } from "@/components/site-footer";

export default async function HomePage() {
  const settings = await getSiteSettings();
  const coupleNames = formatCoupleNames({
    partner1Name: settings.partner1Name,
    partner2Name: settings.partner2Name,
    partnersOrder: settings.partnersOrder,
  });
  return (
    <main className="flex-1">
      {settings.showHero ? <Hero settings={settings} locale="pt" /> : null}

      {/* TODO: ceremony-reception, dress-code, story, gifts, tips, faq, photo-gallery */}

      <SiteFooter
        closingText="Te esperamos!"
        coupleNames={coupleNames}
        year={new Date().getFullYear()}
      />
    </main>
  );
}
