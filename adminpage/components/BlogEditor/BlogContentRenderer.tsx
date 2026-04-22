"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { GripVertical, Heading1, ImageIcon, LinkIcon, Pilcrow, Trash2, Video } from "lucide-react";
import type { DragEvent, KeyboardEvent } from "react";
import type { BlogContentBlock } from "./types";

type TextBlock = Extract<BlogContentBlock, { type: "heading" | "paragraph" }>;
type SlashCommand = {
  type: BlogContentBlock["type"];
  label: string;
  hint: string;
  keywords: string[];
  icon: typeof Pilcrow;
};

const slashCommands: SlashCommand[] = [
  { type: "paragraph", label: "Text", hint: "Plain paragraph", keywords: ["p", "text", "paragraph"], icon: Pilcrow },
  { type: "heading", label: "Heading", hint: "Section title", keywords: ["h", "heading", "title"], icon: Heading1 },
  { type: "image", label: "Image", hint: "Add image URL", keywords: ["image", "img", "photo"], icon: ImageIcon },
  { type: "youtube", label: "YouTube", hint: "Embed a video", keywords: ["youtube", "video", "yt"], icon: Video },
  { type: "link", label: "Link", hint: "Callout link", keywords: ["link", "url"], icon: LinkIcon },
];

function makeBlockId(type: BlogContentBlock["type"]) {
  return `${type}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function getYoutubeEmbedUrl(url: string) {
  const videoId =
    url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([A-Za-z0-9_-]{6,})/)?.[1] ?? "";
  return videoId ? `https://www.youtube.com/embed/${videoId}` : "";
}

function createEmptyBlock(type: BlogContentBlock["type"]): BlogContentBlock {
  if (type === "heading" || type === "paragraph") {
    return { id: makeBlockId(type), type, text: "" };
  }

  if (type === "image") {
    return { id: makeBlockId(type), type, src: "", alt: "", caption: "" };
  }

  if (type === "youtube") {
    return { id: makeBlockId(type), type, url: "", caption: "" };
  }

  return { id: makeBlockId(type), type, url: "", text: "" };
}

function createReplacementBlock(type: BlogContentBlock["type"], id: string): BlogContentBlock {
  return { ...createEmptyBlock(type), id } as BlogContentBlock;
}

function isTextBlock(block: BlogContentBlock): block is TextBlock {
  return block.type === "heading" || block.type === "paragraph";
}

function getTextValue(block: BlogContentBlock) {
  return isTextBlock(block) ? block.text : "";
}

type BlogContentRendererProps = {
  blocks: BlogContentBlock[];
  editable?: boolean;
  onChange?: (blocks: BlogContentBlock[]) => void;
};

type DropTarget = {
  blockId: string;
  edge: "before" | "after";
};

