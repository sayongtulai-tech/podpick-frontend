"use client";

import { FormEvent, Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { usePlayer } from "@/components/player/PlayerProvider";
import { Playlist } from "@/types/playlist";
import { useSession } from "next-auth/react";
import {
  EMOTIONS,
  EMOTION_ONLY,
  EMOTION_INTRO_CHIP_CLASS,
  emotionFilterChipClass,
  isKnownEmotion,
  type EmotionFilter,
  type EmotionOnly,
} from "@/lib/emotions";

const SORT_OPTIONS = ["최신순", "오래된순", "제목순", "좋아요순", "저장순"] as const;

function HomePageContent() {
  const { data: session } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { playlists, loading, error, playPlaylist, refreshPlaylists } = usePlayer();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [title, setTitle] = useState("");
  const [emotion, setEmotion] = useState<EmotionOnly>("새벽감성");
  const [musicUrl, setMusicUrl] = useState("");
  const [keyword, setKeyword] = useState("");
  const [sortOption, setSortOption] = useState<(typeof SORT_OPTIONS)[number]>("최신순");
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

  /** URL이 단일 소스 — 로컬 상태와 불일치 방지 */
  const emotionFilter = useMemo((): EmotionFilter => {
    const raw = searchParams.get("emotion");
    if (!raw) return "전체";
    return (EMOTIONS as readonly string[]).includes(raw) ? (raw as EmotionFilter) : "전체";
  }, [searchParams]);

  function applyEmotionFilter(tab: EmotionFilter) {
    const params = new URLSearchParams(searchParams.toString());
    if (tab === "전체") {
      params.delete("emotion");
    } else {
      params.set("emotion", tab);
    }
    const qs = params.toString();
    router.push(qs ? `/?${qs}` : "/", { scroll: false });
  }

  const topLiked = useMemo(
    () => [...playlists].sort((a, b) => (b.likeCount ?? 0) - (a.likeCount ?? 0)).slice(0, 6),
    [playlists]
  );

  const filteredPlaylists = useMemo(() => {
    const q = keyword.trim().toLowerCase();
    const filtered = playlists.filter((item) => {
      const byEmotion = emotionFilter === "전체" || item.emotion === emotionFilter;
      const byKeyword =
        q.length === 0 ||
        item.title.toLowerCase().includes(q) ||
        item.emotion.toLowerCase().includes(q);
      return byEmotion && byKeyword;
    });

    const sorted = [...filtered];
    if (sortOption === "최신순") sorted.sort((a, b) => b.id - a.id);
    if (sortOption === "오래된순") sorted.sort((a, b) => a.id - b.id);
    if (sortOption === "제목순") sorted.sort((a, b) => a.title.localeCompare(b.title, "ko"));
    if (sortOption === "좋아요순") sorted.sort((a, b) => (b.likeCount ?? 0) - (a.likeCount ?? 0));
    if (sortOption === "저장순") sorted.sort((a, b) => (b.savedCount ?? 0) - (a.savedCount ?? 0));
    return sorted;
  }, [playlists, keyword, emotionFilter, sortOption]);

  function requireSession(): boolean {
    if (!session) {
      setToast("로그인이 필요한 기능이에요 😊");
      return false;
    }
    return true;
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

  return (
    <div className="space-y-5">
      <section className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
        <h1 className="text-2xl font-black text-white md:text-3xl">
          지금 기분에 맞는{" "}
          <span className="bg-gradient-to-r from-violet-300 to-pink-300 bg-clip-text text-transparent">
            PodPick
          </span>
        </h1>
        <p className="mt-2 text-sm text-slate-300">감정으로 음악을 고르고, 사람들이 만든 플레이리스트를 발견하세요.</p>
      </section>

      <section className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
        <h2 className="text-lg font-bold text-white">인기 플레이리스트</h2>
        {loading ? (
          <p className="mt-3 text-sm text-slate-400">불러오는 중...</p>
        ) : error ? (
          <p className="mt-3 text-sm text-rose-300">{error}</p>
        ) : topLiked.length === 0 ? (
          <div className="mt-4 rounded-2xl border border-dashed border-white/15 bg-white/[0.02] px-6 py-10 text-center">
            <p className="text-3xl">🎵</p>
            <p className="mt-2 text-sm text-slate-400">아직 플레이리스트가 없어요</p>
            <p className="mt-1 text-xs text-slate-500">첫 플레이리스트를 만들어 보세요</p>
          </div>
        ) : (
          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {topLiked.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => playPlaylist(item)}
                className="rounded-xl border border-white/10 bg-[#16162a] p-4 text-left shadow-sm transition-all duration-300 ease-out hover:-translate-y-0.5 hover:border-violet-400/45 hover:bg-[#1a1a31] hover:shadow-lg hover:shadow-violet-950/40 active:scale-[0.99]"
              >
                <p className="truncate text-sm font-semibold text-white">{item.title}</p>
                <p className="mt-1 text-xs text-slate-400">{item.emotion}</p>
                <p className="mt-2 text-xs text-slate-300">
                  좋아요 {item.likeCount ?? 0} · 저장 {item.savedCount ?? 0}
                </p>
              </button>
            ))}
          </div>
        )}
      </section>

      <section id="playlist-manage" className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 scroll-mt-24">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-bold text-white">플레이리스트 관리</h2>
          <button
            type="button"
            onClick={() => {
              if (!session) {
                setToast("로그인이 필요한 기능이에요 😊");
                return;
              }
              setShowCreateForm((prev) => !prev);
            }}
            className="btn-press min-h-[44px] rounded-lg bg-gradient-to-r from-violet-500 to-pink-500 px-4 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60 md:min-h-0 md:py-2"
            disabled={!session}
          >
            {showCreateForm ? "폼 닫기" : "플레이리스트 추가"}
          </button>
        </div>

        {showCreateForm && (
          <form onSubmit={handleCreatePlaylist} className="mt-4 grid gap-2 rounded-xl border border-white/10 bg-[#16162a] p-4 md:grid-cols-4">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="제목"
              className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none placeholder:text-slate-500"
            />
            <select
              value={emotion}
              onChange={(e) => setEmotion(e.target.value as EmotionOnly)}
              className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none"
            >
              {EMOTION_ONLY.map((item) => (
                <option key={item} value={item} className="bg-[#16162a]">
                  {item}
                </option>
              ))}
            </select>
            <input
              value={musicUrl}
              onChange={(e) => setMusicUrl(e.target.value)}
              placeholder="음악 URL (선택)"
              className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none placeholder:text-slate-500"
            />
            <button
              type="submit"
              disabled={submitting}
              className="rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-sm font-semibold text-white disabled:opacity-60"
            >
              {submitting ? "추가 중..." : "추가하기"}
            </button>
            {createError && <p className="md:col-span-4 text-xs text-rose-300">{createError}</p>}
          </form>
        )}

        <div className="mt-4 flex flex-wrap items-center gap-2">
          {EMOTIONS.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => applyEmotionFilter(tab)}
              className={emotionFilterChipClass(tab, emotionFilter === tab)}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="mt-3 grid gap-2 md:grid-cols-[1fr_180px]">
          <input
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="제목/감정 검색"
            className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none placeholder:text-slate-500"
          />
          <select
            value={sortOption}
            onChange={(e) => setSortOption(e.target.value as (typeof SORT_OPTIONS)[number])}
            className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none"
          >
            {SORT_OPTIONS.map((option) => (
              <option key={option} value={option} className="bg-[#16162a]">
                {option}
              </option>
            ))}
          </select>
        </div>

        <div className="mt-4 hidden overflow-x-auto rounded-xl border border-white/10 md:block">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="bg-white/5 text-xs uppercase tracking-wide text-slate-400">
              <tr>
                <th className="px-4 py-3">제목</th>
                <th className="px-4 py-3">감정</th>
                <th className="px-4 py-3">좋아요</th>
                <th className="px-4 py-3">저장</th>
                <th className="px-4 py-3">액션</th>
              </tr>
            </thead>
            <tbody>
              {filteredPlaylists.map((item: Playlist) => {
                const isEditing = editingId === item.id;
                return (
                  <tr key={item.id} className="border-t border-white/10 align-top transition-colors hover:bg-violet-500/10">
                    <td className="px-4 py-4 font-medium text-white">
                      {isEditing ? (
                        <input
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          className="w-full min-w-[120px] rounded border border-white/20 bg-white/10 px-2 py-1 text-sm text-white outline-none"
                        />
                      ) : (
                        item.title
                      )}
                    </td>
                    <td className="px-4 py-4 text-slate-300">
                      {isEditing ? (
                        <select
                          value={editEmotion}
                          onChange={(e) =>
                            setEditEmotion(e.target.value as EmotionOnly)
                          }
                          className="w-full rounded border border-white/20 bg-white/10 px-2 py-1 text-sm text-white outline-none"
                        >
                          {EMOTION_ONLY.map((opt) => (
                            <option key={opt} value={opt} className="bg-[#16162a]">
                              {opt}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <span
                          className={`inline-flex max-w-full truncate rounded-full border px-2 py-0.5 text-xs font-medium ${
                            EMOTION_INTRO_CHIP_CLASS[item.emotion] ??
                            "border-white/15 bg-white/10 text-slate-200"
                          }`}
                        >
                          {item.emotion}
                        </span>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-4 py-4 text-slate-300">{item.likeCount ?? 0}</td>
                    <td className="whitespace-nowrap px-4 py-4 text-slate-300">{item.savedCount ?? 0}</td>
                    <td className="px-4 py-4">
                      {isEditing ? (
                        <div className="flex flex-col gap-2">
                          <input
                            value={editMusicUrl}
                            onChange={(e) => setEditMusicUrl(e.target.value)}
                            placeholder="음악 URL"
                            className="w-full max-w-[220px] rounded border border-white/20 bg-white/10 px-2 py-1 text-xs text-white outline-none placeholder:text-slate-500"
                          />
                          <div className="flex flex-wrap gap-1">
                            <button
                              type="button"
                              onClick={saveEdit}
                              disabled={savingId === item.id}
                              className="rounded-md border border-emerald-300/50 bg-emerald-500/20 px-2 py-1 text-xs text-emerald-100 disabled:opacity-60"
                            >
                              {savingId === item.id ? "저장 중..." : "저장"}
                            </button>
                            <button
                              type="button"
                              onClick={cancelEdit}
                              className="rounded-md border border-white/20 bg-white/10 px-2 py-1 text-xs text-slate-200"
                            >
                              취소
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-wrap gap-1.5">
                          <button
                            type="button"
                            onClick={() => playPlaylist(item)}
                            className="btn-press max-md:min-h-[44px] max-md:min-w-[44px] max-md:px-3 rounded-md border border-violet-300/40 bg-violet-500/20 px-2 py-1 text-xs text-violet-100 md:min-h-0 md:min-w-0"
                          >
                            재생
                          </button>
                          <button
                            type="button"
                            onClick={() => handleLike(item.id)}
                            disabled={!session}
                            className="btn-press max-md:min-h-[44px] max-md:min-w-[44px] rounded-md border border-pink-300/40 bg-pink-500/20 px-2 py-1 text-xs text-pink-100 disabled:cursor-not-allowed disabled:opacity-60 md:min-h-0 md:min-w-0"
                          >
                            ❤️
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSaveCount(item.id)}
                            disabled={!session}
                            className="btn-press max-md:min-h-[44px] max-md:min-w-[44px] rounded-md border border-emerald-300/40 bg-emerald-500/20 px-2 py-1 text-xs text-emerald-100 disabled:cursor-not-allowed disabled:opacity-60 md:min-h-0 md:min-w-0"
                          >
                            📌
                          </button>
                          <button
                            type="button"
                            onClick={() => startEdit(item)}
                            disabled={!session}
                            className="btn-press max-md:min-h-[44px] max-md:min-w-[44px] rounded-md border border-amber-300/40 bg-amber-500/15 px-2 py-1 text-xs text-amber-100 disabled:cursor-not-allowed disabled:opacity-60 md:min-h-0 md:min-w-0"
                            title="수정"
                          >
                            ✏️
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (!requireSession()) return;
                              setDeleteTargetId(item.id);
                            }}
                            disabled={!session}
                            className="btn-press max-md:min-h-[44px] max-md:min-w-[44px] rounded-md border border-rose-400/40 bg-rose-500/15 px-2 py-1 text-xs text-rose-200 disabled:cursor-not-allowed disabled:opacity-60 md:min-h-0 md:min-w-0"
                            title="삭제"
                          >
                            🗑️
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {!loading && filteredPlaylists.length === 0 && (
            <div className="px-4 py-10 text-center">
              <p className="text-2xl">🔍</p>
              <p className="mt-2 text-sm text-slate-400">조건에 맞는 플레이리스트가 없습니다.</p>
              <p className="mt-1 text-xs text-slate-500">필터나 검색어를 바꿔 보세요</p>
            </div>
          )}
        </div>

        <div className="mt-4 space-y-3 md:hidden">
          {filteredPlaylists.map((item: Playlist) => {
            const isEditing = editingId === item.id;
            return (
              <div
                key={item.id}
                className="rounded-xl border border-white/10 bg-[#16162a] p-4 shadow-sm transition-all duration-300 hover:border-violet-400/35 hover:shadow-md hover:shadow-black/20"
              >
                {isEditing ? (
                  <div className="space-y-3">
                    <input
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      className="w-full rounded border border-white/20 bg-white/10 px-3 py-2 text-sm text-white outline-none"
                    />
                    <select
                      value={editEmotion}
                      onChange={(e) => setEditEmotion(e.target.value as EmotionOnly)}
                      className="w-full rounded border border-white/20 bg-white/10 px-3 py-2 text-sm text-white outline-none"
                    >
                      {EMOTION_ONLY.map((opt) => (
                        <option key={opt} value={opt} className="bg-[#16162a]">
                          {opt}
                        </option>
                      ))}
                    </select>
                    <input
                      value={editMusicUrl}
                      onChange={(e) => setEditMusicUrl(e.target.value)}
                      placeholder="음악 URL"
                      className="w-full rounded border border-white/20 bg-white/10 px-3 py-2 text-xs text-white outline-none placeholder:text-slate-500"
                    />
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={saveEdit}
                        disabled={savingId === item.id}
                        className="btn-press min-h-[44px] flex-1 rounded-lg border border-emerald-300/50 bg-emerald-500/20 px-3 text-sm text-emerald-100 disabled:opacity-60"
                      >
                        {savingId === item.id ? "저장 중..." : "저장"}
                      </button>
                      <button
                        type="button"
                        onClick={cancelEdit}
                        className="btn-press min-h-[44px] flex-1 rounded-lg border border-white/20 bg-white/10 px-3 text-sm text-slate-200"
                      >
                        취소
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex flex-col gap-2">
                      <p className="font-semibold text-white">{item.title}</p>
                      <span
                        className={`inline-flex w-fit max-w-full truncate rounded-full border px-2.5 py-1 text-xs font-medium ${
                          EMOTION_INTRO_CHIP_CLASS[item.emotion] ??
                          "border-white/15 bg-white/10 text-slate-200"
                        }`}
                      >
                        {item.emotion}
                      </span>
                      <p className="text-xs text-slate-500">
                        좋아요 {item.likeCount ?? 0} · 저장 {item.savedCount ?? 0}
                      </p>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => playPlaylist(item)}
                        className="btn-press min-h-[44px] flex-1 rounded-lg border border-violet-300/40 bg-violet-500/25 px-3 text-sm font-medium text-violet-100"
                      >
                        재생
                      </button>
                      <button
                        type="button"
                        onClick={() => handleLike(item.id)}
                        disabled={!session}
                        className="btn-press flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg border border-pink-300/40 bg-pink-500/20 text-lg disabled:opacity-60"
                      >
                        ❤️
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSaveCount(item.id)}
                        disabled={!session}
                        className="btn-press flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg border border-emerald-300/40 bg-emerald-500/20 text-lg disabled:opacity-60"
                      >
                        📌
                      </button>
                      <button
                        type="button"
                        onClick={() => startEdit(item)}
                        disabled={!session}
                        className="btn-press flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg border border-amber-300/40 bg-amber-500/15 text-lg disabled:opacity-60"
                        title="수정"
                      >
                        ✏️
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (!requireSession()) return;
                          setDeleteTargetId(item.id);
                        }}
                        disabled={!session}
                        className="btn-press flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg border border-rose-400/40 bg-rose-500/15 text-lg disabled:opacity-60"
                        title="삭제"
                      >
                        🗑️
                      </button>
                    </div>
                  </>
                )}
              </div>
            );
          })}
          {!loading && filteredPlaylists.length === 0 && (
            <div className="rounded-2xl border border-dashed border-white/15 bg-white/[0.02] px-6 py-12 text-center">
              <p className="text-2xl">🔍</p>
              <p className="mt-2 text-sm text-slate-400">조건에 맞는 플레이리스트가 없습니다.</p>
              <p className="mt-1 text-xs text-slate-500">필터나 검색어를 바꿔 보세요</p>
            </div>
          )}
        </div>
      </section>

      {toast && (
        <div className="fixed bottom-[calc(11rem+env(safe-area-inset-bottom,0px))] right-4 z-40 max-md:bottom-[calc(13rem+env(safe-area-inset-bottom,0px))] md:bottom-24 rounded-lg border border-white/15 bg-[#1b1b30] px-4 py-2 text-sm text-slate-100 shadow-xl">
          {toast}
        </div>
      )}

      {deleteTargetId != null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-white/15 bg-[#1a1a2e] p-6 shadow-xl">
            <p className="text-lg font-bold text-white">플레이리스트 삭제</p>
            <p className="mt-2 text-sm text-slate-300">정말 삭제할까요? 이 작업은 되돌릴 수 없습니다.</p>
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeleteTargetId(null)}
                disabled={deleting}
                className="rounded-lg border border-white/20 px-4 py-2 text-sm font-medium text-slate-200 hover:bg-white/10 disabled:opacity-50"
              >
                취소
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                disabled={deleting}
                className="rounded-lg bg-gradient-to-r from-rose-500 to-rose-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
              >
                {deleting ? "삭제 중..." : "삭제"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function HomePage() {
  return (
    <Suspense fallback={<div className="rounded-2xl border border-white/10 bg-white/[0.04] p-10 text-center text-slate-400">불러오는 중...</div>}>
      <HomePageContent />
    </Suspense>
  );
}
