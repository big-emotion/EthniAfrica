import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  BlockCommentsFooter,
  BlockCommentsProvider,
  CommentableBlock,
  PageCommentAction,
} from "@/components/comments/BlockComments";

vi.mock("next/navigation", () => ({ useParams: () => ({ lang: "fr" }) }));

/** The real gate fetches a challenge and starts a worker; a button stands in. */
vi.mock("@/components/flags/ProofOfWorkGate", () => ({
  ProofOfWorkGate: ({
    onSolved,
  }: {
    onSolved: (proof: Record<string, unknown>) => void;
  }) => (
    <button
      type="button"
      onClick={() =>
        onSolved({
          salt: "s",
          nonce: "1",
          difficultyBits: 8,
          expiresAt: 4102444800000,
          signature: "sig",
        })
      }
    >
      Valider le contrôle (test)
    </button>
  ),
}));

const PEUL = { type: "people", id: "PPL_PEUL" };
const NAMING = "people:PPL_PEUL:naming";
const ORIGIN = "people:PPL_PEUL:origin";

const thread = (overrides: Record<string, unknown> = {}) => ({
  id: "c-1",
  public_slug: "ABC",
  flag_kind: "other",
  body: "Chez nous, on se dit Haalpulaar'en.",
  counter_source_url: null,
  counter_source_citation: null,
  proposed_rewrite: null,
  knowledge_basis: "family",
  status: "accepted",
  remediation_state: null,
  display_name: "Aïssatou B.",
  created_at: "2026-11-03T10:00:00.000Z",
  replies: [
    {
      id: "r-1",
      body: "Merci, nous l'ajoutons.",
      display_name: null,
      is_moderation: true,
      created_at: "2026-11-05T10:00:00.000Z",
    },
  ],
  ...overrides,
});

let comments: Record<string, unknown>[];
let posted: { url: string; body: Record<string, unknown> }[];

function stubApi() {
  posted = [];
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string, init?: RequestInit) => {
      if (init?.method === "POST") {
        posted.push({ url, body: JSON.parse(String(init.body)) });
        // A reader with no session: the API refuses a reply.
        if (url.endsWith("/replies")) {
          return { ok: false, status: 401, json: async () => ({}) };
        }
        return {
          ok: true,
          status: 201,
          json: async () => ({ data: { public_slug: "NEWSLUG" } }),
        };
      }
      return { ok: true, status: 200, json: async () => ({ data: comments }) };
    })
  );
}

function renderPage(children: React.ReactNode, keys = [NAMING, ORIGIN]) {
  return render(
    <BlockCommentsProvider blockKeys={keys} language="fr">
      {children}
    </BlockCommentsProvider>
  );
}

const namesFooter = (
  <BlockCommentsFooter
    subject={PEUL}
    section="naming"
    label="Ses noms"
    name="Peul"
  />
);

async function openSheet() {
  fireEvent.click(await screen.findByRole("button", { name: "Commenter" }));
  return screen.findByRole("dialog");
}

async function fillAndSend(fields: { email?: string; age?: boolean } = {}) {
  const dialog = await openSheet();
  const form = within(dialog);
  fireEvent.change(form.getByLabelText("Votre commentaire"), {
    target: { value: "On lit aussi Foulbé dans des livres anciens." },
  });
  fireEvent.change(form.getByLabelText(/Nom affiché/), {
    target: { value: "Aïssatou B." },
  });
  fireEvent.click(form.getByLabelText("ma famille"));
  if (fields.email) {
    fireEvent.change(form.getByLabelText("Votre adresse e-mail"), {
      target: { value: fields.email },
    });
  }
  if (fields.age) fireEvent.click(form.getByLabelText("J'ai 15 ans ou plus"));
  fireEvent.click(form.getByRole("button", { name: /valider le contrôle/i }));
  fireEvent.click(
    form.getByRole("button", { name: "Envoyer mon commentaire" })
  );
  return dialog;
}

beforeEach(() => {
  comments = [
    { block_key: NAMING, count: 2, threads: [thread()], corrected_at: null },
    { block_key: ORIGIN, count: 0, threads: [], corrected_at: null },
  ];
  stubApi();
});

