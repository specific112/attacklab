import { NextResponse } from "next/server";

export function success(data: unknown, status = 200) {
  return NextResponse.json({ success: true, data }, { status });
}

export function error(message: string, status = 400) {
  return NextResponse.json({ success: false, error: message }, { status });
}

export function unauthorized(message = "Authentication required") {
  return error(message, 401);
}

export function forbidden(message = "Insufficient permissions") {
  return error(message, 403);
}

export function notFound(message = "Resource not found") {
  return error(message, 404);
}

export function conflict(message: string) {
  return error(message, 409);
}

export function serverError(message = "Internal server error") {
  return error(message, 500);
}

export function rateLimited() {
  return error("Too many requests. Please try again later.", 429);
}
