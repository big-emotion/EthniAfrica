"use client";

import { useRef, useState } from "react";

interface CopyAddressProps {
  address: string;
  labels: {
    fieldLabel: string;
    copy: string;
    copied: string;
    copyFailed: string;
  };
}

type CopyOutcome = "idle" | "copied" | "failed";

// @req REQ-045
export function CopyAddress({ address, labels }: CopyAddressProps) {
  const field = useRef<HTMLInputElement>(null);
  const [outcome, setOutcome] = useState<CopyOutcome>("idle");

  async function copyAddress() {
    try {
      await navigator.clipboard.writeText(address);
      setOutcome("copied");
    } catch {
      // Insecure contexts and some in-app browsers refuse the clipboard API;
      // selecting the text lets the reader finish with the keyboard.
      field.current?.focus();
      field.current?.select();
      setOutcome("failed");
    }
  }

  return (
    <div className="flex flex-col gap-2.5 rounded-[14px] border border-afh-border bg-afh-surface p-4">
      <label
        htmlFor="assistant-mcp-address"
        className="text-afh-caption font-bold text-afh-text-soft"
      >
        {labels.fieldLabel}
      </label>
      <div className="flex flex-wrap gap-2.5">
        <input
          ref={field}
          id="assistant-mcp-address"
          type="text"
          readOnly
          value={address}
          className="min-h-11 min-w-0 flex-[1_1_220px] rounded-[10px] border border-afh-border bg-afh-bg px-3 font-mono text-afh-small text-afh-text"
        />
        <button
          type="button"
          onClick={copyAddress}
          className="inline-flex min-h-11 items-center justify-center rounded-[10px] bg-afh-text px-[18px] font-extrabold text-afh-surface"
        >
          {labels.copy}
        </button>
      </div>
      <p role="status" className="m-0 min-h-5 text-sm text-afh-text-soft">
        {outcome === "copied" ? labels.copied : null}
        {outcome === "failed" ? labels.copyFailed : null}
      </p>
    </div>
  );
}
