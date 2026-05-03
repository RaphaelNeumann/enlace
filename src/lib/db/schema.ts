import {
  pgTable,
  text,
  timestamp,
  primaryKey,
  integer,
  boolean,
  date,
  uuid,
  pgEnum,
  check,
  index,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import type { AdapterAccountType } from "next-auth/adapters";

export const userRoleEnum = pgEnum("user_role", ["COUPLE", "CEREMONIAL"]);
export const partnersOrderEnum = pgEnum("partners_order", ["p1-p2", "p2-p1"]);
export const programacaoCardIdEnum = pgEnum("programacao_card_id", [
  "ceremony",
  "reception",
]);
export const guestSourceEnum = pgEnum("guest_source", ["admin", "submitted"]);
export const rsvpStatusEnum = pgEnum("rsvp_status", [
  "pending",
  "confirmed",
  "declined",
]);
export const giftMessageSourceEnum = pgEnum("gift_message_source", [
  "gift_modal",
]);

export const users = pgTable("users", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text("name"),
  email: text("email").unique(),
  emailVerified: timestamp("emailVerified", { mode: "date" }),
  image: text("image"),
  role: userRoleEnum("role").notNull().default("CEREMONIAL"),
});

export const accounts = pgTable(
  "accounts",
  {
    userId: text("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
    type: text("type").$type<AdapterAccountType>().notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("providerAccountId").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (account) => [primaryKey({ columns: [account.provider, account.providerAccountId] })],
);

export const sessions = pgTable("sessions", {
  sessionToken: text("sessionToken").primaryKey(),
  userId: text("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { mode: "date" }).notNull(),
});

export const verificationTokens = pgTable(
  "verificationTokens",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: timestamp("expires", { mode: "date" }).notNull(),
  },
  (t) => [primaryKey({ columns: [t.identifier, t.token] })],
);

/**
 * Single-row table holding global site content edited via /admin/site.
 * The id is constrained to "default" so only one row can ever exist.
 * See docs/features/site-shell.md, hero-countdown.md, location-map.md,
 * photo-gallery.md.
 */
export const siteSettings = pgTable(
  "site_settings",
  {
    id: text("id").primaryKey().default("default"),
    partner1Name: text("partner1_name").notNull().default(""),
    partner1ShortName: text("partner1_short_name").notNull().default(""),
    partner2Name: text("partner2_name").notNull().default(""),
    partner2ShortName: text("partner2_short_name").notNull().default(""),
    partnersOrder: partnersOrderEnum("partners_order").notNull().default("p1-p2"),
    monogramInitialsOverride: text("monogram_initials_override"),
    monogramImageStoragePath: text("monogram_image_storage_path"),
    weddingDate: timestamp("wedding_date", { mode: "date" }),
    weddingTimeZone: text("wedding_time_zone").notNull().default("America/Sao_Paulo"),
    venueShortName: text("venue_short_name").notNull().default(""),
    venueAddressForMaps: text("venue_address_for_maps"),
    siteTitlePt: text("site_title_pt").notNull().default(""),
    siteTitleEn: text("site_title_en"),
    metaDescriptionPt: text("meta_description_pt").notNull().default(""),
    metaDescriptionEn: text("meta_description_en"),
    ogImageStoragePath: text("og_image_storage_path"),
    heroIllustrationStoragePath: text("hero_illustration_storage_path"),
    heroIllustrationOverlapPx: integer("hero_illustration_overlap_px").notNull().default(0),
    photoGalleryAsSubpage: boolean("photo_gallery_as_subpage").notNull().default(false),
    showHero: boolean("show_hero").notNull().default(true),
    showCeremonyReception: boolean("show_ceremony_reception").notNull().default(true),
    showDressCode: boolean("show_dress_code").notNull().default(true),
    showStory: boolean("show_story").notNull().default(true),
    showGifts: boolean("show_gifts").notNull().default(true),
    showTips: boolean("show_tips").notNull().default(true),
    showFaq: boolean("show_faq").notNull().default(true),
    showPhotoGallery: boolean("show_photo_gallery").notNull().default(true),
    updatedAt: timestamp("updated_at", { mode: "date" }).notNull().default(sql`now()`),
  },
  (t) => [check("site_settings_singleton", sql`${t.id} = 'default'`)],
);

/** Programação cards — ceremony + reception (docs/features/ceremony-reception.md). */
export const programacaoCards = pgTable("programacao_cards", {
  id: programacaoCardIdEnum("id").primaryKey(),
  titlePt: text("title_pt").notNull().default(""),
  titleEn: text("title_en"),
  date: date("date", { mode: "date" }),
  time: text("time").notNull().default(""),
  addressPt: text("address_pt").notNull().default(""),
  addressEn: text("address_en"),
  mapsUrl: text("maps_url"),
  iconKey: text("icon_key").notNull().default(""),
  iconImageStoragePath: text("icon_image_storage_path"),
  isVisible: boolean("is_visible").notNull().default(true),
  updatedAt: timestamp("updated_at", { mode: "date" }).notNull().default(sql`now()`),
});

/** Dress code (docs/features/dress-code.md). Singleton row. */
export const dressCode = pgTable(
  "dress_code",
  {
    id: text("id").primaryKey().default("default"),
    headlinePt: text("headline_pt").notNull().default(""),
    headlineEn: text("headline_en"),
    introPt: text("intro_pt").notNull().default(""),
    introEn: text("intro_en"),
    womenTitlePt: text("women_title_pt").notNull().default("Mulheres"),
    womenTitleEn: text("women_title_en"),
    womenBodyPt: text("women_body_pt").notNull().default(""),
    womenBodyEn: text("women_body_en"),
    menTitlePt: text("men_title_pt").notNull().default("Homens"),
    menTitleEn: text("men_title_en"),
    menBodyPt: text("men_body_pt").notNull().default(""),
    menBodyEn: text("men_body_en"),
    iconKey: text("icon_key").notNull().default(""),
    womenIconImageStoragePath: text("women_icon_image_storage_path"),
    menIconImageStoragePath: text("men_icon_image_storage_path"),
    updatedAt: timestamp("updated_at", { mode: "date" }).notNull().default(sql`now()`),
  },
  (t) => [check("dress_code_singleton", sql`${t.id} = 'default'`)],
);

/** Story content (docs/features/story.md). Singleton row. */
export const storyContent = pgTable(
  "story_content",
  {
    id: text("id").primaryKey().default("default"),
    bodyPt: text("body_pt").notNull().default(""),
    bodyEn: text("body_en"),
    photo1StoragePath: text("photo1_storage_path"),
    photo2StoragePath: text("photo2_storage_path"),
    photo3StoragePath: text("photo3_storage_path"),
    updatedAt: timestamp("updated_at", { mode: "date" }).notNull().default(sql`now()`),
  },
  (t) => [check("story_content_singleton", sql`${t.id} = 'default'`)],
);

/** FAQ entries (docs/features/faq.md). */
export const faqEntries = pgTable(
  "faq_entries",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    questionPt: text("question_pt").notNull(),
    questionEn: text("question_en"),
    answerPt: text("answer_pt").notNull(),
    answerEn: text("answer_en"),
    position: integer("position").notNull().default(0),
    isVisible: boolean("is_visible").notNull().default(true),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().default(sql`now()`),
    updatedAt: timestamp("updated_at", { mode: "date" }).notNull().default(sql`now()`),
  },
  (t) => [index("faq_entries_position_idx").on(t.position)],
);

/** Tip categories (docs/features/tips.md). */
export const tipCategories = pgTable(
  "tip_categories",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    namePt: text("name_pt").notNull(),
    nameEn: text("name_en"),
    iconName: text("icon_name"),
    position: integer("position").notNull().default(0),
    isVisible: boolean("is_visible").notNull().default(true),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().default(sql`now()`),
    updatedAt: timestamp("updated_at", { mode: "date" }).notNull().default(sql`now()`),
  },
  (t) => [index("tip_categories_position_idx").on(t.position)],
);

