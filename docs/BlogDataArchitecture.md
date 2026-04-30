# Blog Data Architecture

This document describes the current blog database model and the intended data
flow between the admin editor and the future public blog.

## Goals

The architecture is designed around a few principles:

- One canonical source of truth for blog post content.
- Admin editing should be lossless.
- The public blog should be able to server-render from database content.
- Categories, subcategories, and tags should be normalized relational data.

## Source Of Truth

The canonical article body is stored in:

- `blog_posts.content_blocks`

This column is `jsonb` and contains the ordered block document used by the admin
editor.

The system does not treat generated HTML as canonical source data.

## Database Files

The fresh-create blog schema now lives in one file:

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
- `content_blocks`
- `status`
- `published_at`
- `created_at`
- `updated_at`

Important rules:

- `slug` can be null for drafts.
- `url` can be null for drafts.
- `content_blocks` is required and defaults to an empty JSON array.
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

## Content Block Model

The editor currently stores these block types:

- `paragraph`
  Fields: `id`, `type`, `text`
- `heading`
  Fields: `id`, `type`, `text`
- `image`
  Fields: `id`, `type`, `src`, `alt`, `caption`
- `youtube`
  Fields: `id`, `type`, `url`, `caption`
- `link`
  Fields: `id`, `type`, `url`, `text`

The backend validates incoming blocks before storing them.

## Draft And Published States

The current admin flow uses two editable states:

- `draft`
- `published`

Behavior:

- Drafts may have no slug and no public URL.
- Publishing derives slug and URL from the current title.
- Publishing sets `published_at` the first time a post is published.

The schema also still allows `archived` as a stored database status for future
use, though the current admin editor does not expose that status.

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
- full `content_blocks`

### Public side

The intended public architecture is:

1. Load published posts from the database.
2. Server-render the block JSON into semantic HTML on request.
3. Keep the block JSON as the only canonical article source.

That gives:

- good SEO because the response HTML contains article content
- no need to reverse-parse HTML back into editor blocks
- one shared source of truth across admin and public

## Why JSONB Instead Of HTML

Using `jsonb` for the article body preserves the editor’s actual structure.

Benefits:

- lossless re-editing
- safer future schema evolution
- easier server-side rendering
- easier future support for richer block types

Tradeoff:

- rendering must happen in application code rather than by directly outputting
  stored HTML

That tradeoff is intentional because the JSON document is the editor-native
format.
