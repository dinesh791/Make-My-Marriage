import { describe, expect, it } from "vitest";
import { weddingMemberSchema } from "../../../src/models/wedding-member";
import { weddingSchema } from "../../../src/models/wedding";
import { createWeddingSchema } from "../../../src/modules/wedding/wedding.validators";

describe("wedding data boundaries", () => {
  it("accepts required wedding details and an optional Maps URL", () => {
    const input = {
      title: "Dinesh & Usha Wedding",
      role: "BRIDE",
      weddingDate: "2027-01-20T00:00:00.000Z",
      venueName: "Sivan Mahal",
      venueAddress: "Salem, Tamil Nadu",
      mapsUrl: "https://maps.google.com/example",
    };
    expect(createWeddingSchema.parse(input)).toEqual(input);
    expect(createWeddingSchema.safeParse({ ...input, role: "ADMIN" }).success).toBe(false);
    expect(
      createWeddingSchema.safeParse({ ...input, mapsUrl: "javascript:alert(1)" }).success,
    ).toBe(false);
    expect(createWeddingSchema.parse({ ...input, status: "ARCHIVED" })).not.toHaveProperty(
      "status",
    );
  });

  it("declares one active wedding per account and one active member per role", () => {
    const indexes = weddingMemberSchema.indexes();
    expect(indexes).toContainEqual([
      { userId: 1 },
      expect.objectContaining({ unique: true, partialFilterExpression: { status: "ACTIVE" } }),
    ]);
    expect(indexes).toContainEqual([
      { weddingId: 1, role: 1 },
      expect.objectContaining({ unique: true, partialFilterExpression: { status: "ACTIVE" } }),
    ]);
    expect(weddingSchema.indexes()).toContainEqual([
      { slug: 1 },
      expect.objectContaining({ unique: true }),
    ]);
  });
});
