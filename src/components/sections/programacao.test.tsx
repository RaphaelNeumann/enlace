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
    updatedAt: new Date(),
    ...overrides,
  } as ProgramacaoCard;
}

describe("Programacao", () => {
  it("returns null when no cards are provided", () => {
    const { container } = render(<Programacao cards={[]} />);
    expect(container.firstChild).toBeNull();
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

  it("renders the RSVP button only on the ceremony card when rsvpHref is provided", () => {
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
    // Only one RSVP link, on ceremony
    expect(screen.getAllByRole("link", { name: /Confirme sua presença/ })).toHaveLength(1);
  });

  it("formats the date in the active locale", () => {
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
    expect(screen.getByText(/20\/10\/2026/)).toBeInTheDocument();
  });
});
