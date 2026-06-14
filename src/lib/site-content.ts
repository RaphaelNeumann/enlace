// Cached reads of admin-managed content for the PUBLIC site (home + root
// layout metadata). Each wraps the underlying DB getter in the Next Data Cache
// so a page render doesn't fire ~9 live DB queries per request — which, under
// the serverless transaction pooler, was the main source of connection
// pressure and latency.
//
// Freshness: a 60s revalidate window is the correctness backstop, and each
// admin action calls revalidateTag(<tag>) (see content-tags.ts) so edits show
// up immediately. Admin pages and auth keep calling the raw getters directly —
// they must never read stale data.
import { unstable_cache } from "next/cache";

import { CONTENT_TAGS } from "./content-tags";
import { getSiteSettings } from "./site-settings/get";
import { getDressCode } from "./dress-code/db";
import { getStoryContent } from "./story/db";
import { listProgramacao } from "./programacao/db";
import { listFaq } from "./faq/db";
import { listVisibleCategoriesWithTips } from "./tips/db";
import { listGifts } from "./gifts/db";
import { listPhotos } from "./photos/db";

const REVALIDATE_SECONDS = 60;

export const getCachedSiteSettings = unstable_cache(
  () => getSiteSettings(),
  ["site-content:site-settings"],
  { tags: [CONTENT_TAGS.siteSettings], revalidate: REVALIDATE_SECONDS },
);

export const getCachedDressCode = unstable_cache(
  () => getDressCode(),
  ["site-content:dress-code"],
  { tags: [CONTENT_TAGS.dressCode], revalidate: REVALIDATE_SECONDS },
);

export const getCachedStoryContent = unstable_cache(
  () => getStoryContent(),
  ["site-content:story"],
  { tags: [CONTENT_TAGS.story], revalidate: REVALIDATE_SECONDS },
);

export const getCachedProgramacao = unstable_cache(
  () => listProgramacao(),
  ["site-content:programacao"],
  { tags: [CONTENT_TAGS.programacao], revalidate: REVALIDATE_SECONDS },
);

export const getCachedFaq = unstable_cache(
  () => listFaq({ onlyVisible: true }),
  ["site-content:faq-visible"],
  { tags: [CONTENT_TAGS.faq], revalidate: REVALIDATE_SECONDS },
);

export const getCachedTipCategories = unstable_cache(
  () => listVisibleCategoriesWithTips(),
  ["site-content:tips-visible"],
  { tags: [CONTENT_TAGS.tips], revalidate: REVALIDATE_SECONDS },
);

export const getCachedGifts = unstable_cache(
  () => listGifts({ onlyVisible: true }),
  ["site-content:gifts-visible"],
  { tags: [CONTENT_TAGS.gifts], revalidate: REVALIDATE_SECONDS },
);

export const getCachedPhotos = unstable_cache(
  () => listPhotos({ onlyVisible: true }),
  ["site-content:photos-visible"],
  { tags: [CONTENT_TAGS.photos], revalidate: REVALIDATE_SECONDS },
);
