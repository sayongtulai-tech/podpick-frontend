"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Playlist } from "@/types/playlist";
import { EMOTIONS, type EmotionFilter } from "@/lib/emotions";

export const SORT_OPTIONS = ["최신순", "오래된순", "제목순", "좋아요순", "저장순"] as const;
export type SortOption = (typeof SORT_OPTIONS)[number];

export function usePlaylistViewData(playlists: Playlist[]) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [keyword, setKeyword] = useState("");
  const [sortOption, setSortOption] = useState<SortOption>("최신순");

  const emotionFilter = useMemo((): EmotionFilter => {
    const raw = searchParams.get("emotion");
    if (!raw) return "전체";
    return (EMOTIONS as readonly string[]).includes(raw) ? (raw as EmotionFilter) : "전체";
  }, [searchParams]);

  function applyEmotionFilter(tab: EmotionFilter) {
    const params = new URLSearchParams(searchParams.toString());
    if (tab === "전체") {
      params.delete("emotion");
    } else {
      params.set("emotion", tab);
    }
    const qs = params.toString();
    router.push(qs ? `/?${qs}` : "/", { scroll: false });
  }

  const topLiked = useMemo(
    () => [...playlists].sort((a, b) => (b.likeCount ?? 0) - (a.likeCount ?? 0)).slice(0, 6),
    [playlists],
  );

  const filteredPlaylists = useMemo(() => {
    const q = keyword.trim().toLowerCase();
    const filtered = playlists.filter((item) => {
      const byEmotion = emotionFilter === "전체" || item.emotion === emotionFilter;
      const byKeyword =
        q.length === 0 ||
        item.title.toLowerCase().includes(q) ||
        item.emotion.toLowerCase().includes(q);
      return byEmotion && byKeyword;
    });

    const sorted = [...filtered];
    if (sortOption === "최신순") sorted.sort((a, b) => b.id - a.id);
    if (sortOption === "오래된순") sorted.sort((a, b) => a.id - b.id);
    if (sortOption === "제목순") sorted.sort((a, b) => a.title.localeCompare(b.title, "ko"));
    if (sortOption === "좋아요순") sorted.sort((a, b) => (b.likeCount ?? 0) - (a.likeCount ?? 0));
    if (sortOption === "저장순") sorted.sort((a, b) => (b.savedCount ?? 0) - (a.savedCount ?? 0));
    return sorted;
  }, [playlists, keyword, emotionFilter, sortOption]);

  return {
    keyword,
    setKeyword,
    sortOption,
    setSortOption,
    emotionFilter,
    applyEmotionFilter,
    topLiked,
    filteredPlaylists,
  };
}
