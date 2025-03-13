import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export async function middleware(request: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req: request, res })

  // Get session
  const {
    data: { session },
  } = await supabase.auth.getSession()

  // Paths that require authentication
  const authPaths = ["/dashboard", "/events", "/members", "/forums", "/resources", "/admin"]

  // Check if the path requires authentication
  const requiresAuth = authPaths.some((path) => request.nextUrl.pathname.startsWith(path))

  // Admin paths
  const adminPaths = ["/admin"]

  // Check if the path requires admin privileges
  const requiresAdmin = adminPaths.some((path) => request.nextUrl.pathname.startsWith(path))

  // If the path requires authentication and the user is not authenticated
  if (requiresAuth && !session) {
    const url = new URL("/login", request.url)
    url.searchParams.set("callbackUrl", request.nextUrl.pathname)
    return NextResponse.redirect(url)
  }

  // If the path requires admin privileges, check user role
  if (requiresAdmin && session) {
    // Get user role from metadata
    const userRole = session.user.user_metadata.role

    if (userRole !== "admin" && userRole !== "board") {
      return NextResponse.redirect(new URL("/dashboard", request.url))
    }
  }

  // If the user is authenticated and trying to access login or register
  if (session && (request.nextUrl.pathname === "/login" || request.nextUrl.pathname === "/apply")) {
    return NextResponse.redirect(new URL("/dashboard", request.url))
  }

  return res
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/events/:path*",
    "/members/:path*",
    "/forums/:path*",
    "/resources/:path*",
    "/admin/:path*",
    "/login",
    "/apply",
  ],
}

