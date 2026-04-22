import type { DragEvent, KeyboardEvent } from "react";
import type { BlogContentBlock } from "../types";
import type { TextBlock } from "./blockFactories";

export type DropTarget = {
  blockId: string;
  edge: "before" | "after";
};

export type BlockRefs = React.MutableRefObject<Record<string, HTMLElement | null>>;

export type BlockDropHandlers = {
  onDragOver: (event: DragEvent<HTMLDivElement>) => void;
  onDragLeave: (event: DragEvent<HTMLDivElement>) => void;
  onDrop: (event: DragEvent<HTMLDivElement>) => void;
};

export type BlockProps = {
  block: BlogContentBlock;
  blockIndex: number;
  editable: boolean;
  isSlashOpen: boolean;
  isHandleOpen: boolean;
  isDragged: boolean;
  showDropBefore: boolean;
  showDropAfter: boolean;
  canDelete: boolean;
  blockRefs: BlockRefs;
  dropHandlers: BlockDropHandlers;
  onUpdate: (block: BlogContentBlock) => void;
  onReplace: (blockId: string, type: BlogContentBlock["type"]) => void;
  onRemove: (blockId: string) => void;
  onSlashOpenChange: (blockId: string | null) => void;
  onHandleOpenChange: (blockId: string | null) => void;
  onTextChange: (block: TextBlock, value: string) => void;
  onTextKeyDown: (event: KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>, block: TextBlock) => void;
  onDragStart: (event: DragEvent<HTMLButtonElement>, blockId: string) => void;
  onDragEnd: () => void;
};