describe("block comments on the result page", () => {
  // REQ-212 GWT: two published comments on « names » → « 2 commentaires · Commenter ».
  // @req REQ-212
  it("closes a passage with its count and the button that adds one", async () => {
    renderPage(namesFooter);

    expect(
      await screen.findByRole("button", { name: "2 commentaires" })
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Commenter" })).toHaveClass(
      "min-h-11"
    );
  });

  // @req REQ-212
  it("says « Aucun commentaire » as plain text when nobody has commented", async () => {
    renderPage(
      <BlockCommentsFooter
        subject={PEUL}
        section="origin"
        label="D'où vient le nom"
        name="Peul"
      />
    );

    expect(await screen.findByText("Aucun commentaire")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Aucun commentaire" })
    ).toBeNull();
  });

  // One request per page, whatever the number of footers.
  // @req REQ-212
  it("reads every block of the page in one request", async () => {
    renderPage(
      <>
        {namesFooter}
        <BlockCommentsFooter
          subject={PEUL}
          section="origin"
          label="D'où vient le nom"
          name="Peul"
        />
      </>
    );

    await screen.findByRole("button", { name: "2 commentaires" });
    expect(fetch).toHaveBeenCalledOnce();
    expect(vi.mocked(fetch).mock.calls[0][0]).toBe(
      `/api/v2/comments?block_keys=${encodeURIComponent(`${NAMING},${ORIGIN}`)}`
    );
  });

  // REQ-212 GWT: a block with a published correction shows « Corrigé le <date> ».
  // @req REQ-212
  it("marks a corrected passage with the date, and a way to the discussion", async () => {
    comments[0].corrected_at = "2026-11-12T09:00:00.000Z";
    renderPage(
      <CommentableBlock
        subject={PEUL}
        section="naming"
        label="Ses noms"
        name="Peul"
      >
        <p>Peul · Fulɓe</p>
      </CommentableBlock>
    );

    expect(
      await screen.findByText(
        "Corrigé le 12 novembre 2026 grâce à une contribution."
      )
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Voir la discussion" }));
    expect(await screen.findByRole("dialog")).toBeInTheDocument();
  });

  // @req REQ-212
  it("opens the thread with the moderation's signed reply", async () => {
    renderPage(namesFooter);

    const dialog = within(await openSheet());

    expect(dialog.getByText("Commentaires sur ce passage")).toBeInTheDocument();
    expect(dialog.getByText("Ses noms · Peul")).toBeInTheDocument();
    expect(dialog.getByText("Aïssatou B.")).toBeInTheDocument();
    expect(dialog.getByText("Pris en compte")).toBeInTheDocument();
    expect(
      dialog.getByText("Connaît ce sujet par sa famille")
    ).toBeInTheDocument();
    expect(dialog.getByText("Réponse de la modération")).toBeInTheDocument();
    expect(
      dialog.getByText("Modération EthniAfrica · 5 novembre 2026")
    ).toBeInTheDocument();
    expect(dialog.getAllByRole("button", { name: "Signaler" })).toHaveLength(
      // The moderation signs its reply; only readers' messages are reported.
      1
    );
    expect(dialog.getByRole("button", { name: "Fermer" })).toBeInTheDocument();
  });

  // @req REQ-212
  it("signs a comment without a pseudonym « Un lecteur »", async () => {
    comments[0].threads = [thread({ display_name: null, replies: [] })];
    renderPage(namesFooter);

    const dialog = within(await openSheet());

    expect(dialog.getByText("Un lecteur")).toBeInTheDocument();
  });

  // @req REQ-212
  it("invites the first comment on an empty passage", async () => {
    renderPage(
      <BlockCommentsFooter
        subject={PEUL}
        section="origin"
        label="Leur nom"
        name="Fulɓe"
      />
    );

    const dialog = within(await openSheet());

    expect(
      dialog.getByText("Aucun commentaire pour l'instant")
    ).toBeInTheDocument();
  });

  // REQ-212 GWT: with an address, the sheet says to check the mailbox, and
  // nothing new is shown publicly.
  // @req REQ-212
  it("sends the comment on its block, then says to check the mailbox", async () => {
    renderPage(namesFooter);

    const dialog = within(
      await fillAndSend({ email: "aissatou@exemple.fr", age: true })
    );

    expect(await dialog.findByText("Vérifiez votre boîte mail")).toBeVisible();
    expect(dialog.getByText(/aissatou@exemple\.fr/)).toBeInTheDocument();
    expect(posted[0].url).toBe("/api/v2/flags");
    expect(posted[0].body).toMatchObject({
      target_type: "people",
      target_id: "PPL_PEUL",
      block_key: NAMING,
      reason_text: "On lit aussi Foulbé dans des livres anciens.",
      display_name: "Aïssatou B.",
      knowledge_basis: "family",
      reporter_email: "aissatou@exemple.fr",
      age_confirmed: true,
    });
    expect(
      screen.getByRole("button", { name: "2 commentaires", hidden: true })
    ).toBeVisible();
  });

  // Moderation charter §6: without an address the message is private.
  // @req REQ-212
  it("says a comment without an address stays private", async () => {
    renderPage(namesFooter);

    const dialog = within(await fillAndSend());

    expect(await dialog.findByText("Votre message est arrivé")).toBeVisible();
    expect(posted[0].body).not.toHaveProperty("reporter_email");
    expect(posted[0].body).not.toHaveProperty("age_confirmed");
  });

  // @req REQ-212
  it("asks for the age before sending an address", async () => {
    renderPage(namesFooter);

    const dialog = within(
      await fillAndSend({ email: "aissatou@exemple.fr", age: false })
    );

    expect(
      await dialog.findByText(
        "Pour laisser une adresse, confirmez que vous avez 15 ans ou plus."
      )
    ).toBeInTheDocument();
    expect(posted).toHaveLength(0);
  });

  // Brief 21, arbitration 1: one form for every contribution.
  // @req REQ-212
  it("opens the same form from the page-end invitation, on no block", async () => {
    renderPage(
      <PageCommentAction
        target={{
          type: "people",
          id: "PPL_PEUL",
          name: "Peul",
          fieldPath: "naming",
        }}
        label="Signaler une erreur"
        fallback={null}
      />
    );

    fireEvent.click(
      await screen.findByRole("button", { name: "Signaler une erreur" })
    );
    const dialog = within(await screen.findByRole("dialog"));
    fireEvent.change(dialog.getByLabelText("Votre commentaire"), {
      target: { value: "La date de 1842 me semble fausse." },
    });
    fireEvent.click(
      dialog.getByRole("button", { name: /valider le contrôle/i })
    );
    fireEvent.click(
      dialog.getByRole("button", { name: "Envoyer mon commentaire" })
    );

    await waitFor(() => expect(posted).toHaveLength(1));
    expect(posted[0].body).toMatchObject({
      target_type: "people",
      target_id: "PPL_PEUL",
      target_field_path: "naming",
    });
    expect(posted[0].body).not.toHaveProperty("block_key");
  });

  // Moderation charter §2: three reports hide a message; the reader is only
  // thanked, never told whether theirs hid it.
  // @req REQ-212
  it("reports a comment behind the proof of work", async () => {
    renderPage(namesFooter);
    const dialog = within(await openSheet());

    fireEvent.click(dialog.getByRole("button", { name: "Signaler" }));
    const gates = dialog.getAllByRole("button", {
      name: /valider le contrôle/i,
    });
    fireEvent.click(gates[0]);

    expect(
      await dialog.findByText("Merci. La modération va regarder ce message.")
    ).toBeInTheDocument();
    expect(posted[0].url).toBe("/api/v2/comments/c-1/report");
  });

  // @req REQ-212
  it("tells a reader without an account how to reply", async () => {
    renderPage(namesFooter);
    const dialog = within(await openSheet());

    fireEvent.click(dialog.getByRole("button", { name: "Répondre" }));
    fireEvent.change(dialog.getByLabelText("Votre réponse"), {
      target: { value: "D'accord, merci." },
    });
    fireEvent.click(dialog.getByRole("button", { name: "Envoyer ma réponse" }));

    expect(
      await dialog.findByText(/Pour répondre, publiez d'abord un commentaire/)
    ).toBeInTheDocument();
    expect(posted[0]).toEqual({
      url: "/api/v2/comments/c-1/replies",
      body: { body: "D'accord, merci." },
    });
  });

  // A footer outside a result page (a story, another surface) draws nothing
  // rather than a control that cannot open anything.
  // @req REQ-212
  it("draws nothing outside a page that reads comments", () => {
    const { container } = render(namesFooter);
    expect(container).toBeEmptyDOMElement();
  });
});
