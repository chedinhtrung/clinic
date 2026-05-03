"use client";

import { useMemo, useState } from "react";

type ShareButtonsProps = {
  slug: string;
  title: string;
};

export default function ShareButtons({ slug, title }: ShareButtonsProps) {
  const [copied, setCopied] = useState(false);

  const postUrl = useMemo(() => {
    if (typeof window === "undefined") {
      return `https://chedinhnghia.com/blog/${encodeURIComponent(slug)}`;
    }

    return window.location.href;
  }, [slug]);

  const openShareWindow = (url: string) => {
    window.open(url, "_blank", "noopener,noreferrer,width=640,height=640");
  };

  const handleFacebookShare = () => {
    const shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(postUrl)}`;
    openShareWindow(shareUrl);
  };

  const handleXShare = () => {
    const shareUrl = `https://x.com/intent/tweet?url=${encodeURIComponent(postUrl)}&text=${encodeURIComponent(title)}`;
    openShareWindow(shareUrl);
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(postUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="flex items-center gap-2" aria-label="Chia sẻ bài viết">
      <button
        type="button"
        onClick={handleFacebookShare}
        aria-label="Chia sẻ Facebook"
        className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/25 bg-white/10 text-white transition hover:-translate-y-0.5 hover:bg-white/20"
      >
        <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4 fill-current">
          <path d="M14 8.5V6.75c0-.58.39-.75.67-.75H16V3.8c-.23-.03-1.02-.1-1.94-.1-1.92 0-3.23 1.17-3.23 3.32V8.5H8.75V11h2.08v7.2H13.4V11h2.13l.34-2.5H14Z" />
        </svg>
      </button>

      <button
        type="button"
        onClick={handleXShare}
        aria-label="Chia sẻ X"
        className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/25 bg-white/10 text-white transition hover:-translate-y-0.5 hover:bg-white/20"
      >
        <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4 fill-current">
          <path d="M18.2 3H21l-6.12 6.99L22 21h-5.53l-4.33-5.64L7.2 21H4.4l6.55-7.49L2 3h5.67l3.91 5.1L18.2 3Zm-.97 16h1.54L6.84 4.89H5.2L17.23 19Z" />
        </svg>
      </button>

      <button
        type="button"
        onClick={handleCopyLink}
        aria-label="Sao chép liên kết"
        className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/25 bg-white/10 text-white transition hover:-translate-y-0.5 hover:bg-white/20"
      >
        <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4 fill-current">
          <path d="M9.5 5.75A3.75 3.75 0 0 1 13.25 2h3a3.75 3.75 0 0 1 0 7.5h-2v-1.5h2a2.25 2.25 0 0 0 0-4.5h-3a2.25 2.25 0 0 0-2.25 2.25v2h-1.5v-2ZM7.75 6.5h2v1.5h-2a2.25 2.25 0 0 0-2.25 2.25v3a2.25 2.25 0 0 0 4.5 0v-2h1.5v2a3.75 3.75 0 1 1-7.5 0v-3A3.75 3.75 0 0 1 7.75 6.5Zm1.25 4.75h6v1.5H9v-1.5Z" />
        </svg>
      </button>

      <span className="text-xs text-white/75" aria-live="polite">
        {copied ? "Đã sao chép" : ""}
      </span>
    </div>
  );
}
