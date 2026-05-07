"use client";

import { useMemo, useState } from "react";
import { usePlayer } from "@/components/player/PlayerProvider";
import type { Playlist } from "@/types/playlist";
import { EMOTION_INTRO_CHIP_CLASS, EMOTION_ONLY, emotionDotClass } from "@/lib/emotions";

export default function ExplorePage() {
  const { playlists, loading, error, playPlaylist } = usePlayer();
  const [keyword, setKeyword] = useState("");

  const filtered = useMemo(() => {
    const q = keyword.trim().toLowerCase();
    return playlists.filter((p) =>
      q.length === 0
        ? true
        : p.title.toLowerCase().includes(q) || p.emotion.toLowerCase().includes(q)
    );
  }, [keyword, playlists]);

  const grouped = useMemo(() => {
    const map = new Map<string, Playlist[]>();
    for (const p of filtered) {
      const list = map.get(p.emotion) ?? [];
      list.push(p);
      map.set(p.emotion, list);
    }
    const keys = Array.from(map.keys());
    keys.sort((a, b) => {
      const ia = (EMOTION_ONLY as readonly string[]).indexOf(a);
      const ib = (EMOTION_ONLY as readonly string[]).indexOf(b);
      if (ia === -1 && ib === -1) return a.localeCompare(b, "ko");
      if (ia === -1) return 1;
      if (ib === -1) return -1;
      return ia - ib;
    });
    return keys.map((emotion) => [emotion, map.get(emotion)!] as const);
  }, [filtered]);

  return (
    <div className="space-y-6">
      <div className="sticky top-2 z-10 rounded-2xl border border-white/10 bg-[#141427]/95 p-5 backdrop-blur-md">
        <h1 className="text-2xl font-black tracking-tight text-white md:text-3xl">탐색</h1>
        <p className="mt-1 text-sm text-slate-400">감정별로 모아둔 플레이리스트를 골라 들어보세요.</p>
        <input
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder="제목 또는 감정으로 검색"
          className="mt-4 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-violet-400/50 focus:ring-1 focus:ring-violet-400/30"
        />
      </div>

      {loading ? (
        <p className="text-sm text-slate-400">불러오는 중...</p>
      ) : error ? (
        <p className="text-sm text-rose-300">{error}</p>
      ) : playlists.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-white/[0.04] py-16 text-center">
          <p className="text-4xl">🎵</p>
          <p className="mt-3 text-sm text-slate-400">아직 등록된 플레이리스트가 없어요.</p>
        </div>
      ) : grouped.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-white/[0.04] py-16 text-center">
          <p className="text-4xl">🔎</p>
          <p className="mt-3 text-sm text-slate-400">검색 조건에 맞는 플레이리스트가 없습니다.</p>
        </div>
      ) : (
        grouped.map(([emotion, items]) => (
          <section
            key={emotion}
            className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 shadow-[0_8px_32px_rgba(0,0,0,0.25)]"
          >
            <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className={`h-3 w-3 shrink-0 rounded-full ${emotionDotClass(emotion)}`} />
                <h2 className="text-xl font-bold text-white">{emotion}</h2>
              </div>
              <span className="text-xs text-slate-500">{items.length}개</span>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {items.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => playPlaylist(item)}
                  className="group relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-[#1a1a2e] to-[#16162a] p-4 text-left transition hover:border-violet-400/40 hover:shadow-[0_12px_40px_rgba(139,92,246,0.2)]"
                >
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-violet-600/10 via-transparent to-pink-600/10 opacity-0 transition group-hover:opacity-100" />
                  <p className="relative truncate text-base font-semibold text-white">{item.title}</p>
                  <p
                    className={`relative mt-2 inline-flex rounded-full border px-2 py-0.5 text-[11px] font-medium ${
                      EMOTION_INTRO_CHIP_CLASS[item.emotion] ?? "border-white/15 bg-white/10 text-slate-200"
                    }`}
                  >
                    {item.emotion}
                  </p>
                  <p className="relative mt-3 text-xs text-slate-400">
                    좋아요 <span className="text-pink-300">{item.likeCount ?? 0}</span> · 저장{" "}
                    <span className="text-emerald-300">{item.savedCount ?? 0}</span>
                  </p>
                  <p className="relative mt-3 text-xs font-medium text-violet-300/90">클릭하여 재생 ▶</p>
                </button>
              ))}
            </div>
          </section>
        ))
      )}
    </div>
  );
}
