"use client";

import { useMemo, useState } from "react";
import { signIn, useSession } from "next-auth/react";
import { usePlayer } from "@/components/player/PlayerProvider";

export default function BookmarksPage() {
  const { status } = useSession();
  const { playlists, loading, error, playPlaylist } = usePlayer();
  const [tab, setTab] = useState<"likes" | "saves">("likes");

  const items = useMemo(
    () =>
      playlists.filter((p) => (tab === "likes" ? (p.likeCount ?? 0) > 0 : (p.savedCount ?? 0) > 0)),
    [playlists, tab]
  );

  if (status !== "authenticated") {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-10 text-center">
        <p className="text-4xl">🔐</p>
        <p className="mt-4 text-lg font-bold text-white">로그인이 필요해요</p>
        <p className="mt-2 text-sm text-slate-400">좋아요와 저장한 플레이리스트를 여기에서 모아 볼 수 있어요.</p>
        <button
          type="button"
          onClick={() => signIn("google")}
          className="mt-6 rounded-xl bg-gradient-to-r from-violet-500 to-pink-500 px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-violet-500/25"
        >
          Google 로그인
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-white md:text-3xl">내 보관함</h1>
        <p className="mt-1 text-sm text-slate-400">좋아요한 곡과 저장한 곡을 탭으로 구분해 보세요.</p>
      </div>

      <div className="flex flex-wrap gap-2 rounded-xl border border-white/10 bg-white/[0.03] p-1">
        <button
          type="button"
          onClick={() => setTab("likes")}
          className={`flex-1 rounded-lg px-4 py-2.5 text-sm font-semibold transition sm:flex-none ${
            tab === "likes"
              ? "bg-gradient-to-r from-violet-500/40 to-pink-500/40 text-white shadow-inner"
              : "text-slate-400 hover:bg-white/5 hover:text-white"
          }`}
        >
          좋아요한 곡
        </button>
        <button
          type="button"
          onClick={() => setTab("saves")}
          className={`flex-1 rounded-lg px-4 py-2.5 text-sm font-semibold transition sm:flex-none ${
            tab === "saves"
              ? "bg-gradient-to-r from-violet-500/40 to-pink-500/40 text-white shadow-inner"
              : "text-slate-400 hover:bg-white/5 hover:text-white"
          }`}
        >
          저장한 곡
        </button>
      </div>

      {loading ? (
        <p className="text-sm text-slate-400">불러오는 중...</p>
      ) : error ? (
        <p className="text-sm text-rose-300">{error}</p>
      ) : (
        <section className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
          {items.length === 0 ? (
            <div className="py-16 text-center">
              <p className="text-4xl">{tab === "likes" ? "❤️" : "📌"}</p>
              <p className="mt-4 text-sm font-medium text-slate-300">
                {tab === "likes"
                  ? "아직 좋아요한 플레이리스트가 없어요."
                  : "아직 저장한 플레이리스트가 없어요."}
              </p>
              <p className="mt-2 text-xs text-slate-500">
                홈이나 탐색에서 ❤️ 또는 📌를 눌러 보관함을 채워 보세요.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {items.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => playPlaylist(item)}
                  className="rounded-2xl border border-white/10 bg-gradient-to-br from-[#1c1c32] to-[#141428] p-4 text-left transition hover:border-violet-400/45 hover:shadow-[0_10px_36px_rgba(139,92,246,0.18)]"
                >
                  <p className="truncate text-sm font-semibold text-white">{item.title}</p>
                  <p className="mt-2 text-xs text-violet-300/90">{item.emotion}</p>
                  <div className="mt-3 flex gap-3 text-[11px] text-slate-400">
                    <span>
                      ❤️ <span className="text-pink-300">{item.likeCount ?? 0}</span>
                    </span>
                    <span>
                      📌 <span className="text-emerald-300">{item.savedCount ?? 0}</span>
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
