import { NextResponse } from "next/server";
import {
  backendUnavailable,
  buildBackendUrl,
  callBackend,
  mapBackendError,
  requireAuthenticatedUser,
} from "../../_shared";

async function increaseSaved(
  _request: Request,
  { params }: { params: { id: string } },
) {
  const auth = await requireAuthenticatedUser();
  if (!auth.ok) return auth.response;

  try {
    const response = await callBackend({
      user: auth.user,
      url: buildBackendUrl(params.id, "save"),
      method: "POST",
    });

    if (!response.ok) {
      return mapBackendError(
        response,
        "BACKEND_SAVE_FAILED",
        "Failed to increase saved count.",
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch {
    return backendUnavailable("저장 반영에 실패했습니다. 잠시 후 다시 시도해 주세요.");
  }
}

export async function POST(
  request: Request,
  context: { params: { id: string } },
) {
  return increaseSaved(request, context);
}

export async function PATCH(
  request: Request,
  context: { params: { id: string } },
) {
  return increaseSaved(request, context);
}
