from __future__ import annotations

from uuid import UUID
from datetime import datetime, timezone
from typing import Any
from urllib.parse import quote

from psycopg.types.json import Jsonb

from config import BLOG_DB_POOL


class AdminBlogNotFoundError(ValueError):
    """Raised when a blog post cannot be found."""


def _is_uuid(raw_value: str) -> bool:
    # Frontend-only temporary ids such as "pending-tag-..." should never be sent
    # to Postgres uuid columns. This helper lets the backend distinguish durable
    # ids from client-local placeholders.
    try:
        UUID(raw_value)
    except (ValueError, TypeError):
        return False
    return True


def _slugify(raw_value: str) -> str:
    # Build a stable URL slug from free text. We keep this intentionally simple:
    # lowercase ASCII words joined by single dashes.
    normalized = raw_value.strip().lower()
    slug_parts: list[str] = []
    pending_dash = False

    for char in normalized:
        is_word_char = ("a" <= char <= "z") or ("0" <= char <= "9")
        if is_word_char:
            if pending_dash and slug_parts:
                slug_parts.append("-")
            slug_parts.append(char)
            pending_dash = False
        elif slug_parts:
            pending_dash = True

    return "".join(slug_parts).strip("-")


def _build_public_url(slug: str | None) -> str | None:
    # Drafts do not need a public URL yet. Published posts derive their public
    # URL directly from the stored slug.
    if not slug:
        return None
    return f"https://blogs.chedinhnghia.com/{quote(slug)}"

def _normalize_block(block: dict[str, Any]) -> dict[str, Any]:
    # Validate and normalize one content block from the editor payload before
    # persisting it in jsonb. This keeps unsupported block shapes out of the DB.
    block_type = str(block.get("type") or "").strip()
    block_id = str(block.get("id") or "").strip()
    if not block_type or not block_id:
        raise ValueError("Each content block must include id and type")

    normalized: dict[str, Any] = {"id": block_id, "type": block_type}
    if block_type in {"heading", "paragraph"}:
        normalized["text"] = str(block.get("text") or "")
    elif block_type == "image":
        normalized["src"] = str(block.get("src") or "")
        normalized["alt"] = str(block.get("alt") or "")
        normalized["caption"] = str(block.get("caption") or "")
    elif block_type == "youtube":
        normalized["url"] = str(block.get("url") or "")
        normalized["caption"] = str(block.get("caption") or "")
    elif block_type == "link":
        normalized["url"] = str(block.get("url") or "")
        normalized["text"] = str(block.get("text") or "")
    else:
        raise ValueError(f"Unsupported content block type: {block_type}")

    return normalized


def _normalize_content_blocks(raw_blocks: Any) -> list[dict[str, Any]]:
    # The editor stores the document as ordered blocks, so the backend accepts
    # only a list and normalizes each block into the supported schema.
    if raw_blocks is None:
        return []
    if not isinstance(raw_blocks, list):
        raise ValueError("contentBlocks must be a list")
    return [_normalize_block(block) for block in raw_blocks if isinstance(block, dict)]


def _normalize_status(raw_status: Any) -> str:
    # Validate the persisted status exactly as the API contract defines it.
    # Display labels belong in the frontend presentation layer.
    if not isinstance(raw_status, str):
        raise ValueError("status must be a string")
    if raw_status not in {"draft", "published"}:
        raise ValueError("status must be one of: draft, published")
    return raw_status


def _serialize_lookup_row(row: dict[str, Any]) -> dict[str, str]:
    # Categories, subcategories, and tags share the same minimal admin lookup
    # shape: an id plus the display name.
    return {"id": str(row["id"]), "name": row["name"]}


