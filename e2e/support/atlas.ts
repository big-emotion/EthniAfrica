import { expect, type Locator, type Page } from "@playwright/test";

type ActivationMethod = "keyboard" | "pointer";

/**
 * Opens the fiche's map band (closed on arrival), activates the opt-in
 * interactive globe and waits for its stage.
 */
export async function activateFicheGlobe(
  page: Page,
  method: ActivationMethod = "pointer"
): Promise<Locator> {
  await page.getByRole("button", { name: "Voir la carte" }).click();
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
