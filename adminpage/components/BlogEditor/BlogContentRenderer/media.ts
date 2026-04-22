// Accept common YouTube URL shapes and normalize them into the iframe embed form used by previews.
export function getYoutubeEmbedUrl(url: string) {
  const videoId =
    url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([A-Za-z0-9_-]{6,})/)?.[1] ?? "";
  return videoId ? `https://www.youtube.com/embed/${videoId}` : "";
}
