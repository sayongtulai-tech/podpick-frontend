import { NextResponse } from "next/server";

const BACKEND_URL =
  process.env.BACKEND_PLAYLIST_URL ?? "http://127.0.0.1:8080/api/playlists";

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

export async function GET() {
  try {
    const response = await fetch(BACKEND_URL, { cache: "no-store" });
    if (!response.ok) {
      const message = await parseErrorMessage(response, "Failed to fetch playlists from backend.");
      return NextResponse.json(
        { message },
        { status: response.status },
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json(
      { message: "Backend is not reachable. Start Spring Boot server first." },
      { status: 503 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const response = await fetch(BACKEND_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      cache: "no-store",
    });

    if (!response.ok) {
      const message = await parseErrorMessage(response, "Failed to create playlist.");
      return NextResponse.json(
        { message },
        { status: response.status },
      );
    }

    const data = await response.json();
    return NextResponse.json(data, { status: 201 });
  } catch {
    return NextResponse.json(
      { message: "Cannot create playlist now. Check backend status." },
      { status: 503 },
    );
  }
}
