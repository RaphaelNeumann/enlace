import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { Hero } from "./hero";
import type { SiteSettings } from "@/lib/site-settings/get";

function makeSettings(overrides: Partial<SiteSettings> = {}): SiteSettings {
  return {
    id: "default",
    partner1Name: "Fernanda",
    partner1ShortName: "Fernanda",
    partner2Name: "Daniel",
    partner2ShortName: "Daniel",
    partnersOrder: "p1-p2",
    monogramInitialsOverride: null,
    weddingDate: new Date("2099-10-20T19:00:00Z"),
    weddingTimeZone: "America/Sao_Paulo",
    venueShortName: "",
    venueAddressForMaps: null,
    siteTitlePt: "",
    siteTitleEn: null,
    metaDescriptionPt: "",
    metaDescriptionEn: null,
    ogImageStoragePath: null,
    heroIllustrationStoragePath: null,
    photoGalleryAsSubpage: false,
    showHero: true,
    showCeremonyReception: true,
    showDressCode: true,
    showStory: true,
    showGifts: true,
    showTips: true,
    showFaq: true,
    showPhotoGallery: true,
    updatedAt: new Date(),
    ...overrides,
  } as SiteSettings;
}

describe("Hero", () => {
  it("renders couple names as three stacked lines respecting partnersOrder", () => {
    render(<Hero settings={makeSettings({ partnersOrder: "p2-p1" })} now={new Date("2099-01-01T00:00:00Z")} />);
    const h1 = screen.getByRole("heading", { level: 1 });
    const lines = h1.querySelectorAll("span");
    expect(lines.length).toBe(3);
    expect(lines[0].textContent).toBe("Daniel");
    expect(lines[1].textContent).toBe("&");
    expect(lines[2].textContent).toBe("Fernanda");
  });

  it("renders names in p1-p2 order when partnersOrder is p1-p2", () => {
    render(<Hero settings={makeSettings({ partnersOrder: "p1-p2" })} now={new Date("2099-01-01T00:00:00Z")} />);
    const lines = screen.getByRole("heading", { level: 1 }).querySelectorAll("span");
    expect(lines[0].textContent).toBe("Fernanda");
    expect(lines[2].textContent).toBe("Daniel");
  });

  it("falls back to the only filled name (no & line) when one is missing", () => {
    render(
      <Hero
        settings={makeSettings({ partner1Name: "Fernanda", partner2Name: "" })}
        now={new Date("2099-01-01T00:00:00Z")}
      />,
    );
    const h1 = screen.getByRole("heading", { level: 1 });
    expect(h1.querySelectorAll("span").length).toBe(0);
    expect(h1.textContent).toBe("Fernanda");
  });

  it("falls back to em-dash when neither name is set", () => {
    render(
      <Hero
        settings={makeSettings({ partner1Name: "", partner2Name: "" })}
        now={new Date("2099-01-01T00:00:00Z")}
      />,
    );
    expect(screen.getByRole("heading", { level: 1 }).textContent).toBe("—");
  });

  it("renders the localized subtitle when wedding date is set", () => {
    render(<Hero settings={makeSettings()} locale="pt" now={new Date("2099-01-01T00:00:00Z")} />);
    expect(screen.getByText(/OUTUBRO/)).toBeInTheDocument();
  });

  it("omits the subtitle when wedding date is null", () => {
    render(<Hero settings={makeSettings({ weddingDate: null })} now={new Date()} />);
    expect(screen.queryByText(/OUTUBRO|OCTOBER/)).toBeNull();
  });

  it("shows the countdown when the wedding is in the future", () => {
    render(
      <Hero
        settings={makeSettings({ weddingDate: new Date("2099-10-20T00:00:00Z") })}
        now={new Date("2099-10-15T00:00:00Z")}
      />,
    );
    expect(screen.getByText(/Faltam 5 dias/)).toBeInTheDocument();
  });

  it("shows 'Hoje' on the wedding day", () => {
    const date = new Date("2099-10-20T19:00:00Z");
    const now = new Date("2099-10-20T08:00:00Z");
    render(<Hero settings={makeSettings({ weddingDate: date })} now={now} />);
    expect(screen.getByText("Hoje")).toBeInTheDocument();
  });

  it("hides the countdown after the wedding has passed > 24h", () => {
    const date = new Date("2099-10-20T00:00:00Z");
    const now = new Date("2099-10-22T00:00:00Z");
    render(<Hero settings={makeSettings({ weddingDate: date })} now={now} />);
    expect(screen.queryByText(/Faltam|Hoje|to go|Today/)).toBeNull();
  });

  it("renders the monogram with the derived initials", () => {
    render(<Hero settings={makeSettings()} now={new Date("2099-01-01")} />);
    const svg = screen.getByRole("img");
    expect(svg.textContent).toContain("F&D");
  });
});
