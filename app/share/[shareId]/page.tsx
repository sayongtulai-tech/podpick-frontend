"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { usePlayer } from "@/components/player/PlayerProvider";
import { EMOTION_EMOJI } from "@/lib/emotions";
import type { Playlist } from "@/types/playlist";

function moodCopy(emotion: string) {
  const map: Record<string, string> = {
    새벽감성: "고요한 밤의 감정을 채우는 플레이리스트",
    우울함: "짙은 밤공기처럼 깊고 조용한 무드",
    설렘: "심장이 살짝 빨라지는 따뜻한 톤",
    집중: "생각의 밀도를 높여주는 차분한 흐름",
    드라이브: "도시의 불빛과 잘 어울리는 사운드",
  };
  return map[emotion] ?? "지금 감정에 어울리는 플레이리스트";
}

function thumbGradient(emotion: string) {
  const map: Record<string, string> = {
    새벽감성: "from-[#171733] via-[#2f1f4b] to-[#0f172a]",
    우울함: "from-[#050b19] via-[#10223e] to-[#1d3b6e]",
    설렘: "from-[#4a1f3c] via-[#be185d] to-[#fb7185]",
    집중: "from-[#0b1220] via-[#1e293b] to-[#334155]",
    드라이브: "from-[#0b1024] via-[#1d2a5f] to-[#312e81]",
  };
  return map[emotion] ?? "from-[#1b1636] via-[#312e81] to-[#7c3aed]";
}

export default function SharePage() {
  const { playPlaylist } = usePlayer();
  const params = useParams<{ shareId: string }>();
  const [playlist, setPlaylist] = useState<Playlist | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);

  const shareId = useMemo(() => {
    const raw = params?.shareId;
    if (Array.isArray(raw)) return raw[0] ?? "";
    return raw ?? "";
  }, [params]);

  useEffect(() => {
    if (!shareId) return;
    let active = true;
    async function run() {
      try {
        setLoading(true);
        setError(null);
        setNotFound(false);
        const response = await fetch(`/api/share/${encodeURIComponent(shareId)}`, { cache: "no-store" });
        const data = (await response.json()) as Playlist & { message?: string };
        if (!response.ok) {
          if (response.status === 404) {
            setNotFound(true);
          }
          throw new Error(data.message ?? "공유 플레이리스트를 찾을 수 없습니다.");
        }
        if (!active) return;
        setPlaylist(data);
      } catch (e) {
        if (!active) return;
        setError(e instanceof Error ? e.message : "공유 정보를 불러오지 못했습니다.");
      } finally {
        if (active) setLoading(false);
      }
    }
    void run();
    return () => {
      active = false;
    };
  }, [shareId]);

  if (!shareId) {
    return (
      <section className="mx-auto mt-6 max-w-3xl rounded-3xl border border-white/10 bg-gradient-to-br from-[#17172d] to-[#0f0f1d] p-8 text-center">
        <p className="text-4xl">🔗</p>
        <h1 className="mt-3 text-2xl font-bold text-white">공유 링크가 올바르지 않아요</h1>
        <p className="mt-2 text-sm text-slate-400">shareId를 확인한 뒤 다시 시도해 주세요.</p>
        <Link
          href="/"
          className="mt-5 inline-flex rounded-full border border-violet-300/40 bg-violet-500/20 px-4 py-2 text-sm font-medium text-violet-100 transition hover:bg-violet-500/30"
        >
          홈으로 돌아가기
        </Link>
      </section>
    );
  }

  if (loading) {
    return (
      <section className="mx-auto mt-6 max-w-3xl rounded-3xl border border-white/10 bg-white/[0.04] p-8 text-center">
        <p className="text-sm text-slate-300">공유 플레이리스트를 불러오는 중...</p>
      </section>
    );
  }

  if (error || !playlist) {
    return (
      <section className="mx-auto mt-6 max-w-3xl rounded-3xl border border-white/10 bg-gradient-to-br from-[#17172d] to-[#0f0f1d] p-8 text-center">
        <p className="text-4xl">🌌</p>
        <h1 className="mt-3 text-2xl font-bold text-white">
          {notFound ? "이 감정 링크를 찾을 수 없어요" : "공유 정보를 불러오지 못했어요"}
        </h1>
        <p className="mt-2 text-sm text-slate-400">
          {notFound
            ? "공유 링크가 만료되었거나 존재하지 않습니다."
            : error ?? "네트워크 상태를 확인한 뒤 다시 시도해 주세요."}
        </p>
        <Link
          href="/"
          className="mt-5 inline-flex rounded-full border border-violet-300/40 bg-violet-500/20 px-4 py-2 text-sm font-medium text-violet-100 transition hover:bg-violet-500/30"
        >
          홈으로 돌아가기
        </Link>
      </section>
    );
  }

  return (
    <section className="mx-auto mt-6 max-w-4xl rounded-3xl border border-white/10 bg-[#121225]/85 p-5 shadow-[0_20px_60px_rgba(2,6,23,0.5)] md:p-7">
      <div className="overflow-hidden rounded-2xl border border-white/15 bg-[#0f1324]">
        <div className={`relative aspect-[16/10] bg-gradient-to-br ${thumbGradient(playlist.emotion)}`}>
          <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent_32%,rgba(2,6,23,0.8)_100%)]" />
          <div className="absolute bottom-0 left-0 right-0 p-5">
            <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-white/20 bg-black/30 px-3 py-1 text-xs text-slate-100">
              <span>{EMOTION_EMOJI[playlist.emotion] ?? "🎵"}</span>
              <span>{playlist.emotion}</span>
            </div>
            <h1 className="text-2xl font-bold text-white md:text-3xl">{playlist.title}</h1>
            <p className="mt-2 text-sm text-slate-200">{moodCopy(playlist.emotion)}</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 border-t border-white/10 px-5 py-4 text-xs text-slate-300">
          <span className="rounded-full border border-pink-300/30 bg-pink-500/15 px-2.5 py-1">
            ❤️ 좋아요 {playlist.likeCount ?? 0}
          </span>
          <span className="rounded-full border border-emerald-300/30 bg-emerald-500/15 px-2.5 py-1">
            📌 저장 {playlist.savedCount ?? 0}
          </span>
          <span className="ml-auto text-slate-400">by {playlist.creatorName ?? "PodPick User"}</span>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => playPlaylist(playlist)}
          className="btn-press min-h-[44px] rounded-full border border-violet-300/50 bg-gradient-to-r from-violet-500/75 to-pink-500/75 px-6 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(168,85,247,0.35)] transition hover:brightness-110"
        >
          ▶ 재생
        </button>
        <Link
          href="/"
          className="min-h-[44px] rounded-full border border-white/20 bg-white/5 px-5 py-3 text-sm text-slate-200 transition hover:bg-white/10"
        >
          PodPick에서 더 탐색하기
        </Link>
      </div>
    </section>
  );
}

