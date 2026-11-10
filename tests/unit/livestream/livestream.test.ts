import { describe, expect, it } from "vitest";
import { livestreamInputSchema } from "@/modules/livestream/livestream.validators";
import { livestreamSchema } from "@/models/livestream";

describe("livestream input", () => {
  it("accepts a secure external viewing link and trims the title", () => {
    expect(
      livestreamInputSchema.parse({
        title: "  Watch live  ",
        playbackUrl: "https://www.youtube.com/watch?v=abc",
        enabled: true,
      }).title,
    ).toBe("Watch live");
  });
  it("rejects insecure and credential-bearing links", () => {
    for (const playbackUrl of [
      "http://example.com/live",
      "javascript:alert(1)",
      "https://user:pass@example.com/live",
    ]) {
      expect(
        livestreamInputSchema.safeParse({ title: "Live", playbackUrl, enabled: true }).success,
      ).toBe(false);
    }
  });
  it("keeps one active stream per wedding without indexing deleted records", () => {
    expect(livestreamSchema.indexes()).toContainEqual([
      { weddingId: 1 },
      expect.objectContaining({
        name: "livestream_active_wedding_unique",
        unique: true,
        partialFilterExpression: { deletedAt: null },
      }),
    ]);
  });
});
