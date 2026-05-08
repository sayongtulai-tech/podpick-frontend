import { NextResponse } from "next/server";
import {
  backendUnavailable,
  buildBackendUrl,
  callBackend,
  mapBackendError,
  requireAuthenticatedUser,
} from "../_shared";

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } },
) {
  const auth = await requireAuthenticatedUser();
  if (!auth.ok) return auth.response;

  try {
    const response = await callBackend({
      user: auth.user,
      url: buildBackendUrl(params.id),
      method: "DELETE",
    });

    if (!response.ok) {
      return mapBackendError(
        response,
        "BACKEND_DELETE_FAILED",
        "Failed to delete playlist.",
      );
    }

    return new NextResponse(null, { status: 204 });
  } catch {
    return backendUnavailable("플레이리스트를 삭제할 수 없습니다. 잠시 후 다시 시도해 주세요.");
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } },
) {
  const auth = await requireAuthenticatedUser();
  if (!auth.ok) return auth.response;

  try {
    const body = await request.json();
    const response = await callBackend({
      user: auth.user,
      url: buildBackendUrl(params.id),
      method: "PUT",
      body,
    });

    if (!response.ok) {
      return mapBackendError(
        response,
        "BACKEND_UPDATE_FAILED",
        "Failed to update playlist.",
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch {
    return backendUnavailable("플레이리스트를 수정할 수 없습니다. 잠시 후 다시 시도해 주세요.");
  }
}
