import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { SiteFooter, formatCoupleNames } from "./site-footer";

describe("formatCoupleNames", () => {
  it("orders p1 before p2 when partnersOrder is p1-p2", () => {
    expect(
      formatCoupleNames({
        partner1Name: "Fernanda",
        partner2Name: "Daniel",
        partnersOrder: "p1-p2",
      }),
    ).toBe("Fernanda & Daniel");
  });

  it("orders p2 before p1 when partnersOrder is p2-p1", () => {
    expect(
      formatCoupleNames({
        partner1Name: "Fernanda",
        partner2Name: "Daniel",
        partnersOrder: "p2-p1",
      }),
    ).toBe("Daniel & Fernanda");
  });

  it("falls back to a single name when only one is filled", () => {
    expect(
      formatCoupleNames({
        partner1Name: "Fernanda",
        partner2Name: "",
        partnersOrder: "p1-p2",
      }),
    ).toBe("Fernanda");
  });

  it("returns empty string when both names are missing", () => {
    expect(
      formatCoupleNames({
        partner1Name: "",
        partner2Name: "",
        partnersOrder: "p1-p2",
      }),
    ).toBe("");
  });
});

describe("SiteFooter", () => {
  it("renders the script closing line, couple names, and year", () => {
    render(
      <SiteFooter
        closingText="Te esperamos!"
        coupleNames="Fernanda & Daniel"
        year={2026}
      />,
    );
    expect(screen.getByText("Te esperamos!")).toBeInTheDocument();
    expect(screen.getByText(/Fernanda & Daniel/)).toBeInTheDocument();
    expect(screen.getByText(/2026/)).toBeInTheDocument();
  });

  it("renders a privacy-policy link when href is provided", () => {
    render(
      <SiteFooter
        closingText="See you soon!"
        coupleNames="A & B"
        year={2026}
        privacyHref="/privacy"
      />,
    );
    const link = screen.getByRole("link", { name: /privacidade|privacy/i });
    expect(link.getAttribute("href")).toBe("/privacy");
  });

  it("omits the privacy link when href is null", () => {
    render(
      <SiteFooter
        closingText="X"
        coupleNames="A & B"
        year={2026}
        privacyHref={null}
      />,
    );
    expect(screen.queryByRole("link")).toBeNull();
  });
});
