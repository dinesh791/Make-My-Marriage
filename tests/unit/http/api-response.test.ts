import { describe, expect, it } from "vitest";
import { errorResponse, successResponse } from "../../../src/lib/http/api-response";

describe("API response helpers", () => {
  it("creates the approved success envelope", async () => {
    const response = successResponse({ status: "ok" }, "API is healthy");
    await expect(response.json()).resolves.toEqual({
      success: true,
      data: { status: "ok" },
      message: "API is healthy",
    });
  });
  it("creates the approved error envelope", async () => {
    const response = errorResponse("NOT_FOUND", "Not found", 404);
    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({
      success: false,
      error: { code: "NOT_FOUND", message: "Not found", details: null },
    });
  });
});