def _serialize_post(row: dict[str, Any]) -> dict[str, Any]:
    # Convert one SQL result row into the blog post API shape, keeping domain
    # values canonical so the frontend can decide how to present them.
    return {
        "id": str(row["id"]),
        "title": row["title"] or "",
        "slug": row["slug"],
        "category": {"id": str(row["category_id"]), "name": row["category_name"]},
        "subcategory": (
            {"id": str(row["subcategory_id"]), "name": row["subcategory_name"]}
            if row["subcategory_id"]
            else None
        ),
        "tags": row["tags"] or [],
        "status": row["status"],
        "updatedAt": row["updated_at"].isoformat() if isinstance(row["updated_at"], datetime) else str(row["updated_at"]),
        "shortDescription": row["short_description"] or "",
        "contentBlocks": row["content_blocks"] or [],
    }


def _get_post_query(where_clause: str) -> str:
    # Shared base query for post list/detail reads.
    # It joins the post to category and optional subcategory metadata, and
    # aggregates the many-to-many tag relation back into one JSON array so the
    # frontend can consume a single post object per row.
    return f"""
        SELECT
          bp.id,
          bp.title,
          bp.slug,
          bp.short_description,
          bp.status,
          bp.updated_at,
          bp.content_blocks,
          bc.id AS category_id,
          bc.name AS category_name,
          bsc.id AS subcategory_id,
          bsc.name AS subcategory_name,
          COALESCE(
            json_agg(
              DISTINCT jsonb_build_object(
                'id', bt.id,
                'name', bt.name
              )
            ) FILTER (WHERE bt.id IS NOT NULL),
            '[]'::json
          ) AS tags
        FROM blog_posts bp
        JOIN blog_categories bc ON bc.id = bp.category_id
        LEFT JOIN blog_subcategories bsc ON bsc.id = bp.subcategory_id
        LEFT JOIN blog_post_tags bpt ON bpt.post_id = bp.id
        LEFT JOIN blog_tags bt ON bt.id = bpt.tag_id
        {where_clause}
        GROUP BY bp.id, bc.id, bsc.id
    """


def _resolve_category(cur: Any, category_payload: dict[str, Any] | None) -> dict[str, str]:
    # Resolve the category selected in the editor. We prefer an existing id when
    # present, otherwise we upsert by slug so newly typed categories become
    # durable lookup values immediately.
    if not category_payload:
        raise ValueError("category is required")

    category_id = str(category_payload.get("id") or "").strip()
    category_name = str(category_payload.get("name") or "").strip()

    if category_id and _is_uuid(category_id):
        # Reuse the referenced category when the frontend sends a stable id.
        cur.execute(
            """
            SELECT id, name
            FROM blog_categories
            WHERE id = %s
            """,
            (category_id,),
        )
        row = cur.fetchone()
        if row:
            return {"id": str(row["id"]), "name": row["name"]}

    if not category_name:
        raise ValueError("category name is required")

    # Create the category if it does not exist yet, or refresh the display name
    # on the existing slug when users type a known category manually.
    cur.execute(
        """
        INSERT INTO blog_categories (name, slug)
        VALUES (%s, %s)
        ON CONFLICT (slug)
        DO UPDATE SET
          name = EXCLUDED.name,
          updated_at = now()
        RETURNING id, name
        """,
        (category_name, _slugify(category_name) or "category"),
    )
    row = cur.fetchone()
    return {"id": str(row["id"]), "name": row["name"]}


