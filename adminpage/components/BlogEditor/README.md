# BlogEditor

This directory contains the admin blog management UI. It is wired to the real
admin blog backend and is responsible for listing posts, editing one selected
post, autosaving changes, and managing the structured block content used by the
public SSR blog page.

## Main Files

- `index.tsx` owns table state, selected post state, lookup options, and autosave orchestration.
- `BlogPostEditorAside.tsx` renders the slide-over editor for title, metadata, tags, publishing, content, and delete actions.
- `BlogContentRenderer/` renders blog content blocks in read-only mode and provides the Notion-like block editor in editable mode.
- `BlogPostTable.tsx` renders the paginated post table and row-level title edits.
- `api.ts` contains the real admin backend calls for lookup data, paginated
  posts, autosave, creation, and deletion.
- `types.ts` defines shared blog post, block, lookup, load, and autosave types.
- `utils.ts` contains constants and helpers such as slug generation and tag extraction.

## Content Block Model

The editor stores content as an ordered `BlogContentBlock[]`. Each block has a stable `id`, a `type`, and fields specific to that type:

- `paragraph`: `text`
- `heading`: `text`
- `image`: `src`, `alt`, `caption`
- `youtube`: `url`, `caption`
- `link`: `url`, `text`

The block model is intentionally simple. The UI can feel like one continuous document, while the saved shape remains structured enough for backend storage and public rendering.

## Notion-Like Editing

`BlogContentRenderer/index.tsx` is responsible for document-level editing behavior: normalizing empty content, adding/removing/replacing blocks, forwarding updates, coordinating one open slash menu or handle menu, and wiring drag/drop state.

Inside that folder:

- `Block.tsx` is the editing unit. It owns the block wrapper, block body switch, handle placement, slash menu placement, and drop indicator placement.
- `BlockHandle.tsx` owns the draggable handle and the handle dropdown.
- `SlashMenu.tsx` owns the command picker UI.
- `TrailingWriteArea.tsx` owns the empty click/drop zone at the bottom of the editor.
- `blockFactories.ts` owns block creation, replacement, and type guards.
- `blockCommands.ts` owns slash command definitions and matching.
- `useBlockDrag.ts` owns document-level drag state, insertion targets, end drops, and auto-scroll.
- `media.ts` owns small media helpers such as YouTube URL normalization.
- `types.ts` owns local editor-only prop and drag types.

Editable mode normalizes an empty post into one empty paragraph block, so users can immediately type instead of clicking an "add block" button. Paragraph blocks use auto-height textareas, which prevents long wrapped content from scrolling inside the block.

Typing `/` at the start of a text block opens the slash command menu. The menu filters by label and keyword, so commands such as `/image`, `/img`, `/heading`, `/h`, `/youtube`, `/video`, and `/link` work. Choosing a command replaces the current block while preserving its id, which helps focus and diff behavior stay stable.

Pressing `Enter` in a heading or paragraph inserts a new paragraph below the current block. Pressing `Backspace` or `Delete` on an empty block removes it and moves focus to a nearby block.

The bottom of the editor includes an invisible trailing writing area. Clicking there creates or focuses a paragraph block, which is especially useful after image and video blocks.

## Block Handles And Reordering

Each editable block has one quiet handle on the left. The handle has two jobs:

- Click it to open block options.
- Drag it to reorder the block.

The options menu can turn the block into another block type or delete it. The old separate plus button was removed so the surface stays less cluttered; users add normal text flow with `Enter` or by clicking the trailing area.

Drag reordering uses these behaviors:

- The dragged source block becomes slightly faded and blurred.
- A cloned, softened drag preview follows the cursor using the browser drag image API.
- A blue insertion line appears before or after the target block based on the cursor midpoint.
- Dragging into the trailing area places the block at the end.
- Dragging near the top or bottom of the editor scroll container auto-scrolls the editor, so long posts remain reorderable.

## Autosave

Autosave is orchestrated in `index.tsx` because that file owns the selected post and all post mutations.

The flow is:

1. A user edits the selected post.
2. `updatePost` applies the local change, marks the post dirty, and shows `Saving...`.
3. A debounced effect waits 900 ms after the latest selected post change.
4. The effect calls `autosaveBlogPost(selectedPost)` from `api.ts`.
5. The admin backend persists the canonical post document and returns the saved post plus a `savedAt` timestamp.
6. The UI merges the returned post back into local state and shows `Saved HH:MM` when the latest save succeeds.

Autosave uses sequence numbers so stale save responses cannot overwrite newer
save state. It also tracks loaded and dirty post ids so selecting/opening a
post does not immediately trigger a save.

The current backend already returns
`autosaveBlogPost(post): Promise<{ savedAt: string; post: BlogPost }>` and the
editor merges the canonical saved post back into local state after each
successful autosave.

## Save Status UI

`BlogPostEditorAside` receives `autosaveStatus` and `autosavedAt` from `index.tsx`. It renders a compact status under "Last edited":

- `Not saved yet`
- `Saving...`
- `Saved HH:MM`
- `Save failed`

This keeps autosave visible without adding controls to the content editing surface.

## Current Verification Notes

The editor now persists real blog content into Postgres through the admin API.
For broader system context, see
[docs/blog-architecture.md](/home/steve/Desktop/clinic/docs/blog-architecture.md).
