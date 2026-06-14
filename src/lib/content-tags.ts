// Cache tags for admin-managed site content. Public reads are wrapped in
// unstable_cache tagged with these (see site-content.ts); the matching admin
// action calls revalidateTag(<tag>) after a mutation so edits show instantly.
export const CONTENT_TAGS = {
  siteSettings: "content:site-settings",
  dressCode: "content:dress-code",
  story: "content:story",
  programacao: "content:programacao",
  faq: "content:faq",
  tips: "content:tips",
  gifts: "content:gifts",
  photos: "content:photos",
} as const;

export type ContentTag = (typeof CONTENT_TAGS)[keyof typeof CONTENT_TAGS];
