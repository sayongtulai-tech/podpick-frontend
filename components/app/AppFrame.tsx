"use client";

import Link from "next/link";
import { Suspense, useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { signIn, signOut, useSession } from "next-auth/react";
import PlayerProvider, { usePlayer } from "@/components/player/PlayerProvider";
import { EMOTION_EMOJI, EMOTION_ONLY } from "@/lib/emotions";
import { getYouTubeVideoId, youtubeThumbnailHigh, youtubeThumbnailMaxRes } from "@/lib/youtube";

function formatTime(sec: number) {
  if (!Number.isFinite(sec) || sec < 0) return "0:00";
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

function SidebarEmotionNav() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const onHome = pathname === "/";
  const currentEmotion = onHome ? searchParams.get("emotion") : null;

  const activeRow =
    "bg-violet-500/30 text-white ring-1 ring-violet-400/50 shadow-[0_0_12px_rgba(139,92,246,0.15)]";
  const inactiveRow = "text-slate-500 hover:bg-white/[0.05] hover:text-slate-400";

  return (
    <div className="mt-5 hidden border-t border-white/10 pt-4 lg:block">
      <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-500">감정</p>
      <div className="max-h-[min(40vh,280px)] space-y-0.5 overflow-y-auto pr-1">
        <Link
          href="/"
          scroll={false}
          className={`flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-[11px] font-medium transition ${
            onHome && currentEmotion === null ? activeRow : inactiveRow
          }`}
        >
          <span className="flex w-3 shrink-0 justify-center">
            {onHome && currentEmotion === null ? (
              <span className="h-1.5 w-1.5 rounded-full bg-violet-400 shadow-[0_0_6px_rgba(167,139,250,0.9)]" />
            ) : null}
          </span>
          <span className="truncate">
            전체{EMOTION_EMOJI["전체"] ?? ""}
          </span>
        </Link>
        {EMOTION_ONLY.map((e) => {
          const active = onHome && currentEmotion === e;
          return (
            <Link
              key={e}
              href={`/?emotion=${encodeURIComponent(e)}`}
              scroll={false}
              className={`flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-[11px] font-medium transition ${
                active ? activeRow : inactiveRow
              }`}
            >
              <span className="flex w-3 shrink-0 justify-center">
                {active ? (
                  <span className="h-1.5 w-1.5 rounded-full bg-violet-400 shadow-[0_0_6px_rgba(167,139,250,0.9)]" />
                ) : null}
              </span>
              <span className="truncate">
                {e}
                {EMOTION_EMOJI[e] ?? ""}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

function PlaylistThumbnail({
  musicUrl,
  size,
}: {
  musicUrl: string | null | undefined;
  size: "sm" | "lg";
}) {
  const videoId = getYouTubeVideoId(musicUrl);
  const [tier, setTier] = useState<0 | 1 | 2>(0);

  useEffect(() => {
    setTier(0);
  }, [videoId, musicUrl]);

  const placeholder = (
    <div
      className={`flex shrink-0 items-center justify-center bg-gradient-to-br from-violet-900/50 to-pink-900/40 text-white ${
        size === "sm"
          ? "h-12 w-12 rounded-xl text-2xl ring-1 ring-white/10"
          : "aspect-video w-full rounded-2xl text-6xl ring-1 ring-white/10"
      }`}
      aria-hidden
    >
      🎵
    </div>
  );

  if (!videoId || tier === 2) {
    return placeholder;
  }

  const src = tier === 0 ? youtubeThumbnailMaxRes(videoId) : youtubeThumbnailHigh(videoId);

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt=""
      referrerPolicy="no-referrer"
      className={
        size === "sm"
          ? "h-12 w-12 shrink-0 rounded-xl object-cover ring-1 ring-white/10"
          : "aspect-video w-full rounded-2xl object-cover ring-1 ring-white/10"
      }
      onError={() => setTier((t) => (t === 0 ? 1 : 2))}
    />
  );
}

function HeaderProfileMenu() {
  const { data: session, status } = useSession();
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  if (status === "loading") {
    return <div className="h-9 w-24 animate-pulse rounded-full bg-white/10" aria-hidden />;
  }

  if (status === "authenticated" && session?.user) {
    return (
      <div className="relative" ref={wrapRef}>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="btn-press flex min-h-[44px] items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 transition hover:bg-white/10 md:min-h-0"
          aria-expanded={open}
          aria-haspopup="menu"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={
              session.user.image ??
              `https://ui-avatars.com/api/?name=${encodeURIComponent(session.user.name ?? "User")}&background=7c3aed&color=fff`
            }
            alt=""
            referrerPolicy="no-referrer"
            className="h-8 w-8 shrink-0 rounded-full object-cover ring-2 ring-violet-400/40"
          />
          <span className="max-w-[140px] truncate text-xs font-semibold text-slate-100">{session.user.name ?? "사용자"}</span>
          <span className="text-[10px] text-slate-500" aria-hidden>
            {open ? "▴" : "▾"}
          </span>
        </button>
        {open ? (
          <div
            className="absolute right-0 top-full z-50 mt-2 min-w-[180px] rounded-lg border border-white/15 bg-[#1a1a2e] py-1 shadow-xl"
            role="menu"
          >
            <Link
              href="/profile"
              role="menuitem"
              className="block px-4 py-2 text-sm text-slate-100 hover:bg-white/10"
              onClick={() => setOpen(false)}
            >
              프로필
            </Link>
            <button
              type="button"
              role="menuitem"
              className="w-full px-4 py-2 text-left text-sm text-rose-200 hover:bg-white/10"
              onClick={() => signOut({ callbackUrl: "/" })}
            >
              로그아웃
            </button>
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => signIn("google")}
      className="btn-press flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg border border-white/15 bg-white/5 px-4 text-xs font-semibold text-white transition hover:bg-white/10 md:min-h-0 md:min-w-0 md:px-3 md:py-1.5"
    >
      로그인
    </button>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const {
    playlists,
    selectedPlaylist,
    isPlaying,
    volume,
    isMuted,
    currentTimeSec,
    durationSec,
    togglePlay,
    setVolumeLevel,
    toggleMute,
    seekTo,
    playPlaylist,
    playNext,
    playPrevious,
  } = usePlayer();

  const { data: session, status } = useSession();

  const menu = [
    { href: "/", label: "홈", icon: "🏠" },
    { href: "/explore", label: "탐색", icon: "🔎" },
    { href: "/bookmarks", label: "내 보관함", icon: "📁" },
  ];

  if (pathname.startsWith("/intro")) {
    return <>{children}</>;
  }

  const emotionLabel = selectedPlaylist?.emotion ?? null;
  const progressPct =
    durationSec > 0 ? Math.min(100, Math.max(0, (currentTimeSec / durationSec) * 100)) : 0;

  return (
    <main className="min-h-screen bg-[#0f0f1a] pb-32 text-slate-100 max-md:pb-[calc(11rem+env(safe-area-inset-bottom,0px))]">
      <div className="mx-auto flex max-w-[1600px] items-center justify-end px-3 pt-4 md:px-6">
        <HeaderProfileMenu />
      </div>
      <div className="mx-auto flex max-w-[1600px] gap-4 px-3 py-4 md:gap-6 md:px-6">
        <aside className="hidden shrink-0 rounded-2xl border border-white/10 bg-white/[0.04] p-3 backdrop-blur-md md:block md:w-16 lg:w-60">
          <p className="text-lg font-bold tracking-wide text-violet-300">PODPICK</p>
          <nav className="mt-6 space-y-2">
            {menu.map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`btn-press block w-full rounded-lg px-3 py-2 text-sm font-medium transition ${
                    active
                      ? "bg-gradient-to-r from-violet-500/30 to-pink-500/30 text-white"
                      : "text-slate-300 hover:bg-white/10"
                  }`}
                >
                  <span className="hidden lg:inline">{item.label}</span>
                  <span className="lg:hidden">{item.icon}</span>
                </Link>
              );
            })}
          </nav>

          <Suspense fallback={null}>
            <SidebarEmotionNav />
          </Suspense>

          <div className="mt-6 border-t border-white/10 pt-4">
            {status === "loading" ? (
              <div className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-300">
                로그인 상태 확인 중...
              </div>
            ) : session?.user ? (
              <div className="space-y-3">
                <Link
                  href="/profile"
                  className={`flex w-full flex-col items-center gap-2 rounded-xl border border-white/10 bg-white/[0.06] p-3 transition lg:flex-row lg:items-center lg:gap-3 ${
                    pathname === "/profile"
                      ? "ring-1 ring-violet-400/50"
                      : "hover:border-white/20 hover:bg-white/[0.08]"
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={
                      session.user.image ??
                      `https://ui-avatars.com/api/?name=${encodeURIComponent(session.user.name ?? "User")}&background=6366f1&color=fff&size=128`
                    }
                    alt=""
                    width={44}
                    height={44}
                    referrerPolicy="no-referrer"
                    className="h-11 w-11 shrink-0 rounded-full object-cover ring-2 ring-violet-400/50"
                  />
                  <div className="hidden min-w-0 flex-1 text-center lg:block lg:text-left">
                    <span className="block truncate text-sm font-bold text-white">{session.user.name ?? "사용자"}</span>
                    {session.user.email ? (
                      <span className="mt-0.5 block truncate text-[11px] text-slate-400">{session.user.email}</span>
                    ) : null}
                  </div>
                </Link>
                <button
                  type="button"
                  onClick={() => signOut({ callbackUrl: "/" })}
                  className="btn-press w-full min-h-[44px] rounded-lg border border-rose-400/40 bg-rose-500/10 px-3 text-xs font-semibold text-rose-200 md:min-h-0 md:py-2"
                >
                  로그아웃
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => signIn("google")}
                className="btn-press flex min-h-[44px] w-full items-center justify-center gap-2 rounded-lg border border-violet-200/35 bg-gradient-to-r from-violet-500/80 to-pink-500/80 px-3 text-xs font-bold text-white shadow-[0_10px_25px_rgba(168,85,247,0.35)] transition hover:from-violet-400 hover:to-pink-400 md:min-h-0 md:py-2"
              >
                <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-white/20 text-[10px] font-extrabold text-white">
                  G
                </span>
                <span>Google로 로그인</span>
              </button>
            )}
          </div>
        </aside>

        <section className="min-w-0 flex-1">{children}</section>

        <aside className="hidden w-80 shrink-0 rounded-2xl border border-white/10 bg-white/[0.04] p-4 xl:block">
          <p className="text-xs font-semibold tracking-wide text-slate-400">현재 재생</p>
          <div className="mt-3 overflow-hidden rounded-xl border border-white/10 bg-[#16162a]">
            <PlaylistThumbnail musicUrl={selectedPlaylist?.musicUrl} size="lg" />
            <div className="p-4">
              <p className="truncate text-sm font-semibold text-white">
                {selectedPlaylist?.title ?? "재생 중인 곡이 없습니다"}
              </p>
              <p className="mt-1 text-xs text-slate-400">
                {selectedPlaylist?.emotion ?? "플레이리스트를 선택해 주세요"}
              </p>
            </div>
          </div>

          <div className="mt-5 border-t border-white/10 pt-4">
            <p className="text-xs font-semibold tracking-wide text-slate-400">재생목록</p>
            <ul className="mt-2 max-h-64 space-y-0.5 overflow-y-auto pr-1 text-sm">
              {playlists.length === 0 ? (
                <li className="rounded-lg border border-white/10 bg-white/5 px-3 py-3 text-center text-xs text-slate-500">
                  목록이 비어 있어요
                </li>
              ) : (
                playlists.map((p) => {
                  const active = selectedPlaylist?.id === p.id;
                  return (
                    <li key={p.id}>
                      <button
                        type="button"
                        onClick={() => playPlaylist(p)}
                        className={`btn-press flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left transition ${
                          active ? "bg-violet-500/25 text-white" : "text-slate-300 hover:bg-white/10"
                        }`}
                      >
                        <span className="min-w-0 flex-1 truncate">{p.title}</span>
                        <span className="shrink-0 text-[10px] text-slate-500">{p.emotion}</span>
                      </button>
                    </li>
                  );
                })
              )}
            </ul>
          </div>
        </aside>
      </div>

      {/* 모바일: 진행바 + 탭바 + 미니 플레이어 (768px 미만) */}
      <div className="fixed bottom-0 left-0 right-0 z-40 md:hidden">
        <div className="border-t border-white/10 bg-[#101022]/98 shadow-[0_-8px_32px_rgba(0,0,0,0.35)] backdrop-blur-md">
          <div className="relative h-1 w-full bg-white/10">
            <div
              className="absolute inset-y-0 left-0 bg-gradient-to-r from-violet-500 to-pink-500 transition-[width] duration-150"
              style={{ width: `${progressPct}%` }}
            />
          </div>
          <nav
            className="grid grid-cols-4 border-b border-white/10 bg-[#101022]/95"
            aria-label="주요 메뉴"
          >
            <Link
              href="/"
              className={`btn-press flex min-h-[44px] flex-col items-center justify-center gap-0.5 py-1 text-[11px] font-medium transition ${
                pathname === "/" ? "text-violet-300" : "text-slate-400"
              }`}
            >
              <span className="text-lg leading-none" aria-hidden>
                🏠
              </span>
              <span>홈</span>
            </Link>
            <Link
              href="/explore"
              className={`btn-press flex min-h-[44px] flex-col items-center justify-center gap-0.5 py-1 text-[11px] font-medium transition ${
                pathname === "/explore" ? "text-violet-300" : "text-slate-400"
              }`}
            >
              <span className="text-lg leading-none" aria-hidden>
                🔎
              </span>
              <span>탐색</span>
            </Link>
            <Link
              href="/#playlist-manage"
              className="btn-press flex min-h-[44px] flex-col items-center justify-center gap-0.5 py-1 text-[11px] font-medium text-slate-400 transition hover:text-slate-300"
            >
              <span className="text-lg leading-none" aria-hidden>
                ➕
              </span>
              <span>추가</span>
            </Link>
            <Link
              href="/bookmarks"
              className={`btn-press flex min-h-[44px] flex-col items-center justify-center gap-0.5 py-1 text-[11px] font-medium transition ${
                pathname === "/bookmarks" ? "text-violet-300" : "text-slate-400"
              }`}
            >
              <span className="text-lg leading-none" aria-hidden>
                📁
              </span>
              <span>보관함</span>
            </Link>
          </nav>
          <div className="flex items-center gap-3 px-3 py-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
            <PlaylistThumbnail musicUrl={selectedPlaylist?.musicUrl} size="sm" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-slate-100">
                {selectedPlaylist?.title ?? "선택된 곡 없음"}
              </p>
              <p className="truncate text-xs text-slate-500">{emotionLabel ?? "PodPick"}</p>
            </div>
            <button
              type="button"
              onClick={togglePlay}
              className="btn-press flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/20 bg-white/10 text-lg font-semibold text-white"
              aria-label={isPlaying ? "일시정지" : "재생"}
            >
              {isPlaying ? "⏸" : "▶"}
            </button>
          </div>
        </div>
      </div>

      {/* 태블릿·데스크톱 플레이어 */}
      <footer className="fixed bottom-0 left-0 right-0 z-30 hidden border-t border-white/10 bg-[#101022]/95 px-4 py-3 backdrop-blur-md md:block">
        <div className="mx-auto grid max-w-[1600px] items-center gap-4 md:grid-cols-[minmax(0,1.15fr)_minmax(280px,1fr)_auto]">
          <div className="flex min-w-0 items-center gap-3">
            <PlaylistThumbnail musicUrl={selectedPlaylist?.musicUrl} size="sm" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-slate-100">
                {selectedPlaylist?.title ?? "아직 선택된 곡이 없어요"}
              </p>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <p className="truncate text-xs text-slate-400">{emotionLabel ?? "PodPick"}</p>
                {isPlaying ? (
                  <div className="waveform waveform-compact player-waveform waveform running flex shrink-0" aria-hidden>
                    {Array.from({ length: 8 }).map((_, i) => (
                      <span key={i} className="waveform-bar" style={{ animationDelay: `${i * 0.06}s` }} />
                    ))}
                  </div>
                ) : null}
              </div>
            </div>
          </div>

          <div className="flex min-w-0 flex-wrap items-center gap-2 lg:gap-3">
            <button
              type="button"
              onClick={playPrevious}
              className="btn-press flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/20 bg-white/10 text-sm font-semibold text-slate-100"
              aria-label="이전 곡"
            >
              ⏮
            </button>
            <button
              type="button"
              onClick={togglePlay}
              className="btn-press flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/20 bg-white/10 text-sm font-semibold"
              aria-label={isPlaying ? "일시정지" : "재생"}
            >
              {isPlaying ? "⏸" : "▶"}
            </button>
            <button
              type="button"
              onClick={playNext}
              className="btn-press flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/20 bg-white/10 text-sm font-semibold text-slate-100"
              aria-label="다음 곡"
            >
              ⏭
            </button>
            <input
              type="range"
              min={0}
              max={Math.max(1, Math.floor(durationSec))}
              value={Math.min(currentTimeSec, durationSec || 1)}
              onChange={(e) => seekTo(Number(e.target.value))}
              onInput={(e) => seekTo(Number((e.target as HTMLInputElement).value))}
              className="min-h-[44px] min-w-0 flex-1 cursor-pointer py-2"
            />
            <span className="shrink-0 text-xs tabular-nums text-slate-300">
              {formatTime(currentTimeSec)} / {formatTime(durationSec)}
            </span>
          </div>

          <div className="flex items-center justify-start gap-3 md:justify-end">
            <button
              type="button"
              onClick={toggleMute}
              className="btn-press flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-white/15 text-base"
              aria-label={isMuted ? "음소거 해제" : "음소거"}
            >
              {isMuted ? "🔇" : "🔊"}
            </button>
            <input
              type="range"
              min={0}
              max={100}
              value={isMuted ? 0 : volume}
              onChange={(e) => setVolumeLevel(Number(e.target.value))}
              onInput={(e) => setVolumeLevel(Number((e.target as HTMLInputElement).value))}
              className="h-2 w-28 min-h-[44px] cursor-pointer py-2"
            />
          </div>
        </div>
      </footer>
    </main>
  );
}

export default function AppFrame({ children }: { children: React.ReactNode }) {
  return (
    <PlayerProvider>
      <Shell>{children}</Shell>
    </PlayerProvider>
  );
}
