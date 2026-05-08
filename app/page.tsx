"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { usePlayer } from "@/components/player/PlayerProvider";
import { Playlist } from "@/types/playlist";
import { useSession } from "next-auth/react";
import {
  EMOTIONS,
  EMOTION_EMOJI,
  EMOTION_ONLY,
  EMOTION_INTRO_CHIP_CLASS,
  emotionFilterChipClass,
  isKnownEmotion,
  type EmotionFilter,
  type EmotionOnly,
} from "@/lib/emotions";
import { SORT_OPTIONS, usePlaylistViewData } from "@/app/home/usePlaylistViewData";
import { usePlaylistCrud } from "@/app/home/usePlaylistCrud";

const EMOTION_CARD_ACCENT: Record<string, string> = {
  새벽감성: "from-violet-500/25 via-indigo-500/15 to-transparent border-violet-300/25 shadow-violet-950/40",
  행복: "from-amber-500/25 via-yellow-400/15 to-transparent border-amber-300/25 shadow-amber-950/40",
  설렘: "from-pink-500/25 via-fuchsia-500/15 to-transparent border-pink-300/25 shadow-pink-950/40",
  힐링: "from-emerald-500/25 via-teal-500/15 to-transparent border-emerald-300/25 shadow-emerald-950/40",
  집중: "from-cyan-500/25 via-sky-500/15 to-transparent border-cyan-300/25 shadow-cyan-950/40",
  우울함: "from-slate-500/25 via-slate-400/15 to-transparent border-slate-300/25 shadow-slate-950/40",
  운동: "from-rose-500/25 via-orange-500/15 to-transparent border-rose-300/25 shadow-rose-950/40",
  드라이브: "from-sky-500/25 via-blue-500/15 to-transparent border-sky-300/25 shadow-sky-950/40",
  비오는날: "from-slate-500/25 via-blue-500/10 to-transparent border-slate-300/25 shadow-slate-950/40",
  신남: "from-lime-500/25 via-yellow-400/10 to-transparent border-lime-300/25 shadow-lime-950/40",
  몽환적: "from-purple-500/25 via-violet-500/15 to-transparent border-purple-300/25 shadow-purple-950/40",
  그리움: "from-indigo-500/25 via-violet-500/15 to-transparent border-indigo-300/25 shadow-indigo-950/40",
  여름: "from-orange-500/25 via-cyan-500/10 to-transparent border-orange-300/25 shadow-orange-950/40",
  겨울: "from-sky-300/20 via-blue-400/10 to-transparent border-sky-200/25 shadow-blue-950/40",
  카페: "from-amber-900/30 via-amber-700/15 to-transparent border-amber-700/25 shadow-amber-950/40",
  여행: "from-teal-500/25 via-cyan-500/15 to-transparent border-teal-300/25 shadow-teal-950/40",
  로맨틱: "from-fuchsia-500/25 via-pink-500/15 to-transparent border-fuchsia-300/25 shadow-fuchsia-950/40",
  파티: "from-yellow-400/25 via-pink-500/15 to-transparent border-yellow-300/25 shadow-yellow-950/40",
  명상: "from-violet-400/20 via-indigo-400/10 to-transparent border-violet-200/25 shadow-violet-950/40",
  공부: "from-blue-500/25 via-indigo-500/10 to-transparent border-blue-300/25 shadow-blue-950/40",
  수면: "from-indigo-900/30 via-violet-900/15 to-transparent border-indigo-700/25 shadow-indigo-950/40",
};

const EMOTION_COPY: Record<string, string> = {
  새벽감성: "고요한 밤, 마음을 천천히 채우는 플레이리스트",
  행복: "밝은 하루를 더 환하게 만드는 무드",
  설렘: "심장이 살짝 빨라지는 순간을 위한 사운드",
  힐링: "지친 하루 끝, 숨을 고르게 하는 선율",
  집중: "생각을 또렷하게 정리해주는 리듬",
  우울함: "무거운 마음을 부드럽게 감싸는 멜로디",
  운동: "에너지를 끌어올리는 강한 비트",
  드라이브: "창밖 풍경과 잘 어울리는 주행용 트랙",
  비오는날: "빗소리와 섞여 더 깊어지는 분위기",
  신남: "지금 당장 몸을 움직이게 만드는 텐션",
  몽환적: "현실과 꿈 사이를 떠다니는 감각",
  그리움: "추억의 장면을 조용히 불러오는 음악",
  여름: "햇살과 바람을 닮은 가벼운 무드",
  겨울: "차가운 공기 속 따뜻함을 남기는 사운드",
  카페: "잔잔한 대화와 잘 어울리는 배경 음악",
  여행: "낯선 길의 설렘을 채우는 플레이리스트",
  로맨틱: "감정선을 부드럽게 올려주는 무드",
  파티: "분위기를 한 번에 끌어올리는 셋",
  명상: "호흡을 느리게 만드는 차분한 레이어",
  공부: "집중을 오래 유지해주는 안정적인 흐름",
  수면: "하루를 부드럽게 마무리하는 저녁 사운드",
};

