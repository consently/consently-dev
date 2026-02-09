import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { logger } from '@/lib/logger';

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Protected and Public routes
  const protectedPaths = ['/dashboard', '/setup', '/settings'];
  const publicPaths = ['/', '/pricing', '/login', '/signup', '/guides', '/verify-age'];
  const isProtectedPath = protectedPaths.some((path) => request.nextUrl.pathname.startsWith(path));
  const isPublicPath = publicPaths.some((path) => path === request.nextUrl.pathname || (path !== '/' && request.nextUrl.pathname.startsWith(path)));

  // Skip auth checks for public routes to reduce latency
  if (isPublicPath && !isProtectedPath) {
    return supabaseResponse;
  }

  // Refresh session if expired (only for non-public or explicitly protected routes)
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Redirect to login if accessing protected route without auth
  if (isProtectedPath && !user) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  // Redirect to dashboard if accessing auth pages while logged in
  if ((request.nextUrl.pathname === '/login' || request.nextUrl.pathname === '/signup') && user) {
    const url = request.nextUrl.clone();
    url.pathname = '/dashboard';
    return NextResponse.redirect(url);
  }

  // Log API requests (debug level only)
  if (request.nextUrl.pathname.startsWith('/api/')) {
    logger.debug('API request', {
      method: request.method,
      path: request.nextUrl.pathname,
      query: Object.fromEntries(request.nextUrl.searchParams),
    });
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     * - api routes
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