def _resolve_subcategory(
    cur: Any,
    category_id: str,
    subcategory_payload: dict[str, Any] | None,
) -> dict[str, str] | None:
    # Subcategories are optional, but when provided they are normalized into the
    # shared lookup table so later edits can reference them by id.
    if not subcategory_payload:
        return None

    subcategory_id = str(subcategory_payload.get("id") or "").strip()
    subcategory_name = str(subcategory_payload.get("name") or "").strip()

    if subcategory_id and _is_uuid(subcategory_id):
        # Reuse the referenced subcategory when the frontend already knows it.
        cur.execute(
            """
            SELECT id, name
            FROM blog_subcategories
            WHERE id = %s
            """,
            (subcategory_id,),
        )
        row = cur.fetchone()
        if row:
            return {"id": str(row["id"]), "name": row["name"]}

    if not subcategory_name:
        return None

    # Upsert the subcategory by slug so a newly typed value becomes reusable in
    # later posts. We also keep its parent category aligned with the current edit.
    cur.execute(
        """
        INSERT INTO blog_subcategories (category_id, name, slug)
        VALUES (%s, %s, %s)
        ON CONFLICT (slug)
        DO UPDATE SET
          category_id = EXCLUDED.category_id,
          name = EXCLUDED.name,
          updated_at = now()
        RETURNING id, name
        """,
        (category_id, subcategory_name, _slugify(subcategory_name) or "subcategory"),
    )
    row = cur.fetchone()
    return {"id": str(row["id"]), "name": row["name"]}


def _resolve_tags(cur: Any, tags_payload: Any) -> list[dict[str, str]]:
    # Tags are many-to-many, so we normalize the incoming list into durable tag
    # rows first and then let the caller rewrite the join table for the post.
    if not isinstance(tags_payload, list):
        return []

    resolved_tags: list[dict[str, str]] = []
    seen_ids: set[str] = set()

    for tag_payload in tags_payload:
        if not isinstance(tag_payload, dict):
            continue

        tag_id = str(tag_payload.get("id") or "").strip()
        tag_name = str(tag_payload.get("name") or "").strip()

        row = None
        if tag_id and _is_uuid(tag_id):
            # Reuse an existing tag whenever the frontend sends a persisted id.
            cur.execute(
                """
                SELECT id, name
                FROM blog_tags
                WHERE id = %s
                """,
                (tag_id,),
            )
            row = cur.fetchone()

        if row is None:
            if not tag_name:
                continue
            # Create or refresh a tag by slug so ad-hoc tag entry in the admin
            # UI becomes a first-class lookup option.
            cur.execute(
                """
                INSERT INTO blog_tags (name, slug)
                VALUES (%s, %s)
                ON CONFLICT (slug)
                DO UPDATE SET
                  name = EXCLUDED.name,
                  updated_at = now()
                RETURNING id, name
                """,
                (tag_name, _slugify(tag_name) or "tag"),
            )
            row = cur.fetchone()

        serialized = {"id": str(row["id"]), "name": row["name"]}
        if serialized["id"] not in seen_ids:
            seen_ids.add(serialized["id"])
            resolved_tags.append(serialized)

    return resolved_tags


def db_get_blog_lookup_data() -> dict[str, list[dict[str, str]]]:
    # Load all editor lookup values used by the category/subcategory/tag controls.
    with BLOG_DB_POOL.connection() as conn:
        with conn.cursor() as cur:
            # Categories are ordered alphabetically for predictable datalist
            # suggestions in the admin editor.
            cur.execute(
                """
                SELECT id, name
                FROM blog_categories
                ORDER BY name ASC
                """
            )
            categories = [_serialize_lookup_row(row) for row in cur.fetchall()]

            # Subcategories are fetched separately because the current admin
            # editor uses one flat suggestion list.
            cur.execute(
                """
                SELECT id, name
                FROM blog_subcategories
                ORDER BY name ASC
                """
            )
            subcategories = [_serialize_lookup_row(row) for row in cur.fetchall()]

            # Tags are also returned as one flat lookup list for autocomplete.
            cur.execute(
                """
                SELECT id, name
                FROM blog_tags
                ORDER BY name ASC
                """
            )
            tags = [_serialize_lookup_row(row) for row in cur.fetchall()]

    return {
        "categories": categories,
        "subcategories": subcategories,
        "tags": tags,
    }


