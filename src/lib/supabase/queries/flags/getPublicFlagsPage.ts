import { createServerClient } from "@/lib/supabase/server";
import {
  queryPublicFlagsPage,
  type PublicFlagsPage,
  type PublicFlagsPageOptions,
} from "@/lib/supabase/queries/flags/publicFlagsPageQuery";

export type {
  PublicFlagKind,
  PublicFlagsPage,
  PublicFlagsPageOptions,
  PublicFlagStatus,
  PublicFlagTargetType,
} from "@/lib/supabase/queries/flags/publicFlagsPageQuery";
export { isValidPublicFlagsCursor } from "@/lib/supabase/queries/flags/publicFlagsPageQuery";

// @req REQ-014
export async function getPublicFlagsPage(
  options: PublicFlagsPageOptions = {}
): Promise<PublicFlagsPage> {
  return queryPublicFlagsPage(createServerClient(), options);
}
