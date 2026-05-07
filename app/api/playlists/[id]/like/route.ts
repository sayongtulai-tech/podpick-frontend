import { NextResponse } from "next/server";

const BACKEND_PLAYLIST_URL =
  process.env.BACKEND_PLAYLIST_URL ?? "http://127.0.0.1:8080/api/playlists";

function buildLikeUrl(id: string) {
  const normalized = BACKEND_PLAYLIST_URL.endsWith("/")
    ? BACKEND_PLAYLIST_URL.slice(0, -1)
    : BACKEND_PLAYLIST_URL;
  return `${normalized}/${id}/like`;
}

async function parseErrorMessage(response: Response, fallback: string) {
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

async function increaseLike(
  _request: Request,
  { params }: { params: { id: string } },
) {
  try {
    const response = await fetch(buildLikeUrl(params.id), {
      method: "POST",
      cache: "no-store",
    });

    if (!response.ok) {
      const message = await parseErrorMessage(response, "Failed to increase like count.");
      return NextResponse.json({ message }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json(
      { message: "Cannot update like count now. Check backend status." },
      { status: 503 },
    );
  }
}

export async function POST(
  request: Request,
  context: { params: { id: string } },
) {
  return increaseLike(request, context);
}

export async function PATCH(
  request: Request,
  context: { params: { id: string } },
) {
  return increaseLike(request, context);
}
