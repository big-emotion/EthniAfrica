"use client";

import type { ReactNode } from "react";

import { PageLayout } from "@/components/layout/PageLayout";
import { useLanguage } from "@/hooks/use-language";

interface AboutPageShellProps {
  children: ReactNode;
}

/**
 * Client-only shell kept outside the server route.
 */
// @req REQ-091
export default function AboutPageShell({ children }: AboutPageShellProps) {
  const { language } = useLanguage();

  return (
    <PageLayout language={language} hideHeader>
      {children}
    </PageLayout>
  );
}
