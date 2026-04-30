import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import {
  AUTH_COOKIE_NAME,
  createSessionToken,
  getAdminCredentials,
  getSessionMaxAge,
} from "@/lib/auth";

export async function POST(request: Request) {
  const data = (await request.json().catch(() => ({}))) as {
    username?: string;
    password?: string;
  };
  const { username, password } = getAdminCredentials();

  if (data.username !== username || data.password !== password) {
    return NextResponse.json({ error: "Sai tên đăng nhập hoặc mật khẩu." }, { status: 401 });
  }

  const cookieStore = await cookies();
  cookieStore.set({
    name: AUTH_COOKIE_NAME,
    value: createSessionToken(),
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: getSessionMaxAge(),
  });

  return NextResponse.json({ ok: true });
}

