"use client";

import { FormEvent, useEffect, useState } from "react";
import { Playlist } from "@/types/playlist";
import { isKnownEmotion, type EmotionOnly } from "@/lib/emotions";

type UsePlaylistCrudParams = {
  session: unknown;
  refreshPlaylists: () => Promise<void>;
};

export function usePlaylistCrud({ session, refreshPlaylists }: UsePlaylistCrudParams) {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [title, setTitle] = useState("");
  const [emotion, setEmotion] = useState<EmotionOnly>("새벽감성");
  const [musicUrl, setMusicUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editEmotion, setEditEmotion] = useState<EmotionOnly>("새벽감성");
  const [editMusicUrl, setEditMusicUrl] = useState("");
  const [savingId, setSavingId] = useState<number | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 1800);
    return () => window.clearTimeout(timer);
  }, [toast]);

  function requireSession(): boolean {
    if (!session) {
      setToast("로그인이 필요한 기능이에요 😊");
      return false;
    }
    return true;
  }

  function toggleCreateForm() {
    if (!requireSession()) return;
    setShowCreateForm((prev) => !prev);
  }

  async function handleCreatePlaylist(event: FormEvent) {
    event.preventDefault();
    if (!requireSession()) return;
    if (!title.trim()) {
      setCreateError("플레이리스트 제목을 입력해 주세요.");
      return;
    }

    setCreateError(null);
    setSubmitting(true);
    try {
      const payload = {
        title: title.trim(),
        emotion,
        musicUrl: musicUrl.trim(),
      };
      const response = await fetch("/api/playlists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const errorData = (await response.json().catch(() => null)) as { message?: string } | null;
        throw new Error(errorData?.message ?? "플레이리스트를 추가하지 못했습니다.");
      }

      setTitle("");
      setEmotion("새벽감성");
      setMusicUrl("");
      setShowCreateForm(false);
      await refreshPlaylists();
    } catch (e) {
      setCreateError(e instanceof Error ? e.message : "오류가 발생했습니다.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleLike(id: number) {
    if (!requireSession()) return;
    await fetch(`/api/playlists/${id}/like`, { method: "PATCH" });
    await refreshPlaylists();
  }

  async function handleSaveCount(id: number) {
    if (!requireSession()) return;
    await fetch(`/api/playlists/${id}/save`, { method: "PATCH" });
    await refreshPlaylists();
  }

  function startEdit(item: Playlist) {
    if (!requireSession()) return;
    setEditingId(item.id);
    setEditTitle(item.title);
    const em = isKnownEmotion(item.emotion) ? item.emotion : "새벽감성";
    setEditEmotion(em);
    setEditMusicUrl(item.musicUrl ?? "");
  }

  function cancelEdit() {
    setEditingId(null);
    setEditTitle("");
    setEditMusicUrl("");
  }

  async function saveEdit() {
    if (editingId == null || !requireSession()) return;
    if (!editTitle.trim()) {
      setToast("제목을 입력해 주세요.");
      return;
    }
    setSavingId(editingId);
    try {
      const response = await fetch(`/api/playlists/${editingId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: editTitle.trim(),
          emotion: editEmotion,
          musicUrl: editMusicUrl.trim(),
        }),
      });
      if (!response.ok) {
        const err = (await response.json().catch(() => null)) as { message?: string } | null;
        throw new Error(err?.message ?? "수정에 실패했습니다.");
      }
      cancelEdit();
      await refreshPlaylists();
    } catch (e) {
      setToast(e instanceof Error ? e.message : "수정 오류");
    } finally {
      setSavingId(null);
    }
  }

  async function confirmDelete() {
    if (deleteTargetId == null || !requireSession()) return;
    setDeleting(true);
    try {
      const response = await fetch(`/api/playlists/${deleteTargetId}`, { method: "DELETE" });
      if (!response.ok && response.status !== 204) {
        const err = (await response.json().catch(() => null)) as { message?: string } | null;
        throw new Error(err?.message ?? "삭제에 실패했습니다.");
      }
      if (editingId === deleteTargetId) cancelEdit();
      setDeleteTargetId(null);
      await refreshPlaylists();
    } catch (e) {
      setToast(e instanceof Error ? e.message : "삭제 오류");
    } finally {
      setDeleting(false);
    }
  }

  return {
    showCreateForm,
    setShowCreateForm,
    toggleCreateForm,
    title,
    setTitle,
    emotion,
    setEmotion,
    musicUrl,
    setMusicUrl,
    submitting,
    createError,
    toast,
    setToast,
    editingId,
    editTitle,
    setEditTitle,
    editEmotion,
    setEditEmotion,
    editMusicUrl,
    setEditMusicUrl,
    savingId,
    deleteTargetId,
    setDeleteTargetId,
    deleting,
    handleCreatePlaylist,
    handleLike,
    handleSaveCount,
    startEdit,
    cancelEdit,
    saveEdit,
    confirmDelete,
    requireSession,
  };
}
