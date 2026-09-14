import { describe, it, expect } from "vitest";
import { loadPeople, loadAllPeoples } from "../peopleLoader";

/**
 * TDD Phase: RED
 * Test: People loader - reads people files from filesystem
 */
describe("People Loader", () => {
  describe("loadPeople", () => {
    it("should load a people by PPL_ ID", async () => {
      const result = await loadPeople("PPL_SHONA");

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.id).toBe("PPL_SHONA");
      expect(result.data?.nameMain).toBe("Shona");
    });

    it("should return error for non-existent people", async () => {
      const result = await loadPeople("PPL_NONEXISTENT");

      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
    });
  });

  describe("loadAllPeoples", () => {
    it("should load all people files", async () => {
      const peoples = await loadAllPeoples();

      expect(Array.isArray(peoples)).toBe(true);
      expect(peoples.length).toBeGreaterThan(0);

      // Should include Shona
      const shona = peoples.find((p) => p.id === "PPL_SHONA");
      expect(shona).toBeDefined();
    });
  });
});
