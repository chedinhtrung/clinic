import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { proxyAdminRequest } from "@/lib/adminApi";
import { AUTH_COOKIE_NAME, verifySessionToken } from "@/lib/auth";

type RouteContext = {
  params: Promise<{
    path: string[];
  }>;
};

async function handleAdminRequest(request: Request, context: RouteContext) {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;

  if (!verifySessionToken(token)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { path } = await context.params;

  try {
    return await proxyAdminRequest(request, path);
  } catch {
    return NextResponse.json({ error: "Không thể kết nối tới admin backend." }, { status: 502 });
  }
}

export async function GET(request: Request, context: RouteContext) {
  return handleAdminRequest(request, context);
}

export async function POST(request: Request, context: RouteContext) {
  return handleAdminRequest(request, context);
}

export async function PATCH(request: Request, context: RouteContext) {
  return handleAdminRequest(request, context);
}

export async function DELETE(request: Request, context: RouteContext) {
  return handleAdminRequest(request, context);
}
