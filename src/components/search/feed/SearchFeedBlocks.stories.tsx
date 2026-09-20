import { useState } from "react";
import type { Decorator, Meta, StoryObj } from "@storybook/react";

import { AppellationsBlock } from "@/components/search/feed/AppellationsBlock";
import { FactsBlock } from "@/components/search/feed/FactsBlock";
import { FichesBlock } from "@/components/search/feed/FichesBlock";
import { FurtherBlock } from "@/components/search/feed/FurtherBlock";
import { ImageBlock } from "@/components/search/feed/ImageBlock";
import {
  LensesBlock,
  type FeedLensId,
} from "@/components/search/feed/LensesBlock";
import { OriginsBlock } from "@/components/search/feed/OriginsBlock";
import { OwedBlock } from "@/components/search/feed/OwedBlock";
import { PeopleBlock } from "@/components/search/feed/PeopleBlock";
import {
  PlatesBlock,
  type FeedPlateItem,
} from "@/components/search/feed/PlatesBlock";
import { ProseBlock } from "@/components/search/feed/ProseBlock";
import { QuizBlock } from "@/components/search/feed/QuizBlock";
import { SearchFeedSectionHeading } from "@/components/search/feed/SearchFeedSectionHeading";
import { ShortsBlock } from "@/components/search/feed/ShortsBlock";
import { TilesBlock } from "@/components/search/feed/TilesBlock";
import { VerdictBlock } from "@/components/search/feed/VerdictBlock";
import {
  FEED_CASES,
  type FeedCaseId,
} from "@/lib/search/__fixtures__/feedCases";
import { cn } from "@/lib/utils";

/**
 * One story per block of the reviewed search feed, each with the props the
 * production page hands it, taken from the same board fixtures the pixel
 * harness measures (`SearchFeed.stories.tsx` shows them assembled). Every
 * block is `reviewed` where the component has that switch, so what renders
 * here is the approved board rendering rather than the pre-review one.
 *
 * `…Desktop` stories pin the viewport wide enough for the feed's `1200px`
 * breakpoint; `…Night` stories rebind the semantic tokens the way the site's
 * night theme does.
 */

function fixture(id: FeedCaseId) {
  const value = FEED_CASES.find((candidate) => candidate.id === id);
  if (!value) throw new Error(`Missing fixture ${id}`);
  return value;
}

const mande = fixture("mande");
const peul = fixture("peul");
const bassa = fixture("bassa");
const ekpeye = fixture("ekpeye");
const introuvable = fixture("introuvable");
const inconnu = fixture("inconnu");

// The fixtures point at board mock-up files that Storybook does not serve;
// these are real files under `public/`, so the blocks show an image.
const POSTER_SRC = "/images/discoveries/generated/mansa-musa/9x16.jpg";
const ILLUSTRATION_SRC = "/images/anecdotes/bambara-refus.jpg";
const GENERATED_IMAGE_SRC = "/images/discoveries/generated/mansa-musa/4x5.jpg";

const mandeCompanions = mande.production.companions;
const mandePresentation = mande.board.presentation;

const shortItems = mandeCompanions.shorts.items.map((item) => ({
  ...item,
  poster: { ...item.poster, src: POSTER_SRC },
}));

const plateItems: FeedPlateItem[] =
  mandePresentation.plates.order.flatMap<FeedPlateItem>((id) => {
    const anecdote = mandeCompanions.anecdotes.items.find(
      (item) => item.id === id
    );
    if (anecdote) {
      return [
        {
          type: "anecdote" as const,
          ...anecdote,
          illustration: { ...anecdote.illustration, src: ILLUSTRATION_SRC },
        },
      ];
    }
    const proverb = mandeCompanions.proverbs.items.find(
      (item) => item.id === id
    );
    return proverb ? [{ type: "proverb" as const, ...proverb }] : [];
  });

const imageItem = {
  ...mandeCompanions.images.items[0],
  image: {
    ...mandeCompanions.images.items[0].image,
    src: GENERATED_IMAGE_SRC,
  },
};

const contributionTarget = {
  type: "languageFamily",
  id: "FLG_MANDE",
  name: "Mandé",
  fieldPath: "naming",
  fieldLabel: "Les noms",
};

const noop = () => {};

