import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, test } from "vitest";

const pickerClientSource = readFileSync(
  resolve(
    process.cwd(),
    "src/app/[lang]/comparer/ComparerPickerPageClient.tsx"
  ),
  "utf8"
);

describe("comparison client payload", () => {
  // @req REQ-097
  test("keeps the picker page shell outside the interactive client island", () => {
    expect(pickerClientSource).not.toContain(
      'import { PageLayout } from "@/components/layout/PageLayout"'
    );
    expect(pickerClientSource).not.toContain("useParams");
  });
});
