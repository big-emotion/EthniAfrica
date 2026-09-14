"use client";

import { useId, useState, type FormEvent } from "react";

import { SourceStandingBadge } from "@/components/sources/SourceStandingBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { sourceStandingLabel } from "@/lib/glossaire/vocabularies";
import { adminCopy } from "@/lib/i18n/copy/admin";
import type { SourceReviewItem } from "@/lib/sources/sourceReviewQueue";
import { createBrowserSupabaseClient } from "@/lib/supabase/auth-client";
import { SOURCE_TIERS, type SourceTier } from "@/types/sources";
import type { Language } from "@/types/shared";

export interface SourceReviewCard extends SourceReviewItem {
  /** A draft decision already exists for this citation. */
  decided: boolean;
}

type Choice = SourceTier | "repair" | "remove";

/** A citation shared by 21 fiches must not push its decision off the screen. */
const VISIBLE_FICHES = 3;

/**
 * The options are values among several, so they take the pill (actions
 * charter §6); the standing badge keeps the source apparatus's square corner.
 */
const PILL =
  "inline-flex min-h-11 cursor-pointer items-center gap-afh-sm rounded-full border border-afh-border px-afh-md text-afh-small has-[:checked]:border-afh-text has-[:checked]:bg-afh-bg-warm";

// @req REQ-042
export function SourceReviewQueue({
  language,
  items,
}: {
  language: Language;
  items: readonly SourceReviewCard[];
}) {
  return (
    <ul className="space-y-afh-lg">
      {items.map((item) => (
        <SourceReviewRow item={item} key={item.key} language={language} />
      ))}
    </ul>
  );
}

function SourceReviewRow({
  item,
  language,
}: {
  item: SourceReviewCard;
  language: Language;
}) {
  const copy = adminCopy[language].sourceReview;
  const id = useId();
  const [choice, setChoice] = useState<Choice | null>(null);
  const [repairTier, setRepairTier] = useState<SourceTier | null>(null);
  const [repairedUrl, setRepairedUrl] = useState("");
  const [rationale, setRationale] = useState("");
  const [decided, setDecided] = useState(item.decided);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  const choices: { value: Choice; label: string }[] = [
    ...SOURCE_TIERS.map((tier) => ({
      value: tier,
      label: sourceStandingLabel(tier, language),
    })),
    { value: "repair", label: copy.repair },
    { value: "remove", label: copy.remove },
  ];

  async function record(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const missing = !choice
      ? copy.decisionRequired
      : choice === "repair" && !repairedUrl.trim()
        ? copy.repairedUrlRequired
        : choice === "repair" && !repairTier
          ? copy.repairTierRequired
          : !rationale.trim()
            ? copy.rationaleRequired
            : "";
    if (missing) {
      setError(missing);
      return;
    }

    setPending(true);
    setError("");

    const {
      data: { session },
    } = await createBrowserSupabaseClient().auth.getSession();

    const decision =
      choice === "repair" || choice === "remove" ? choice : "tier";
    const response = await fetch("/api/v2/admin/source-tier-rulings", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session?.access_token ?? ""}`,
      },
      body: JSON.stringify({
        fiche_path: item.fiches[0].path,
        source_title: item.title,
        source_url: item.url,
        decision,
        tier:
          decision === "tier"
            ? choice
            : decision === "repair"
              ? repairTier
              : null,
        repaired_url: decision === "repair" ? repairedUrl.trim() : null,
        rationale: rationale.trim(),
      }),
    });
    const json = await response.json();

    setPending(false);

    if (!response.ok) {
      setError(json?.errors?.[0]?.message ?? copy.recordFailed);
      return;
    }

    setDecided(true);
    setChoice(null);
    setRepairTier(null);
    setRepairedUrl("");
    setRationale("");
  }

  const shownFiches = item.fiches.slice(0, VISIBLE_FICHES);
  const hiddenFiches = item.fiches.length - shownFiches.length;

  return (
    <li
      className="rounded-afh-lg border border-afh-border p-afh-lg text-left"
      data-state={decided ? "decided" : "to-review"}
      data-testid="source-review-card"
    >
      <div className="flex flex-wrap items-center gap-afh-sm">
        <SourceStandingBadge language={language} standing="needs_review" />
        {decided && (
          <p className="text-afh-caption text-afh-text-soft" data-decided="">
            {copy.decided}
          </p>
        )}
      </div>

      <h2 className="mt-afh-sm break-words text-afh-body font-semibold">
        {item.title}
      </h2>
      {item.url ? (
        <a
          className="break-all text-afh-small underline underline-offset-2"
          href={item.url}
          rel="noopener noreferrer"
          target="_blank"
        >
          {item.url}
        </a>
      ) : (
        <p className="text-afh-small text-afh-text-soft">{copy.noUrl}</p>
      )}

      <p className="mt-afh-sm text-afh-caption text-afh-text-soft">
        {copy.citedBy}{" "}
        {shownFiches
          .map((cited) => `${cited.ficheId} (${copy.kinds[cited.kind]})`)
          .join(", ")}
        {hiddenFiches > 0 && ` +${hiddenFiches}`}
      </p>

      <form className="mt-afh-md space-y-afh-md" noValidate onSubmit={record}>
        <fieldset>
          <legend className="mb-afh-sm text-afh-small font-semibold">
            {copy.decisionLegend}
          </legend>
          <div className="flex flex-wrap gap-afh-sm">
            {choices.map((option) => (
              <label className={PILL} key={option.value}>
                <input
                  checked={choice === option.value}
                  name={`${id}-decision`}
                  onChange={() => setChoice(option.value)}
                  type="radio"
                  value={option.value}
                />
                {option.label}
              </label>
            ))}
          </div>
        </fieldset>

        {choice === "repair" && (
          <>
            <div>
              <Label htmlFor={`${id}-repaired-url`}>{copy.repairedUrl}</Label>
              <Input
                id={`${id}-repaired-url`}
                inputMode="url"
                onChange={(event) => setRepairedUrl(event.target.value)}
                type="url"
                value={repairedUrl}
              />
            </div>
            <fieldset>
              <legend className="mb-afh-sm text-afh-small font-semibold">
                {copy.repairTier}
              </legend>
              <div className="flex flex-wrap gap-afh-sm">
                {SOURCE_TIERS.map((tier) => (
                  <label className={PILL} key={tier}>
                    <input
                      checked={repairTier === tier}
                      name={`${id}-repair-tier`}
                      onChange={() => setRepairTier(tier)}
                      type="radio"
                      value={tier}
                    />
                    {sourceStandingLabel(tier, language)}
                  </label>
                ))}
              </div>
            </fieldset>
          </>
        )}

        <div>
          <Label htmlFor={`${id}-rationale`}>{copy.rationale}</Label>
          <Textarea
            aria-describedby={`${id}-rationale-hint`}
            id={`${id}-rationale`}
            maxLength={5000}
            onChange={(event) => setRationale(event.target.value)}
            value={rationale}
          />
          <p
            className="mt-afh-xs text-afh-caption text-afh-text-soft"
            id={`${id}-rationale-hint`}
          >
            {copy.rationaleHint}
          </p>
        </div>

        {error && (
          <p className="text-afh-small text-afh-flag-open" role="alert">
            {error}
          </p>
        )}

        <Button disabled={pending} type="submit" variant="accent">
          {pending ? copy.recording : copy.submit}
        </Button>
      </form>
    </li>
  );
}
