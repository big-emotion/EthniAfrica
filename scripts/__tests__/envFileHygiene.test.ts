import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Env files are secrets until proven otherwise.
 *
 * `.gitignore` used to list `.env` and the `*.local` variants only, so a
 * `.env.production` written by hand or by a tool was one `git add .` from a
 * public repository. Asked through git itself rather than by reading the
 * ignore file, so a pattern that looks right and matches nothing still fails.
 */

const ROOT = process.cwd();

function isIgnored(path: string): boolean {
  try {
    execFileSync("git", ["check-ignore", "--no-index", "-q", path], {
      cwd: ROOT,
      stdio: "ignore",
    });
    return true;
  } catch (error) {
    // Exit 1 is git's "not ignored"; anything else is git failing to answer.
    if ((error as { status?: number }).status === 1) return false;
    throw error;
  }
}

describe("env file hygiene", () => {
  // @req REQ-032
  it.each([
    ".env",
    ".env.local",
    ".env.production",
    ".env.development",
    ".env.test",
    ".env.staging",
    ".env.production.local",
    "e2e/.env.production",
  ])("keeps %s out of git", (path) => {
    expect(isIgnored(path)).toBe(true);
  });

  // @req REQ-032
  it.each([".env.example", "e2e/.env.example"])(
    "keeps the %s template tracked",
    (path) => {
      expect(isIgnored(path)).toBe(false);
      expect(() =>
        execFileSync("git", ["ls-files", "--error-unmatch", path], {
          cwd: ROOT,
          stdio: "ignore",
        })
      ).not.toThrow();
    }
  );

  /**
   * A path allowlist hides every line of the file from every rule, forever.
   * The templates scan clean under the default ruleset without one, so the
   * exemption bought nothing except blindness to a real value pasted into a
   * placeholder.
   */
  // @req REQ-032
  it("lets the secret scanner read the env templates", () => {
    const config = readFileSync(resolve(ROOT, ".gitleaks.toml"), "utf8");
    const pathsBlock = config.match(/^paths\s*=\s*\[([\s\S]*?)^\]/m)?.[1] ?? "";
    const pathPatterns = pathsBlock
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.startsWith("'''"));

    expect(pathPatterns.length).toBeGreaterThan(0);
    expect(pathPatterns.filter((pattern) => pattern.includes("env"))).toEqual(
      []
    );
  });
});
