import { describe, expect, it } from "vitest";
import { cateringSchema } from "../../../src/modules/catering/catering.validators";

describe("catering request validation", () => {
  it("accepts optional contacts and normalizes an unfinished menu", () => {
    const plan = cateringSchema.parse({ breakfast: "  Idli\nPongal  ", email: "  " });
    expect(plan.breakfast).toBe("Idli\nPongal");
    expect(plan.email).toBe("");
    expect(plan.lunch).toBe("");
  });
  it("rejects oversized menus and invalid contact or food values", () => {
    for (const input of [
      { lunch: "a".repeat(2001) },
      { email: "invalid" },
      { foodType: "OTHER" },
    ]) {
      expect(cateringSchema.safeParse(input).success).toBe(false);
    }
  });
  it("does not accept wedding ownership fields from clients", () => {
    expect(
      cateringSchema.parse({ weddingId: "another-wedding", deletedAt: new Date() }),
    ).not.toHaveProperty("weddingId");
    expect(cateringSchema.parse({ deletedAt: new Date() })).not.toHaveProperty("deletedAt");
  });
});
