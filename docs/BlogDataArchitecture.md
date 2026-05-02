# Blog Data Architecture

This document describes the current blog database model and the data flow
between the admin editor and the public blog.

## Goals

The architecture is designed around a few principles:

- One canonical source of truth for blog post content.
- Admin editing should stay simple and reliable.
- The public blog should server-render from database content.
- Categories, subcategories, and tags should remain normalized relational data.

## Source Of Truth

The canonical article body is stored in:

- `blog_posts.content_markdown`

This column is `text` and contains markdown content authored in the admin editor.

## Database Files

The fresh-create blog schema lives in:

- `backend/database/002_blogs_frontend.sql`

Optional seed data lives in:

- `backend/database/mock_blogs.sql`

## Main Tables

### `blog_categories`

Stores the top-level category list.

Fields:

- `id`
- `name`
- `slug`
- `created_at`
- `updated_at`

### `blog_subcategories`

Stores optional subcategories linked to a category.

Fields:

- `id`
- `category_id`
- `name`
- `slug`
- `created_at`
- `updated_at`

Notes:

- `category_id` references `blog_categories(id)`.
- Deleting a category cascades to its subcategories.

### `blog_tags`

Stores reusable tags.

Fields:

- `id`
- `name`
- `slug`
- `created_at`
- `updated_at`

### `blog_posts`

Stores the canonical editable post record.

Fields:

- `id`
- `category_id`
- `subcategory_id`
- `title`
- `slug`
- `url`
- `short_description`
- `cover_image_url`
- `content_markdown`
- `status`
- `published_at`
- `created_at`
- `updated_at`

Important rules:

- `slug` can be null for drafts.
- `url` can be null for drafts.
- `content_markdown` is required and defaults to an empty string.
- If `status = 'published'`, then:
  - `slug` must be non-null
  - `url` must be non-null
  - `published_at` must be non-null

### `blog_post_tags`

Join table between posts and tags.

Fields:

- `post_id`
- `tag_id`
- `created_at`

Notes:

- Primary key is `(post_id, tag_id)`.
- Deleting a post cascades to its tag joins.

## Draft And Published States

The current admin flow uses two editable states:

- `draft`
- `published`

Behavior:

- Drafts may have no slug and no public URL.
- Publishing derives slug and URL from the current title.
- Publishing sets `published_at` the first time a post is published.

The schema also allows `archived` as a stored database status for future use,
though the current admin editor does not expose that status.

## Data Flow

### Admin side

The admin editor reads and writes the canonical DB model directly.

- Lookup data comes from:
  - `blog_categories`
  - `blog_subcategories`
  - `blog_tags`
- Posts come from:
  - `blog_posts`
  - joined metadata and tags

Autosave persists:

- post metadata
- status
- normalized lookup relations
- full `content_markdown`

### Public side

The public blog reads published posts and returns markdown content in the detail
endpoint.

The Next.js article route then server-renders markdown using
`react-markdown` + `remark-gfm`.

## Why Markdown Instead Of Block JSON

Using markdown as the canonical article body reduces editor complexity and keeps
storage portable.

Benefits:

- simpler authoring architecture
- smaller frontend/editor maintenance surface
- broad renderer ecosystem
- straightforward SSR rendering pipeline

Tradeoff:

- markdown is not fully WYSIWYG
- final visual output depends on renderer + scoped styles
