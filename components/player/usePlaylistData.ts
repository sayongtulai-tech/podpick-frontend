"use client";

import { useCallback, useEffect, useState } from "react";
import { Playlist } from "@/types/playlist";

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

export function usePlaylistData() {
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPlaylist, setSelectedPlaylist] = useState<Playlist | null>(null);

  const refreshPlaylists = useCallback(async () => {
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
    } catch {
      const canUseMock = process.env.NODE_ENV !== "production";
      if (canUseMock) {
        setPlaylists(mockPlaylists);
        setSelectedPlaylist((prev) => prev ?? mockPlaylists[0] ?? null);
        setError("백엔드 연결 실패: 개발용 목업 데이터를 표시합니다.");
      } else {
        setPlaylists([]);
        setSelectedPlaylist(null);
        setError("데이터 서버 연결에 실패했습니다. 잠시 후 다시 시도해 주세요.");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshPlaylists();
  }, [refreshPlaylists]);

  return {
    playlists,
    loading,
    error,
    selectedPlaylist,
    setSelectedPlaylist,
    refreshPlaylists,
  };
}
