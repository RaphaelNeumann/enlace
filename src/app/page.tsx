import { getSiteSettings } from "@/lib/site-settings/get";
import { getDressCode } from "@/lib/dress-code/db";
import { getStoryContent } from "@/lib/story/db";
import { listProgramacao } from "@/lib/programacao/db";
import { listFaq } from "@/lib/faq/db";
import { listVisibleCategoriesWithTips } from "@/lib/tips/db";
import { Hero } from "@/components/sections/hero";
import { Programacao } from "@/components/sections/programacao";
import { DressCodeSection } from "@/components/sections/dress-code";
import { Story } from "@/components/sections/story";
import { FaqSection } from "@/components/sections/faq";
import { TipsSection } from "@/components/sections/tips";
import { SiteFooter, formatCoupleNames } from "@/components/site-footer";

function rsvpHrefFromEnv(): string {
  const token = process.env.RSVP_ACCESS_TOKEN?.trim();
  return token ? `/rsvp/${token}` : "/rsvp";
}

export default async function HomePage() {
  const [settings, programacao, dress, story, faq, tipCategories] = await Promise.all([
    getSiteSettings(),
    listProgramacao(),
    getDressCode(),
    getStoryContent(),
    listFaq({ onlyVisible: true }),
    listVisibleCategoriesWithTips(),
  ]);
  const coupleNames = formatCoupleNames({
    partner1Name: settings.partner1Name,
    partner2Name: settings.partner2Name,
    partnersOrder: settings.partnersOrder,
  });
  const supabaseProjectUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? undefined;
  const rsvpHref = rsvpHrefFromEnv();
  return (
    <main className="flex-1">
      {settings.showHero ? <Hero settings={settings} locale="pt" /> : null}
      {settings.showCeremonyReception ? (
        <Programacao cards={programacao} locale="pt" rsvpHref={rsvpHref} />
      ) : null}
      {settings.showDressCode ? <DressCodeSection content={dress} locale="pt" /> : null}
      {settings.showStory ? (
        <Story content={story} locale="pt" supabaseProjectUrl={supabaseProjectUrl} />
      ) : null}
      {settings.showTips ? <TipsSection categories={tipCategories} locale="pt" /> : null}
      {settings.showFaq ? <FaqSection entries={faq} locale="pt" /> : null}

      <SiteFooter
        closingText="Te esperamos!"
        coupleNames={coupleNames}
        year={new Date().getFullYear()}
      />
    </main>
  );
}
