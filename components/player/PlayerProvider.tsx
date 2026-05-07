"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { Playlist } from "@/types/playlist";
import { getYouTubeVideoId } from "@/lib/youtube";

type PlayerContextType = {
  playlists: Playlist[];
  loading: boolean;
  error: string | null;
  selectedPlaylist: Playlist | null;
  isPlaying: boolean;
  volume: number;
  isMuted: boolean;
  currentTimeSec: number;
  durationSec: number;
  refreshPlaylists: () => Promise<void>;
  playPlaylist: (playlist: Playlist) => void;
  togglePlay: () => void;
  setVolumeLevel: (value: number) => void;
  toggleMute: () => void;
  seekTo: (sec: number) => void;
  playNext: () => void;
  playPrevious: () => void;
};

const PlayerContext = createContext<PlayerContextType | null>(null);

declare global {
  interface Window {
    YT?: any;
    onYouTubeIframeAPIReady?: () => void;
  }
}

type Props = { children: React.ReactNode };

const mockPlaylists: Playlist[] = [
  {
    id: 1,
    title: "새벽에 듣는 재즈",
    emotion: "새벽감성",
    musicUrl: "",
    likeCount: 5,
    savedCount: 3,
  },
  {
    id: 2,
    title: "기분 좋은 하루",
    emotion: "행복",
    musicUrl: "",
    likeCount: 8,
    savedCount: 6,
  },
];

export default function PlayerProvider({ children }: Props) {
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPlaylist, setSelectedPlaylist] = useState<Playlist | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [ytApiReady, setYtApiReady] = useState(false);
  const [volume, setVolume] = useState(80);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTimeSec, setCurrentTimeSec] = useState(0);
  const [durationSec, setDurationSec] = useState(0);
  const playerRef = useRef<any>(null);
  const playerHostRef = useRef<HTMLDivElement | null>(null);

  async function refreshPlaylists() {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/playlists", { cache: "no-store" });
      if (!response.ok) throw new Error("플레이리스트를 불러오지 못했습니다.");
      const data = (await response.json()) as Playlist[];
      setPlaylists(data);
      setSelectedPlaylist((prev) => {
        if (!prev) return data[0] ?? null;
        return data.find((p) => p.id === prev.id) ?? prev;
      });
    } catch (e) {
      setPlaylists(mockPlaylists);
      setSelectedPlaylist((prev) => prev ?? mockPlaylists[0] ?? null);
      setError("백엔드 연결 실패: 목업 데이터를 표시합니다.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refreshPlaylists();
  }, []);

  useEffect(() => {
    if (window.YT?.Player) {
      setYtApiReady(true);
      return;
    }
    window.onYouTubeIframeAPIReady = () => setYtApiReady(true);
    const script = document.createElement("script");
    script.src = "https://www.youtube.com/iframe_api";
    script.async = true;
    document.body.appendChild(script);
  }, []);

  useEffect(() => {
    if (!ytApiReady || !playerHostRef.current || playerRef.current) return;
    playerRef.current = new window.YT.Player(playerHostRef.current, {
      videoId: "",
      playerVars: { autoplay: 1, mute: 0, playsinline: 1, rel: 0 },
      events: {
        onReady: (event: any) => {
          event.target.unMute?.();
          event.target.setVolume?.(80);
        },
        onStateChange: (event: any) => {
          if (event.data === window.YT.PlayerState.PLAYING) setIsPlaying(true);
          if (event.data === window.YT.PlayerState.PAUSED) setIsPlaying(false);
        },
      },
    });
  }, [ytApiReady]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      const player = playerRef.current;
      if (!player?.getCurrentTime) return;
      const current = Number(player.getCurrentTime() ?? 0);
      const total = Number(player.getDuration?.() ?? 0);
      setCurrentTimeSec(current);
      setDurationSec(total);
    }, 500);
    return () => window.clearInterval(timer);
  }, []);

  const playPlaylist = useCallback((playlist: Playlist) => {
    setSelectedPlaylist(playlist);
    const player = playerRef.current;
    const videoId = getYouTubeVideoId(playlist.musicUrl);
    if (player && videoId) {
      player.loadVideoById(videoId);
      player.unMute?.();
      player.setVolume?.(volume);
      setIsPlaying(true);
      setIsMuted(false);
      return;
    }
    if (playlist.musicUrl) {
      window.open(playlist.musicUrl, "_blank", "noopener,noreferrer");
    }
  }, [volume]);

  function togglePlay() {
    const player = playerRef.current;
    if (!player?.getPlayerState) return;
    const state = player.getPlayerState();
    if (state === window.YT?.PlayerState?.PLAYING) {
      player.pauseVideo?.();
      setIsPlaying(false);
    } else {
      player.playVideo?.();
      setIsPlaying(true);
    }
  }

  function setVolumeLevel(value: number) {
    const clamped = Math.max(0, Math.min(100, value));
    setVolume(clamped);
    const player = playerRef.current;
    player?.setVolume?.(clamped);
    if (clamped === 0) {
      player?.mute?.();
      setIsMuted(true);
    } else {
      player?.unMute?.();
      setIsMuted(false);
    }
  }

  function toggleMute() {
    const player = playerRef.current;
    if (!player) return;
    if (isMuted) {
      player.unMute?.();
      player.setVolume?.(volume || 80);
      setIsMuted(false);
    } else {
      player.mute?.();
      setIsMuted(true);
    }
  }

  function seekTo(sec: number) {
    const player = playerRef.current;
    if (!player?.seekTo) return;
    player.seekTo(sec, true);
    setCurrentTimeSec(sec);
  }

  const playNext = useCallback(() => {
    if (!playlists.length) return;
    const current = selectedPlaylist;
    if (!current) {
      playPlaylist(playlists[0]);
      return;
    }
    const idx = playlists.findIndex((p) => p.id === current.id);
    const next = playlists[(idx + 1) % playlists.length];
    playPlaylist(next);
  }, [playlists, selectedPlaylist, playPlaylist]);

  const playPrevious = useCallback(() => {
    if (!playlists.length) return;
    const current = selectedPlaylist;
    if (!current) {
      playPlaylist(playlists[playlists.length - 1]);
      return;
    }
    const idx = playlists.findIndex((p) => p.id === current.id);
    const prev = playlists[(idx - 1 + playlists.length) % playlists.length];
    playPlaylist(prev);
  }, [playlists, selectedPlaylist, playPlaylist]);

  const value = useMemo<PlayerContextType>(
    () => ({
      playlists,
      loading,
      error,
      selectedPlaylist,
      isPlaying,
      volume,
      isMuted,
      currentTimeSec,
      durationSec,
      refreshPlaylists,
      playPlaylist,
      togglePlay,
      setVolumeLevel,
      toggleMute,
      seekTo,
      playNext,
      playPrevious,
    }),
    [
      playlists,
      loading,
      error,
      selectedPlaylist,
      isPlaying,
      volume,
      isMuted,
      currentTimeSec,
      durationSec,
      playPlaylist,
      playNext,
      playPrevious,
    ]
  );

  return (
    <PlayerContext.Provider value={value}>
      <div
        ref={playerHostRef}
        className="pointer-events-none fixed left-[-9999px] top-[-9999px] h-px w-px opacity-0"
        aria-hidden="true"
      />
      {children}
    </PlayerContext.Provider>
  );
}

export function usePlayer() {
  const ctx = useContext(PlayerContext);
  if (!ctx) throw new Error("usePlayer must be used within PlayerProvider");
  return ctx;
}
