# Admin Authentication

This document explains the lightweight authentication layer for the admin site.

## Goal

The admin frontend now sits behind a shared username and password without
exposing the private Flask admin backend to the public internet.

This design fits the current deployment plan:

- `adminpage` is the public-facing admin website.
- `backend/admin` stays on localhost or a Docker-only network.
- Browsers never call the Flask admin backend directly.

## Architecture

The request flow is:

1. Browser opens `admin.chedinhnghia.com`.
2. The protected app layout checks for a valid admin session cookie.
3. If no valid session exists, the browser is redirected to `/login`.
4. The login form posts credentials to `adminpage/app/api/auth/login/route.ts`.
5. Next.js verifies the submitted username and password against server-side env vars.
6. On success, Next.js sets an `HttpOnly` session cookie.
7. The browser can now access admin pages.
8. Frontend data calls go to same-origin Next routes under `/api/admin/...`.
9. Those Next routes verify the session cookie again and proxy the request to the private Flask admin backend.
10. Flask responds, and Next forwards the response back to the browser.

In short:

- Browser -> Next auth layer -> private Flask admin backend

## Why This Exists

Direct browser access to a private admin API is risky and also does not work
well once the backend is moved behind localhost or an internal Docker network.

This auth layer solves both problems:

- unauthenticated users cannot open the admin UI
- browser code no longer needs the private backend URL
- the backend can remain private to the server environment

## Pieces

### `adminpage/app/(protected)/layout.tsx`

Protects the admin pages on the server. If there is no valid session cookie,
users are redirected to `/login` before the protected UI renders.

### `adminpage/lib/auth.ts`

Contains the admin auth helpers:

- reads the admin credentials from env vars
- signs the session token
- verifies session tokens from cookies
- defines the session lifetime

### `adminpage/app/login/page.tsx`

Simple login form for the shared admin credentials.

### `adminpage/app/api/auth/login/route.ts`

Checks the submitted username and password against server-side env vars and sets
the session cookie on success.

### `adminpage/app/api/auth/logout/route.ts`

Clears the session cookie.

### `adminpage/app/api/admin/[...path]/route.ts`

Acts as a server-side proxy for admin API calls:

- checks the session cookie
- forwards allowed requests to the private Flask backend
- returns the backend response to the browser

### Frontend API helpers

These now call `/api/admin/...` instead of calling Flask directly:

- `adminpage/components/slotApi.ts`
- `adminpage/components/BlogEditor/api.ts`

## Environment Variables

Set these on the `adminpage` deployment:

```env
ADMIN_USERNAME=admin
ADMIN_PASSWORD=choose-a-strong-shared-password
ADMIN_SESSION_SECRET=choose-a-long-random-secret
ADMIN_API_BASE_URL=http://admin-backend:5002
```

Notes:

- `ADMIN_USERNAME` defaults to `admin` if omitted.
- `ADMIN_PASSWORD` is required.
- `ADMIN_SESSION_SECRET` is required and should be long and random.
- `ADMIN_API_BASE_URL` should point to the private Flask admin backend from the
  perspective of the Next.js container or process.

Do not use `NEXT_PUBLIC_` for these values.

## Session Behavior

The login session is stored in a secure cookie:

- `HttpOnly`: frontend JavaScript cannot read it
- `SameSite=Lax`: reduces cross-site abuse
- `Secure` in production: sent only over HTTPS
- lasts for 14 days unless the user logs out earlier

This means the browser stays logged in across refreshes and revisits until the
cookie expires or is cleared.

## Operational Notes

- This is a shared-password system, not a full user-account system.
- Everyone who uses the admin page shares the same login.
- If the password leaks, rotate `ADMIN_PASSWORD`.
- If the session signing secret leaks, rotate `ADMIN_SESSION_SECRET`.
- Because the backend is private, this setup relies on Next.js being the only
  public entry point for admin access.

## Future Upgrade Path

If the admin tool later needs stronger access control, this architecture can
evolve into:

- per-user accounts
- database-backed sessions
- audit logs
- role-based permissions
- two-factor authentication

For the current deployment phase, the shared-password plus secure cookie model
is a good lightweight fit.
