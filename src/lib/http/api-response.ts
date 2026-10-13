import { NextResponse } from "next/server";

export type ApiSuccess<T> = { success: true; data: T; message: string | null };
export type ApiFailure = {
  success: false;
  error: { code: string; message: string; details: unknown | null };
};

export function successResponse<T>(data: T, message: string | null = null, status = 200) {
  return NextResponse.json<ApiSuccess<T>>({ success: true, data, message }, { status });
}

export function errorResponse(
  code: string,
  message: string,
  status: number,
  details: unknown | null = null,
) {
  return NextResponse.json<ApiFailure>(
    { success: false, error: { code, message, details } },
    { status },
  );
}
