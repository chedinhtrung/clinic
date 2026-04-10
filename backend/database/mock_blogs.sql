INSERT INTO blog_categories (id, name, slug) VALUES
  ('11111111-1111-1111-1111-111111111111', 'Y khoa', 'y-khoa'),
  ('22222222-2222-2222-2222-222222222222', 'Ca lam sang', 'ca-lam-sang'),
  ('33333333-3333-3333-3333-333333333333', 'Tin tuc', 'tin-tuc');

INSERT INTO blog_subcategories (id, category_id, name, slug) VALUES
  ('11111111-aaaa-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'Chan thuong the thao', 'chan-thuong-the-thao'),
  ('22222222-bbbb-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 'Phuc hoi chuc nang', 'phuc-hoi-chuc-nang'),
  ('33333333-cccc-3333-3333-333333333333', '22222222-2222-2222-2222-222222222222', 'Bao cao dieu tri', 'bao-cao-dieu-tri');

INSERT INTO blog_tags (id, name, slug) VALUES
  ('aaaaaaaa-1111-1111-1111-111111111111', 'ACL', 'acl'),
  ('bbbbbbbb-2222-2222-2222-222222222222', 'Noi soi', 'noi-soi'),
  ('cccccccc-3333-3333-3333-333333333333', 'Phuc hoi', 'phuc-hoi'),
  ('dddddddd-4444-4444-4444-444444444444', 'Lich kham', 'lich-kham'),
  ('eeeeeeee-5555-5555-5555-555555555555', 'Dau goi', 'dau-goi');

INSERT INTO blog_posts (
  id,
  category_id,
  subcategory_id,
  title,
  slug,
  url,
  short_description,
  cover_image_url,
  status,
  published_at
) VALUES
  (
    '90000000-0000-0000-0000-000000000001',
    '11111111-1111-1111-1111-111111111111',
    '11111111-aaaa-1111-1111-111111111111',
    'Noi soi khop goi: khi nao nen thuc hien?',
    'noi-soi-khop-goi-khi-nao-nen-thuc-hien',
    'https://blogs.chedinhnghia.com/noi-soi-khop-goi-khi-nao-nen-thuc-hien',
    'Tong quan ngan gon ve chi dinh noi soi khop goi va nhung dau hieu nguoi benh can duoc tham kham som.',
    'https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=1200&q=80',
    'published',
    '2026-04-01T09:00:00+07:00'
  ),
  (
    '90000000-0000-0000-0000-000000000002',
    '22222222-2222-2222-2222-222222222222',
    '33333333-cccc-3333-3333-333333333333',
    'Ca lam sang phuc hoi sau tai tao day chang cheo truoc',
    'ca-lam-sang-phuc-hoi-sau-tai-tao-day-chang-cheo-truoc',
    'https://blogs.chedinhnghia.com/ca-lam-sang-phuc-hoi-sau-tai-tao-day-chang-cheo-truoc',
    'Tom tat qua trinh dieu tri, theo doi va phuc hoi van dong sau chan thuong ACL o van dong vien tre.',
    'https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&w=1200&q=80',
    'published',
    '2026-04-05T14:30:00+07:00'
  ),
  (
    '90000000-0000-0000-0000-000000000003',
    '33333333-3333-3333-3333-333333333333',
    NULL,
    'Cap nhat lich kham va hoat dong chuyen mon thang 4',
    'cap-nhat-lich-kham-va-hoat-dong-chuyen-mon-thang-4',
    'https://blogs.chedinhnghia.com/cap-nhat-lich-kham-va-hoat-dong-chuyen-mon-thang-4',
    'Thong bao lich kham, lich nghi va cac chuong trinh chuyen mon du kien trong thang 4 nam 2026.',
    'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=1200&q=80',
    'published',
    '2026-04-08T08:00:00+07:00'
  ),
  (
    '90000000-0000-0000-0000-000000000004',
    '11111111-1111-1111-1111-111111111111',
    '22222222-bbbb-2222-2222-222222222222',
    'Dau goi khi chay bo: nhung dieu nen luu y som',
    'dau-goi-khi-chay-bo-nhung-dieu-nen-luu-y-som',
    'https://blogs.chedinhnghia.com/dau-goi-khi-chay-bo-nhung-dieu-nen-luu-y-som',
    'Cac dau hieu thuong gap, cach giam tai tam thoi va thoi diem nen di kham chuyen khoa.',
    'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=1200&q=80',
    'published',
    '2026-04-09T17:15:00+07:00'
  );

INSERT INTO blog_post_tags (post_id, tag_id) VALUES
  ('90000000-0000-0000-0000-000000000001', 'bbbbbbbb-2222-2222-2222-222222222222'),
  ('90000000-0000-0000-0000-000000000001', 'eeeeeeee-5555-5555-5555-555555555555'),
  ('90000000-0000-0000-0000-000000000002', 'aaaaaaaa-1111-1111-1111-111111111111'),
  ('90000000-0000-0000-0000-000000000002', 'cccccccc-3333-3333-3333-333333333333'),
  ('90000000-0000-0000-0000-000000000003', 'dddddddd-4444-4444-4444-444444444444'),
  ('90000000-0000-0000-0000-000000000004', 'cccccccc-3333-3333-3333-333333333333'),
  ('90000000-0000-0000-0000-000000000004', 'eeeeeeee-5555-5555-5555-555555555555');