const EMOTION_THUMB_BG: Record<string, string> = {
  새벽감성: "from-[#171733] via-[#2f1f4b] to-[#0f172a]",
  행복: "from-[#4a2f16] via-[#b9771f] to-[#f59e0b]",
  설렘: "from-[#4a1f3c] via-[#be185d] to-[#fb7185]",
  힐링: "from-[#0f2f2e] via-[#166534] to-[#34d399]",
  집중: "from-[#0b1220] via-[#1e293b] to-[#334155]",
  우울함: "from-[#050b19] via-[#10223e] to-[#1d3b6e]",
  운동: "from-[#2c0b13] via-[#9f1239] to-[#f97316]",
  드라이브: "from-[#0b1024] via-[#1d2a5f] to-[#312e81]",
  비오는날: "from-[#0f172a] via-[#1e293b] to-[#334155]",
  신남: "from-[#2f1b02] via-[#ca8a04] to-[#facc15]",
  몽환적: "from-[#1f1237] via-[#5b21b6] to-[#a855f7]",
  그리움: "from-[#141833] via-[#312e81] to-[#6366f1]",
  여름: "from-[#0c2b38] via-[#0ea5e9] to-[#22d3ee]",
  겨울: "from-[#102238] via-[#1d4ed8] to-[#7dd3fc]",
  카페: "from-[#2d1b11] via-[#78350f] to-[#b45309]",
  여행: "from-[#0f2f3b] via-[#0f766e] to-[#2dd4bf]",
  로맨틱: "from-[#3b1028] via-[#c026d3] to-[#fb7185]",
  파티: "from-[#3a1e00] via-[#f59e0b] to-[#ef4444]",
  명상: "from-[#16122f] via-[#4338ca] to-[#818cf8]",
  공부: "from-[#0f1f3f] via-[#1d4ed8] to-[#38bdf8]",
  수면: "from-[#090a18] via-[#1e1b4b] to-[#312e81]",
};

const EMOTION_THUMB_EFFECT: Record<string, string> = {
  새벽감성: "before:bg-[radial-gradient(circle_at_18%_22%,rgba(236,72,153,0.32),transparent_48%),radial-gradient(circle_at_76%_18%,rgba(56,189,248,0.25),transparent_45%)] after:bg-[linear-gradient(120deg,rgba(148,163,184,0.1)_0%,rgba(148,163,184,0.02)_35%,transparent_60%)]",
  우울함: "before:bg-[radial-gradient(circle_at_22%_24%,rgba(59,130,246,0.28),transparent_50%),radial-gradient(circle_at_80%_12%,rgba(148,163,184,0.2),transparent_45%)] after:bg-[linear-gradient(180deg,rgba(15,23,42,0.05)_0%,rgba(15,23,42,0.45)_100%)]",
  설렘: "before:bg-[radial-gradient(circle_at_22%_18%,rgba(244,114,182,0.34),transparent_48%),radial-gradient(circle_at_76%_20%,rgba(251,113,133,0.26),transparent_45%)] after:bg-[linear-gradient(140deg,rgba(255,255,255,0.08)_0%,transparent_40%)]",
  집중: "before:bg-[radial-gradient(circle_at_50%_35%,rgba(148,163,184,0.18),transparent_52%)] after:bg-[linear-gradient(180deg,rgba(15,23,42,0.1)_0%,rgba(15,23,42,0.55)_100%)]",
  드라이브: "before:bg-[radial-gradient(circle_at_28%_88%,rgba(251,191,36,0.28),transparent_35%),radial-gradient(circle_at_74%_24%,rgba(96,165,250,0.3),transparent_45%)] after:bg-[linear-gradient(180deg,transparent_0%,rgba(2,6,23,0.58)_100%)]",
};

