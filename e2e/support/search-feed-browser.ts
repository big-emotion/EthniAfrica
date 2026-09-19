import { existsSync, realpathSync, statSync } from "node:fs";
import { isAbsolute, normalize, relative, resolve } from "node:path";
import type { Page } from "@playwright/test";

const BOARD_ASSET_PREFIX = "/docs/design/mockups/search-feed/";
const PUBLIC_IMAGE_PREFIX = "/public/images/";

const ROUTED_BOARD_DIRECTORIES = ["fonts/", "posters/"] as const;
const ROUTED_ASSET_EXTENSIONS = [
  ".avif",
  ".jpeg",
  ".jpg",
  ".png",
  ".webp",
  ".woff2",
] as const;
const REQUIRED_FONT_LOADS = [
  {
    descriptor: `normal 400 16px "Nunito Sans"`,
    family: "Nunito Sans",
    style: "normal",
    weight: "400",
    text: "Mandé",
  },
  {
    descriptor: `normal 700 16px "Fraunces"`,
    family: "Fraunces",
    style: "normal",
    weight: "700",
    text: "Mandé",
  },
  {
    descriptor: `italic 400 16px "Fraunces"`,
    family: "Fraunces",
    style: "italic",
    weight: "400",
    text: "Mandé",
  },
] as const;

export interface SearchFeedReadiness {
  deviceScaleFactor: number;
  fonts: Array<{
    family: string;
    style: string;
    weight: string;
    status: FontFaceLoadStatus;
  }>;
  images: Array<{
    src: string;
    naturalWidth: number;
    naturalHeight: number;
  }>;
}

type ReadinessPage = Pick<Page, "evaluate" | "waitForLoadState">;
type RoutingPage = Pick<Page, "route">;

function remainsInside(root: string, candidate: string): boolean {
  const pathFromRoot = relative(root, candidate);
  return (
    pathFromRoot === "" ||
    (!pathFromRoot.startsWith("..") && !isAbsolute(pathFromRoot))
  );
}

export function resolveSearchFeedAssetPath(
  pathname: string,
  repositoryRoot = process.cwd()
): string | null {
  let decodedPath: string;
  try {
    decodedPath = decodeURIComponent(pathname);
  } catch {
    return null;
  }
  const root = resolve(repositoryRoot);
  let assetRoot: string | null = null;
  let assetRelativePath: string | null = null;

  if (decodedPath.startsWith(PUBLIC_IMAGE_PREFIX)) {
    assetRoot = resolve(root, "public/images");
    assetRelativePath = decodedPath.slice(PUBLIC_IMAGE_PREFIX.length);
  } else if (decodedPath.startsWith(BOARD_ASSET_PREFIX)) {
    const boardRelativePath = decodedPath.slice(BOARD_ASSET_PREFIX.length);
    const directory = ROUTED_BOARD_DIRECTORIES.find((candidate) =>
      boardRelativePath.startsWith(candidate)
    );
    if (directory) {
      assetRoot = resolve(root, "docs/design/mockups/search-feed", directory);
      assetRelativePath = boardRelativePath.slice(directory.length);
    }
  }

  if (!assetRoot || assetRelativePath === null) return null;

  const candidate = resolve(assetRoot, normalize(assetRelativePath));
  if (
    !remainsInside(assetRoot, candidate) ||
    !ROUTED_ASSET_EXTENSIONS.some((extension) =>
      candidate.toLowerCase().endsWith(extension)
    ) ||
    !existsSync(candidate) ||
    !statSync(candidate).isFile()
  ) {
    return null;
  }

  const realAssetRoot = realpathSync(assetRoot);
  const realCandidate = realpathSync(candidate);
  return remainsInside(realAssetRoot, realCandidate) ? realCandidate : null;
}

export function searchFeedAssetRequestPath(requestUrl: string): string {
  const url = new URL(requestUrl);
  return url.pathname === "/_next/image"
    ? (url.searchParams.get("url") ?? url.pathname)
    : url.pathname;
}

export async function routeCommittedSearchFeedAssets(
  page: RoutingPage,
  repositoryRoot = process.cwd()
): Promise<void> {
  await page.route("**/*", async (route) => {
    const pathname = searchFeedAssetRequestPath(route.request().url());
    const assetPath = resolveSearchFeedAssetPath(pathname, repositoryRoot);

    if (!assetPath) {
      await route.fallback();
      return;
    }

    await route.fulfill({ path: assetPath });
  });
}

export async function waitForSearchFeedReady(
  page: ReadinessPage,
  selector = "[data-feed-root]"
): Promise<SearchFeedReadiness> {
  await page.waitForLoadState("networkidle");

  return page.evaluate(
    async ({ rootSelector, requiredFonts }) => {
      await document.fonts.ready;

      const root = document.querySelector(rootSelector);
      if (!root) throw new Error(`Missing search-feed root: ${rootSelector}`);

      const fonts = [];
      for (const required of requiredFonts) {
        let loaded: FontFace[];
        try {
          loaded = await document.fonts.load(
            required.descriptor,
            required.text
          );
        } catch (error) {
          throw new Error(
            `Required search-feed font failed to load: ${required.family} ${required.style} ${required.weight}`,
            { cause: error }
          );
        }
        if (
          loaded.length === 0 ||
          !document.fonts.check(required.descriptor, required.text) ||
          loaded.some((font) => font.status !== "loaded")
        ) {
          throw new Error(
            `Required search-feed font is unavailable: ${required.family} ${required.style} ${required.weight}`
          );
        }
        fonts.push(
          ...loaded.map((font) => ({
            family: font.family.replaceAll('"', ""),
            style: font.style,
            weight: font.weight,
            status: font.status,
          }))
        );
      }

      const images = Array.from(root.querySelectorAll("img"));
      const decoded = await Promise.allSettled(
        images.map((image) => image.decode())
      );

      const failedImages = images.filter(
        (image, index) =>
          decoded[index].status === "rejected" ||
          !image.complete ||
          image.naturalWidth === 0
      );
      if (failedImages.length > 0) {
        throw new Error(
          `Search-feed image decoding failed: ${failedImages
            .map((image) => image.currentSrc || image.src)
            .join(", ")}`
        );
      }

      return {
        deviceScaleFactor: window.devicePixelRatio,
        fonts,
        images: images.map((image) => ({
          src: image.currentSrc || image.src,
          naturalWidth: image.naturalWidth,
          naturalHeight: image.naturalHeight,
        })),
      };
    },
    { rootSelector: selector, requiredFonts: REQUIRED_FONT_LOADS }
  );
}
