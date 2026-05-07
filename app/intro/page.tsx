"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { signIn, useSession } from "next-auth/react";
import { EMOTION_INTRO_CHIP_CLASS, EMOTION_ONLY } from "@/lib/emotions";

export default function IntroPage() {
  const router = useRouter();
  const { status } = useSession();
  const [showSplash, setShowSplash] = useState(true);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [introVisible, setIntroVisible] = useState(false);
  const [miniPlaying, setMiniPlaying] = useState(false);
  const [authConfigReady, setAuthConfigReady] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const alreadySeen = localStorage.getItem("podpick:introSeen") === "true";
    if (alreadySeen) {
      router.replace("/");
      return;
    }
    const splashTimer = window.setTimeout(() => {
      setShowSplash(false);
      setIntroVisible(true);
    }, 1500);
    return () => window.clearTimeout(splashTimer);
  }, [router]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    setAuthError(params.get("error"));
  }, []);

  useEffect(() => {
    let alive = true;
    async function checkAuthProvider() {
      try {
        const response = await fetch("/api/auth/providers", { cache: "no-store" });
        if (!response.ok) return;
        const providers = (await response.json()) as Record<string, unknown>;
        if (alive) {
          setAuthConfigReady(Boolean(providers?.google));
        }
      } catch {
        if (alive) setAuthConfigReady(false);
      }
    }
    checkAuthProvider();
    return () => {
      alive = false;
    };
  }, []);

  const introClassName = useMemo(
    () =>
      `transition-opacity duration-500 ${introVisible ? "opacity-100" : "pointer-events-none opacity-0"}`,
    [introVisible]
  );

  function finishIntro() {
    if (typeof window !== "undefined") {
      localStorage.setItem("podpick:introSeen", "true");
    }
    router.replace("/");
  }

  function handleStart() {
    if (status !== "authenticated") {
      setShowLoginModal(true);
      return;
    }
    finishIntro();
  }

  async function handleGoogleLogin() {
    if (!authConfigReady) return;
    if (typeof window !== "undefined") {
      localStorage.setItem("podpick:introSeen", "true");
    }
    await signIn("google", { callbackUrl: "/" });
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#0f0f1a] text-slate-100">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-[-120px] h-80 w-80 -translate-x-1/2 rounded-full bg-violet-500/30 blur-[120px]" />
        <div className="absolute bottom-[-100px] right-[-70px] h-72 w-72 rounded-full bg-rose-500/20 blur-[120px]" />
      </div>

      {showSplash && (
        <section className="intro-fade fixed inset-0 z-40 flex flex-col items-center justify-center bg-[#0f0f1a]">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute left-1/2 top-1/2 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-r from-violet-500/35 to-pink-500/35 blur-[110px]" />
          </div>
          <p className="relative z-10 text-4xl font-black tracking-[0.22em] text-white">
            PODPICK<span className="ml-1 text-violet-300">..</span>
          </p>
          <div className="relative z-10 mt-5 flex items-center gap-2">
            <span className="intro-loading-dot" />
            <span className="intro-loading-dot [animation-delay:0.2s]" />
            <span className="intro-loading-dot [animation-delay:0.4s]" />
          </div>
        </section>
      )}

      <section className={`${introClassName} relative z-10 flex min-h-screen flex-col px-5 pb-6 pt-8 md:px-10`}>
        <header className="intro-fade-up [animation-delay:0s]">
          <p className="inline-flex items-center gap-2 text-xl font-extrabold tracking-[0.18em]">
            POD<span className="text-violet-300">PICK</span>
          </p>
        </header>

        <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-center justify-center">
          <h1 className="intro-fade-up text-center text-3xl font-black leading-tight md:text-5xl [animation-delay:0.2s]">
            지금 기분에 딱 맞는{" "}
            <span className="bg-gradient-to-r from-violet-300 via-fuchsia-300 to-pink-300 bg-clip-text text-transparent">
              플레이리스트
            </span>
          </h1>
          <p className="intro-fade-up mt-4 text-center text-sm text-slate-300 md:text-base [animation-delay:0.4s]">
            감정을 고르면, 음악이 따라와요
          </p>

          <div className="intro-fade-up mx-auto mt-8 max-h-[min(40vh,240px)] w-full max-w-xl overflow-y-auto px-1 [animation-delay:0.6s]">
            <div className="flex flex-wrap items-center justify-center gap-2">
              {EMOTION_ONLY.map((label) => (
                <button
                  key={label}
                  type="button"
                  className={`intro-chip rounded-full border px-3 py-1.5 text-xs font-semibold md:px-4 md:py-2 md:text-sm ${
                    EMOTION_INTRO_CHIP_CLASS[label] ?? "border-white/20 bg-white/10 text-slate-200"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="intro-fade-up mt-10 flex w-full max-w-sm flex-col gap-3 [animation-delay:0.8s]">
            <button
              type="button"
              onClick={handleStart}
              className="intro-start-btn rounded-2xl bg-gradient-to-r from-violet-500 to-pink-500 px-6 py-3 text-sm font-bold text-white"
            >
              지금 시작하기
            </button>
            <button
              type="button"
              onClick={finishIntro}
              className="rounded-2xl border border-white/15 bg-white/5 px-6 py-3 text-sm font-semibold text-slate-200 transition hover:bg-white/10"
            >
              둘러보기
            </button>
          </div>
        </div>

        <footer className="intro-fade-up mx-auto flex w-full max-w-3xl items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3 backdrop-blur-md [animation-delay:1s]">
          <div className="min-w-0">
            <p className="text-xs text-slate-400">Now Playing</p>
            <p className="truncate text-sm font-semibold text-slate-100">새벽 감성 플레이리스트</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMiniPlaying((prev) => !prev)}
              className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold transition hover:bg-white/20"
            >
              {miniPlaying ? "⏸" : "▶"}
            </button>
            <div className="flex h-5 items-end gap-1">
              {[0, 1, 2, 3].map((index) => (
                <span
                  key={index}
                  className="eq-bar w-1 rounded-full bg-emerald-300"
                  style={{ animationDelay: `${index * 0.15}s` }}
                />
              ))}
            </div>
          </div>
        </footer>
      </section>

      {showLoginModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div className="w-full max-w-sm rounded-2xl border border-white/15 bg-[#17172a] p-5 shadow-2xl">
            <p className="text-lg font-bold text-white">Google 로그인</p>
            <p className="mt-2 text-sm text-slate-300">
              시작하려면 Google 계정으로 로그인해 주세요.
            </p>
            {authError && (
              <p className="mt-2 rounded-lg border border-rose-300/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-200">
                로그인에 실패했습니다({authError}). Google OAuth 설정값을 확인해 주세요.
              </p>
            )}
            {!authConfigReady && (
              <p className="mt-2 rounded-lg border border-amber-300/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
                Google OAuth 설정이 필요합니다. `GOOGLE_CLIENT_ID`와
                `GOOGLE_CLIENT_SECRET`를 `.env.local`에 추가해 주세요.
              </p>
            )}
            <div className="mt-5 flex gap-2">
              <button
                type="button"
                onClick={() => setShowLoginModal(false)}
                className="flex-1 rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold text-slate-200"
              >
                닫기
              </button>
              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={!authConfigReady}
                className="flex-1 rounded-xl bg-gradient-to-r from-violet-500 to-pink-500 px-4 py-2 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-60"
              >
                Google 로그인
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
