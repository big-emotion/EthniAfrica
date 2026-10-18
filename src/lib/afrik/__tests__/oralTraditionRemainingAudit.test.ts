import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const patronymesDirectory = join(
  process.cwd(),
  "dataset/source/afrik/patronymes"
);

const readFiche = (id: string) =>
  JSON.parse(readFileSync(join(patronymesDirectory, `${id}.json`), "utf8"));

describe("remaining transcribed patronymic oral accounts (REQ-161)", () => {
  // @req REQ-161
  it("labels written oral accounts as unverified and keeps their publications", () => {
    const cases = [
      {
        id: "PAT_LUGAVE",
        statement:
          "Le nom Lugave est celui d'un clan qui se dit établi dans le Busiro avant l'arrivée du roi Kintu. Il fait remonter son origine à Mukibe Sekiwunga",
        title: "Récit d'origine du clan du Pangolin",
        author: "Chefs du clan du Pangolin, recueillis par John Roscoe",
      },
      {
        id: "PAT_MUKASA",
        statement:
          "Le nom Mukasa viendrait de l'île de Bukasa, selon le récit que John Roscoe rapporte sur le dieu.",
        title: "Récit sur l'origine du dieu Mukasa",
        author: "Récit baganda rapporté par John Roscoe",
      },
      {
        id: "PAT_NJAZA",
        statement:
          "Le nom Njaza est celui d'un clan qui se dit établi de tout temps dans la forêt de Mabira, au Kyagwe : son ancêtre, Lutimba, s'y trouvait déjà quand Kintu s'établit dans le pays, selon ce que les hommes du clan rapportent à John Roscoe.",
        title: "Récit d’origine du clan du Redunca",
        author: "Chefs du clan du Redunca, recueillis par John Roscoe",
      },
      {
        id: "PAT_BAGAYOKO",
        statement:
          "Le nom Bagayoko viendrait de Bagdad : des ancêtres pèlerins de La Mecque auraient rendu visite au calife de Bagdad",
        title: "Récit des anciens de Faragouaran sur le nom Bagayoko",
        author:
          "Chefs et anciens de Faragouaran, interrogés par Andreas W. Massing",
        bookTitle: "Baghayogho : A Soninke Muslim Diaspora in the Mande World",
      },
      {
        id: "PAT_BA",
        statement:
          "Le nom Ba serait celui des descendants de Raabou, fils de l'Arabe Okba et de Tadiouma",
        title: "Tradition peule sur l’origine des Ba",
        author: "Tradition peule rapportée par Maurice Delafosse",
        bookTitle:
          "Haut-Sénégal-Niger (Soudan français), tome I : le pays, les peuples, les langues",
      },
      {
        id: "PAT_BAGAYOKO",
        statement:
          "Le nom Bagayoko est celui d'une famille de lettrés musulmans",
        title: "Témoignage de Hasseye Mahmoud Baghayogho sur ses ancêtres",
        author: "Hasseye Mahmoud Baghayogho, interrogé par Andreas W. Massing",
        bookTitle: "Baghayogho : A Soninke Muslim Diaspora in the Mande World",
      },
      {
        id: "PAT_KOUNTCHE",
        statement:
          "Le nom Kountché est, dans la généalogie que le jasare zarma Jeliba Baje récite pour Seyni Kountché",
        title: "Généalogie récitée par le jasare Jeliba Baje",
        author: "Jeliba Baje (Djéliba Badjé), recueilli par Sandra Bornand",
        bookTitle:
          "L'idéologie de l'ostentation dans les sociétés zarma. L'exemple des relations entre nobles et jasare",
      },
      {
        id: "PAT_KOUYATE",
        statement:
          "Le nom Kouyaté est celui du griot qui raconte l'épopée, Djeli Mamadou Kouyaté",
        title: "Épopée racontée par le griot Djeli Mamadou Kouyaté",
        author: "Djeli Mamadou Kouyaté, recueilli par Djibril Tamsir Niane",
        bookTitle: "Soundjata ou l'épopée mandingue",
      },
    ];

    for (const item of cases) {
      const fiche = readFiche(item.id);
      const account = fiche.nameHistory.names
        .flatMap(
          (name: {
            accounts: Array<{ statement: string; sources: unknown[] }>;
          }) => name.accounts.map((entry) => entry)
        )
        .find((entry: { statement: string }) =>
          entry.statement.startsWith(item.statement)
        );

      expect(account, item.id).toBeDefined();
      expect(account.sources, item.id).toContainEqual(
        expect.objectContaining({
          title: item.title,
          author: item.author,
          tier: "unverified",
          source_kind: "oral_tradition",
        })
      );
      expect(
        account.sources.some(
          (source: { title?: string; source_kind?: string }) =>
            source.title ===
              (item.bookTitle ??
                "The Baganda: An Account of their Native Customs and Beliefs") &&
            source.source_kind !== "oral_tradition"
        ),
        item.id
      ).toBe(true);
    }
  });
});
