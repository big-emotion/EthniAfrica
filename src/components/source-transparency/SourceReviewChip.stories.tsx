import type { Meta, StoryObj } from "@storybook/react";
import { SourceReviewChip } from "./SourceReviewChip";

const meta: Meta<typeof SourceReviewChip> = {
  title: "Source Transparency/SourceReviewChip",
  component: SourceReviewChip,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "Tappable typographic pill placed at the end of any assertion on an AFRIK fiche. " +
          "Renders `N références · revu YYYY-MM-DD`. No emoji, no icon, no color alarm. " +
          "Tap target ≥ 44×44 px via wrapper padding. One-shot pulse on first session render.",
      },
    },
  },
  argTypes: {
    variant: {
      control: "select",
      options: ["inline", "hero", "contested"],
    },
    sourceCount: { control: { type: "number", min: 0 } },
    lastHumanAuditAt: { control: "text" },
    onOpen: { action: "open" },
  },
};

export default meta;
type Story = StoryObj<typeof SourceReviewChip>;

// @req REQ-019
export const Inline: Story = {
  args: {
    sourceCount: 4,
    lastHumanAuditAt: "2025-09-21",
    variant: "inline",
  },
  render: (args) => (
    <p className="max-w-xl text-base leading-relaxed">
      Les Yoruba forment l&apos;un des plus grands groupes ethniques
      d&apos;Afrique occidentale, présents principalement au Nigeria, au Bénin
      et au Togo. <SourceReviewChip {...args} />
    </p>
  ),
};

// @req REQ-019
export const Hero: Story = {
  args: {
    sourceCount: 6,
    lastHumanAuditAt: "2025-10-04",
    variant: "hero",
  },
  render: (args) => (
    <div className="max-w-xl">
      <h1 className="text-3xl font-bold mb-3">Peuple Yoruba</h1>
      <p className="text-lg leading-relaxed">
        Riche héritage culturel et religieux d&apos;Afrique occidentale.{" "}
        <SourceReviewChip {...args} />
      </p>
    </div>
  ),
};

// @req REQ-019
export const Contested: Story = {
  args: {
    sourceCount: 2,
    lastHumanAuditAt: "2025-04-10",
    variant: "contested",
  },
  render: (args) => (
    <p className="max-w-xl text-base leading-relaxed">
      Certains historiens estiment que la migration initiale aurait eu lieu vers
      le VIII<sup>e</sup> siècle, mais cette datation reste discutée.{" "}
      <SourceReviewChip {...args} />
    </p>
  ),
};

// @req REQ-019
export const MissingData: Story = {
  name: "Fallback — missing data",
  args: {
    sourceCount: null,
    lastHumanAuditAt: null,
    variant: "inline",
  },
  render: (args) => (
    <p className="max-w-xl text-base leading-relaxed">
      Cette assertion n&apos;a pas encore été auditée — la fiche affiche un lien
      générique. <SourceReviewChip {...args} />
    </p>
  ),
};

// @req REQ-019
export const NoOnOpen: Story = {
  name: "Without onOpen callback",
  args: {
    sourceCount: 3,
    lastHumanAuditAt: "2025-07-15",
    variant: "inline",
    onOpen: undefined,
  },
  render: (args) => (
    <p className="max-w-xl text-base leading-relaxed">
      Quand aucun gestionnaire n&apos;est fourni, le clic est silencieux mais le
      chip reste focusable et accessible. <SourceReviewChip {...args} />
    </p>
  ),
};

// @req REQ-019
export const AllVariants: Story = {
  name: "All variants side-by-side",
  parameters: { layout: "padded" },
  render: () => (
    <div className="space-y-6 max-w-xl">
      <div>
        <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1">
          Inline (default)
        </p>
        <p className="text-base">
          Texte d&apos;assertion factuelle.{" "}
          <SourceReviewChip
            sourceCount={4}
            lastHumanAuditAt="2025-09-21"
            variant="inline"
          />
        </p>
      </div>
      <div>
        <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1">
          Hero
        </p>
        <p className="text-lg">
          Assertion mise en avant.{" "}
          <SourceReviewChip
            sourceCount={6}
            lastHumanAuditAt="2025-10-04"
            variant="hero"
          />
        </p>
      </div>
      <div>
        <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1">
          Contested
        </p>
        <p className="text-base">
          Assertion débattue par les sources.{" "}
          <SourceReviewChip
            sourceCount={2}
            lastHumanAuditAt="2025-04-10"
            variant="contested"
          />
        </p>
      </div>
      <div>
        <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1">
          Missing data — fallback link
        </p>
        <p className="text-base">
          Assertion sans référence datée.{" "}
          <SourceReviewChip sourceCount={null} lastHumanAuditAt={null} />
        </p>
      </div>
    </div>
  ),
};
