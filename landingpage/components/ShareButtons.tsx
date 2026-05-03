"use client";

import { useMemo, useState } from "react";

type ShareButtonsProps = {
  slug: string;
  title: string;
  variant?: "light" | "dark";
};

export default function ShareButtons({ slug, title, variant = "light" }: ShareButtonsProps) {
  const [copied, setCopied] = useState(false);
  const isDarkVariant = variant === "dark";
  const buttonClassName = isDarkVariant
    ? "inline-flex h-9 w-9 items-center justify-center rounded-full border border-[#cfd9ea] bg-[#f5f8fd] text-navy transition hover:-translate-y-0.5 hover:border-[#b4c4de] hover:bg-[#eaf0fa]"
    : "inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/25 bg-white/10 text-white transition hover:-translate-y-0.5 hover:bg-white/20";
  const feedbackClassName = isDarkVariant ? "text-xs text-gray-500" : "text-xs text-white/75";

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
        className={buttonClassName}
      >
        <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4 fill-current">
          <path d="M14 8.5V6.75c0-.58.39-.75.67-.75H16V3.8c-.23-.03-1.02-.1-1.94-.1-1.92 0-3.23 1.17-3.23 3.32V8.5H8.75V11h2.08v7.2H13.4V11h2.13l.34-2.5H14Z" />
        </svg>
      </button>

      <button
        type="button"
        onClick={handleXShare}
        aria-label="Chia sẻ X"
        className={buttonClassName}
      >
        <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4 fill-current">
          <path d="M18.2 3H21l-6.12 6.99L22 21h-5.53l-4.33-5.64L7.2 21H4.4l6.55-7.49L2 3h5.67l3.91 5.1L18.2 3Zm-.97 16h1.54L6.84 4.89H5.2L17.23 19Z" />
        </svg>
      </button>

      <button
        type="button"
        onClick={handleCopyLink}
        aria-label="Sao chép liên kết"
        className={buttonClassName}
      >
        <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"  className="h-4 w-4">
          <path d="M13.5442 10.4558C11.8385 8.75022 9.07316 8.75022 7.36753 10.4558L4.27922 13.5442C2.57359 15.2498 2.57359 18.0152 4.27922 19.7208C5.98485 21.4264 8.75021 21.4264 10.4558 19.7208L12 18.1766" stroke="#ffffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
          <path d="M10.4558 13.5442C12.1614 15.2498 14.9268 15.2498 16.6324 13.5442L19.7207 10.4558C21.4264 8.75021 21.4264 5.98485 19.7207 4.27922C18.0151 2.57359 15.2497 2.57359 13.5441 4.27922L12 5.82338" stroke="#faf9f9ff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
      </button>

      <span className={feedbackClassName} aria-live="polite">
        {copied ? "Đã sao chép" : ""}
      </span>
    </div>
  );
}
