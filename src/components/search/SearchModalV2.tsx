"use client";

import { Dialog, DialogClose, DialogContent } from "@/components/ui/dialog";
import { UniversalSearchField } from "./UniversalSearchField";
import { searchFieldCopy } from "@/lib/i18n/copy/searchField";
import type { Language } from "@/types/shared";

interface SearchModalV2Props {
  open: boolean;
  onClose: () => void;
  language: Language;
}

// @req REQ-091
export function SearchModalV2({ open, onClose, language }: SearchModalV2Props) {
  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
    >
      <DialogContent
        aria-label={searchFieldCopy[language].dialogLabel}
        closeLabel={searchFieldCopy[language].close}
        overlayClassName="bg-transparent"
        className="ea-search-modal-content fixed inset-0 left-0 top-0 z-50 flex h-dvh w-full max-w-none translate-x-0 translate-y-0 flex-col gap-4 overflow-y-auto border-0 bg-afh-bg-warm p-4 shadow-none [&>button:last-child]:hidden md:[&>button:last-child]:flex md:inset-auto md:left-1/2 md:top-1/2 md:h-auto md:max-h-[80vh] md:w-[min(640px,calc(100vw-32px))] md:max-w-[640px] md:-translate-x-1/2 md:-translate-y-1/2 md:rounded-afh-2xl md:border md:border-afh-border md:p-6 md:shadow-afh-3"
      >
        <div className="flex justify-end md:hidden">
          <DialogClose asChild>
            <button type="button" className="min-h-11 px-3 underline">
              {searchFieldCopy[language].close}
            </button>
          </DialogClose>
        </div>
        <UniversalSearchField
          language={language}
          surface="modal"
          onClose={onClose}
          autoFocus
        />
        <style jsx global>{`
          @media (max-width: 767px) {
            .ea-search-modal-content {
              border-radius: 0;
            }
          }
        `}</style>
      </DialogContent>
    </Dialog>
  );
}