/** Individual tips inside a category (docs/features/tips.md). */
export const tips = pgTable(
  "tips",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    categoryId: uuid("category_id")
      .notNull()
      .references(() => tipCategories.id, { onDelete: "cascade" }),
    titlePt: text("title_pt").notNull(),
    titleEn: text("title_en"),
    bodyPt: text("body_pt").notNull(),
    bodyEn: text("body_en"),
    externalUrl: text("external_url"),
    position: integer("position").notNull().default(0),
    isVisible: boolean("is_visible").notNull().default(true),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().default(sql`now()`),
    updatedAt: timestamp("updated_at", { mode: "date" }).notNull().default(sql`now()`),
  },
  (t) => [index("tips_category_position_idx").on(t.categoryId, t.position)],
);

/** Gift catalog (docs/features/gifts.md). */
export const gifts = pgTable("gifts", {
  id: uuid("id").primaryKey().defaultRandom(),
  titlePt: text("title_pt").notNull(),
  titleEn: text("title_en"),
  descriptionPt: text("description_pt").notNull().default(""),
  descriptionEn: text("description_en"),
  photoStoragePath: text("photo_storage_path"),
  externalUrl: text("external_url"),
  suggestedAmountCents: integer("suggested_amount_cents"),
  position: integer("position").notNull().default(0),
  isVisible: boolean("is_visible").notNull().default(true),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at", { mode: "date" }).notNull().default(sql`now()`),
});

