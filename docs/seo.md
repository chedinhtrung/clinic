# SEO Documentation

This document tracks SEO metadata coverage in the Next.js `app` router.

## Global Defaults

- Source: `landingpage/app/layout.tsx`
- `title`: present
- `description`: present
- `icons`: present (`icon`, `shortcut`, `apple`)
- `lang`: `vi` on `<html>`

Notes:
- Any route without page-level metadata inherits the layout defaults.
- No global `openGraph`, `twitter`, `robots`, or `metadataBase` is currently defined in layout metadata.

## Page-by-Page Coverage

### `/` (Home)
- File: `landingpage/app/page.tsx`
- Page-level `metadata`: not defined
- Effective metadata: inherits from layout (`title`, `description`, `icons`)
- Extra SEO: JSON-LD structured data script (`Physician`/`Person`) is included in page content.

### `/blog`
- File: `landingpage/app/blog/page.tsx`
- Page-level `metadata`: defined
- Included:
  - `title`
  - `description`
- Missing on this page:
  - `alternates.canonical`
  - `openGraph`
  - `twitter`
  - `robots`

### `/blog/[slug]`
- File: `landingpage/app/blog/[slug]/page.tsx`
- Page-level `generateMetadata`: defined (dynamic per post)
- Included:
  - `title`
  - `description`
  - `keywords`
  - `alternates.canonical`
  - `openGraph` (`title`, `description`, `url`, `siteName`, `locale`, `type`, `images`)
  - `twitter` (`card`, `title`, `description`, `images`)
- Fallback when post not found:
  - `title` only (`"Bai viet khong ton tai"`)

### `/contact`
- File: `landingpage/app/contact/page.tsx`
- Page-level `metadata`: defined
- Included:
  - `title`
  - `description`
- Missing on this page:
  - `alternates.canonical`
  - `openGraph`
  - `twitter`
  - `robots`

### `/profile`
- File: `landingpage/app/profile/page.tsx`
- Page-level `metadata`: defined
- Included:
  - `title`
  - `description`
- Missing on this page:
  - `alternates.canonical`
  - `openGraph`
  - `twitter`
  - `robots`

### `/injuries`
- File: `landingpage/app/injuries/page.tsx`
- Page-level `metadata`: defined
- Included:
  - `title`
  - `description`
- Missing on this page:
  - `alternates.canonical`
  - `openGraph`
  - `twitter`
  - `robots`

### `/booking`
- File: `landingpage/app/booking/page.tsx`
- Page-level `metadata`: not defined
- Effective metadata: inherits layout defaults

### `/booking/chat`
- File: `landingpage/app/booking/chat/page.tsx`
- Page-level `metadata`: not defined
- Effective metadata: inherits layout defaults

### `/booking/change`
- File: `landingpage/app/booking/change/page.tsx`
- Page-level `metadata`: not defined
- Effective metadata: inherits layout defaults

### `/booking/confirm`
- File: `landingpage/app/booking/confirm/page.tsx`
- Page-level `metadata`: not defined
- Effective metadata: inherits layout defaults

### `/booking-email`
- File: `landingpage/app/booking-email/page.tsx`
- Page-level `metadata`: not defined
- Effective metadata: inherits layout defaults

### `/confirmation`
- File: `landingpage/app/confirmation/page.tsx`
- Page-level `metadata`: not defined
- Effective metadata: inherits layout defaults

### `/payment`
- File: `landingpage/app/payment/page.tsx`
- Page-level `metadata`: not defined
- Effective metadata: inherits layout defaults

### `/payment/result`
- File: `landingpage/app/payment/result/page.tsx`
- Page-level `metadata`: not defined
- Effective metadata: inherits layout defaults

## Quick Summary

- Pages with explicit `title` + `description`: `/blog`, `/blog/[slug]`, `/contact`, `/profile`, `/injuries`
- Pages with full social metadata (`openGraph` + `twitter`): `/blog/[slug]` only
- Pages relying on inherited defaults only: `/`, booking/payment/confirmation flows
