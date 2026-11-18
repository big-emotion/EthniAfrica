"use client";

import { useId, useState } from "react";

import type { SheetRequest } from "@/components/comments/CommentSheet";
import {
  deriveFlagKind,
  type FlagSubmissionPayload,
} from "@/components/flags/FlagForm";
import { ProofOfWorkGate } from "@/components/flags/ProofOfWorkGate";
import { submitFlag } from "@/components/flags/submitFlag";
import type { Proof } from "@/lib/antibot/proofOfWork";
import { commentsCopy } from "@/lib/i18n/copy/comments";
import { reportsCopy } from "@/lib/i18n/copy/reports";
import { getStaticPageRoute } from "@/lib/routing";
import { cn } from "@/lib/utils";
import type { Language } from "@/types/shared";

/** The form offers three answers; the API's fourth, `other`, is never asked. */
const BASES = ["family", "language", "reading"] as const;
type Basis = (typeof BASES)[number];

const LOOKS_LIKE_AN_ADDRESS = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isHttpUrl(value: string): boolean {
  try {
    return ["http:", "https:"].includes(new URL(value).protocol);
  } catch {
    return false;
  }
}

const FIELD = "flex min-w-0 flex-col gap-afh-sm";
const LABEL = "text-afh-small font-bold";
const HELP = "text-afh-caption leading-[1.5] text-afh-text-soft";
const INPUT =
  "min-h-11 w-full rounded-afh-lg border border-afh-border bg-afh-surface px-afh-lg py-afh-base text-afh-small leading-[1.5] text-afh-text placeholder:text-afh-text-muted focus-visible:outline-none focus-visible:shadow-afh-focus";
const ERROR = "text-afh-small text-afh-flag-open";

interface Errors {
  body?: string;
  source?: string;
  email?: string;
  age?: string;
}

export interface CommentFormProps {
  request: SheetRequest;
  language: Language;
  /** The address the reader left, or null: the sheet's answer depends on it. */
  onSent: (address: string | null) => void;
}

/**
 * A comment costs two actions and no account (moderation charter §2): write,
 * send. Everything else is optional. The address is what publishes it, after
 * the reader presses the button of the page its link opens; the age is asked
 * once an address is typed, since only then does a public account follow.
 */
