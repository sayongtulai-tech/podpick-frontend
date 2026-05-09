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

/** Album art ambient glow — presentation only (RGB tuple for rgba shadows) */
function nowPlayingGlowRgb(emotion: string | null | undefined): string {
  const map: Record<string, string> = {
    새벽감성: "139, 92, 246",
    행복: "245, 158, 11",
    설렘: "236, 72, 153",
    힐링: "52, 211, 153",
    집중: "56, 189, 248",
    우울함: "100, 116, 139",
    운동: "244, 63, 94",
    드라이브: "56, 189, 248",
    비오는날: "148, 163, 184",
    신남: "163, 230, 53",
    몽환적: "168, 85, 247",
    그리움: "99, 102, 241",
    여름: "14, 165, 233",
    겨울: "125, 211, 252",
    카페: "180, 83, 9",
    여행: "45, 212, 191",
    로맨틱: "217, 70, 239",
    파티: "234, 179, 8",
    명상: "129, 140, 248",
    공부: "59, 130, 246",
    수면: "99, 102, 241",
  };
  return map[emotion ?? ""] ?? "168, 85, 247";
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
    return (
      <div
        className="flex min-h-[44px] items-center gap-2 rounded-full border border-white/15 bg-white/[0.06] px-3 py-2 backdrop-blur-sm md:min-h-0 md:py-1.5"
        aria-busy="true"
        aria-label="프로필 로딩 중"
      >
        <div className="h-8 w-8 shrink-0 skeleton-premium rounded-full" />
        <div className="hidden min-w-[72px] space-y-1.5 sm:block">
          <div className="h-2.5 w-16 skeleton-premium rounded" />
          <div className="h-2 w-12 skeleton-premium rounded opacity-80" />
        </div>
      </div>
    );
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
              <div className="space-y-2.5 rounded-xl border border-white/10 bg-gradient-to-br from-white/[0.08] to-white/[0.03] p-3 shadow-inner">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 shrink-0 rounded-full bg-violet-400/40 shadow-[0_0_10px_rgba(167,139,250,0.35)]" />
                  <div className="h-2.5 w-28 skeleton-premium rounded-full" />
                </div>
                <div className="h-10 skeleton-premium rounded-lg" />
                <div className="h-8 skeleton-premium rounded-lg" />
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
              <div className="space-y-3 rounded-xl border border-violet-300/20 bg-gradient-to-br from-violet-500/12 via-transparent to-pink-500/10 p-3">
                <p className="text-xs font-semibold text-violet-100">PodPick을 시작해보세요</p>
                <p className="text-[11px] leading-relaxed text-slate-300">
                  로그인 없이도 감정 피드를 볼 수 있고, 로그인하면 나만의 플레이리스트를 저장하고 공유할 수 있어요.
                </p>
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
              </div>
            )}
          </div>
        </aside>

        <section className="min-w-0 flex-1">{children}</section>

        <aside className="hidden w-80 shrink-0 rounded-2xl border border-white/10 bg-white/[0.04] p-4 xl:block">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-semibold tracking-wide text-slate-400">현재 재생</p>
            {selectedPlaylist ? (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-black/30 px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-slate-400">
                <span
                  className={`h-1.5 w-1.5 rounded-full shadow-[0_0_10px_rgba(52,211,153,0.9)] ${isPlaying ? "animate-live-dot bg-emerald-400" : "bg-slate-600"}`}
                />
                {isPlaying ? "playing" : "idle"}
              </span>
            ) : null}
          </div>
          <div
            className="relative mt-3 overflow-hidden rounded-2xl border border-white/10 bg-[#12121f]/95 shadow-[0_20px_56px_rgba(0,0,0,0.45)]"
            style={{
              boxShadow:
                selectedPlaylist && isPlaying
                  ? `0 0 0 1px rgba(255,255,255,0.06), 0 24px 70px rgba(${nowPlayingGlowRgb(emotionLabel)}, 0.28)`
                  : undefined,
            }}
          >
            {selectedPlaylist ? (
              <>
                <div
                  className="pointer-events-none absolute -left-[45%] -top-[55%] h-[140%] w-[90%] animate-ambient-spin rounded-full opacity-70 blur-3xl transition-opacity duration-700"
                  style={{
                    background: `radial-gradient(circle at 50% 50%, rgba(${nowPlayingGlowRgb(emotionLabel)}, 0.42) 0%, transparent 62%)`,
                  }}
                />
                <div
                  className="pointer-events-none absolute -bottom-[40%] -right-[35%] h-[110%] w-[80%] animate-ambient-spin-reverse rounded-full opacity-50 blur-3xl"
                  style={{
                    background: `radial-gradient(circle at 50% 50%, rgba(${nowPlayingGlowRgb(emotionLabel)}, 0.28) 0%, transparent 58%)`,
                  }}
                />
                <div className="relative">
                  <div
                    className="relative overflow-hidden rounded-t-2xl"
                    style={{
                      boxShadow: `0 0 48px rgba(${nowPlayingGlowRgb(emotionLabel)}, ${isPlaying ? 0.42 : 0.22})`,
                    }}
                  >
                    <div
                      className={`pointer-events-none absolute inset-0 z-10 rounded-t-2xl ring-1 ring-inset transition-all duration-500 ${
                        isPlaying ? "ring-white/25 shadow-[inset_0_0_40px_rgba(255,255,255,0.06)]" : "ring-white/10"
                      }`}
                    />
                    <PlaylistThumbnail musicUrl={selectedPlaylist.musicUrl} size="lg" />
                    {isPlaying ? (
                      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-white/[0.04]" />
                    ) : null}
                  </div>
                  <div className="relative border-t border-white/10 bg-gradient-to-b from-black/35 to-[#16162a] px-4 pb-4 pt-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-white">{selectedPlaylist.title}</p>
                        <p className="mt-1 text-xs text-slate-400">{selectedPlaylist.emotion}</p>
                      </div>
                      <div
                        className={`waveform panel-waveform-compact flex shrink-0 drop-shadow-[0_0_12px_rgba(168,85,247,0.35)] ${
                          isPlaying ? "running" : "paused"
                        }`}
                        aria-hidden
                      >
                        {Array.from({ length: 10 }).map((_, i) => (
                          <span key={i} className="waveform-bar" style={{ animationDelay: `${i * 0.06}s` }} />
                        ))}
                      </div>
                    </div>
                    <div
                      className={`pointer-events-none mt-4 flex h-9 items-end justify-center gap-1 opacity-90 transition-opacity duration-500 ${
                        isPlaying ? "opacity-100" : "opacity-40"
                      }`}
                      aria-hidden
                    >
                      {Array.from({ length: 28 }).map((_, i) => (
                        <span
                          key={i}
                          className="w-0.5 rounded-full bg-gradient-to-t from-violet-600/50 via-fuchsia-400/70 to-pink-400/60"
                          style={{
                            height: `${18 + (i % 5) * 8}%`,
                            animation: "waveformPulse 0.95s ease-in-out infinite",
                            animationDelay: `${(i % 10) * 0.05}s`,
                            animationPlayState: isPlaying ? "running" : "paused",
                          }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="relative p-5">
                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_30%_20%,rgba(124,58,237,0.2),transparent_55%),radial-gradient(ellipse_at_80%_80%,rgba(236,72,153,0.14),transparent_50%)]" />
                <div className="relative aspect-video overflow-hidden rounded-xl border border-violet-300/20 bg-gradient-to-br from-violet-500/[0.12] via-[#141428] to-pink-500/[0.1] shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
                  <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-[size:24px_24px] opacity-40" />
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(168,85,247,0.08),transparent_65%)]" />
                  <div className="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-3 px-4 text-center">
                    <span className="text-4xl opacity-95 drop-shadow-[0_8px_24px_rgba(139,92,246,0.35)]">🌙</span>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-violet-200/90">quiet stage</p>
                    <div className="flex h-8 items-end justify-center gap-0.5 opacity-50">
                      {Array.from({ length: 12 }).map((_, i) => (
                        <span
                          key={i}
                          className="w-0.5 rounded-full bg-gradient-to-t from-violet-600/40 to-fuchsia-400/50"
                          style={{ height: `${10 + (i % 4) * 5}px` }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
                <p className="relative mt-4 text-sm font-semibold text-white">아직 재생 중인 무드가 없어요</p>
                <p className="relative mt-1 text-xs leading-relaxed text-slate-400">
                  피드에서 카드를 눌러 재생하면 커버와 무드 라이트가 이 패널에 이어져요.
                </p>
              </div>
            )}
          </div>

          <div className="mt-5 border-t border-white/10 pt-4">
            <p className="text-xs font-semibold tracking-wide text-slate-400">재생목록</p>
            <ul className="mt-2 max-h-64 space-y-0.5 overflow-y-auto pr-1 text-sm">
              {playlists.length === 0 ? (
                <li className="rounded-xl border border-violet-300/15 bg-gradient-to-br from-violet-500/[0.08] via-[#16162a] to-pink-500/[0.06] px-4 py-5 text-center shadow-inner">
                  <p className="text-2xl">✨</p>
                  <p className="mt-2 text-xs font-semibold text-slate-100">큐가 비어 있어요</p>
                  <p className="mt-1 text-[11px] leading-relaxed text-slate-400">
                    홈 피드가 채워지면 감정별 플레이리스트가 이 길 위에 차례로 올라와요.
                  </p>
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
        <div className="border-t border-white/15 bg-gradient-to-t from-[#0e0e1a]/96 via-[#101022]/94 to-[#14142a]/92 pb-[max(0.45rem,env(safe-area-inset-bottom))] shadow-[0_-16px_40px_rgba(6,8,20,0.55),0_-2px_12px_rgba(168,85,247,0.16)] backdrop-blur-xl">
          <nav
            className="grid grid-cols-4 border-b border-white/10 bg-[#101022]/60"
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
          <div className="flex items-center gap-3 px-3 py-1.5">
            <div className="relative shrink-0">
              <div
                className="absolute inset-0 rounded-xl blur-md transition-opacity duration-500"
                style={{
                  opacity: selectedPlaylist ? 0.85 : 0.35,
                  background: selectedPlaylist
                    ? `radial-gradient(circle at 50% 50%, rgba(${nowPlayingGlowRgb(emotionLabel)}, 0.55) 0%, transparent 68%)`
                    : undefined,
                }}
                aria-hidden
              />
              <div className="relative rounded-xl shadow-[0_0_28px_rgba(0,0,0,0.35)]">
                <PlaylistThumbnail musicUrl={selectedPlaylist?.musicUrl} size="sm" />
              </div>
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-slate-100">
                {selectedPlaylist?.title ?? "무드를 골라주세요"}
              </p>
              <div className="mt-0.5 flex flex-wrap items-center gap-2">
                <p className="truncate text-xs text-slate-500">{emotionLabel ?? "PodPick"}</p>
                {selectedPlaylist && isPlaying ? (
                  <div
                    className="waveform panel-waveform-compact flex shrink-0 opacity-95 drop-shadow-[0_0_8px_rgba(168,85,247,0.35)] running"
                    aria-hidden
                  >
                    {Array.from({ length: 8 }).map((_, i) => (
                      <span key={i} className="waveform-bar" style={{ animationDelay: `${i * 0.06}s` }} />
                    ))}
                  </div>
                ) : null}
              </div>
              {durationSec > 0 ? (
                <p className="mt-0.5 truncate text-[10px] tabular-nums text-slate-500">
                  {formatTime(currentTimeSec)} / {formatTime(durationSec)}
                </p>
              ) : null}
            </div>
            <button
              type="button"
              onClick={togglePlay}
              className={`btn-press flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-violet-200/40 bg-gradient-to-br from-violet-400/85 to-pink-500/85 text-lg font-semibold text-white shadow-[0_8px_22px_rgba(168,85,247,0.45)] transition-all duration-300 ease-out hover:scale-[1.03] active:scale-[0.96] ${
                isPlaying ? "animate-pulse" : ""
              }`}
              aria-label={isPlaying ? "일시정지" : "재생"}
            >
              {isPlaying ? "⏸" : "▶"}
            </button>
          </div>

          {/* mini player 아래쪽 진행바 */}
          <div className="px-3 pb-1">
            <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-white/15 shadow-[inset_0_1px_2px_rgba(0,0,0,0.35)]">
              <div
                className="absolute inset-y-0 left-0 bg-gradient-to-r from-violet-400 via-fuchsia-400 to-pink-400 shadow-[0_0_10px_rgba(236,72,153,0.45)] transition-[width] duration-200"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* 태블릿·데스크톱 플레이어 */}
      <footer className="fixed bottom-0 left-0 right-0 z-30 hidden border-t border-white/15 bg-gradient-to-t from-[#0e0e1a]/96 via-[#101022]/94 to-[#15152c]/90 px-4 py-2.5 shadow-[0_-20px_48px_rgba(5,7,18,0.6),0_-2px_12px_rgba(168,85,247,0.16)] backdrop-blur-xl md:block">
        <div className="mx-auto grid max-w-[1600px] grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-5">
          <div className="flex min-w-0 items-center gap-3">
            <div className="relative shrink-0">
              <div
                className="absolute inset-0 rounded-xl blur-md transition-opacity duration-500"
                style={{
                  opacity: selectedPlaylist ? 0.75 : 0.3,
                  background: selectedPlaylist
                    ? `radial-gradient(circle at 50% 50%, rgba(${nowPlayingGlowRgb(emotionLabel)}, 0.5) 0%, transparent 68%)`
                    : undefined,
                }}
                aria-hidden
              />
              <div className="relative rounded-xl shadow-[0_0_24px_rgba(0,0,0,0.35)]">
                <PlaylistThumbnail musicUrl={selectedPlaylist?.musicUrl} size="sm" />
              </div>
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-slate-100">
                {selectedPlaylist?.title ?? "재생할 무드를 선택해 주세요"}
              </p>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <p className="truncate text-xs text-slate-400">{emotionLabel ?? "PodPick"}</p>
                {isPlaying ? (
                  <div
                    className="waveform player-waveform panel-waveform flex shrink-0 opacity-95 drop-shadow-[0_0_8px_rgba(168,85,247,0.45)] transition-all duration-300 ease-out running"
                    aria-hidden
                  >
                    {Array.from({ length: 10 }).map((_, i) => (
                      <span key={i} className="waveform-bar" style={{ animationDelay: `${i * 0.06}s` }} />
                    ))}
                  </div>
                ) : null}
              </div>
            </div>
          </div>

          <div className="flex w-[min(54vw,560px)] min-w-[300px] flex-col items-center gap-1.5">
            <div className="flex items-center gap-2 lg:gap-3">
              <button
                type="button"
                onClick={playPrevious}
                className="btn-press flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-white/10 text-sm font-semibold text-slate-100 shadow-[0_5px_16px_rgba(2,6,23,0.35)] transition-all duration-200 hover:border-violet-300/35 hover:bg-white/14 active:scale-[0.96]"
                aria-label="이전 곡"
              >
                ⏮
              </button>
              <button
                type="button"
                onClick={togglePlay}
                className={`btn-press flex h-11 w-11 items-center justify-center rounded-full border border-violet-200/40 bg-gradient-to-br from-violet-400/90 to-pink-500/90 text-sm font-semibold text-white shadow-[0_10px_26px_rgba(168,85,247,0.5)] transition-all duration-300 ease-out hover:scale-[1.03] hover:brightness-110 active:scale-[0.95] ${
                  isPlaying ? "animate-pulse" : ""
                }`}
                aria-label={isPlaying ? "일시정지" : "재생"}
              >
                {isPlaying ? "⏸" : "▶"}
              </button>
              <button
                type="button"
                onClick={playNext}
                className="btn-press flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-white/10 text-sm font-semibold text-slate-100 shadow-[0_5px_16px_rgba(2,6,23,0.35)] transition-all duration-200 hover:border-violet-300/35 hover:bg-white/14 active:scale-[0.96]"
                aria-label="다음 곡"
              >
                ⏭
              </button>
            </div>

            <div className="w-full max-w-[500px]">
              <div className="mb-1.5 flex items-center justify-between px-0.5 text-[11px] tabular-nums text-slate-400">
                <span>{formatTime(currentTimeSec)}</span>
                <span>{formatTime(durationSec)}</span>
              </div>
              <div className="rounded-full border border-white/10 bg-white/[0.04] px-2 shadow-[inset_0_1px_1px_rgba(255,255,255,0.04)]">
                <input
                  type="range"
                  min={0}
                  max={Math.max(1, Math.floor(durationSec))}
                  value={Math.min(currentTimeSec, durationSec || 1)}
                  onChange={(e) => seekTo(Number(e.target.value))}
                  onInput={(e) => seekTo(Number((e.target as HTMLInputElement).value))}
                  className="min-h-[34px] w-full cursor-pointer py-1 accent-violet-400"
                />
              </div>
            </div>
          </div>

          <div className="ml-auto flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={toggleMute}
              className="btn-press flex h-10 w-10 items-center justify-center rounded-lg border border-white/20 bg-white/[0.04] text-base text-slate-100 transition-all duration-200 hover:border-violet-300/35 hover:bg-white/[0.09] active:scale-[0.96]"
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
              className="h-2 w-24 min-h-[40px] cursor-pointer py-1 accent-violet-400"
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
