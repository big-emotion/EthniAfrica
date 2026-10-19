import { nameSearchHref } from "../../src/lib/search/nameAddress";

export interface SearchMetric {
  name: string;
  visitors: number;
}

export interface SearchSubject {
  form: string;
  subject: { type: string; id: string };
  summary: string;
  href: string;
}

export interface SearchedName {
  form: string;
  subject: { type: string; id: string };
  summary: string;
  href: string;
}

export function placeSubjectsFromFiche(fiche: {
  id?: unknown;
  nameMain?: unknown;
  summary?: unknown;
  nameHistory?: { names?: Array<{ nameText?: unknown }> };
}): SearchSubject[] {
  if (
    typeof fiche.id !== "string" ||
    typeof fiche.summary !== "string" ||
    !fiche.summary.trim()
  ) {
    return [];
  }
  const forms = [
    fiche.nameMain,
    ...(fiche.nameHistory?.names ?? []).map((name) => name.nameText),
  ].filter((form): form is string => typeof form === "string" && !!form.trim());
  return [...new Set(forms)].map((form) => ({
    form,
    subject: { type: "place", id: fiche.id as string },
    summary: fiche.summary as string,
    href: nameSearchHref("fr", form),
  }));
}

function formKey(form: string): string {
  return form
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .normalize("NFC")
    .trim()
    .toLocaleLowerCase("fr");
}

/** Keep exact, sufficiently common searched forms, with a stable popularity order. */
export function filterSearchedThisWeek(
  rows: readonly SearchMetric[],
  subjects: readonly SearchSubject[],
  minimumVisitors = 3,
  maximumNames = 6
): SearchedName[] {
  const byExactForm = new Map<string, SearchSubject[]>();
  for (const subject of subjects) {
    const key = formKey(subject.form);
    const matches = byExactForm.get(key) ?? [];
    matches.push(subject);
    byExactForm.set(key, matches);
  }
  return rows
    .filter(
      (row) =>
        row.name.trim().length > 0 &&
        Number.isFinite(row.visitors) &&
        row.visitors >= minimumVisitors &&
        byExactForm.has(formKey(row.name))
    )
    .sort(
      (left, right) =>
        right.visitors - left.visitors ||
        formKey(left.name).localeCompare(formKey(right.name), "fr")
    )
    .flatMap((row) =>
      byExactForm.get(formKey(row.name))!.map((subject) => ({
        form: subject.form,
        subject: subject.subject,
        summary: firstSentence(subject.summary),
        href: subject.href,
      }))
    )
    .slice(0, maximumNames);
}

function firstSentence(text: string): string {
  const match = text.match(/^.+?[.!?](?=\s|$)/u);
  return (match?.[0] ?? text).trim();
}
