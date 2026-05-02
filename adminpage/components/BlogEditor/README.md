# BlogEditor

This directory contains the admin blog management UI. It is wired to the real
admin blog backend and is responsible for listing posts, editing one selected
post, and autosaving changes.

## Main Files

- `index.tsx` owns table state, selected post state, lookup options, and autosave orchestration.
- `BlogPostEditorAside.tsx` renders the slide-over editor for title, metadata, tags, publishing, markdown content, and delete actions.
- `MDEditor/` provides the markdown editing surface.
- `BlogPostTable.tsx` renders the paginated post table and row-level title edits.
- `api.ts` contains the real admin backend calls for lookup data, paginated posts, autosave, creation, and deletion.
- `types.ts` defines shared blog post, lookup, load, and autosave types.
- `utils.ts` contains constants and helpers such as slug generation and tag extraction.

## Markdown Content Model

The editor stores the post body as one markdown string in `contentMarkdown`.

This keeps content storage simple and portable while still supporting rich
formatting through markdown syntax.

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

## Save Status UI

`BlogPostEditorAside` receives `autosaveStatus` and `autosavedAt` from `index.tsx`. It renders a compact status under "Last edited":

- `Not saved yet`
- `Saving...`
- `Saved HH:MM`
- `Save failed`

This keeps autosave visible without adding controls to the content editing surface.