// @req REQ-212
export function CommentForm({ request, language, onSent }: CommentFormProps) {
  const copy = commentsCopy[language].form;
  const verification = reportsCopy[language].form;
  const id = useId();
  const [body, setBody] = useState("");
  const [correction, setCorrection] = useState("");
  const [source, setSource] = useState("");
  const [basis, setBasis] = useState<Basis | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [ageConfirmed, setAgeConfirmed] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const [proof, setProof] = useState<Proof | null>(null);
  const [proofFailed, setProofFailed] = useState(false);
  const [proofPending, setProofPending] = useState(false);
  const [openedAt] = useState(() => Date.now());
  const [sending, setSending] = useState(false);
  const [failed, setFailed] = useState(false);

  const address = email.trim();

  function validate(): Errors {
    const next: Errors = {};
    if (body.trim().length < 10 || body.length > 2000) {
      next.body = copy.invalidBody;
    }
    if (source.trim() && !isHttpUrl(source.trim())) {
      next.source = copy.invalidUrl;
    }
    if (address && !LOOKS_LIKE_AN_ADDRESS.test(address)) {
      next.email = copy.invalidEmail;
    }
    if (address && !ageConfirmed) next.age = copy.ageRequired;
    return next;
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const next = validate();
    setErrors(next);
    setProofPending(!proof);
    if (Object.keys(next).length > 0 || !proof) return;

    const payload: FlagSubmissionPayload = {
      language,
      target_type: request.subject.type,
      target_id: request.subject.id,
      ...(request.fieldPath ? { target_field_path: request.fieldPath } : {}),
      ...(request.blockKey ? { block_key: request.blockKey } : {}),
      flag_kind: deriveFlagKind({
        counterSourceUrl: source,
        counterSourceCitation: "",
        proposedRewrite: correction,
      }),
      reason_text: body.trim(),
      ...(correction.trim() ? { proposed_rewrite: correction.trim() } : {}),
      ...(source.trim() ? { counter_source_url: source.trim() } : {}),
      ...(displayName.trim() ? { display_name: displayName.trim() } : {}),
      ...(basis ? { knowledge_basis: basis } : {}),
      ...(address ? { reporter_email: address, age_confirmed: true } : {}),
      antibot: proof,
      website: "",
      elapsedMs: Date.now() - openedAt,
    };

    setSending(true);
    setFailed(false);
    try {
      await submitFlag(payload);
      onSent(address || null);
    } catch {
      // The server spends the challenge before it can fail downstream, so a
      // second click on the same proof would be refused: a new one is solved.
      setProof(null);
      setFailed(true);
    } finally {
      setSending(false);
    }
  }

  const field = (name: string) => `${id}-${name}`;
  const errorOf = (name: keyof Errors) =>
    errors[name] ? (
      <p id={field(`${name}-error`)} role="alert" className={ERROR}>
        {errors[name]}
      </p>
    ) : null;
  const describedBy = (name: keyof Errors, help?: string) =>
    [help, errors[name] ? field(`${name}-error`) : undefined]
      .filter(Boolean)
      .join(" ") || undefined;

  return (
    <form
      noValidate
      onSubmit={handleSubmit}
      className="flex flex-col gap-afh-2xl border-t-2 border-afh-text pt-afh-2xl"
    >
      <h3 className="font-afh-display text-afh-h3 font-black leading-[1.25]">
        {copy.title}
      </h3>

      <div className={FIELD}>
        <label htmlFor={field("body")} className={LABEL}>
          {copy.body}
        </label>
        <textarea
          id={field("body")}
          value={body}
          onChange={(event) => setBody(event.target.value)}
          placeholder={copy.bodyPlaceholder}
          maxLength={2000}
          required
          aria-invalid={Boolean(errors.body)}
          aria-describedby={describedBy("body")}
          className={cn(INPUT, "min-h-[116px] resize-y")}
        />
        {errorOf("body")}
      </div>

      <div className={FIELD}>
        <label htmlFor={field("correction")} className={LABEL}>
          {copy.correction}{" "}
          <span className="font-normal text-afh-text-soft">
            {copy.optional}
          </span>
        </label>
        <input
          id={field("correction")}
          type="text"
          value={correction}
          onChange={(event) => setCorrection(event.target.value)}
          maxLength={5000}
          className={INPUT}
        />
      </div>

      <div className={FIELD}>
        <label htmlFor={field("source")} className={LABEL}>
          {copy.source}{" "}
          <span className="font-normal text-afh-text-soft">
            {copy.optional}
          </span>
        </label>
        <input
          id={field("source")}
          type="url"
          inputMode="url"
          placeholder="https://"
          value={source}
          onChange={(event) => setSource(event.target.value)}
          aria-invalid={Boolean(errors.source)}
          aria-describedby={describedBy("source")}
          className={INPUT}
        />
        {errorOf("source")}
      </div>

      <fieldset className={cn(FIELD, "m-0 border-0 p-0")}>
        <legend className={cn(LABEL, "p-0")}>
          {copy.basisLegend}{" "}
          <span className="font-normal text-afh-text-soft">
            {copy.optional}
          </span>
        </legend>
        <div className="mt-0.5 flex flex-wrap gap-afh-md">
          {BASES.map((value) => (
            <label key={value} className="relative">
              <input
                type="radio"
                name={field("basis")}
                value={value}
                checked={basis === value}
                // A radio cannot be unticked; a second tap clears the
                // answer, since the question is optional.
                onClick={() =>
                  setBasis((current) => (current === value ? null : value))
                }
                onChange={() => undefined}
                className="peer absolute inset-0 m-0 opacity-0"
              />
              <span className="inline-flex min-h-11 items-center rounded-full border border-afh-border bg-afh-surface px-afh-2xl text-afh-small font-semibold peer-checked:border-[color:var(--accent)] peer-checked:bg-[color:var(--accent-tint)] peer-checked:text-[color:var(--accent-foreground)] peer-focus-visible:shadow-afh-focus">
                {copy.basisChoices[value]}
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className={FIELD}>
        <label htmlFor={field("name")} className={LABEL}>
          {copy.displayName}{" "}
          <span className="font-normal text-afh-text-soft">
            {copy.optional}
          </span>
        </label>
        <input
          id={field("name")}
          type="text"
          autoComplete="nickname"
          maxLength={40}
          value={displayName}
          onChange={(event) => setDisplayName(event.target.value)}
          aria-describedby={field("name-help")}
          className={INPUT}
        />
        <p id={field("name-help")} className={HELP}>
          {copy.displayNameHelp}
        </p>
      </div>

      <div className={FIELD}>
        <label htmlFor={field("email")} className={LABEL}>
          {copy.email}
        </label>
        <input
          id={field("email")}
          type="email"
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          aria-invalid={Boolean(errors.email)}
          aria-describedby={describedBy("email", field("email-help"))}
          className={INPUT}
        />
        <p id={field("email-help")} className={HELP}>
          {copy.emailHelp}
        </p>
        {errorOf("email")}
      </div>

      {address ? (
        <div className={FIELD}>
          <label
            htmlFor={field("age")}
            className="flex min-h-11 items-center gap-afh-base font-semibold"
          >
            <input
              id={field("age")}
              type="checkbox"
              checked={ageConfirmed}
              onChange={(event) => setAgeConfirmed(event.target.checked)}
              required
              aria-invalid={Boolean(errors.age)}
              aria-describedby={describedBy("age")}
              className="m-0 size-[22px] flex-none accent-[color:var(--accent)]"
            />
            {copy.age}
          </label>
          {errorOf("age")}
        </div>
      ) : null}

      <p className="rounded-afh-lg border border-afh-border bg-afh-bg-warm p-afh-lg text-afh-small leading-[1.55]">
        {copy.notice}
      </p>

      <div aria-hidden="true" hidden>
        <label htmlFor={field("website")}>{verification.honeypot}</label>
        <input
          id={field("website")}
          name="website"
          type="text"
          tabIndex={-1}
          autoComplete="off"
        />
      </div>

      {/* Nothing is asked of the reader: the browser pays a small cost and
          says when it is done. It is solved again after a failed send. */}
      {proof ? null : (
        <ProofOfWorkGate
          language={language}
          onSolved={(solved) => {
            setProof(solved);
            setProofFailed(false);
            setProofPending(false);
          }}
          onFailed={() => setProofFailed(true)}
        />
      )}
      {proofFailed ? (
        <p role="alert" className={ERROR}>
          {verification.verificationFailed}
        </p>
      ) : null}
      {proofPending && !proofFailed ? (
        <p role="alert" className={ERROR}>
          {verification.verificationIncomplete}
        </p>
      ) : null}
      {failed ? (
        <p role="alert" className={ERROR}>
          {copy.failed}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={sending}
        className="inline-flex min-h-12 w-full items-center justify-center rounded-afh-lg border border-[color:var(--accent)] bg-[color:var(--accent)] px-afh-xl text-afh-small font-bold text-[color:var(--accent-foreground)] focus-visible:outline-none focus-visible:shadow-afh-focus disabled:opacity-60"
      >
        {sending ? copy.sending : copy.submit}
      </button>

      <p className={HELP}>
        {copy.rules}{" "}
        <a
          href={getStaticPageRoute(language, "reports")}
          className="underline underline-offset-2"
        >
          {copy.rulesLink}
        </a>
      </p>
    </form>
  );
}
