import { z } from "zod";
import { getAuthEnv } from "@/lib/env/env";
import { AppError } from "./errors";

export function requireSameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  const expected = new URL(getAuthEnv().NEXT_PUBLIC_APP_URL).origin;
  if (origin !== expected || request.headers.get("sec-fetch-site") === "cross-site") {
    throw new AppError(
      "AUTH_ORIGIN_INVALID",
      "Please submit this request from the application.",
      403,
    );
  }
}

export async function readAuthJson<T extends z.ZodType>(
  request: Request,
  schema: T,
): Promise<z.output<T>> {
  if (request.headers.get("content-type")?.split(";")[0].trim() !== "application/json") {
    throw new AppError("CONTENT_TYPE_INVALID", "Send an application/json request.", 415);
  }
  const maxBytes = 8192;
  const reader = request.body?.getReader();
  if (!reader) throw new AppError("REQUEST_INVALID", "A JSON request body is required.", 400);
  const chunks: Uint8Array[] = [];
  let total = 0;
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > maxBytes) {
        await reader.cancel();
        throw new AppError("REQUEST_TOO_LARGE", "Request body is too large.", 413);
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  let data: unknown;
  try {
    data = JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    throw new AppError("REQUEST_INVALID", "Invalid JSON request body.", 400);
  }
  const parsed = schema.safeParse(data);
  if (!parsed.success) {
    throw new AppError(
      "VALIDATION_ERROR",
      "Please check the form fields.",
      422,
      z.flattenError(parsed.error).fieldErrors,
    );
  }
  return parsed.data;
}
