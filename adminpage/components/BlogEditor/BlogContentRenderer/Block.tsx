import type { DragEvent } from "react";
import { getYoutubeEmbedUrl } from "./media";
import { isTextBlock } from "./blockFactories";
import BlockHandle from "./BlockHandle";
import SlashMenu from "./SlashMenu";
import type { BlockProps } from "./types";

// A Block owns its visible chrome and chooses its body renderer based on the block type.
export default function Block({
  block,
  blockIndex,
  editable,
  isSlashOpen,
  isHandleOpen,
  isDragged,
  showDropBefore,
  showDropAfter,
  canDelete,
  blockRefs,
  dropHandlers,
  onUpdate,
  onReplace,
  onRemove,
  onSlashOpenChange,
  onHandleOpenChange,
  onTextChange,
  onTextKeyDown,
  onDragStart,
  onDragEnd,
}: BlockProps) {
  function renderSlashMenu() {
    if (!editable || !isSlashOpen || !isTextBlock(block) || !block.text.startsWith("/")) {
      return null;
    }

    return <SlashMenu block={block} onSelect={(type) => onReplace(block.id, type)} />;
  }

  function handleEmptyAssetDelete(event: React.KeyboardEvent<HTMLInputElement>, isEmpty: boolean) {
    if ((event.key === "Backspace" || event.key === "Delete") && isEmpty) {
      event.preventDefault();
      onRemove(block.id);
    }
  }

  function renderBody() {
    if (block.type === "heading") {
      return (
        <div className="relative">
          <input
            ref={(node) => {
              blockRefs.current[block.id] = node;
            }}
            value={block.text}
            readOnly={!editable}
            onFocus={() => block.text.startsWith("/") && onSlashOpenChange(block.id)}
            onBlur={() => window.setTimeout(() => onSlashOpenChange(null), 120)}
            onChange={(event) => onTextChange(block, event.target.value)}
            onKeyDown={(event) => onTextKeyDown(event, block)}
            placeholder="Heading"
            className="w-full bg-transparent text-2xl font-semibold text-[#37352f] outline-none placeholder:text-[#b9b8b4]"
          />
          {renderSlashMenu()}
        </div>
      );
    }

    if (block.type === "paragraph") {
      return (
        <div className="relative">
          <textarea
            ref={(node) => {
              blockRefs.current[block.id] = node;
            }}
            value={block.text}
            readOnly={!editable}
            onFocus={() => block.text.startsWith("/") && onSlashOpenChange(block.id)}
            onBlur={() => window.setTimeout(() => onSlashOpenChange(null), 120)}
            onChange={(event) => onTextChange(block, event.target.value)}
            onKeyDown={(event) => onTextKeyDown(event, block)}
            placeholder={blockIndex === 0 ? "Write, or type / for commands" : ""}
            rows={1}
            className="min-h-8 w-full resize-none overflow-hidden bg-transparent text-base leading-7 text-[#37352f] outline-none placeholder:text-[#b9b8b4]"
          />
          {renderSlashMenu()}
        </div>
      );
    }

    if (block.type === "image") {
      return (
        <div className="space-y-2 py-1">
          {editable && (
            <div className="grid gap-2 md:grid-cols-[1.4fr_1fr]">
              <input
                ref={(node) => {
                  blockRefs.current[block.id] = node;
                }}
                value={block.src}
                onChange={(event) => onUpdate({ ...block, src: event.target.value })}
                onKeyDown={(event) => handleEmptyAssetDelete(event, !block.src)}
                placeholder="Paste image URL"
                className="rounded border border-[#e3e2df] bg-white px-3 py-2 text-sm outline-none placeholder:text-[#b9b8b4] focus:border-[#b9b8b4]"
              />
              <input
                value={block.alt}
                onChange={(event) => onUpdate({ ...block, alt: event.target.value })}
                placeholder="Alt text"
                className="rounded border border-[#e3e2df] bg-white px-3 py-2 text-sm outline-none placeholder:text-[#b9b8b4] focus:border-[#b9b8b4]"
              />
            </div>
          )}
          {block.src ? (
            <figure className="mx-auto max-w-2xl text-center">
              {/* Remote blog images are editor-provided URLs, so Next Image cannot know their host allowlist here. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={block.src} alt={block.alt} className="mx-auto max-h-[28rem] rounded-md object-contain" />
              <input
                value={block.caption}
                readOnly={!editable}
                onChange={(event) => onUpdate({ ...block, caption: event.target.value })}
                placeholder="Caption"
                className="mt-2 w-full bg-transparent text-center text-sm text-[#787774] outline-none placeholder:text-[#b9b8b4]"
              />
            </figure>
          ) : (
            <button
              type="button"
              onClick={() => blockRefs.current[block.id]?.focus()}
              className="w-full rounded bg-[#f7f6f3] px-3 py-8 text-center text-sm text-[#787774] transition hover:bg-[#f1f1ef]"
            >
              Add an image URL
            </button>
          )}
        </div>
      );
    }

    if (block.type === "youtube") {
      const embedUrl = getYoutubeEmbedUrl(block.url);

      return (
        <div className="space-y-2 py-1">
          {editable && (
            <input
              ref={(node) => {
                blockRefs.current[block.id] = node;
              }}
              value={block.url}
              onChange={(event) => onUpdate({ ...block, url: event.target.value })}
              onKeyDown={(event) => handleEmptyAssetDelete(event, !block.url)}
              placeholder="Paste YouTube URL"
              className="w-full rounded border border-[#e3e2df] bg-white px-3 py-2 text-sm outline-none placeholder:text-[#b9b8b4] focus:border-[#b9b8b4]"
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
                onChange={(event) => onUpdate({ ...block, caption: event.target.value })}
                placeholder="Caption"
                className="mt-2 w-full bg-transparent text-center text-sm text-[#787774] outline-none placeholder:text-[#b9b8b4]"
              />
            </figure>
          ) : (
            <button
              type="button"
              onClick={() => blockRefs.current[block.id]?.focus()}
              className="w-full rounded bg-[#f7f6f3] px-3 py-8 text-center text-sm text-[#787774] transition hover:bg-[#f1f1ef]"
            >
              Add a YouTube URL
            </button>
          )}
        </div>
      );
    }

    return (
      <div className="rounded bg-[#f7f6f3] p-3">
        {editable && (
          <div className="mb-2 grid gap-2 md:grid-cols-2">
            <input
              ref={(node) => {
                blockRefs.current[block.id] = node;
              }}
              value={block.text}
              onChange={(event) => onUpdate({ ...block, text: event.target.value })}
              onKeyDown={(event) => handleEmptyAssetDelete(event, !block.text && !block.url)}
              placeholder="Link text"
              className="rounded border border-[#e3e2df] bg-white px-3 py-2 text-sm outline-none placeholder:text-[#b9b8b4] focus:border-[#b9b8b4]"
            />
            <input
              value={block.url}
              onChange={(event) => onUpdate({ ...block, url: event.target.value })}
              placeholder="https://..."
              className="rounded border border-[#e3e2df] bg-white px-3 py-2 text-sm outline-none placeholder:text-[#b9b8b4] focus:border-[#b9b8b4]"
            />
          </div>
        )}
        {block.url ? (
          <a href={block.url} target="_blank" rel="noreferrer" className="text-sm font-medium text-[#2f6f9f]">
            {block.text || block.url}
          </a>
        ) : (
          <p className="text-sm text-[#787774]">Add a link URL</p>
        )}
      </div>
    );
  }

  return (
    <div
      data-blog-block
      className={`group relative rounded px-1 py-1 transition ${
        !isDragged ? "hover:bg-[#edf3fa]" : "scale-[0.995] opacity-45 blur-[1px]"
      }`}
      {...dropHandlers}
    >
      {showDropBefore && <div className="absolute -top-1 left-0 right-0 z-20 h-0.5 rounded-full bg-[#2f6f9f]" />}
      {editable && (
        <BlockHandle
          block={block}
          blockIndex={blockIndex}
          isOpen={isHandleOpen}
          canDelete={canDelete}
          onOpenChange={onHandleOpenChange}
          onTurnInto={(type) => onReplace(block.id, type)}
          onDelete={() => onRemove(block.id)}
          onDragStart={(event: DragEvent<HTMLButtonElement>) => onDragStart(event, block.id)}
          onDragEnd={onDragEnd}
        />
      )}
      {renderBody()}
      {showDropAfter && <div className="absolute -bottom-1 left-0 right-0 z-20 h-0.5 rounded-full bg-[#2f6f9f]" />}
    </div>
  );
}
