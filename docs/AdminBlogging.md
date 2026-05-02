# Admin Blogging

This document describes the current admin-side blogging implementation: which
backend endpoints exist, how the React admin page uses them, and how post saves
flow into the database.

## Scope

This document covers the admin editing flow only.

- It does cover post lookup, draft creation, editing, autosave, and deletion.
- It does not cover the public blog rendering pipeline in detail.

## Main Files

- `backend/admin/app.py`
  Defines the Flask admin blog routes.
- `backend/admin/_blog.py`
  Implements the database reads and writes for admin blog editing.
- `backend/admin/config.py`
  Creates the shared booking DB pool and the blog DB pool.
- `adminpage/components/BlogEditor/index.tsx`
  Owns admin blog page state and autosave orchestration.
- `adminpage/components/BlogEditor/BlogPostEditorAside.tsx`
  Renders post metadata controls and markdown content editing.
- `adminpage/components/BlogEditor/MDEditor/index.tsx`
  Provides the markdown editor surface.
- `adminpage/components/BlogEditor/api.ts`
  Calls the admin blog HTTP API from the frontend.

## Admin API Endpoints

The admin backend currently exposes these blog routes:

- `GET /api/blog/lookup`
  Returns categories, subcategories, and tags for the editor controls.
- `GET /api/blog/posts?page=&pageSize=&searchText=&filterText=`
  Returns one paginated admin page of editable posts.
- `POST /api/blog/posts`
  Creates a blank draft post and returns it.
- `GET /api/blog/posts/<post_id>`
  Returns one full post in the editor shape.
- `PATCH /api/blog/posts/<post_id>`
  Saves the canonical editor document for a post.
- `DELETE /api/blog/posts/<post_id>`
  Permanently deletes a post.

## Frontend Flow

The admin UI loads the feature inside `BlogEditor`.

### Initial load

1. The page requests `GET /api/blog/lookup`.
2. The page requests `GET /api/blog/posts`.
3. The returned post list is shown in the left table.
4. Selecting a row opens the slide-over editor on the right.

### Creating a draft

1. The user clicks `New`.
2. The frontend calls `POST /api/blog/posts`.
3. The backend inserts a blank draft with:
   - a default category
   - empty title
   - no slug
   - no URL
   - empty `content_markdown`
4. The returned draft is inserted into the current frontend list and opened.

### Editing and autosave

1. The user edits title, metadata, tags, or markdown content.
2. `BlogEditor/index.tsx` applies the change locally and marks the post dirty.
3. A debounced effect waits 900 ms after the latest selected-post change.
4. The frontend sends the full post document to:

   `PATCH /api/blog/posts/<post_id>`

5. The backend validates and normalizes:
   - post status
   - category
   - subcategory
   - tags
   - `contentMarkdown`
6. The backend updates `blog_posts`.
7. The backend rewrites `blog_post_tags` for the saved tag list.
8. The backend returns:
   - the saved post in frontend shape
   - a `savedAt` timestamp
9. The frontend replaces the local row with the backend-confirmed row and shows
   `Saved HH:MM`.

### Publishing

Publishing is currently controlled by the same autosave endpoint.

- If status becomes `Published`, the backend:
  - slugifies the current title
  - builds the public URL from that slug
  - sets `published_at` if it was empty
- If status becomes `Draft`, the backend:
  - clears slug
  - clears URL
  - clears `published_at`

### Deleting

1. The user confirms deletion in the admin UI.
2. The frontend calls `DELETE /api/blog/posts/<post_id>`.
3. The backend hard-deletes the post row.
4. `blog_post_tags` rows are cleaned up automatically via cascade.

## Backend Query Design

The admin backend uses one shared base post query in `backend/admin/_blog.py`.

That query:

- reads from `blog_posts`
- joins `blog_categories`
- left-joins `blog_subcategories`
- left-joins the `blog_post_tags` relation
- left-joins `blog_tags`
- aggregates tags back into one JSON array per post

This keeps the list endpoint and detail endpoint consistent.

## Canonical Content Field

The canonical article body is stored as markdown in `blog_posts.content_markdown`
(`text`).

The admin frontend uses one field on the post object:

- `contentMarkdown`

## Error Handling

`backend/admin/_blog.py` currently raises:

- `ValueError`
  For invalid editor payloads or missing required inputs.
- `AdminBlogNotFoundError`
  When a requested post does not exist.

`backend/admin/app.py` converts these into HTTP responses:

- `400 Bad Request`
- `404 Not Found`

## Current Limitations

- There is no media upload pipeline yet; markdown content currently references
  remote URLs directly.
- Deletion is a hard delete, not an archive/soft-delete flow.
- Markdown rendering styles are scoped in the public page; changing visual output
  requires updates in `landingpage/app/blog/[slug]/page.tsx`.
