/** 감정 카테고리 (전체 제외 순서 = 탐색 섹션 정렬 우선순위) */
export const EMOTION_ONLY = [
  "새벽감성",
  "행복",
  "설렘",
  "힐링",
  "집중",
  "우울함",
  "운동",
  "드라이브",
  "비오는날",
  "신남",
  "몽환적",
  "그리움",
  "여름",
  "겨울",
  "카페",
  "여행",
  "로맨틱",
  "파티",
  "명상",
  "공부",
  "수면",
] as const;

export type EmotionOnly = (typeof EMOTION_ONLY)[number];

export const EMOTIONS = ["전체", ...EMOTION_ONLY] as const;
export type EmotionFilter = (typeof EMOTIONS)[number];

/** 사이드바·네비 등 표시용 (라벨 직후 이모지) */
export const EMOTION_EMOJI: Record<string, string> = {
  전체: "🎵",
  새벽감성: "🌃",
  행복: "☀️",
  설렘: "💗",
  힐링: "🌿",
  집중: "🎯",
  우울함: "🌧",
  운동: "🏃",
  드라이브: "🚗",
  비오는날: "☔",
  신남: "🎉",
  몽환적: "✨",
  그리움: "💭",
  여름: "🌊",
  겨울: "❄️",
  카페: "☕",
  여행: "✈️",
  로맨틱: "🌹",
  파티: "🎊",
  명상: "🧘",
  공부: "📚",
  수면: "🌙",
};

/** 필터 칩: 선택 시 테두리·배경·글자색 */
export const EMOTION_FILTER_ACTIVE: Record<string, string> = {
  전체: "border-violet-300/60 bg-violet-500/25 text-violet-100",
  새벽감성: "border-violet-400/55 bg-violet-600/25 text-violet-100",
  행복: "border-amber-300/55 bg-amber-500/25 text-amber-100",
  설렘: "border-pink-300/55 bg-pink-500/25 text-pink-100",
  힐링: "border-emerald-300/55 bg-emerald-500/25 text-emerald-100",
  집중: "border-cyan-300/55 bg-cyan-500/25 text-cyan-100",
  우울함: "border-slate-400/55 bg-slate-600/30 text-slate-200",
  운동: "border-rose-300/55 bg-rose-500/25 text-rose-100",
  드라이브: "border-sky-300/55 bg-sky-500/25 text-sky-100",
  비오는날: "border-slate-400/55 bg-slate-500/30 text-slate-200",
  신남: "border-lime-300/55 bg-lime-500/25 text-lime-100",
  몽환적: "border-purple-300/55 bg-purple-500/25 text-purple-100",
  그리움: "border-indigo-300/55 bg-indigo-500/25 text-indigo-100",
  여름: "border-orange-300/55 bg-orange-500/25 text-orange-100",
  겨울: "border-sky-200/55 bg-sky-400/20 text-sky-50",
  카페: "border-amber-800/50 bg-amber-900/35 text-amber-100",
  여행: "border-teal-300/55 bg-teal-500/25 text-teal-100",
  로맨틱: "border-fuchsia-300/55 bg-fuchsia-500/25 text-fuchsia-100",
  파티: "border-yellow-300/55 bg-yellow-500/25 text-yellow-950",
  명상: "border-violet-200/55 bg-violet-300/15 text-violet-100",
  공부: "border-blue-400/55 bg-blue-600/25 text-blue-100",
  수면: "border-indigo-950/60 bg-indigo-950/40 text-indigo-100",
};

const FILTER_IDLE = "border-white/15 bg-white/5 text-slate-300 hover:bg-white/10";

export function emotionFilterChipClass(emotion: string, selected: boolean): string {
  const base = "rounded-full border px-3 py-1 text-xs font-medium transition";
  if (!selected) return `${base} ${FILTER_IDLE}`;
  const active = EMOTION_FILTER_ACTIVE[emotion] ?? EMOTION_FILTER_ACTIVE["전체"];
  return `${base} ${active}`;
}

/** 탐색·카드 배지용 작은 점 색 (Tailwind bg-*) */
export const EMOTION_DOT_CLASS: Record<string, string> = {
  새벽감성: "bg-violet-400",
  행복: "bg-amber-400",
  설렘: "bg-pink-400",
  힐링: "bg-emerald-400",
  집중: "bg-cyan-400",
  우울함: "bg-slate-500",
  운동: "bg-rose-400",
  드라이브: "bg-sky-400",
  비오는날: "bg-slate-400",
  신남: "bg-lime-400",
  몽환적: "bg-purple-400",
  그리움: "bg-indigo-400",
  여름: "bg-orange-400",
  겨울: "bg-sky-300",
  카페: "bg-amber-800",
  여행: "bg-teal-400",
  로맨틱: "bg-fuchsia-400",
  파티: "bg-yellow-400",
  명상: "bg-violet-300",
  공부: "bg-blue-500",
  수면: "bg-indigo-950",
};

export function emotionDotClass(emotion: string): string {
  return EMOTION_DOT_CLASS[emotion] ?? "bg-violet-400";
}

/** 인트로 등 컴팩트 칩 (단일 클래스 문자열) */
export const EMOTION_INTRO_CHIP_CLASS: Record<string, string> = {
  새벽감성: "border-violet-300/50 bg-violet-500/20 text-violet-100",
  행복: "border-amber-300/50 bg-amber-500/20 text-amber-100",
  설렘: "border-pink-300/50 bg-pink-500/20 text-pink-100",
  힐링: "border-emerald-300/50 bg-emerald-500/20 text-emerald-100",
  집중: "border-cyan-300/50 bg-cyan-500/20 text-cyan-100",
  우울함: "border-slate-400/50 bg-slate-600/25 text-slate-200",
  운동: "border-rose-300/50 bg-rose-500/20 text-rose-100",
  드라이브: "border-sky-300/50 bg-sky-500/20 text-sky-100",
  비오는날: "border-slate-400/50 bg-slate-500/25 text-slate-200",
  신남: "border-lime-300/50 bg-lime-500/20 text-lime-100",
  몽환적: "border-purple-300/50 bg-purple-500/20 text-purple-100",
  그리움: "border-indigo-300/50 bg-indigo-500/20 text-indigo-100",
  여름: "border-orange-300/50 bg-orange-500/20 text-orange-100",
  겨울: "border-sky-200/50 bg-sky-400/15 text-sky-50",
  카페: "border-amber-800/50 bg-amber-950/35 text-amber-100",
  여행: "border-teal-300/50 bg-teal-500/20 text-teal-100",
  로맨틱: "border-fuchsia-300/50 bg-fuchsia-500/20 text-fuchsia-100",
  파티: "border-yellow-300/50 bg-yellow-400/25 text-yellow-950",
  명상: "border-violet-200/50 bg-violet-400/15 text-violet-50",
  공부: "border-blue-400/50 bg-blue-600/25 text-blue-100",
  수면: "border-indigo-900/50 bg-indigo-950/40 text-indigo-100",
};

export function isKnownEmotion(value: string): value is EmotionOnly {
  return (EMOTION_ONLY as readonly string[]).includes(value);
}
