import type { BlogContentBlock } from "../types";

export type TextBlock = Extract<BlogContentBlock, { type: "heading" | "paragraph" }>;

// Block ids are client-side only in the mock editor, so a timestamp plus random suffix avoids collisions while drafting.
function makeBlockId(type: BlogContentBlock["type"]) {
  return `${type}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

// Central factory keeps every block type initialized with the fields expected by the shared BlogContentBlock union.
export function createEmptyBlock(type: BlogContentBlock["type"]): BlogContentBlock {
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

// Slash commands preserve the existing id so React focus and autosave diffs stay stable during type conversion.
export function createReplacementBlock(type: BlogContentBlock["type"], id: string): BlogContentBlock {
  return { ...createEmptyBlock(type), id } as BlogContentBlock;
}

// Narrowing helper for places where only heading and paragraph blocks expose editable text.
export function isTextBlock(block: BlogContentBlock): block is TextBlock {
  return block.type === "heading" || block.type === "paragraph";
}

// Menu delete state needs a safe way to ask whether a block is empty without inspecting every block variant inline.
export function getTextValue(block: BlogContentBlock) {
  return isTextBlock(block) ? block.text : "";
}
