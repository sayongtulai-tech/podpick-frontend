import { NextResponse } from "next/server";

function resolveBackendShareBase() {
  if (process.env.BACKEND_SHARE_URL) {
    return process.env.BACKEND_SHARE_URL;
  }
  const playlistBase = process.env.BACKEND_PLAYLIST_URL ?? "http://127.0.0.1:8080/api/playlists";
  const normalized = playlistBase.replace(/\/+$/, "");
  const replaced = normalized.replace(/\/api\/playlists$/i, "/api/share");
  if (replaced !== normalized) return replaced;
  return "http://127.0.0.1:8080/api/share";
}

function buildShareUrl(shareId: string) {
  const base = resolveBackendShareBase().replace(/\/+$/, "");
  return `${base}/${encodeURIComponent(shareId.trim())}`;
}

export async function GET(
  _request: Request,
  { params }: { params: { shareId: string } },
) {
  const shareId = params.shareId?.trim();
  if (!shareId) {
    return NextResponse.json(
      { code: "SHARE_ID_REQUIRED", message: "공유 ID가 필요합니다." },
      { status: 400 },
    );
  }

  try {
    const response = await fetch(buildShareUrl(shareId), {
      method: "GET",
      cache: "no-store",
    });
    const contentType = response.headers.get("content-type") ?? "";
    if (!response.ok) {
      let message = "공유 플레이리스트를 불러오지 못했습니다.";
      try {
        if (contentType.includes("application/json")) {
          const data = (await response.json()) as { message?: string; error?: string };
          message = data.message ?? data.error ?? message;
        } else {
          const text = await response.text();
          message = text || message;
        }
      } catch {}
      return NextResponse.json({ code: "SHARE_FETCH_FAILED", message }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json(
      { code: "BACKEND_UNAVAILABLE", message: "백엔드 연결에 실패했습니다." },
      { status: 503 },
    );
  }
}

