import { act, fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ArticleCarousel } from "@/components/articles/ArticleCarousel";

const slides = [
  {
    src: "lingala/01.webp",
    width: 1080,
    height: 1350,
    alt: "Une carte du fleuve Congo",
    text: "Le lingala n'a pas été inventé par les Belges.",
  },
  {
    src: "lingala/02.webp",
    width: 1080,
    height: 1350,
    alt: "Une page de grammaire de 1901",
    text: "Une langue de commerce existait déjà sur le fleuve.",
  },
  {
    src: "lingala/03.webp",
    width: 1080,
    height: 1350,
    alt: "Un marché de Kinshasa",
    text: "Les missionnaires l'ont codifiée, pas créée.",
  },
];

const renderCarousel = () =>
  render(<ArticleCarousel language="fr" title="Le lingala" slides={slides} />);

const carousel = () => screen.getByRole("region", { name: "Carrousel" });

describe("ArticleCarousel", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  // The position is a visible fact, not a row of dots: a reader who arrives
  // from a nine-image post needs to know how far in they are.
  // @req REQ-114
  it("shows the position and steps with its buttons, disabling each end", async () => {
    const user = userEvent.setup();
    renderCarousel();

    expect(within(carousel()).getByText("1 / 3")).toBeInTheDocument();
    const previous = screen.getByRole("button", { name: "Image précédente" });
    const next = screen.getByRole("button", { name: "Image suivante" });
    expect(previous).toBeDisabled();

    await user.click(next);
    await user.click(next);
    expect(within(carousel()).getByText("3 / 3")).toBeInTheDocument();
    expect(next).toBeDisabled();
    expect(previous).toBeEnabled();
  });

  // @req REQ-114
  it("moves with the arrow keys", () => {
    renderCarousel();

    fireEvent.keyDown(carousel(), { key: "ArrowRight" });
    expect(within(carousel()).getByText("2 / 3")).toBeInTheDocument();
    fireEvent.keyDown(carousel(), { key: "ArrowLeft" });
    fireEvent.keyDown(carousel(), { key: "ArrowLeft" });
    expect(within(carousel()).getByText("1 / 3")).toBeInTheDocument();
  });

  // A carousel that advances on its own takes the page away from a reader
  // who is still reading the slide.
  // @req REQ-114
  it("never advances on its own", () => {
    vi.useFakeTimers();
    renderCarousel();
    act(() => {
      vi.advanceTimersByTime(30_000);
    });
    expect(within(carousel()).getByText("1 / 3")).toBeInTheDocument();
  });

  // The essay on the slides is text, not pixels: it must be readable by a
  // screen reader, a translator and a search engine without the image.
  // @req REQ-114
  it("carries each slide's words as real text and describes each image", () => {
    renderCarousel();

    for (const slide of slides) {
      expect(screen.getByText(slide.text)).toBeInTheDocument();
      expect(screen.getByAltText(slide.alt)).toBeInTheDocument();
    }
  });

  // @req REQ-114
  it("announces the slide it lands on", async () => {
    const user = userEvent.setup();
    renderCarousel();

    await user.click(screen.getByRole("button", { name: "Image suivante" }));
    expect(screen.getByRole("status")).toHaveTextContent("Image 2 sur 3");
  });

  // Closing the enlargement must put the reader back where they were, not at
  // the top of the page.
  // @req REQ-114
  it("enlarges the current slide and gives focus back on close", async () => {
    const user = userEvent.setup();
    renderCarousel();

    await user.click(screen.getByRole("button", { name: "Image suivante" }));
    const enlarge = screen.getByRole("button", { name: "Agrandir l'image" });
    await user.click(enlarge);

    const dialog = screen.getByRole("dialog");
    expect(
      within(dialog).getByAltText("Une page de grammaire de 1901")
    ).toBeInTheDocument();

    await user.click(
      within(dialog).getByRole("button", { name: "Fermer l'image agrandie" })
    );
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(enlarge).toHaveFocus();
  });
});
