"use client";
import { useRef, useState } from "react";
import { Play } from "lucide-react";

// A self-hosted MP4/WebM plays through a native <video> with a themed click-to-play
// overlay; a YouTube/Vimeo/embed URL falls back to an <iframe>. Either way it sits in
// a brand-styled 16:9 frame so it matches the rest of the home page.
function isEmbedUrl(url: string): boolean {
  return /youtube\.com|youtu\.be|vimeo\.com|\/embed\//i.test(url);
}

export function HomeVideo({ src }: { src: string; }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);

  if (!src) return null;

  const frame =
    "relative aspect-video w-full overflow-hidden rounded-2xl border border-line bg-ink shadow-lg";

  if (isEmbedUrl(src)) {
    return (
      <div className={frame}>
        <iframe className="h-full w-full" src={src} allowFullScreen loading="lazy" />
      </div>
    );
  }

  const start = () => {
    setPlaying(true);
    // Defer so the element is interactive before we ask it to play.
    requestAnimationFrame(() => videoRef.current?.play().catch(() => { }));
  };

  return (
    <div className={`group ${frame}`}>
      <video
        ref={videoRef}
        src={src}
        controls={playing}
        playsInline
        preload="metadata"
        onPlay={() => setPlaying(true)}
        onPause={() => { /* keep controls visible once started */ }}
        className="h-full w-full object-cover"
      />
      {!playing && (
        <button
          type="button"
          onClick={start}
          aria-label="Play video"
          className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-gradient-to-t from-ink/70 via-ink/20 to-ink/40 transition group-hover:from-ink/60"
        >
          <span className="grid h-16 w-16 place-items-center rounded-full bg-brand text-white shadow-lg ring-4 ring-white/20 transition group-hover:scale-110">
            <Play size={26} className="ml-0.5" fill="currentColor" />
          </span>
          <span className="rounded-full bg-white/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-white backdrop-blur">
            Watch the film
          </span>
        </button>
      )}
    </div>
  );
}
