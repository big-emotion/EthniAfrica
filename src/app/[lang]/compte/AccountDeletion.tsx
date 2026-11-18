"use client";

import { useState } from "react";

import { accountCopy } from "@/lib/i18n/copy/account";
import type { Language } from "@/types/shared";

import { deleteReaderAccount } from "./actions";
import { ACCOUNT_BUTTON, ACCOUNT_TEXT_BUTTON } from "./accountClasses";

/**
 * « Supprimer mon compte », in two presses: the board draws the first, and
 * the second exists because the deletion cannot be undone.
 */
// @req REQ-213
export function AccountDeletion({ language }: { language: Language }) {
  const copy = accountCopy[language].deletion;
  const [asking, setAsking] = useState(false);

  if (!asking) {
    return (
      <button
        type="button"
        className={`${ACCOUNT_TEXT_BUTTON} self-start text-afh-text`}
        onClick={() => setAsking(true)}
      >
        {copy.open}
      </button>
    );
  }

  return (
    <form
      action={deleteReaderAccount}
      className="flex flex-col gap-afh-sm rounded-afh-lg border border-afh-border bg-afh-bg-warm p-afh-md"
    >
      <p className="text-afh-small text-afh-text">{copy.confirmQuestion}</p>
      <div className="flex flex-wrap gap-afh-md">
        <button type="submit" className={ACCOUNT_BUTTON}>
          {copy.confirm}
        </button>
        <button
          type="button"
          className={ACCOUNT_TEXT_BUTTON}
          onClick={() => setAsking(false)}
        >
          {copy.cancel}
        </button>
      </div>
    </form>
  );
}
