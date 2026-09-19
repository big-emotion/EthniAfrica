import { expect, type Locator, type Page } from "@playwright/test";

type ActivationMethod = "keyboard" | "pointer";

/** Activates the fiche's opt-in interactive globe and waits for its stage. */
export async function activateFicheGlobe(
  page: Page,
  method: ActivationMethod = "pointer"
): Promise<Locator> {
  const activation = page.getByRole("button", {
    name: "Activer la carte interactive",
  });
  await expect(activation).toBeVisible();

  if (method === "keyboard") {
    await expect(activation).not.toHaveAttribute("tabindex", "-1");
    await activation.focus();
    await expect(activation).toBeFocused();
    await page.keyboard.press("Enter");
  } else {
    await activation.click();
  }

  const stage = page.locator("[data-atlas-stage]");
  await expect(stage).toBeVisible();
  return stage;
}
