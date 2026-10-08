import { redirect } from "next/navigation";
import { FALLBACK_LOCALE } from "@/lib/locale";

// The middleware answers `/` first; this covers a render it did not front.
// @req REQ-140
export default function Home() {
  redirect(`/${FALLBACK_LOCALE}`);
}
