"use client";

import type { BlogContentBlock } from "./types";

function makeBlockId(type: BlogContentBlock["type"]) {
  return `${type}-${Date.now()}`;
}

function getYoutubeEmbedUrl(url: string) {
  const videoId =
    url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([A-Za-z0-9_-]{6,})/)?.[1] ?? "";
  return videoId ? `https://www.youtube.com/embed/${videoId}` : "";
}

function createEmptyBlock(type: BlogContentBlock["type"]): BlogContentBlock {
  if (type === "heading") {
    return { id: makeBlockId(type), type, text: "" };
  }

  if (type === "paragraph") {
    return { id: makeBlockId(type), type, text: "" };
  }

  if (type === "image") {
    return { id: makeBlockId(type), type, src: "", alt: "", caption: "" };
  }

  return { id: makeBlockId(type), type, url: "", caption: "" };
}

type BlogContentRendererProps = {
  blocks: BlogContentBlock[];
  editable?: boolean;
  onChange?: (blocks: BlogContentBlock[]) => void;
};

export default function BlogContentRenderer({ blocks, editable = false, onChange }: BlogContentRendererProps) {
  function updateBlock(updatedBlock: BlogContentBlock) {
    onChange?.(blocks.map((block) => (block.id === updatedBlock.id ? updatedBlock : block)));
  }

  function addBlock(type: BlogContentBlock["type"]) {
    onChange?.([...blocks, createEmptyBlock(type)]);
  }

  function removeBlock(blockId: string) {
    onChange?.(blocks.filter((block) => block.id !== blockId));
  }

  return (
    <div className="space-y-5">
      {blocks.length === 0 && (
        <div className="rounded-md bg-[#f7f6f3] px-3 py-6 text-center text-sm text-[#787774]">
          Add a content block to start writing.
        </div>
      )}

      {blocks.map((block) => {
        const embedUrl = block.type === "youtube" ? getYoutubeEmbedUrl(block.url) : "";

        return (
          <div key={block.id} className="group space-y-2">
            {block.type === "heading" && (
              <input
                value={block.text}
                readOnly={!editable}
                onChange={(event) => updateBlock({ ...block, text: event.target.value })}
                placeholder="Heading"
                className="w-full bg-transparent text-2xl font-semibold text-[#37352f] outline-none placeholder:text-[#b9b8b4]"
              />
            )}

            {block.type === "paragraph" && (
              <textarea
                value={block.text}
                readOnly={!editable}
                onChange={(event) => updateBlock({ ...block, text: event.target.value })}
                placeholder="Write a paragraph..."
                className="min-h-28 w-full resize-none bg-transparent text-base leading-7 text-[#37352f] outline-none placeholder:text-[#b9b8b4]"
              />
            )}

            {block.type === "image" && (
              <div className="space-y-2">
                {editable && (
                  <div className="grid gap-2 md:grid-cols-2">
                    <input
                      value={block.src}
                      onChange={(event) => updateBlock({ ...block, src: event.target.value })}
                      placeholder="Image URL"
                      className="rounded-md border border-[#e3e2df] bg-white px-3 py-2 text-sm outline-none placeholder:text-[#b9b8b4] focus:border-[#b9b8b4]"
                    />
                    <input
                      value={block.alt}
                      onChange={(event) => updateBlock({ ...block, alt: event.target.value })}
                      placeholder="Alt text"
                      className="rounded-md border border-[#e3e2df] bg-white px-3 py-2 text-sm outline-none placeholder:text-[#b9b8b4] focus:border-[#b9b8b4]"
                    />
                  </div>
                )}
                {block.src ? (
                  <figure className="mx-auto max-w-2xl text-center">
                    <img src={block.src} alt={block.alt} className="mx-auto max-h-[28rem] rounded-md object-contain" />
                    <input
                      value={block.caption}
                      readOnly={!editable}
                      onChange={(event) => updateBlock({ ...block, caption: event.target.value })}
                      placeholder="Caption"
                      className="mt-2 w-full bg-transparent text-center text-sm text-[#787774] outline-none placeholder:text-[#b9b8b4]"
                    />
                  </figure>
                ) : (
                  <div className="rounded-md bg-[#f7f6f3] px-3 py-8 text-center text-sm text-[#787774]">
                    Add an image URL.
                  </div>
                )}
              </div>
            )}

            {block.type === "youtube" && (
              <div className="space-y-2">
                {editable && (
                  <input
                    value={block.url}
                    onChange={(event) => updateBlock({ ...block, url: event.target.value })}
                    placeholder="YouTube URL"
                    className="w-full rounded-md border border-[#e3e2df] bg-white px-3 py-2 text-sm outline-none placeholder:text-[#b9b8b4] focus:border-[#b9b8b4]"
                  />
                )}
                {embedUrl ? (
                  <figure className="mx-auto max-w-2xl text-center">
                    <div className="aspect-video overflow-hidden rounded-md bg-black">
                      <iframe
                        src={embedUrl}
                        title={block.caption || "YouTube video"}
                        className="h-full w-full"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    </div>
                    <input
                      value={block.caption}
                      readOnly={!editable}
                      onChange={(event) => updateBlock({ ...block, caption: event.target.value })}
                      placeholder="Caption"
                      className="mt-2 w-full bg-transparent text-center text-sm text-[#787774] outline-none placeholder:text-[#b9b8b4]"
                    />
                  </figure>
                ) : (
                  <div className="rounded-md bg-[#f7f6f3] px-3 py-8 text-center text-sm text-[#787774]">
                    Add a YouTube URL.
                  </div>
                )}
              </div>
            )}

            {editable && (
              <button
                type="button"
                onClick={() => removeBlock(block.id)}
                className="text-xs font-medium text-[#9b5a51] opacity-0 transition hover:text-[#8a2f24] group-hover:opacity-100"
              >
                Remove block
              </button>
            )}
          </div>
        );
      })}

      {editable && (
        <div className="flex flex-wrap gap-2 border-t border-[#e3e2df] pt-4">
          {(["paragraph", "heading", "image", "youtube"] as const).map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => addBlock(type)}
              className="rounded-md bg-[#f1f1ef] px-3 py-2 text-sm font-medium capitalize text-[#37352f] transition hover:bg-[#e3e2df]"
            >
              + {type}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