export default function BlogContentRenderer({ blocks, editable = false, onChange }: BlogContentRendererProps) {
  const [activeSlashBlockId, setActiveSlashBlockId] = useState<string | null>(null);
  const [activeMenuBlockId, setActiveMenuBlockId] = useState<string | null>(null);
  const [draggedBlockId, setDraggedBlockId] = useState<string | null>(null);
  const [dropTarget, setDropTarget] = useState<DropTarget | null>(null);
  const blockRefs = useRef<Record<string, HTMLElement | null>>({});
  const editorRef = useRef<HTMLDivElement | null>(null);

  // Editable posts always keep one writable block, so the surface feels like a document instead of an empty form.
  const normalizedBlocks = useMemo(() => {
    if (!editable || blocks.length > 0) {
      return blocks;
    }

    return [createEmptyBlock("paragraph")];
  }, [blocks, editable]);

  useEffect(() => {
    if (editable && blocks.length === 0) {
      onChange?.([createEmptyBlock("paragraph")]);
    }
  }, [blocks.length, editable, onChange]);

  useEffect(() => {
    normalizedBlocks.forEach((block) => {
      if (block.type !== "paragraph") {
        return;
      }

      const textarea = blockRefs.current[block.id];
      if (textarea instanceof HTMLTextAreaElement) {
        textarea.style.height = "0px";
        textarea.style.height = `${textarea.scrollHeight}px`;
      }
    });
  }, [normalizedBlocks]);

  function setBlocks(nextBlocks: BlogContentBlock[]) {
    onChange?.(nextBlocks.length > 0 ? nextBlocks : [createEmptyBlock("paragraph")]);
  }

  function focusBlock(blockId: string) {
    window.requestAnimationFrame(() => blockRefs.current[blockId]?.focus());
  }

  function updateBlock(updatedBlock: BlogContentBlock) {
    setBlocks(normalizedBlocks.map((block) => (block.id === updatedBlock.id ? updatedBlock : block)));
  }

  function replaceBlock(blockId: string, type: BlogContentBlock["type"]) {
    const nextBlock = createReplacementBlock(type, blockId);
    setActiveSlashBlockId(null);
    updateBlock(nextBlock);
    focusBlock(blockId);
  }

  function insertBlockAfter(blockId: string, type: BlogContentBlock["type"] = "paragraph") {
    const blockIndex = normalizedBlocks.findIndex((block) => block.id === blockId);
    const nextBlock = createEmptyBlock(type);

    if (blockIndex === -1) {
      setBlocks([...normalizedBlocks, nextBlock]);
    } else {
      setBlocks([...normalizedBlocks.slice(0, blockIndex + 1), nextBlock, ...normalizedBlocks.slice(blockIndex + 1)]);
    }

    setActiveSlashBlockId(null);
    focusBlock(nextBlock.id);
  }

  function appendTrailingBlock() {
    const lastBlock = normalizedBlocks.at(-1);
    const nextBlock = createEmptyBlock("paragraph");

    if (lastBlock && isTextBlock(lastBlock) && lastBlock.text.length === 0) {
      focusBlock(lastBlock.id);
      return;
    }

    setBlocks([...normalizedBlocks, nextBlock]);
    focusBlock(nextBlock.id);
  }

  function moveBlockToEnd(blockId: string) {
    const draggedBlock = normalizedBlocks.find((block) => block.id === blockId);
    if (!draggedBlock) {
      return;
    }

    setBlocks([...normalizedBlocks.filter((block) => block.id !== blockId), draggedBlock]);
  }

  function removeBlock(blockId: string) {
    const blockIndex = normalizedBlocks.findIndex((block) => block.id === blockId);
    const nextBlocks = normalizedBlocks.filter((block) => block.id !== blockId);
    const nextFocusBlock = nextBlocks[Math.max(0, blockIndex - 1)] ?? nextBlocks[0];
    setActiveMenuBlockId(null);
    setBlocks(nextBlocks);

    if (nextFocusBlock) {
      focusBlock(nextFocusBlock.id);
    }
  }

  function moveBlockTo(blockId: string, target: DropTarget) {
    if (blockId === target.blockId) {
      return;
    }

    const draggedBlock = normalizedBlocks.find((block) => block.id === blockId);
    if (!draggedBlock) {
      return;
    }

    const nextBlocks = normalizedBlocks.filter((block) => block.id !== blockId);
    const targetIndex = nextBlocks.findIndex((block) => block.id === target.blockId);
    const insertIndex = target.edge === "after" ? targetIndex + 1 : targetIndex;
    nextBlocks.splice(insertIndex, 0, draggedBlock);
    setBlocks(nextBlocks);
  }

  function getDropTarget(event: DragEvent<HTMLDivElement>, blockId: string): DropTarget {
    const blockBounds = event.currentTarget.getBoundingClientRect();
    const edge = event.clientY > blockBounds.top + blockBounds.height / 2 ? "after" : "before";
    return { blockId, edge };
  }

  function scrollEditorWhileDragging(event: DragEvent) {
    const scrollContainer = editorRef.current?.closest(".overflow-y-auto");
    if (!(scrollContainer instanceof HTMLElement)) {
      return;
    }

    const bounds = scrollContainer.getBoundingClientRect();
    const edgeSize = 96;
    const maxStep = 18;

    // When the cursor moves near the editor viewport edges, scroll the editor so long posts remain draggable.
    if (event.clientY < bounds.top + edgeSize) {
      scrollContainer.scrollTop -= Math.ceil(((bounds.top + edgeSize - event.clientY) / edgeSize) * maxStep);
    } else if (event.clientY > bounds.bottom - edgeSize) {
      scrollContainer.scrollTop += Math.ceil(((event.clientY - (bounds.bottom - edgeSize)) / edgeSize) * maxStep);
    }
  }

  function handleTextChange(block: TextBlock, value: string) {
    // Textareas are measured after every keystroke, which prevents long wrapped text from becoming internally scrollable.
    const textarea = blockRefs.current[block.id];
    if (textarea instanceof HTMLTextAreaElement) {
      textarea.style.height = "0px";
      textarea.style.height = `${textarea.scrollHeight}px`;
    }

    updateBlock({ ...block, text: value });
    setActiveSlashBlockId(value.startsWith("/") ? block.id : null);
  }

  function handleTextKeyDown(event: KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>, block: TextBlock) {
    if (!editable) {
      return;
    }

    if (event.key === "Enter" && (block.type === "heading" || !event.shiftKey)) {
      event.preventDefault();
      insertBlockAfter(block.id);
      return;
    }

    if ((event.key === "Backspace" || event.key === "Delete") && block.text.length === 0 && normalizedBlocks.length > 1) {
      event.preventDefault();
      removeBlock(block.id);
    }
  }

  function getSlashMatches(block: TextBlock) {
    const query = block.text.replace(/^\//, "").trim().toLowerCase();
    return slashCommands.filter((command) => {
      if (!query) {
        return true;
      }

      return command.keywords.some((keyword) => keyword.includes(query)) || command.label.toLowerCase().includes(query);
    });
  }

  function renderSlashMenu(block: TextBlock) {
    if (!editable || activeSlashBlockId !== block.id || !block.text.startsWith("/")) {
      return null;
    }

    // The slash menu filters as the user types, then replaces the current text block with the chosen block type.
    const matches = getSlashMatches(block);

    return (
      <div className="absolute left-10 top-full z-20 mt-1 w-64 rounded-md border border-[#e3e2df] bg-white p-1 shadow-[0_10px_30px_rgba(55,53,47,0.14)]">
        <div className="px-2 py-1.5 text-xs font-medium text-[#787774]">Blocks</div>
        {matches.length === 0 ? (
          <p className="px-2 py-2 text-sm text-[#9b9a97]">No matching block</p>
        ) : (
          matches.map((command) => {
            const Icon = command.icon;

            return (
              <button
                key={command.type}
                type="button"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => replaceBlock(block.id, command.type)}
                className="flex w-full items-center gap-3 rounded px-2 py-2 text-left transition hover:bg-[#f1f1ef]"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded border border-[#e3e2df] text-[#5f5e5b]">
                  <Icon size={16} />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-medium text-[#37352f]">{command.label}</span>
                  <span className="block truncate text-xs text-[#787774]">{command.hint}</span>
                </span>
              </button>
            );
          })
        )}
      </div>
    );
  }

  function renderHandle(block: BlogContentBlock, blockIndex: number) {
    if (!editable) {
      return null;
    }

    // The handle is intentionally the only per-block chrome: click for options, drag for reordering.
    const menuOpen = activeMenuBlockId === block.id;

    return (
      <div className="absolute -left-8 top-1.5 flex opacity-0 transition group-hover:opacity-100 group-focus-within:opacity-100">
        <button
          type="button"
          aria-label="Block options"
          draggable
          onClick={() => setActiveMenuBlockId(menuOpen ? null : block.id)}
          onDragStart={(event) => {
            setDraggedBlockId(block.id);
            setActiveMenuBlockId(null);
            event.dataTransfer.effectAllowed = "move";

            const blockElement = event.currentTarget.closest("[data-blog-block]");
            if (blockElement instanceof HTMLElement) {
              const dragPreview = blockElement.cloneNode(true) as HTMLElement;
              dragPreview.style.position = "fixed";
              dragPreview.style.top = "-1000px";
              dragPreview.style.left = "-1000px";
              dragPreview.style.width = `${blockElement.offsetWidth}px`;
              dragPreview.style.opacity = "0.72";
              dragPreview.style.filter = "blur(1px)";
              dragPreview.style.pointerEvents = "none";
              dragPreview.style.background = "rgba(255,255,255,0.92)";
              document.body.appendChild(dragPreview);
              event.dataTransfer.setDragImage(dragPreview, 24, 18);
              window.setTimeout(() => dragPreview.remove(), 0);
            }
          }}
          onDragEnd={() => {
            setDraggedBlockId(null);
            setDropTarget(null);
          }}
          className="flex h-7 w-7 cursor-grab items-center justify-center rounded text-[#9b9a97] transition hover:bg-[#f1f1ef] hover:text-[#37352f] active:cursor-grabbing"
        >
          <GripVertical size={16} />
        </button>
        {menuOpen && (
          <div className="absolute left-8 top-0 z-30 w-48 rounded-md border border-[#e3e2df] bg-white p-1 shadow-[0_10px_30px_rgba(55,53,47,0.14)]">
            {slashCommands.map((command) => {
              const Icon = command.icon;
              return (
                <button
                  key={command.type}
                  type="button"
                  onClick={() => {
                    setActiveMenuBlockId(null);
                    replaceBlock(block.id, command.type);
                  }}
                  className="flex w-full items-center gap-2 rounded px-2 py-2 text-sm text-[#37352f] transition hover:bg-[#f1f1ef]"
                >
                  <Icon size={15} /> Turn into {command.label}
                </button>
              );
            })}
            <button
              type="button"
              onClick={() => removeBlock(block.id)}
              disabled={normalizedBlocks.length === 1 && getTextValue(block).length === 0}
              className="flex w-full items-center gap-2 rounded px-2 py-2 text-sm text-[#9b5a51] transition hover:bg-[#fff1ef] disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Trash2 size={15} /> Delete
            </button>
            {blockIndex === 0 && <div className="mt-1 border-t border-[#f1f1ef] px-2 py-1 text-xs text-[#9b9a97]">Drag handle to reorder</div>}
          </div>
        )}
      </div>
    );
  }

  function blockDropHandlers(block: BlogContentBlock) {
    // The cursor midpoint decides whether the insertion line appears before or after a block.
    return {
      onDragOver: (event: DragEvent<HTMLDivElement>) => {
        if (draggedBlockId) {
          event.preventDefault();
          scrollEditorWhileDragging(event);
          setDropTarget(getDropTarget(event, block.id));
          event.dataTransfer.dropEffect = "move";
        }
      },
      onDragLeave: (event: DragEvent<HTMLDivElement>) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
          setDropTarget(null);
        }
      },
      onDrop: (event: DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        const target = dropTarget ?? getDropTarget(event, block.id);
        if (draggedBlockId) {
          moveBlockTo(draggedBlockId, target);
        }
        setDraggedBlockId(null);
        setDropTarget(null);
      },
    };
  }

  if (!editable && normalizedBlocks.length === 0) {
    return <div className="rounded-md bg-[#f7f6f3] px-3 py-6 text-center text-sm text-[#787774]">No content blocks yet.</div>;
  }

  return (
    <div ref={editorRef} className={editable ? "space-y-1 pl-10" : "space-y-5"}>
      {normalizedBlocks.map((block, blockIndex) => {
        const embedUrl = block.type === "youtube" ? getYoutubeEmbedUrl(block.url) : "";
        const isDraggedBlock = draggedBlockId === block.id;
        const showDropBefore = dropTarget?.blockId === block.id && dropTarget.edge === "before";
        const showDropAfter = dropTarget?.blockId === block.id && dropTarget.edge === "after";

        return (
          <div
            key={block.id}
            data-blog-block
            className={`group relative rounded px-1 py-1 transition ${
              draggedBlockId && draggedBlockId !== block.id ? "hover:bg-[#edf3fa]" : ""
            } ${isDraggedBlock ? "scale-[0.995] opacity-45 blur-[1px]" : ""}`}
            {...blockDropHandlers(block)}
          >
            {showDropBefore && <div className="absolute -top-1 left-0 right-0 z-20 h-0.5 rounded-full bg-[#2f6f9f]" />}
            {renderHandle(block, blockIndex)}

            {block.type === "heading" && (
              <div className="relative">
                <input
                  ref={(node) => {
                    blockRefs.current[block.id] = node;
                  }}
                  value={block.text}
                  readOnly={!editable}
                  onFocus={() => block.text.startsWith("/") && setActiveSlashBlockId(block.id)}
                  onBlur={() => window.setTimeout(() => setActiveSlashBlockId(null), 120)}
                  onChange={(event) => handleTextChange(block, event.target.value)}
                  onKeyDown={(event) => handleTextKeyDown(event, block)}
                  placeholder="Heading"
                  className="w-full bg-transparent text-2xl font-semibold text-[#37352f] outline-none placeholder:text-[#b9b8b4]"
                />
                {renderSlashMenu(block)}
              </div>
            )}

            {block.type === "paragraph" && (
              <div className="relative">
                <textarea
                  ref={(node) => {
                    blockRefs.current[block.id] = node;
                  }}
                  value={block.text}
                  readOnly={!editable}
                  onFocus={() => block.text.startsWith("/") && setActiveSlashBlockId(block.id)}
                  onBlur={() => window.setTimeout(() => setActiveSlashBlockId(null), 120)}
                  onChange={(event) => handleTextChange(block, event.target.value)}
                  onKeyDown={(event) => handleTextKeyDown(event, block)}
                  placeholder={blockIndex === 0 ? "Write, or type / for commands" : ""}
                  rows={1}
                  className="min-h-8 w-full resize-none overflow-hidden bg-transparent text-base leading-7 text-[#37352f] outline-none placeholder:text-[#b9b8b4]"
                />
                {renderSlashMenu(block)}
              </div>
            )}

            {block.type === "image" && (
              <div className="space-y-2 py-1">
                {editable && (
                  <div className="grid gap-2 md:grid-cols-[1.4fr_1fr]">
                    <input
                      ref={(node) => {
                        blockRefs.current[block.id] = node;
                      }}
                      value={block.src}
                      onChange={(event) => updateBlock({ ...block, src: event.target.value })}
                      onKeyDown={(event) => {
                        if ((event.key === "Backspace" || event.key === "Delete") && !block.src) {
                          event.preventDefault();
                          removeBlock(block.id);
                        }
                      }}
                      placeholder="Paste image URL"
                      className="rounded border border-[#e3e2df] bg-white px-3 py-2 text-sm outline-none placeholder:text-[#b9b8b4] focus:border-[#b9b8b4]"
                    />
                    <input
                      value={block.alt}
                      onChange={(event) => updateBlock({ ...block, alt: event.target.value })}
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
                      onChange={(event) => updateBlock({ ...block, caption: event.target.value })}
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
            )}

            {block.type === "youtube" && (
              <div className="space-y-2 py-1">
                {editable && (
                  <input
                    ref={(node) => {
                      blockRefs.current[block.id] = node;
                    }}
                    value={block.url}
                    onChange={(event) => updateBlock({ ...block, url: event.target.value })}
                    onKeyDown={(event) => {
                      if ((event.key === "Backspace" || event.key === "Delete") && !block.url) {
                        event.preventDefault();
                        removeBlock(block.id);
                      }
                    }}
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
                      onChange={(event) => updateBlock({ ...block, caption: event.target.value })}
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
            )}

            {block.type === "link" && (
              <div className="rounded bg-[#f7f6f3] p-3">
                {editable && (
                  <div className="mb-2 grid gap-2 md:grid-cols-2">
                    <input
                      ref={(node) => {
                        blockRefs.current[block.id] = node;
                      }}
                      value={block.text}
                      onChange={(event) => updateBlock({ ...block, text: event.target.value })}
                      onKeyDown={(event) => {
                        if ((event.key === "Backspace" || event.key === "Delete") && !block.text && !block.url) {
                          event.preventDefault();
                          removeBlock(block.id);
                        }
                      }}
                      placeholder="Link text"
                      className="rounded border border-[#e3e2df] bg-white px-3 py-2 text-sm outline-none placeholder:text-[#b9b8b4] focus:border-[#b9b8b4]"
                    />
                    <input
                      value={block.url}
                      onChange={(event) => updateBlock({ ...block, url: event.target.value })}
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
            )}
            {showDropAfter && <div className="absolute -bottom-1 left-0 right-0 z-20 h-0.5 rounded-full bg-[#2f6f9f]" />}
          </div>
        );
      })}
      {editable && (
        <button
          type="button"
          onClick={appendTrailingBlock}
          onDragOver={(event) => {
            const lastBlock = normalizedBlocks.at(-1);
            if (!draggedBlockId || !lastBlock) {
              return;
            }

            event.preventDefault();
            scrollEditorWhileDragging(event);
            setDropTarget({ blockId: lastBlock.id, edge: "after" });
          }}
          onDrop={(event) => {
            event.preventDefault();
            if (draggedBlockId) {
              moveBlockToEnd(draggedBlockId);
            }
            setDraggedBlockId(null);
            setDropTarget(null);
          }}
          className="block min-h-24 w-full rounded px-1 text-left text-base leading-7 text-transparent outline-none transition hover:bg-[#fbfbfa] focus:bg-[#fbfbfa]"
        >
          Write, or type / for commands
        </button>
      )}
    </div>
  );
}
