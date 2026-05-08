import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const BACKEND_PLAYLIST_URL =
  process.env.BACKEND_PLAYLIST_URL ?? "http://127.0.0.1:8080/api/playlists";

export type AuthenticatedUser = {
  email: string;
};

export function jsonError(code: string, message: string, status: number) {
  return NextResponse.json({ code, message }, { status });
}

export async function parseErrorMessage(response: Response, fallback: string) {
  const contentType = response.headers.get("content-type") ?? "";
  try {
    if (contentType.includes("application/json")) {
      const data = (await response.json()) as { message?: string; error?: string };
      return data.message ?? data.error ?? fallback;
    }
    const text = await response.text();
    return text || fallback;
  } catch {
    return fallback;
  }
}

export async function requireAuthenticatedUser(): Promise<
  | { ok: true; user: AuthenticatedUser }
  | { ok: false; response: NextResponse }
> {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return {
      ok: false,
      response: jsonError("UNAUTHORIZED", "로그인이 필요합니다.", 401),
    };
  }

  const email = session.user.email?.trim();
  if (!email) {
    return {
      ok: false,
      response: jsonError("USER_IDENTIFIER_MISSING", "사용자 식별 정보(email)가 없습니다.", 403),
    };
  }

  return {
    ok: true,
    user: { email },
  };
}

export function buildBackendHeaders(
  user: AuthenticatedUser,
  init?: HeadersInit,
): Headers {
  const headers = new Headers(init);
  headers.set("x-user-email", user.email);
  // 백엔드에서 단일 식별자 헤더를 사용할 수 있도록 동일 값 제공
  headers.set("x-user-id", user.email);
  return headers;
}

function normalizeBackendBaseUrl() {
  return BACKEND_PLAYLIST_URL.endsWith("/")
    ? BACKEND_PLAYLIST_URL.slice(0, -1)
    : BACKEND_PLAYLIST_URL;
}

export function buildBackendUrl(...segments: Array<string | number>) {
  const base = normalizeBackendBaseUrl();
  if (!segments.length) return base;
  const safe = segments
    .map((s) => encodeURIComponent(String(s).trim()))
    .join("/");
  return `${base}/${safe}`;
}

type BackendCallOptions = {
  user: AuthenticatedUser;
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  url: string;
  body?: unknown;
};

export async function callBackend({
  user,
  url,
  method = "GET",
  body,
}: BackendCallOptions) {
  const hasBody = body !== undefined;
  return fetch(url, {
    method,
    cache: "no-store",
    headers: buildBackendHeaders(
      user,
      hasBody ? { "Content-Type": "application/json" } : undefined,
    ),
    body: hasBody ? JSON.stringify(body) : undefined,
  });
}

export async function mapBackendError(
  response: Response,
  code: string,
  fallbackMessage: string,
) {
  const message = await parseErrorMessage(response, fallbackMessage);
  return jsonError(code, message, response.status);
}

export function backendUnavailable(message: string) {
  return jsonError("BACKEND_UNAVAILABLE", message, 503);
}
