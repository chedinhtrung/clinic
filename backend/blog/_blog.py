import os

from psycopg.rows import dict_row
from psycopg_pool import ConnectionPool
from urllib.parse import quote


BLOG_DB_URL = os.environ.get("BLOG_DB_URL")
if not BLOG_DB_URL:
    raise RuntimeError("BLOG_DB_URL is required")

pool = ConnectionPool(conninfo=BLOG_DB_URL, kwargs={"row_factory": dict_row}, open=True)


def db_healthcheck() -> bool:
    with pool.connection() as conn:
        with conn.cursor() as cur:
            cur.execute("SELECT 1 AS ok")
            row = cur.fetchone()

    return bool(row and row["ok"] == 1)


def _build_public_url(slug: str | None) -> str | None:
    if not slug:
        return None
    return f"https://chedinhnghia.com/blog/{quote(slug)}"


def _serialize_post(row: dict, *, include_content_blocks: bool = False) -> dict:
    post = {
        "id": str(row["id"]),
        "title": row["title"],
        "slug": row["slug"],
        "url": _build_public_url(row["slug"]),
        "shortDescription": row["short_description"],
        "coverImageUrl": row["cover_image_url"],
        "status": row["status"],
        "publishedAt": row["published_at"].isoformat() if row["published_at"] else None,
        "createdAt": row["created_at"].isoformat(),
        "updatedAt": row["updated_at"].isoformat(),
        "category": {
            "id": str(row["category_id"]),
            "name": row["category_name"],
            "slug": row["category_slug"],
        },
        "subcategory": (
            {
                "id": str(row["subcategory_id"]),
                "name": row["subcategory_name"],
                "slug": row["subcategory_slug"],
            }
            if row["subcategory_id"]
            else None
        ),
        "tags": row["tags"] or [],
    }

    if include_content_blocks:
        post["contentBlocks"] = row["content_blocks"] or []

    return post


def _published_post_query(where_sql: str) -> str:
    return f"""
        SELECT
          bp.id,
          bp.title,
          bp.slug,
          bp.url,
          bp.short_description,
          bp.cover_image_url,
          bp.content_blocks,
          bp.status,
          bp.published_at,
          bp.created_at,
          bp.updated_at,
          bc.id AS category_id,
          bc.name AS category_name,
          bc.slug AS category_slug,
          bsc.id AS subcategory_id,
          bsc.name AS subcategory_name,
          bsc.slug AS subcategory_slug,
          COALESCE(
            json_agg(
              DISTINCT jsonb_build_object(
                'id', bt.id,
                'name', bt.name,
                'slug', bt.slug
              )
            ) FILTER (WHERE bt.id IS NOT NULL),
            '[]'::json
          ) AS tags
        FROM blog_posts bp
        JOIN blog_categories bc ON bc.id = bp.category_id
        LEFT JOIN blog_subcategories bsc ON bsc.id = bp.subcategory_id
        LEFT JOIN blog_post_tags bpt ON bpt.post_id = bp.id
        LEFT JOIN blog_tags bt ON bt.id = bpt.tag_id
        {where_sql}
        GROUP BY bp.id, bc.id, bsc.id
    """


def db_get_published_posts(
    *,
    category_slug: str | None = None,
    tag_slug: str | None = None,
    exclude_slug: str | None = None,
    page: int = 1,
    page_size: int = 50,
) -> dict:
    normalized_page_size = min(max(page_size, 1), 100)
    normalized_page = max(page, 1)
    where_clauses = ["bp.status = 'published'"]
    params: list[object] = []

    if category_slug:
        where_clauses.append("bc.slug = %s")
        params.append(category_slug)

    if tag_slug:
        where_clauses.append(
            """
            EXISTS (
              SELECT 1
              FROM blog_post_tags bpt_filter
              JOIN blog_tags bt_filter ON bt_filter.id = bpt_filter.tag_id
              WHERE bpt_filter.post_id = bp.id
                AND bt_filter.slug = %s
            )
            """
        )
        params.append(tag_slug)

    if exclude_slug:
        where_clauses.append("bp.slug <> %s")
        params.append(exclude_slug)

    where_sql = f"WHERE {' AND '.join(where_clauses)}"

    with pool.connection() as conn:
        with conn.cursor() as cur:
            cur.execute(
                f"""
                SELECT COUNT(*) AS count
                FROM blog_posts bp
                JOIN blog_categories bc ON bc.id = bp.category_id
                LEFT JOIN blog_subcategories bsc ON bsc.id = bp.subcategory_id
                {where_sql}
                """,
                params,
            )
            total_posts = int(cur.fetchone()["count"])
            total_pages = max(1, (total_posts + normalized_page_size - 1) // normalized_page_size)
            bounded_page = min(normalized_page, total_pages)
            offset = (bounded_page - 1) * normalized_page_size

            query = (
                _published_post_query(where_sql)
        + """
        ORDER BY bp.published_at DESC NULLS LAST, bp.created_at DESC
        LIMIT %s
        OFFSET %s
    """
            )
            cur.execute(query, [*params, normalized_page_size, offset])
            posts = [_serialize_post(row) for row in cur.fetchall()]

    return {
        "posts": posts,
        "page": bounded_page,
        "pageSize": normalized_page_size,
        "totalPosts": total_posts,
        "totalPages": total_pages,
    }


def db_get_published_post_by_slug(*, slug: str) -> dict | None:
    normalized_slug = (slug or "").strip().lower()
    if not normalized_slug:
        raise ValueError("slug is required")

    query = _published_post_query(
        """
        WHERE bp.status = 'published'
          AND bp.slug = %s
        """
    )

    with pool.connection() as conn:
        with conn.cursor() as cur:
            cur.execute(query, (normalized_slug,))
            row = cur.fetchone()

    if row is None:
        return None

    return _serialize_post(row, include_content_blocks=True)


def db_get_categories() -> list[dict]:
    with pool.connection() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT id, name, slug, created_at, updated_at
                FROM blog_categories
                ORDER BY name ASC
                """
            )
            rows = cur.fetchall()

    return [
        {
            "id": str(row["id"]),
            "name": row["name"],
            "slug": row["slug"],
            "createdAt": row["created_at"].isoformat(),
            "updatedAt": row["updated_at"].isoformat(),
        }
        for row in rows
    ]


def db_get_tags() -> list[dict]:
    with pool.connection() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT id, name, slug, created_at, updated_at
                FROM blog_tags
                ORDER BY name ASC
                """
            )
            rows = cur.fetchall()

    return [
        {
            "id": str(row["id"]),
            "name": row["name"],
            "slug": row["slug"],
            "createdAt": row["created_at"].isoformat(),
            "updatedAt": row["updated_at"].isoformat(),
        }
        for row in rows
    ]
