import { Playlist } from "@/types/playlist";

type PlaylistCardProps = {
  playlist: Playlist;
  deleting: boolean;
  editing: boolean;
  engaging: boolean;
  selected: boolean;
  playing: boolean;
  onDelete: (id: number) => void;
  onEdit: (playlist: Playlist) => void;
  onLike: (id: number) => void;
  onSave: (id: number) => void;
  onSelect: (playlist: Playlist) => void;
  onPlay: (playlist: Playlist) => void;
};

export default function PlaylistCard({
  playlist,
  deleting,
  editing,
  engaging,
  selected,
  playing,
  onDelete,
  onEdit,
  onLike,
  onSave,
  onSelect,
  onPlay,
}: PlaylistCardProps) {
  const hasMusicUrl =
    typeof playlist.musicUrl === "string" &&
    (playlist.musicUrl.startsWith("http://") || playlist.musicUrl.startsWith("https://"));

  return (
    <article
      onClick={() => onSelect(playlist)}
      className={`animate-fade-in rounded-2xl border bg-white/10 p-5 shadow-aurora backdrop-blur-sm transition duration-300 hover:-translate-y-1 hover:scale-[1.02] hover:bg-white/15 hover:shadow-[0_18px_45px_rgba(236,72,153,0.35)] ${
        playing
          ? "border-indigo-300/80 ring-2 ring-indigo-300/50 shadow-[0_0_35px_rgba(99,102,241,0.45)]"
          : selected
            ? "border-mintnote/60 ring-1 ring-mintnote/40"
            : "border-white/15"
      }`}
    >
      <div className="mb-3 flex items-center justify-between">
        <span className="rounded-full bg-mintnote/20 px-3 py-1 text-xs font-semibold text-mintnote">
          #{playlist.id}
        </span>
        <span className="rounded-full bg-roseglow/20 px-3 py-1 text-xs font-semibold text-roseglow">
          {playlist.emotion}
        </span>
      </div>
      <h3 className="line-clamp-2 text-lg font-semibold text-white">{playlist.title}</h3>
      {playing && (
        <p className="mt-2 text-xs font-semibold text-indigo-200">지금 미니 플레이어에서 재생 중</p>
      )}
      {hasMusicUrl && (
        <button
          type="button"
          onClick={() => onPlay(playlist)}
          className="mt-3 block rounded-lg border border-indigo-300/40 bg-indigo-400/10 px-3 py-2 text-center text-sm font-medium text-indigo-100 transition duration-200 hover:scale-[1.02] hover:border-indigo-200/70 hover:bg-indigo-400/30 hover:shadow-[0_8px_25px_rgba(99,102,241,0.35)] active:scale-95"
        >
          재생
        </button>
      )}
      <div className="mt-4 grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => onLike(playlist.id)}
          disabled={engaging}
          className="rounded-lg border border-yellow-300/50 bg-yellow-300/10 px-3 py-2 text-sm font-medium text-yellow-100 transition duration-200 hover:scale-[1.02] hover:bg-yellow-300/25 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
        >
          좋아요 {playlist.likeCount ?? 0}
        </button>
        <button
          type="button"
          onClick={() => onSave(playlist.id)}
          disabled={engaging}
          className="rounded-lg border border-cyan-300/50 bg-cyan-300/10 px-3 py-2 text-sm font-medium text-cyan-100 transition duration-200 hover:scale-[1.02] hover:bg-cyan-300/25 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
        >
          저장 {playlist.savedCount ?? 0}
        </button>
      </div>
      <div className="mt-2 grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => onEdit(playlist)}
          disabled={deleting || engaging}
          className="rounded-lg border border-mintnote/50 bg-mintnote/10 px-3 py-2 text-sm font-medium text-mintnote transition duration-200 hover:scale-[1.02] hover:bg-mintnote/25 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {editing ? "수정 중" : "수정"}
        </button>
        <button
          type="button"
          onClick={() => onDelete(playlist.id)}
          disabled={deleting || engaging}
          className="rounded-lg border border-roseglow/50 bg-roseglow/10 px-3 py-2 text-sm font-medium text-rose-100 transition duration-200 hover:scale-[1.02] hover:bg-roseglow/25 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {deleting ? "삭제 중..." : "삭제"}
        </button>
      </div>
    </article>
  );
}