function thumbBgClass(emotion: string) {
  return EMOTION_THUMB_BG[emotion] ?? "from-[#1b1636] via-[#312e81] to-[#7c3aed]";
}

function thumbEffectClass(emotion: string) {
  return (
    EMOTION_THUMB_EFFECT[emotion] ??
    "before:bg-[radial-gradient(circle_at_24%_20%,rgba(168,85,247,0.3),transparent_50%),radial-gradient(circle_at_78%_20%,rgba(236,72,153,0.24),transparent_45%)] after:bg-[linear-gradient(180deg,transparent_0%,rgba(2,6,23,0.48)_100%)]"
  );
}

function cardAccentClass(emotion: string) {
  return (
    EMOTION_CARD_ACCENT[emotion] ??
    "from-violet-500/25 via-pink-500/15 to-transparent border-violet-300/25 shadow-violet-950/40"
  );
}

function emotionCopy(emotion: string) {
  return EMOTION_COPY[emotion] ?? "지금 감정에 어울리는 플레이리스트";
}

function creatorLabel(item: Playlist) {
  return `by ${item.creatorName?.trim() || `PodPick User #${(item.id % 97) + 3}`}`;
}

function HomePageContent() {
  const { data: session } = useSession();
  const [shareTarget, setShareTarget] = useState<Playlist | null>(null);
  const [sharePanelActive, setSharePanelActive] = useState(false);
  const [shareToast, setShareToast] = useState<string | null>(null);
  const { playlists, loading, error, playPlaylist, refreshPlaylists } = usePlayer();
  const {
    keyword,
    setKeyword,
    sortOption,
    setSortOption,
    emotionFilter,
    applyEmotionFilter,
    topLiked,
    filteredPlaylists,
  } = usePlaylistViewData(playlists);
  const {
    showCreateForm,
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
  } = usePlaylistCrud({ session, refreshPlaylists });

  const feedInsights = useMemo(() => {
    const emotionSaveMap = new Map<string, number>();
    const emotionLikeMap = new Map<string, number>();
    for (const p of playlists) {
      emotionSaveMap.set(p.emotion, (emotionSaveMap.get(p.emotion) ?? 0) + (p.savedCount ?? 0));
      emotionLikeMap.set(p.emotion, (emotionLikeMap.get(p.emotion) ?? 0) + (p.likeCount ?? 0));
    }
    const mostSavedEmotion =
      [...emotionSaveMap.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? "새벽감성";
    const hottestMood =
      [...emotionLikeMap.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? "설렘";
    const dawnPick =
      playlists.find((p) => p.emotion === "새벽감성") ??
      playlists.find((p) => p.emotion === "비오는날") ??
      playlists[0] ??
      null;
    return { mostSavedEmotion, hottestMood, dawnPick };
  }, [playlists]);

  async function copyShareLink(item: Playlist) {
    try {
      const shareToken = item.shareId?.trim();
      if (!shareToken) {
        setShareToast("공유 링크를 생성할 수 없습니다. 잠시 후 다시 시도해 주세요.");
        return;
      }
      const origin = typeof window !== "undefined" ? window.location.origin : "";
      const shareLink = `${origin}/share/${encodeURIComponent(shareToken)}`;
      await navigator.clipboard.writeText(shareLink);
      setShareToast("링크를 복사했어요.");
    } catch {
      setShareToast("클립보드 복사에 실패했어요.");
    }
  }

  async function copyMoodCard(item: Playlist) {
    try {
      const text = `${item.title} · ${item.emotion}\n${emotionCopy(item.emotion)}\n#PodPick #감정플레이리스트`;
      await navigator.clipboard.writeText(text);
      setShareToast("감정 카드 문구를 복사했어요.");
    } catch {
      setShareToast("감정 카드 복사에 실패했어요.");
    }
  }

  useEffect(() => {
    if (!shareTarget) return;
    const raf = requestAnimationFrame(() => setSharePanelActive(true));
    return () => cancelAnimationFrame(raf);
  }, [shareTarget]);

  useEffect(() => {
    if (!shareToast) return;
    const timer = window.setTimeout(() => setShareToast(null), 2200);
    return () => window.clearTimeout(timer);
  }, [shareToast]);

  function openSharePanel(item: Playlist) {
    setShareTarget(item);
    setSharePanelActive(false);
  }

  function closeSharePanel() {
    setSharePanelActive(false);
    setTimeout(() => setShareTarget(null), 180);
  }

  return (
    <div className="space-y-5">
      <section className="relative overflow-hidden rounded-3xl border border-white/15 bg-[#121226]/90 p-5 shadow-[0_20px_60px_rgba(2,6,23,0.45)] md:p-7">
        <div className="pointer-events-none absolute -left-20 -top-24 h-64 w-64 rounded-full bg-violet-500/30 blur-3xl" />
        <div className="pointer-events-none absolute -right-16 top-8 h-52 w-52 rounded-full bg-pink-500/20 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 left-1/3 h-40 w-40 rounded-full bg-cyan-400/15 blur-3xl" />
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(140deg,rgba(168,85,247,0.08)_0%,rgba(236,72,153,0.05)_45%,rgba(56,189,248,0.04)_100%)]" />

        <div className="relative grid gap-5 md:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] md:items-end">
          <div>
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-full border border-violet-300/35 bg-violet-500/15 px-3 py-1 text-[11px] font-medium text-violet-100">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-violet-200" />
                live mood feed
              </span>
              <span className="rounded-full border border-white/20 bg-white/5 px-2.5 py-1 text-[11px] text-slate-300">
                {EMOTION_EMOJI[feedInsights.hottestMood] ?? "✨"} 지금 인기: {feedInsights.hottestMood}
              </span>
            </div>

            <h1 className="text-2xl font-black leading-tight text-white md:text-[2.2rem] md:leading-[1.15]">
              지금 감정을 듣는 가장
              <br />
              <span className="bg-gradient-to-r from-violet-200 via-fuchsia-200 to-pink-200 bg-clip-text text-transparent">
                몰입적인 방법, PodPick
              </span>
            </h1>

            <p className="mt-3 max-w-xl text-sm text-slate-300 md:text-base">
              감정 기반 추천과 소셜 피드를 한 번에. 지금 분위기에 맞는 플레이리스트를 발견하고, 너의 무드를 바로 공유해보세요.
            </p>

            <div className="mt-4 flex flex-wrap gap-2.5">
              <span className="rounded-full border border-violet-300/40 bg-violet-500/20 px-3 py-1.5 text-xs font-medium text-violet-100 shadow-[0_6px_18px_rgba(124,58,237,0.25)]">
                {EMOTION_EMOJI[feedInsights.mostSavedEmotion] ?? "🎵"} 오늘의 감정: {feedInsights.mostSavedEmotion}
              </span>
              <span className="rounded-full border border-white/20 bg-white/5 px-3 py-1.5 text-xs text-slate-300">
                추천 무드 카피: {emotionCopy(feedInsights.hottestMood)}
              </span>
            </div>
          </div>

          <div className="relative">
            <div className="rounded-2xl border border-white/15 bg-gradient-to-br from-white/10 to-transparent p-4 backdrop-blur-sm">
              <p className="text-[11px] uppercase tracking-wide text-slate-300">오늘의 spotlight</p>
              <p className="mt-2 truncate text-lg font-semibold text-white">
                {feedInsights.dawnPick?.title ?? "지금 인기 무드 큐레이션"}
              </p>
              <p className="mt-1 text-xs text-slate-300">
                {feedInsights.dawnPick
                  ? `${EMOTION_EMOJI[feedInsights.dawnPick.emotion] ?? "🎵"} ${feedInsights.dawnPick.emotion} · ${creatorLabel(feedInsights.dawnPick)}`
                  : "새로운 감정 플레이리스트가 올라오고 있어요"}
              </p>

              <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                <div className="rounded-xl border border-pink-300/30 bg-pink-500/15 px-3 py-2 text-pink-100">
                  ❤️ hottest mood
                </div>
                <div className="rounded-xl border border-emerald-300/30 bg-emerald-500/15 px-3 py-2 text-emerald-100">
                  📌 saved trend
                </div>
              </div>
            </div>
            <div className="pointer-events-none absolute -bottom-6 right-4 h-16 w-16 animate-pulse rounded-full bg-fuchsia-400/20 blur-2xl" />
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="text-lg font-bold text-white">오늘의 감정 피드</h2>
          <span className="rounded-full border border-violet-300/30 bg-violet-500/15 px-3 py-1 text-[11px] text-violet-100">
            live mood
          </span>
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          <div className="rounded-xl border border-white/10 bg-gradient-to-br from-violet-500/18 to-pink-500/10 p-4 transition-all duration-300 ease-out hover:-translate-y-0.5 hover:border-violet-300/35 hover:shadow-[0_10px_28px_rgba(168,85,247,0.25)]">
            <p className="text-[11px] uppercase tracking-wide text-slate-300">오늘 많이 저장된 감정</p>
            <p className="mt-2 text-base font-semibold text-white">
              {EMOTION_EMOJI[feedInsights.mostSavedEmotion] ?? "🎵"} {feedInsights.mostSavedEmotion}
            </p>
            <p className="mt-1 text-xs text-slate-300">{emotionCopy(feedInsights.mostSavedEmotion)}</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-gradient-to-br from-sky-500/16 to-indigo-500/10 p-4 transition-all duration-300 ease-out hover:-translate-y-0.5 hover:border-sky-300/35 hover:shadow-[0_10px_28px_rgba(56,189,248,0.2)]">
            <p className="text-[11px] uppercase tracking-wide text-slate-300">새벽에 어울리는 플레이리스트</p>
            <p className="mt-2 truncate text-base font-semibold text-white">
              {feedInsights.dawnPick?.title ?? "플레이리스트를 기다리는 중"}
            </p>
            <p className="mt-1 text-xs text-slate-300">
              {feedInsights.dawnPick ? `${feedInsights.dawnPick.emotion} · ${creatorLabel(feedInsights.dawnPick)}` : "새로운 밤 무드를 기다리고 있어요"}
            </p>
          </div>
          <div className="rounded-xl border border-white/10 bg-gradient-to-br from-fuchsia-500/16 to-rose-500/10 p-4 transition-all duration-300 ease-out hover:-translate-y-0.5 hover:border-fuchsia-300/35 hover:shadow-[0_10px_28px_rgba(217,70,239,0.2)]">
            <p className="text-[11px] uppercase tracking-wide text-slate-300">지금 인기 있는 무드</p>
            <p className="mt-2 text-base font-semibold text-white">
              {EMOTION_EMOJI[feedInsights.hottestMood] ?? "✨"} {feedInsights.hottestMood}
            </p>
            <p className="mt-1 text-xs text-slate-300">좋아요 반응이 가장 빠르게 늘고 있는 감정이에요.</p>
          </div>
        </div>
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
            onClick={toggleCreateForm}
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

        <div className="mt-5 grid gap-5 sm:grid-cols-2 xl:grid-cols-2 2xl:grid-cols-3">
          {filteredPlaylists.map((item: Playlist) => {
            const isEditing = editingId === item.id;
            return (
              <div
                key={item.id}
                className={`group relative overflow-hidden rounded-3xl border bg-[#121225] p-5 shadow-[0_16px_40px_rgba(2,6,23,0.4)] transition-all duration-300 ease-out hover:-translate-y-1.5 hover:shadow-[0_24px_60px_rgba(2,6,23,0.55)] ${cardAccentClass(item.emotion)}`}
              >
                <div className={`pointer-events-none absolute inset-x-0 top-0 h-36 bg-gradient-to-b ${cardAccentClass(item.emotion).split(" ").slice(0, 3).join(" ")}`} />
                {isEditing ? (
                  <div className="relative space-y-3">
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
                  <div className="relative">
                    <div className="mb-5 overflow-hidden rounded-2xl border border-white/15 bg-[#0d1120] shadow-[0_12px_30px_rgba(2,6,23,0.4)]">
                      <div
                        className={`relative aspect-[16/10] overflow-hidden bg-gradient-to-br ${thumbBgClass(item.emotion)} before:absolute before:inset-0 before:content-[''] after:absolute after:inset-0 after:content-[''] ${thumbEffectClass(item.emotion)}`}
                      >
                        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(2,6,23,0.06)_5%,rgba(2,6,23,0.25)_42%,rgba(2,6,23,0.85)_100%)]" />
                        <div className="absolute -inset-y-8 -left-20 w-48 rotate-6 bg-white/10 blur-2xl transition-transform duration-500 ease-out group-hover:translate-x-5" />
                        <div className="absolute -right-14 -top-12 h-36 w-36 rounded-full bg-violet-400/25 blur-3xl transition duration-500 ease-out group-hover:scale-125 group-hover:opacity-95" />
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 transition-all duration-500 ease-out group-hover:translate-x-5 group-hover:opacity-100" />
                        <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 p-4">
                          <div className="flex min-w-0 items-end gap-2.5">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/30 bg-black/25 text-lg shadow-[0_4px_18px_rgba(0,0,0,0.35)] backdrop-blur-sm">
                              {EMOTION_EMOJI[item.emotion] ?? "🎵"}
                            </div>
                            <div className="min-w-0">
                              <p className="line-clamp-2 text-base font-semibold leading-snug text-white drop-shadow-sm">{item.title}</p>
                              <p className="mt-1 line-clamp-2 text-xs text-slate-200/90">{emotionCopy(item.emotion)}</p>
                            </div>
                          </div>
                          <span className="rounded-full border border-white/20 bg-black/35 px-2.5 py-1 text-[10px] text-slate-100 backdrop-blur-sm">
                            #mood
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2.5">
                      <span
                        className={`inline-flex w-fit max-w-full truncate rounded-full border px-2.5 py-1 text-xs font-medium ${
                          EMOTION_INTRO_CHIP_CLASS[item.emotion] ??
                          "border-white/15 bg-white/10 text-slate-200"
                        }`}
                      >
                        {item.emotion}
                      </span>
                    </div>

                    <div className="mt-3 flex items-center gap-2 text-xs text-slate-300">
                      <span className="rounded-full border border-pink-300/30 bg-pink-500/15 px-2 py-0.5">
                        ❤️ 좋아요 {item.likeCount ?? 0}
                      </span>
                      <span className="rounded-full border border-emerald-300/30 bg-emerald-500/15 px-2 py-0.5">
                        📌 저장 {item.savedCount ?? 0}
                      </span>
                      <button
                        type="button"
                        onClick={() => openSharePanel(item)}
                        className="ml-auto rounded-full border border-violet-300/30 bg-violet-500/15 px-2.5 py-0.5 text-[11px] text-violet-100 transition-all duration-300 ease-out hover:scale-[1.03] hover:bg-violet-500/25 active:scale-[0.98]"
                        title="공유"
                      >
                        🔗 공유
                      </button>
                    </div>

                    <p className="mt-2 text-xs text-slate-400">{creatorLabel(item)}</p>

                    <div className="mt-5 flex flex-wrap items-center gap-2.5 border-t border-white/10 pt-3">
                      <button
                        type="button"
                        onClick={() => playPlaylist(item)}
                        className="btn-press min-h-[44px] flex-1 rounded-xl border border-violet-300/50 bg-gradient-to-r from-violet-500/65 to-pink-500/65 px-3 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(168,85,247,0.35)] transition-all duration-300 ease-out hover:scale-[1.02] hover:brightness-110 active:scale-[0.98]"
                      >
                        ▶ 재생
                      </button>
                      <button
                        type="button"
                        onClick={() => handleLike(item.id)}
                        disabled={!session}
                        className="btn-press flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl border border-pink-300/40 bg-pink-500/20 text-lg disabled:opacity-60"
                      >
                        ❤️
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSaveCount(item.id)}
                        disabled={!session}
                        className="btn-press flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl border border-emerald-300/40 bg-emerald-500/20 text-lg disabled:opacity-60"
                      >
                        📌
                      </button>
                      <button
                        type="button"
                        onClick={() => startEdit(item)}
                        disabled={!session}
                        className="btn-press flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl border border-amber-300/40 bg-amber-500/15 text-lg disabled:opacity-60"
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
                        className="btn-press flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl border border-rose-400/40 bg-rose-500/15 text-lg disabled:opacity-60"
                        title="삭제"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
          {!loading && filteredPlaylists.length === 0 && (
            <div className="sm:col-span-2 xl:col-span-3 rounded-2xl border border-dashed border-white/15 bg-white/[0.02] px-6 py-12 text-center">
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

      {shareToast && (
        <div className="fixed bottom-[calc(15rem+env(safe-area-inset-bottom,0px))] right-4 z-40 rounded-xl border border-violet-300/30 bg-[#19192f]/95 px-4 py-2 text-sm text-violet-100 shadow-[0_10px_28px_rgba(76,29,149,0.35)] transition-all duration-200 ease-out max-md:left-4 max-md:right-4">
          <div className="flex items-center gap-3">
            <span className="text-base" aria-hidden>
              ✓
            </span>
            <span className="truncate">{shareToast}</span>
            <button
              type="button"
              onClick={() => setShareToast(null)}
              className="rounded border border-white/20 px-1.5 py-0.5 text-[11px] text-slate-200"
            >
              닫기
            </button>
          </div>
        </div>
      )}

      {shareTarget ? (
        <div
          className={`fixed inset-0 z-50 flex items-center justify-center px-4 backdrop-blur-sm transition-all duration-200 ease-out ${
            sharePanelActive ? "bg-black/65 opacity-100" : "bg-black/0 opacity-0"
          }`}
          onClick={closeSharePanel}
        >
          <div
            className={`w-full max-w-sm max-md:max-h-[84vh] overflow-y-auto rounded-2xl border border-white/15 bg-[#17172c]/95 p-5 shadow-2xl transition-all duration-200 ease-out ${
              sharePanelActive ? "translate-y-0 scale-100 opacity-100" : "translate-y-2 scale-[0.98] opacity-0"
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-base font-bold text-white">플레이리스트 공유</p>
            <p className="mt-1 truncate text-sm text-slate-300">{shareTarget.title}</p>
            <p className="mt-1 text-xs text-slate-400">
              {EMOTION_EMOJI[shareTarget.emotion] ?? "🎵"} {shareTarget.emotion}
            </p>

            <div className="mt-4 overflow-hidden rounded-xl border border-white/15 bg-[#0f1325]">
              <div className={`relative aspect-[16/10] bg-gradient-to-br ${thumbBgClass(shareTarget.emotion)}`}>
                <div className={`absolute inset-0 ${thumbEffectClass(shareTarget.emotion)} before:absolute before:inset-0 before:content-[''] after:absolute after:inset-0 after:content-['']`} />
                <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent_35%,rgba(2,6,23,0.75)_100%)]" />
                <div className="absolute bottom-0 left-0 right-0 p-3">
                  <p className="truncate text-sm font-semibold text-white">{shareTarget.title}</p>
                  <p className="mt-0.5 truncate text-[11px] text-slate-200/90">{emotionCopy(shareTarget.emotion)}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 border-t border-white/10 px-3 py-2 text-[11px] text-slate-300">
                <span className="rounded-full border border-white/20 bg-white/10 px-2 py-0.5">
                  {EMOTION_EMOJI[shareTarget.emotion] ?? "🎵"} {shareTarget.emotion}
                </span>
                <span className="rounded-full border border-pink-300/30 bg-pink-500/15 px-2 py-0.5">
                  ❤️ {shareTarget.likeCount ?? 0}
                </span>
                <span className="rounded-full border border-emerald-300/30 bg-emerald-500/15 px-2 py-0.5">
                  📌 {shareTarget.savedCount ?? 0}
                </span>
              </div>
              <p className="px-3 pb-3 text-[11px] text-slate-400">{creatorLabel(shareTarget)}</p>
            </div>

            <div className="mt-4 space-y-2">
              <button
                type="button"
                onClick={() => void copyShareLink(shareTarget)}
                className="btn-press flex w-full items-center justify-between rounded-lg border border-violet-300/45 bg-gradient-to-r from-violet-500/55 to-pink-500/55 px-3 py-2 text-sm font-semibold text-white shadow-[0_8px_20px_rgba(139,92,246,0.35)] transition hover:brightness-110"
              >
                <span>🔗 링크 복사하기</span>
                <span>🔗</span>
              </button>
              <button
                type="button"
                onClick={() => void copyMoodCard(shareTarget)}
                className="btn-press flex w-full items-center justify-between rounded-lg border border-violet-300/35 bg-violet-500/20 px-3 py-2 text-sm text-violet-100 transition hover:bg-violet-500/30"
              >
                <span>✨ 감정 카드 텍스트 복사</span>
                <span>✨</span>
              </button>
              <button
                type="button"
                onClick={() => setShareToast("이미지 저장은 곧 지원될 예정이에요.")}
                className="flex w-full cursor-not-allowed items-center justify-between rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-slate-400 opacity-85"
                disabled
              >
                <span>준비중: 이미지 저장</span>
                <span className="rounded-full border border-white/15 px-1.5 py-0.5 text-[10px]">soon</span>
              </button>
            </div>

            <div className="mt-4 flex justify-end">
              <button
                type="button"
                onClick={closeSharePanel}
                className="rounded-lg border border-white/20 px-4 py-2 text-sm text-slate-200 hover:bg-white/10"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      ) : null}

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
