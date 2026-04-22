import { useState } from "react";
import type { DragEvent, RefObject } from "react";
import type { BlogContentBlock } from "../types";
import type { DropTarget } from "./types";

type UseBlockDragArgs = {
  blocks: BlogContentBlock[];
  editorRef: RefObject<HTMLDivElement | null>;
  setBlocks: (blocks: BlogContentBlock[]) => void;
};

// Drag state is document-level because only one block can be dragged, and the insertion line depends on neighboring blocks.
export function useBlockDrag({ blocks, editorRef, setBlocks }: UseBlockDragArgs) {
  const [draggedBlockId, setDraggedBlockId] = useState<string | null>(null);
  const [dropTarget, setDropTarget] = useState<DropTarget | null>(null);

  // Reorder by removing the dragged block first, then inserting it at the resolved before/after target.
  function moveBlockTo(blockId: string, target: DropTarget) {
    if (blockId === target.blockId) {
      return;
    }

    const draggedBlock = blocks.find((block) => block.id === blockId);
    if (!draggedBlock) {
      return;
    }

    const nextBlocks = blocks.filter((block) => block.id !== blockId);
    const targetIndex = nextBlocks.findIndex((block) => block.id === target.blockId);
    const insertIndex = target.edge === "after" ? targetIndex + 1 : targetIndex;
    nextBlocks.splice(insertIndex, 0, draggedBlock);
    setBlocks(nextBlocks);
  }

  // Dropping into the trailing area is a special case because there is no real block below it.
  function moveBlockToEnd(blockId: string) {
    const draggedBlock = blocks.find((block) => block.id === blockId);
    if (!draggedBlock) {
      return;
    }

    setBlocks([...blocks.filter((block) => block.id !== blockId), draggedBlock]);
  }

  // The block midpoint gives a simple, predictable before/after insertion target.
  function getDropTarget(event: DragEvent<HTMLDivElement>, blockId: string): DropTarget {
    const blockBounds = event.currentTarget.getBoundingClientRect();
    const edge = event.clientY > blockBounds.top + blockBounds.height / 2 ? "after" : "before";
    return { blockId, edge };
  }

  // Auto-scroll the aside scroll container while dragging near its top or bottom edge.
  function scrollEditorWhileDragging(event: DragEvent) {
    const scrollContainer = editorRef.current?.closest(".overflow-y-auto");
    if (!(scrollContainer instanceof HTMLElement)) {
      return;
    }

    const bounds = scrollContainer.getBoundingClientRect();
    const edgeSize = 96;
    const maxStep = 18;

    if (event.clientY < bounds.top + edgeSize) {
      scrollContainer.scrollTop -= Math.ceil(((bounds.top + edgeSize - event.clientY) / edgeSize) * maxStep);
    } else if (event.clientY > bounds.bottom - edgeSize) {
      scrollContainer.scrollTop += Math.ceil(((event.clientY - (bounds.bottom - edgeSize)) / edgeSize) * maxStep);
    }
  }

  // The cursor midpoint decides whether the insertion line appears before or after a block.
  function getBlockDropHandlers(block: BlogContentBlock) {
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

  function clearDragState() {
    setDraggedBlockId(null);
    setDropTarget(null);
  }

  return {
    draggedBlockId,
    dropTarget,
    setDraggedBlockId,
    setDropTarget,
    moveBlockToEnd,
    scrollEditorWhileDragging,
    getBlockDropHandlers,
    clearDragState,
  };
}
