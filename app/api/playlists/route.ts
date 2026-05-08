import { NextResponse } from "next/server";
import {
  backendUnavailable,
  buildBackendUrl,
  callBackend,
  mapBackendError,
  requireAuthenticatedUser,
} from "./_shared";

export async function GET() {
  const auth = await requireAuthenticatedUser();
  if (!auth.ok) return auth.response;

  try {
    const response = await callBackend({
      user: auth.user,
      url: buildBackendUrl(),
    });
    if (!response.ok) {
      return mapBackendError(
        response,
        "BACKEND_FETCH_FAILED",
        "Failed to fetch playlists from backend.",
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch {
    return backendUnavailable("백엔드 연결에 실패했습니다. 잠시 후 다시 시도해 주세요.");
  }
}

export async function POST(request: Request) {
  const auth = await requireAuthenticatedUser();
  if (!auth.ok) return auth.response;

  try {
    const body = await request.json();
    const response = await callBackend({
      user: auth.user,
      url: buildBackendUrl(),
      method: "POST",
      body,
    });

    if (!response.ok) {
      return mapBackendError(
        response,
        "BACKEND_CREATE_FAILED",
        "Failed to create playlist.",
      );
    }

    const data = await response.json();
    return NextResponse.json(data, { status: 201 });
  } catch {
    return backendUnavailable("플레이리스트를 생성할 수 없습니다. 잠시 후 다시 시도해 주세요.");
  }
}
