import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { createServerSupabaseClient } from "./lib/supabase"

export async function middleware(request: NextRequest) {
  // Create a Supabase client configured to use cookies
  const requestUrl = new URL(request.url)
  console.log("Middleware - Processing request for:", requestUrl.pathname)

  // Skip middleware for static assets and API routes
  if (
    requestUrl.pathname.startsWith("/_next") ||
    requestUrl.pathname.startsWith("/api") ||
    requestUrl.pathname.includes(".")
  ) {
    return NextResponse.next()
  }

  const supabase = createServerSupabaseClient()

  try {
    // Check if the user is signed in
    const {
      data: { session },
    } = await supabase.auth.getSession()

    console.log(
      "Middleware - Session check:",
      session ? `User ${session.user.email} is authenticated` : "No session found",
    )

    // IMPORTANT: Only redirect if absolutely necessary to prevent loops

    // If user is signed in and trying to access auth pages, redirect to dashboard
    if (
      session &&
      (requestUrl.pathname === "/login" ||
        requestUrl.pathname === "/signup" ||
        requestUrl.pathname === "/forgot-password")
    ) {
      console.log("Middleware - Authenticated user trying to access auth page, redirecting to dashboard")
      return NextResponse.redirect(new URL("/dashboard", request.url))
    }

    // If user is not signed in and trying to access protected pages, redirect to login
    if (!session && requestUrl.pathname.startsWith("/dashboard")) {
      console.log("Middleware - Unauthenticated user trying to access protected page, redirecting to login")
      return NextResponse.redirect(new URL("/login", request.url))
    }

    console.log("Middleware - Request allowed to proceed")
    return NextResponse.next()
  } catch (error) {
    console.error("Middleware - Error checking session:", error)
    // Only redirect if trying to access protected pages
    if (requestUrl.pathname.startsWith("/dashboard")) {
      console.log("Middleware - Error, redirecting to login")
      return NextResponse.redirect(new URL("/login", request.url))
    }
    return NextResponse.next()
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
