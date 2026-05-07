"use client";

import { FormEvent, useMemo, useState } from "react";
import { signIn, signOut, useSession } from "next-auth/react";
import { usePlayer } from "@/components/player/PlayerProvider";

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const { playlists, refreshPlaylists } = usePlayer();
  const [editingId, setEditingId] = useState<number | null>(null);
  const [title, setTitle] = useState("");
  const [emotion, setEmotion] = useState("");
  const [musicUrl, setMusicUrl] = useState("");

  const stats = useMemo(
    () => ({
      added: playlists.length,
      likes: playlists.filter((p) => (p.likeCount ?? 0) > 0).length,
      saves: playlists.filter((p) => (p.savedCount ?? 0) > 0).length,
    }),
    [playlists]
  );

  if (status !== "authenticated" || !session?.user) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-8 text-center">
        <p className="text-3xl">👤</p>
        <p className="mt-3 text-lg font-bold text-white">프로필을 보려면 로그인해 주세요</p>
        <button
          type="button"
          onClick={() => signIn("google")}
          className="mt-5 rounded-xl bg-gradient-to-r from-violet-500 to-pink-500 px-5 py-2 text-sm font-bold text-white"
        >
          Google 로그인
        </button>
      </div>
    );
  }

  async function handleDelete(id: number) {
    await fetch(`/api/playlists/${id}`, { method: "DELETE" });
    await refreshPlaylists();
  }

  function beginEdit(item: { id: number; title: string; emotion: string; musicUrl: string | null }) {
    setEditingId(item.id);
    setTitle(item.title);
    setEmotion(item.emotion);
    setMusicUrl(item.musicUrl ?? "");
  }

  async function saveEdit(e: FormEvent) {
    e.preventDefault();
    if (!editingId) return;
    await fetch(`/api/playlists/${editingId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, emotion, musicUrl }),
    });
    setEditingId(null);
    await refreshPlaylists();
  }

  return (
    <div className="space-y-4">
      <section className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
        <div className="flex items-center gap-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={session.user.image ?? "https://placehold.co/80x80/png"}
            alt="profile"
            className="h-20 w-20 rounded-full object-cover"
          />
          <div>
            <p className="text-xl font-bold text-white">{session.user.name ?? "사용자"}</p>
            <p className="text-sm text-slate-300">{session.user.email}</p>
            <p className="mt-1 text-xs text-slate-400">가입일: {new Date().toLocaleDateString("ko-KR")}</p>
          </div>
        </div>
      </section>

      <section className="grid gap-3 md:grid-cols-3">
        <div className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
          <p className="text-xs text-slate-400">내가 추가한 플레이리스트</p>
          <p className="mt-2 text-2xl font-black text-white">{stats.added}</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
          <p className="text-xs text-slate-400">좋아요한 곡</p>
          <p className="mt-2 text-2xl font-black text-white">{stats.likes}</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
          <p className="text-xs text-slate-400">저장한 곡</p>
          <p className="mt-2 text-2xl font-black text-white">{stats.saves}</p>
        </div>
      </section>

      <section className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
        <h2 className="text-lg font-bold text-white">내가 추가한 플레이리스트</h2>
        {editingId ? (
          <form onSubmit={saveEdit} className="mt-4 grid gap-2 md:grid-cols-3">
            <input value={title} onChange={(e) => setTitle(e.target.value)} className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm" />
            <input value={emotion} onChange={(e) => setEmotion(e.target.value)} className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm" />
            <input value={musicUrl} onChange={(e) => setMusicUrl(e.target.value)} className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm" />
            <button type="submit" className="rounded-lg bg-violet-500/30 px-3 py-2 text-sm font-semibold text-white">수정 저장</button>
            <button type="button" onClick={() => setEditingId(null)} className="rounded-lg border border-white/20 px-3 py-2 text-sm">취소</button>
          </form>
        ) : null}
        <div className="mt-4 space-y-2">
          {playlists.map((item) => (
            <div key={item.id} className="flex items-center justify-between rounded-lg border border-white/10 bg-[#16162a] px-3 py-2">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-white">{item.title}</p>
                <p className="text-xs text-slate-400">{item.emotion}</p>
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={() => beginEdit(item)} className="rounded-md bg-white/10 px-2 py-1 text-xs">수정</button>
                <button type="button" onClick={() => handleDelete(item.id)} className="rounded-md bg-rose-500/20 px-2 py-1 text-xs text-rose-200">삭제</button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
        <h2 className="text-lg font-bold text-white">계정 설정</h2>
        <div className="mt-4 flex items-center gap-4">
          <button
            type="button"
            onClick={() => signOut({ callbackUrl: "/" })}
            className="rounded-lg bg-rose-500/80 px-4 py-2 text-sm font-semibold text-white"
          >
            로그아웃
          </button>
          <button type="button" className="text-sm text-slate-300 underline underline-offset-4">
            계정 탈퇴
          </button>
        </div>
      </section>
    </div>
  );
}
