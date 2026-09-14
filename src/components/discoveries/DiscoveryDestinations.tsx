import Image from "next/image";
import Link from "next/link";

import { PRODUCT_NAME } from "@/lib/brand";
import { ACCENT_BY_ACCESS_MODE, ACCESS_MODES } from "@/lib/hubs/moduleRegistry";
import { discoveriesCopy } from "@/lib/i18n/copy/discoveries";
import { getLocalizedRoute } from "@/lib/routing";
import { getTranslation } from "@/lib/translations";
import { cn } from "@/lib/utils";
import type { Language } from "@/types/shared";

import styles from "./DiscoveryDestinations.module.css";

const HUB_ROUTE = {
  atlas: "atlasHub",
  dossiers: "dossiersHub",
  jeux: "jeuxHub",
} as const;

interface DiscoveryDestinationsProps {
  language: Language;
  className?: string;
}

/**
 * The way out of a reading that draws no masthead: the brand back to the
 * home, the three axes the header names, and Découvertes as the place the
 * reader is. Rendered twice by the reader — a rail from 1200 px, rows in the
 * Parcourir sheet below — so both surfaces name the same doors.
 */
// @req REQ-156
export function DiscoveryDestinations({
  language,
  className,
}: DiscoveryDestinationsProps) {
  const hubs = getTranslation(language).hubs;
  const words = discoveriesCopy[language];

  return (
    <nav
      aria-label={words.browse}
      className={cn(styles.destinations, className)}
    >
      <Link href={`/${language}`} className={styles.brand}>
        <Image src="/africa.png" alt="" width={32} height={32} />
        <span>{PRODUCT_NAME}</span>
      </Link>
      <ul className={styles.list}>
        {ACCESS_MODES.map((axis) => (
          <li key={axis} className={ACCENT_BY_ACCESS_MODE[axis]}>
            <Link
              href={getLocalizedRoute(language, HUB_ROUTE[axis])}
              className={styles.destination}
            >
              <span className={styles.seed} aria-hidden="true" />
              {hubs[axis].title}
            </Link>
          </li>
        ))}
        <li>
          <Link
            href={getLocalizedRoute(language, "discoveries")}
            aria-current="page"
            className={styles.destination}
          >
            {/* Neutral, as in the masthead: a hue in this list teaches an axis. */}
            <span
              className={cn(styles.seed, styles.seedNeutral)}
              aria-hidden="true"
            />
            {words.title}
          </Link>
        </li>
      </ul>
    </nav>
  );
}
