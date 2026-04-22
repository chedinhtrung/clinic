"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { DragEvent, KeyboardEvent } from "react";
import type { BlogContentBlock } from "../types";
import Block from "./Block";
import TrailingWriteArea from "./TrailingWriteArea";
import { createEmptyBlock, createReplacementBlock, isTextBlock } from "./blockFactories";
import type { TextBlock } from "./blockFactories";
import { useBlockDrag } from "./useBlockDrag";

type BlogContentRendererProps = {
  blocks: BlogContentBlock[];
  editable?: boolean;
  onChange?: (blocks: BlogContentBlock[]) => void;
};

export default function BlogContentRenderer({ blocks, editable = false, onChange }: BlogContentRendererProps) {
  // Slash/menu state controls transient editor chrome; the saved post content remains only in blocks.
  const [activeSlashBlockId, setActiveSlashBlockId] = useState<string | null>(null);
  const [activeMenuBlockId, setActiveMenuBlockId] = useState<string | null>(null);

  // Refs let the editor focus newly-created blocks and measure textareas without storing DOM details in post data.
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

  const {
    draggedBlockId,
    dropTarget,
    setDraggedBlockId,
    setDropTarget,
    moveBlockToEnd,
    scrollEditorWhileDragging,
    getBlockDropHandlers,
    clearDragState,
  } = useBlockDrag({ blocks: normalizedBlocks, editorRef, setBlocks });

  // Focusing on the next animation frame waits for React to render inserted or converted blocks.
  function focusBlock(blockId: string) {
    window.requestAnimationFrame(() => blockRefs.current[blockId]?.focus());
  }

  // Replace one block in-place while preserving the surrounding document order.
  function updateBlock(updatedBlock: BlogContentBlock) {
    setBlocks(normalizedBlocks.map((block) => (block.id === updatedBlock.id ? updatedBlock : block)));
  }

  // Convert the current block after a slash command or handle menu choice.
  function replaceBlock(blockId: string, type: BlogContentBlock["type"]) {
    const nextBlock = createReplacementBlock(type, blockId);
    setActiveSlashBlockId(null);
    setActiveMenuBlockId(null);
    updateBlock(nextBlock);
    focusBlock(blockId);
  }

  // Enter inserts a fresh paragraph after the current block; explicit type supports future command reuse.
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

  // Empty Backspace/Delete and menu Delete both route here so focus recovery is consistent.
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

  // Update text content, resize paragraph textareas, and open/close the slash menu based on the leading slash.
  function handleTextChange(block: TextBlock, value: string) {
    const textarea = blockRefs.current[block.id];
    if (textarea instanceof HTMLTextAreaElement) {
      textarea.style.height = "0px";
      textarea.style.height = `${textarea.scrollHeight}px`;
    }

    updateBlock({ ...block, text: value });
    setActiveSlashBlockId(value.startsWith("/") ? block.id : null);
  }

  // Keyboard handling keeps block creation and empty-block deletion close to the text controls.
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

  function handleDragStart(event: DragEvent<HTMLButtonElement>, blockId: string) {
    setDraggedBlockId(blockId);
    setActiveMenuBlockId(null);
    event.dataTransfer.effectAllowed = "move";

    const blockElement = event.currentTarget.closest("[data-blog-block]");
    if (blockElement instanceof HTMLElement) {
      // Native drag previews are browser-managed, so clone the block to approximate Notion's floating preview.
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
  }

  if (!editable && normalizedBlocks.length === 0) {
    return <div className="rounded-md bg-[#f7f6f3] px-3 py-6 text-center text-sm text-[#787774]">No content blocks yet.</div>;
  }

  return (
    <div ref={editorRef} className={editable ? "space-y-1 pl-10" : "space-y-5"}>
      {normalizedBlocks.map((block, blockIndex) => (
        <Block
          key={block.id}
          block={block}
          blockIndex={blockIndex}
          editable={editable}
          isSlashOpen={activeSlashBlockId === block.id}
          isHandleOpen={activeMenuBlockId === block.id}
          isDragged={draggedBlockId === block.id}
          showDropBefore={dropTarget?.blockId === block.id && dropTarget.edge === "before"}
          showDropAfter={dropTarget?.blockId === block.id && dropTarget.edge === "after"}
          canDelete={normalizedBlocks.length > 1 || !isTextBlock(block) || block.text.length > 0}
          blockRefs={blockRefs}
          dropHandlers={getBlockDropHandlers(block)}
          onUpdate={updateBlock}
          onReplace={replaceBlock}
          onRemove={removeBlock}
          onSlashOpenChange={setActiveSlashBlockId}
          onHandleOpenChange={setActiveMenuBlockId}
          onTextChange={handleTextChange}
          onTextKeyDown={handleTextKeyDown}
          onDragStart={handleDragStart}
          onDragEnd={clearDragState}
        />
      ))}
      {editable && (
        <TrailingWriteArea
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
            clearDragState();
          }}
        />
      )}
    </div>
  );
}
