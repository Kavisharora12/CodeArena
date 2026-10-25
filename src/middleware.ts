import { NextResponse, NextRequest } from 'next/server'
import { FIREBASE_SESSION_COOKIE } from "@/lib/firebaseSessionCookie";

export async function middleware(request: NextRequest) {
  const url = request.nextUrl;
  const hasSessionCookie = Boolean(
    request.cookies.get(FIREBASE_SESSION_COOKIE)?.value,
  );

  if (hasSessionCookie && (url.pathname.startsWith("/sign-in") || url.pathname.startsWith("/sign-up") || url.pathname.startsWith("/verify") || url.pathname.startsWith("/forget-password") || url.pathname === "/")) {
    return NextResponse.redirect(new URL("/problems", request.url))
  }

  if (!hasSessionCookie && (url.pathname.startsWith("/dashboard") || url.pathname.startsWith("/add-problem") || url.pathname.startsWith("/update-problem") || url.pathname.startsWith("/add-solution") || url.pathname.startsWith("/profile") || url.pathname.startsWith("/all-submissions") || url.pathname.startsWith("/submission"))) {
    return NextResponse.redirect(new URL('/sign-in', request.url));
  }


  return NextResponse.next();
}

export const config = {
  matcher: [
    '/sign-in',
    '/sign-up',
    '/',
    '/dashboard/:path*',
    '/verify/:path*',
    '/problems/:path*',
    '/forget-password/:path*',
    '/add-problem/:path*',
    '/add-solution/:path*',
    '/profile/:path*',
    '/all-submissions/:path*',
    '/submission/:path*',
    '/update-problem/:path*'
  ]
}