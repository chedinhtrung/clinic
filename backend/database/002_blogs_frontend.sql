CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE blog_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE blog_tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE blog_subcategories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid NOT NULL REFERENCES blog_categories(id) ON DELETE CASCADE,
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE blog_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid NOT NULL REFERENCES blog_categories(id),
  subcategory_id uuid REFERENCES blog_subcategories(id),
  title text NOT NULL,
  slug text UNIQUE,
  url text UNIQUE,
  short_description text,
  cover_image_url text,
  content_blocks jsonb NOT NULL DEFAULT '[]'::jsonb,
  status text NOT NULL DEFAULT 'draft',
  published_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (status IN ('draft', 'published', 'archived')),
  CHECK (
    status <> 'published'
    OR (
      slug IS NOT NULL
      AND url IS NOT NULL
      AND published_at IS NOT NULL
    )
  )
);

CREATE TABLE blog_post_tags (
  post_id uuid NOT NULL REFERENCES blog_posts(id) ON DELETE CASCADE,
  tag_id uuid NOT NULL REFERENCES blog_tags(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (post_id, tag_id)
);

CREATE INDEX idx_blog_posts_category_id ON blog_posts(category_id);
CREATE INDEX idx_blog_posts_subcategory_id ON blog_posts(subcategory_id);
CREATE INDEX idx_blog_posts_status ON blog_posts(status);
CREATE INDEX idx_blog_posts_published_at ON blog_posts(published_at);
CREATE INDEX idx_blog_subcategories_category_id ON blog_subcategories(category_id);
CREATE INDEX idx_blog_post_tags_tag_id ON blog_post_tags(tag_id);

INSERT INTO blog_categories (id, name, slug) VALUES
  ('33333333-3333-3333-3333-333333333333', 'Tin tức', 'tin-tuc'),
  ('11111111-1111-1111-1111-111111111111', 'Y khoa', 'y-khoa'),
  ('22222222-2222-2222-2222-222222222222', 'Ca lâm sàng', 'ca-lam-sang'),
  