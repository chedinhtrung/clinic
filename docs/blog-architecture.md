# Blog Architecture

This document describes how the blog feature currently works across the
database, admin UI, public API, and public Next.js rendering.

## Overview

The blog stack has 4 main parts:

- `backend/database/002_blogs_frontend.sql`: Postgres schema for blog content.
- `backend/admin/_blog.py` plus `backend/admin/app.py`: admin CRUD and autosave API.
- `backend/blog/_blog.py` plus `backend/blog/app.py`: public read-only blog API.
- `landingpage/app/blog/[slug]/page.tsx`: public server-rendered blog detail page.

The system is intentionally split into:

- one write path for editors
- one read path for public visitors

That separation keeps admin-specific behaviors out of the public runtime and
lets the public page stay SSR-friendly.

## Storage Model

Blog data is stored in Postgres.

### Tables

- `blog_categories`: top-level categories such as `Y khoa`
- `blog_subcategories`: optional child grouping under a category
- `blog_tags`: reusable tags
- `blog_posts`: the canonical post record
- `blog_post_tags`: many-to-many join between posts and tags

### `blog_posts` columns

Key fields in `blog_posts`:

- `id`: UUID primary key
- `category_id`: required FK to `blog_categories`
- `subcategory_id`: optional FK to `blog_subcategories`
- `title`
- `slug`
- `url`
- `short_description`
- `cover_image_url`
- `content_markdown`: canonical markdown article body
- `status`: currently `draft`, `published`, or `archived` at the DB layer
- `published_at`
- `created_at`
- `updated_at`

Important constraints:

- published posts must have `slug`, `url`, and `published_at`
- `slug` and `url` are unique
- `content_markdown` defaults to an empty string

Source: [backend/database/002_blogs_frontend.sql](/home/steve/Desktop/clinic/backend/database/002_blogs_frontend.sql:1)

## Admin Flow

The admin UI lives in `adminpage/components/BlogEditor`.

### Editor responsibilities

- load lookup values for categories, subcategories, and tags
- load paginated posts
- open one post in the slide-over editor
- autosave edits after debounce
- toggle publish state
- delete posts

### Admin post shape

The admin editor works with one canonical post object:

- title and slug
- category and optional subcategory
- tags
- `shortDescription`
- `coverImageUrl`
- `contentMarkdown`
- `status`
- `updatedAt`

Source: [adminpage/components/BlogEditor/types.ts](/home/steve/Desktop/clinic/adminpage/components/BlogEditor/types.ts:1)

### Autosave

Autosave is orchestrated in
[adminpage/components/BlogEditor/index.tsx](/home/steve/Desktop/clinic/adminpage/components/BlogEditor/index.tsx:1).

Behavior:

- local edits mark the selected post dirty
- a 900 ms debounce waits for typing to pause
- the full post object is sent to `PATCH /api/blog/posts/<post_id>`
- stale responses are ignored with a save sequence counter

### Admin backend behavior

The admin backend:

- resolves categories, subcategories, and tags from ids or names
- upserts category/subcategory/tag lookup rows as needed
- rewrites `blog_post_tags` on each save
- stores `cover_image_url`
- stores `content_markdown`

Publishing behavior:

- when status becomes `published`, the backend generates a slug from the title
- it sets the public URL to `https://chedinhnghia.com/blog/<slug>`
- it sets `published_at` if it is not already set

Source: [backend/admin/_blog.py](/home/steve/Desktop/clinic/backend/admin/_blog.py:1)

### Admin API

Routes exposed by `backend/admin/app.py`:

- `GET /api/blog/lookup`
- `GET /api/blog/posts`
- `POST /api/blog/posts`
- `GET /api/blog/posts/<post_id>`
- `PATCH /api/blog/posts/<post_id>`
- `DELETE /api/blog/posts/<post_id>`

Source: [backend/admin/app.py](/home/steve/Desktop/clinic/backend/admin/app.py:1)

## Public Read API

The public blog API is read-only and lives in `backend/blog`.

### Public endpoints

- `GET /api/health`
- `GET /api/posts`
- `GET /api/posts/<slug>`
- `GET /api/categories`
- `GET /api/tags`

Production also supports the same routes under `/blog-api/api/...` so Nginx can
route public traffic without rewriting the Flask app itself.

Source: [backend/blog/app.py](/home/steve/Desktop/clinic/backend/blog/app.py:1)

### Public list vs detail

`GET /api/posts`

- returns only published posts
- supports category filter, tag filter, and limit
- returns summary data suitable for cards and lists
- does not include `contentMarkdown`

`GET /api/posts/<slug>`

- returns only one published post
- includes `contentMarkdown`
- returns 404 if the slug does not exist or is not published

Source: [backend/blog/_blog.py](/home/steve/Desktop/clinic/backend/blog/_blog.py:1)

## Public SSR Page

The public article page is implemented in:

[landingpage/app/blog/[slug]/page.tsx](/home/steve/Desktop/clinic/landingpage/app/blog/[slug]/page.tsx:1)

### Why SSR

The page is rendered on the server so the first HTML response already contains:

- article title
- metadata
- cover image
- article body
- tags

This improves SEO and avoids depending on client-side fetch before meaningful
content appears.

### Rendering path

The page server-fetches `contentMarkdown` and renders it using:

- `react-markdown`
- `remark-gfm`
- scoped component styles in the page

This keeps markdown presentation local to the blog article route and avoids
global style side effects.

### SSR fetch behavior

The page fetches the published post by slug on the server using:

- `BLOG_API_BASE_URL`
- fallback `NEXT_PUBLIC_BLOG_API_BASE_URL`
- fallback `NEXT_PUBLIC_API_BASE_URL`
- fallback `http://localhost:5002`

`BLOG_API_BASE_URL` should be an absolute URL because server-side `fetch(...)`
cannot resolve relative paths like `/blog-api`.

Current intended production split:

- `BLOG_API_BASE_URL=http://chedinhnghia.com/blog-api` for SSR
- `NEXT_PUBLIC_BLOG_API_BASE_URL=/blog-api` for browser-side blog list fetches

### 404 handling

If the slug is not found in the public API, the page calls `notFound()` and
renders the custom route-level page:

[landingpage/app/blog/[slug]/not-found.tsx](/home/steve/Desktop/clinic/landingpage/app/blog/[slug]/not-found.tsx:1)

## URL Model

Published public post URLs follow this path:

- `https://chedinhnghia.com/blog/<slug>`

The backend, admin preview, and SSR route are aligned around that path.

## Deployment Notes

Relevant files:

- [docker-compose.blog.prod.yaml](/home/steve/Desktop/clinic/docker-compose.blog.prod.yaml:1)
- [docker-compose.frontend.prod.yaml](/home/steve/Desktop/clinic/docker-compose.frontend.prod.yaml:1)
- [.env](/home/steve/Desktop/clinic/.env:1)

Current runtime split:

- blog backend container listens on port `5002`
- public Next frontend listens on port `3000`
- public browser-side blog API requests go through `/blog-api`
- SSR blog detail fetches use `BLOG_API_BASE_URL`