def db_get_blog_posts_page(
    *,
    page: int,
    page_size: int,
    search_text: str,
    filter_text: str,
) -> dict[str, Any]:
    # Return one paginated page of admin-editable posts, filtered by title and
    # by free-text category/subcategory/tag tokens.
    safe_page_size = min(max(page_size, 1), 100)
    safe_page = max(page, 1)
    normalized_search = search_text.strip().lower()
    filters = [item.strip().lower() for item in filter_text.split(",") if item.strip()]

    where_clauses = ["1 = 1"]
    params: list[Any] = []

    if normalized_search:
        where_clauses.append("lower(bp.title) LIKE %s")
        params.append(f"%{normalized_search}%")

    for filter_value in filters:
        # Each filter token must match at least one of category, subcategory, or
        # attached tag names for the post to stay in the result set.
        where_clauses.append(
            """
            (
              lower(bc.name) LIKE %s
              OR lower(COALESCE(bsc.name, '')) LIKE %s
              OR EXISTS (
                SELECT 1
                FROM blog_post_tags bpt_filter
                JOIN blog_tags bt_filter ON bt_filter.id = bpt_filter.tag_id
                WHERE bpt_filter.post_id = bp.id
                  AND lower(bt_filter.name) LIKE %s
              )
            )
            """
        )
        like_value = f"%{filter_value}%"
        params.extend([like_value, like_value, like_value])

    where_sql = "WHERE " + " AND ".join(where_clauses)

    with BLOG_DB_POOL.connection() as conn:
        with conn.cursor() as cur:
            # First query: count the total number of matching posts so the
            # frontend can render pagination controls correctly.
            cur.execute(
                f"""
                SELECT COUNT(*)
                FROM blog_posts bp
                JOIN blog_categories bc ON bc.id = bp.category_id
                LEFT JOIN blog_subcategories bsc ON bsc.id = bp.subcategory_id
                {where_sql}
                """,
                params,
            )
            total_posts = int(cur.fetchone()["count"])
            total_pages = max(1, (total_posts + safe_page_size - 1) // safe_page_size)
            bounded_page = min(safe_page, total_pages)
            offset = (bounded_page - 1) * safe_page_size

            # Second query: fetch only the requested page, ordered by latest
            # updates first so recently edited drafts float to the top.
            cur.execute(
                _get_post_query(where_sql)
                + """
                    ORDER BY bp.updated_at DESC, bp.created_at DESC
                    LIMIT %s
                    OFFSET %s
                """,
                [*params, safe_page_size, offset],
            )
            posts = [_serialize_post(row) for row in cur.fetchall()]

    return {
        "posts": posts,
        "page": bounded_page,
        "pageSize": safe_page_size,
        "totalPosts": total_posts,
        "totalPages": total_pages,
    }


def db_create_blog_post() -> dict[str, Any]:
    # Create a minimal draft post. The admin editor will immediately load it and
    # continue filling in title, metadata, and content blocks through autosave.
    with BLOG_DB_POOL.connection() as conn:
        with conn.transaction():
            with conn.cursor() as cur:
                # New drafts need a valid category FK from the start, so we use
                # the first available category as a lightweight default.
                cur.execute(
                    """
                    SELECT id
                    FROM blog_categories
                    ORDER BY name ASC
                    LIMIT 1
                    """
                )
                category_row = cur.fetchone()
                if category_row is None:
                    raise ValueError("At least one blog category is required before creating posts")

                # Insert a blank draft with no slug or URL yet. Those fields are
                # only materialized once the post is published.
                cur.execute(
                    """
                    INSERT INTO blog_posts (
                      category_id,
                      title,
                      slug,
                      url,
                      short_description,
                      status,
                      content_blocks
                    )
                    VALUES (%s, %s, %s, %s, %s, 'draft', '[]'::jsonb)
                    RETURNING id
                    """,
                    (category_row["id"], "", None, None, ""),
                )
                post_id = cur.fetchone()["id"]

    return db_get_blog_post(post_id=str(post_id))


def db_get_blog_post(*, post_id: str) -> dict[str, Any]:
    # Fetch one full post for the admin editor using the same serializer and
    # join structure as the list endpoint.
    if not post_id:
        raise ValueError("post_id is required")

    with BLOG_DB_POOL.connection() as conn:
        with conn.cursor() as cur:
            # Reuse the shared post query so detail reads and list reads stay in
            # sync on shape and aggregation behavior.
            cur.execute(_get_post_query("WHERE bp.id = %s"), (post_id,))
            row = cur.fetchone()

    if row is None:
        raise AdminBlogNotFoundError("blog post not found")

    return _serialize_post(row)


def db_update_blog_post(*, post_id: str, payload: dict[str, Any]) -> dict[str, Any]:
    # Persist the editor's canonical post document. This is the main autosave
    # entry point used by the admin UI.
    if not post_id:
        raise ValueError("post_id is required")

    title = str(payload.get("title") or "")
    short_description = str(payload.get("shortDescription") or "")
    status = _normalize_status(payload.get("status"))
    content_blocks = _normalize_content_blocks(payload.get("contentBlocks"))

    with BLOG_DB_POOL.connection() as conn:
        with conn.transaction():
            with conn.cursor() as cur:
                # Lock the target row so concurrent autosaves for the same post
                # cannot interleave unpredictably.
                cur.execute(
                    """
                    SELECT id
                    FROM blog_posts
                    WHERE id = %s
                    FOR UPDATE
                    """,
                    (post_id,),
                )
                if cur.fetchone() is None:
                    raise AdminBlogNotFoundError("blog post not found")

                category = _resolve_category(cur, payload.get("category"))
                subcategory = _resolve_subcategory(cur, category["id"], payload.get("subcategory"))
                tags = _resolve_tags(cur, payload.get("tags"))

                should_publish = status == "published"
                generated_slug = _slugify(title) if should_publish else None
                published_at_sql = "COALESCE(published_at, now())" if should_publish else "NULL"

                # Update the core post record: metadata, publish state, and the
                # full jsonb content document. Publishing derives slug and URL
                # directly from the current title.
                cur.execute(
                    f"""
                    UPDATE blog_posts
                    SET category_id = %s,
                        subcategory_id = %s,
                        title = %s,
                        slug = %s,
                        url = %s,
                        short_description = %s,
                        status = %s,
                        published_at = {published_at_sql},
                        content_blocks = %s::jsonb,
                        updated_at = now()
                    WHERE id = %s
                    """,
                    (
                        category["id"],
                        subcategory["id"] if subcategory else None,
                        title,
                        generated_slug,
                        _build_public_url(generated_slug),
                        short_description,
                        status,
                        Jsonb(content_blocks),
                        post_id,
                    ),
                )

                # The simplest way to keep tags authoritative is to rewrite the
                # join table on each save from the normalized tag list.
                cur.execute("DELETE FROM blog_post_tags WHERE post_id = %s", (post_id,))
                for tag in tags:
                    cur.execute(
                        """
                        INSERT INTO blog_post_tags (post_id, tag_id)
                        VALUES (%s, %s)
                        """,
                        (post_id, tag["id"]),
                    )

    post = db_get_blog_post(post_id=post_id)
    return {"post": post, "savedAt": datetime.now(timezone.utc).isoformat()}


def db_delete_blog_post(*, post_id: str) -> None:
    # Permanently delete one post. In this dev-phase admin flow we do a hard
    # delete rather than introducing a separate soft-delete/archive lifecycle.
    if not post_id:
        raise ValueError("post_id is required")

    with BLOG_DB_POOL.connection() as conn:
        with conn.transaction():
            with conn.cursor() as cur:
                # Delete the post row and rely on ON DELETE CASCADE to clean up
                # the blog_post_tags join rows automatically.
                cur.execute(
                    """
                    DELETE FROM blog_posts
                    WHERE id = %s
                    RETURNING id
                    """,
                    (post_id,),
                )
                if cur.fetchone() is None:
                    raise AdminBlogNotFoundError("blog post not found")
