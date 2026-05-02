/**
 * Wedding configuration.
 * Edit this file after forking — all static site content comes from here.
 * Default values are placeholders meant to be replaced.
 */
export const wedding = {
  couple: {
    partner1: { name: "Partner One", shortName: "Partner 1" },
    partner2: { name: "Partner Two", shortName: "Partner 2" },
  },

  date: {
    iso: "2026-12-31T18:00:00-03:00",
    display: "December 31, 2026",
    time: "6:00 PM",
  },

  venue: {
    name: "Venue Name",
    address: "Full address, City - State",
    mapsUrl: "https://maps.google.com",
  },

  ceremony: {
    time: "6:00 PM",
    location: "Ceremony location",
  },

  reception: {
    time: "8:00 PM",
    location: "Reception location",
  },

  rsvp: {
    deadline: "2026-11-30",
  },

  dressCode: "Cocktail attire",

  contact: {
    email: "contact@example.com",
    whatsapp: "+5511999999999",
  },

  site: {
    title: "enlace",
    description: "Our wedding website",
    locale: "pt-BR",
    timezone: "America/Sao_Paulo",
  },
} as const;

export type WeddingConfig = typeof wedding;