// Same wrapper classes as `SearchFeedFrame`'s inner shell, so a block sits on
// the page ground with the page's accent and gutters. `dark` goes on that same
// element: `.afh-accent-ocre.dark` is the selector the night accent is defined
// under, and no other story in the repo switches theme to copy from.
const frame: Decorator = (Story, { parameters }) => (
  <div
    className={cn(
      "afh-shell afh-accent-ocre min-w-0 bg-afh-bg py-afh-2xl",
      parameters.night && "dark"
    )}
  >
    <Story />
  </div>
);

const meta = {
  title: "Search/Feed blocks",
  tags: ["autodocs"],
  decorators: [frame],
  parameters: {
    layout: "fullscreen",
    viewport: {
      // The feed's desktop layout starts at 1200 px, which none of the fiche
      // viewports (430 / 720 / 800) reach.
      viewports: {
        feedDesktop1280: {
          name: "Feed — desktop 1280 px",
          styles: { width: "1280px", height: "900px" },
        },
      },
      defaultViewport: "ficheMobile430",
    },
  },
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

const atDesktop = (story: Story): Story => ({
  ...story,
  parameters: {
    ...story.parameters,
    viewport: { defaultViewport: "feedDesktop1280" },
  },
});

const atNight = (story: Story): Story => ({
  ...story,
  parameters: { ...story.parameters, night: true },
});

/** Mandé — the searched form is not the one the peoples use. */
// @req REQ-180
export const Verdict: Story = {
  render: () => (
    <VerdictBlock
      {...mandePresentation.answer}
      name={mandePresentation.answer.name}
    />
  ),
};

// @req REQ-180
export const VerdictDesktop: Story = atDesktop(Verdict);

// @req REQ-180
export const VerdictNight: Story = atNight(Verdict);

/** Unknown name — the verdict without its tinted panel. */
// @req REQ-180
export const VerdictPlain: Story = {
  render: () => (
    <VerdictBlock
      {...inconnu.board.presentation.answer}
      name={inconnu.board.presentation.answer.name}
    />
  ),
};

/** The lenses stay reachable on a narrow screen by scrolling sideways. */
function LensesDemo() {
  const [active, setActive] = useState<FeedLensId>("all");
  return (
    <LensesBlock
      reviewed
      active={active}
      onChange={setActive}
      lenses={[
        { id: "all", label: "Tout" },
        { id: "shorts", label: "Shorts", count: 6 },
        { id: "images", label: "Images", count: 1 },
        { id: "quiz", label: "Quiz", count: 1 },
        { id: "fiches", label: "Fiches", count: 4 },
      ]}
    />
  );
}

// @req REQ-180
export const Lenses: Story = { render: () => <LensesDemo /> };

// @req REQ-180
export const LensesNight: Story = atNight(Lenses);

// @req REQ-180
export const Appellations: Story = {
  render: () => (
    <AppellationsBlock reviewed {...mandePresentation.appellations} />
  ),
};

// @req REQ-180
export const AppellationsDesktop: Story = atDesktop(Appellations);

// @req REQ-180
export const AppellationsNight: Story = atNight(Appellations);

/** Peul — a self-given form and a form recorded as problematic, side by side. */
// @req REQ-180
export const AppellationsMarked: Story = {
  render: () => (
    <AppellationsBlock reviewed {...peul.board.presentation.appellations} />
  ),
};

// @req REQ-180
export const Shorts: Story = {
  render: () => (
    <ShortsBlock
      reviewed
      items={shortItems}
      title={mandePresentation.shorts.title}
      subtitle={mandePresentation.shorts.subtitle}
    />
  ),
};

// @req REQ-180
export const ShortsDesktop: Story = atDesktop(Shorts);

// @req REQ-180
export const ShortsNight: Story = atNight(Shorts);

/** Ekpeye — no short exists yet, so the shelf says so and invites one. */
// @req REQ-180
export const ShortsEmptySlot: Story = {
  render: () => (
    <ShortsBlock
      reviewed
      items={ekpeye.production.companions.shorts.items.map((item) => ({
        ...item,
        poster: { ...item.poster, src: POSTER_SRC },
      }))}
      {...ekpeye.board.presentation.shorts}
      emptySlot={ekpeye.board.presentation.shorts.emptySlot}
      contributionTarget={{ ...contributionTarget, id: "ekpeye" }}
    />
  ),
};

// @req REQ-180
export const Origins: Story = {
  render: () => <OriginsBlock reviewed {...mandePresentation.origins} />,
};

// @req REQ-180
export const OriginsDesktop: Story = atDesktop(Origins);

// @req REQ-180
export const OriginsNight: Story = atNight(Origins);

// @req REQ-180
export const Tiles: Story = {
  render: () => <TilesBlock reviewed {...mandePresentation.tiles} />,
};

// @req REQ-180
export const TilesNight: Story = atNight(Tiles);

/** Ekpeye — the few facts the atlas holds, shown as a labelled grid. */
// @req REQ-180
export const Facts: Story = {
  render: () => <FactsBlock {...ekpeye.board.presentation.facts} />,
};

// @req REQ-180
export const FactsNight: Story = atNight(Facts);

/** Bassa — one name, three peoples, no link between them. */
// @req REQ-180
export const People: Story = {
  render: () => <PeopleBlock {...bassa.board.presentation.peoples} />,
};

// @req REQ-180
export const PeopleDesktop: Story = atDesktop(People);

// @req REQ-180
export const PeopleNight: Story = atNight(People);

// @req REQ-180
export const Plates: Story = {
  render: () => (
    <PlatesBlock
      reviewed
      items={plateItems}
      title={mandePresentation.plates.title}
    />
  ),
};

// @req REQ-180
export const PlatesDesktop: Story = atDesktop(Plates);

// @req REQ-180
export const PlatesNight: Story = atNight(Plates);

// @req REQ-180
export const Quiz: Story = {
  render: () => (
    <QuizBlock
      reviewed
      question={mandeCompanions.quiz.item}
      selectedOption={null}
      onSelectOption={noop}
      onValidate={noop}
      language="fr"
      questionCountLabel={mandePresentation.quiz.questionCountLabel}
      allHref="#quiz"
    />
  ),
};

// @req REQ-180
export const QuizNight: Story = atNight(Quiz);

// @req REQ-180
export const GeneratedImage: Story = {
  render: () => (
    <ImageBlock reviewed item={imageItem} {...mandePresentation.images} />
  ),
};

// @req REQ-180
export const GeneratedImageNight: Story = atNight(GeneratedImage);

/** Bassa — the first prose block, with the standing of its source. */
// @req REQ-180
export const Prose: Story = {
  render: () => {
    const [block] = bassa.board.presentation.prose;
    return (
      <ProseBlock
        blockId={block.id}
        title={block.title}
        paragraphs={block.paragraphs}
        standing={block.standing}
      />
    );
  },
};

// @req REQ-180
export const ProseNight: Story = atNight(Prose);

// @req REQ-180
export const Fiches: Story = {
  render: () => <FichesBlock reviewed {...mandePresentation.fiches} />,
};

// @req REQ-180
export const FichesDesktop: Story = atDesktop(Fiches);

// @req REQ-180
export const FichesNight: Story = atNight(Fiches);

/** A name shared by several peoples: one card, one link per record. */
// @req REQ-180
export const FichesGrouped: Story = {
  render: () => (
    <FichesBlock
      reviewed
      items={[
        {
          kind: "Peuple",
          name: "Bassa",
          meta: "Trois peuples, trois familles linguistiques",
          links: [
            { name: "Bassa du Cameroun", href: "#peuple-bassa-cameroun" },
            { name: "Bassa du Libéria", href: "#peuple-bassa-liberia" },
            { name: "Bassa du Nigeria", href: "#peuple-bassa-nigeria" },
          ],
        },
      ]}
    />
  ),
};

// @req REQ-180
export const Owed: Story = {
  render: () => (
    <OwedBlock
      reviewed
      {...mandePresentation.owed}
      contributionTarget={contributionTarget}
    />
  ),
};

// @req REQ-180
export const OwedDesktop: Story = atDesktop(Owed);

// @req REQ-180
export const OwedNight: Story = atNight(Owed);

// @req REQ-180
export const Further: Story = {
  render: () => (
    <FurtherBlock
      links={introuvable.board.presentation.further.links.map(
        ({ label, href }) => ({ label, href })
      )}
    />
  ),
};

// @req REQ-180
export const FurtherNight: Story = atNight(Further);

// @req REQ-180
export const SectionHeading: Story = {
  render: () => (
    <SearchFeedSectionHeading
      title="Les shorts"
      subtitle="Chacun répond à « D'où vient le nom… ? » en moins d'une minute."
      action={<a href="#tout">Tout voir →</a>}
    />
  ),
};

// @req REQ-180
export const SectionHeadingNight: Story = atNight(SectionHeading);