/** Gift messages — guests' notes left in the gift modal. */
export const giftMessages = pgTable("gift_messages", {
  id: uuid("id").primaryKey().defaultRandom(),
  giftId: uuid("gift_id").references(() => gifts.id, { onDelete: "set null" }),
  senderName: text("sender_name").notNull(),
  message: text("message").notNull(),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().default(sql`now()`),
});

/** Photo gallery (docs/features/photo-gallery.md). */
export const photos = pgTable(
  "photos",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    storagePath: text("storage_path").notNull(),
    captionPt: text("caption_pt"),
    captionEn: text("caption_en"),
    position: integer("position").notNull().default(0),
    isVisible: boolean("is_visible").notNull().default(true),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().default(sql`now()`),
    updatedAt: timestamp("updated_at", { mode: "date" }).notNull().default(sql`now()`),
  },
  (t) => [index("photos_position_idx").on(t.position)],
);

/** Guest list + RSVP (docs/features/guest-list.md, rsvp.md, plus-ones.md). */
export const guests = pgTable(
  "guests",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    firstName: text("first_name").notNull(),
    lastName: text("last_name").notNull(),
    plusOnesAllowed: integer("plus_ones_allowed").notNull().default(0),
    source: guestSourceEnum("source").notNull().default("admin"),
    rsvpStatus: rsvpStatusEnum("rsvp_status").notNull().default("pending"),
    rsvpSubmittedAt: timestamp("rsvp_submitted_at", { mode: "date" }),
    observation: text("observation"),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().default(sql`now()`),
    updatedAt: timestamp("updated_at", { mode: "date" }).notNull().default(sql`now()`),
  },
  (t) => [
    index("guests_full_name_idx").on(t.firstName, t.lastName),
    index("guests_status_idx").on(t.rsvpStatus),
  ],
);

/** Plus-ones (docs/features/plus-ones.md). Child of guests. */
export const plusOnes = pgTable(
  "plus_ones",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    guestId: uuid("guest_id")
      .notNull()
      .references(() => guests.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    position: integer("position").notNull().default(0),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().default(sql`now()`),
  },
  (t) => [index("plus_ones_guest_idx").on(t.guestId, t.position)],
);
