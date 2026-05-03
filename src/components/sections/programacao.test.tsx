import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { Programacao } from "./programacao";
import type { ProgramacaoCard } from "@/lib/programacao/db";

function makeCard(overrides: Partial<ProgramacaoCard> = {}): ProgramacaoCard {
  return {
    id: "ceremony",
    titlePt: "",
    titleEn: null,
    date: null,
    time: "",
    addressPt: "",
    addressEn: null,
    mapsUrl: null,
    iconKey: "",
    iconImageStoragePath: null,
    isVisible: true,
    updatedAt: new Date(),
    ...overrides,
  } as ProgramacaoCard;
}

describe("Programacao", () => {
  it("returns null when no cards are provided", () => {
    const { container } = render(<Programacao cards={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it("returns null when every card is hidden", () => {
    const { container } = render(
      <Programacao
        cards={[
          makeCard({ id: "ceremony", titlePt: "C", isVisible: false }),
          makeCard({ id: "reception", titlePt: "R", isVisible: false }),
        ]}
      />,
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders the visible section title (Programação)", () => {
    render(<Programacao cards={[makeCard({ titlePt: "Cerimônia" })]} locale="pt" />);
    expect(screen.getByRole("heading", { level: 2 }).textContent).toBe("Programação");
  });

  it("renders ceremony before reception regardless of input order", () => {
    render(
      <Programacao
        cards={[
          makeCard({ id: "reception", titlePt: "Recepção" }),
          makeCard({ id: "ceremony", titlePt: "Cerimônia" }),
        ]}
      />,
    );
    const headings = screen.getAllByRole("heading", { level: 3 });
    expect(headings[0].textContent).toBe("Cerimônia");
    expect(headings[1].textContent).toBe("Recepção");
  });

  it("hides cards whose isVisible flag is false (only-reception case)", () => {
    render(
      <Programacao
        cards={[
          makeCard({ id: "ceremony", titlePt: "Cerimônia", isVisible: false }),
          makeCard({ id: "reception", titlePt: "Recepção", isVisible: true }),
        ]}
      />,
    );
    const cardHeadings = screen.getAllByRole("heading", { level: 3 });
    expect(cardHeadings).toHaveLength(1);
    expect(cardHeadings[0].textContent).toBe("Recepção");
  });

  it("falls back to default titles when titlePt is empty", () => {
    render(<Programacao cards={[makeCard({ id: "ceremony", titlePt: "" })]} locale="pt" />);
    expect(screen.getByRole("heading", { level: 3 }).textContent).toBe("Cerimônia");
  });

  it("falls back to PT when EN is null", () => {
    render(
      <Programacao
        cards={[makeCard({ id: "ceremony", titlePt: "Cerimônia", titleEn: null })]}
        locale="en"
      />,
    );
    expect(screen.getByRole("heading", { level: 3 }).textContent).toBe("Cerimônia");
  });

  it("uses EN when provided and locale is en", () => {
    render(
      <Programacao
        cards={[makeCard({ id: "ceremony", titlePt: "Cerimônia", titleEn: "Ceremony" })]}
        locale="en"
      />,
    );
    expect(screen.getByRole("heading", { level: 3 }).textContent).toBe("Ceremony");
  });

  it("renders the maps link when mapsUrl is set", () => {
    render(
      <Programacao
        cards={[makeCard({ mapsUrl: "https://maps.google.com/?q=x", titlePt: "Cerimônia" })]}
      />,
    );
    const link = screen.getByRole("link", { name: /Google Maps/ });
    expect(link.getAttribute("href")).toBe("https://maps.google.com/?q=x");
    expect(link.getAttribute("target")).toBe("_blank");
  });

  it("renders the RSVP button only on the first visible card", () => {
    render(
      <Programacao
        cards={[
          makeCard({ id: "ceremony", titlePt: "Cerimônia" }),
          makeCard({ id: "reception", titlePt: "Recepção" }),
        ]}
        rsvpHref="/rsvp/abc"
      />,
    );
    const rsvp = screen.getByRole("link", { name: /Confirme sua presença/ });
    expect(rsvp.getAttribute("href")).toBe("/rsvp/abc");
    expect(screen.getAllByRole("link", { name: /Confirme sua presença/ })).toHaveLength(1);
  });

  it("RSVP button moves to reception when ceremony is hidden", () => {
    render(
      <Programacao
        cards={[
          makeCard({ id: "ceremony", titlePt: "Cerimônia", isVisible: false }),
          makeCard({ id: "reception", titlePt: "Recepção", isVisible: true }),
        ]}
        rsvpHref="/rsvp/abc"
      />,
    );
    const rsvp = screen.getByRole("link", { name: /Confirme sua presença/ });
    expect(rsvp.getAttribute("href")).toBe("/rsvp/abc");
    // The card next to the RSVP button should be Recepção
    const cardHeading = screen.getByRole("heading", { level: 3 });
    expect(cardHeading.textContent).toBe("Recepção");
  });

  it("formats the date as dd.mm.yyyy", () => {
    render(
      <Programacao
        cards={[
          makeCard({
            id: "ceremony",
            titlePt: "X",
            date: new Date("2026-10-20T19:00:00Z"),
          }),
        ]}
        locale="pt"
      />,
    );
    expect(screen.getByText(/20\.10\.2026/)).toBeInTheDocument();
  });

  it("renders an icon image when iconImageStoragePath is set and a Supabase URL is provided", () => {
    render(
      <Programacao
        cards={[
          makeCard({
            id: "ceremony",
            titlePt: "Cerimônia",
            iconImageStoragePath: "icons/ring.png",
          }),
        ]}
        supabaseProjectUrl="https://abc.supabase.co"
      />,
    );
    const img = document.querySelector(
      'img[src="https://abc.supabase.co/storage/v1/object/public/site/icons/ring.png"]',
    );
    expect(img).not.toBeNull();
  });

  it("uses an absolute http(s) URL verbatim for the icon image", () => {
    render(
      <Programacao
        cards={[
          makeCard({
            id: "ceremony",
            titlePt: "Cerimônia",
            iconImageStoragePath: "https://cdn.example.com/ring.svg",
          }),
        ]}
      />,
    );
    const img = document.querySelector('img[src="https://cdn.example.com/ring.svg"]');
    expect(img).not.toBeNull();
  });

  it("does not render an icon image when the path is set but supabaseProjectUrl is missing", () => {
    render(
      <Programacao
        cards={[
          makeCard({
            id: "ceremony",
            titlePt: "Cerimônia",
            iconImageStoragePath: "icons/ring.png",
          }),
        ]}
      />,
    );
    expect(document.querySelector("img")).toBeNull();
  });

  it("does not render an icon image when iconImageStoragePath is null", () => {
    render(
      <Programacao
        cards={[
          makeCard({
            id: "ceremony",
            titlePt: "Cerimônia",
            iconImageStoragePath: null,
          }),
        ]}
        supabaseProjectUrl="https://abc.supabase.co"
      />,
    );
    expect(document.querySelector("img")).toBeNull();
  });
});
