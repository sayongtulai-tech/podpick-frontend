import { NextResponse } from "next/server";

const BACKEND_PLAYLIST_URL =
  process.env.BACKEND_PLAYLIST_URL ?? "http://127.0.0.1:8080/api/playlists";

function buildDeleteUrl(id: string) {
  const normalized = BACKEND_PLAYLIST_URL.endsWith("/")
    ? BACKEND_PLAYLIST_URL.slice(0, -1)
    : BACKEND_PLAYLIST_URL;
  return `${normalized}/${id}`;
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

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } },
) {
  const targetUrl = buildDeleteUrl(params.id);
  try {
    const response = await fetch(targetUrl, {
      method: "DELETE",
      cache: "no-store",
    });

    if (!response.ok) {
      const message = await parseErrorMessage(response, "Failed to delete playlist.");
      return NextResponse.json({ message }, { status: response.status });
    }

    return new NextResponse(null, { status: 204 });
  } catch {
    return NextResponse.json(
      { message: "Cannot delete playlist now. Check backend status." },
      { status: 503 },
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } },
) {
  const targetUrl = buildDeleteUrl(params.id);
  try {
    const body = await request.json();
    const response = await fetch(targetUrl, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      cache: "no-store",
    });

    if (!response.ok) {
      const message = await parseErrorMessage(response, "Failed to update playlist.");
      return NextResponse.json({ message }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json(
      { message: "Cannot update playlist now. Check backend status." },
      { status: 503 },
    );
  }
}
