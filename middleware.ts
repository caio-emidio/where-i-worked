import { createServerSupabaseClient } from "./lib/supabase";

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs";

export async function middleware(request: NextRequest) {
  const response = NextResponse.next();
  const supabase = createMiddlewareClient({ req: request, res: response });

  const {
    data: { session },
  } = await supabase.auth.getSession();

  const requestUrl = new URL(request.url);
  const path = requestUrl.pathname;

  if (
    requestUrl.pathname.startsWith("/_next") ||
    requestUrl.pathname.startsWith("/api") ||
    requestUrl.pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  console.log("Middleware path:", path);
  console.log("Session in middleware:", session?.user?.email ?? "No session");

  if (session && path.startsWith("/login")) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  if (!session && path.startsWith("/dashboard")) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return response;
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/login",
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
